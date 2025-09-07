import { useParams, Link } from "react-router-dom";
import { useProjectContext } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { NotesSection } from "@/components/NotesSection";
import { TasksSection } from "@/components/TasksSection";
import { MadeWithDyad } from "@/components/made-with-dyad";

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
  const { projects } = useProjectContext();
  const project = projects.find((p) => p.id === id);

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

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Link to="/projects">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{project.name}</h1>
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <NotesSection projectId={project.id} />
        <TasksSection projectId={project.id} />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ProjectDetail;