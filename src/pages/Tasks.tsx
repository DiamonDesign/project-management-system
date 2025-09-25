import { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/hooks/useSession";
import { Navigate } from "react-router-dom";
import { useProjectContext } from "@/context/ProjectContext";
import { useTaskContext } from "@/context/TaskContext";
import { Task } from "@/types/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "@/components/TaskCard";
// Drag and drop functionality now handled by TaskBoard component
import { GanttChart } from "@/components/GanttChart";
import { showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTaskDialog } from "@/components/AddTaskDialog";

const Tasks = () => {
  const { session, isLoading: isLoadingSession } = useSession();
  const { projects, isLoadingProjects } = useProjectContext();
  const { tasks, updateTaskStatus, updateTaskDailyStatus, deleteTask, updateTask } = useTaskContext();
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

  // Las tareas ya vienen con projectName del TaskContext
  const nonDailyTasks = tasks.filter(task => !task.is_daily_task);
  const dailyTasks = tasks.filter(task => task.is_daily_task);

  const handleEditTask = (taskId: string, updatedFields: Partial<Task>) => {
    updateTask(taskId, updatedFields);
    showSuccess("Tarea actualizada.");
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    updateTaskStatus(taskId, newStatus);
  };

  // Drag & drop removed - using TaskBoard component for drag functionality in project details

  const renderTaskListColumn = (tasks: Task[], listId: string, title: string) => (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title} ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <ScrollArea className="h-full w-full pr-2">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay tareas aquí.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={task.projectId || ''}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onUpdateStatus={handleUpdateTaskStatus}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 h-[calc(100vh-350px)]">
        {renderTaskListColumn(nonDailyTasks, 'all-tasks', 'Todas las Tareas')}
        {renderTaskListColumn(dailyTasks, 'daily-tasks', 'Tareas del Día')}
      </div>

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