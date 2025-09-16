import { useContext } from "react";
import { SessionContext } from "@/context/SessionContext";

// Custom hook to use SessionContext - moved here to fix Fast Refresh warnings
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    // Emergency fallback to prevent crashes
    console.error('[SessionContext] useSession called outside of SessionContextProvider');
    return {
      session: null,
      user: null,
      isLoading: false,
      isSigningOut: false,
      signOut: async () => { window.location.href = '/login'; },
      signIn: async () => { throw new Error('Session context not available'); },
      hasPermission: () => false,
      hasRole: () => false,
      displayName: '',
      initials: '',
    };
  }
  return context;
};