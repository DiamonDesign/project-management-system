import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { showSuccess, showError } from "@/utils/toast";
import { ProjectFormSchema, type ProjectFormData } from "@/lib/schemas";
import type { Page, PageFormData, PageType } from "@/types";

// Legacy Note interface for backward compatibility
interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string; // Nombre corto de la tarea
  description?: string; // Descripción detallada
  status: 'not-started' | 'in-progress' | 'completed';
  createdAt: string;
  start_date?: string;
  end_date?: string;   // Fecha límite / due date
  is_daily_task?: boolean;
  priority?: 'low' | 'medium' | 'high';
  // Optimized project data (denormalized for performance)
  projectId?: string;
  projectName?: string;
}

// Project interface with both legacy notes and new pages
export interface Project {
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
  notes: Note[]; // Legacy support
  pages?: Page[]; // New pages system
  tasks: Task[];
  created_at: string;
}

// ProjectFormSchema moved to @/lib/schemas to fix Fast Refresh warnings

interface ProjectContextType {
  projects: Project[];
  archivedProjects: Project[];
  isLoadingProjects: boolean;
  addProject: (projectData: ProjectFormData) => Promise<void>;
  updateProject: (projectId: string, updatedFields: Partial<Project> | ProjectFormData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  unarchiveProject: (projectId: string) => Promise<void>;
  // Legacy note methods (backward compatibility)
  addNoteToProject: (projectId: string, title: string, content: string) => Promise<void>;
  deleteNoteFromProject: (projectId: string, noteId: string) => Promise<void>;
  // New page methods
  addPageToProject: (projectId: string, pageData: PageFormData) => Promise<void>;
  updatePageInProject: (projectId: string, pageId: string, updatedFields: Partial<Page>) => Promise<void>;
  deletePageFromProject: (projectId: string, pageId: string) => Promise<void>;
  // Task methods
  addTaskToProject: (projectId: string, title: string, description?: string, start_date?: string, end_date?: string, priority?: Task['priority']) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: string, newStatus: Task['status']) => Promise<void>;
  updateTaskDailyStatus: (projectId: string, taskId: string, isDaily: boolean) => Promise<void>;
  updateTask: (projectId: string, taskId: string, updatedFields: Partial<Task>) => Promise<void>;
  deleteTaskFromProject: (projectId: string, taskId: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isLoadingSession } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  

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
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoadingProjects(true);
    
    try {
      // Optimized query: Join with clients table to avoid N+1 lookups
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:clients(id, name, email, company)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .abortSignal(signal);

      if (error) {
        throw error;
      }

      // Normalize projects with both legacy notes and new pages + optimized client data
      const projectsWithNormalizedData = data.map((project: Record<string, unknown>) => {
        // Safely access client data
        const clientData = project.client as Record<string, unknown> | null;

        return {
          ...project,
          dueDate: project.due_date || null,
          archived: Boolean(project.archived || false),
          archived_at: project.archived_at || null,
          // Add client data directly to avoid N+1 lookups
          clientName: clientData?.name || null,
          clientEmail: clientData?.email || null,
          clientCompany: clientData?.company || null,
          // Legacy notes normalization
          notes: (Array.isArray(project.notes) ? project.notes : []).map((note: Record<string, unknown>) => ({
            id: String(note.id ?? `${Date.now()}-${Math.random()}`),
            title: String(note.title ?? ""),
            content: String(note.content ?? ""),
            createdAt: String(note.createdAt ?? note.created_at ?? new Date().toISOString()),
          })),
          // New pages normalization
          pages: (Array.isArray(project.pages) ? project.pages : []).map((page: Record<string, unknown>) => ({
            id: String(page.id ?? `${Date.now()}-${Math.random()}`),
            title: String(page.title ?? ""),
            content: String(page.content ?? ""),
            project_id: String(project.id),
            page_type: String(page.page_type ?? 'general') as PageType,
            icon: page.icon ? String(page.icon) : undefined,
            is_favorited: Boolean(page.is_favorited ?? false),
            tags: Array.isArray(page.tags) ? page.tags.map(String) : [],
            template_id: page.template_id ? String(page.template_id) : undefined,
            created_at: String(page.created_at ?? new Date().toISOString()),
            updated_at: page.updated_at ? String(page.updated_at) : undefined,
          })),
          // Tasks normalization with project reference for O(1) lookups
          tasks: (Array.isArray(project.tasks) ? project.tasks : []).map((task: Record<string, unknown>) => ({
            id: String(task.id ?? `${Date.now()}-${Math.random()}`),
            title: String(task.title ?? task.description ?? ""),
            description: String(task.description_long ?? task.details ?? task.description ?? ""),
            createdAt: String(task.createdAt ?? task.created_at ?? new Date().toISOString()),
            status: (task.status as Task['status']) || (task.completed ? 'completed' : 'not-started'),
            start_date: task.start_date ? String(task.start_date) : undefined,
            end_date: task.end_date ? String(task.end_date) : undefined,
            is_daily_task: Boolean(task.is_daily_task || false),
            priority: (task.priority as Task['priority']) || 'medium',
            projectId: String(project.id), // Add project reference for efficient lookups
            projectName: String(project.name), // Cache project name to avoid lookups
          })),
        };
      });

      // Separate archived and active projects
      const normalizedProjects = projectsWithNormalizedData as Project[];
      const activeProjects = normalizedProjects.filter(p => !p.archived);
      const archived = normalizedProjects.filter(p => p.archived);

      setProjects(activeProjects);
      setArchivedProjects(archived);
    } catch (error: unknown) {
      // Check if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't show error to user
        return;
      }
      
