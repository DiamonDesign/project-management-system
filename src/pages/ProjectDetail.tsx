import { useParams, Link, useNavigate, Navigate } from "react-router-dom";
import { useProjectContext, Task } from "@/context/ProjectContext"; // Importar Task
import { useClientContext } from "@/context/ClientContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, User } from "lucide-react";
import { NotesSection } from "@/components/NotesSection";
import { TasksSection } from "@/components/TasksSection";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { EditProjectDialog } from "@/components/EditProjectDialog";
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
import { Progress } from "@/components/ui/progress";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/context/SessionContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Nuevas importaciones

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in-progress':
      return 'secondary';
    case 'pending':
    default:
      return 'outline';
  }
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject, isLoadingProjects } = useProjectContext();
  const { clients, isLoadingClients } = useClientContext();
  const { session, isLoading: isLoadingSession } = useSession();
  const project = projects.find((p) => p.id === id);

  if (isLoadingSession || isLoadingProjects || isLoadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando detalles del proyecto...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleDeleteProject = async () => {
    if (project) {
      await deleteProject(project.id);
      navigate("/projects");
    } else {
      showError("Error al eliminar el proyecto.");
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Proyecto no encontrado</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            El proyecto que buscas no existe.
          </p>
          <Link to="/projects">
            <Button>Volver a Proyectos</Button>
          </Link>
        </div>
        <MadeWithDyad />
      </div>
    );
  }

  const assignedClient = project.client_id ? clients.find(c => c.id === project.client_id) : null;

  const completedTasks = project.tasks.filter(task => task.status === 'completed').length; // Usar el nuevo campo 'status'
  const totalTasks = project.tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/projects">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>
        <div className="flex space-x-2">
          <EditProjectDialog project={project} onUpdateProject={updateProject} />
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
                  Esta acción no se puede deshacer. Esto eliminará permanentemente tu proyecto
                  y removerá sus datos de nuestros servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Badge variant={getStatusVariant(project.status)}>
            {project.status === 'pending' && 'Pendiente'}
            {project.status === 'in-progress' && 'En Progreso'}
            {project.status === 'completed' && 'Completado'}
          </Badge>
          {project.dueDate && (
            <span className="text-sm text-muted-foreground">
              Fecha límite: {project.dueDate}
            </span>
          )}
          {assignedClient && (
            <Link to={`/clients/${assignedClient.id}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <User className="h-4 w-4" /> Cliente: {assignedClient.name}
            </Link>
          )}
          {totalTasks > 0 && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Progress value={progressPercentage} className="w-[150px]" />
              <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}% completado</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="w-full"> {/* Por defecto, la pestaña de tareas */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
        </TabsList>
        <TabsContent value="notes">
          <NotesSection projectId={project.id} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksSection projectId={project.id} />
        </TabsContent>
      </Tabs>
      <MadeWithDyad />
    </div>
  );
};

export default ProjectDetail;