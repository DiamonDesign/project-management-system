import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: string;
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
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
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
  );
};