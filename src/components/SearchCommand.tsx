import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComponentErrorBoundary } from './ErrorBoundary';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Briefcase,
  ListChecks,
  Users,
  StickyNote,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { SearchResult } from '@/types/search';
import { cn } from '@/lib/utils';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  project: Briefcase,
  task: ListChecks,
  client: Users,
  note: StickyNote,
};

const typeLabels = {
  project: 'Proyecto',
  task: 'Tarea',
  client: 'Cliente',
  note: 'Nota',
};

const typeColors = {
  project: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  task: 'bg-green-500/20 text-green-600 border-green-500/30',
  client: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  note: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
};

export const SearchCommand = ({ open, onOpenChange }: SearchCommandProps) => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    query,
    setQuery,
    groupedResults,
    recentSearches,
    suggestions,
    filters,
    updateFilters,
    clearRecentSearches,
    hasResults,
    isSearching,
    totalResults,
  } = useSearch();

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery('');
  }, [navigate, onOpenChange, setQuery]);

  // Handle recent search selection
  const handleRecentSearch = useCallback((searchTerm: string) => {
    setQuery(searchTerm);
  }, [setQuery]);

  // Handle suggestion selection
  const handleSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
  }, [setQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  // Filter toggle functions
  const toggleTypeFilter = useCallback((type: 'project' | 'task' | 'client' | 'note') => {
    updateFilters({
      types: filters.types.includes(type)
        ? filters.types.filter(t => t !== type)
        : [...filters.types, type]
    });
  }, [filters.types, updateFilters]);

  const renderResultItem = useCallback((result: SearchResult) => {
    const Icon = typeIcons[result.type];
    return (
      <CommandItem
        key={`${result.type}-${result.id}`}
        onSelect={() => handleSelect(result)}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <div className={cn("p-1.5 rounded-md border", typeColors[result.type])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{result.title}</span>
            <Badge variant="outline" className="text-xs">
              {typeLabels[result.type]}
            </Badge>
          </div>
          {result.subtitle && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {result.subtitle}
            </p>
          )}
          {result.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1">
              {result.description}
            </p>
          )}
        </div>
      </CommandItem>
    );
  }, [handleSelect]);

  return (
    <ComponentErrorBoundary>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col max-h-[80vh]">
        {/* Header with Search Input */}
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Buscar proyectos, tareas, clientes..."
            value={query}
            onValueChange={setQuery}
            className="border-0 focus:ring-0"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7 text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filtros
            </Button>
            {isSearching && (
              <span className="text-xs text-muted-foreground">
                {totalResults} resultado{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {showFilters && (
            <div className="flex items-center gap-1">
              {Object.entries(typeLabels).map(([type, label]) => (
                <Button
                  key={type}
                  variant={filters.types.includes(type as 'project' | 'task' | 'client' | 'note') ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTypeFilter(type as 'project' | 'task' | 'client' | 'note')}
                  className="h-6 text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <CommandList className="max-h-[60vh] overflow-auto">
          {!isSearching && !hasResults && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <CommandGroup heading="Búsquedas recientes">
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      onSelect={() => handleRecentSearch(search)}
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </CommandItem>
                  ))}
                  <CommandSeparator />
                  <CommandItem
                    onSelect={clearRecentSearches}
                    className="text-muted-foreground px-4 py-2"
                  >
                    Limpiar historial
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Quick Actions */}
              <CommandGroup heading="Acciones rápidas">
                <CommandItem
                  onSelect={() => {
                    navigate('/projects');
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Ver todos los proyectos
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    navigate('/tasks');
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <ListChecks className="h-4 w-4" />
                  Ver todas las tareas
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    navigate('/clients');
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <Users className="h-4 w-4" />
                  Ver todos los clientes
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {/* Search Suggestions */}
          {query.length > 0 && query.length < 2 && suggestions.length > 0 && (
            <CommandGroup heading="Sugerencias">
              {suggestions.map((suggestion, index) => (
                <CommandItem
                  key={`suggestion-${index}`}
                  onSelect={() => handleSuggestion(suggestion)}
                  className="px-4 py-2"
                >
                  <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Search Results */}
          {isSearching && hasResults && (
            <>
              {groupedResults.project.length > 0 && (
                <CommandGroup heading={`Proyectos (${groupedResults.project.length})`}>
                  {groupedResults.project.map(renderResultItem)}
                </CommandGroup>
              )}
              
              {groupedResults.task.length > 0 && (
                <CommandGroup heading={`Tareas (${groupedResults.task.length})`}>
                  {groupedResults.task.map(renderResultItem)}
                </CommandGroup>
              )}
              
              {groupedResults.client.length > 0 && (
                <CommandGroup heading={`Clientes (${groupedResults.client.length})`}>
                  {groupedResults.client.map(renderResultItem)}
                </CommandGroup>
              )}
              
              {groupedResults.note.length > 0 && (
                <CommandGroup heading={`Notas (${groupedResults.note.length})`}>
                  {groupedResults.note.map(renderResultItem)}
                </CommandGroup>
              )}
            </>
          )}

          {/* Empty State */}
          {isSearching && !hasResults && (
            <CommandEmpty className="py-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No se encontraron resultados</p>
                <p className="text-xs text-muted-foreground">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            </CommandEmpty>
          )}
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                ↵
              </kbd>{' '}
              para seleccionar
            </span>
            <span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                ⌘K
              </kbd>{' '}
              para abrir
            </span>
          </div>
          {isSearching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="h-6 text-xs"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>
      </CommandDialog>
    </ComponentErrorBoundary>
  );
};