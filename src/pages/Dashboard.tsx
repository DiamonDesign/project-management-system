import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/hooks/useSession";
import { SessionGuard } from "@/components/SessionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleCalendar } from "@/components/ui/simple-calendar";
import { Button } from "@/components/ui/button";
import { useOptimizedProjectData } from "@/hooks/useOptimizedProjectData";
import { useClientContext } from "@/context/ClientContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { PWAPrompt } from "@/components/PWAPrompt";
import { CompactCard } from "@/components/CompactCard";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContentLoading, ProgressBar, Spinner } from "@/components/ui/loading";
import { format, isToday, isTomorrow, isYesterday, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Plus,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  Calendar as CalendarIcon,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddActionsDropdown } from "@/components/AddActionsDropdown";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  // Hooks MUST be called at the top level, not inside try-catch
  const { session } = useSession();

  // FIXED: Use single source of truth - useOptimizedProjectData
  const {
    projects: safeProjects,
    allTasks,
    isLoading: isLoadingProjects,
    error: projectsError
  } = useOptimizedProjectData();

  // Keep client context for client data - FIXED: hooks must be called unconditionally
  const clientContextData = useClientContext();
  const { clients, isLoadingClients } = clientContextData;

  // Simple calendar state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Pull to refresh functionality for mobile
  const {
    bind,
    containerRef,
    isRefreshing,
    pullDistance,
    refreshProgress,
    shouldShowIndicator
  } = usePullToRefresh({
    onRefresh: async () => {
      if (window.location.reload) {
        window.location.reload();
      }
    },
    disabled: !isMobile || isLoadingProjects || isLoadingClients
  });

  // Button handlers
  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  const handleViewAllTasks = () => {
    navigate('/tasks');
  };

  // FIXED: Handle case where tasks might be undefined with defensive programming
  const pendingTasks = React.useMemo(() => {
    if (!Array.isArray(allTasks)) return [];

    return allTasks.filter(task =>
      task &&
      task.status &&
      ['pending', 'in-progress'].includes(task.status)
    ).slice(0, 10); // Limit for performance
  }, [allTasks]);

  // Active projects count
  const activeProjects = React.useMemo(() => {
    return Array.isArray(safeProjects)
      ? safeProjects.filter(p => p && p.status !== 'completed' && !p.archived)
      : [];
  }, [safeProjects]);

  // Active clients count
  const activeClients = React.useMemo(() => {
    return Array.isArray(clients) ? clients.filter(c => c && c.status === 'active') : [];
  }, [clients]);

  // Loading state handling
  if (isLoadingProjects || isLoadingClients) {
    return (
      <SessionGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </SessionGuard>
    );
  }

  return (
    <SessionGuard>
      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 lg:p-8"
        {...bind()}
      >
        <PWAPrompt />

        {/* Pull to refresh indicator */}
        {shouldShowIndicator && (
          <PullToRefreshIndicator
            isRefreshing={isRefreshing}
            pullDistance={pullDistance}
            refreshProgress={refreshProgress}
          />
        )}

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Bienvenido de vuelta, {session?.user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleViewAnalytics} className="relative pl-9 pr-3">
                <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                <span>Analíticas</span>
              </Button>
              <AddActionsDropdown />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Projects */}
            <CompactCard
              icon={<Briefcase className="h-5 w-5 text-primary" />}
              title="Proyectos"
              value={activeProjects.length.toString()}
              subtitle={`${safeProjects?.length || 0} activos`}
              trend={{ value: "+7", isPositive: true }}
              className="hover:shadow-lg transition-shadow"
            />

            {/* Clients */}
            <CompactCard
              icon={<Users className="h-5 w-5 text-info" />}
              title="Clientes"
              value={activeClients.length.toString()}
              subtitle="Registrados"
              trend={{ value: "+1", isPositive: true }}
              className="hover:shadow-lg transition-shadow"
            />

            {/* Tasks */}
            <CompactCard
              icon={<CheckCircle className="h-5 w-5 text-warning" />}
              title="Tareas"
              value={pendingTasks.length.toString()}
              subtitle="Pendientes"
              trend={{ value: "0", isPositive: false }}
              className="hover:shadow-lg transition-shadow"
            />

            {/* Priority */}
            <CompactCard
              icon={<AlertCircle className="h-5 w-5 text-destructive" />}
              title="Prioridades"
              value="0"
              subtitle="Alta prioridad"
              trend={{ value: "0", isPositive: true }}
              className="hover:shadow-lg transition-shadow"
            />
          </div>

          {/* Main Content */}
          {isMobile ? (
            // Mobile: Collapsible sections for better space usage
            <div className="space-y-4">
              {/* Mobile Calendar Section */}
              <CollapsibleSection
                title="Calendario"
                subtitle="Selecciona una fecha"
                icon={<CalendarIcon className="h-5 w-5" />}
                defaultExpanded={true}
                compact={true}
              >
                <div className="space-y-4">
                  <SimpleCalendar
                    selected={date}
                    onSelect={setDate}
                    className="w-full"
                  />
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Tareas Pendientes"
                subtitle={`${pendingTasks.length} tareas requieren atención`}
                icon={<CheckCircle className="h-5 w-5" />}
                defaultExpanded={pendingTasks.length > 0}
                compact={true}
                actionButton={
                  <Button variant="outline" size="sm" onClick={handleViewAllTasks}>
                    Ver todas
                  </Button>
                }
              >
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {pendingTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>¡Todas las tareas completadas!</p>
                      </div>
                    ) : (
                      pendingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/tasks?highlight=${task.id}`)}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                            task.priority === 'high' && "bg-destructive",
                            task.priority === 'medium' && "bg-warning",
                            task.priority === 'low' && "bg-muted-foreground"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{task.project_name}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CollapsibleSection>
            </div>
          ) : (
            // Desktop: Grid layout
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Enhanced Calendar Section */}
              <Card hover className="xl:col-span-1">
                <CardHeader compact>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Calendario</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-auto p-0">
                    <SimpleCalendar
                      selected={date}
                      onSelect={setDate}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Project Stats */}
              <Card hover className="xl:col-span-1">
                <CardHeader compact>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progreso global</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <ProgressBar value={75} className="w-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Proyectos activos</p>
                      <p className="text-lg font-semibold">{activeProjects.length}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Eventos próximos</p>
                      <span className="font-medium text-info">0</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Tareas completadas</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Clientes activos</p>
                      <p className="text-lg font-semibold">{activeClients.length}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-destructive/10 to-warning/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">1 tareas vencidas</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Revisa las tareas que requieren atención inmediata
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Tasks */}
              <Card hover className="xl:col-span-1">
                <CardHeader compact>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Próximas Fechas Límite
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tareas y proyectos importantes
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleViewAllTasks}>
                      Ver todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1 p-4">
                      {pendingTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>¡Todas las tareas completadas!</p>
                        </div>
                      ) : (
                        pendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                            onClick={() => navigate(`/tasks?highlight=${task.id}`)}
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                              task.priority === 'high' && "bg-destructive",
                              task.priority === 'medium' && "bg-warning",
                              task.priority === 'low' && "bg-muted-foreground"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate group-hover:text-primary transition-colors">
                                {task.title}
                              </p>
                              <p className="text-sm text-muted-foreground">{task.project_name}</p>
                              {task.end_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(task.end_date), "d 'de' MMM", { locale: es })}
                                </p>
                              )}
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <MadeWithDyad />
      </div>
    </SessionGuard>
  );
};

export default Dashboard;