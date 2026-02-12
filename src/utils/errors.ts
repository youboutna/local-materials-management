/**
 * Application Error Classes
 * Centralized error handling following PROMPTS.md Rule #4
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: string,
    originalError?: unknown,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      stack: this.stack
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', undefined, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', details, 409);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', undefined, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 'FORBIDDEN', undefined, 403);
    this.name = 'ForbiddenError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DATABASE_ERROR', originalError, 500);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'NETWORK_ERROR', originalError, 503);
    this.name = 'NetworkError';
  }
}

export class ServiceError extends AppError {
  constructor(serviceName: string, operation: string, originalError?: unknown) {
    const message = `Error in ${serviceName} during ${operation}`;
    super(message, 'SERVICE_ERROR', originalError, 500);
    this.name = 'ServiceError';
  }
}

/**
 * Error factory functions
 */
export const ErrorFactory = {
  validation: (message: string, details?: Record<string, unknown>) => 
    new ValidationError(message, details),
  
  notFound: (resource: string, id?: string) => 
    new NotFoundError(resource, id),
  
  conflict: (message: string, details?: Record<string, unknown>) => 
    new ConflictError(message, details),
  
  unauthorized: (message?: string) => 
    new UnauthorizedError(message),
  
  forbidden: (message?: string) => 
    new ForbiddenError(message),
  
  database: (message: string, originalError?: unknown) => 
    new DatabaseError(message, originalError),
  
  network: (message: string, originalError?: unknown) => 
    new NetworkError(message, originalError),
  
  service: (serviceName: string, operation: string, originalError?: unknown) => 
    new ServiceError(serviceName, operation, originalError)
};

/**
 * Error handler utility
 */
export const ErrorHandler = {
  /**
   * Check if an error is operational
   */
  isOperational: (error: unknown): error is AppError => {
    return error instanceof AppError && error.isOperational;
  },

  /**
   * Get error message safely
   */
  getMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  },

  /**
   * Get error code safely
   */
  getCode: (error: unknown): string => {
    if (error instanceof AppError) {
      return error.code;
    }
    return 'UNKNOWN_ERROR';
  },

  /**
   * Get error status code safely
   */
  getStatusCode: (error: unknown): number => {
    if (error instanceof AppError) {
      return error.statusCode;
    }
    return 500;
  },

  /**
   * Log error with context
   */
  log: (error: unknown, context?: Record<string, unknown>) => {
    const errorInfo = {
      message: ErrorHandler.getMessage(error),
      code: ErrorHandler.getCode(error),
      statusCode: ErrorHandler.getStatusCode(error),
      context,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    };

    console.error('Application Error:', errorInfo);
  }
};
