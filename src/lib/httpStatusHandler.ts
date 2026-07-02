import { toast } from '@/hooks/use-toast';

// Types pour la gestion des erreurs HTTP
export class HttpErrorResponse extends Error {
  public status: number;
  public code?: string;
  public retryable?: boolean;

  constructor(params: { status: number; message: string; code?: string; retryable?: boolean }) {
    super(params.message);
    this.name = 'HttpErrorResponse';
    this.status = params.status;
    this.code = params.code;
    this.retryable = params.retryable;
  }
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

// Configuration par défaut pour les retry
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// Messages d'erreur localisés
const ERROR_MESSAGES = {
  400: 'Données invalides. Veuillez vérifier votre saisie.',
  401: 'Accès non autorisé. Veuillez vous connecter.',
  403: 'Accès interdit. Vous n\'avez pas les permissions nécessaires.',
  404: 'Ressource non trouvée. Veuillez vérifier l\'URL.',
  408: 'Délai d\'attente expiré. Veuillez réessayer.',
  429: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
  500: 'Erreur interne du serveur. Notre équipe a été notifiée.',
  502: 'Passerelle incorrecte. Problème de connectivité.',
  503: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
  504: 'Délai d\'attente de la passerelle expiré.',
  default: 'Une erreur inattendue s\'est produite.'
};

// Classe principale pour gérer les réponses HTTP
export class HttpStatusHandler {
  private retryConfig: RetryConfig;
  private retryAttempts = new Map<string, number>();

  constructor(config: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  // Gestionnaire principal des réponses HTTP
  async handleResponse<T>(
    response: Response,
    requestId?: string
  ): Promise<T> {
    const status = response.status;

    // Codes 2xx - Succès
    if (status >= 200 && status < 300) {
      this.clearRetryAttempts(requestId);
      
      if (status === 204) {
        return null as T;
      }
      
      return await response.json();
    }

    // Codes 3xx - Redirections
    if (status >= 300 && status < 400) {
      return this.handleRedirection(response);
    }

    // Codes 4xx - Erreurs client
    if (status >= 400 && status < 500) {
      return this.handleClientError(status, response);
    }

    // Codes 5xx - Erreurs serveur
    if (status >= 500) {
      return this.handleServerError(status, response, requestId);
    }

    throw new Error(`Code de statut non géré: ${status}`);
  }

  // Gestion des redirections (3xx)
  private async handleRedirection<T>(response: Response): Promise<T> {
    const location = response.headers.get('Location');
    
    if (location) {
      // Log pour audit des redirections
      console.log(`Redirection détectée vers: ${location}`);
      
      // Suivre la redirection automatiquement
      window.location.href = location;
    }
    
    throw new Error('Redirection sans URL de destination');
  }

  // Gestion des erreurs client (4xx)
  private async handleClientError<T>(status: number, response: Response): Promise<T> {
    const errorMessage = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default;
    
    switch (status) {
      case 400:
        this.showValidationError(errorMessage);
        break;
      
      case 401:
        this.handleUnauthorized();
        break;
      
      case 403:
        this.handleForbidden();
        break;
      
      case 404:
        this.handleNotFound();
        break;
      
      default:
        this.showGenericError(errorMessage);
    }

    // Logger l'erreur pour analytics
    this.logError(status, errorMessage, await this.getErrorDetails(response));
    
    throw new HttpErrorResponse({
      status,
      message: errorMessage,
      retryable: false
    });
  }

  // Gestion des erreurs serveur (5xx)
  private async handleServerError<T>(
    status: number, 
    response: Response, 
    requestId?: string
  ): Promise<T> {
    const errorMessage = ERROR_MESSAGES[status as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default;
    
    // Vérifier si on peut réessayer
    if (this.canRetry(status, requestId)) {
      throw new HttpErrorResponse({
        status,
        message: errorMessage,
        retryable: true
      });
    }

    // Afficher erreur non récupérable
    this.showServerError(errorMessage);
    
    // Notifier l'équipe technique
    this.notifyTechnicalTeam(status, errorMessage, await this.getErrorDetails(response));
    
    throw new HttpErrorResponse({
      status,
      message: errorMessage,
      retryable: false
    });
  }

  // Logique de retry avec backoff exponentiel
  async retryRequest<T>(
    requestFn: () => Promise<Response>,
    requestId: string = crypto.randomUUID()
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await requestFn();
        return await this.handleResponse<T>(response, requestId);
      } catch (error) {
        lastError = error;
        
        if (error instanceof HttpErrorResponse && error.retryable && attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
          this.incrementRetryAttempts(requestId);
          continue;
        }
        
        break;
      }
    }

    throw lastError;
  }

