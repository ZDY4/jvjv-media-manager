/**
 * Logger utility for consistent logging across the application
 * Suppresses logs in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private isDev: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development' || !process.argv?.includes('--dev');
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // Store in memory buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Only output to console in development
    if (this.isDev) {
      const formatted = this.formatMessage(level, message, context);
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear log buffer
  clear(): void {
    this.logs = [];
  }
}

export const logger = new Logger();

// Export individual functions for convenience
export const logDebug = (message: string, context?: Record<string, unknown>) =>
  logger.debug(message, context);
export const logInfo = (message: string, context?: Record<string, unknown>) =>
  logger.info(message, context);
export const logWarn = (message: string, context?: Record<string, unknown>) =>
  logger.warn(message, context);
export const logError = (message: string, context?: Record<string, unknown>) =>
  logger.error(message, context);
