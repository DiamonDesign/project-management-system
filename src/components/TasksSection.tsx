import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";

interface TasksSectionProps {
  projectId: string;
}

export const TasksSection = ({ projectId }: TasksSectionProps) => {
  const { projects, addTaskToProject, toggleTaskCompletion, deleteTaskFromProject } = useProjectContext();
  const project = projects.find(p => p.id === projectId);
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const handleAddTask = () => {
    if (newTaskDescription.trim()) {
      addTaskToProject(projectId, newTaskDescription.trim());
      setNewTaskDescription("");
      showSuccess("Tarea añadida.");
    } else {
      showError("La descripción de la tarea no puede estar vacía.");
    }
  };

  const handleToggleTask = (taskId: string) => {
    toggleTaskCompletion(projectId, taskId);
    showSuccess("Estado de tarea actualizado.");
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskFromProject(projectId, taskId);
    showSuccess("Tarea eliminada.");
  };

  if (!project) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tareas</CardTitle>
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
        {project.tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay tareas para este proyecto.</p>
        ) : (
          <ScrollArea className="h-48 w-full rounded-md border p-4">
            <ul className="space-y-2">
              {project.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 flex-1">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`cursor-pointer ${task.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.description}
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};