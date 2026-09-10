/**
 * OAuth Login Hook
 * Implements OAuth login functionality following hexagonal architecture
 */

import { getOAuthRedirectUrl } from '@/config/supabaseConfig';
import { useHexagonalAuth } from '@/hooks/hexagonal/useHexagonalAuth';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      const errorParam = urlParams.get('error');

      if (errorParam) {
        const errorDescription = urlParams.get('error_description');
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          errorDescription || `OAuth error: ${errorParam}`,
        );
      }

      if (!code || !provider) {
        return; // Not an OAuth callback
      }

      console.info('[OAuth Callback] Handling callback for provider:', provider);

      // ✅ URL de retour : toujours le frontend, jamais localhost dans un build publié.
      const redirectUri = getOAuthRedirectUrl();

      const oAuthData = {
        provider,
        code,
        state: state || undefined,
        redirectUri,
      };

      await loginWithOAuth(oAuthData);

      sessionStorage.removeItem('oauth_provider');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_redirect_uri');

      navigate(location.pathname, { replace: true });
    } catch (error) {
      console.error('OAuth callback error:', error);
      if (error instanceof AppError) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la connexion OAuth');
      }
      navigate('/auth', { replace: true });
    }
  }, [location, navigate, loginWithOAuth]);

  // Initiate OAuth login
  const initiateOAuthLogin = useCallback(async (provider: string) => {
    try {
      console.info('[OAuth] Initiating login for provider:', provider);

      // ✅ URL de retour unique (jamais localhost dans un build publié).
      const redirectUri = getOAuthRedirectUrl();

      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_redirect_uri', redirectUri);

      const oAuthUrl = await generateOAuthUrl(provider, redirectUri);

      console.info('[OAuth] Redirecting to:', oAuthUrl);

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
    getOAuthProviders()
      .then(providers => {
        setAvailableProviders(providers);
      })
      .catch(error => {
        console.error('Failed to fetch OAuth providers:', error);
        setAvailableProviders([]);
      });
  }, [getOAuthProviders]);

  return {
    initiateOAuthLogin,
    handleOAuthCallback,
    isHandlingCallback: false,
    availableProviders,
    getOAuthProviders,
  };
}