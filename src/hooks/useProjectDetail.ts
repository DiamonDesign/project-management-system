/**
 * useProjectDetail Hook
 *
 * Specialized hook for fetching complete project data including tasks, notes, and pages.
 * Uses Master-Detail pattern for optimal performance.
 *
 * Usage: const { project, loading, error } = useProjectDetail(projectId);
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Project } from '@/types/shared';
import { logger } from '@/lib/logger';

export interface UseProjectDetailReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProjectDetail(projectId: string | undefined): UseProjectDetailReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      logger.log('[useProjectDetail] Fetching project detail', { projectId: id });

      const { data, error: fetchError } = await supabase
        .from("projects")
        .select(`
          *,
          clients (
            id,
            name,
            email,
            company
          ),
          tasks (
            id,
            title,
            description,
            status,
            priority,
            start_date,
            end_date,
            is_daily_task,
            created_at
          )
        `)
        .eq("id", id)
        .single();

      if (fetchError) {
        logger.error('[useProjectDetail] Fetch error:', fetchError);
        throw fetchError;
      }

      if (data) {
        // Transform data to match Project interface
        const transformedProject: Project = {
          ...data,
          dueDate: data.due_date,
          clientName: data.clients?.[0]?.name || null,
          clientEmail: data.clients?.[0]?.email || null,
          clientCompany: data.clients?.[0]?.company || null,
          // CRITICAL: Always ensure arrays exist
          tasks: Array.isArray(data.tasks) ? data.tasks.map(task => ({
            ...task,
            projectId: data.id,
            projectName: data.name
          })) : [],
          notes: [], // Legacy support - will be populated separately if needed
          pages: []  // New system - will be populated separately if needed
        };

        logger.log('[useProjectDetail] Project detail loaded successfully', {
          projectId: id,
          taskCount: transformedProject.tasks.length,
          projectName: transformedProject.name
        });

        setProject(transformedProject);
      } else {
        setProject(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('[useProjectDetail] Error fetching project detail:', err);
      setError(errorMessage);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  // Refetch function for manual refresh
  const refetch = () => {
    if (projectId) {
      fetchProjectDetail(projectId);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const loadProject = async () => {
      if (!projectId) {
        setProject(null);
        setLoading(false);
        setError('No project ID provided');
        return;
      }

      await fetchProjectDetail(projectId);

      // Check if component was unmounted during fetch
      if (isCancelled) {
        return;
      }
    };

    loadProject();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  return {
    project,
    loading,
    error,
    refetch
  };
}