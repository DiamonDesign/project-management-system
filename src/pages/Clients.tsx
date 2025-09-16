import { useState } from "react";
import { ClientCard } from "@/components/ClientCard";
import { AddClientDialog } from "@/components/AddClientDialog";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useClientContext } from "@/context/ClientContext";
import { useSession } from "@/hooks/useSession";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Clients = () => {
  const { clients, isLoadingClients } = useClientContext();
  const { session, isLoading: isLoadingSession } = useSession();
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  if (isLoadingSession || isLoadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando clientes...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Clientes</h1>
        <Button 
          onClick={() => setIsClientDialogOpen(true)}
          className="h-10 relative flex items-center justify-center pl-9 pr-4 whitespace-nowrap text-sm font-medium"
        >
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
          <span className="text-sm font-medium">Crear Cliente</span>
        </Button>
      </div>
      
      <AddClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
      />
      {clients.length === 0 ? (
        <p className="text-center text-muted-foreground">No hay clientes aún. ¡Añade uno para empezar!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
      <MadeWithDyad />
    </div>
  );
};

export default Clients;