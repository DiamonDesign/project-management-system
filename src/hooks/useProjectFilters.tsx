import { useState, useMemo, useCallback } from 'react';
import { type Project, type ProjectType, type ProjectStatus } from '@/types/index';
import { type ProjectFilters, type Client } from '@/components/ProjectFilters';

interface UseProjectFiltersProps {
  projects: Project[];
  clients: Client[];
}

export function useProjectFilters({ projects, clients }: UseProjectFiltersProps) {
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    types: [],
    statuses: [],
    clientIds: [],
    dateRange: { from: null, to: null },
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Filter and sort projects based on current filters
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
      );
    }

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(project => 
        project.project_type && filters.types.includes(project.project_type)
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(project => 
        filters.statuses.includes(project.status)
      );
    }

    // Client filter
    if (filters.clientIds.length > 0) {
      filtered = filtered.filter(project => 
        project.client_id && filters.clientIds.includes(project.client_id)
      );
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.created_at);
        
        if (filters.dateRange.from && projectDate < filters.dateRange.from) {
          return false;
        }
        
        if (filters.dateRange.to && projectDate > filters.dateRange.to) {
          return false;
        }
        
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || a.created_at);
          bValue = new Date(b.updated_at || b.created_at);
          break;
        case 'status': {
          const statusOrder = { 'in-progress': 0, 'pending': 1, 'on-hold': 2, 'completed': 3 } as const;
          aValue = statusOrder[a.status] ?? 999;
          bValue = statusOrder[b.status] ?? 999;
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, filters]);

  // Update filters handler
  const updateFilters = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
  }, []);

  // Quick filter methods
  const filterByType = useCallback((type: ProjectType) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type) 
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  }, []);

  const filterByStatus = useCallback((status: ProjectStatus) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  }, []);

  const filterByClient = useCallback((clientId: string) => {
    setFilters(prev => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter(id => id !== clientId)
        : [...prev.clientIds, clientId]
    }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      types: [],
      statuses: [],
      clientIds: [],
      dateRange: { from: null, to: null },
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const typeStats = projects.reduce((acc, project) => {
      if (project.project_type) {
        acc[project.project_type] = (acc[project.project_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<ProjectType, number>);

    const statusStats = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<ProjectStatus, number>);

    const clientStats = projects.reduce((acc, project) => {
      if (project.client_id) {
        acc[project.client_id] = (acc[project.client_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return { typeStats, statusStats, clientStats };
  }, [projects]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search || 
           filters.types.length > 0 || 
           filters.statuses.length > 0 || 
           filters.clientIds.length > 0 || 
           filters.dateRange.from || 
           filters.dateRange.to;
  }, [filters]);

  return {
    filters,
    filteredProjects,
    updateFilters,
    filterByType,
    filterByStatus,
    filterByClient,
    setSearch,
    clearFilters,
    stats,
    hasActiveFilters,
    totalCount: projects.length,
    filteredCount: filteredProjects.length
  };
}