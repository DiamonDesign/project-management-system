import React, { useState, Suspense } from "react";
import { useParams, Link, useNavigate, Navigate } from "react-router-dom";
import { useProjectContext } from "@/context/ProjectContext";
import { useClientContext } from "@/context/ClientContext";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, User, Calendar, Folder, CheckCircle2, Clock, Plus } from "lucide-react";
// Lazy load heavy editor components to reduce bundle size
const NotesSection = React.lazy(() => import("@/components/NotesSection").then(module => ({ default: module.NotesSection })));
const PagesSection = React.lazy(() => import("@/components/PagesSection").then(module => ({ default: module.PagesSection })));
import { TaskBoard } from "@/components/TaskBoard";
import { AddTaskDialog } from "@/components/AddTaskDialog";
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
import { showError } from "@/utils/toast";
import { useSession } from "@/hooks/useSession";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'in-progress':
      return <Clock className="h-4 w-4" />;
    case 'pending':
    default:
      return <Folder className="h-4 w-4" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'in-progress':
      return 'En Progreso';
    case 'pending':
    default:
      return 'Pendiente';
  }
};

const ProjectTasksWrapper = ({ projectId, project }: { projectId: string; project: Project }) => {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // FIXED: Calculate projectTasks within this component scope
  const projectTasks = project.tasks || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Task Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Tareas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Organiza y gestiona las tareas del proyecto con tablero Kanban
            </p>
          </div>
          <Button
            onClick={() => setIsTaskDialogOpen(true)}
            className="h-10 relative flex items-center justify-center pl-9 pr-4 whitespace-nowrap text-sm font-medium"
          >
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
            <span className="text-sm font-medium">Añadir Tarea</span>
          </Button>
        </div>

        <AddTaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          preselectedProjectId={projectId}
        />
      </div>

      {/* Unified TaskBoard Component */}
      <TaskBoard
        tasks={projectTasks}
        projectId={projectId}
        layout="kanban"
        containerClass="max-w-6xl mx-auto"
      />
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateProject, deleteProject } = useProjectContext();
  const { clients, isLoadingClients } = useClientContext();
  const { session, isLoading: isLoadingSession } = useSession();
  const { project, loading: isLoadingProject, error: projectError } = useProjectDetail(id);

  if (isLoadingSession || isLoadingProject || isLoadingClients) {
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

  // Handle project loading error
  if (projectError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Error al cargar el proyecto</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {projectError}
          </p>
          <Link to="/projects">
            <Button>Volver a Proyectos</Button>
          </Link>
        </div>
        <MadeWithDyad />
      </div>
    );
  }

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

  // DEFENSIVE: Ensure tasks array exists (should always be array from useProjectDetail)
  const projectTasks = project.tasks || [];
  const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
  const totalTasks = projectTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // DEFENSIVE: Ensure optional arrays exist
  const projectNotes = project.notes || [];
  const projectPages = project.pages || [];
  const totalNotes = projectNotes.length;
  const hasLegacyNotes = totalNotes > 0;

  // Calculate days until due date
  const getDaysUntilDue = () => {
    if (!project.dueDate) return null;
    const today = new Date();
    const dueDate = new Date(project.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/30">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Navigation */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
          <Link to="/projects">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            <Link to="/projects" className="hover:text-foreground">
              Proyectos
            </Link>
            {" / " + project.name}
          </div>
        </div>
        </div>

        {/* Project Header - Notion Style */}
        <div className="max-w-6xl mx-auto space-y-6 mb-8">
          {/* Main Title Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                {/* Project Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                    {project.description && (
                      <p className="text-muted-foreground text-lg">{project.description}</p>
                    )}
                  </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {/* Status */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Estado
                    </div>
                    <Badge variant={getStatusVariant(project.status)} className="w-fit">
                      {getStatusIcon(project.status)}
                      <span className="ml-2">{getStatusLabel(project.status)}</span>
                    </Badge>
                  </div>

                  {/* Due Date */}
                  {project.dueDate && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Fecha Límite
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(project.dueDate).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {daysUntilDue !== null && (
                          <Badge 
                            variant={daysUntilDue < 0 ? "destructive" : daysUntilDue < 7 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencido` : 
                             daysUntilDue === 0 ? 'Vence hoy' :
                             `${daysUntilDue} días restantes`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Client */}
                  {assignedClient && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Cliente
                      </div>
                      <Link 
                        to={`/clients/${assignedClient.id}`}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                      >
                        <User className="h-4 w-4" />
                        {assignedClient.name}
                      </Link>
                    </div>
                  )}

                  {/* Progress */}
                  {totalTasks > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Progreso
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progressPercentage} className="flex-1 h-2" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {completedTasks} de {totalTasks} tareas completadas
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-start gap-2 shrink-0">
                <EditProjectDialog project={project} onUpdateProject={updateProject} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
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
          </div>
        </div>

        {/* Main Content - Tabbed Layout */}
        <Tabs defaultValue="tasks" className="w-full">
          <div className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Tareas
              </TabsTrigger>
              <TabsTrigger value="documentation" className="flex items-center gap-2">
                📚 Documentación
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks" className="space-y-6">
            <ProjectTasksWrapper projectId={project.id} project={project} />
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>}>
                <PagesSection projectId={project.id} />
              </Suspense>

              {/* Legacy Notes Section - Only show if there are existing notes */}
              {hasLegacyNotes && (
                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      📋 Notas Heredadas
                      <Badge variant="secondary" className="text-xs">
                        Sistema anterior ({totalNotes})
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Estas son notas del sistema anterior. Te recomendamos migrarlas a páginas para mejor organización.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<div className="flex items-center justify-center p-4"><div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full"></div></div>}>
                      <NotesSection projectId={project.id} />
                    </Suspense>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="max-w-6xl mx-auto pt-12">
          <MadeWithDyad />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;