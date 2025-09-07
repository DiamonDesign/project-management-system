import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/context/SessionContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useProjectContext } from "@/context/ProjectContext";
import { useClientContext } from "@/context/ClientContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Briefcase, Users, CheckCircle, Clock } from "lucide-react";

const Dashboard = () => {
  const { session, isLoading: isLoadingSession } = useSession();
  const { projects, isLoadingProjects } = useProjectContext();
  const { clients, isLoadingClients } = useClientContext();
  const [date, setDate] = useState<Date | undefined>(new Date());

  if (isLoadingSession || isLoadingProjects || isLoadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const pendingTasks = projects.flatMap(project =>
    project.tasks.filter(task => task.status !== 'completed')
  );

  const upcomingDueDates = projects
    .filter(project => project.dueDate && new Date(project.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5); // Mostrar las 5 fechas límite más cercanas

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Freelance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos gestionados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tareas por completar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tareas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">¡No hay tareas pendientes! Buen trabajo.</p>
            ) : (
              <ScrollArea className="h-72 w-full rounded-md border p-4">
                <ul className="space-y-2">
                  {pendingTasks.map((task, index) => (
                    <li key={task.id + index} className="flex items-center justify-between text-sm">
                      <span className="flex-1 pr-2">{task.description}</span>
                      <Badge variant="secondary">{task.status === 'not-started' ? 'Sin empezar' : 'En progreso'}</Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              locale={es}
            />
          </CardContent>
        </Card>
      </div>

      {upcomingDueDates.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Próximas Fechas Límite</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {upcomingDueDates.map(project => (
                <li key={project.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-muted-foreground">
                    {project.dueDate ? format(new Date(project.dueDate), "PPP", { locale: es }) : "Sin fecha"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;