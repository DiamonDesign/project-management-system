// Search types - moved here to fix Fast Refresh warnings

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

export const defaultFilters: SearchFilters = {
  types: ['project', 'task', 'client', 'note'],
};