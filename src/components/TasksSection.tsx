import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectContext, Task } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import { TaskCard } from "@/components/TaskCard";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Textarea } from '@/components/ui/textarea';

interface TasksSectionProps {
  projectId: string;
}

export const TasksSection = ({ projectId }: TasksSectionProps) => {
  const { projects, addTaskToProject, deleteTaskFromProject, updateProject, updateTaskStatus, updateTask } = useProjectContext();
  const project = projects.find(p => p.id === projectId);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTaskToProject(projectId, newTaskTitle.trim(), newTaskDescription.trim());
      setNewTaskTitle("");
      setNewTaskDescription("");
    } else {
      showError("El título de la tarea no puede estar vacío.");
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskFromProject(projectId, taskId);
  };

  const handleEditTask = (taskId: string, updatedFields: Partial<Task>) => {
    updateTask(projectId, taskId, updatedFields);
    showSuccess("Tarea actualizada.");
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
              <p className="text-muted-foreground text-sm">No hay tareas {title.toLowerCase()}.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(providedDraggable) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        projectId={projectId}
                        onEdit={(pId, tId, updatedFields) => handleEditTask(tId, updatedFields)}
                        onDelete={(pId, tId) => handleDeleteTask(tId)}
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
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <Input
            placeholder="Título de la tarea..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTask();
              }
            }}
          />
          <Textarea
            placeholder="Descripción detallada (opcional)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
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