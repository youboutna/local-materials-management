/**
 * Enhanced Auth Hook - Multi-Providers Support
 * Provides authentication functionality with dynamic provider switching
 * Following hexagonal architecture principles
 */
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/application/services/AuthService';
import { getAuthManager, AuthManagerConfig } from '@/application/services/AuthManager';
import { AuthUser, AuthSession, LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import { AuthProvider } from '@/config/app';

export function useAuth() {
  const authManager = getAuthManager();
  const authService = new AuthService(authManager.getAdapter());

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const userData = await authService.getCurrentUser();
      return userData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: session } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const sessionData = await authService.getSession();
      return sessionData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const setSession = async (sessionData: AuthSession) => {
    try {
      const result = await authService.setSession(sessionData);
      refetch();
      return result;
    } catch (error) {
      console.error('Error setting session:', error);
      throw error;
    }
  };

  const getSession = async () => {
    try {
      const result = await authService.getSession();
      return result;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  };

  const getUser = async () => {
    try {
      const result = await authService.getCurrentUser();
      return result;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  };

  const signIn = async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials);
      refetch();
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (data: RegisterData) => {
    try {
      const result = await authService.register(data);
      refetch();
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const result = await authService.logout();
      refetch();
      return result;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const switchProvider = async (config: AuthManagerConfig) => {
    try {
      await authManager.switchProvider(config);
      refetch();
      return true;
    } catch (error) {
      console.error('Error switching provider:', error);
      throw error;
    }
  };

  const getCurrentProvider = (): AuthProvider => {
    return authManager.getConfig().provider;
  };

  const getSupportedProviders = () => {
    return authManager.getSupportedProviders();
  };

  const isProviderAvailable = (provider: AuthProvider): boolean => {
    return authManager.isProviderAvailable(provider);
  };

  return {
    user,
    session,
    isLoading,
    error,
    refetch,
    setSession,
    getSession,
    getUser,
    signIn,
    signUp,
    signOut,
    switchProvider,
    getCurrentProvider,
    getSupportedProviders,
    isProviderAvailable
  };
}
