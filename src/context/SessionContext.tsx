import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";

// Define the Profile interface
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // Add profile to context
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (newProfileData: Partial<Profile>) => Promise<void>; // Add updateProfile function
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // State for profile
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // It's possible a profile doesn't exist immediately after signup,
      // or if the user was created before the trigger was set up.
      // We don't want to show an error toast here, just set profile to null.
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setIsLoading(false);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        if (event === "SIGNED_IN") {
          showSuccess("Has iniciado sesión exitosamente.");
          navigate("/dashboard"); // Redirect to dashboard as per user request
        } else if (event === "SIGNED_OUT") {
          showSuccess("Has cerrado sesión.");
          navigate("/login");
        } else if (event === "USER_UPDATED") {
          // If user metadata is updated, refetch profile
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Error al cerrar sesión: " + error.message);
    }
  };

  const updateProfile = async (newProfileData: Partial<Profile>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar tu perfil.");
      return;
    }
    try {
      const { error, data } = await supabase
        .from("profiles")
        .update(newProfileData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...data } : data as Profile));
      showSuccess("Perfil actualizado exitosamente.");
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al actualizar el perfil: " + errorMessage);
      console.error("Error updating profile:", error);
      throw error; // Re-throw to allow form to handle errors
    }
  };

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading, signOut, updateProfile }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    console.error("useSession must be used within a SessionContextProvider");
    
    // Provide emergency fallback instead of throwing
    return {
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      signOut: async () => {
        console.warn('Emergency signOut called - redirecting to login');
        window.location.href = '/login';
      },
      updateProfile: async () => {
        console.warn('Emergency updateProfile called - no action taken');
      }
    };
  }
  
  // Additional safety check to prevent undefined session access
  if (context.session === undefined && !context.isLoading) {
    console.warn('Session is undefined but not loading - this might indicate a race condition');
  }
  
  // Emergency null safety
  const safeContext = {
    session: context.session || null,
    user: context.user || null,
    profile: context.profile || null,
    isLoading: context.isLoading || false,
    signOut: context.signOut || (() => Promise.resolve()),
    updateProfile: context.updateProfile || (() => Promise.resolve())
  };
  
  return safeContext;
};