import React, { useState } from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Pencil,
  Save,
  X,
  CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Pause,
  Flag,
  MoreHorizontal
} from "lucide-react";
import { Task } from "@/context/ProjectContext";
import { showError } from "@/utils/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  projectId: string;
  onEdit: (projectId: string, taskId: string, updatedFields: Partial<Task>) => void;
  onDelete: (projectId: string, taskId: string) => void;
  onUpdateStatus: (projectId: string, taskId: string, newStatus: Task["status"]) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export const TaskCard = ({
  task,
  projectId,
  onEdit,
  onDelete,
  onUpdateStatus,
  isDragging: isDraggingProp,
  isOverlay = false
}: TaskCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || "");
  const [editedStartDate, setEditedStartDate] = useState<Date | undefined>(task.start_date ? new Date(task.start_date) : undefined);
  const [editedEndDate, setEditedEndDate] = useState<Date | undefined>(task.end_date ? new Date(task.end_date) : undefined);
  const [editedPriority, setEditedPriority] = useState<Task['priority']>(task.priority || 'medium');

  // Use dnd-kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    disabled: editing || isOverlay,
  });

  const isDragging = isDraggingProp || isSortableDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editedTitle.trim()) {
      onEdit(
        projectId,
        task.id,
        {
          title: editedTitle.trim(),
          description: editedDescription.trim(),
          start_date: editedStartDate ? format(editedStartDate, "yyyy-MM-dd") : undefined,
          end_date: editedEndDate ? format(editedEndDate, "yyyy-MM-dd") : undefined,
          priority: editedPriority,
        }
      );
      setEditing(false);
    } else {
      showError("El nombre de la tarea no puede estar vacío.");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedTitle(task.title);
    setEditedDescription(task.description || "");
    setEditedStartDate(task.start_date ? new Date(task.start_date) : undefined);
    setEditedEndDate(task.end_date ? new Date(task.end_date) : undefined);
    setEditedPriority(task.priority || 'medium');
  };

  const handleStatusChange = (value: Task["status"]) => {
    onUpdateStatus(projectId, task.id, value);
  };

  const getPriorityConfig = (p?: Task['priority']) => {
    switch (p) {
      case 'high':
        return {
          color: 'text-destructive',
          bg: 'bg-destructive/15 border-destructive/50',
          icon: AlertCircle,
          label: 'Alta',
          dotClass: 'bg-destructive border-destructive shadow-destructive/30'
        };
      case 'low':
        return {
          color: 'text-success',
          bg: 'bg-success/15 border-success/50',
          icon: CheckCircle2,
          label: 'Baja',
          dotClass: 'bg-success border-success shadow-success/30'
        };
      case 'medium':
      default:
        return {
          color: 'text-warning',
          bg: 'bg-warning/15 border-warning/50',
          icon: Flag,
          label: 'Media',
          dotClass: 'bg-warning border-warning shadow-warning/30'
        };
    }
  };

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return {
          color: 'text-success',
          bg: 'bg-success/15 border-success/50',
          icon: CheckCircle2,
          label: 'Completada',
          badgeClass: 'bg-success/20 text-success border-success/60'
        };
      case 'in-progress':
        return {
          color: 'text-info',
          bg: 'bg-info/15 border-info/50',
          icon: PlayCircle,
          label: 'En progreso',
          badgeClass: 'bg-info/20 text-info border-info/60'
        };
      case 'not-started':
      default:
        return {
          color: 'text-muted-foreground',
          bg: 'bg-muted/30 border-muted/50',
          icon: Pause,
          label: 'Sin empezar',
          badgeClass: 'bg-muted/30 text-muted-foreground border-muted/60'
        };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  const isOverdue = task.end_date && isBefore(new Date(task.end_date), new Date()) && task.status !== 'completed';
  const isDueSoon = task.end_date && isAfter(new Date(task.end_date), new Date()) && isBefore(new Date(task.end_date), addDays(new Date(), 2));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card shadow-sm rounded-lg overflow-hidden transition-all duration-200",
        "border cursor-grab active:cursor-grabbing",
        !isDragging && "hover:shadow-lg hover:border-primary/30",
        isDragging && "shadow-xl border-primary ring-2 ring-primary/30 opacity-75",
        task.priority === 'high' && "border-l-4 border-l-red-500",
        task.priority === 'medium' && "border-l-4 border-l-yellow-500",
        task.priority === 'low' && "border-l-4 border-l-green-500",
        !isDragging && isOverdue && "ring-1 ring-red-200 bg-red-50/50 dark:bg-red-950/20",
        !isDragging && isDueSoon && "ring-1 ring-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20",
        !isDragging && task.status === 'completed' && "opacity-75 bg-green-50/50 dark:bg-green-950/20",
        isOverlay && "rotate-2 scale-105 z-50 shadow-2xl ring-4 ring-primary/20"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0 mt-2",
                  task.priority === 'high' && "bg-red-500",
                  task.priority === 'medium' && "bg-yellow-500",
                  task.priority === 'low' && "bg-green-500",
                  !task.priority && "bg-gray-300"
                )}
                title={`Prioridad ${priorityConfig.label.toLowerCase()}`}
              />

              <h3
                className={cn(
                  "font-semibold text-base leading-snug flex-1",
                  task.status === "completed" && "line-through text-muted-foreground",
                  task.status !== "completed" && "text-foreground"
                )}
              >
                {task.title}
              </h3>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {task.end_date && (
              <div className={cn(
                "inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full",
                isOverdue && "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30",
                isDueSoon && "text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30",
                !isOverdue && !isDueSoon && "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800"
              )}>
                {isOverdue ? (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    <span className="font-medium">Vencida</span>
                  </>
                ) : isDueSoon ? (
                  <>
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">Próxima</span>
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(new Date(task.end_date), "dd MMM", { locale: es })}</span>
                  </>
                )}
              </div>
            )}

            {/* Disable interactions during drag to prevent positioning issues */}
            <Select
              onValueChange={handleStatusChange}
              value={task.status}
              disabled={isDragging}
            >
              <SelectTrigger className={cn(
                "h-9 text-sm",
                isDragging && "pointer-events-none"
              )}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">
                  <div className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    <span>Sin empezar</span>
                  </div>
                </SelectItem>
                <SelectItem value="in-progress">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    <span>En progreso</span>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completada</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 flex-shrink-0",
                  !isDragging && "opacity-0 group-hover:opacity-100 transition-opacity",
                  isDragging && "pointer-events-none opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
                disabled={isDragging}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="cursor-pointer relative pl-9 pr-3"
              >
                <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                <span>Editar tarea</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(projectId, task.id);
                }}
                className="cursor-pointer text-red-600 focus:text-red-600 relative pl-9 pr-3"
              >
                <Trash2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {editing && (
          <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="font-medium h-10"
              placeholder="Título de la tarea"
              autoFocus
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full border rounded-md p-3 text-sm resize-y h-20 bg-background"
              placeholder="Descripción (opcional)"
            />
            <div className="flex items-center justify-between gap-3">
              <Select onValueChange={(v) => setEditedPriority(v as Task['priority'])} value={editedPriority}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Baja</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>Media</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Alta</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="h-9 relative pl-9 pr-3"
                >
                  <X className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                  <span>Cancelar</span>
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="h-9 relative pl-9 pr-3 bg-green-600 hover:bg-green-700"
                >
                  <Save className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                  <span>Guardar</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};