/**
 * DEV_MODE Hook Example
 * Demonstrates how to use DEV_MODE with mock data and localStorage adapter
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DEV_CONFIG, shouldUseMockData, simulateApiDelay } from '@/config/dev';
import { LocalStorageAdapter } from '@/infrastructure/adapters/localStorage/LocalStorageAdapter';
import { toast } from '@/hooks/use-toast';

/**
 * Generic hook for DEV_MODE operations
 */
export function useDevModeData<T>(entityType: string, filters?: Record<string, unknown>) {
  const localStorageAdapter = new LocalStorageAdapter();
  
  return useQuery({
    queryKey: ['dev-mode', entityType, filters],
    queryFn: async (): Promise<T[]> => {
      if (!shouldUseMockData()) {
        return [] as T[];
      }
      
      return (localStorageAdapter.get<T[]>(entityType) || []) as T[];
    },
    enabled: shouldUseMockData(),
    staleTime: DEV_CONFIG.API_DELAY.DEFAULT * 2,
  });
}

/**
 * Mutation for creating data in DEV_MODE
 */
export function useDevModeCreate<T>(entityType: string) {
  const localStorageAdapter = new LocalStorageAdapter();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> => {
      if (!shouldUseMockData()) {
        throw new Error('DEV_MODE is not enabled');
      }
      
      await simulateApiDelay();
      
      const newItem = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T;
      
      const existingData = localStorageAdapter.get<T[]>(entityType) || [];
      const updatedData = [...existingData, newItem];
      
      localStorageAdapter.set(entityType, updatedData);
      
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev-mode'] });
      toast({
        title: 'DEV_MODE',
        description: `${entityType} created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'DEV_MODE Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation for updating data in DEV_MODE
 */
export function useDevModeUpdate<T>(entityType: string) {
  const localStorageAdapter = new LocalStorageAdapter();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<T> }): Promise<void> => {
      if (!shouldUseMockData()) {
        throw new Error('DEV_MODE is not enabled');
      }
      
      const items = localStorageAdapter.get<(T & { id: string })[]>(entityType) || [];
      const updatedItems = items.map(item => 
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      );
      localStorageAdapter.set(entityType, updatedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev-mode'] });
      toast({
        title: 'DEV_MODE',
        description: `${entityType} updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'DEV_MODE Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation for deleting data in DEV_MODE
 */
export function useDevModeDelete(entityType: string) {
  const localStorageAdapter = new LocalStorageAdapter();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!shouldUseMockData()) {
        throw new Error('DEV_MODE is not enabled');
      }
      
      const items = localStorageAdapter.get<{ id: string }[]>(entityType) || [];
      const filtered = items.filter(item => item.id !== id);
      localStorageAdapter.set(entityType, filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev-mode'] });
      toast({
        title: 'DEV_MODE',
        description: `${entityType} deleted successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'DEV_MODE Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for DEV_MODE statistics and management
 */
export function useDevModeManagement() {
  const localStorageAdapter = new LocalStorageAdapter();
  
  const clearAllData = () => {
    localStorageAdapter.clear();
    toast({
      title: 'DEV_MODE',
      description: 'All mock data cleared from localStorage',
    });
  };
  
  const getStorageStats = () => {
    return {
      totalSize: localStorageAdapter.getStorageSize(),
      keys: localStorageAdapter.getKeys(),
    };
  };
  
  return {
    clearAllData,
    getStorageStats,
    isDevMode: shouldUseMockData(),
  };
}
