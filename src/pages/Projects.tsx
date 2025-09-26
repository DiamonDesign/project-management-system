import React, { useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { ProjectTypeFilter } from "@/components/filters/ProjectTypeFilter";
import { ProjectStatusFilter } from "@/components/filters/ProjectStatusFilter";
import { ProjectClientFilter } from "@/components/filters/ProjectClientFilter";
import { ProjectSortFilter } from "@/components/filters/ProjectSortFilter";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProjectContext } from "@/context/ProjectContext";
import { useClientContext } from "@/context/ClientContext";
import { useSession } from "@/hooks/useSession";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List, Search, X, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogTrigger, Dialog } from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";
import { PROJECT_TYPE_CONFIG } from "@/types/index";

const Projects = () => {
  const { projects, addProject, archiveProject, isLoadingProjects } = useProjectContext();
  const { clients, isLoadingClients } = useClientContext();
  const { session, isLoading: isLoadingSession } = useSession();
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Transform clients data for the filters component
  const clientsForFilters = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email
  }));

  // Use the project filters hook
  const {
    filters,
    filteredProjects,
    updateFilters,
    totalCount,
    filteredCount,
    hasActiveFilters
  } = useProjectFilters({ 
    projects, 
    clients: clientsForFilters 
  });

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

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona todos tus proyectos desde un solo lugar
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

          {/* Add Project Button */}
          <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 relative flex items-center justify-center pl-9 pr-4 whitespace-nowrap text-sm font-medium">
                {/* Icono absoluto a la izquierda */}
                <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                
                {/* Texto centrado */}
                <span className="text-sm font-medium">Nuevo Proyecto</span>
              </Button>
            </DialogTrigger>
            <AddProjectDialog
              open={isAddProjectDialogOpen}
              onOpenChange={setIsAddProjectDialogOpen}
              onAddProject={addProject}
            />
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Filter Buttons Row */}
        <div className="w-full">
          <div className="grid grid-cols-5 gap-3 w-full">
            <ProjectTypeFilter
              selectedTypes={filters.types}
              onChange={(types) => updateFilters({ ...filters, types })}
            />
            
            <ProjectStatusFilter
              selectedStatuses={filters.statuses}
              onChange={(statuses) => updateFilters({ ...filters, statuses })}
            />
            
            <ProjectClientFilter
              clients={clientsForFilters}
              selectedClientIds={filters.clientIds}
              onChange={(clientIds) => updateFilters({ ...filters, clientIds })}
            />
            
            <ProjectSortFilter
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSortByChange={(sortBy) => updateFilters({ ...filters, sortBy })}
              onSortOrderChange={(sortOrder) => updateFilters({ ...filters, sortOrder })}
            />

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos..."
                value={filters.search}
                onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 w-full h-10"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => updateFilters({ ...filters, search: '' })}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({
                search: '',
                types: [],
                statuses: [],
                clientIds: [],
                dateRange: { from: null, to: null },
                sortBy: 'created_at',
                sortOrder: 'desc'
              })}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            
            {/* Search Filter Badge */}
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                "{filters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => updateFilters({ ...filters, search: '' })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {/* Type Filter Badges */}
            {filters.types.map((type) => (
              <Badge key={type} variant="secondary" className="gap-1">
                <span>{PROJECT_TYPE_CONFIG[type as keyof typeof PROJECT_TYPE_CONFIG]?.icon}</span>
                {PROJECT_TYPE_CONFIG[type as keyof typeof PROJECT_TYPE_CONFIG]?.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => {
                    const newTypes = filters.types.filter((t) => t !== type);
                    updateFilters({ ...filters, types: newTypes });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {/* Status Filter Badges */}
            {filters.statuses.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1">
                {status === 'pending' && '⏳'}
                {status === 'in-progress' && '🔄'}
                {status === 'completed' && '✅'}
                {status === 'on-hold' && '⏸️'}
                {status === 'pending' && 'Pendiente'}
                {status === 'in-progress' && 'En Progreso'}
                {status === 'completed' && 'Completado'}
                {status === 'on-hold' && 'En Pausa'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => {
                    const newStatuses = filters.statuses.filter((s) => s !== status);
                    updateFilters({ ...filters, statuses: newStatuses });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {/* Client Filter Badges */}
            {filters.clientIds.map((clientId) => {
              const client = clientsForFilters.find((c) => c.id === clientId);
              return client ? (
                <Badge key={clientId} variant="secondary" className="gap-1">
                  👤 {client.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => {
                      const newClientIds = filters.clientIds.filter((id) => id !== clientId);
                      updateFilters({ ...filters, clientIds: newClientIds });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ) : null;
            })}
          </div>
        )}

        {/* Results Count */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Mostrando <span className="font-medium text-foreground">{filteredCount}</span>
            {filteredCount !== totalCount && (
              <span> de <span className="font-medium text-foreground">{totalCount}</span></span>
            )} proyectos
          </div>
        </div>

      {/* Projects Grid/List */}
      {totalCount === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay proyectos</h3>
            <p className="mt-2 text-muted-foreground">
              Comienza creando tu primer proyecto para organizar tu trabajo
            </p>
            <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 relative pl-9 pr-3">
                  <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                  <span>Crear primer proyecto</span>
                </Button>
              </DialogTrigger>
              <AddProjectDialog
                open={isAddProjectDialogOpen}
                onOpenChange={setIsAddProjectDialogOpen}
                onAddProject={addProject}
              />
            </Dialog>
          </div>
        </div>
      ) : filteredCount === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold">No se encontraron proyectos</h3>
            <p className="mt-2 text-muted-foreground">
              Prueba ajustando los filtros para encontrar lo que buscas
            </p>
          </div>
        </div>
      ) : (
        <React.Fragment>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant="card"
                  onArchive={(project) => archiveProject(project.id)}
                />
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
                    <div className="col-span-1 text-center">
                      Tipo
                    </div>
                    <div className="col-span-1 text-center">
                      Estado
                    </div>
                    <div className="col-span-3 text-center hidden sm:block">
                      Progreso
                    </div>
                    <div className="col-span-2 text-center hidden md:block">
                      Fecha
                    </div>
                    <div className="col-span-1 text-center">
                      {/* Actions column */}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* List Items */}
              {filteredProjects.map((project, index) => (
                <div key={project.id}>
                  <ProjectCard
                    project={project}
                    variant="list"
                    onArchive={(project) => archiveProject(project.id)}
                  />
                  {index < filteredProjects.length - 1 && (
                    <div className="border-b border-border" />
                  )}
                </div>
              ))}
            </div>
          )}
        </React.Fragment>
      )}

      <MadeWithDyad />
    </div>
  );
};

export default Projects;