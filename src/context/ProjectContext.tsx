import React, { createContext, useContext, useState, ReactNode } from 'react';
import { z } from "zod";

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
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  notes: Note[];
  tasks: Task[];
}

// Define el esquema para añadir un nuevo proyecto (sin ID, notas ni tareas)
const AddProjectSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre del proyecto debe tener al menos 2 caracteres.",
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres.",
  }),
  status: z.enum(["pending", "in-progress", "completed"], {
    required_error: "Por favor, selecciona un estado para el proyecto.",
  }),
  dueDate: z.string().optional(),
});

interface ProjectContextType {
  projects: Project[];
  addProject: (projectData: z.infer<typeof AddProjectSchema>) => void;
  updateProject: (projectId: string, updatedFields: Partial<Project>) => void;
  addNoteToProject: (projectId: string, content: string) => void;
  deleteNoteFromProject: (projectId: string, noteId: string) => void;
  addTaskToProject: (projectId: string, description: string) => void;
  toggleTaskCompletion: (projectId: string, taskId: string) => void;
  deleteTaskFromProject: (projectId: string, taskId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Rediseño de Portafolio Personal",
      description: "Actualizar el portafolio con los últimos trabajos y una nueva estética.",
      status: "in-progress",
      dueDate: "2024-12-31",
      notes: [
        { id: "n1", content: "Investigar nuevas tendencias de diseño UI/UX.", createdAt: new Date().toISOString() },
        { id: "n2", content: "Revisar feedback del cliente sobre la paleta de colores.", createdAt: new Date().toISOString() },
      ],
      tasks: [
        { id: "t1", description: "Crear wireframes para la nueva sección 'Acerca de'.", completed: false, createdAt: new Date().toISOString() },
        { id: "t2", description: "Seleccionar 3 fuentes principales para el sitio.", completed: true, createdAt: new Date().toISOString() },
      ],
    },
    {
      id: "2",
      name: "Página Web para Cliente X",
      description: "Desarrollo de un sitio web e-commerce para una tienda de ropa.",
      status: "pending",
      dueDate: "2025-01-15",
      notes: [],
      tasks: [
        { id: "t3", description: "Definir estructura de base de datos para productos.", completed: false, createdAt: new Date().toISOString() },
      ],
    },
    {
      id: "3",
      name: "Diseño de Logotipo para Startup",
      description: "Creación de identidad visual y logotipo para una nueva empresa de tecnología.",
      status: "completed",
      dueDate: "2024-08-01",
      notes: [
        { id: "n3", content: "Enviar propuestas finales de logotipo al cliente.", createdAt: new Date().toISOString() },
      ],
      tasks: [
        { id: "t4", description: "Preparar archivos vectoriales para entrega.", completed: true, createdAt: new Date().toISOString() },
      ],
    },
  ]);

  const addProject = (projectData: z.infer<typeof AddProjectSchema>) => {
    const newProject: Project = {
      id: String(projects.length > 0 ? Math.max(...projects.map(p => parseInt(p.id))) + 1 : 1),
      ...projectData,
      notes: [],
      tasks: [],
    };
    setProjects((prev) => [...prev, newProject]);
  };

  const updateProject = (projectId: string, updatedFields: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, ...updatedFields } : project
      )
    );
  };

  const addNoteToProject = (projectId: string, content: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              notes: [
                ...project.notes,
                { id: Date.now().toString(), content, createdAt: new Date().toISOString() },
              ],
            }
          : project
      )
    );
  };

  const deleteNoteFromProject = (projectId: string, noteId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              notes: project.notes.filter((note) => note.id !== noteId),
            }
          : project
      )
    );
  };

  const addTaskToProject = (projectId: string, description: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: [
                ...project.tasks,
                { id: Date.now().toString(), description, completed: false, createdAt: new Date().toISOString() },
              ],
            }
          : project
      )
    );
  };

  const toggleTaskCompletion = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              ),
            }
          : project
      )
    );
  };

  const deleteTaskFromProject = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.filter((task) => task.id !== taskId),
            }
          : project
      )
    );
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        addProject,
        updateProject,
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