import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Pencil, Save, X } from "lucide-react";
import { useProjectContext, Task } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TasksSectionProps {
  projectId: string;
}

const TaskCard = ({ task, projectId, onEdit, onDelete, onUpdateStatus }: {
  task: Task;
  projectId: string;
  onEdit: (taskId: string, currentDescription: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
}) => {
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


export const TasksSection = ({ projectId }: TasksSectionProps) => {
  const { projects, addTaskToProject, deleteTaskFromProject, updateProject, updateTaskStatus } = useProjectContext();
  const project = projects.find(p => p.id === projectId);
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const handleAddTask = () => {
    if (newTaskDescription.trim()) {
      addTaskToProject(projectId, newTaskDescription.trim());
      setNewTaskDescription("");
    } else {
      showError("La descripción de la tarea no puede estar vacía.");
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskFromProject(projectId, taskId);
  };

  const handleEditTask = (taskId: string, newDescription: string) => {
    if (project) {
      const updatedTasks = project.tasks.map(task =>
        task.id === taskId ? { ...task, description: newDescription } : task
      );
      updateProject(projectId, { tasks: updatedTasks });
      showSuccess("Tarea actualizada.");
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    updateTaskStatus(projectId, taskId, newStatus);
  };

  if (!project) {
    return null;
  }

  const notStartedTasks = project.tasks.filter(task => task.status === 'not-started');
  const inProgressTasks = project.tasks.filter(task => task.status === 'in-progress');
  const completedTasks = project.tasks.filter(task => task.status === 'completed');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gestión de Tareas (Kanban)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Añadir nueva tarea..."
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTask();
              }
            }}
          />
          <Button onClick={handleAddTask}>Añadir</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna "Sin empezar" */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-3 text-gray-700 dark:text-gray-200">Sin empezar ({notStartedTasks.length})</h3>
            <ScrollArea className="h-96 w-full pr-2">
              {notStartedTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay tareas sin empezar.</p>
              ) : (
                <div className="space-y-3">
                  {notStartedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={projectId}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onUpdateStatus={handleUpdateTaskStatus}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Columna "En Progreso" */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-200">En Progreso ({inProgressTasks.length})</h3>
            <ScrollArea className="h-96 w-full pr-2">
              {inProgressTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay tareas en progreso.</p>
              ) : (
                <div className="space-y-3">
                  {inProgressTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={projectId}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onUpdateStatus={handleUpdateTaskStatus}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Columna "Listo" */}
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-3 text-green-700 dark:text-green-200">Listo ({completedTasks.length})</h3>
            <ScrollArea className="h-96 w-full pr-2">
              {completedTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay tareas completadas.</p>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={projectId}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onUpdateStatus={handleUpdateTaskStatus}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};