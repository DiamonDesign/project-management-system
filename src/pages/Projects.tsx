import { ProjectCard } from "@/components/ProjectCard";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useProjectContext } from "@/context/ProjectContext";

const Projects = () => {
  const { projects, addProject } = useProjectContext();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Proyectos</h1>
        <AddProjectDialog onAddProject={addProject} />
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