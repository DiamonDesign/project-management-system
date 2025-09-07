import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectContext, Task } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import { TaskCard } from "@/components/TaskCard";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return; // No change in position or column
    }

    const taskId = draggableId;
    const newStatus = destination.droppableId as Task['status'];

    // Update the task status in the context
    handleUpdateTaskStatus(taskId, newStatus);
  };

  if (!project) {
    return null;
  }

  const notStartedTasks = project.tasks.filter(task => task.status === 'not-started');
  const inProgressTasks = project.tasks.filter(task => task.status === 'in-progress');
  const completedTasks = project.tasks.filter(task => task.status === 'completed');

  const getTasksForStatus = (status: Task['status']) => {
    switch (status) {
      case 'not-started': return notStartedTasks;
      case 'in-progress': return inProgressTasks;
      case 'completed': return completedTasks;
      default: return [];
    }
  };

  const renderColumn = (status: Task['status'], title: string, tasks: Task[], bgColor: string, textColor: string) => (
    <Droppable droppableId={status}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${bgColor} p-4 rounded-lg shadow-sm flex flex-col`}
        >
          <h3 className={`font-semibold text-lg mb-3 ${textColor}`}>{title} ({tasks.length})</h3>
          <ScrollArea className="h-96 w-full pr-2 flex-grow">
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay tareas {title.toLowerCase().replace('sin empezar', 'sin empezar')}.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(providedDraggable) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        projectId={projectId}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onUpdateStatus={handleUpdateTaskStatus}
                        draggableProps={providedDraggable.draggableProps}
                        dragHandleProps={providedDraggable.dragHandleProps}
                        innerRef={providedDraggable.innerRef}
                      />
                    )}
                  </Draggable>
                ))}
              </div>
            )}
            {provided.placeholder}
          </ScrollArea>
        </div>
      )}
    </Droppable>
  );

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
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderColumn('not-started', 'Sin empezar', notStartedTasks, 'bg-gray-50 dark:bg-gray-800', 'text-gray-700 dark:text-gray-200')}
            {renderColumn('in-progress', 'En Progreso', inProgressTasks, 'bg-blue-50 dark:bg-blue-950', 'text-blue-700 dark:text-blue-200')}
            {renderColumn('completed', 'Listo', completedTasks, 'bg-green-50 dark:bg-green-950', 'text-green-700 dark:text-green-200')}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
};