import { useState, useMemo, useCallback, useEffect } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { useClientContext } from '@/context/ClientContext';

export interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'client' | 'note';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  projectId?: string;
  clientId?: string;
}

export interface SearchFilters {
  types: ('project' | 'task' | 'client' | 'note')[];
  status?: string[];
  priority?: string[];
}

const defaultFilters: SearchFilters = {
  types: ['project', 'task', 'client', 'note'],
};

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const { projects } = useProjectContext();
  const { clients } = useClientContext();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const addRecentSearch = useCallback((search: string) => {
    if (!search.trim() || search.length < 2) return;
    
    setRecentSearches(prev => {
      const updated = [search, ...prev.filter(s => s !== search)].slice(0, 10);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  }, []);

  // Generate search results
  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    // Search projects
    if (filters.types.includes('project')) {
      projects.forEach(project => {
        if (
          project.name.toLowerCase().includes(searchTerm) ||
          project.description.toLowerCase().includes(searchTerm) ||
          project.status.toLowerCase().includes(searchTerm)
        ) {
          results.push({
            id: project.id,
            type: 'project',
            title: project.name,
            subtitle: `Estado: ${project.status}`,
            description: project.description,
            url: `/projects/${project.id}`,
          });
        }
      });
    }

    // Search tasks
    if (filters.types.includes('task')) {
      projects.forEach(project => {
        project.tasks.forEach(task => {
          if (
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm)) ||
            task.status.toLowerCase().includes(searchTerm) ||
            (task.priority && task.priority.toLowerCase().includes(searchTerm))
          ) {
            results.push({
              id: task.id,
              type: 'task',
              title: task.title,
              subtitle: `${project.name} - ${task.status}`,
              description: task.description,
              url: `/projects/${project.id}?tab=tasks`,
              projectId: project.id,
            });
          }
        });
      });
    }

    // Search clients
    if (filters.types.includes('client')) {
      clients.forEach(client => {
        if (
          client.name.toLowerCase().includes(searchTerm) ||
          (client.email && client.email.toLowerCase().includes(searchTerm)) ||
          (client.company && client.company.toLowerCase().includes(searchTerm)) ||
          (client.phone && client.phone.toLowerCase().includes(searchTerm))
        ) {
          results.push({
            id: client.id,
            type: 'client',
            title: client.name,
            subtitle: client.company || client.email || '',
            description: `${client.email || ''} ${client.phone || ''}`.trim(),
            url: `/clients/${client.id}`,
            clientId: client.id,
          });
        }
      });
    }

    // Search notes
    if (filters.types.includes('note')) {
      projects.forEach(project => {
        project.notes.forEach(note => {
          if (
            (note.title && note.title.toLowerCase().includes(searchTerm)) ||
            note.content.toLowerCase().includes(searchTerm)
          ) {
            results.push({
              id: note.id,
              type: 'note',
              title: note.title || 'Nota sin título',
              subtitle: `${project.name}`,
              description: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
              url: `/projects/${project.id}?tab=notes`,
              projectId: project.id,
            });
          }
        });
      });
    }

    // Apply additional filters
    if (filters.status && filters.status.length > 0) {
      return results.filter(result => {
        if (result.type === 'project') {
          const project = projects.find(p => p.id === result.id);
          return project && filters.status!.includes(project.status);
        }
        if (result.type === 'task') {
          const project = projects.find(p => p.id === result.projectId);
          const task = project?.tasks.find(t => t.id === result.id);
          return task && filters.status!.includes(task.status);
        }
        return true;
      });
    }

    if (filters.priority && filters.priority.length > 0) {
      return results.filter(result => {
        if (result.type === 'task') {
          const project = projects.find(p => p.id === result.projectId);
          const task = project?.tasks.find(t => t.id === result.id);
          return task && task.priority && filters.priority!.includes(task.priority);
        }
        return true;
      });
    }

    return results.slice(0, 50); // Limit results
  }, [query, filters, projects, clients]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const grouped = {
      project: searchResults.filter(r => r.type === 'project'),
      task: searchResults.filter(r => r.type === 'task'),
      client: searchResults.filter(r => r.type === 'client'),
      note: searchResults.filter(r => r.type === 'note'),
    };
    return grouped;
  }, [searchResults]);

  // Search suggestions based on content
  const suggestions = useMemo(() => {
    if (query.length < 1) return [];

    const suggestions = new Set<string>();
    const searchTerm = query.toLowerCase();

    // Project names and statuses
    projects.forEach(project => {
      if (project.name.toLowerCase().startsWith(searchTerm)) {
        suggestions.add(project.name);
      }
      if (project.status.toLowerCase().startsWith(searchTerm)) {
        suggestions.add(project.status);
      }
    });

    // Client names and companies
    clients.forEach(client => {
      if (client.name.toLowerCase().startsWith(searchTerm)) {
        suggestions.add(client.name);
      }
      if (client.company && client.company.toLowerCase().startsWith(searchTerm)) {
        suggestions.add(client.company);
      }
    });

    // Task titles and priorities
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.title.toLowerCase().startsWith(searchTerm)) {
          suggestions.add(task.title);
        }
        if (task.priority && task.priority.toLowerCase().startsWith(searchTerm)) {
          suggestions.add(task.priority);
        }
      });
    });

    return Array.from(suggestions).slice(0, 8);
  }, [query, projects, clients]);

  // Search functions
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    addRecentSearch(searchQuery);
  }, [addRecentSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    // State
    query,
    filters,
    recentSearches,
    
    // Results
    searchResults,
    groupedResults,
    suggestions,
    
    // Actions
    search,
    setQuery,
    clearSearch,
    updateFilters,
    resetFilters,
    addRecentSearch,
    clearRecentSearches,
    
    // Stats
    totalResults: searchResults.length,
    hasResults: searchResults.length > 0,
    isSearching: query.length >= 2,
  };
};