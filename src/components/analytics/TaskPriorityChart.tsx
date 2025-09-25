import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Project, Task } from '@/types/shared';
import type { RechartsTooltipProps } from '@/types';

interface TaskPriorityChartProps {
  projects: Project[];
}

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const TaskPriorityChart: React.FC<TaskPriorityChartProps> = ({ projects }) => {
  const data = React.useMemo(() => {
    const allTasks = projects.flatMap(p => p.tasks);
    
    const priorityCount = allTasks.reduce((acc, task) => {
      const priority = task.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityOrder = ['low', 'medium', 'high'];
    
    return priorityOrder.map(priority => ({
      priority: PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS],
      total: priorityCount[priority] || 0,
      completed: allTasks.filter(t => 
        (t.priority || 'medium') === priority && t.status === 'completed'
      ).length,
      pending: allTasks.filter(t => 
        (t.priority || 'medium') === priority && t.status !== 'completed'
      ).length,
    }));
  }, [projects]);

  const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{`Prioridad ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'completed' ? 'Completadas' : 'Pendientes'}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalTasks = data.reduce((sum, item) => sum + item.total, 0);

  if (totalTasks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tareas por Prioridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay tareas para mostrar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas por Prioridad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="priority" 
                className="text-xs fill-muted-foreground"
              />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="completed" 
                stackId="a" 
                fill="#10b981" 
                name="Completadas"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="pending" 
                stackId="a" 
                fill="#f59e0b" 
                name="Pendientes"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {data.map((item, index) => {
            const completionRate = item.total > 0 
              ? ((item.completed / item.total) * 100).toFixed(0)
              : '0';
              
            return (
              <div key={item.priority} className="text-center p-3 border rounded-lg">
                <p className="text-sm font-medium">{item.priority}</p>
                <p className="text-2xl font-bold mt-1">{item.total}</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {item.completed}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    {item.pending}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completionRate}% completado
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};