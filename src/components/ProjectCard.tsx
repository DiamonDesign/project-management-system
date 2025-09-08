import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/loading";
import { Task } from "@/context/ProjectContext";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle,
  MoreVertical,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: string;
    tasks: Task[]; // Usar la interfaz Task actualizada
  };
}

const getStatusVariant = (status: string, dueDate?: string) => {
  const isOverdue = dueDate && isBefore(new Date(dueDate), new Date());
  const isDueSoon = dueDate && isAfter(new Date(dueDate), new Date()) && isBefore(new Date(dueDate), addDays(new Date(), 3));
  
  switch (status) {
    case 'completed':
      return { variant: 'default' as const, icon: CheckCircle2, color: 'text-success' };
    case 'in-progress':
      if (isOverdue) return { variant: 'destructive' as const, icon: AlertCircle, color: 'text-destructive' };
      if (isDueSoon) return { variant: 'warning' as const, icon: Clock, color: 'text-warning' };
      return { variant: 'secondary' as const, icon: PlayCircle, color: 'text-info' };
    case 'pending':
    default:
      if (isOverdue) return { variant: 'destructive' as const, icon: AlertCircle, color: 'text-destructive' };
      return { variant: 'outline' as const, icon: Clock, color: 'text-muted-foreground' };
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Completado';
    case 'in-progress': return 'En Progreso';
    case 'pending': return 'Pendiente';
    default: return status;
  }
};

const ProjectCardComponent = ({ project }: ProjectCardProps) => {
  const completedTasks = React.useMemo(
    () => project.tasks.filter(task => task.status === 'completed').length,
    [project.tasks]
  );
  
  const totalTasks = project.tasks.length;
  const progressPercentage = React.useMemo(
    () => totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    [completedTasks, totalTasks]
  );

  const statusInfo = React.useMemo(() => getStatusVariant(project.status, project.dueDate), [project.status, project.dueDate]);
  const StatusIcon = statusInfo.icon;
  
  const isOverdue = project.dueDate && isBefore(new Date(project.dueDate), new Date());
  const isDueSoon = project.dueDate && isAfter(new Date(project.dueDate), new Date()) && isBefore(new Date(project.dueDate), addDays(new Date(), 3));
  
  const formattedDueDate = project.dueDate ? format(new Date(project.dueDate), "PPP", { locale: es }) : null;

  return (
    <Card 
      hover 
      interactive
      className={cn(
        "w-full max-w-sm h-full flex flex-col group animate-fade-in",
        "hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300",
        isOverdue && "ring-2 ring-destructive/20 border-destructive/30",
        isDueSoon && "ring-2 ring-warning/20 border-warning/30"
      )}
    >
      <CardHeader compact className="flex-grow relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-2">
              {project.description}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Add project actions menu (edit, delete, etc.)
              console.log('Project actions for:', project.name);
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Status Badge with Icon */}
        <div className="flex items-center gap-2 mt-3">
          <Badge 
            variant={statusInfo.variant as any} 
            className="flex items-center gap-1 text-xs font-medium"
          >
            <StatusIcon className="h-3 w-3" />
            {getStatusLabel(project.status)}
          </Badge>
          
          {project.dueDate && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue && "text-destructive font-medium",
              isDueSoon && "text-warning font-medium",
              !isOverdue && !isDueSoon && "text-muted-foreground"
            )}>
              <Calendar className="h-3 w-3" />
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent compact className="space-y-3">
        {/* Progress Section */}
        {totalTasks > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {completedTasks} de {totalTasks} tareas
              </span>
              <span className="font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <ProgressBar 
              value={progressPercentage} 
              variant={project.status === 'completed' ? 'success' : 'default'}
              className="h-2"
            />
          </div>
        )}
        
        {/* Action Button */}
        <Link to={`/projects/${project.id}`} className="block">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-between group-hover:bg-accent/50 transition-all",
              "group-hover:text-accent-foreground"
            )}
          >
            <span>Ver proyecto</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Card>
  );
};

// Memoized export for performance with enhanced comparison
export const ProjectCard = React.memo(ProjectCardComponent, (prevProps, nextProps) => {
  const prevProject = prevProps.project;
  const nextProject = nextProps.project;
  
  // Deep comparison for better accuracy
  return (
    prevProject.id === nextProject.id &&
    prevProject.name === nextProject.name &&
    prevProject.description === nextProject.description &&
    prevProject.status === nextProject.status &&
    prevProject.dueDate === nextProject.dueDate &&
    prevProject.tasks.length === nextProject.tasks.length &&
    prevProject.tasks.every((task, index) => {
      const nextTask = nextProject.tasks[index];
      return nextTask && 
        task.id === nextTask.id &&
        task.status === nextTask.status &&
        task.title === nextTask.title;
    })
  );
});