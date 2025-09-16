import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlignedButton } from "@/components/ui/aligned-button";
import { ProgressBar } from "@/components/ui/loading";
import { SwipeableCard } from "@/components/SwipeableCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task } from "@/context/ProjectContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { PROJECT_TYPE_CONFIG, ProjectType } from "@/types";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  MoreVertical,
  ArrowRight,
  Edit3,
  Trash2,
  Eye,
  Settings,
  Archive
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
    project_type?: ProjectType;
    dueDate?: string;
    tasks: Task[]; // Usar la interfaz Task actualizada
    archived?: boolean;
  };
  variant?: 'card' | 'list';
  onEdit?: (project: ProjectCardProps['project']) => void;
  onDelete?: (project: ProjectCardProps['project']) => void;
  onView?: (project: ProjectCardProps['project']) => void;
  onArchive?: (project: ProjectCardProps['project']) => void;
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

const ProjectCardComponent = ({ project, variant = 'card', onEdit, onDelete, onView, onArchive }: ProjectCardProps) => {
  const isMobile = useIsMobile();
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

  // Define swipe actions for mobile
  const swipeActions = isMobile ? {
    leftActions: [
      {
        id: 'view',
        label: 'Ver',
        icon: <Eye className="h-4 w-4" />,
        color: 'info' as const,
        action: () => onView?.(project)
      }
    ],
    rightActions: [
      {
        id: 'edit',
        label: 'Editar',
        icon: <Edit3 className="h-4 w-4" />,
        color: 'warning' as const,
        action: () => onEdit?.(project)
      },
      {
        id: 'archive',
        label: 'Archivar',
        icon: <Archive className="h-4 w-4" />,
        color: 'secondary' as const,
        action: () => onArchive?.(project)
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: <Trash2 className="h-4 w-4" />,
        color: 'destructive' as const,
        action: () => onDelete?.(project)
      }
    ]
  } : { leftActions: [], rightActions: [] };

  // Render different layouts based on variant
  if (variant === 'list') {
    return (
      <div className={cn(
        "group border-b border-border hover:bg-muted/30 transition-all duration-200 cursor-pointer",
        isOverdue && "bg-destructive/5 border-destructive/20",
        isDueSoon && "bg-warning/5 border-warning/20"
      )}>
        <Link to={`/projects/${project.id}`} className="block">
          <div className="px-4 py-3">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Project Name and Description */}
              <div className="col-span-4 min-w-0">
                <h3 className="font-medium text-base truncate group-hover:text-primary transition-colors mb-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Type Badge */}
              <div className="col-span-1 flex justify-center">
                {project.project_type && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1 text-xs border-0 whitespace-nowrap",
                      PROJECT_TYPE_CONFIG[project.project_type]?.color || "bg-gray-50 text-gray-800"
                    )}
                  >
                    <span>{PROJECT_TYPE_CONFIG[project.project_type]?.icon}</span>
                    {PROJECT_TYPE_CONFIG[project.project_type]?.name}
                  </Badge>
                )}
              </div>

              {/* Status Badge */}
              <div className="col-span-1 flex justify-center">
                <Badge
                  variant={statusInfo.variant as "default" | "secondary" | "destructive" | "outline"}
                  className="flex items-center gap-1 text-xs whitespace-nowrap"
                >
                  <StatusIcon className="h-3 w-3" />
                  {getStatusLabel(project.status)}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="col-span-3 hidden sm:flex justify-center">
                {totalTasks > 0 && (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">{completedTasks}/{totalTasks}</span>
                    </div>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          project.status === 'completed' ? "bg-green-500" : "bg-primary"
                        )}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground min-w-0">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="col-span-2 hidden md:flex justify-center">
                {project.dueDate && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded whitespace-nowrap",
                    isOverdue && "text-destructive bg-destructive/10",
                    isDueSoon && "text-warning bg-warning/10",
                    !isOverdue && !isDueSoon && "text-muted-foreground bg-muted/50"
                  )}>
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(project.dueDate), 'dd/MM/yy', { locale: es })}</span>
                  </div>
                )}
              </div>

              {/* Actions Menu */}
              <div className="col-span-1 flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(project); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver proyecto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onArchive?.(project); }}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archivar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete?.(project); }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  const cardContent = (
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(project); }}>
                <Eye className="h-4 w-4 mr-2" />
                Ver proyecto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onArchive?.(project); }}
                className="text-orange-600 hover:text-orange-700"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archivar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete?.(project); }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Status Badge with Icon */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge 
            variant={statusInfo.variant as "default" | "secondary" | "destructive" | "outline"} 
            className="flex items-center gap-1 text-xs font-medium"
          >
            <StatusIcon className="h-3 w-3" />
            {getStatusLabel(project.status)}
          </Badge>
          
          {project.project_type && (
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1 text-xs font-medium border-0",
                PROJECT_TYPE_CONFIG[project.project_type]?.color || "bg-gray-50 text-gray-800"
              )}
            >
              <span>{PROJECT_TYPE_CONFIG[project.project_type]?.icon}</span>
              {PROJECT_TYPE_CONFIG[project.project_type]?.name}
            </Badge>
          )}
          
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
              // Dimensiones y posición relativa para absolutos
              "w-full h-10 relative",
              // Layout y padding compensado para flecha absoluta
              "flex items-center justify-between pl-3 pr-8 whitespace-nowrap",
              // Estilos hover
              "group-hover:bg-accent/50 transition-all group-hover:text-accent-foreground",
              // Tipografía
              "text-sm font-medium"
            )}
          >
            {/* Texto alineado a la izquierda */}
            <span className="text-sm font-medium">Ver proyecto</span>
            
            {/* Flecha absoluta alineada a la derecha */}
            <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Card>
  );

  // Wrap with SwipeableCard on mobile, return regular card on desktop
  return isMobile ? (
    <SwipeableCard
      leftActions={swipeActions.leftActions}
      rightActions={swipeActions.rightActions}
      className="w-full max-w-sm"
    >
      {cardContent}
    </SwipeableCard>
  ) : (
    cardContent
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
    prevProject.project_type === nextProject.project_type &&
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