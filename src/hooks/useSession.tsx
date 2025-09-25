import { useContext } from "react";
import { SessionContext } from "@/context/SessionContext";

// Custom hook to use SessionContext - moved here to fix Fast Refresh warnings
export const useSession = () => {
  const context = useContext(SessionContext);
  return context;
};