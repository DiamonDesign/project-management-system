import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/context/SessionContext";
import { Navigate } from "react-router-dom";
import { useProjectContext, Task } from "@/context/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { GanttChart } from "@/components/GanttChart"; // Importar el componente GanttChart

const Tasks = () => {
  const { session, isLoading: isLoadingSession } = useSession();
  const { projects, isLoadingProjects, updateTaskStatus } = useProjectContext();
  const [selectedDailyTasks, setSelectedDailyTasks] = useState<string[]>([]);

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

  const allTasks: (Task & { projectName: string; projectId: string })[] = projects.flatMap(project =>
    project.tasks.map(task => ({ ...task, projectName: project.name, projectId: project.id }))
  );

  const today = new Date();
  const tasksForToday = allTasks.filter(task =>
    task.start_date && task.end_date &&
    isSameDay(today, new Date(task.start_date)) || isSameDay(today, new Date(task.end_date)) ||
    (new Date(task.start_date) < today && new Date(task.end_date) > today)
  );

  const handleToggleDailyTask = (taskId: string) => {
    setSelectedDailyTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleUpdateTaskStatus = (projectId: string, taskId: string, newStatus: Task['status']) => {
    updateTaskStatus(projectId, taskId, newStatus);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestión de Tareas</h1>

      <Tabs defaultValue="all-tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-tasks">Todas las Tareas</TabsTrigger>
          <TabsTrigger value="daily-tasks">Tareas del Día</TabsTrigger>
          <TabsTrigger value="gantt-chart">Diagrama de Gantt</TabsTrigger>
        </TabsList>

        <TabsContent value="all-tasks">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Tareas</CardTitle>
            </CardHeader>
            <CardContent>
              {allTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay tareas en ningún proyecto.</p>
              ) : (
                <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                  <ul className="space-y-3">
                    {allTasks.map(task => (
                      <li key={task.id} className="flex items-center justify-between text-sm p-2 border rounded-md">
                        <div className="flex flex-col">
                          <span className={task.status === 'completed' ? "line-through text-muted-foreground" : ""}>
                            {task.description}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Proyecto: {task.projectName}
                            {task.start_date && task.end_date && ` (${format(new Date(task.start_date), "PPP", { locale: es })} - ${format(new Date(task.end_date), "PPP", { locale: es })})`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground capitalize">{task.status === 'not-started' ? 'Sin empezar' : task.status === 'in-progress' ? 'En progreso' : 'Completado'}</span>
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={(checked) => handleUpdateTaskStatus(task.projectId, task.id, checked ? 'completed' : 'not-started')}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tareas para Hoy ({format(today, "PPP", { locale: es })})</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksForToday.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay tareas programadas para hoy.</p>
              ) : (
                <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                  <ul className="space-y-3">
                    {tasksForToday.map(task => (
                      <li key={task.id} className="flex items-center justify-between text-sm p-2 border rounded-md">
                        <div className="flex flex-col">
                          <span className={task.status === 'completed' ? "line-through text-muted-foreground" : ""}>
                            {task.description}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Proyecto: {task.projectName}
                            {task.start_date && task.end_date && ` (${format(new Date(task.start_date), "PPP", { locale: es })} - ${format(new Date(task.end_date), "PPP", { locale: es })})`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground capitalize">{task.status === 'not-started' ? 'Sin empezar' : task.status === 'in-progress' ? 'En progreso' : 'Completado'}</span>
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={(checked) => handleUpdateTaskStatus(task.projectId, task.id, checked ? 'completed' : 'not-started')}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gantt-chart">
          <Card>
            <CardHeader>
              <CardTitle>Diagrama de Gantt</CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart projects={projects} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <MadeWithDyad />
    </div>
  );
};

export default Tasks;