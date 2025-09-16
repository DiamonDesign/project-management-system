import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  X,
  FileText,
  Briefcase,
  User
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Proposal } from "@/types/proposals";

interface ProposalsNotificationsProps {
  proposals?: Proposal[];
  onApprove?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  onMarkAsReviewed?: (proposalId: string) => void;
  isLoading?: boolean;
}

export const ProposalsNotifications: React.FC<ProposalsNotificationsProps> = ({
  proposals = [],
  onApprove,
  onReject,
  onMarkAsReviewed,
  isLoading = false
}) => {
  // Mock data for demonstration - this will be replaced with real data from Supabase
  const mockProposals: Proposal[] = [
    {
      id: "1",
      type: "task",
      title: "Rediseño del botón de login",
      description: "El botón actual no es muy visible, necesitamos uno más llamativo con mejor UX",
      status: "pending",
      client_id: "client-1",
      project_id: "proj-1",
      designer_id: "designer-1",
      task_priority: "high",
      task_due_date: "2024-01-20",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      type: "project",
      title: "Rediseño completo de dashboard analytics",
      description: "Necesitamos un dashboard más moderno con mejores visualizaciones de datos y mejor UX para nuestros usuarios",
      status: "pending",
      client_id: "client-2",
      designer_id: "designer-1",
      project_type: "web",
      project_budget: "€8,000 - €12,000",
      project_timeline: "3-4 meses",
      created_at: "2024-01-14T15:30:00Z",
      updated_at: "2024-01-14T15:30:00Z",
    },
    {
      id: "3",
      type: "task",
      title: "Optimizar iconografía mobile",
      description: "Los iconos en mobile se ven muy pequeños, necesitamos optimizarlos",
      status: "in_review",
      client_id: "client-1",
      project_id: "proj-2",
      designer_id: "designer-1",
      task_priority: "medium",
      created_at: "2024-01-13T09:15:00Z",
      updated_at: "2024-01-13T09:15:00Z",
    }
  ];

  const displayProposals = proposals.length > 0 ? proposals : mockProposals;
  const pendingProposals = displayProposals.filter(p => p.status === 'pending');
  const inReviewProposals = displayProposals.filter(p => p.status === 'in_review');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-500';
      case 'in_review': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_review': return 'En Revisión';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return 'Desconocido';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleApprove = (proposalId: string) => {
    onApprove?.(proposalId);
  };

  const handleReject = (proposalId: string) => {
    onReject?.(proposalId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Propuestas de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Propuestas de Clientes
          </div>
          {pendingProposals.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingProposals.length} nuevas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayProposals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay propuestas pendientes</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {displayProposals.map((proposal) => (
                <div key={proposal.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        {proposal.type === 'task' ? (
                          <FileText className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Briefcase className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{proposal.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(proposal.status)}`} />
                          <span className="text-xs text-gray-600">{getStatusText(proposal.status)}</span>
                          <Badge variant="outline" className="text-xs">
                            {proposal.type === 'task' ? 'Tarea' : 'Proyecto'}
                          </Badge>
                          {proposal.task_priority && (
                            <Badge variant={getPriorityColor(proposal.task_priority)} className="text-xs">
                              {proposal.task_priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(proposal.created_at), "d MMM", { locale: es })}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {proposal.description}
                  </p>

                  {proposal.type === 'project' && (
                    <div className="text-xs text-gray-600 mb-3 space-y-1">
                      {proposal.project_type && <div>Tipo: {proposal.project_type}</div>}
                      {proposal.project_budget && <div>Presupuesto: {proposal.project_budget}</div>}
                      {proposal.project_timeline && <div>Timeline: {proposal.project_timeline}</div>}
                    </div>
                  )}

                  {proposal.type === 'task' && proposal.task_due_date && (
                    <div className="text-xs text-gray-600 mb-3">
                      Fecha deseada: {format(new Date(proposal.task_due_date), "d 'de' MMMM", { locale: es })}
                    </div>
                  )}

                  {proposal.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(proposal.id)}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleReject(proposal.id)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {proposal.status === 'in_review' && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span>En proceso de revisión</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};