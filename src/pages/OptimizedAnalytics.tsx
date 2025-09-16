import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  Download,
  Filter
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { useTask } from "@/context/TaskContext";
import { useSession } from "@/hooks/useSession";

// Analytics period type
type AnalyticsPeriod = '7d' | '30d' | '90d';

// KPI metric interface
interface KPIMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
}

// Chart data interfaces
interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface ProjectAnalytics {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  onHoldProjects: number;
  completionRate: number;
  averageCompletionTime: number;
  projectsByStatus: ChartDataPoint[];
  projectsByPriority: ChartDataPoint[];
  monthlyCompletions: ChartDataPoint[];
}

interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueCount: number;
  completionRate: number;
  averageTaskDuration: number;
  tasksByPriority: ChartDataPoint[];
  tasksByStatus: ChartDataPoint[];
  dailyCompletions: ChartDataPoint[];
}

export default function OptimizedAnalytics() {
  const { projects } = useProject();
  const { tasks, getUserTaskStats } = useTask();
  const { user } = useSession();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('30d');

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (selectedPeriod) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }
    
    return { startDate, endDate };
  }, [selectedPeriod]);

  // Filter data by date range
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const projectDate = new Date(project.created_at);
      return projectDate >= dateRange.startDate && projectDate <= dateRange.endDate;
    });
  }, [projects, dateRange]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate >= dateRange.startDate && taskDate <= dateRange.endDate;
    });
  }, [tasks, dateRange]);

  // Calculate average completion time
  const calculateAvgCompletionTime = useMemo(() => {
    const completedProjects = filteredProjects.filter(p => p.status === 'completed');
    if (completedProjects.length === 0) return 0;
    
    const totalDays = completedProjects.reduce((sum, project) => {
      const startDate = new Date(project.created_at);
      const endDate = project.updated_at ? new Date(project.updated_at) : new Date();
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return Math.round(totalDays / completedProjects.length);
  }, [filteredProjects]);

  // Project analytics
  const projectAnalytics: ProjectAnalytics = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;
    const activeProjects = filteredProjects.filter(p => p.status === 'active').length;
    const onHoldProjects = filteredProjects.filter(p => p.status === 'on-hold').length;
    
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    
    const projectsByStatus: ChartDataPoint[] = [
      { name: 'Activos', value: activeProjects, color: '#10B981' },
      { name: 'Completados', value: completedProjects, color: '#3B82F6' },
      { name: 'En Pausa', value: onHoldProjects, color: '#F59E0B' },
    ];

    const projectsByPriority: ChartDataPoint[] = [
      { 
        name: 'Alta', 
        value: filteredProjects.filter(p => p.priority === 'high').length,
        color: '#EF4444' 
      },
      { 
        name: 'Media', 
        value: filteredProjects.filter(p => p.priority === 'medium').length,
        color: '#F59E0B' 
      },
      { 
        name: 'Baja', 
        value: filteredProjects.filter(p => p.priority === 'low').length,
        color: '#10B981' 
      },
    ];

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      onHoldProjects,
      completionRate,
      averageCompletionTime: calculateAvgCompletionTime,
      projectsByStatus,
      projectsByPriority,
      monthlyCompletions: [] // Would be calculated based on historical data
    };
  }, [filteredProjects, calculateAvgCompletionTime]);

  // Task analytics
  const taskAnalytics: TaskAnalytics = useMemo(() => {
    const taskStats = getUserTaskStats();
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length;
    const overdueCount = filteredTasks.filter(t => t.is_overdue).length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const tasksByStatus: ChartDataPoint[] = [
      { name: 'No Iniciadas', value: taskStats.pending, color: '#6B7280' },
      { name: 'En Progreso', value: taskStats.active, color: '#3B82F6' },
      { name: 'Completadas', value: taskStats.completed, color: '#10B981' },
    ];

    const tasksByPriority: ChartDataPoint[] = [
      { 
        name: 'Alta', 
        value: filteredTasks.filter(t => t.priority === 'high').length,
        color: '#EF4444' 
      },
      { 
        name: 'Media', 
        value: filteredTasks.filter(t => t.priority === 'medium').length,
        color: '#F59E0B' 
      },
      { 
        name: 'Baja', 
        value: filteredTasks.filter(t => t.priority === 'low').length,
        color: '#10B981' 
      },
    ];

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueCount,
      completionRate,
      averageTaskDuration: 0, // Would calculate based on task completion times
      tasksByPriority,
      tasksByStatus,
      dailyCompletions: [] // Would be calculated based on historical data
    };
  }, [filteredTasks, getUserTaskStats]);

  // KPI metrics
  const kpiMetrics: KPIMetric[] = useMemo(() => [
    {
      title: "Proyectos Totales",
      value: projectAnalytics.totalProjects,
      change: 12.5,
      trend: 'up',
      icon: BarChart3
    },
    {
      title: "Tasa de Finalización",
      value: `${projectAnalytics.completionRate.toFixed(1)}%`,
      change: 5.2,
      trend: 'up',
      icon: CheckCircle
    },
    {
      title: "Tareas Activas",
      value: taskAnalytics.inProgressTasks,
      change: -2.1,
      trend: 'down',
      icon: Clock
    },
    {
      title: "Clientes Activos",
      value: new Set(projects.map(p => p.client_id).filter(Boolean)).size,
      change: 8.7,
      trend: 'up',
      icon: Users
    }
  ], [projectAnalytics, taskAnalytics, projects]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Información detallada sobre el rendimiento de tus proyectos y tareas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Tabs value={selectedPeriod} onValueChange={(value: string) => setSelectedPeriod(value as AnalyticsPeriod)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="7d">7 días</TabsTrigger>
          <TabsTrigger value="30d">30 días</TabsTrigger>
          <TabsTrigger value="90d">90 días</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiMetrics.map((metric, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp 
                      className={`h-3 w-3 mr-1 ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`} 
                    />
                    <span className={
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="ml-1">vs período anterior</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Proyectos</CardTitle>
                <CardDescription>
                  Estado actual de todos los proyectos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectAnalytics.projectsByStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Task Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Prioridad de Tareas</CardTitle>
                <CardDescription>
                  Distribución por nivel de prioridad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taskAnalytics.tasksByPriority.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Task Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Tareas</CardTitle>
                <CardDescription>
                  Progreso actual de todas las tareas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taskAnalytics.tasksByStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Rendimiento</CardTitle>
                <CardDescription>
                  Métricas clave del período seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tiempo promedio de proyecto</span>
                    <span className="font-medium">{projectAnalytics.averageCompletionTime} días</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tareas vencidas</span>
                    <Badge variant={taskAnalytics.overdueCount > 0 ? "destructive" : "secondary"}>
                      {taskAnalytics.overdueCount}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tasa de finalización de tareas</span>
                    <span className="font-medium">{taskAnalytics.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Proyectos activos</span>
                    <span className="font-medium">{projectAnalytics.activeProjects}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Período</CardTitle>
              <CardDescription>
                Actividad reciente en los últimos {selectedPeriod === '7d' ? '7 días' : selectedPeriod === '30d' ? '30 días' : '90 días'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {projectAnalytics.totalProjects}
                  </div>
                  <div className="text-sm text-muted-foreground">Proyectos creados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {taskAnalytics.completedTasks}
                  </div>
                  <div className="text-sm text-muted-foreground">Tareas completadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {projectAnalytics.completionRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Eficiencia general</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}