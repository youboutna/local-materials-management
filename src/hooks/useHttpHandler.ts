import { useState, useCallback } from 'react';
import { httpHandler, HttpErrorResponse, fetchWithErrorHandling } from '@/lib/httpStatusHandler';

interface HttpHandlerSuccessCallback<T = unknown> {
  (data: T): void;
}

interface UseHttpHandlerOptions<T = unknown> {
  showToasts?: boolean;
  maxRetries?: number;
  onError?: (error: HttpErrorResponse) => void;
  onSuccess?: HttpHandlerSuccessCallback<T>;
}

export const useHttpHandler = <T = unknown>(options: UseHttpHandlerOptions<T> = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HttpErrorResponse | null>(null);

  const execute = useCallback(async (
    requestFn: () => Promise<Response>,
    requestId?: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await httpHandler.retryRequest<T>(requestFn, requestId);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      setError(httpError);
      
      if (options.onError) {
        options.onError(httpError);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const fetchData = useCallback(async (
    url: string,
    init: RequestInit = {},
    requestId?: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchWithErrorHandling<T>(url, init, requestId);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      setError(httpError);
      
      if (options.onError) {
        options.onError(httpError);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    execute,
    fetchData,
    reset
  };
};

// Hook spécialisé pour les requêtes Supabase
export const useSupabaseHandler = <T = unknown>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSupabaseResponse = useCallback(async (
    supabasePromise: Promise<{ data: T; error: Error | null }>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabasePromise;

      if (supabaseError) {
        // Mapper les erreurs Supabase vers nos codes HTTP
        let httpStatus = 500;
        
        if ((supabaseError as any).code === 'PGRST116') httpStatus = 404;
        if (supabaseError.message?.includes('permission')) httpStatus = 403;
        if (supabaseError.message?.includes('authentication')) httpStatus = 401;
        
        const httpError = new HttpErrorResponse({
          status: httpStatus,
          message: supabaseError.message || 'Erreur Supabase',
          code: (supabaseError as any).code
        });

        await httpHandler.handleResponse(new Response(null, { status: httpStatus }));
        
        setError(supabaseError.message);
        return null;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    handleSupabaseResponse,
    reset
  };
};