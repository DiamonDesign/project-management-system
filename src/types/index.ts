// Global type definitions for the project

export type Status = 'pending' | 'in-progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'not-started' | 'in-progress' | 'completed';
export type ProjectType = 'web' | 'seo' | 'marketing' | 'branding' | 'ecommerce' | 'mobile' | 'task' | 'maintenance' | 'other';

// Page types for Notion-inspired pages
export type PageType = 
  | 'documentation'
  | 'credentials' 
  | 'specifications'
  | 'meeting-notes'
  | 'research'
  | 'brainstorming'
  | 'checklist'
  | 'general';

// Base interface for entities with timestamps
export interface BaseEntity {
  readonly id: string;
  readonly created_at: string;
  updated_at?: string;
}

// User related types
export interface User extends BaseEntity {
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'client';
}

export interface Session {
  user: User | null;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// Project related types - Legacy Note (for backward compatibility)
export interface Note extends BaseEntity {
  title?: string;
  content: string;
  project_id: string;
}

// New Page interface (extends Note for compatibility)
export interface Page extends BaseEntity {
  title: string;
  content: string;
  project_id: string;
  page_type: PageType;
  icon?: string;
  is_favorited?: boolean;
  tags?: string[];
  template_id?: string;
}

// Page templates
export interface PageTemplate {
  id: string;
  name: string;
  page_type: PageType;
  icon: string;
  content_template: string;
  description: string;
}

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  project_id: string;
  start_date?: string;
  end_date?: string;
  is_daily_task: boolean;
  priority: Priority;
  assigned_to?: string;
}

export interface Project extends BaseEntity {
  user_id: string;
  name: string;
  description: string;
  status: Status;
  project_type?: ProjectType;
  due_date?: string;
  client_id?: string | null;
  notes: Note[]; // Legacy support
  pages?: Page[]; // New pages system
  tasks: Task[];
  progress_percentage?: number;
}

// Client related types
export interface ClientInvite extends BaseEntity {
  email: string;
  invite_code: string;
  project_id: string;
  invited_by: string;
  accepted_at?: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface Client extends BaseEntity {
  user_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  avatar_url?: string;
  invited_by?: string;
  projects: Project[];
}

// Form types
export interface ProjectFormData {
  name: string;
  description: string;
  status: Status;
  project_type?: ProjectType;
  dueDate?: string | null;
  client_id?: string | null;
}

export interface TaskFormData {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  priority?: Priority;
}

export interface ClientFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

export interface NoteFormData {
  title?: string;
  content: string;
}

export interface PageFormData {
  title: string;
  content: string;
  page_type: PageType;
  icon?: string;
  tags?: string[];
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Context types
export interface ProjectContextValue {
  projects: Project[];
  isLoadingProjects: boolean;
  addProject: (projectData: ProjectFormData) => Promise<void>;
  updateProject: (projectId: string, updatedFields: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  // Legacy note methods (backward compatibility)
  addNoteToProject: (projectId: string, title: string, content: string) => Promise<void>;
  deleteNoteFromProject: (projectId: string, noteId: string) => Promise<void>;
  // New page methods
  addPageToProject: (projectId: string, pageData: PageFormData) => Promise<void>;
  updatePageInProject: (projectId: string, pageId: string, updatedFields: Partial<Page>) => Promise<void>;
  deletePageFromProject: (projectId: string, pageId: string) => Promise<void>;
  // Task methods
  addTaskToProject: (
    projectId: string,
    title: string,
    description?: string,
    start_date?: string,
    end_date?: string,
    priority?: Priority
  ) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: string, newStatus: TaskStatus) => Promise<void>;
  updateTaskDailyStatus: (projectId: string, taskId: string, isDaily: boolean) => Promise<void>;
  updateTask: (projectId: string, taskId: string, updatedFields: Partial<Task>) => Promise<void>;
  deleteTaskFromProject: (projectId: string, taskId: string) => Promise<void>;
}

export interface ClientContextValue {
  clients: Client[];
  isLoadingClients: boolean;
  addClient: (clientData: ClientFormData) => Promise<void>;
  updateClient: (clientId: string, updatedFields: Partial<Client>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  inviteClient: (email: string, projectId: string) => Promise<void>;
}

export interface SessionContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData?: Partial<User>) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

// Component prop types
export interface ComponentWithChildren {
  children: React.ReactNode;
}

export interface ComponentWithClassName {
  className?: string;
}

export interface LoadingProps {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ErrorProps {
  error?: Error | string | null;
  onRetry?: () => void;
}

// Utility types
export type NonEmptyArray<T> = [T, ...T[]];

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types
export interface CustomEvent<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
}

// Browser API extensions
export interface NavigatorExtended extends Navigator {
  standalone?: boolean;
  connection?: {
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    rtt: number;
    downlink: number;
  };
}

export interface PerformanceExtended extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Error handling types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export interface DatabaseError extends AppError {
  constraint?: string;
  column?: string;
  table?: string;
}

// Filter and sort types
export interface FilterOptions {
  status?: Status[];
  priority?: Priority[];
  client_id?: string;
  search?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Chart and analytics types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

// Recharts tooltip props
export interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    fill?: string;
    name?: string;
    payload?: Record<string, unknown>;
    stroke?: string;
    strokeDasharray?: string;
    type?: string;
    value?: number | string;
  }>;
  label?: string | number;
  coordinate?: {
    x: number;
    y: number;
  };
}

// Recharts pie chart label props
export interface RechartsPieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index?: number;
  name?: string;
  value?: number;
  fill?: string;
}

