import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Save, X } from "lucide-react";
import { Task } from "@/context/ProjectContext";
import { showError } from "@/utils/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskCardProps {
  task: Task;
  projectId: string;
  onEdit: (taskId: string, newDescription: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
}

export const TaskCard = ({ task, projectId, onEdit, onDelete, onUpdateStatus }: TaskCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description);

  const handleSave = () => {
    if (editedDescription.trim()) {
      onEdit(task.id, editedDescription.trim());
      setEditing(false);
    } else {
      showError("La descripción de la tarea no puede estar vacía.");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedDescription(task.description);
  };

  return (
    <Card className="mb-3 p-3">
      <CardContent className="p-0 flex flex-col gap-2">
        {editing ? (
          <Input
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            className="flex-1"
          />
        ) : (
          <span className={`flex-1 text-sm ${task.status === 'completed' ? "line-through text-muted-foreground" : ""}`}>
            {task.description}
          </span>
        )}
        <div className="flex items-center justify-between mt-2">
          <Select onValueChange={(value: Task['status']) => onUpdateStatus(task.id, value)} value={task.status}>
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
            <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} className="text-destructive hover:bg-destructive/10 p-1 h-auto">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Card>
  );
};