import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Project } from '@/context/ProjectContext';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductivityTrendChartProps {
  projects: Project[];
}

export const ProductivityTrendChart: React.FC<ProductivityTrendChartProps> = ({ projects }) => {
  const data = React.useMemo(() => {
    const days = 30; // Last 30 days
    const today = new Date();
    const dateRange = Array.from({ length: days }, (_, i) => {
      const date = subDays(today, days - 1 - i);
      return startOfDay(date);
    });

    const allTasks = projects.flatMap(p => p.tasks);

    return dateRange.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      
      // Tasks completed on this day
      const completedTasks = allTasks.filter(task => {
        if (task.status !== 'completed') return false;
        // Since we don't have completion date, we'll simulate based on creation
        // In a real app, you'd have a completion_date field
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      }).length;

      // Tasks created on this day
      const createdTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      }).length;

      // Projects created on this day
      const createdProjects = projects.filter(project => {
        const projectDate = new Date(project.created_at).toISOString().split('T')[0];
        return projectDate === dateStr;
      }).length;

      return {
        date: dateStr,
        displayDate: format(date, 'dd/MM', { locale: es }),
        completed: completedTasks,
        created: createdTasks,
        projects: createdProjects,
        productivity: completedTasks > 0 ? (completedTasks / Math.max(createdTasks, 1)) * 100 : 0,
      };
    });
  }, [projects]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{format(new Date(data.date), 'dd MMMM yyyy', { locale: es })}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              Tareas completadas: {data.completed}
            </p>
            <p className="text-sm text-green-600">
              Tareas creadas: {data.created}
            </p>
            <p className="text-sm text-purple-600">
              Proyectos creados: {data.projects}
            </p>
            <p className="text-sm text-orange-600">
              Productividad: {data.productivity.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = data.some(d => d.completed > 0 || d.created > 0 || d.projects > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Productividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos suficientes para mostrar la tendencia
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Productividad (30 días)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs fill-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Completadas"
              />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="5 5"
                name="Creadas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500 rounded" />
            <span className="text-sm text-muted-foreground">Tareas Completadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500 rounded border-dashed border border-green-500" />
            <span className="text-sm text-muted-foreground">Tareas Creadas</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Completadas</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, d) => sum + d.completed, 0)}
            </p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Creadas</p>
            <p className="text-2xl font-bold text-green-600">
              {data.reduce((sum, d) => sum + d.created, 0)}
            </p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Promedio Diario</p>
            <p className="text-2xl font-bold text-purple-600">
              {(data.reduce((sum, d) => sum + d.completed, 0) / 30).toFixed(1)}
            </p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Mejor Día</p>
            <p className="text-2xl font-bold text-orange-600">
              {Math.max(...data.map(d => d.completed))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};