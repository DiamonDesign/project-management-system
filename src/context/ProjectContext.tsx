import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { showSuccess, showError } from "@/utils/toast";

// Define las interfaces para Nota y Tarea
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

// Define la interfaz para Proyecto, incluyendo notas y tareas
export interface Project {
  id: string;
  user_id: string; // Añadir user_id para vincular con el usuario autenticado
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string; // Aquí se usa camelCase en la aplicación
  client_id?: string | null; // Nuevo campo para asignar cliente
  notes: Note[];
  tasks: Task[];
  created_at: string;
}

// Define el esquema para añadir un nuevo proyecto (sin ID, notas ni tareas)
export const ProjectFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre del proyecto debe tener al menos 2 caracteres.",
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres.",
  }),
  status: z.enum(["pending", "in-progress", "completed"], {
    required_error: "Por favor, selecciona un estado para el proyecto.",
  }),
  dueDate: z.string().optional().nullable(), // Permitir null para opcional
  client_id: z.string().optional().nullable(), // Nuevo campo para asignar cliente
});

interface ProjectContextType {
  projects: Project[];
  isLoadingProjects: boolean;
  addProject: (projectData: z.infer<typeof ProjectFormSchema>) => Promise<void>;
  updateProject: (projectId: string, updatedFields: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addNoteToProject: (projectId: string, title: string, content: string) => Promise<void>;
  deleteNoteFromProject: (projectId: string, noteId: string) => Promise<void>;
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

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoadingProjects(false);
      return;
    }

    setIsLoadingProjects(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      showError("Error al cargar los proyectos.");
      setProjects([]);
    } else {
      // Normalizar tareas y notas: compatibilidad con estructuras antiguas
      const projectsWithNormalizedData = data.map((project: any) => ({
        ...project,
        dueDate: project.due_date,
        notes: (project.notes || []).map((note: any) => ({
          id: note.id ?? `${Date.now()}-${Math.random()}`,
          title: note.title ?? "",
          content: note.content ?? "",
          createdAt: note.createdAt ?? note.created_at ?? new Date().toISOString(),
        })),
        tasks: (project.tasks || []).map((task: any) => ({
          id: task.id ?? `${Date.now()}-${Math.random()}`,
          title: task.title ?? task.description ?? "", // mapear description antigua a title si es necesario
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
    }
    setIsLoadingProjects(false);
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

      setProjects((prev) => [{ ...data, dueDate: data.due_date, notes: [], tasks: [] } as Project, ...prev]);
      showSuccess("Proyecto añadido exitosamente.");
    } catch (error: any) {
      showError("Error al añadir el proyecto: " + error.message);
      console.error("Error adding project:", error);
    }
  }, [user, setProjects]);

  const updateProject = useCallback(async (projectId: string, updatedFields: Partial<Project>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar proyectos.");
      return;
    }
    try {
      const fieldsToUpdate: Record<string, any> = { ...updatedFields };

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
    } catch (error: any) {
      showError("Error al actualizar el proyecto: " + error.message);
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
    } catch (error: any) {
      showError("Error al eliminar el proyecto: " + error.message);
      console.error("Error deleting project:", error);
    }
  }, [user, setProjects]);

  const addNoteToProject = useCallback(async (projectId: string, title: string, content: string) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir notas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const newNote: Note = { id: Date.now().toString(), title: title || "", content, createdAt: new Date().toISOString() };
      const updatedNotes = [...project.notes, newNote];

      await updateProject(projectId, { notes: updatedNotes });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, notes: updatedNotes } : p
        )
      );
      showSuccess("Nota añadida.");
    } catch (error: any) {
      showError("Error al añadir la nota: " + error.message);
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
    } catch (error: any) {
      showError("Error al eliminar la nota: " + error.message);
      console.error("Error deleting note:", error);
    }
  }, [user, projects, updateProject]);

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
    } catch (error: any) {
      showError("Error al añadir la tarea: " + error.message);
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
    } catch (error: any) {
      showError("Error al actualizar la tarea: " + error.message);
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
    } catch (error: any) {
      showError("Error al actualizar el estado de tarea diaria: " + error.message);
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
    } catch (error: any) {
      showError("Error al actualizar la tarea: " + error.message);
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
    } catch (error: any) {
      showError("Error al eliminar la tarea: " + error.message);
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
        addNoteToProject,
        deleteNoteFromProject,
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