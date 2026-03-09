/**
 * OAuth Login Hook
 * Implements OAuth login functionality following hexagonal architecture
 * Following PROMPTS.md rules: UI Component → Service → Domain ← Adapter → DB
 */

import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHexagonalAuth } from '@/contexts/HexagonalAuthContext';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { toast } from 'sonner';

export interface UseOAuthLoginResult {
  initiateOAuthLogin: (provider: string) => Promise<void>;
  handleOAuthCallback: () => Promise<void>;
  isHandlingCallback: boolean;
  availableProviders: any[];
  getOAuthProviders: () => Promise<any[]>;
}

export function useOAuthLogin(): UseOAuthLoginResult {
  const { loginWithOAuth, getOAuthProviders, generateOAuthUrl } = useHexagonalAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle OAuth callback from URL params
  const handleOAuthCallback = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const provider = urlParams.get('provider') || sessionStorage.getItem('oauth_provider');
      const error = urlParams.get('error');

      // Handle OAuth errors
      if (error) {
        const errorDescription = urlParams.get('error_description');
        throw new AppError(
          ErrorCode.UNAUTHORIZED, 
          errorDescription || `OAuth error: ${error}`
        );
      }

      if (!code || !provider) {
        return; // Not an OAuth callback
      }

      console.log('🔄 Handling OAuth callback for provider:', provider);

      // Prepare OAuth login data
      const oAuthData = {
        provider,
        code,
        state: state || undefined,
        redirectUri: `${window.location.origin}${window.location.pathname}`
      };

      // Perform OAuth login
      await loginWithOAuth(oAuthData);

      // Clear OAuth state from session storage
      sessionStorage.removeItem('oauth_provider');
      sessionStorage.removeItem('oauth_state');

      // Clean up URL
      navigate(location.pathname, { replace: true });

    } catch (error) {
      console.error('OAuth callback error:', error);
      
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la connexion OAuth');
      }

      // Redirect to auth page on error
      navigate('/auth', { replace: true });
    }
  }, [location, navigate, loginWithOAuth]);

  // Initiate OAuth login
  const initiateOAuthLogin = useCallback(async (provider: string) => {
    try {
      console.log('🚀 Initiating OAuth login for provider:', provider);

      const redirectUri = `${window.location.origin}/auth?provider=${provider}`;
      
      // Store provider in session for callback
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_redirect_uri', redirectUri);

      // Generate OAuth URL
      const oAuthUrl = await generateOAuthUrl(provider, redirectUri);

      console.log('🔗 Redirecting to OAuth URL:', oAuthUrl);

      // Redirect to OAuth provider
      window.location.href = oAuthUrl;

    } catch (error) {
      console.error('OAuth initiation error:', error);
      
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
        toast.error(`Erreur lors de l'initialisation de la connexion ${provider}`);
      }
    }
  }, [generateOAuthUrl]);

  // Auto-handle OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('code') && urlParams.get('provider')) {
      handleOAuthCallback();
    }
  }, [handleOAuthCallback, location.search]);

  // Get available OAuth providers
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);

  useEffect(() => {
    getOAuthProviders().then(providers => {
      setAvailableProviders(providers);
    }).catch(error => {
      console.error('Failed to fetch OAuth providers:', error);
      setAvailableProviders([]);
    });
  }, [getOAuthProviders]);

  return {
    initiateOAuthLogin,
    handleOAuthCallback,
    isHandlingCallback: false, // Could be enhanced with loading state
    availableProviders,
    getOAuthProviders
  };
}