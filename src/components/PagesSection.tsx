import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProjectContext } from "@/context/ProjectContext";
import { showSuccess, showError } from "@/utils/toast";
import { PAGE_TYPE_CONFIG, type PageType, type Page } from "@/types";
import { PageCard } from "./PageCard";
import { AddPageDialog } from "./AddPageDialog";
import { PageEditor } from "./PageEditor";

interface PagesSectionProps {
  projectId: string;
}

export const PagesSection = ({ projectId }: PagesSectionProps) => {
  const { projects } = useProjectContext();
  const project = projects.find(p => p.id === projectId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPageType, setSelectedPageType] = useState<PageType | 'all'>('all');
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Filter and search pages
  const filteredPages = useMemo(() => {
    const pages = project?.pages || [];
    
    return pages.filter(page => {
      const matchesSearch = !searchQuery || 
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedPageType === 'all' || page.page_type === selectedPageType;
      
      return matchesSearch && matchesType;
    });
  }, [project?.pages, searchQuery, selectedPageType]);

  // Group pages by type for better organization
  const pagesByType = useMemo(() => {
    const grouped: Record<PageType, Page[]> = {
      documentation: [],
      credentials: [],
      specifications: [],
      'meeting-notes': [],
      research: [],
      brainstorming: [],
      checklist: [],
      general: []
    };

    filteredPages.forEach(page => {
      if (grouped[page.page_type]) {
        grouped[page.page_type].push(page);
      } else {
        grouped.general.push(page);
      }
    });

    return grouped;
  }, [filteredPages]);

  const handlePageEdit = (page: Page) => {
    setEditingPage(page);
  };

  const handleCloseEditor = () => {
    setEditingPage(null);
  };

  if (!project) {
    return null;
  }

  // Show page editor if a page is selected for editing
  if (editingPage) {
    return (
      <PageEditor
        projectId={projectId}
        page={editingPage}
        onClose={handleCloseEditor}
      />
    );
  }

  const totalPages = project.pages?.length || 0;
  const hasPages = totalPages > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Documentación</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organiza y gestiona toda la información del proyecto
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="h-10 relative flex items-center justify-center pl-9 pr-4 whitespace-nowrap text-sm font-medium"
        >
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
          <span className="text-sm font-medium">Nuevo Documento</span>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      {hasPages && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <select
            value={selectedPageType}
            onChange={(e) => setSelectedPageType(e.target.value as PageType | 'all')}
            className="px-3 py-2 h-10 text-sm border border-input rounded-md bg-background min-w-[150px]"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(PAGE_TYPE_CONFIG).map(([type, config]) => (
              <option key={type} value={type}>
                {config.icon} {config.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-[400px]">
        {!hasPages ? (
          <div className="text-center py-16 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/5">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 flex items-center justify-center">
              <div className="text-3xl">📚</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Aún no hay documentación</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Crea tu primer documento para organizar notas, especificaciones, credenciales y más información del proyecto
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear primer documento
            </Button>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-muted-foreground/20 rounded-lg">
            <div className="text-muted-foreground text-sm mb-3">
              No se encontraron documentos que coincidan con tu búsqueda
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedPageType('all');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(pagesByType).map(([type, pages]) => {
              if (pages.length === 0) return null;

              const typeConfig = PAGE_TYPE_CONFIG[type as PageType];

              return (
                <div key={type} className="space-y-4">
                  {/* Type Header - only show if not filtering by specific type */}
                  {selectedPageType === 'all' && (
                    <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                      <div className="flex items-center gap-2 text-base font-medium text-foreground">
                        <span className="text-lg">{typeConfig.icon}</span>
                        <span>{typeConfig.name}</span>
                      </div>
                      <div className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground font-medium">
                        {pages.length}
                      </div>
                    </div>
                  )}

                  {/* Pages Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pages.map((page) => (
                      <PageCard
                        key={page.id}
                        page={page}
                        projectId={projectId}
                        onEdit={() => handlePageEdit(page)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Page Dialog */}
      <AddPageDialog
        projectId={projectId}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </div>
  );
};