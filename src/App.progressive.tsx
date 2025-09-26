import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { PageErrorBoundary } from "./components/ErrorBoundary/index";
import ErrorBoundary from "./components/ErrorBoundary/index";

// Progressive Loading System
import { LoadingProvider } from "./context/LoadingContext";
import { EnhancedSessionProvider } from "./context/EnhancedSessionContext";
import { SmartLoadingScreen, ComponentLoadingWrapper } from "@/components/ui/progressive-loading";

// Contexts with progressive loading
import { ProjectProvider } from "./context/ProjectContext";
import { TaskProvider } from "./context/TaskContext";
import { ClientProvider } from "./context/ClientContext";

// Core components
import { Layout } from "./components/Layout";
import { RequireAuth, ClientPortalRoute } from "@/components/auth/ProtectedRoute";
import { useEnhancedSession } from "@/context/EnhancedSessionContext";
import { useLoading } from "@/context/LoadingContext";

// Code splitting with React.lazy()
const Index = React.lazy(() => import("./pages/Index"));
const Landing = React.lazy(() => import("./pages/Landing"));
const Projects = React.lazy(() => import("./pages/Projects"));
const ArchivedProjects = React.lazy(() => import("./pages/ArchivedProjects"));
const ProjectDetail = React.lazy(() => import("./pages/ProjectDetail"));
const Clients = React.lazy(() => import("./pages/Clients"));
const ClientDetail = React.lazy(() => import("./pages/ClientDetail"));
const Tasks = React.lazy(() => import("./pages/Tasks"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const ClientPortalInvite = React.lazy(() => import("./pages/ClientPortalInvite"));
const ClientPortalDashboard = React.lazy(() => import("./pages/ClientPortalDashboard"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));
const EnvCheck = React.lazy(() => import("./pages/EnvCheck"));

// Optimized Query client for progressive loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        // Adaptive retry based on error type
        if (error?.message?.includes('network')) {
          return failureCount < 2; // Fewer retries for network errors
        }
        return failureCount < 1; // Default: 1 retry
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Re-enable on reconnect for progressive loading
    },
  },
});

// Enhanced lazy route wrapper with progressive loading support
const LazyRoute = ({ children }: { children: React.ReactNode }) => {
  const { shouldBlock } = useLoading();

  return (
    <PageErrorBoundary
      onError={(error, errorInfo) => {
        if (error.message.includes('session is not defined') ||
            error.message.includes('Cannot read properties of null')) {
          console.error('Session context error detected:', error, errorInfo);
        }
      }}
    >
      <Suspense fallback={shouldBlock ? <SmartLoadingScreen /> : <div>Loading page...</div>}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
};

// Progressive provider wrapper that doesn't block
const ProgressiveProviders = ({ children }: { children: React.ReactNode }) => {
  const { authPhase, canContinueWithBasicAuth, profileEnhancementFailed } = useEnhancedSession();
  const { canProgress } = useLoading();

  // Always render providers with progressive enhancement
  // Each provider handles its own loading state internally
  return (
    <ComponentLoadingWrapper
      componentName="projects"
      fallback={<div className="space-y-2"><div className="h-4 bg-gray-200 rounded animate-pulse" /></div>}
    >
      <ProjectProvider>
        <ComponentLoadingWrapper
          componentName="tasks"
          fallback={<div className="space-y-2"><div className="h-4 bg-gray-200 rounded animate-pulse" /></div>}
        >
          <TaskProvider>
            <ComponentLoadingWrapper
              componentName="clients"
              fallback={<div className="space-y-2"><div className="h-4 bg-gray-200 rounded animate-pulse" /></div>}
            >
              <ClientProvider>
                {children}
              </ClientProvider>
            </ComponentLoadingWrapper>
          </TaskProvider>
        </ComponentLoadingWrapper>
      </ProjectProvider>
    </ComponentLoadingWrapper>
  );
};

// Authentication guard with progressive loading
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { authPhase, canContinueWithBasicAuth, profileEnhancementFailed } = useEnhancedSession();
  const { shouldBlock } = useLoading();

  // Progressive authentication states
  switch (authPhase) {
    case 'authenticating':
      if (shouldBlock) {
        return <SmartLoadingScreen title="Autenticando" />;
      }
      return <>{children}</>; // Progressive: render with degraded state

    case 'enhancing':
      if (shouldBlock) {
        return <SmartLoadingScreen title="Cargando perfil" showProgress />;
      }
      return <>{children}</>; // Progressive: render with basic auth

    case 'error':
      return (
        <SmartLoadingScreen
          title="Error de autenticación"
          description="Se produjo un error al verificar tu sesión"
        />
      );

    case 'degraded':
      // Show degraded mode notice but continue
      return (
        <>
          <div className="bg-amber-50 border-b border-amber-200 p-2 text-center">
            <p className="text-amber-800 text-sm">
              ⚠️ Funcionando con funcionalidad limitada
              {profileEnhancementFailed && (
                <button
                  onClick={() => window.location.reload()}
                  className="ml-2 px-2 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"
                >
                  Recargar
                </button>
              )}
            </p>
          </div>
          {children}
        </>
      );

    case 'ready':
    case 'idle':
    default:
      return <>{children}</>;
  }
};

