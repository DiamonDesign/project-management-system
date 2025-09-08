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
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="flex items-center gap-2">
              📄 Páginas
              {totalPages > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalPages})
                </span>
              )}
            </CardTitle>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Página
          </Button>
        </div>
        
        {/* Search and Filter Bar */}
        {hasPages && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar páginas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedPageType}
              onChange={(e) => setSelectedPageType(e.target.value as PageType | 'all')}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background"
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
      </CardHeader>
      
      <CardContent>
        {!hasPages ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <div className="text-2xl">📄</div>
            </div>
            <h3 className="text-lg font-medium mb-2">No hay páginas aún</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crea tu primera página para organizar la información del proyecto
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear primera página
            </Button>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm">
              No se encontraron páginas que coincidan con tu búsqueda
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedPageType('all');
              }}
              className="mt-2"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-6">
              {Object.entries(pagesByType).map(([type, pages]) => {
                if (pages.length === 0) return null;
                
                const typeConfig = PAGE_TYPE_CONFIG[type as PageType];
                
                return (
                  <div key={type} className="space-y-3">
                    {/* Type Header - only show if not filtering by specific type */}
                    {selectedPageType === 'all' && (
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <span>{typeConfig.icon}</span>
                        <span>{typeConfig.name}</span>
                        <span className="text-xs">({pages.length})</span>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>
                    )}
                    
                    {/* Pages Grid */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </ScrollArea>
        )}
      </CardContent>

      {/* Add Page Dialog */}
      <AddPageDialog
        projectId={projectId}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
    </Card>
  );
};