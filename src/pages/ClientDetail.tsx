import { useParams, Link, useNavigate, Navigate } from "react-router-dom";
import { useClientContext } from "@/context/ClientContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Mail, Phone, Building, MapPin, Landmark } from "lucide-react"; // Importar nuevos iconos
import { MadeWithDyad } from "@/components/made-with-dyad";
import { EditClientDialog } from "@/components/EditClientDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showError } from "@/utils/toast";
import { useSession } from "@/context/SessionContext";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, deleteClient, isLoadingClients } = useClientContext();
  const { session, isLoading: isLoadingSession } = useSession();
  const client = clients.find((c) => c.id === id);

  if (isLoadingSession || isLoadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando detalles del cliente...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleDeleteClient = async () => {
    if (client) {
      await deleteClient(client.id);
      navigate("/clients");
    } else {
      showError("Error al eliminar el cliente.");
    }
  };

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Cliente no encontrado</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            El cliente que buscas no existe.
          </p>
          <Link to="/clients">
            <Button>Volver a Clientes</Button>
          </Link>
        </div>
        <MadeWithDyad />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/clients">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{client.name}</h1>
        </div>
        <div className="flex space-x-2">
          <EditClientDialog client={client} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente tu cliente
                  y removerá sus datos de nuestros servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
          {client.company && <CardDescription className="flex items-center gap-1"><Building className="h-4 w-4 text-muted-foreground" /> {client.company}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" /> {client.phone}
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {client.address}
            </div>
          )}
          {client.cif && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Landmark className="h-4 w-4" /> {client.cif}
            </div>
          )}
          {client.notes && client.notes.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Notas:</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {client.notes.map((note) => (
                  <li key={note.id}>{note.content}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default ClientDetail;