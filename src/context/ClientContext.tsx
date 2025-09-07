import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { showSuccess, showError } from "@/utils/toast";

// Define las interfaces para Cliente
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes: { id: string; content: string; createdAt: string }[];
  created_at: string;
}

// Define el esquema para añadir un nuevo cliente
export const ClientFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre del cliente debe tener al menos 2 caracteres.",
  }),
  email: z.string().email("Formato de email inválido.").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
});

interface ClientContextType {
  clients: Client[];
  isLoadingClients: boolean;
  addClient: (clientData: z.infer<typeof ClientFormSchema>) => Promise<void>;
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
    } else {
      setClients(data as Client[]);
    }
    setIsLoadingClients(false);
  }, [user]);

  useEffect(() => {
    if (!isLoadingSession) {
      fetchClients();
    }
  }, [isLoadingSession, fetchClients]);

  const addClient = async (clientData: z.infer<typeof ClientFormSchema>) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir clientes.");
      return;
    }
    try {
      const newClient: Omit<Client, "id" | "created_at"> = {
        user_id: user.id,
        ...clientData,
        notes: [],
      };
      const { data, error } = await supabase
        .from("clients")
        .insert(newClient)
        .select()
        .single();

      if (error) throw error;

      setClients((prev) => [data as Client, ...prev]);
      showSuccess("Cliente añadido exitosamente.");
    } catch (error: any) {
      showError("Error al añadir el cliente: " + error.message);
      console.error("Error adding client:", error);
    }
  };

  const updateClient = async (clientId: string, updatedFields: Partial<Client>) => {
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
    } catch (error: any) {
      showError("Error al actualizar el cliente: " + error.message);
      console.error("Error updating client:", error);
    }
  };

  const deleteClient = async (clientId: string) => {
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
    } catch (error: any) {
      showError("Error al eliminar el cliente: " + error.message);
      console.error("Error deleting client:", error);
    }
  };

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
    throw new Error("useClientContext must be used within a ClientProvider");
  }
  return context;
};