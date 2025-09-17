import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { showSuccess, showError } from "@/utils/toast";
import { ClientFormSchema, type ClientFormData } from "@/lib/schemas";

// Define las interfaces para Cliente
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string; // Nuevo campo
  cif?: string;     // Nuevo campo
  notes: { id: string; content: string; createdAt: string }[];
  created_at: string;
}

// ClientFormSchema moved to @/lib/schemas to fix Fast Refresh warnings

interface ClientContextType {
  clients: Client[];
  isLoadingClients: boolean;
  addClient: (clientData: ClientFormData) => Promise<void>;
  updateClient: (clientId: string, updatedFields: Partial<Client>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isLoadingSession } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      setIsLoadingClients(false);
      return;
    }

    setIsLoadingClients(true);
    
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      showError("Error al cargar los clientes.");
      setClients([]);
      setIsLoadingClients(false);
      return;
    }

    try {

      const clientsWithNotes = (data as Array<Record<string, unknown>>).map((client) => ({
        ...client,
        notes: Array.isArray(client.notes) ? client.notes : [],
      }));
      
      setClients(clientsWithNotes as Client[]);
    } catch (error) {
      console.error("Error processing clients data:", error);
      showError("Error al procesar los datos de clientes.");
      setClients([]);
    } finally {
      // Always ensure loading is set to false
      setIsLoadingClients(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingSession) {
      fetchClients();
    }
  }, [isLoadingSession, fetchClients]);

  const addClient = useCallback(async (clientData: z.infer<typeof ClientFormSchema>) => {
    if (!user?.id) {
      showError("Debes iniciar sesión para añadir clientes.");
      return;
    }
    
    try {
      const newClient = {
        user_id: user.id, // Use context user ID directly
        name: clientData.name,
        email: clientData.email || null,
        phone: clientData.phone || null,
        company: clientData.company || null,
        address: clientData.address || null,
        cif: clientData.cif || null,
      };
      
      const { data, error } = await supabase
        .from("clients")
        .insert(newClient)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setClients((prev) => [{ ...data, notes: [] } as Client, ...prev]);
      showSuccess("Cliente añadido exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al añadir el cliente: " + errorMessage);
      console.error("Error adding client:", error);
      throw error;
    }
  }, [user]);

  const updateClient = useCallback(async (clientId: string, updatedFields: Partial<Client>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar clientes.");
      return;
    }
    try {
      const { error } = await supabase
        .from("clients")
        .update(updatedFields)
        .eq("id", clientId)
        .eq("user_id", user.id);

      if (error) throw error;

      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId ? { ...client, ...updatedFields } : client
        )
      );
      showSuccess("Cliente actualizado exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al actualizar el cliente: " + errorMessage);
      console.error("Error updating client:", error);
    }
  }, [user, setClients]);

  const deleteClient = useCallback(async (clientId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para eliminar clientes.");
      return;
    }
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId)
        .eq("user_id", user.id);

      if (error) throw error;

      setClients((prev) => prev.filter((client) => client.id !== clientId));
      showSuccess("Cliente eliminado exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al eliminar el cliente: " + errorMessage);
      console.error("Error deleting client:", error);
    }
  }, [user, setClients]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        isLoadingClients,
        addClient,
        updateClient,
        deleteClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    // Defensive fallback to prevent crashes - Log error but don't throw
    console.error("useClientContext called outside ClientProvider - providing fallback");

    // Return safe fallback values
    return {
      clients: [],
      isLoadingClients: true, // Keep loading true to prevent premature renders
      addClient: async () => { console.warn("ClientContext not available"); },
      updateClient: async () => { console.warn("ClientContext not available"); },
      deleteClient: async () => { console.warn("ClientContext not available"); },
    };
  }
  return context;
};