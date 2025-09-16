"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, CheckCircle, Clock, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Project, Task } from "@/context/ProjectContext"; // Reutilizar interfaces de ProjectContext
import { showSuccess, showError } from "@/utils/toast";
import type { AppError } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in-progress':
      return 'secondary';
    case 'pending':
    default:
      return 'outline';
  }
};

const ClientPortalDashboard = () => {
  const { session, user, isLoading: isLoadingSession, isSigningOut, signOut } = useSession();
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [clientName, setClientName] = useState("Cliente");

  const fetchClientProjects = useCallback(async () => {
    if (!user) {
      setClientProjects([]);
      setIsLoadingProjects(false);
      return;
    }

    setIsLoadingProjects(true);
    try {
      // First, get the client_id associated with the current user
      const { data: portalUser, error: portalUserError } = await supabase
        .from('client_portal_users')
        .select('client_id')
        .eq('user_id', user.id)
        .single();

      if (portalUserError) {
        if (portalUserError.code === 'PGRST116') { // No rows found
          showError("No estás asociado a ningún cliente. Contacta a tu freelancer.");
        } else {
          throw portalUserError;
        }
        setClientProjects([]);
        setIsLoadingProjects(false);
        return;
      }

      const clientId = portalUser.client_id;

      // Then, fetch projects linked to that client_id
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch client details to display client name
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();

      if (clientError) console.error("Error fetching client name:", clientError);
      if (clientData) setClientName(clientData.name);

      const projectsWithNormalizedData = projectsData.map(project => ({
        ...project,
        dueDate: project.due_date,
        tasks: project.tasks.map((task: Task) => ({
          id: task.id,
          description: task.description,
          createdAt: task.createdAt,
          status: task.status || (task.completed ? 'completed' : 'not-started'),
          start_date: task.start_date,
          end_date: task.end_date,
          is_daily_task: task.is_daily_task || false, // Asegurar que is_daily_task esté presente
        }))
      }));
      setClientProjects(projectsWithNormalizedData as Project[]);
    } catch (error: unknown) {
      const appError = error as AppError;
      showError("Error al cargar tus proyectos: " + appError.message);
      console.error("Error fetching client projects:", error);
      setClientProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingSession) {
      fetchClientProjects();
    }
  }, [isLoadingSession, fetchClientProjects]);

  if (isLoadingSession || isLoadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-600 dark:text-gray-400">Cargando portal del cliente...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/client-portal/invite" replace />;
  }

  const totalProjects = clientProjects.length;
  const completedProjects = clientProjects.filter(p => p.status === 'completed').length;
  const inProgressProjects = clientProjects.filter(p => p.status === 'in-progress').length;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bienvenido, {clientName}</h1>
        <Button variant="outline" onClick={signOut} disabled={isSigningOut}>
          <LogOut className="h-4 w-4 mr-2" /> {isSigningOut ? "Cerrando..." : "Cerrar Sesión"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos asignados
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos finalizados
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos en Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressProjects}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos activos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mis Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          {clientProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tienes proyectos asignados aún.</p>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {clientProjects.map(project => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-4">
                      <Badge variant={getStatusVariant(project.status)}>
                        {project.status === 'pending' && 'Pendiente'}
                        {project.status === 'in-progress' && 'En Progreso'}
                        {project.status === 'completed' && 'Completado'}
                      </Badge>
                      {project.dueDate && (
                        <span className="text-sm text-muted-foreground">
                          Fecha límite: {format(new Date(project.dueDate), "PPP", { locale: es })}
                        </span>
                      )}
                      {project.tasks.length > 0 && (
                        <div className="w-full mt-2">
                          <h4 className="font-semibold text-sm mb-1">Tareas:</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {project.tasks.map(task => (
                              <li key={task.id} className="flex items-center gap-2">
                                {task.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                )}
                                <span className={task.status === 'completed' ? "line-through" : ""}>
                                  {task.description}
                                </span>
                                {task.start_date && task.end_date && (
                                  <span className="text-xs">
                                    ({format(new Date(task.start_date), "P", { locale: es })} - {format(new Date(task.end_date), "P", { locale: es })})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default ClientPortalDashboard;