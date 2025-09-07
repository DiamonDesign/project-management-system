import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectContext, Task } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import { TaskCard } from "@/components/TaskCard"; // Importar el nuevo componente TaskCard

interface TasksSectionProps {
  projectId: string;
}

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