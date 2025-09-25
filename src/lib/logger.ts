/**
 * Secure Centralized Logging System
 * Replaces unsafe console statements with production-safe logging
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

class SecureLogger {
  private isDevelopment: boolean;
  private sensitivePatterns: RegExp[];

  constructor() {
    // Use import.meta.env.DEV for Vite consistency
    this.isDevelopment = import.meta.env.DEV;

    // Patterns for sensitive data detection
    this.sensitivePatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, // UUIDs
      /\b[A-Za-z0-9+/]{20,}={0,2}\b/g, // base64 tokens
      /\bpass(word|wd)\b/gi, // password fields
      /\btoken\b/gi, // token fields
      /\bsecret\b/gi, // secret fields
      /\bkey\b/gi, // key fields
    ];
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: unknown): unknown {
    if (!data) return data;

    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

    let sanitized = dataStr;
    this.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    try {
      return typeof data === 'string' ? sanitized : JSON.parse(sanitized);
    } catch {
      return sanitized;
    }
  }

  /**
   * Create formatted log entry
   */
  private createLogEntry(level: LogLevel, context: string, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data: this.isDevelopment ? data : this.sanitizeData(data)
    };
  }

  /**
   * Internal logging method
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.isDevelopment) {
      // In production, only log critical errors to help with debugging
      if (entry.level === 'error') {
        console.error(`[${entry.context}] ${entry.message}`);
      }
      return;
    }

    // In development, log everything with full context
    const prefix = `[${entry.context}]`;
    const message = entry.message;

    switch (entry.level) {
      case 'error':
        console.error(prefix, message, entry.data);
        break;
      case 'warn':
        console.warn(prefix, message, entry.data);
        break;
      case 'info':
        console.info(prefix, message, entry.data);
        break;
      case 'log':
      default:
        console.log(prefix, message, entry.data);
        break;
    }
  }

  /**
   * Public logging methods
   */
  log(context: string, message: string, data?: unknown): void {
    const entry = this.createLogEntry('log', context, message, data);
    this.logToConsole(entry);
  }

  info(context: string, message: string, data?: unknown): void {
    const entry = this.createLogEntry('info', context, message, data);
    this.logToConsole(entry);
  }

  warn(context: string, message: string, data?: unknown): void {
    const entry = this.createLogEntry('warn', context, message, data);
    this.logToConsole(entry);
  }

  error(context: string, message: string, error?: unknown): void {
    const entry = this.createLogEntry('error', context, message, error);
    this.logToConsole(entry);
  }

  /**
   * Special method for authentication related logs
   */
  auth(message: string, data?: unknown): void {
    this.log('Auth', message, data);
  }

  /**
   * Special method for session related logs
   */
  session(message: string, data?: unknown): void {
    this.log('SessionContext', message, data);
  }

  /**
   * Special method for API related logs
   */
  api(message: string, data?: unknown): void {
    this.log('API', message, data);
  }

  /**
   * Method to check if development mode is active
   */
  isDev(): boolean {
    return this.isDevelopment;
  }
}

// Create singleton instance
export const logger = new SecureLogger();

// Export convenience methods
export const {
  log,
  info,
  warn,
  error,
  auth,
  session,
  api
} = logger;

// Export type for external usage
export type { LogLevel };