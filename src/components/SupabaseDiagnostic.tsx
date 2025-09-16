import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { validateSession, withAuth, testAuthContext } from '@/lib/supabase-auth';

interface DiagnosticResults {
  sessionContext?: {
    hasUser: boolean;
    hasSession: boolean;
    isLoading: boolean;
    userId?: string;
  };
  supabaseConnection?: {
    status: 'connected' | 'error';
    url?: string;
    error?: string;
  };
  [key: string]: unknown;
}

export const SupabaseDiagnostic: React.FC = () => {
  const { user, session, isLoading } = useSession();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResults>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = useCallback(async () => {
    setTesting(true);
    const results: DiagnosticResults = {};
    
    try {
      // Test 1: Session Context
      results.sessionContext = {
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id || 'null',
        email: user?.email || 'null',
        isLoading
      };

      // Test 2: Direct Supabase Session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      results.directSession = {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id || 'null',
        email: sessionData.session?.user?.email || 'null',
        expiresAt: sessionData.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'null',
        error: sessionError?.message || 'none'
      };

      // Test 3: Database Connection
      try {
        const { data, error } = await supabase.from('projects').select('count').limit(1);
        results.dbConnection = {
          success: !error,
          error: error?.message || 'none'
        };
      } catch (e) {
        results.dbConnection = {
          success: false,
          error: (e as Error).message
        };
      }

      // Test 4: Auth Context Test (try to query user-specific data)
      if (sessionData.session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('id, name')
            .eq('user_id', sessionData.session.user.id)
            .limit(1);
          
          results.authContext = {
            success: !error,
            canQueryUserData: !error,
            error: error?.message || 'none',
            foundProjects: data?.length || 0
          };
        } catch (e) {
          results.authContext = {
            success: false,
            canQueryUserData: false,
            error: (e as Error).message,
            foundProjects: 0
          };
        }
      } else {
        results.authContext = {
          success: false,
          canQueryUserData: false,
          error: 'No session user',
          foundProjects: 0
        };
      }

      // Test 5: Try creating a test project
      if (sessionData.session?.user?.id) {
        try {
          const testProject = {
            user_id: sessionData.session.user.id,
            name: `Diagnostic Test ${Date.now()}`,
            description: 'Test project for diagnostics',
            status: 'pending'
          };

          const { data, error } = await supabase
            .from('projects')
            .insert(testProject)
            .select()
            .single();

          if (error) {
            results.createTest = {
              success: false,
              error: error.message,
              code: error.code,
              details: error.details
            };
          } else {
            results.createTest = {
              success: true,
              projectId: data.id,
              error: 'none'
            };

            // Clean up test project
            await supabase.from('projects').delete().eq('id', data.id);
          }
        } catch (e) {
          results.createTest = {
            success: false,
            error: (e as Error).message
          };
        }
      } else {
        results.createTest = {
          success: false,
          error: 'No authenticated user'
        };
      }

      // Test 6: Enhanced Auth System Test
      try {
        const enhancedAuthResult = await testAuthContext();
        results.enhancedAuth = {
          success: enhancedAuthResult.success,
          userId: enhancedAuthResult.userId,
          error: enhancedAuthResult.error || 'none'
        };
      } catch (e) {
        results.enhancedAuth = {
          success: false,
          userId: null,
          error: (e as Error).message
        };
      }

      // Test 7: Session validation test
      try {
        const validationResult = await validateSession();
        results.sessionValidation = {
          isAuthenticated: validationResult.isAuthenticated,
          hasUser: !!validationResult.user,
          hasSession: !!validationResult.session,
          userId: validationResult.user?.id || 'null'
        };
      } catch (e) {
        results.sessionValidation = {
          isAuthenticated: false,
          hasUser: false,
          hasSession: false,
          userId: 'null',
          error: (e as Error).message
        };
      }

      // Test 8: Local Storage Check
      results.localStorage = {
        hasSupabaseAuth: !!localStorage.getItem('supabase.auth.token'),
        keys: Object.keys(localStorage).filter(k => k.includes('supabase'))
      };

      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
      setDiagnostics({ error: (error as Error).message });
    } finally {
      setTesting(false);
    }
  }, [user, session, isLoading]);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const getStatus = (success: boolean) => (
    <Badge variant={success ? "default" : "destructive"}>
      {success ? "✅ OK" : "❌ FAIL"}
    </Badge>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supabase Diagnostics
          <Button onClick={runDiagnostics} disabled={testing}>
            {testing ? "Testing..." : "Run Tests"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnostics.sessionContext && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Session Context {getStatus(diagnostics.sessionContext.hasUser)}</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.sessionContext, null, 2)}</pre>
          </div>
        )}

        {diagnostics.directSession && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Direct Session {getStatus(diagnostics.directSession.hasSession)}</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.directSession, null, 2)}</pre>
          </div>
        )}

        {diagnostics.dbConnection && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Database Connection {getStatus(diagnostics.dbConnection.success)}</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.dbConnection, null, 2)}</pre>
          </div>
        )}

        {diagnostics.authContext && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Auth Context {getStatus(diagnostics.authContext.success)}</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.authContext, null, 2)}</pre>
          </div>
        )}

        {diagnostics.createTest && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Create Test {getStatus(diagnostics.createTest.success)}</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.createTest, null, 2)}</pre>
          </div>
        )}

        {diagnostics.enhancedAuth && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Enhanced Auth System {getStatus(diagnostics.enhancedAuth.success)}</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.enhancedAuth, null, 2)}</pre>
          </div>
        )}

        {diagnostics.sessionValidation && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Session Validation {getStatus(diagnostics.sessionValidation.isAuthenticated)}</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.sessionValidation, null, 2)}</pre>
          </div>
        )}

        {diagnostics.localStorage && (
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Local Storage</h3>
            <pre className="text-sm">{JSON.stringify(diagnostics.localStorage, null, 2)}</pre>
          </div>
        )}

        {diagnostics.error && (
          <div className="border border-red-500 p-4 rounded">
            <h3 className="font-semibold mb-2 text-red-600">Error</h3>
            <pre className="text-sm text-red-600">{diagnostics.error}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};