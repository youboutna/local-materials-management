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
  ROLE_ASSIGNMENT_ERROR = 'ROLE_ASSIGNMENT_ERROR',
  ROLE_REVOCATION_ERROR = 'ROLE_REVOCATION_ERROR',
  ROLE_FETCH_ERROR = 'ROLE_FETCH_ERROR',
  ROLE_UPDATE_ERROR = 'ROLE_UPDATE_ERROR',
  ROLE_EXPORT_ERROR = 'ROLE_EXPORT_ERROR',
  PROFILE_CREATE_ERROR = 'PROFILE_CREATE_ERROR',
  PROFILE_UPDATE_ERROR = 'PROFILE_UPDATE_ERROR',
  PROFILE_DELETE_ERROR = 'PROFILE_DELETE_ERROR',
  PROFILE_FETCH_ERROR = 'PROFILE_FETCH_ERROR',
  PROFILE_SYNC_ERROR = 'PROFILE_SYNC_ERROR',
  PROFILE_EXPORT_ERROR = 'PROFILE_EXPORT_ERROR',
  PROFILE_IMPORT_ERROR = 'PROFILE_IMPORT_ERROR',
  
  // Authentication errors
  AUTH_CONFIG_ERROR = 'AUTH_CONFIG_ERROR',
  AUTH_SIGNIN_ERROR = 'AUTH_SIGNIN_ERROR',
  AUTH_SIGNUP_ERROR = 'AUTH_SIGNUP_ERROR',
  AUTH_SIGNOUT_ERROR = 'AUTH_SIGNOUT_ERROR',
  AUTH_SESSION_REFRESH_ERROR = 'AUTH_SESSION_REFRESH_ERROR',
  AUTH_PASSWORD_RESET_ERROR = 'AUTH_PASSWORD_RESET_ERROR',
  AUTH_PASSWORD_CHANGE_ERROR = 'AUTH_PASSWORD_CHANGE_ERROR',
  AUTH_USER_UPDATE_ERROR = 'AUTH_USER_UPDATE_ERROR',
  AUTH_USER_INFO_ERROR = 'AUTH_USER_INFO_ERROR',
  AUTH_USER_SEARCH_ERROR = 'AUTH_USER_SEARCH_ERROR',
  AUTH_USER_COUNT_ERROR = 'AUTH_USER_COUNT_ERROR',
  AUTH_EMAIL_CHECK_ERROR = 'AUTH_EMAIL_CHECK_ERROR',
  AUTH_MANAGEMENT_TOKEN_ERROR = 'AUTH_MANAGEMENT_TOKEN_ERROR',
  
  // Provider errors
  PROVIDER_SWITCH_ERROR = 'PROVIDER_SWITCH_ERROR',
  PROVIDER_NOT_ENABLED = 'PROVIDER_NOT_ENABLED',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
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
      // Client errors (4xx)
      [ErrorCode.VALIDATION_ERROR]: 'Les données fournies sont invalides',
      [ErrorCode.NOT_FOUND]: 'Ressource introuvable',
      [ErrorCode.UNAUTHORIZED]: 'Authentification requise',
      [ErrorCode.FORBIDDEN]: 'Accès interdit',
      
      // Server errors (5xx)
      [ErrorCode.DATABASE_ERROR]: 'Erreur de base de données',
      [ErrorCode.NETWORK_ERROR]: 'Erreur de connexion',
      [ErrorCode.INTERNAL_ERROR]: 'Erreur interne du serveur',
      [ErrorCode.CONNECTION_ERROR]: 'Erreur de connexion au serveur',
      [ErrorCode.NOT_IMPLEMENTED]: 'Fonctionnalité non implémentée',
      
      // Business logic errors
      [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Opération non autorisée',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Permissions insuffisantes',
      
      // User management errors
      [ErrorCode.USER_FIND_ERROR]: 'Utilisateur introuvable',
      [ErrorCode.USER_SEARCH_ERROR]: 'Erreur lors de la recherche d\'utilisateurs',
      [ErrorCode.USER_FIND_ALL_ERROR]: 'Erreur lors du chargement des utilisateurs',
      [ErrorCode.USER_CREATE_ERROR]: 'Erreur lors de la création de l\'utilisateur',
      [ErrorCode.USER_UPDATE_ERROR]: 'Erreur lors de la mise à jour de l\'utilisateur',
      [ErrorCode.USER_DELETE_ERROR]: 'Erreur lors de la suppression de l\'utilisateur',
      [ErrorCode.ROLE_ASSIGNMENT_ERROR]: 'Erreur lors de l\'assignation du rôle',
      [ErrorCode.ROLE_REVOCATION_ERROR]: 'Erreur lors de la révocation du rôle',
      [ErrorCode.ROLE_FETCH_ERROR]: 'Erreur lors de la récupération des rôles',
      [ErrorCode.ROLE_UPDATE_ERROR]: 'Erreur lors de la mise à jour du rôle',
      [ErrorCode.ROLE_EXPORT_ERROR]: 'Erreur lors de l\'exportation des rôles',
      [ErrorCode.PROFILE_CREATE_ERROR]: 'Erreur lors de la création du profil',
      [ErrorCode.PROFILE_UPDATE_ERROR]: 'Erreur lors de la mise à jour du profil',
      [ErrorCode.PROFILE_DELETE_ERROR]: 'Erreur lors de la suppression du profil',
      [ErrorCode.PROFILE_FETCH_ERROR]: 'Erreur lors de la récupération du profil',
      [ErrorCode.PROFILE_SYNC_ERROR]: 'Erreur lors de la synchronisation du profil',
      [ErrorCode.PROFILE_EXPORT_ERROR]: 'Erreur lors de l\'exportation du profil',
      [ErrorCode.PROFILE_IMPORT_ERROR]: 'Erreur lors de l\'importation du profil',
      
      // Authentication errors
      [ErrorCode.AUTH_CONFIG_ERROR]: 'Erreur de configuration de l\'authentification',
      [ErrorCode.AUTH_SIGNIN_ERROR]: 'Erreur lors de la connexion',
      [ErrorCode.AUTH_SIGNUP_ERROR]: 'Erreur lors de l\'inscription',
      [ErrorCode.AUTH_SIGNOUT_ERROR]: 'Erreur lors de la déconnexion',
      [ErrorCode.AUTH_SESSION_REFRESH_ERROR]: 'Erreur lors du rafraîchissement de la session',
      [ErrorCode.AUTH_PASSWORD_RESET_ERROR]: 'Erreur lors de la réinitialisation du mot de passe',
      [ErrorCode.AUTH_PASSWORD_CHANGE_ERROR]: 'Erreur lors du changement du mot de passe',
      [ErrorCode.AUTH_USER_UPDATE_ERROR]: 'Erreur lors de la mise à jour de l\'utilisateur',
      [ErrorCode.AUTH_USER_INFO_ERROR]: 'Erreur lors de la récupération des informations utilisateur',
      [ErrorCode.AUTH_USER_SEARCH_ERROR]: 'Erreur lors de la recherche d\'utilisateurs',
      [ErrorCode.AUTH_USER_COUNT_ERROR]: 'Erreur lors du comptage des utilisateurs',
      [ErrorCode.AUTH_EMAIL_CHECK_ERROR]: 'Erreur lors de la vérification de l\'email',
      [ErrorCode.AUTH_MANAGEMENT_TOKEN_ERROR]: 'Erreur lors de l\'obtention du token de gestion',
      
      // Provider errors
      [ErrorCode.PROVIDER_SWITCH_ERROR]: 'Erreur lors du changement de fournisseur',
      [ErrorCode.PROVIDER_NOT_ENABLED]: 'Fournisseur non activé',
      [ErrorCode.PROVIDER_NOT_FOUND]: 'Fournisseur introuvable',
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
  static log(errorOrLevel: Error | AppError | 'info' | 'error' | 'warn', contextOrMessage?: string, data?: any): void {
    const timestamp = new Date().toISOString();
    
    // Support both legacy (error, context) and new (level, message, data) signatures
    if (typeof errorOrLevel === 'string') {
      // New signature: log(level, message, data)
      const level = errorOrLevel;
      const message = contextOrMessage || '';
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
      return;
    }
    
    // Legacy signature: log(error, context)
    const error = errorOrLevel;
    const context = contextOrMessage;
    
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
