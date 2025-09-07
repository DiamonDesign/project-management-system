import { ProjectCard } from "@/components/ProjectCard";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useProjectContext } from "@/context/ProjectContext";
import { useSession } from "@/context/SessionContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Importar Skeleton

const Projects = () => {
  const { projects, addProject, isLoadingProjects } = useProjectContext();
  const { session, isLoading: isLoadingSession, signOut } = useSession();

  if (isLoadingSession || isLoadingProjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando proyectos...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Proyectos</h1>
        <div className="flex items-center space-x-4">
          <AddProjectDialog onAddProject={addProject} />
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
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