export interface AnalyticsData {
  projects: {
    total: number;
    byStatus: Record<Status, number>;
  };
  tasks: {
    total: number;
    completed: number;
    byPriority: Record<Priority, number>;
  };
  clients: {
    total: number;
    active: number;
  };
  timeSeriesData: TimeSeriesDataPoint[];
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Route types
export interface RouteParams {
  id?: string;
  clientId?: string;
  projectId?: string;
  taskId?: string;
}

// Configuration types
export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  features: {
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableClientPortal: boolean;
  };
}

// Page type constants and helpers
export const PAGE_TYPE_CONFIG: Record<PageType, { name: string; icon: string; description: string; color: string }> = {
  documentation: {
    name: 'Documentación',
    icon: '📝',
    description: 'Documentación técnica y guías',
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  credentials: {
    name: 'Credenciales',
    icon: '🔐',
    description: 'Contraseñas y accesos seguros',
    color: 'bg-red-50 border-red-200 text-red-800'
  },
  specifications: {
    name: 'Especificaciones',
    icon: '⚙️',
    description: 'Requirements y especificaciones técnicas',
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  'meeting-notes': {
    name: 'Notas de Reunión',
    icon: '👥',
    description: 'Notas y acuerdos de reuniones',
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  research: {
    name: 'Investigación',
    icon: '🔍',
    description: 'Investigación y análisis',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  brainstorming: {
    name: 'Brainstorming',
    icon: '💡',
    description: 'Ideas y lluvia de ideas',
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  checklist: {
    name: 'Checklist',
    icon: '☑️',
    description: 'Listas de verificación',
    color: 'bg-teal-50 border-teal-200 text-teal-800'
  },
  general: {
    name: 'General',
    icon: '📄',
    description: 'Notas generales',
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  }
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'documentation-template',
    name: 'Documentación',
    page_type: 'documentation',
    icon: '📝',
    description: 'Plantilla para documentación técnica',
    content_template: `<h1>Título de la Documentación</h1>
<h2>Resumen</h2>
<p>Breve descripción del propósito de esta documentación.</p>

<h2>Detalles</h2>
<p>Contenido detallado aquí...</p>

<h2>Referencias</h2>
<ul>
<li>Enlace 1</li>
<li>Enlace 2</li>
</ul>`
  },
  {
    id: 'credentials-template',
    name: 'Credenciales',
    page_type: 'credentials',
    icon: '🔐',
    description: 'Plantilla para almacenar credenciales',
    content_template: `<h1>Credenciales de Acceso</h1>
<h2>Servicio/Plataforma</h2>
<p><strong>URL:</strong> </p>
<p><strong>Usuario:</strong> </p>
<p><strong>Email:</strong> </p>
<p><strong>Contraseña:</strong> [REDACTADO]</p>

<h2>Notas Adicionales</h2>
<p>Información relevante sobre el acceso...</p>`
  },
  {
    id: 'meeting-notes-template',
    name: 'Notas de Reunión',
    page_type: 'meeting-notes',
    icon: '👥',
    description: 'Plantilla para notas de reunión',
    content_template: `<h1>Reunión - [Tema]</h1>
<p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Participantes:</strong> </p>

<h2>Agenda</h2>
<ul>
<li>Punto 1</li>
<li>Punto 2</li>
</ul>

<h2>Notas</h2>
<p>Notas principales de la reunión...</p>

<h2>Acuerdos y Siguientes Pasos</h2>
<ul>
<li>[ ] Acción 1</li>
<li>[ ] Acción 2</li>
</ul>`
  }
];

// Type guards
export const isUser = (obj: unknown): obj is User => {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'email' in obj && 
    typeof (obj as Record<string, unknown>).id === 'string' && 
    typeof (obj as Record<string, unknown>).email === 'string';
};

export const isProject = (obj: unknown): obj is Project => {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'name' in obj && 
    typeof (obj as Record<string, unknown>).id === 'string' && 
    typeof (obj as Record<string, unknown>).name === 'string';
};

export const isTask = (obj: unknown): obj is Task => {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'title' in obj && 
    typeof (obj as Record<string, unknown>).id === 'string' && 
    typeof (obj as Record<string, unknown>).title === 'string';
};

export const isClient = (obj: unknown): obj is Client => {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'email' in obj && 
    typeof (obj as Record<string, unknown>).id === 'string' && 
    typeof (obj as Record<string, unknown>).email === 'string';
};

export const isPage = (obj: unknown): obj is Page => {
  return obj !== null && typeof obj === 'object' && 'id' in obj && 'title' in obj && 'page_type' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' && 
    typeof (obj as Record<string, unknown>).title === 'string' &&
    typeof (obj as Record<string, unknown>).page_type === 'string';
};

// Branded types for better type safety
export type ProjectId = string & { __brand: 'ProjectId' };
export type TaskId = string & { __brand: 'TaskId' };
export type ClientId = string & { __brand: 'ClientId' };
export type UserId = string & { __brand: 'UserId' };
export type PageId = string & { __brand: 'PageId' };

export const createProjectId = (id: string): ProjectId => id as ProjectId;
export const createTaskId = (id: string): TaskId => id as TaskId;
export const createClientId = (id: string): ClientId => id as ClientId;
export const createUserId = (id: string): UserId => id as UserId;
export const createPageId = (id: string): PageId => id as PageId;

// Project type constants and helpers
export const PROJECT_TYPE_CONFIG: Record<ProjectType, { name: string; icon: string; description: string; color: string }> = {
  web: {
    name: 'Proyecto Web',
    icon: '🌐',
    description: 'Desarrollo de sitios web y aplicaciones',
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  seo: {
    name: 'SEO',
    icon: '🔍',
    description: 'Optimización para motores de búsqueda',
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  marketing: {
    name: 'Marketing',
    icon: '📢',
    description: 'Campañas de marketing digital',
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  branding: {
    name: 'Branding',
    icon: '🎨',
    description: 'Diseño de identidad y branding',
    color: 'bg-pink-50 border-pink-200 text-pink-800'
  },
  ecommerce: {
    name: 'E-commerce',
    icon: '🛒',
    description: 'Tiendas online y comercio electrónico',
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  mobile: {
    name: 'App Móvil',
    icon: '📱',
    description: 'Desarrollo de aplicaciones móviles',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  },
  task: {
    name: 'Tarea Suelta',
    icon: '⚡',
    description: 'Tareas independientes y trabajos menores',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  maintenance: {
    name: 'Mantenimiento',
    icon: '🔧',
    description: 'Mantenimiento y actualizaciones',
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  },
  other: {
    name: 'Otro',
    icon: '📋',
    description: 'Otros tipos de proyectos',
    color: 'bg-slate-50 border-slate-200 text-slate-800'
  }
};