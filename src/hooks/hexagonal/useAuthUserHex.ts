/**
 * Hexagonal Hook: useAuthUserHex
 * Provides current authenticated user info via services
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

async function fetchCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return user;
}

export function useAuthUserHex() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auth-user-hex'],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: 1,
  });

  return {
    user,
    userId: user?.id ?? null,
    isAuthenticated: !!user,
    isLoading,
    error,
    refetch,
  };
}

export default useAuthUserHex;
