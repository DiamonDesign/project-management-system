import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { validationSchemas, isValidUuid } from "@/lib/security";
import { useLoadingTimeout } from "@/hooks/useLoadingTimeout";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
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
}

// Project interface with both legacy notes and new pages
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  client_id?: string | null;
  notes: Note[]; // Legacy support
  pages?: Page[]; // New pages system
  tasks: Task[];
  created_at: string;
}

export const ProjectFormSchema = z.object({
  name: validationSchemas.projectTitle,
  description: validationSchemas.description,
  status: z.enum(["pending", "in-progress", "completed"], {
    required_error: "Por favor, selecciona un estado para el proyecto.",
  }),
  dueDate: z.string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate >= new Date();
    }, "La fecha límite debe ser válida y en el futuro"),
  client_id: z.string()
    .optional()
    .nullable()
    .refine((id) => {
      if (!id || id === '') return true;
      return isValidUuid(id);
    }, "ID de cliente inválido"),
});

interface ProjectContextType {
  projects: Project[];
  isLoadingProjects: boolean;
  addProject: (projectData: z.infer<typeof ProjectFormSchema>) => Promise<void>;
  updateProject: (projectId: string, updatedFields: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
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
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  // Safety timeout to prevent infinite loading (15 seconds)
  useLoadingTimeout(isLoadingProjects, setIsLoadingProjects, 15000);
  
  // Retry mechanism for failed requests
  const { executeWithRetry } = useRetryableRequest();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoadingProjects(false);
      return;
    }

    setIsLoadingProjects(true);
    
    const result = await executeWithRetry(
      () => supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      {
        maxRetries: 2,
        retryDelayMs: 1000,
        timeoutMs: 8000
      },
      'proyectos'
    );

    if (!result) {
      // Request failed after all retries, set empty state
      setProjects([]);
      setIsLoadingProjects(false);
      return;
    }

    const { data, error } = result;

    if (error) {
      console.error("Error fetching projects:", error);
      showError("Error al cargar los proyectos.");
      setProjects([]);
      setIsLoadingProjects(false);
      return;
    }

    try {
      // Normalize projects with both legacy notes and new pages
      const projectsWithNormalizedData = data.map((project: Record<string, unknown>) => ({
        ...project,
        dueDate: project.due_date,
        // Legacy notes normalization
        notes: (Array.isArray(project.notes) ? project.notes : []).map((note: Record<string, unknown>) => ({
          id: note.id ?? `${Date.now()}-${Math.random()}`,
          title: note.title ?? "",
          content: note.content ?? "",
          createdAt: note.createdAt ?? note.created_at ?? new Date().toISOString(),
        })),
        // New pages normalization
        pages: (Array.isArray(project.pages) ? project.pages : []).map((page: Record<string, unknown>) => ({
          id: page.id ?? `${Date.now()}-${Math.random()}`,
          title: page.title ?? "",
          content: page.content ?? "",
          project_id: project.id,
          page_type: page.page_type ?? 'general',
          icon: page.icon,
          is_favorited: page.is_favorited ?? false,
          tags: Array.isArray(page.tags) ? page.tags : [],
          template_id: page.template_id,
          created_at: page.created_at ?? new Date().toISOString(),
          updated_at: page.updated_at,
        })),
        // Tasks normalization
        tasks: (Array.isArray(project.tasks) ? project.tasks : []).map((task: Record<string, unknown>) => ({
          id: task.id ?? `${Date.now()}-${Math.random()}`,
          title: task.title ?? task.description ?? "",
          description: task.description_long ?? task.details ?? task.description ?? "",
          createdAt: task.createdAt ?? task.created_at ?? new Date().toISOString(),
          status: task.status || (task.completed ? 'completed' : 'not-started'),
          start_date: task.start_date,
          end_date: task.end_date,
          is_daily_task: task.is_daily_task || false,
          priority: task.priority || 'medium',
        }))
      }));
      
      setProjects(projectsWithNormalizedData as Project[]);
    } catch (error) {
      console.error("Error processing projects data:", error);
      showError("Error al procesar los datos de proyectos.");
      setProjects([]);
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
    if (!user) {
      showError("Debes iniciar sesión para añadir proyectos.");
      return;
    }
    try {
      const { dueDate, ...rest } = projectData;
      const newProject = {
        user_id: user.id,
        ...rest,
        due_date: dueDate === undefined ? null : dueDate,
        client_id: projectData.client_id === "" ? null : projectData.client_id,
      };
      const { data, error } = await supabase
        .from("projects")
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;

      setProjects((prev) => [{ ...data, dueDate: data.due_date, notes: [], pages: [], tasks: [] } as Project, ...prev]);
      showSuccess("Proyecto añadido exitosamente.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al añadir el proyecto: " + errorMessage);
      console.error("Error adding project:", error);
    }
  }, [user, setProjects]);

  const updateProject = useCallback(async (projectId: string, updatedFields: Partial<Project>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar proyectos.");
      return;
    }
    try {
      const fieldsToUpdate: Record<string, unknown> = { ...updatedFields };

      if ('dueDate' in updatedFields) {
        fieldsToUpdate.due_date = updatedFields.dueDate === undefined ? null : updatedFields.dueDate;
        delete fieldsToUpdate.dueDate;
      }

      fieldsToUpdate.client_id = updatedFields.client_id === "" ? null : updatedFields.client_id;

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

  return (
    <ProjectContext.Provider
      value={{
        projects,
        isLoadingProjects,
        addProject,
        updateProject,
        deleteProject,
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
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};