      console.error("Error fetching projects:", error);
      showError("Error al cargar los proyectos.");
      setProjects([]);
      setArchivedProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoadingSession) {
      fetchProjects();
    }
  }, [isLoadingSession, fetchProjects]);

  const addProject = useCallback(async (projectData: z.infer<typeof ProjectFormSchema>) => {
    if (!user?.id) {
      showError("Debes iniciar sesión para añadir proyectos.");
      return;
    }
    
    try {
      const { dueDate, project_type, client_id, ...rest } = projectData;
      const supabaseProject = {
        user_id: user.id, // Use context user ID directly
        ...rest,
        project_type: project_type || null,
        due_date: dueDate === undefined || dueDate === null ? null : dueDate,
        client_id: client_id === "" || client_id === null ? null : client_id,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert(supabaseProject)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProjects((prev) => [{
        ...data,
        dueDate: data.due_date,
        project_type: data.project_type || undefined,
        archived: false,
        archived_at: null,
        notes: [],
        pages: [],
        tasks: [],
        clientName: null,
        clientEmail: null,
        clientCompany: null,
      } as Project, ...prev]);
      showSuccess("Proyecto añadido exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al añadir el proyecto: " + errorMessage);
      console.error("Error adding project:", error);
      throw error;
    }
  }, [user, setProjects]);

  const updateProject = useCallback(async (projectId: string, updatedFields: Partial<Project> | z.infer<typeof ProjectFormSchema>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar proyectos.");
      return;
    }
    try {
      const fieldsToUpdate: Record<string, unknown> = { ...updatedFields };

      // Transform field names for database
      if ('dueDate' in updatedFields) {
        fieldsToUpdate.due_date = updatedFields.dueDate === undefined || updatedFields.dueDate === null ? null : updatedFields.dueDate;
        delete fieldsToUpdate.dueDate;
      }

      // Handle project_type properly
      if ('project_type' in updatedFields) {
        fieldsToUpdate.project_type = updatedFields.project_type === undefined ? null : updatedFields.project_type;
      }

      // Handle client_id properly (for both form schema and partial project)
      if ('client_id' in updatedFields) {
        const clientId = updatedFields.client_id;
        fieldsToUpdate.client_id = clientId === "" || clientId === null || clientId === undefined ? null : clientId;
      }

      const { error } = await supabase
        .from("projects")
        .update(fieldsToUpdate)
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, ...updatedFields } : project
        )
      );
      showSuccess("Proyecto actualizado exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al actualizar el proyecto: " + errorMessage);
      console.error("Error updating project:", error);
    }
  }, [user, setProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para eliminar proyectos.");
      return;
    }
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      showSuccess("Proyecto eliminado exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al eliminar el proyecto: " + errorMessage);
      console.error("Error deleting project:", error);
    }
  }, [user, setProjects]);

  // Legacy note methods (for backward compatibility)
  const addNoteToProject = useCallback(async (projectId: string, title: string, content: string) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir notas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const newNote: Note = { 
        id: Date.now().toString(), 
        title: title || "", 
        content, 
        createdAt: new Date().toISOString() 
      };
      const updatedNotes = [...project.notes, newNote];

      await updateProject(projectId, { notes: updatedNotes });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, notes: updatedNotes } : p
        )
      );
      showSuccess("Nota añadida.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al añadir la nota: " + errorMessage);
      console.error("Error adding note:", error);
    }
  }, [user, projects, updateProject]);

  const deleteNoteFromProject = useCallback(async (projectId: string, noteId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para eliminar notas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedNotes = project.notes.filter((note) => note.id !== noteId);

      await updateProject(projectId, { notes: updatedNotes });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, notes: updatedNotes } : p
        )
      );
      showSuccess("Nota eliminada.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al eliminar la nota: " + errorMessage);
      console.error("Error deleting note:", error);
    }
  }, [user, projects, updateProject]);

  // New page methods
  const addPageToProject = useCallback(async (projectId: string, pageData: PageFormData) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir páginas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const newPage: Page = {
        id: Date.now().toString(),
        title: pageData.title,
        content: pageData.content,
        project_id: projectId,
        page_type: pageData.page_type,
        icon: pageData.icon,
        is_favorited: false,
        tags: pageData.tags || [],
        created_at: new Date().toISOString(),
      };

      const updatedPages = [...(project.pages || []), newPage];

      await updateProject(projectId, { pages: updatedPages });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, pages: updatedPages } : p
        )
      );
      showSuccess("Página añadida.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al añadir la página: " + errorMessage);
      console.error("Error adding page:", error);
    }
  }, [user, projects, updateProject]);

  const updatePageInProject = useCallback(async (projectId: string, pageId: string, updatedFields: Partial<Page>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar páginas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedPages = (project.pages || []).map((page) =>
        page.id === pageId 
          ? { ...page, ...updatedFields, updated_at: new Date().toISOString() } 
          : page
      );

      await updateProject(projectId, { pages: updatedPages });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, pages: updatedPages } : p
        )
      );
      showSuccess("Página actualizada.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al actualizar la página: " + errorMessage);
      console.error("Error updating page:", error);
    }
  }, [user, projects, updateProject]);

  const deletePageFromProject = useCallback(async (projectId: string, pageId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para eliminar páginas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedPages = (project.pages || []).filter((page) => page.id !== pageId);

      await updateProject(projectId, { pages: updatedPages });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, pages: updatedPages } : p
        )
      );
      showSuccess("Página eliminada.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al eliminar la página: " + errorMessage);
      console.error("Error deleting page:", error);
    }
  }, [user, projects, updateProject]);

  // Task methods (unchanged)
  const addTaskToProject = useCallback(async (
    projectId: string,
    title: string,
    description?: string,
    start_date?: string,
    end_date?: string,
    priority: Task['priority'] = 'medium'
  ) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const newTask: Task = {
        id: Date.now().toString(),
        title,
        description: description || "",
        status: 'not-started',
        createdAt: new Date().toISOString(),
        start_date,
        end_date,
        is_daily_task: false,
        priority,
      };
      const updatedTasks = [...project.tasks, newTask];

      await updateProject(projectId, { tasks: updatedTasks });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tasks: updatedTasks } : p
        )
      );
      showSuccess("Tarea añadida.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al añadir la tarea: " + errorMessage);
      console.error("Error adding task:", error);
    }
  }, [user, projects, updateProject]);

  const updateTaskStatus = useCallback(async (projectId: string, taskId: string, newStatus: Task['status']) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedTasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );

      await updateProject(projectId, { tasks: updatedTasks });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tasks: updatedTasks } : p
        )
      );
      showSuccess("Estado de tarea actualizado.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al actualizar la tarea: " + errorMessage);
      console.error("Error updating task status:", error);
    }
  }, [user, projects, updateProject]);

  const updateTaskDailyStatus = useCallback(async (projectId: string, taskId: string, isDaily: boolean) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedTasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, is_daily_task: isDaily } : task
      );

      await updateProject(projectId, { tasks: updatedTasks });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tasks: updatedTasks } : p
        )
      );
      showSuccess("Estado de tarea diaria actualizado.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al actualizar el estado de tarea diaria: " + errorMessage);
      console.error("Error updating daily task status:", error);
    }
  }, [user, projects, updateProject]);

  const updateTask = useCallback(async (projectId: string, taskId: string, updatedFields: Partial<Task>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedTasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedFields } : task
      );

      await updateProject(projectId, { tasks: updatedTasks });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tasks: updatedTasks } : p
        )
      );
      showSuccess("Tarea actualizada.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al actualizar la tarea: " + errorMessage);
      console.error("Error updating task:", error);
    }
  }, [user, projects, updateProject]);

  const deleteTaskFromProject = useCallback(async (projectId: string, taskId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para eliminar tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedTasks = project.tasks.filter((task) => task.id !== taskId);

      await updateProject(projectId, { tasks: updatedTasks });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, tasks: updatedTasks } : p
        )
      );
      showSuccess("Tarea eliminada.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al eliminar la tarea: " + errorMessage);
      console.error("Error deleting task:", error);
    }
  }, [user, projects, updateProject]);

  // Archive/Unarchive functions
  const archiveProject = useCallback(async (projectId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para archivar proyectos.");
      return;
    }
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Move project from active to archived
      const projectToArchive = projects.find(p => p.id === projectId);
      if (projectToArchive) {
        const archivedProject = {
          ...projectToArchive,
          archived: true,
          archived_at: new Date().toISOString()
        };
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setArchivedProjects(prev => [archivedProject, ...prev]);
      }
      showSuccess("Proyecto archivado exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al archivar el proyecto: " + errorMessage);
      console.error("Error archiving project:", error);
    }
  }, [user, projects, setProjects, setArchivedProjects]);

  const unarchiveProject = useCallback(async (projectId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para desarchivar proyectos.");
      return;
    }
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          archived: false,
          archived_at: null
        })
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Move project from archived to active
      const projectToUnarchive = archivedProjects.find(p => p.id === projectId);
      if (projectToUnarchive) {
        const unarchivedProject = {
          ...projectToUnarchive,
          archived: false,
          archived_at: null
        };
        setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
        setProjects(prev => [unarchivedProject, ...prev]);
      }
      showSuccess("Proyecto desarchivado exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al desarchivar el proyecto: " + errorMessage);
      console.error("Error unarchiving project:", error);
    }
  }, [user, archivedProjects, setProjects, setArchivedProjects]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        archivedProjects,
        isLoadingProjects,
        addProject,
        updateProject,
        deleteProject,
        archiveProject,
        unarchiveProject,
        // Legacy note methods
        addNoteToProject,
        deleteNoteFromProject,
        // New page methods
        addPageToProject,
        updatePageInProject,
        deletePageFromProject,
        // Task methods
        addTaskToProject,
        updateTaskStatus,
        updateTaskDailyStatus,
        updateTask,
        deleteTaskFromProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    // Defensive fallback to prevent crashes - Log error but don't throw
    console.error("useProjectContext called outside ProjectProvider - providing fallback");

    // Return safe fallback values
    return {
      projects: [],
      archivedProjects: [],
      isLoadingProjects: true, // Keep loading true to prevent premature renders
      addProject: async () => { console.warn("ProjectContext not available"); },
      updateProject: async () => { console.warn("ProjectContext not available"); },
      deleteProject: async () => { console.warn("ProjectContext not available"); },
      archiveProject: async () => { console.warn("ProjectContext not available"); },
      unarchiveProject: async () => { console.warn("ProjectContext not available"); },
      addNoteToProject: async () => { console.warn("ProjectContext not available"); },
      deleteNoteFromProject: async () => { console.warn("ProjectContext not available"); },
      addPageToProject: async () => { console.warn("ProjectContext not available"); },
      updatePageInProject: async () => { console.warn("ProjectContext not available"); },
      deletePageFromProject: async () => { console.warn("ProjectContext not available"); },
      addTaskToProject: async () => { console.warn("ProjectContext not available"); },
      updateTaskStatus: async () => { console.warn("ProjectContext not available"); },
      updateTaskDailyStatus: async () => { console.warn("ProjectContext not available"); },
      updateTask: async () => { console.warn("ProjectContext not available"); },
      deleteTaskFromProject: async () => { console.warn("ProjectContext not available"); },
    };
  }
  return context;
};