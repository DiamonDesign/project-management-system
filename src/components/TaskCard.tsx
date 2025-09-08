import React, { useState } from "react";
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
  GripVertical,
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
import { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  projectId: string;
  onEdit: (projectId: string, taskId: string, updatedFields: Partial<Task>) => void;
  onDelete: (projectId: string, taskId: string) => void;
  onUpdateStatus: (projectId: string, taskId: string, newStatus: Task["status"]) => void;
  draggableProps?: DraggableProvidedDraggableProps;
  dragHandleProps?: DraggableProvidedDragHandleProps;
  innerRef?: (element: HTMLElement | null) => void;
}

export const TaskCard = ({ task, projectId, onEdit, onDelete, onUpdateStatus, draggableProps, dragHandleProps, innerRef }: TaskCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || "");
  const [editedStartDate, setEditedStartDate] = useState<Date | undefined>(task.start_date ? new Date(task.start_date) : undefined);
  const [editedEndDate, setEditedEndDate] = useState<Date | undefined>(task.end_date ? new Date(task.end_date) : undefined);
  const [editedPriority, setEditedPriority] = useState<Task['priority']>(task.priority || 'medium');

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
          bg: 'bg-destructive/10 border-destructive/30',
          icon: AlertCircle,
          label: 'Alta'
        };
      case 'low': 
        return { 
          color: 'text-success', 
          bg: 'bg-success/10 border-success/30',
          icon: CheckCircle2,
          label: 'Baja'
        };
      case 'medium':
      default:
        return { 
          color: 'text-warning', 
          bg: 'bg-warning/10 border-warning/30',
          icon: Flag,
          label: 'Media'
        };
    }
  };
  
  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'text-success', 
          bg: 'bg-success/10 border-success/30',
          icon: CheckCircle2,
          label: 'Completada'
        };
      case 'in-progress':
        return { 
          color: 'text-info', 
          bg: 'bg-info/10 border-info/30',
          icon: PlayCircle,
          label: 'En progreso'
        };
      case 'not-started':
      default:
        return { 
          color: 'text-muted-foreground', 
          bg: 'bg-muted/20 border-muted/30',
          icon: Pause,
          label: 'Sin empezar'
        };
    }
  };
  
  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const PriorityIcon = priorityConfig.icon;
  const StatusIcon = statusConfig.icon;
  
  const isOverdue = task.end_date && isBefore(new Date(task.end_date), new Date()) && task.status !== 'completed';
  const isDueSoon = task.end_date && isAfter(new Date(task.end_date), new Date()) && isBefore(new Date(task.end_date), addDays(new Date(), 2));

  return (
    <Card
      className={cn(
        "mb-3 group relative transition-all duration-200 hover:shadow-card-hover animate-fade-in",
        isOverdue && "ring-2 ring-destructive/30 border-destructive/30 bg-destructive/5",
        isDueSoon && "ring-1 ring-warning/30 border-warning/30 bg-warning/5",
        task.status === 'completed' && "opacity-75 bg-success/5"
      )}
      ref={innerRef}
      {...draggableProps}
    >
      <CardContent className="p-4 space-y-3">
        {/* Drag Handle */}
        <div className="flex items-center gap-2">
          <div 
            {...dragHandleProps} 
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Priority Indicator */}
          <div className={cn(
            "w-3 h-3 rounded-full border-2",
            task.priority === 'high' && "bg-destructive border-destructive",
            task.priority === 'medium' && "bg-warning border-warning",
            task.priority === 'low' && "bg-success border-success",
            !task.priority && "bg-muted border-muted"
          )} />
          
          {/* Task Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(projectId, task.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {editing ? (
          <div className="space-y-4">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="font-medium text-base"
              placeholder="Título de la tarea"
              autoFocus
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm resize-y h-24 bg-background focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
              placeholder="Descripción detallada (opcional)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !editedStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedStartDate ? format(editedStartDate, "PPP", { locale: es }) : "Fecha inicio"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editedStartDate}
                    onSelect={setEditedStartDate}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !editedEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedEndDate ? format(editedEndDate, "PPP", { locale: es }) : "Fecha límite"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editedEndDate}
                    onSelect={setEditedEndDate}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-3">
              <Select onValueChange={(v) => setEditedPriority(v as Task['priority'])} defaultValue={editedPriority}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      Baja prioridad
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      Media prioridad
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      Alta prioridad
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1 ml-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSave}
                  className="bg-success/10 hover:bg-success/20 border-success/30 text-success"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  className="hover:bg-muted/50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Task Title and Priority */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-base leading-tight",
                  task.status === "completed" && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              
              {/* Priority Badge */}
              <Badge 
                variant="outline" 
                className={cn(
                  "flex items-center gap-1 text-xs font-medium border-2",
                  priorityConfig.bg,
                  priorityConfig.color
                )}
              >
                <PriorityIcon className="h-3 w-3" />
                {priorityConfig.label}
              </Badge>
            </div>
            
            {/* Dates Section */}
            {(task.start_date || task.end_date) && (
              <div className="flex items-center gap-4 text-sm">
                {task.start_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PlayCircle className="h-3 w-3" />
                    <span>Inicio: {format(new Date(task.start_date), "PPP", { locale: es })}</span>
                  </div>
                )}
                {task.end_date && (
                  <div className={cn(
                    "flex items-center gap-2",
                    isOverdue && "text-destructive font-medium",
                    isDueSoon && "text-warning font-medium",
                    !isOverdue && !isDueSoon && "text-muted-foreground"
                  )}>
                    {isOverdue && <AlertCircle className="h-3 w-3" />}
                    {isDueSoon && <Clock className="h-3 w-3" />}
                    {!isOverdue && !isDueSoon && <CalendarIcon className="h-3 w-3" />}
                    <span>Límite: {format(new Date(task.end_date), "PPP", { locale: es })}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Status and Actions Row */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Select onValueChange={handleStatusChange} value={task.status}>
                <SelectTrigger className="w-[140px] h-8">
                  <StatusIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4 text-muted-foreground" />
                      Sin empezar
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-info" />
                      En progreso
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Completada
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => onDelete(projectId, task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};