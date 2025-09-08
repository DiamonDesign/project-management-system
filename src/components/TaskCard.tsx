import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Save, X, CalendarIcon } from "lucide-react";
import { Task } from "@/context/ProjectContext";
import { showError } from "@/utils/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
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

  const priorityColor = (p?: Task['priority']) => {
    switch (p) {
      case 'high': return 'text-red-600';
      case 'low': return 'text-green-600';
      case 'medium':
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <Card
      className="mb-3 p-3"
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
    >
      <CardContent className="p-0 flex flex-col gap-2">
        {editing ? (
          <>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="flex-1 font-medium"
              placeholder="Título de la tarea"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full border rounded p-2 text-sm resize-y h-24"
              placeholder="Descripción detallada (opcional)"
            />
            <div className="flex gap-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !editedStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedStartDate ? format(editedStartDate, "PPP", { locale: es }) : <span>Fecha inicio</span>}
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
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !editedEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedEndDate ? format(editedEndDate, "PPP", { locale: es }) : <span>Fecha fin (límite)</span>}
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
            <div className="flex items-center gap-2 mt-2">
              <Select onValueChange={(v) => setEditedPriority(v as Task['priority'])} defaultValue={editedPriority}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className={`flex-1 text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : "font-medium"}`}>
                {task.title}
              </span>
              <span className={`text-xs ${priorityColor(task.priority)}`}>{task.priority?.toUpperCase()}</span>
            </div>
            {task.description && (
              <div className="text-xs text-muted-foreground">
                {task.description}
              </div>
            )}
            {(task.start_date || task.end_date) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                {task.start_date && format(new Date(task.start_date), "PPP", { locale: es })}
                {task.start_date && task.end_date && " - "}
                {task.end_date && format(new Date(task.end_date), "PPP", { locale: es })}
              </div>
            )}
          </>
        )}
        <div className="flex items-center justify-between mt-2">
          <Select onValueChange={handleStatusChange} value={task.status}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-started">Sin empezar</SelectItem>
              <SelectItem value="in-progress">En Progreso</SelectItem>
              <SelectItem value="completed">Listo</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex space-x-1">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleSave} className="text-green-600 hover:bg-green-600/10 p-1 h-auto">
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel} className="text-gray-500 hover:bg-gray-500/10 p-1 h-auto">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-blue-600 hover:bg-blue-600/10 p-1 h-auto">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onDelete(projectId, task.id)} className="text-destructive hover:bg-destructive/10 p-1 h-auto">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};