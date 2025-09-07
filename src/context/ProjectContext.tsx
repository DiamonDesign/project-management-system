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

interface Task {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

// Define la interfaz para Proyecto, incluyendo notas y tareas
export interface Project {
  id: string;
  user_id: string; // Añadir user_id para vincular con el usuario autenticado
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
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
});

interface ProjectContextType {
  projects: Project[];
  isLoadingProjects: boolean;
  addProject: (projectData: z.infer<typeof ProjectFormSchema>) => Promise<void>;
  updateProject: (projectId: string, updatedFields: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addNoteToProject: (projectId: string, content: string) => Promise<void>;
  deleteNoteFromProject: (projectId: string, noteId: string) => Promise<void>;
  addTaskToProject: (projectId: string, description: string) => Promise<void>;
  toggleTaskCompletion: (projectId: string, taskId: string) => Promise<void>;
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
      setProjects(data as Project[]);
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
      const newProject: Omit<Project, "id" | "created_at"> = {
        user_id: user.id,
        ...projectData,
        notes: [],
        tasks: [],
      };
      const { data, error } = await supabase
        .from("projects")
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;

      setProjects((prev) => [data as Project, ...prev]);
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
      const { error } = await supabase
        .from("projects")
        .update(updatedFields)
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

  const addTaskToProject = async (projectId: string, description: string) => {
    if (!user) {
      showError("Debes iniciar sesión para añadir tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const newTask = { id: Date.now().toString(), description, completed: false, createdAt: new Date().toISOString() };
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

  const toggleTaskCompletion = async (projectId: string, taskId: string) => {
    if (!user) {
      showError("Debes iniciar sesión para actualizar tareas.");
      return;
    }
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Proyecto no encontrado.");

      const updatedTasks = project.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
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
      console.error("Error toggling task completion:", error);
    }
  };

  const deleteTaskFromProject = async (projectId: string, taskId: string) => {
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
        toggleTaskCompletion,
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