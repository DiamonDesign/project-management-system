import React, { useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectContext } from "@/context/ProjectContext";
import { useClientContext } from "@/context/ClientContext";
import { useSession } from "@/hooks/useSession";
import { Navigate } from "react-router-dom";
import {
  LayoutGrid,
  List,
  Search,
  X,
  RotateCcw,
  Archive,
  ArchiveRestore,
  Trash2,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { PROJECT_TYPE_CONFIG } from "@/types/index";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ArchivedProjects = () => {
  const {
    archivedProjects,
    unarchiveProject,
    deleteProject,
    isLoadingProjects
  } = useProjectContext();
  const { clients, isLoadingClients } = useClientContext();
  const { session, isLoading: isLoadingSession } = useSession();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Transform clients data for filters
  const clientsForFilters = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email
  }));

  if (isLoadingSession || isLoadingProjects || isLoadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Filter projects based on search term
  const filteredProjects = archivedProjects.filter(project => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.clientName?.toLowerCase().includes(searchLower) ||
      false
    );
  });

  const handleUnarchive = async (projectId: string) => {
    await unarchiveProject(projectId);
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar definitivamente este proyecto? Esta acción no se puede deshacer.')) {
      await deleteProject(projectId);
    }
  };

  const ArchivedProjectCard = ({ project }: { project: any }) => {
    const archivedDate = project.archived_at ? format(new Date(project.archived_at), "PPP", { locale: es }) : '';

    if (viewMode === 'list') {
      return (
        <div className="group border-b border-border hover:bg-muted/30 transition-all duration-200">
          <div className="px-4 py-3">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Project Name and Description */}
              <div className="col-span-4 min-w-0">
                <h3 className="font-medium text-base truncate mb-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
                {archivedDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Archivado: {archivedDate}
                  </p>
                )}
              </div>

              {/* Type Badge */}
              <div className="col-span-2 flex justify-center">
                {project.project_type && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1 text-xs border-0 whitespace-nowrap",
                      PROJECT_TYPE_CONFIG[project.project_type]?.color || "bg-gray-50 text-gray-800"
                    )}
                  >
                    <span>{PROJECT_TYPE_CONFIG[project.project_type]?.icon}</span>
                    {PROJECT_TYPE_CONFIG[project.project_type]?.name}
                  </Badge>
                )}
              </div>

              {/* Client */}
              <div className="col-span-2 text-center hidden md:block">
                {project.clientName && (
                  <span className="text-sm text-muted-foreground">
                    {project.clientName}
                  </span>
                )}
              </div>

              {/* Status - Archived Badge */}
              <div className="col-span-2 flex justify-center">
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Archive className="h-3 w-3" />
                  Archivado
                </Badge>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnarchive(project.id)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <ArchiveRestore className="h-4 w-4 mr-1" />
                  Desarchivar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Card view
    return (
      <div className="bg-card rounded-lg border p-6 space-y-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="ml-2 flex-shrink-0">
            <Archive className="h-3 w-3 mr-1" />
            Archivado
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.project_type && (
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1 text-xs border-0",
                PROJECT_TYPE_CONFIG[project.project_type]?.color || "bg-gray-50 text-gray-800"
              )}
            >
              <span>{PROJECT_TYPE_CONFIG[project.project_type]?.icon}</span>
              {PROJECT_TYPE_CONFIG[project.project_type]?.name}
            </Badge>
          )}
          {project.clientName && (
            <Badge variant="outline" className="text-xs">
              👤 {project.clientName}
            </Badge>
          )}
        </div>

        {archivedDate && (
          <p className="text-xs text-muted-foreground">
            Archivado el {archivedDate}
          </p>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnarchive(project.id)}
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <ArchiveRestore className="h-4 w-4 mr-1" />
            Desarchivar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(project.id)}
            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Proyectos Archivados</h1>
          <p className="text-muted-foreground">
            Gestiona todos tus proyectos archivados desde un solo lugar
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Toggle
              pressed={viewMode === 'grid'}
              onPressedChange={() => setViewMode('grid')}
              size="sm"
              aria-label="Vista de tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={viewMode === 'list'}
              onPressedChange={() => setViewMode('list')}
              size="sm"
              aria-label="Vista de lista"
            >
              <List className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos archivados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Mostrando <span className="font-medium text-foreground">{filteredProjects.length}</span>
            {filteredProjects.length !== archivedProjects.length && (
              <span> de <span className="font-medium text-foreground">{archivedProjects.length}</span></span>
            )} proyectos archivados
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {archivedProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay proyectos archivados</h3>
            <p className="mt-2 text-muted-foreground">
              Los proyectos que archives aparecerán aquí
            </p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold">No se encontraron proyectos</h3>
            <p className="mt-2 text-muted-foreground">
              Prueba ajustando la búsqueda para encontrar lo que buscas
            </p>
          </div>
        </div>
      ) : (
        <React.Fragment>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <ArchivedProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              {/* List Header */}
              <div className="border-b border-border bg-muted/30">
                <div className="px-4 py-3">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground items-center">
                    <div className="col-span-4 min-w-0">
                      Proyecto
                    </div>
                    <div className="col-span-2 text-center">
                      Tipo
                    </div>
                    <div className="col-span-2 text-center hidden md:block">
                      Cliente
                    </div>
                    <div className="col-span-2 text-center">
                      Estado
                    </div>
                    <div className="col-span-2 text-center">
                      Acciones
                    </div>
                  </div>
                </div>
              </div>

              {/* List Items */}
              {filteredProjects.map((project, index) => (
                <div key={project.id}>
                  <ArchivedProjectCard project={project} />
                  {index < filteredProjects.length - 1 && (
                    <div className="border-b border-border" />
                  )}
                </div>
              ))}
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default ArchivedProjects;