import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Project, Task } from "@/context/ProjectContext";

// Raw database interfaces for type safety
interface RawProjectFromDB {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: string;
  due_date?: string;
  client_id?: string;
  created_at: string;
  client?: {
    name?: string;
    email?: string;
    company?: string;
  } | null;
  notes?: unknown[];
  tasks?: RawTaskFromDB[];
}

interface RawTaskFromDB {
  id?: string;
  title?: string;
  description?: string;
  description_long?: string;
  details?: string;
  createdAt?: string;
  created_at?: string;
  status?: string;
  completed?: boolean;
  start_date?: string;
  end_date?: string;
  is_daily_task?: boolean;
  priority?: string;
}

export interface OptimizedProjectData extends Omit<Project, 'tasks'> {
  tasks: Task[];
}

export interface ProjectWithStats extends OptimizedProjectData {
  // Pre-calculated stats to avoid repeated calculations
  completedTasksCount: number;
  totalTasksCount: number;
  progressPercentage: number;
  highPriorityTasksCount: number;
  overdueTasks: Task[];
}

interface UseOptimizedProjectDataReturn {
  projects: ProjectWithStats[];
  allTasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Efficient lookup functions (O(1) complexity)
  getProjectById: (id: string) => ProjectWithStats | undefined;
  getTasksByProject: (projectId: string) => Task[];
  getClientProjects: (clientId: string) => ProjectWithStats[];
}

/**
 * Optimized hook for fetching project data with proper SQL joins
 * Eliminates N+1 queries and provides pre-calculated statistics
 */
export const useOptimizedProjectData = (): UseOptimizedProjectDataReturn => {
  const { user } = useSession();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create lookup maps for O(1) access
  const projectLookup = useRef<Map<string, ProjectWithStats>>(new Map());
  const tasksByProjectLookup = useRef<Map<string, Task[]>>(new Map());
  const clientProjectsLookup = useRef<Map<string, ProjectWithStats[]>>(new Map());

  const fetchOptimizedData = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setAllTasks([]);
      setIsLoading(false);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);
    
    try {
      // Single optimized query with all relationships
      const { data, error: fetchError } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          status,
          due_date,
          client_id,
          notes,
          tasks,
          created_at,
          client:clients!inner(
            id,
            name,
            email,
            company
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .abortSignal(signal);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data) {
        setProjects([]);
        setAllTasks([]);
        return;
      }

      // Process and optimize data
      const processedProjects: ProjectWithStats[] = [];
      const allTasksList: Task[] = [];
      
      // Clear lookup maps
      projectLookup.current.clear();
      tasksByProjectLookup.current.clear();
      clientProjectsLookup.current.clear();

      data.forEach((project: RawProjectFromDB) => {
        // Normalize project data
        const normalizedProject: OptimizedProjectData = {
          id: project.id,
          user_id: project.user_id,
          name: project.name,
          description: project.description,
          status: project.status,
          dueDate: project.due_date,
          client_id: project.client_id,
          // Denormalized client data for performance
          clientName: project.client?.name || null,
          clientEmail: project.client?.email || null,
          clientCompany: project.client?.company || null,
          // Normalize nested data
          notes: Array.isArray(project.notes) ? project.notes : [],
          tasks: [],
          created_at: project.created_at,
        };

        // Process and normalize tasks
        const projectTasks = (Array.isArray(project.tasks) ? project.tasks : []).map((task: RawTaskFromDB) => ({
          id: task.id || `${Date.now()}-${Math.random()}`,
          title: task.title || task.description || "",
          description: task.description_long || task.details || task.description || "",
          createdAt: task.createdAt || task.created_at || new Date().toISOString(),
          status: task.status || (task.completed ? 'completed' : 'not-started'),
          start_date: task.start_date,
          end_date: task.end_date,
          is_daily_task: task.is_daily_task || false,
          priority: task.priority || 'medium',
          // Add optimized references
          projectId: project.id,
          projectName: project.name,
        }));

        // Pre-calculate statistics
        const completedTasksCount = projectTasks.filter(t => t.status === 'completed').length;
        const totalTasksCount = projectTasks.length;
        const progressPercentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
        const highPriorityTasksCount = projectTasks.filter(t => t.priority === 'high').length;
        const overdueTasks = projectTasks.filter(task => 
          task.end_date && 
          new Date(task.end_date) < new Date() && 
          task.status !== 'completed'
        );

        const projectWithStats: ProjectWithStats = {
          ...normalizedProject,
          tasks: projectTasks,
          completedTasksCount,
          totalTasksCount,
          progressPercentage,
          highPriorityTasksCount,
          overdueTasks,
        };

        processedProjects.push(projectWithStats);
        allTasksList.push(...projectTasks);

        // Build lookup maps for O(1) access
        projectLookup.current.set(project.id, projectWithStats);
        tasksByProjectLookup.current.set(project.id, projectTasks);
        
        // Build client projects lookup
        if (project.client_id) {
          const clientProjects = clientProjectsLookup.current.get(project.client_id) || [];
          clientProjects.push(projectWithStats);
          clientProjectsLookup.current.set(project.client_id, clientProjects);
        }
      });

      setProjects(processedProjects);
      setAllTasks(allTasksList);

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error("Error fetching optimized project data:", error);
      setError(error instanceof Error ? error.message : "Error loading project data");
      setProjects([]);
      setAllTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOptimizedData();
  }, [fetchOptimizedData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Optimized lookup functions (O(1) complexity)
  const getProjectById = useCallback((id: string): ProjectWithStats | undefined => {
    return projectLookup.current.get(id);
  }, []);

  const getTasksByProject = useCallback((projectId: string): Task[] => {
    return tasksByProjectLookup.current.get(projectId) || [];
  }, []);

  const getClientProjects = useCallback((clientId: string): ProjectWithStats[] => {
    return clientProjectsLookup.current.get(clientId) || [];
  }, []);

  return {
    projects,
    allTasks,
    isLoading,
    error,
    refetch: fetchOptimizedData,
    getProjectById,
    getTasksByProject,
    getClientProjects,
  };
};

/**
 * Hook for getting task-to-project mappings efficiently
 * Eliminates the need for nested loops in components
 */
export const useTaskProjectMapping = (tasks: Task[]) => {
  return useCallback((taskId: string): ProjectWithStats | null => {
    for (const task of tasks) {
      if (task.id === taskId && task.projectId) {
        return projectLookup.current.get(task.projectId) || null;
      }
    }
    return null;
  }, [tasks]);
};