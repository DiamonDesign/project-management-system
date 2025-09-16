import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/hooks/useSession";
import { SessionGuard } from "@/components/SessionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useProjectContext } from "@/context/ProjectContext";
import { useClientContext } from "@/context/ClientContext";
import { useOptimizedProjectData, useTaskProjectMapping } from "@/hooks/useOptimizedProjectData";
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
  const { session } = useSession(); // No need to check loading as SessionGuard handles it
  const { projects, isLoadingProjects } = useProjectContext();
  const { clients, isLoadingClients } = useClientContext();
  
  // Use optimized data hook for better performance
  const {
    projects: optimizedProjects,
    allTasks: optimizedTasks,
    isLoading: isLoadingOptimized,
    getProjectById
  } = useOptimizedProjectData();
  
  // Efficient task-project mapping
  const getTaskProject = useTaskProjectMapping(optimizedTasks);
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
      // Refresh both projects and clients data
      // The contexts will handle the refresh internally
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

  // Instead of blocking everything, we'll show fallback content
  // This prevents the dashboard from being stuck in infinite loading
  const showProjectsContent = !isLoadingProjects;
  const showClientsContent = !isLoadingClients;

  // Enhanced analytics - handle loading states gracefully
  const safeProjects = showProjectsContent ? projects : [];
  const safeClients = showClientsContent ? clients : [];
  
  const pendingTasks = safeProjects.flatMap(project =>
    project.tasks.filter(task => task.status !== 'completed')
  );
  
  const completedTasks = safeProjects.flatMap(project =>
    project.tasks.filter(task => task.status === 'completed')
  );
  
  const totalTasks = safeProjects.flatMap(project => project.tasks).length;
  const tasksCompletionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  
  const activeProjects = safeProjects.filter(p => p.status === 'in-progress').length;
  const completedProjects = safeProjects.filter(p => p.status === 'completed').length;
  const projectCompletionRate = safeProjects.length > 0 ? (completedProjects / safeProjects.length) * 100 : 0;
  
  const upcomingDueDates = safeProjects
    .filter(project => project.dueDate && new Date(project.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);
  
  const overdueTasks = safeProjects.flatMap(project =>
    project.tasks.filter(task => 
      task.end_date && 
      new Date(task.end_date) < new Date() && 
      task.status !== 'completed'
    )
  );
  
  // Recent activity
  const recentProjects = safeProjects
    .sort((a, b) => new Date(b.dueDate || '').getTime() - new Date(a.dueDate || '').getTime())
    .slice(0, 3);
    
  const getTaskPriorityStats = () => {
    const highPriority = pendingTasks.filter(t => t.priority === 'high').length;
    const mediumPriority = pendingTasks.filter(t => t.priority === 'medium').length;
    const lowPriority = pendingTasks.filter(t => t.priority === 'low').length;
    return { high: highPriority, medium: mediumPriority, low: lowPriority };
  };
  
  const priorityStats = getTaskPriorityStats();

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gradient-bg">
        <div 
          ref={containerRef}
          {...(isMobile ? bind() : {})}
          className="container mx-auto p-4 space-y-8 animate-fade-in relative"
          style={{
            transform: isMobile && pullDistance > 0 ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)` : undefined,
            transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
          }}
        >
          {/* Pull to Refresh Indicator - Mobile Only */}
          {isMobile && (
            <PullToRefreshIndicator
              isRefreshing={isRefreshing}
              refreshProgress={refreshProgress}
              pullDistance={pullDistance}
              shouldShow={shouldShowIndicator}
            />
          )}
          {/* PWA Integration */}
          <PWAPrompt className="mb-6" />
          
          {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Bienvenido de vuelta, {session?.user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewAnalytics} 
              className="h-8 relative flex items-center justify-center pl-8 pr-4 whitespace-nowrap text-sm font-medium"
            >
              {/* Icono absoluto a la izquierda */}
              <BarChart3 className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
              
              {/* Texto centrado */}
              <span className="text-sm font-medium">Analíticas</span>
            </Button>
            <AddActionsDropdown />
          </div>
        </div>

        {/* Enhanced KPI Cards - Responsive Layout */}
        {isMobile ? (
          // Mobile: Compact cards in 2 columns  
          <div className="grid grid-cols-2 gap-3">
            <CompactCard
              title="Proyectos"
              value={safeProjects.length}
              subtitle={`${activeProjects} activos`}
              icon={<Briefcase className="h-4 w-4" />}
              variant="default"
              onClick={handleViewAnalytics}
            />
            <CompactCard
              title="Clientes"
              value={safeClients.length}
              subtitle="Registrados"
              icon={<Users className="h-4 w-4" />}
              variant="info"
            />
            <CompactCard
              title="Tareas"
              value={totalTasks}
              subtitle={`${pendingTasks.length} pendientes`}
              icon={<Target className="h-4 w-4" />}
              variant="warning"
            />
            <CompactCard
              title="Prioridad Alta"
              value={priorityStats.high}
              subtitle="Críticas"
              icon={<Zap className="h-4 w-4" />}
              variant={priorityStats.high > 0 ? "destructive" : "success"}
            />
          </div>
        ) : (
          // Desktop: Full KPI cards
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hover className="group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Proyectos</p>
                  {!showProjectsContent ? (
                    <ContentLoading lines={2} />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold">{safeProjects.length}</div>
                        <div className="flex items-center text-xs text-success">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {activeProjects} activos
                        </div>
                      </div>
                      <div className="space-y-1">
                        <ProgressBar 
                          value={projectCompletionRate} 
                          variant="success" 
                          size="sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          {Math.round(projectCompletionRate)}% completados
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card hover className="group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                  {!showClientsContent ? (
                    <ContentLoading lines={2} />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold">{safeClients.length}</div>
                        <div className="flex items-center text-xs text-info">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          Registrados
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Base de clientes sólida
                      </p>
                    </>
                  )}
                </div>
                <div className="p-3 bg-info/10 rounded-lg group-hover:bg-info/20 transition-colors">
                  <Users className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card hover className="group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tareas</p>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{totalTasks}</div>
                    <div className="flex items-center text-xs text-warning">
                      <Clock className="h-3 w-3 mr-1" />
                      {pendingTasks.length} pendientes
                    </div>
                  </div>
                  <div className="space-y-1">
                    <ProgressBar 
                      value={tasksCompletionRate} 
                      variant="default" 
                      size="sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(tasksCompletionRate)}% completadas
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg group-hover:bg-warning/20 transition-colors">
                  <Target className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card hover className={cn(
            "group",
            overdueTasks.length > 0 && "ring-2 ring-destructive/20 border-destructive/30"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Prioridades</p>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-destructive">{priorityStats.high}</div>
                    <div className="flex items-center text-xs text-destructive">
                      <Zap className="h-3 w-3 mr-1" />
                      Alta prioridad
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-warning">{priorityStats.medium} media</span>
                    <span className="text-success">{priorityStats.low} baja</span>
                  </div>
                </div>
                <div className={cn(
                  "p-3 rounded-lg transition-colors",
                  overdueTasks.length > 0 ? "bg-destructive/10 group-hover:bg-destructive/20" : "bg-success/10 group-hover:bg-success/20"
                )}>
                  {overdueTasks.length > 0 ? (
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Main Content Grid - Responsive Layout */}
        {isMobile ? (
          // Mobile: Collapsible sections for better space usage
          <div className="space-y-4">
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
              {!showProjectsContent ? (
                <div className="py-8">
                  <ContentLoading lines={4} showHeader={false} />
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">¡Excelente trabajo!</p>
                  <p className="text-sm text-muted-foreground">No hay tareas pendientes</p>
                </div>
              ) : (
                <ScrollArea className="h-64 pr-4">
                  <div className="space-y-2">
                    {pendingTasks.slice(0, 8).map((task, index) => {
                      const project = safeProjects.find(p => p.tasks.some(t => t.id === task.id));
                      const isOverdue = task.end_date && new Date(task.end_date) < new Date();
                      
                      return (
                        <div key={task.id + index} className={cn(
                          "flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group",
                          isOverdue && "border-destructive/30 bg-destructive/5"
                        )}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                task.priority === 'high' && "bg-destructive",
                                task.priority === 'medium' && "bg-warning", 
                                task.priority === 'low' && "bg-success",
                                !task.priority && "bg-muted"
                              )} />
                              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {task.title}
                              </p>
                            </div>
                            {project && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {project.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isOverdue && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            <Badge 
                              variant={task.status === 'not-started' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {task.status === 'not-started' ? 'Sin empezar' : 'En progreso'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CollapsibleSection>
          </div>
        ) : (
          // Desktop: Original layout  
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Tasks Overview */}
            <Card hover className="xl:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Tareas Pendientes
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pendingTasks.length} tareas requieren atención
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleViewAllTasks}>
                    Ver todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!showProjectsContent ? (
                  <div className="py-8">
                    <ContentLoading lines={4} showHeader={false} />
                  </div>
                ) : pendingTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">¡Excelente trabajo!</p>
                    <p className="text-sm text-muted-foreground">No hay tareas pendientes</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64 pr-4">
                    <div className="space-y-2">
                      {pendingTasks.slice(0, 8).map((task, index) => {
                        const project = safeProjects.find(p => p.tasks.some(t => t.id === task.id));
                        const isOverdue = task.end_date && new Date(task.end_date) < new Date();
                        
                        return (
                          <div key={task.id + index} className={cn(
                            "flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group",
                            isOverdue && "border-destructive/30 bg-destructive/5"
                          )}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  task.priority === 'high' && "bg-destructive",
                                  task.priority === 'medium' && "bg-warning", 
                                  task.priority === 'low' && "bg-success",
                                  !task.priority && "bg-muted"
                                )} />
                                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                  {task.title}
                                </p>
                              </div>
                              {project && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {project.name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isOverdue && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                              <Badge 
                                variant={task.status === 'not-started' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {task.status === 'not-started' ? 'Sin empezar' : 'En progreso'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          
          {/* Calendar Section */}
          <Card hover className="xl:col-span-1">
            <CardHeader compact>
              <CardTitle className="text-lg">Calendario</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md w-full"
                locale={es}
                classNames={{
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 flex items-center justify-center",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 flex-1 flex items-center justify-center h-8",
                  day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-bold",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
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
            <CardContent compact className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso global</span>
                  <span className="font-medium">{Math.round((tasksCompletionRate + projectCompletionRate) / 2)}%</span>
                </div>
                <ProgressBar 
                  value={(tasksCompletionRate + projectCompletionRate) / 2} 
                  variant="success"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Proyectos activos</span>
                  <span className="font-medium">{activeProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tareas completadas hoy</span>
                  <span className="font-medium text-success">{completedTasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Clientes activos</span>
                  <span className="font-medium">{safeClients.length}</span>
                </div>
              </div>
              
              {overdueTasks.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">{overdueTasks.length} tareas vencidas</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Upcoming Deadlines */}
        {upcomingDueDates.length > 0 && (
          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Próximas Fechas Límite
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mantén el control de tus plazos
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDueDates.map(project => {
                  const dueDate = new Date(project.dueDate!);
                  const isUrgent = dueDate <= addDays(new Date(), 2);
                  
                  let dateLabel = format(dueDate, "PPP", { locale: es });
                  if (isToday(dueDate)) dateLabel = "Hoy";
                  else if (isTomorrow(dueDate)) dateLabel = "Mañana";
                  else if (isYesterday(dueDate)) dateLabel = "Ayer";
                  
                  return (
                    <div key={project.id} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group",
                      isUrgent && "border-warning/30 bg-warning/5"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          isUrgent ? "bg-warning" : "bg-primary"
                        )} />
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.status === 'in-progress' ? 'En progreso' : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUrgent && (
                          <Clock className="h-4 w-4 text-warning" />
                        )}
                        <span className={cn(
                          "text-sm font-medium",
                          isUrgent ? "text-warning" : "text-muted-foreground"
                        )}>
                          {dateLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

          <MadeWithDyad />
        </div>
      </div>
    </SessionGuard>
  );
};

export default Dashboard;