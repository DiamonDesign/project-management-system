/**
 * TaskContext - Specialized for Task Management
 *
 * ONLY handles:
 * - Task CRUD operations
 * - Task status updates
 * - Task priority management
 * - Optimistic updates for performance
 */

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { showSuccess, showError } from "@/utils/toast";
import { logger } from "@/lib/logger";
import type { Task } from "@/types/shared";

interface TaskContextType {
  // State
  tasks: Task[];
  isLoadingTasks: boolean;

  // Task operations
  addTask: (projectId: string, title: string, description?: string, start_date?: string, end_date?: string, priority?: Task['priority']) => Promise<void>;
  updateTask: (taskId: string, updatedFields: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
  updateTaskDailyStatus: (taskId: string, isDaily: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Utilities
  getTasksByProject: (projectId: string) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isLoadingSession } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch all tasks for current user
   */
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoadingTasks(true);

      // Fetch tasks with project data for denormalization
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          projects!inner(
            id,
            name,
            user_id
          )
        `)
        .eq("projects.user_id", user.id)
        .abortSignal(abortControllerRef.current.signal);

      if (tasksError) {
        // Handle 404 for missing tasks table gracefully
        if (tasksError.code === 'PGRST116' || tasksError.message.includes('404')) {
          logger.warn('TaskContext', 'Tasks table not found, using empty array');
          setTasks([]);
          return;
        }
        throw tasksError;
      }

      // Transform to Task format with denormalized project data
      const transformedTasks: Task[] = (tasksData || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        createdAt: task.created_at,
        start_date: task.start_date,
        end_date: task.end_date,
        is_daily_task: task.is_daily_task,
        priority: task.priority,
        projectId: task.project_id,
        projectName: task.projects?.name,
      }));

      setTasks(transformedTasks);
      logger.log('TaskContext', `Loaded ${transformedTasks.length} tasks`);

    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('TaskContext', 'Failed to fetch tasks', error);
        showError("Error al cargar las tareas");
      }
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user]);

  // Load tasks when session is ready
  useEffect(() => {
    if (!isLoadingSession) {
      fetchTasks();
    }
  }, [isLoadingSession, fetchTasks]);

  /**
   * Add new task (optimistic update)
   */
  const addTask = useCallback(async (
    projectId: string,
    title: string,
    description?: string,
    start_date?: string,
    end_date?: string,
    priority?: Task['priority']
  ): Promise<void> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para añadir tareas.");
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      title,
      description,
      status: 'not-started',
      createdAt: new Date().toISOString(),
      start_date,
      end_date,
      is_daily_task: false,
      priority: priority || 'medium',
      projectId,
      projectName: 'Loading...', // Will be updated after server response
    };

    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const taskData = {
        title,
        description,
        status: 'not-started' as const,
        project_id: projectId,
        start_date,
        end_date,
        priority: priority || 'medium',
        is_daily_task: false,
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select(`
          *,
          projects(
            id,
            name
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // Replace optimistic task with real task
      const realTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        createdAt: data.created_at,
        start_date: data.start_date,
        end_date: data.end_date,
        is_daily_task: data.is_daily_task,
        priority: data.priority,
        projectId: data.project_id,
        projectName: data.projects?.name,
      };

      setTasks(prev => prev.map(task => task.id === tempId ? realTask : task));
      showSuccess("Tarea añadida exitosamente.");

    } catch (error: unknown) {
      // Revert optimistic update
      setTasks(prev => prev.filter(task => task.id !== tempId));

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('TaskContext', 'Failed to add task', error);
      showError("Error al añadir la tarea: " + errorMessage);
    }
  }, [user]);

  /**
   * Update task (optimistic update)
   */
  const updateTask = useCallback(async (taskId: string, updatedFields: Partial<Task>): Promise<void> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para actualizar tareas.");
      return;
    }

    // Optimistic update
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updatedFields } : task
    ));

    try {
      // Transform fields for database
      interface DatabaseTaskUpdate {
        [key: string]: unknown;
      }

      const updateData: DatabaseTaskUpdate = { ...updatedFields };
      delete updateData.projectId;
      delete updateData.projectName;
      delete updateData.createdAt;

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) {
        throw error;
      }

      showSuccess("Tarea actualizada exitosamente.");

    } catch (error: unknown) {
      // Revert optimistic update
      setTasks(prev => prev.map(task =>
        task.id === taskId ? originalTask : task
      ));

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('TaskContext', 'Failed to update task', error);
      showError("Error al actualizar la tarea: " + errorMessage);
    }
  }, [user, tasks]);

  /**
   * Update task status (optimistic update)
   */
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: Task['status']): Promise<void> => {
    await updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  /**
   * Update task daily status (optimistic update)
   */
  const updateTaskDailyStatus = useCallback(async (taskId: string, isDaily: boolean): Promise<void> => {
    await updateTask(taskId, { is_daily_task: isDaily });
  }, [updateTask]);

  /**
   * Delete task (optimistic update)
   */
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    if (!user?.id) {
      showError("Debes iniciar sesión para eliminar tareas.");
      return;
    }

    // Optimistic update
    const originalTasks = tasks;
    setTasks(prev => prev.filter(task => task.id !== taskId));

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        throw error;
      }

      showSuccess("Tarea eliminada exitosamente.");

    } catch (error: unknown) {
      // Revert optimistic update
      setTasks(originalTasks);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('TaskContext', 'Failed to delete task', error);
      showError("Error al eliminar la tarea: " + errorMessage);
    }
  }, [user, tasks]);

  /**
   * Get tasks by project ID
   */
  const getTasksByProject = useCallback((projectId: string): Task[] => {
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks]);

  /**
   * Get task by ID
   */
  const getTaskById = useCallback((taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  /**
   * Refresh tasks manually
   */
  const refreshTasks = useCallback(async (): Promise<void> => {
    await fetchTasks();
  }, [fetchTasks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const contextValue: TaskContextType = {
    // State
    tasks,
    isLoadingTasks,

    // Operations
    addTask,
    updateTask,
    updateTaskStatus,
    updateTaskDailyStatus,
    deleteTask,

    // Utilities
    getTasksByProject,
    getTaskById,
    refreshTasks,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

/**
 * Hook to use TaskContext
 */
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    // More graceful error handling - provide fallback instead of throwing
    console.warn('useTaskContext called outside of TaskProvider, providing fallback context');
    return {
      // Fallback context with safe defaults
      tasks: [],
      isLoadingTasks: false,
      addTask: async () => { console.warn('TaskContext not available - addTask ignored'); },
      updateTask: async () => { console.warn('TaskContext not available - updateTask ignored'); },
      updateTaskStatus: async () => { console.warn('TaskContext not available - updateTaskStatus ignored'); },
      updateTaskDailyStatus: async () => { console.warn('TaskContext not available - updateTaskDailyStatus ignored'); },
      deleteTask: async () => { console.warn('TaskContext not available - deleteTask ignored'); },
      getTasksByProject: () => [],
      getTaskById: () => undefined,
      refreshTasks: async () => { console.warn('TaskContext not available - refreshTasks ignored'); },
    };
  }
  return context;
};

// Export types
export type { TaskContextType };