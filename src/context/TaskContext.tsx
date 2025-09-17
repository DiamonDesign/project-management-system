import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { showSuccess, showError } from "@/utils/toast";
import { TaskFormSchema, type TaskFormData } from "@/lib/schemas";

// Database RPC result interface
interface TaskRPCResult {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  start_date: string | null;
  end_date: string | null;
  is_daily_task: boolean;
  created_at: string;
  updated_at: string;
  project_name: string;
  project_status: string;
  client_name: string | null;
  is_overdue: boolean;
  days_until_due: number | null;
}

// Normalized Task interface matching the database schema
export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  is_daily_task: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Derived fields from joins
  project_name?: string;
  client_name?: string | null;
  is_overdue?: boolean;
  days_until_due?: number | null;
}

export interface TaskWithContext extends Task {
  project_name: string;
  project_status: string;
  client_name: string | null;
  is_overdue: boolean;
  days_until_due: number | null;
}

// TaskFormSchema moved to @/lib/schemas to fix Fast Refresh warnings

interface TaskContextType {
  tasks: TaskWithContext[];
  isLoadingTasks: boolean;
  // Task CRUD operations
  addTask: (projectId: string, taskData: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, updatedFields: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  // Task status operations
  updateTaskStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
  updateTaskPriority: (taskId: string, newPriority: Task['priority']) => Promise<void>;
  toggleDailyTask: (taskId: string, isDaily: boolean) => Promise<void>;
  // Task organization
  reorderProjectTasks: (projectId: string, taskOrders: { task_id: string; sort_order: number }[]) => Promise<void>;
  // Task queries
  getTasksByProject: (projectId: string) => TaskWithContext[];
  getTasksByStatus: (status: Task['status']) => TaskWithContext[];
  getTasksByPriority: (priority: Task['priority']) => TaskWithContext[];
  getOverdueTasks: () => TaskWithContext[];
  getDueThisWeek: () => TaskWithContext[];
  getUserTaskStats: () => {
    total: number;
    pending: number;
    active: number;
    completed: number;
    overdue: number;
    high_priority: number;
  };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isLoadingSession } = useSession();
  const [tasks, setTasks] = useState<TaskWithContext[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoadingTasks(true);
    
    try {
      // Use the optimized function from the database
      const { data, error } = await supabase
        .rpc('get_user_tasks_with_context', { 
          p_user_id: user.id, 
          p_limit: 1000 
        })
        .abortSignal(signal);

      if (error) {
        throw error;
      }

      // Transform the RPC result to match our interface
      const tasksWithContext: TaskWithContext[] = (data || []).map((task: TaskRPCResult) => ({
        id: task.task_id,
        project_id: task.project_id,
        user_id: user.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        start_date: task.start_date,
        end_date: task.end_date,
        is_daily_task: task.is_daily_task,
        sort_order: 0, // Will be set by reorder function
        created_at: task.created_at,
        updated_at: task.updated_at,
        // Context fields
        project_name: task.project_name,
        project_status: task.project_status,
        client_name: task.client_name,
        is_overdue: task.is_overdue,
        days_until_due: task.days_until_due,
      }));
      
      setTasks(tasksWithContext);
    } catch (error: unknown) {
      // Check if request was aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching tasks:', error);
        }
        showError("Error al cargar las tareas");
      }
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user]);

  // Fetch tasks on mount and user change
  useEffect(() => {
    if (!isLoadingSession) {
      fetchTasks();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTasks, isLoadingSession]);

  const addTask = useCallback(async (projectId: string, taskData: TaskFormData) => {
    if (!user || !isValidUuid(projectId)) {
      throw new Error("ID de proyecto inválido o usuario no autenticado");
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority: taskData.priority,
          start_date: taskData.start_date || null,
          end_date: taskData.end_date || null,
          is_daily_task: taskData.is_daily_task || false,
          sort_order: Date.now() // Simple ordering mechanism
        });

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      showSuccess("Tarea creada exitosamente");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating task:', error);
      }
      showError("Error al crear la tarea");
      throw error;
    }
  }, [user, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, updatedFields: Partial<Task>) => {
    if (!user || !isValidUuid(taskId)) {
      throw new Error("ID de tarea inválido o usuario no autenticado");
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id); // Security: only update own tasks

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      showSuccess("Tarea actualizada exitosamente");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating task:', error);
      }
      showError("Error al actualizar la tarea");
      throw error;
    }
  }, [user, fetchTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user || !isValidUuid(taskId)) {
      throw new Error("ID de tarea inválido o usuario no autenticado");
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id); // Security: only delete own tasks

      if (error) throw error;

      await fetchTasks(); // Refresh the task list
      showSuccess("Tarea eliminada exitosamente");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting task:', error);
      }
      showError("Error al eliminar la tarea");
      throw error;
    }
  }, [user, fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: Task['status']) => {
    await updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  const updateTaskPriority = useCallback(async (taskId: string, newPriority: Task['priority']) => {
    await updateTask(taskId, { priority: newPriority });
  }, [updateTask]);

  const toggleDailyTask = useCallback(async (taskId: string, isDaily: boolean) => {
    await updateTask(taskId, { is_daily_task: isDaily });
  }, [updateTask]);

  const reorderProjectTasks = useCallback(async (projectId: string, taskOrders: { task_id: string; sort_order: number }[]) => {
    if (!user || !isValidUuid(projectId)) {
      throw new Error("ID de proyecto inválido o usuario no autenticado");
    }

    try {
      // Use Promise.all for batch updates
      const updatePromises = taskOrders.map(({ task_id, sort_order }) => 
        supabase
          .from('tasks')
          .update({ sort_order })
          .eq('id', task_id)
          .eq('user_id', user.id)
          .eq('project_id', projectId)
      );

      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error("Error al reordenar algunas tareas");
      }

      await fetchTasks(); // Refresh the task list
      showSuccess("Tareas reordenadas exitosamente");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reordering tasks:', error);
      }
      showError("Error al reordenar las tareas");
      throw error;
    }
  }, [user, fetchTasks]);

  // Query functions (computed values from state)
  const getTasksByProject = useCallback((projectId: string): TaskWithContext[] => {
    return tasks.filter(task => task.project_id === projectId);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: Task['status']): TaskWithContext[] => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getTasksByPriority = useCallback((priority: Task['priority']): TaskWithContext[] => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);

  const getOverdueTasks = useCallback((): TaskWithContext[] => {
    return tasks.filter(task => task.is_overdue);
  }, [tasks]);

  const getDueThisWeek = useCallback((): TaskWithContext[] => {
    return tasks.filter(task => task.days_until_due !== null && task.days_until_due <= 7 && task.days_until_due >= 0);
  }, [tasks]);

  const getUserTaskStats = useCallback(() => {
    const stats = {
      total: tasks.length,
      pending: 0,
      active: 0,
      completed: 0,
      overdue: 0,
      high_priority: 0,
    };

    tasks.forEach(task => {
      if (task.status === 'not-started') stats.pending++;
      if (task.status === 'in-progress') stats.active++;
      if (task.status === 'completed') stats.completed++;
      if (task.is_overdue) stats.overdue++;
      if (task.priority === 'high') stats.high_priority++;
    });

    return stats;
  }, [tasks]);

  const value: TaskContextType = {
    tasks,
    isLoadingTasks,
    // CRUD operations
    addTask,
    updateTask,
    deleteTask,
    // Status operations
    updateTaskStatus,
    updateTaskPriority,
    toggleDailyTask,
    // Organization
    reorderProjectTasks,
    // Queries
    getTasksByProject,
    getTasksByStatus,
    getTasksByPriority,
    getOverdueTasks,
    getDueThisWeek,
    getUserTaskStats,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};