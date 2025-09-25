/**
 * Shared Types for Context Separation
 *
 * These types are shared across multiple contexts to maintain
 * compatibility while separating concerns.
 */

// Legacy Note interface for backward compatibility
export interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
}

// Task interface with optimized project data
export interface Task {
  id: string;
  title: string; // Nombre corto de la tarea
  description?: string; // Descripción detallada
  status: 'not-started' | 'in-progress' | 'completed';
  createdAt: string;
  start_date?: string;
  end_date?: string;   // Fecha límite / due date
  is_daily_task?: boolean;
  priority?: 'low' | 'medium' | 'high';
  // Optimized project data (denormalized for performance)
  projectId?: string;
  projectName?: string;
}

// Page interface (imported from types/index.ts if it exists)
export interface Page {
  id: string;
  title: string;
  content: string;
  type: 'content' | 'landing' | 'ecommerce' | 'blog' | 'portfolio' | 'other';
  url?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt?: string;
  projectId: string;
}

// Project interface with both legacy notes and new pages
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  project_type?: 'web' | 'seo' | 'marketing' | 'branding' | 'ecommerce' | 'mobile' | 'task' | 'maintenance' | 'other';
  dueDate?: string;
  client_id?: string | null;
  archived?: boolean;
  archived_at?: string | null;
  // Optimized client data (denormalized for performance)
  clientName?: string | null;
  clientEmail?: string | null;
  clientCompany?: string | null;
  notes: Note[]; // Legacy support
  pages?: Page[]; // New pages system
  tasks: Task[];
  created_at: string;
}

// Common form data types
export interface ProjectFormData {
  name: string;
  description: string;
  project_type?: Project['project_type'];
  dueDate?: string;
  client_id?: string;
}

export interface PageFormData {
  title: string;
  content: string;
  type: Page['type'];
  url?: string;
  status: Page['status'];
}