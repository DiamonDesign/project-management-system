import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/hooks/useSession";
import { Navigate } from "react-router-dom";
import { useProjectContext, Task } from "@/context/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "@/components/TaskCard";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GanttChart } from "@/components/GanttChart";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTaskDialog } from "@/components/AddTaskDialog";

const Tasks = () => {
  const { session, isLoading: isLoadingSession } = useSession();
  const { projects, isLoadingProjects, updateProject, updateTaskStatus, updateTaskDailyStatus, deleteTaskFromProject, updateTask } = useProjectContext();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  if (isLoadingSession || isLoadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando tareas...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Aplanar todas las tareas y añadir projectName y projectId
  const allTasksWithProjectInfo: (Task & { projectName: string; projectId: string })[] = projects.flatMap(project =>
    project.tasks.map(task => ({ ...task, projectName: project.name, projectId: project.id }))
  );

  const nonDailyTasks = allTasksWithProjectInfo.filter(task => !task.is_daily_task);
  const dailyTasks = allTasksWithProjectInfo.filter(task => task.is_daily_task);

  const handleEditTask = (projectId: string, taskId: string, updatedFields: Partial<Task>) => {
    updateTask(projectId, taskId, updatedFields);
    showSuccess("Tarea actualizada.");
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    deleteTaskFromProject(projectId, taskId);
  };

  const handleUpdateTaskStatus = (projectId: string, taskId: string, newStatus: Task['status']) => {
    updateTaskStatus(projectId, taskId, newStatus);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const draggedTask = allTasksWithProjectInfo.find(task => task.id === draggableId);
    if (!draggedTask) return;

    const isMovingToDaily = destination.droppableId === 'daily-tasks';
    const isMovingFromDaily = source.droppableId === 'daily-tasks';

    if (isMovingToDaily && !draggedTask.is_daily_task) {
      updateTaskDailyStatus(draggedTask.projectId, draggedTask.id, true);
    } else if (isMovingFromDaily && draggedTask.is_daily_task) {
      updateTaskDailyStatus(draggedTask.projectId, draggedTask.id, false);
    }
  };

  const renderTaskListColumn = (tasks: (Task & { projectName: string; projectId: string })[], droppableId: string, title: string) => (
    <Droppable droppableId={droppableId}>
      {(provided) => (
        <Card
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex flex-col h-full"
        >
          <CardHeader>
            <CardTitle>{title} ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-4">
            <ScrollArea className="h-full w-full pr-2">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay tareas aquí.</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(providedDraggable) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          projectId={task.projectId}
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
          </CardContent>
        </Card>
      )}
    </Droppable>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Tareas</h1>
        <Button 
          onClick={() => setIsTaskDialogOpen(true)}
          className="h-10 relative flex items-center justify-center pl-9 pr-4 whitespace-nowrap text-sm font-medium"
        >
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
          <span className="text-sm font-medium">Añadir Tarea</span>
        </Button>
      </div>
      
      <AddTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 h-[calc(100vh-350px)]">
          {renderTaskListColumn(nonDailyTasks, 'all-tasks', 'Todas las Tareas')}
          {renderTaskListColumn(dailyTasks, 'daily-tasks', 'Tareas del Día')}
        </div>
      </DragDropContext>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Diagrama de Gantt</CardTitle>
        </CardHeader>
        <CardContent>
          <GanttChart projects={projects} />
        </CardContent>
      </Card>

      <MadeWithDyad />
    </div>
  );
};

export default Tasks;