import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { es } from "date-fns/locale"; // Importar el locale español
import { isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates if a value is a valid Date object or can be converted to one
 */
export function isValidDate(date: unknown): date is Date {
  if (!date) return false;

  // If it's already a Date object
  if (date instanceof Date) {
    return isValid(date) && !isNaN(date.getTime());
  }

  // If it's a string, try to parse it
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) && !isNaN(parsed.getTime());
  }

  // If it's a number (timestamp)
  if (typeof date === 'number') {
    const parsed = new Date(date);
    return isValid(parsed) && !isNaN(parsed.getTime());
  }

  return false;
}

/**
 * Safely converts a value to a Date object
 * Returns null if the value cannot be converted to a valid date
 * ENHANCED: Validates date ranges to prevent extreme dates
 */
export function safeToDate(date: unknown): Date | null {
  if (!date) return null;

  try {
    let parsed: Date | null = null;

    // If it's already a Date object
    if (date instanceof Date) {
      parsed = isValid(date) && !isNaN(date.getTime()) ? date : null;
    }
    // If it's a string, try to parse it
    else if (typeof date === 'string') {
      const trimmed = date.trim();
      if (trimmed === '') return null;

      const parsedDate = parseISO(trimmed);
      parsed = isValid(parsedDate) && !isNaN(parsedDate.getTime()) ? parsedDate : null;
    }
    // If it's a number (timestamp)
    else if (typeof date === 'number') {
      const parsedDate = new Date(date);
      parsed = isValid(parsedDate) && !isNaN(parsedDate.getTime()) ? parsedDate : null;
    }

    // ENHANCED: Validate date range to prevent extreme dates
    if (parsed) {
      const year = parsed.getFullYear();
      // Reasonable range for project management dates
      if (year < 1970 || year > 2100) {
        console.warn('safeToDate: Date outside reasonable range (1970-2100):', parsed);
        return null;
      }
    }

    return parsed;
  } catch (error) {
    console.warn('safeToDate: Error converting date:', error, date);
    return null;
  }
}

/**
 * Creates a date-safe formatter that won't crash on invalid dates
 */
export function safeDateFormat(date: unknown, formatStr: string, formatFn: (date: Date, format: string, options?: unknown) => string, options?: unknown): string | null {
  const safeDate = safeToDate(date);
  if (!safeDate) {
    console.warn('safeDateFormat: Invalid date provided:', date);
    return null;
  }

  try {
    return formatFn(safeDate, formatStr, options);
  } catch (error) {
    console.error('safeDateFormat: Error formatting date:', error, safeDate, formatStr);
    return null;
  }
}

/**
 * Type guard to ensure CalendarEvent has a valid date
 * ENHANCED: More robust validation with better error reporting
 */
export function isValidCalendarEvent(event: unknown): event is { id: string; title: string; date: Date; type: string; priority?: string; projectName?: string; status?: string } {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const e = event as Record<string, unknown>;

  // Validate required fields
  if (typeof e.id !== 'string' || e.id.trim() === '') {
    return false;
  }

  if (typeof e.title !== 'string' || e.title.trim() === '') {
    return false;
  }

  if (typeof e.type !== 'string' || e.type.trim() === '') {
    return false;
  }

  // ENHANCED: Validate date with additional checks
  if (!isValidDate(e.date)) {
    return false;
  }

  // Additional safety: ensure date is within reasonable range
  const safeDate = safeToDate(e.date);
  if (!safeDate) {
    return false;
  }

  return true;
}

/**
 * ENHANCED: Validates project data for calendar use
 */
export function isValidCalendarProject(project: unknown): boolean {
  if (!project || typeof project !== 'object') return false;

  const p = project as Record<string, unknown>;
  return typeof p.id === 'string' &&
         typeof p.name === 'string' &&
         p.name.trim() !== '';
}

/**
 * ENHANCED: Validates task data for calendar use
 */
export function isValidCalendarTask(task: unknown): boolean {
  if (!task || typeof task !== 'object') return false;

  const t = task as Record<string, unknown>;
  return typeof t.id === 'string' &&
         typeof t.title === 'string' &&
         t.title.trim() !== '';
}

export { es }; // Exportar el locale para usarlo en otros componentes