// Main App component with progressive loading architecture
const ProgressiveApp = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <LoadingProvider strategy="progressive">
          <EnhancedSessionProvider>
            <AuthGuard>
              <ProgressiveProviders>
                <Routes>
                  {/* Public routes - always available */}
                  <Route path="/" element={
                    <LazyRoute><Index /></LazyRoute>
                  } />
                  <Route path="/landing" element={
                    <LazyRoute><Landing /></LazyRoute>
                  } />
                  <Route path="/login" element={
                    <LazyRoute><Login /></LazyRoute>
                  } />
                  <Route path="/auth/callback" element={
                    <LazyRoute><AuthCallback /></LazyRoute>
                  } />
                  <Route path="/client-portal/invite" element={
                    <LazyRoute><ClientPortalInvite /></LazyRoute>
                  } />

                  {/* Client portal routes */}
                  <Route path="/client-portal/dashboard" element={
                    <ClientPortalRoute>
                      <LazyRoute><ClientPortalDashboard /></LazyRoute>
                    </ClientPortalRoute>
                  } />

                  {/* Protected routes with progressive enhancement */}
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={
                      <RequireAuth allowDegraded>
                        <LazyRoute><Dashboard /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/projects" element={
                      <RequireAuth allowDegraded>
                        <LazyRoute><Projects /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/projects/archived" element={
                      <RequireAuth allowDegraded>
                        <LazyRoute><ArchivedProjects /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/projects/:id" element={
                      <RequireAuth allowDegraded>
                        <LazyRoute><ProjectDetail /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/clients" element={
                      <RequireAuth>
                        <LazyRoute><Clients /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/clients/:id" element={
                      <RequireAuth>
                        <LazyRoute><ClientDetail /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/tasks" element={
                      <RequireAuth allowDegraded>
                        <LazyRoute><Tasks /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/profile" element={
                      <RequireAuth>
                        <LazyRoute><Profile /></LazyRoute>
                      </RequireAuth>
                    } />
                    <Route path="/analytics" element={
                      <RequireAuth>
                        <LazyRoute><Analytics /></LazyRoute>
                      </RequireAuth>
                    } />
                  </Route>

                  {/* Utility routes */}
                  <Route path="/env-check" element={
                    <LazyRoute><EnvCheck /></LazyRoute>
                  } />
                  <Route path="*" element={
                    <LazyRoute><NotFound /></LazyRoute>
                  } />
                </Routes>
              </ProgressiveProviders>
            </AuthGuard>
          </EnhancedSessionProvider>
        </LoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default ProgressiveApp;