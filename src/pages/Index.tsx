import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext"; // Importar useSession

const Index = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Bienvenido a tu Gestor de Proyectos</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Organiza tus trabajos de diseño freelance y páginas web.
        </p>
        <Link to="/login">
          <Button size="lg">Iniciar Sesión / Registrarse</Button>
        </Link>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;