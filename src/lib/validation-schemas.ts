/**
 * Validation Schemas with Zod
 * Replaces unsafe type casting with runtime validation
 */

import { z } from "zod";

// Client Portal Access Schema
export const ClientPortalAccessSchema = z.object({
  is_client: z.boolean().nullish(),
  assigned_projects: z.array(z.string()).nullish(),
  invite_token: z.string().nullish(),
  invited_by: z.string().nullish(),
  invited_at: z.string().nullish(),
}).nullish();

// User Profile Schema - handle database nulls properly
export const UserProfileSchema = z.object({
  id: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  last_login: z.string().nullable().optional(),
  login_count: z.number().nullable().optional(),
  client_portal_access: ClientPortalAccessSchema,
}).nullable();

// Supabase Error Schema
export const SupabaseErrorSchema = z.object({
  code: z.string().nullish(),
  message: z.string().nullish(),
}).nullable();

// Profile Query Result Schema (for SessionContext critical case)
export const ProfileQueryResultSchema = z.object({
  data: UserProfileSchema,
  error: SupabaseErrorSchema,
}).nullable();

// App Error Schema (used throughout the app)
export const AppErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

// Database Error Schema
export const DatabaseErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  hint: z.string().optional(),
  details: z.string().optional(),
});

// Performance Related Schemas
export const PerformanceMemorySchema = z.object({
  usedJSHeapSize: z.number(),
  totalJSHeapSize: z.number(),
  jsHeapSizeLimit: z.number(),
});

export const PerformanceExtendedSchema = z.object({
  memory: PerformanceMemorySchema.optional(),
});

// Navigator Extended Schema
export const NavigatorExtendedSchema = z.object({
  standalone: z.boolean().optional(),
  connection: z.object({
    effectiveType: z.string().optional(),
    downlink: z.number().optional(),
    rtt: z.number().optional(),
  }).optional(),
});

// Generic validation helpers
export function validateData<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string = "Unknown"
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error(`Validation failed in ${context}:`, error);
    throw new Error(`Invalid data structure in ${context}: ${error instanceof z.ZodError ? error.message : 'Unknown validation error'}`);
  }
}

export function safeValidateData<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fallback: T,
  context: string = "Unknown"
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.warn(`Validation failed in ${context}, using fallback:`, error);
    return fallback;
  }
}

// Type guards with Zod validation
export function isValidProfileResult(data: unknown): data is z.infer<typeof ProfileQueryResultSchema> {
  return ProfileQueryResultSchema.safeParse(data).success;
}

export function isValidAppError(data: unknown): data is z.infer<typeof AppErrorSchema> {
  return AppErrorSchema.safeParse(data).success;
}

export function isValidDatabaseError(data: unknown): data is z.infer<typeof DatabaseErrorSchema> {
  return DatabaseErrorSchema.safeParse(data).success;
}

// Safe casting functions that replace unsafe 'as' casting
export function safeCastToAppError(error: unknown): z.infer<typeof AppErrorSchema> {
  return safeValidateData(
    error,
    AppErrorSchema,
    { message: error instanceof Error ? error.message : 'Unknown error' },
    'AppError casting'
  );
}

export function safeCastToDatabaseError(error: unknown): z.infer<typeof DatabaseErrorSchema> {
  return safeValidateData(
    error,
    DatabaseErrorSchema,
    { message: error instanceof Error ? error.message : 'Database error' },
    'DatabaseError casting'
  );
}

export function safeCastToProfileResult(data: unknown): z.infer<typeof ProfileQueryResultSchema> {
  return safeValidateData(
    data,
    ProfileQueryResultSchema,
    { data: null, error: null },
    'ProfileQueryResult casting'
  );
}