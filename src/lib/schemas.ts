import { z } from "zod";
import { isValidUuid, validationSchemas } from "./security";

// Project Form Schema - Moved from ProjectContext to fix Fast Refresh
export const ProjectFormSchema = z.object({
  name: validationSchemas.projectTitle,
  description: validationSchemas.description,
  status: z.enum(["pending", "in-progress", "completed"], {
    required_error: "Por favor, selecciona un estado para el proyecto.",
  }),
  project_type: z.enum(["web", "seo", "marketing", "branding", "ecommerce", "mobile", "task", "maintenance", "other"]).optional(),
  dueDate: z.string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate >= new Date();
    }, "La fecha límite debe ser válida y en el futuro"),
  client_id: z.string()
    .optional()
    .nullable()
    .refine((id) => {
      if (!id || id === '') return true;
      return isValidUuid(id);
    }, "ID de cliente inválido"),
});

// Client Form Schema - Moved from ClientContext to fix Fast Refresh
export const ClientFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre del cliente debe tener al menos 2 caracteres.",
  }),
  email: z.string().email("Formato de email inválido.").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")), // Nuevo campo
  cif: z.string().optional().or(z.literal("")),     // Nuevo campo
});

// Task Form Schema - Moved from TaskContext to fix Fast Refresh
export const TaskFormSchema = z.object({
  title: validationSchemas.projectTitle,
  description: z.string().max(5000, "La descripción no puede exceder 5000 caracteres").optional(),
  status: z.enum(["not-started", "in-progress", "completed"], {
    required_error: "Por favor, selecciona un estado para la tarea.",
  }),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Por favor, selecciona una prioridad.",
  }),
  start_date: z.string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "La fecha de inicio debe ser válida"),
  end_date: z.string()
    .optional()
    .nullable()
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && new Date(date) >= new Date();
    }, "La fecha límite debe ser válida y en el futuro"),
  is_daily_task: z.boolean().optional().default(false),
});

// Page Form Schema
export const PageFormSchema = z.object({
  title: z.string()
    .min(1, "El título es requerido")
    .max(200, "El título debe tener menos de 200 caracteres"),
  content: z.string()
    .max(50000, "El contenido debe tener menos de 50000 caracteres")
    .optional()
    .default(""),
  page_type: z.enum(['note', 'brief', 'spec', 'documentation', 'meeting', 'other']).default('note'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().optional().nullable(),
});

// Export types
export type ProjectFormData = z.infer<typeof ProjectFormSchema>;
export type ClientFormData = z.infer<typeof ClientFormSchema>;
export type TaskFormData = z.infer<typeof TaskFormSchema>;
export type PageFormData = z.infer<typeof PageFormSchema>;