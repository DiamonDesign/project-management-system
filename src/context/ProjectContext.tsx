/**
 * ProjectContext - Refactored for Single Responsibility
 *
 * ONLY handles:
 * - Project CRUD operations
 * - Project status management
 * - Project archiving
 *
 * Does NOT handle:
 * - Tasks (see TaskContext)
 * - Pages (see PageContext)
 * - Notes (see NoteContext)
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { showSuccess, showError } from "@/utils/toast";
import { ProjectFormSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import type { Project, ProjectFormData } from "@/types/shared";

// Simplified Project interface for this context (without nested data)
export interface SimpleProject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  project_type?: 'web' | 'seo' | 'marketing' | 'branding' | 'ecommerce' | 'mobile' | 'task' | 'maintenance' | 'other';
  dueDate?: string;
  client_id?: string | null;
  archived?: boolean;
  archived_at?: string | null;
  // Optimized client data (denormalized for performance)
  clientName?: string | null;
  clientEmail?: string | null;
  clientCompany?: string | null;
  created_at: string;
}

interface ProjectContextType {
  // State
  projects: SimpleProject[];
  archivedProjects: SimpleProject[];
  isLoadingProjects: boolean;

  // Project CRUD operations
  addProject: (projectData: ProjectFormData) => Promise<SimpleProject | null>;
  updateProject: (projectId: string, updatedFields: Partial<SimpleProject> | ProjectFormData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  unarchiveProject: (projectId: string) => Promise<void>;

  // Utility methods
  getProjectById: (projectId: string) => SimpleProject | undefined;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isLoadingSession } = useSession();
  const [projects, setProjects] = useState<SimpleProject[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<SimpleProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch projects from database (projects only, no nested data)
   */
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setArchivedProjects([]);
      setIsLoadingProjects(false);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoadingProjects(true);

      // Fetch projects with client data (left join for performance)
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          clients (
            id,
            name,
            email,
            company
          )
        `)
        .eq("user_id", user.id)
        .abortSignal(abortControllerRef.current.signal);

      if (projectsError) {
        throw projectsError;
      }

      // Transform data to SimpleProject format
      const transformedProjects: SimpleProject[] = (projectsData || []).map(project => ({
        id: project.id,
        user_id: project.user_id,
        name: project.name,
        description: project.description,
        status: project.status,
        project_type: project.project_type,
        dueDate: project.due_date,
        client_id: project.client_id,
        archived: !!project.archived,
        archived_at: project.archived_at,
        clientName: project.clients?.[0]?.name || null,
        clientEmail: project.clients?.[0]?.email || null,
        clientCompany: project.clients?.[0]?.company || null,
        created_at: project.created_at,
      }));

      // Separate active and archived projects
      const activeProjects = transformedProjects.filter(p => !p.archived);
      const archived = transformedProjects.filter(p => p.archived);

      setProjects(activeProjects);
      setArchivedProjects(archived);

      logger.log('ProjectContext', `Loaded ${activeProjects.length} active projects, ${archived.length} archived`);

    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('ProjectContext', 'Failed to fetch projects', error);
        showError("Error al cargar los proyectos");
      }
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user]);

  // Load projects when session is ready
  useEffect(() => {
    if (!isLoadingSession) {
      fetchProjects();
    }
  }, [isLoadingSession, fetchProjects]);

  /**
   * Add new project
   */
  const addProject = useCallback(async (projectData: ProjectFormData): Promise<SimpleProject | null> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para añadir proyectos.");
      return null;
    }

    try {
      const { dueDate, project_type, client_id, ...rest } = projectData;
      const supabaseProject = {
        user_id: user.id,
        ...rest,
        project_type: project_type || null,
        due_date: dueDate === undefined || dueDate === null ? null : dueDate,
        client_id: client_id === "" || client_id === null ? null : client_id,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert(supabaseProject)
        .select(`
          *,
          clients (
            id,
            name,
            email,
            company
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // Transform to SimpleProject
      const newProject: SimpleProject = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        description: data.description,
        status: data.status,
        project_type: data.project_type,
        dueDate: data.due_date,
        client_id: data.client_id,
        archived: false,
        archived_at: null,
        clientName: data.clients?.[0]?.name || null,
        clientEmail: data.clients?.[0]?.email || null,
        clientCompany: data.clients?.[0]?.company || null,
        created_at: data.created_at,
      };

      setProjects(prev => [newProject, ...prev]);
      showSuccess("Proyecto añadido exitosamente.");
      return newProject;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('ProjectContext', 'Failed to add project', error);
      showError("Error al añadir el proyecto: " + errorMessage);
      return null;
    }
  }, [user]);

  /**
   * Update existing project
   */
  const updateProject = useCallback(async (projectId: string, updatedFields: Partial<SimpleProject> | ProjectFormData): Promise<void> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para actualizar proyectos.");
      return;
    }

    try {
      // Transform fields for database
      interface DatabaseFields {
        due_date?: string;
        project_type?: string;
        client_id?: string | null;
        [key: string]: unknown;
      }

      const { dueDate, project_type, client_id, ...rest } = updatedFields as Partial<SimpleProject> & { dueDate?: string; project_type?: string; client_id?: string };
      const updateData: DatabaseFields = { ...rest };

      if (dueDate !== undefined) updateData.due_date = dueDate;
      if (project_type !== undefined) updateData.project_type = project_type;
      if (client_id !== undefined) updateData.client_id = client_id === "" ? null : client_id;

      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Update local state
      const updateProjectInState = (projects: SimpleProject[]) =>
        projects.map(project =>
          project.id === projectId
            ? { ...project, ...updatedFields, dueDate: dueDate || project.dueDate }
            : project
        );

      setProjects(updateProjectInState);
      setArchivedProjects(updateProjectInState);

      showSuccess("Proyecto actualizado exitosamente.");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('ProjectContext', 'Failed to update project', error);
      showError("Error al actualizar el proyecto: " + errorMessage);
    }
  }, [user]);

  /**
   * Delete project permanently
   */
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para eliminar proyectos.");
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Remove from both active and archived
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId));

      showSuccess("Proyecto eliminado exitosamente.");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('ProjectContext', 'Failed to delete project', error);
      showError("Error al eliminar el proyecto: " + errorMessage);
    }
  }, [user]);

  /**
   * Archive project
   */
  const archiveProject = useCallback(async (projectId: string): Promise<void> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para archivar proyectos.");
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("projects")
        .update({
          archived: true,
          archived_at: now,
        })
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Move from active to archived
      setProjects(prev => {
        const projectToArchive = prev.find(p => p.id === projectId);
        if (projectToArchive) {
          const archivedProject = { ...projectToArchive, archived: true, archived_at: now };
          setArchivedProjects(prevArchived => [archivedProject, ...prevArchived]);
        }
        return prev.filter(p => p.id !== projectId);
      });

      showSuccess("Proyecto archivado exitosamente.");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('ProjectContext', 'Failed to archive project', error);
      showError("Error al archivar el proyecto: " + errorMessage);
    }
  }, [user]);

  /**
   * Unarchive project
   */
  const unarchiveProject = useCallback(async (projectId: string): Promise<void> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para desarchivar proyectos.");
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          archived: false,
          archived_at: null,
        })
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Move from archived to active
      setArchivedProjects(prev => {
        const projectToUnarchive = prev.find(p => p.id === projectId);
        if (projectToUnarchive) {
          const activeProject = { ...projectToUnarchive, archived: false, archived_at: null };
          setProjects(prevActive => [activeProject, ...prevActive]);
        }
        return prev.filter(p => p.id !== projectId);
      });

      showSuccess("Proyecto desarchivado exitosamente.");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('ProjectContext', 'Failed to unarchive project', error);
      showError("Error al desarchivar el proyecto: " + errorMessage);
    }
  }, [user]);

  /**
   * Get project by ID
   */
  const getProjectById = useCallback((projectId: string): SimpleProject | undefined => {
    return projects.find(p => p.id === projectId) || archivedProjects.find(p => p.id === projectId);
  }, [projects, archivedProjects]);

  /**
   * Refresh projects manually
   */
  const refreshProjects = useCallback(async (): Promise<void> => {
    await fetchProjects();
  }, [fetchProjects]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const contextValue: ProjectContextType = {
    // State
    projects,
    archivedProjects,
    isLoadingProjects,

    // CRUD operations
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,

    // Utilities
    getProjectById,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

/**
 * Hook to use ProjectContext
 */
export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    // More graceful error handling - provide fallback instead of throwing
    console.warn('useProjectContext called outside of ProjectProvider, providing fallback context');
    return {
      // Fallback context with safe defaults
      projects: [],
      archivedProjects: [],
      isLoadingProjects: false,
      addProject: async () => { console.warn('ProjectContext not available - addProject ignored'); return null; },
      updateProject: async () => { console.warn('ProjectContext not available - updateProject ignored'); },
      deleteProject: async () => { console.warn('ProjectContext not available - deleteProject ignored'); },
      archiveProject: async () => { console.warn('ProjectContext not available - archiveProject ignored'); },
      unarchiveProject: async () => { console.warn('ProjectContext not available - unarchiveProject ignored'); },
      getProjectById: () => undefined,
      refreshProjects: async () => { console.warn('ProjectContext not available - refreshProjects ignored'); },
    };
  }
  return context;
};

// Backward compatibility alias
export const useProject = useProjectContext;

// Export types for external use
export type { SimpleProject as Project, ProjectContextType };
export { ProjectFormSchema };
export type { ProjectFormData };