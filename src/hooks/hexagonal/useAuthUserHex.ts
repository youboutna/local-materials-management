/**
 * Hexagonal Hook: useAuthUserHex - Uses AuthContext Provider
 * Gets user data from AuthContext instead of direct Supabase calls
 */
import { useAuth } from '@/contexts/AuthContext';

export function useAuthUserHex() {
  // Use the existing useAuth hook from AuthContext
  const authContext = useAuth();

  return {
    user: authContext.user,
    userId: authContext.user?.id,
    isAuthenticated: !!authContext.user,
    isLoading: authContext.loading,
    error: null, // AuthContext handles errors internally
    refetch: () => {
      // AuthContext doesn't expose refetch - session updates automatically
      return Promise.resolve();
    },
  };
}

export default useAuthUserHex;