  // Méthodes utilitaires
  private canRetry(status: number, requestId?: string): boolean {
    if (!requestId) return false;
    
    const attempts = this.retryAttempts.get(requestId) || 0;
    return (
      attempts < this.retryConfig.maxRetries &&
      this.retryConfig.retryableStatuses.includes(status)
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private incrementRetryAttempts(requestId: string): void {
    const current = this.retryAttempts.get(requestId) || 0;
    this.retryAttempts.set(requestId, current + 1);
  }

  private clearRetryAttempts(requestId?: string): void {
    if (requestId) {
      this.retryAttempts.delete(requestId);
    }
  }

  // Méthodes d'affichage des erreurs
  private showValidationError(message: string): void {
    toast({
      title: "Erreur de validation",
      description: message,
      variant: "destructive",
    });
  }

  private handleUnauthorized(): void {
    // Stocker l'URL actuelle pour redirection après login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);

    const doRedirect = () => {
      window.location.href = '/auth';
    };

    // Si l'onglet est en arrière-plan, ne pas bloquer l'UI ni rediriger tout de suite
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      const onVisible = () => {
        document.removeEventListener('visibilitychange', onVisible);
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter.",
          variant: "destructive",
        });
        setTimeout(doRedirect, 800);
      };
      document.addEventListener('visibilitychange', onVisible);
      return;
    }

    toast({
      title: "Session expirée",
      description: "Vous allez être redirigé vers la page de connexion.",
      variant: "destructive",
    });

    // Rediriger vers login après un court délai pour laisser l'UI se stabiliser
    setTimeout(doRedirect, 800);
  }

  private handleForbidden(): void {
    toast({
      title: "Accès interdit",
      description: "Contactez votre administrateur pour obtenir les permissions nécessaires.",
      variant: "destructive",
    });
  }

  private handleNotFound(): void {
    toast({
      title: "Ressource introuvable",
      description: "La page ou la ressource demandée n'existe pas.",
      variant: "destructive",
    });
  }

  private showGenericError(message: string): void {
    toast({
      title: "Erreur",
      description: message,
      variant: "destructive",
    });
  }

  private showServerError(message: string): void {
    toast({
      title: "Erreur serveur",
      description: message,
      variant: "destructive",
    });
  }

  // Logging et monitoring
  private logError(status: number, message: string, details?: any): void {
    console.error(`HTTP Error ${status}:`, {
      message,
      details,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    
    // Ici on pourrait envoyer vers un service de monitoring externe
    // comme Sentry, LogRocket, etc.
  }

  private notifyTechnicalTeam(status: number, message: string, details?: any): void {
    // Notification de l'équipe technique pour erreurs critiques
    console.error(`Critical Server Error ${status}:`, {
      message,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Ici on pourrait envoyer une alerte email/Slack
  }

  private async getErrorDetails(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return { text: await response.text() };
    }
  }
}

// Instance globale du gestionnaire
export const httpHandler = new HttpStatusHandler();

// Helper pour les requêtes avec gestion automatique des erreurs
export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {},
  requestId?: string
): Promise<T> {
  const requestFn = () => fetch(url, options);
  return httpHandler.retryRequest<T>(requestFn, requestId);
}