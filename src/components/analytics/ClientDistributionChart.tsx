import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Project } from '@/context/ProjectContext';
import { Client } from '@/context/ClientContext';
import { Badge } from '@/components/ui/badge';

interface ClientDistributionChartProps {
  projects: Project[];
  clients: Client[];
}

export const ClientDistributionChart: React.FC<ClientDistributionChartProps> = ({ 
  projects, 
  clients 
}) => {
  const data = React.useMemo(() => {
    // Count projects per client
    const clientProjectCount = projects.reduce((acc, project) => {
      const clientId = project.client_id || 'no-client';
      acc[clientId] = (acc[clientId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Map to client names and sort by project count
    const clientData = Object.entries(clientProjectCount)
      .map(([clientId, projectCount]) => {
        if (clientId === 'no-client') {
          return {
            id: 'no-client',
            name: 'Sin Cliente',
            projects: projectCount,
            active: projects.filter(p => !p.client_id && p.status === 'in-progress').length,
            completed: projects.filter(p => !p.client_id && p.status === 'completed').length,
          };
        }
        
        const client = clients.find(c => c.id === clientId);
        if (!client) return null;

        return {
          id: clientId,
          name: client.name.length > 12 ? client.name.substring(0, 12) + '...' : client.name,
          fullName: client.name,
          company: client.company,
          projects: projectCount,
          active: projects.filter(p => p.client_id === clientId && p.status === 'in-progress').length,
          completed: projects.filter(p => p.client_id === clientId && p.status === 'completed').length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.projects - a!.projects)
      .slice(0, 10) as Array<{
        id: string;
        name: string;
        fullName?: string;
        company?: string;
        projects: number;
        active: number;
        completed: number;
      }>;

    return clientData;
  }, [projects, clients]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 min-w-48">
          <p className="font-medium">{data.fullName || data.name}</p>
          {data.company && (
            <p className="text-sm text-muted-foreground">{data.company}</p>
          )}
          <div className="mt-2 space-y-1">
            <p className="text-sm">Total: <strong>{data.projects}</strong> proyectos</p>
            <p className="text-sm text-blue-600">Activos: {data.active}</p>
            <p className="text-sm text-green-600">Completados: {data.completed}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos de clientes para mostrar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Distribución por Cliente</CardTitle>
        <Badge variant="outline" className="text-xs">
          Top {data.length} clientes
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs fill-muted-foreground" />
              <YAxis 
                type="category" 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="completed" 
                stackId="a" 
                fill="#10b981" 
                name="Completados"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="active" 
                stackId="a" 
                fill="#3b82f6" 
                name="Activos"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clients Summary */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Resumen de Clientes Principales</h4>
          <div className="space-y-2">
            {data.slice(0, 5).map((client, index) => {
              const completionRate = client.projects > 0 
                ? ((client.completed / client.projects) * 100).toFixed(0)
                : '0';
                
              return (
                <div 
                  key={client.id} 
                  className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{client.fullName || client.name}</p>
                      {client.company && (
                        <p className="text-xs text-muted-foreground">{client.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{client.projects} proyectos</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs h-5">
                        {completionRate}% completado
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-sm text-muted-foreground">Activos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-sm text-muted-foreground">Completados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};