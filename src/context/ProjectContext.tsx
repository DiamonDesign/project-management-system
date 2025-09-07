import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { showSuccess, showError } from "@/utils/toast";

// Define las interfaces para Nota y Tarea
interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed'; // Cambiado de 'completed: boolean'
  createdAt: string;
  start_date?: string; // Nuevo campo
  end_date?: string;   // Nuevo campo
  is_daily_task?: boolean; // NUEVO CAMPO
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
  addNoteToProject: (projectId: string, content: string) => Promise<void>;
  deleteNoteFromProject: (projectId: string, noteId: string) => Promise<void>;
  addTaskToProject: (projectId: string, description: string, start_date?: string, end_date?: string) => Promise<void>; // Actualizado
  updateTaskStatus: (projectId: string, taskId: string, newStatus: Task['status']) => Promise<void>;
  updateTaskDailyStatus: (projectId: string, taskId: string, isDaily: boolean) => Promise<void>; // NUEVA FUNCIÓN
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
      // Mapear sobre los datos obtenidos para asegurar que las tareas tengan el nuevo campo 'status'
      // y mapear 'due_date' de la DB a 'dueDate' para la interfaz de la aplicación
      const projectsWithNormalizedData = data.map(project => ({
        ...project,
        dueDate: project.due_date, // Mapear de snake_case (DB) a camelCase (App)
        tasks: project.tasks.map((task: any) => ({ // 'any' para compatibilidad con datos antiguos
          id: task.id,
          description: task.description,
          createdAt: task.createdAt,
          status: task.status || (task.completed ? 'completed' : 'not-started'), // Inferir status si no está presente
          start_date: task.start_date, // Asegurar que start_date esté presente
          end_date: task.end_date,     // Asegurar que end_date esté presente
          is_daily_task: task.is_daily_task || false, // Inicializar el nuevo campo
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

  const addProject = async (projectData: z.infer<typeof ProjectFormSchema>) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir proyectos.");
      return;
    }
    try {
      const { dueDate, ...rest } = projectData; // Desestructurar dueDate
      const newProject = {
        user_id: user.id,
        ...rest,
        due_date: dueDate === undefined ? null : dueDate, // Mapear a snake_case para la DB
        client_id: projectData.client_id === "" ? null : projectData.client_id, // Asegurar null si está vacío
      };
      const { data, error } = await supabase
        .from("projects")
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;

      // Al actualizar el estado, mapear de nuevo a camelCase para la interfaz de la aplicación
      setProjects((prev) => [{ ...data, dueDate: data.due_date, notes: [], tasks: [] } as Project, ...prev]);
      showSuccess("Proyecto añadido exitosamente.");
    } catch (error: any) {
      showError("Error al añadir el proyecto: " + error.message);
      console.error("Error adding project:", error);
    }
  };

  const updateProject = async (projectId: string, updatedFields: Partial<Project>) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar proyectos.");
      return;
    }
    try {
      const fieldsToUpdate: Record<string, any> = { ...updatedFields }; // Usar Record<string, any> para claves dinámicas

      // Mapear dueDate a due_date si está presente
      if ('dueDate' in updatedFields) {
        fieldsToUpdate.due_date = updatedFields.dueDate === undefined ? null : updatedFields.dueDate;
        delete fieldsToUpdate.dueDate; // Eliminar la versión camelCase
      }
      
      fieldsToUpdate.client_id = updatedFields.client_id === "" ? null : updatedFields.client_id; // Asegurar null si está vacío

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
  };

  const deleteProject = async (projectId: string) => {
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
  };

  const addNoteToProject = async (projectId: string, content: string) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir notas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const newNote = { id: Date.now().toString(), content, createdAt: new Date().toISOString() };
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
  };

  const deleteNoteFromProject = async (projectId: string, noteId: string) => {
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
  };

  const addTaskToProject = async (projectId: string, description: string, start_date?: string, end_date?: string) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const newTask: Task = {
        id: Date.now().toString(),
        description,
        status: 'not-started',
        createdAt: new Date().toISOString(),
        start_date,
        end_date,
        is_daily_task: false, // Por defecto, no es una tarea diaria al añadirla
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
  };

  const updateTaskStatus = async (projectId: string, taskId: string, newStatus: Task['status']) => {
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
  };

  // NUEVA FUNCIÓN: Actualizar el estado de tarea diaria
  const updateTaskDailyStatus = async (projectId: string, taskId: string, isDaily: boolean) => {
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
  };

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
        updateTaskDailyStatus, // Añadir la nueva función al contexto
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