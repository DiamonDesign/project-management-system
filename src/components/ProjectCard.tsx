import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: string;
    tasks: { completed: boolean }[]; // Añadir tareas para calcular el progreso
  };
}

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

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const completedTasks = project.tasks.filter(task => task.completed).length;
  const totalTasks = project.tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <Card className="w-full max-w-sm hover:shadow-lg transition-shadow h-full flex flex-col">
        <CardHeader className="flex-grow">
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
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
          </div>
          {totalTasks > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progressPercentage} className="w-full" />
              <span className="text-xs text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};