import { useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Rediseño de Portafolio Personal",
      description: "Actualizar el portafolio con los últimos trabajos y una nueva estética.",
      status: "in-progress",
      dueDate: "2024-12-31",
    },
    {
      id: "2",
      name: "Página Web para Cliente X",
      description: "Desarrollo de un sitio web e-commerce para una tienda de ropa.",
      status: "pending",
      dueDate: "2025-01-15",
    },
    {
      id: "3",
      name: "Diseño de Logotipo para Startup",
      description: "Creación de identidad visual y logotipo para una nueva empresa de tecnología.",
      status: "completed",
      dueDate: "2024-08-01",
    },
  ]);

  const handleAddProject = (newProjectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      id: String(projects.length + 1), // Simple ID generation
      ...newProjectData,
    };
    setProjects((prevProjects) => [...prevProjects, newProject]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Proyectos</h1>
        <AddProjectDialog onAddProject={handleAddProject} />
      </div>
      {projects.length === 0 ? (
        <p className="text-center text-muted-foreground">No hay proyectos aún. ¡Añade uno para empezar!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
      <MadeWithDyad />
    </div>
  );
};

export default Projects;