/**
 * DEV_MODE Hook Example
 * Demonstrates how to use DEV_MODE with mock data and localStorage adapter
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DEV_CONFIG, shouldUseMockData, simulateApiDelay } from '@/config/dev';
import { LocalStorageAdapter } from '@/infrastructure/localStorage/LocalStorageAdapter';
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
      
      return await localStorageAdapter.getTestData(entityType, filters) as T[];
    },
    enabled: shouldUseMockData(),
    staleTime: DEV_CONFIG.mockApiDelay * 2,
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
      
      // Create new item with ID and timestamps
      const newItem = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T;
      
      // Get existing data and add new item
      const existingData = await localStorageAdapter.getTestData(entityType);
      const updatedData = [...existingData, newItem];
      
      // Save to localStorage
      await localStorageAdapter.saveData(entityType, updatedData);
      
      return newItem;
    },
    onSuccess: (newItem) => {
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
      
      await localStorageAdapter.updateItem(entityType, id, updates as Record<string, unknown>);
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
      
      await localStorageAdapter.deleteItem(entityType, id);
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
    localStorageAdapter.clearAllData();
    toast({
      title: 'DEV_MODE',
      description: 'All mock data cleared from localStorage',
    });
  };
  
  const getStorageStats = () => {
    return localStorageAdapter.getStorageStats();
  };
  
  return {
    clearAllData,
    getStorageStats,
    isDevMode: shouldUseMockData(),
    config: DEV_CONFIG,
  };
}
