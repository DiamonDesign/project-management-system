import React, { useState } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { useClientContext } from '@/context/ClientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  Briefcase,
  ListChecks,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Award,
  Activity,
  RefreshCw,
  Filter,
} from 'lucide-react';

// Analytics Components
import { KPICard } from '@/components/analytics/KPICard';
// Temporarily commented out charts due to Recharts/Lodash import issues
// import { ProjectStatusChart } from '@/components/analytics/ProjectStatusChart';
// import { TaskPriorityChart } from '@/components/analytics/TaskPriorityChart';
// import { ProductivityTrendChart } from '@/components/analytics/ProductivityTrendChart';
// import { ClientDistributionChart } from '@/components/analytics/ClientDistributionChart';

const Analytics: React.FC = () => {
  const { projects, isLoadingProjects } = useProjectContext();
  const { clients, isLoadingClients } = useClientContext();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    const allTasks = projects.flatMap(p => p.tasks || []);
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in-progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overdueProjects = projects.filter(p => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate) < new Date() && p.status !== 'completed';
    }).length;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = allTasks.filter(t => t.status !== 'completed').length;
    const highPriorityTasks = allTasks.filter(t => t.priority === 'high').length;

    const totalClients = clients.length;
    const activeClients = clients.filter(c => 
      projects.some(p => p.client_id === c.id && p.status === 'in-progress')
    ).length;

    // Calculate completion rates
    const projectCompletionRate = totalProjects > 0 
      ? ((completedProjects / totalProjects) * 100).toFixed(1)
      : '0';
    const taskCompletionRate = totalTasks > 0 
      ? ((completedTasks / totalTasks) * 100).toFixed(1)
      : '0';

    // Calculate average project duration (mock data for now)
    const avgProjectDuration = Math.floor(Math.random() * 30) + 15; // 15-45 days

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      projectCompletionRate,
      totalTasks,
      completedTasks,
      pendingTasks,
      highPriorityTasks,
      taskCompletionRate,
      totalClients,
      activeClients,
      avgProjectDuration,
    };
  }, [projects, clients]);


  if (isLoadingProjects || isLoadingClients) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analíticas</h1>
          <p className="text-muted-foreground mt-1">
            Análisis completo de tu productividad y proyectos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Actualizado hace {Math.floor(Math.random() * 10) + 1} min
          </Badge>
        </div>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período de análisis:</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { key: '7d', label: 'Última semana' },
                { key: '30d', label: 'Último mes' },
                { key: '90d', label: 'Últimos 3 meses' },
              ].map(period => (
                <Button
                  key={period.key}
                  variant={selectedPeriod === period.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.key as '7d' | '30d' | '90d')}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Proyectos"
          value={kpis.totalProjects}
          subtitle={`${kpis.activeProjects} activos`}
          icon={Briefcase}
          color="blue"
          trend={{
            value: 12.5,
            label: 'vs mes anterior',
            type: 'increase',
          }}
        />
        <KPICard
          title="Tareas Completadas"
          value={kpis.completedTasks}
          subtitle={`${kpis.pendingTasks} pendientes`}
          icon={ListChecks}
          color="green"
          trend={{
            value: 8.3,
            label: 'vs mes anterior',
            type: 'increase',
          }}
        />
        <KPICard
          title="Clientes Activos"
          value={kpis.activeClients}
          subtitle={`${kpis.totalClients} total`}
          icon={Users}
          color="purple"
          trend={{
            value: -2.1,
            label: 'vs mes anterior',
            type: 'decrease',
          }}
        />
        <KPICard
          title="Tasa de Éxito"
          value={`${kpis.projectCompletionRate}%`}
          subtitle="Proyectos completados"
          icon={Target}
          color="orange"
          trend={{
            value: 5.2,
            label: 'vs mes anterior',
            type: 'increase',
          }}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Duración Promedio"
          value={`${kpis.avgProjectDuration}d`}
          subtitle="Por proyecto"
          icon={Clock}
          color="cyan"
        />
        <KPICard
          title="Tareas de Alta Prioridad"
          value={kpis.highPriorityTasks}
          subtitle={`${((kpis.highPriorityTasks / Math.max(kpis.totalTasks, 1)) * 100).toFixed(0)}% del total`}
          icon={Award}
          color="red"
        />
        <KPICard
          title="Proyectos Vencidos"
          value={kpis.overdueProjects}
          subtitle="Requieren atención"
          icon={Calendar}
          color="orange"
        />
        <KPICard
          title="Productividad"
          value={`${kpis.taskCompletionRate}%`}
          subtitle="Tareas completadas"
          icon={Activity}
          color="green"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gráfico temporalmente deshabilitado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Prioridad de Tareas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gráfico temporalmente deshabilitado</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Productividad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Gráfico temporalmente deshabilitado</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gráfico temporalmente deshabilitado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tasa de Finalización</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${kpis.projectCompletionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{kpis.projectCompletionRate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Proyectos a Tiempo</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${((kpis.totalProjects - kpis.overdueProjects) / Math.max(kpis.totalProjects, 1) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {((kpis.totalProjects - kpis.overdueProjects) / Math.max(kpis.totalProjects, 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{kpis.activeProjects}</p>
                      <p className="text-sm text-muted-foreground">En Progreso</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{kpis.completedProjects}</p>
                      <p className="text-sm text-muted-foreground">Completados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Prioridad de Tareas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gráfico temporalmente deshabilitado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Tareas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['high', 'medium', 'low'].map(priority => {
                    const tasks = projects.flatMap(p => p.tasks || []).filter(t => 
                      (t.priority || 'medium') === priority
                    );
                    const completed = tasks.filter(t => t.status === 'completed').length;
                    const completionRate = tasks.length > 0 ? (completed / tasks.length * 100) : 0;
                    
                    return (
                      <div key={priority} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">
                            Prioridad {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {completed} de {tasks.length} completadas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
                          <div className={`w-12 h-2 rounded-full ${
                            priority === 'high' ? 'bg-red-100' : 
                            priority === 'medium' ? 'bg-orange-100' : 'bg-green-100'
                          }`}>
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                priority === 'high' ? 'bg-red-500' : 
                                priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Productividad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Gráfico temporalmente deshabilitado</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Gráfico temporalmente deshabilitado</p>
            </CardContent>
          </Card>
          
          {/* Client Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clientes Más Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients
                    .map(client => ({
                      ...client,
                      projectCount: projects.filter(p => p.client_id === client.id).length,
                    }))
                    .sort((a, b) => b.projectCount - a.projectCount)
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={client.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.projectCount} proyectos</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nuevos Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((client) => (
                      <div key={client.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas Generales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{kpis.totalClients}</p>
                    <p className="text-sm text-muted-foreground">Total Clientes</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{kpis.activeClients}</p>
                    <p className="text-sm text-muted-foreground">Clientes Activos</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {(kpis.totalProjects / Math.max(kpis.totalClients, 1)).toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Promedio Proyectos/Cliente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;