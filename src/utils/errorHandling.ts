/**
 * Centralized error handling utilities
 * Best practices for consistent error management across the application
 */

export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Server errors (5xx)
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // User management errors
  USER_FIND_ERROR = 'USER_FIND_ERROR',
  USER_SEARCH_ERROR = 'USER_SEARCH_ERROR',
  USER_FIND_ALL_ERROR = 'USER_FIND_ALL_ERROR',
  USER_CREATE_ERROR = 'USER_CREATE_ERROR',
  USER_UPDATE_ERROR = 'USER_UPDATE_ERROR',
  USER_DELETE_ERROR = 'USER_DELETE_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public originalError?: any,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Check if error is recoverable (client can retry)
   */
  isRecoverable(): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.DATABASE_ERROR
    ].includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.VALIDATION_ERROR]: 'Les données fournies sont invalides',
      [ErrorCode.NOT_FOUND]: 'Ressource introuvable',
      [ErrorCode.UNAUTHORIZED]: 'Authentification requise',
      [ErrorCode.FORBIDDEN]: 'Accès interdit',
      [ErrorCode.DATABASE_ERROR]: 'Erreur de base de données',
      [ErrorCode.NETWORK_ERROR]: 'Erreur de connexion',
      [ErrorCode.INTERNAL_ERROR]: 'Erreur interne du serveur',
      [ErrorCode.CONNECTION_ERROR]: 'Erreur de connexion au serveur',
      [ErrorCode.NOT_IMPLEMENTED]: 'Fonctionnalité non implémentée',
      [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Opération non autorisée',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Permissions insuffisantes',
      [ErrorCode.USER_FIND_ERROR]: 'Utilisateur introuvable',
      [ErrorCode.USER_SEARCH_ERROR]: 'Erreur lors de la recherche d\'utilisateurs',
      [ErrorCode.USER_FIND_ALL_ERROR]: 'Erreur lors du chargement des utilisateurs',
      [ErrorCode.USER_CREATE_ERROR]: 'Erreur lors de la création de l\'utilisateur',
      [ErrorCode.USER_UPDATE_ERROR]: 'Erreur lors de la mise à jour de l\'utilisateur',
      [ErrorCode.USER_DELETE_ERROR]: 'Erreur lors de la suppression de l\'utilisateur',
    };

    return messages[this.code] || 'Une erreur inattendue s\'est produite';
  }

  /**
   * Convert to JSON for logging/API responses
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.getUserMessage(),
      metadata: this.metadata,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Error logger utility
 */
export class ErrorLogger {
  static log(error: Error | AppError, context?: string): void {
    const timestamp = new Date().toISOString();
    
    if (error instanceof AppError) {
      console.error(`[${timestamp}] ${context || 'Error'}:`, {
        code: error.code,
        message: error.message,
        metadata: error.metadata,
        originalError: error.originalError,
        stack: error.stack,
      });
    } else {
      console.error(`[${timestamp}] ${context || 'Unexpected Error'}:`, {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  static logAndThrow(error: Error | AppError, context?: string): never {
    this.log(error, context);
    throw error;
  }
}

/**
 * Async error wrapper for consistent error handling
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, AppError | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(ErrorCode.INTERNAL_ERROR, 'Unexpected error', error);
    
    ErrorLogger.log(appError, context);
    return [null, appError];
  }
}

/**
 * Validation helper
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} is required`,
      undefined,
      { field: fieldName }
    );
  }
  return value;
}

/**
 * Retry logic for recoverable errors
 */
export async function retryOnError<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | AppError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error | AppError;
      
      // Only retry if error is recoverable
      if (error instanceof AppError && !error.isRecoverable()) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError!;
}
