import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ProjectProvider } from "./context/ProjectContext";
import { SessionContextProvider } from "./context/SessionContext";
import { ClientProvider } from "./context/ClientContext";
import { Layout } from "./components/Layout";
import { ErrorBoundary, PageErrorBoundary } from "./components/ErrorBoundary";
import { PageLoading } from "@/components/ui/loading";
import { RequireAuth, ClientPortalRoute } from "@/components/auth/ProtectedRoute";

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

// Query client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes - longer cache
      gcTime: 30 * 60 * 1000, // 30 minutes - longer garbage collection
      retry: 1, // Reduce retries to prevent loops
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Disable auto-refetch on reconnect
    },
  },
});

// Lazy route wrapper with error boundary and enhanced error handling
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <PageErrorBoundary 
    onError={(error, errorInfo) => {
      // Log specific session-related errors
      if (error.message.includes('session is not defined') || 
          error.message.includes('Cannot read properties of null')) {
        console.error('Session context error detected:', error, errorInfo);
      }
    }}
  >
    <Suspense fallback={<PageLoading />}>
      {children}
    </Suspense>
  </PageErrorBoundary>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionContextProvider>
          <ProjectProvider>
            <ClientProvider>
              <Routes>
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
                <Route path="/client-portal/dashboard" element={
                  <ClientPortalRoute>
                    <LazyRoute><ClientPortalDashboard /></LazyRoute>
                  </ClientPortalRoute>
                } />
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={
                    <RequireAuth>
                      <LazyRoute><Dashboard /></LazyRoute>
                    </RequireAuth>
                  } />
                  <Route path="/projects" element={
                    <RequireAuth>
                      <LazyRoute><Projects /></LazyRoute>
                    </RequireAuth>
                  } />
                  <Route path="/projects/archived" element={
                    <RequireAuth>
                      <LazyRoute><ArchivedProjects /></LazyRoute>
                    </RequireAuth>
                  } />
                  <Route path="/projects/:id" element={
                    <RequireAuth>
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
                    <RequireAuth>
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
                <Route path="/env-check" element={
                  <LazyRoute><EnvCheck /></LazyRoute>
                } />
                <Route path="*" element={
                  <LazyRoute><NotFound /></LazyRoute>
                } />
              </Routes>
            </ClientProvider>
          </ProjectProvider>
        </SessionContextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;