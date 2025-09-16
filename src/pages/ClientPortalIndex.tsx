import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Calendar,
  Clock,
  Eye,
  ArrowRight,
  Filter,
  Grid3X3,
  List,
  Star,
  MessageSquare,
  Download,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const ClientPortalIndex = () => {
  const { clientId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [projectProposalOpen, setProjectProposalOpen] = useState(false);
  const [projectProposal, setProjectProposal] = useState({
    name: "",
    description: "",
    type: "",
    budget: "",
    timeline: ""
  });
  const { toast } = useToast();

  // Mock data - esto se conectará a Supabase después
  const client = {
    id: clientId,
    name: "TechCorp SA",
    contact: "Juan Pérez",
    email: "juan.perez@techcorp.com",
    logo: "/placeholder-logo.jpg"
  };

  const designer = {
    name: "María González",
    email: "maria@visionday.design",
    avatar: "/placeholder-avatar.jpg",
    specialties: ["UI/UX Design", "Mobile Apps", "Design Systems"]
  };

  const projects = [
    {
      id: "proj-1",
      name: "Rediseño de Aplicación Móvil",
      description: "Rediseño completo de la aplicación móvil con enfoque en UX mejorada",
      status: "in-progress",
      progress: 65,
      startDate: "2024-01-15",
      dueDate: "2024-03-30",
      budget: "€12,000",
      deliverables: 4,
      completedDeliverables: 2,
      lastActivity: "2 horas ago",
      priority: "high",
      type: "Mobile App"
    },
    {
      id: "proj-2", 
      name: "Sistema de Design System",
      description: "Creación de design system corporativo para toda la plataforma",
      status: "completed",
      progress: 100,
      startDate: "2023-11-01",
      dueDate: "2024-01-15", 
      budget: "€8,500",
      deliverables: 6,
      completedDeliverables: 6,
      lastActivity: "3 semanas ago",
      priority: "medium",
      type: "Design System"
    },
    {
      id: "proj-3",
      name: "Landing Page Corporativa",
      description: "Nueva landing page para productos B2B con focus en conversión",
      status: "pending",
      progress: 0,
      startDate: "2024-04-01",
      dueDate: "2024-05-15",
      budget: "€5,200",
      deliverables: 3,
      completedDeliverables: 0,
      lastActivity: "Sin actividad",
      priority: "low",
      type: "Web Design"
    },
    {
      id: "proj-4",
      name: "Dashboard Analytics V2",
      description: "Rediseño del dashboard de analytics con nuevas métricas",
      status: "in-progress",
      progress: 30,
      startDate: "2024-02-15",
      dueDate: "2024-04-30",
      budget: "€9,800",
      deliverables: 5,
      completedDeliverables: 1,
      lastActivity: "1 día ago",
      priority: "high",
      type: "Dashboard"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-blue-500";
      case "pending": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completado";
      case "in-progress": return "En Progreso";
      case "pending": return "Pendiente";
      default: return "Desconocido";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && project.status === "in-progress") ||
                         (statusFilter === "completed" && project.status === "completed");
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "in-progress").length,
    completed: projects.filter(p => p.status === "completed").length,
    pending: projects.filter(p => p.status === "pending").length
  };

  const handleProjectProposalSubmit = () => {
    if (!projectProposal.name.trim() || !projectProposal.description.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    // TODO: Enviar propuesta a Supabase
    
    toast({
      title: "Propuesta enviada",
      description: "Tu propuesta de proyecto ha sido enviada para revisión",
    });

    setProjectProposalOpen(false);
    setProjectProposal({
      name: "",
      description: "",
      type: "",
      budget: "",
      timeline: ""
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Portal de Cliente</h1>
                  <p className="text-xl text-gray-600">{client.name}</p>
                  <p className="text-sm text-gray-500">{client.contact} • {client.email}</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Proyectos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                  <div className="text-sm text-gray-600">En Progreso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-gray-600">Completados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
                  <div className="text-sm text-gray-600">Pendientes</div>
                </div>
              </div>
            </div>

            {/* Designer Info */}
            <Card className="w-80">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={designer.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {designer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{designer.name}</h3>
                    <p className="text-sm text-gray-600">Tu Diseñadora UI/UX</p>
                    <p className="text-xs text-blue-600">{designer.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {designer.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Activos
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Completados
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={projectProposalOpen} onOpenChange={setProjectProposalOpen}>
              <DialogTrigger asChild>
                <Button className="mr-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Proponer Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Proponer Nuevo Proyecto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Nombre del proyecto *</Label>
                    <Input
                      id="project-name"
                      placeholder="Ej: Rediseño de sitio web corporativo"
                      value={projectProposal.name}
                      onChange={(e) => setProjectProposal({...projectProposal, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Descripción *</Label>
                    <Textarea
                      id="project-description"
                      placeholder="Describe el proyecto, objetivos y alcance..."
                      className="min-h-[120px]"
                      value={projectProposal.description}
                      onChange={(e) => setProjectProposal({...projectProposal, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-type">Tipo de proyecto</Label>
                      <select
                        id="project-type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={projectProposal.type}
                        onChange={(e) => setProjectProposal({...projectProposal, type: e.target.value})}
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="web">Diseño Web</option>
                        <option value="mobile">Aplicación Móvil</option>
                        <option value="branding">Branding</option>
                        <option value="ux">Experiencia de Usuario</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-timeline">Timeline deseado</Label>
                      <Input
                        id="project-timeline"
                        placeholder="Ej: 2-3 meses"
                        value={projectProposal.timeline}
                        onChange={(e) => setProjectProposal({...projectProposal, timeline: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-budget">Presupuesto estimado</Label>
                    <Input
                      id="project-budget"
                      placeholder="Ej: €5,000 - €10,000"
                      value={projectProposal.budget}
                      onChange={(e) => setProjectProposal({...projectProposal, budget: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setProjectProposalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleProjectProposalSubmit}>
                    Enviar Propuesta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-200 group cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(project.status)}`} />
                        <Badge variant="outline" className="text-xs">
                          {project.type}
                        </Badge>
                        <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                          {project.priority}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{project.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progreso</span>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entregables</span>
                      <span className="font-medium">{project.completedDeliverables}/{project.deliverables}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Presupuesto</span>
                      <span className="font-medium">{project.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entrega</span>
                      <span className="font-medium">{format(new Date(project.dueDate), "d MMM yyyy", { locale: es })}</span>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Última actividad: {project.lastActivity}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link to={`/client-portal/dashboard/${project.id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Proyecto
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(project.status)}`} />
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <Badge variant="outline" className="text-xs">{project.type}</Badge>
                        <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                          {project.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{project.description}</p>
                      
                      <div className="flex items-center gap-8 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{project.completedDeliverables}/{project.deliverables} Entregables</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>{format(new Date(project.dueDate), "d MMM yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span>{project.lastActivity}</span>
                        </div>
                        <div className="font-medium">{project.budget}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">{project.progress}%</div>
                        <Progress value={project.progress} className="h-2 w-20" />
                      </div>
                      <Link to={`/client-portal/dashboard/${project.id}`}>
                        <Button>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Proyecto
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProjects.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No se encontraron proyectos</p>
                <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientPortalIndex;