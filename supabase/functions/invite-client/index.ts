import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, clientEmail } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the inviting user's ID (freelancer)
    const { data: { user: invitingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !invitingUser) {
      console.error('Error getting inviting user:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if a client with this email already exists in auth.users
    let clientAuthUser: { id: string; email?: string } | undefined;
    let temporaryPassword: string | undefined;
    const { data: existingUsers, error: fetchUserError } = await supabaseAdmin.auth.admin.listUsers({
      email: clientEmail,
    });

    if (fetchUserError) {
      console.error('Error listing users:', fetchUserError);
      return new Response(JSON.stringify({ error: 'Error checking existing user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingUsers && existingUsers.users.length > 0) {
      clientAuthUser = existingUsers.users[0];
      console.log(`User with email ${clientEmail} already exists: ${clientAuthUser.id}`);
    } else {
      // Create a new user for the client portal
      temporaryPassword = uuidv4().substring(0, 12); // Generate a temporary password
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: clientEmail,
        password: temporaryPassword,
        email_confirm: true, // Automatically confirm email for client portal users
        user_metadata: {
          is_client_portal_user: true,
          invited_by: invitingUser.id,
          client_id: clientId,
        },
      });

      if (createUserError) {
        console.error('Error creating client user:', createUserError);
        return new Response(JSON.stringify({ error: 'Error creating client user: ' + createUserError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      clientAuthUser = newUser.user;
      console.log(`New client user created: ${clientAuthUser?.id}`);
    }

    if (!clientAuthUser) {
      return new Response(JSON.stringify({ error: 'Failed to create or retrieve client user.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if client_portal_users entry already exists
    const { data: existingPortalEntry, error: fetchPortalEntryError } = await supabaseAdmin
      .from('client_portal_users')
      .select('id')
      .eq('user_id', clientAuthUser.id)
      .eq('client_id', clientId)
      .single();

    if (fetchPortalEntryError && fetchPortalEntryError.code !== 'PGRST116') { // PGRST116 means "no rows found"
      console.error('Error checking existing portal entry:', fetchPortalEntryError);
      return new Response(JSON.stringify({ error: 'Error checking existing portal entry' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inviteToken = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

    if (!existingPortalEntry) {
      // Link the new user to the client in client_portal_users table
      const { error: linkError } = await supabaseAdmin
        .from('client_portal_users')
        .insert({
          user_id: clientAuthUser.id,
          client_id: clientId,
          invited_by_user_id: invitingUser.id,
          invite_token: inviteToken,
          token_expires_at: tokenExpiresAt,
        });

      if (linkError) {
        console.error('Error linking client user to client:', linkError);
        return new Response(JSON.stringify({ error: 'Error linking client user to client: ' + linkError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // If entry exists, update the invite token and expiry
      const { error: updateTokenError } = await supabaseAdmin
        .from('client_portal_users')
        .update({
          invite_token: inviteToken,
          token_expires_at: tokenExpiresAt,
        })
        .eq('user_id', clientAuthUser.id)
        .eq('client_id', clientId);

      if (updateTokenError) {
        console.error('Error updating invite token:', updateTokenError);
        return new Response(JSON.stringify({ error: 'Error updating invite token: ' + updateTokenError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Construct the invitation link
    const portalUrl = `${Deno.env.get('VITE_APP_URL')}/client-portal/invite?token=${inviteToken}`;

    // In a real application, you would send an email here.
    // For now, we'll return the link and temporary password.
    console.log('Client Portal Invitation Link:', portalUrl);
    console.log('Temporary Password (if new user):', existingUsers?.users.length === 0 ? temporaryPassword : 'N/A');

    return new Response(JSON.stringify({
      message: 'Client invited successfully',
      portalUrl,
      temporaryPassword: existingUsers?.users.length === 0 ? temporaryPassword : undefined,
      clientUserId: clientAuthUser.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});