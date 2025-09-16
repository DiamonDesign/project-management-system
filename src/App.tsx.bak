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

// Code splitting with React.lazy()
const Index = React.lazy(() => import("./pages/Index"));
const Projects = React.lazy(() => import("./pages/Projects"));
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

// Query client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
      retry: 2,
      refetchOnWindowFocus: false,
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
                <Route path="/login" element={
                  <LazyRoute><Login /></LazyRoute>
                } />
                <Route path="/client-portal/invite" element={
                  <LazyRoute><ClientPortalInvite /></LazyRoute>
                } />
                <Route path="/client-portal/dashboard" element={
                  <LazyRoute><ClientPortalDashboard /></LazyRoute>
                } />
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={
                    <LazyRoute><Dashboard /></LazyRoute>
                  } />
                  <Route path="/projects" element={
                    <LazyRoute><Projects /></LazyRoute>
                  } />
                  <Route path="/projects/:id" element={
                    <LazyRoute><ProjectDetail /></LazyRoute>
                  } />
                  <Route path="/clients" element={
                    <LazyRoute><Clients /></LazyRoute>
                  } />
                  <Route path="/clients/:id" element={
                    <LazyRoute><ClientDetail /></LazyRoute>
                  } />
                  <Route path="/tasks" element={
                    <LazyRoute><Tasks /></LazyRoute>
                  } />
                  <Route path="/profile" element={
                    <LazyRoute><Profile /></LazyRoute>
                  } />
                  <Route path="/analytics" element={
                    <LazyRoute><Analytics /></LazyRoute>
                  } />
                </Route>
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