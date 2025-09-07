import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Clients from "./pages/Clients"; // Importar la nueva página de Clientes
import ClientDetail from "./pages/ClientDetail"; // Importar la nueva página de detalles de Cliente
import NotFound from "./pages/NotFound";
import { ProjectProvider } from "./context/ProjectContext";
import { SessionContextProvider } from "./context/SessionContext";
import { ClientProvider } from "./context/ClientContext"; // Importar el nuevo ClientProvider
import Login from "./pages/Login";
import { Layout } from "./components/Layout"; // Importar el componente Layout

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SessionContextProvider>
        <ProjectProvider>
          <ClientProvider> {/* Envolver con ClientProvider */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route element={<Layout />}> {/* Usar Layout para rutas autenticadas */}
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/clients" element={<Clients />} /> {/* Nueva ruta para Clientes */}
                <Route path="/clients/:id" element={<ClientDetail />} /> {/* Nueva ruta para detalles de Cliente */}
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClientProvider>
        </ProjectProvider>
      </SessionContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;