/**
 * Hexagonal hook for supplier dashboard data
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/application/services/AuthService';
import { useEffect, useState } from 'react';

export interface SupplierDashboardData {
  supplier: any | null;
  notifications: any[];
  payments: any[];
  documents: any[];
  stats: {
    totalPayments: number;
    pendingPayments: number;
    unreadNotifications: number;
    documentsCount: number;
  };
}

export const useSupplierAuthHex = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const authService = new AuthService();
    
    // Set initial session
    authService.getCurrentSession().then(({ user }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  return { userId };
};

export const useSupplierProfileHex = (userId: string | null) => {
  return useQuery({
    queryKey: ['supplier-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useSupplierNotificationsHex = (supplierId: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-notifications', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('supplier_notifications')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('sent_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supplierId,
  });
};

export const useSupplierPaymentsHex = (supplierId: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-payments', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('due_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supplierId,
  });
};

export const useSupplierDocumentsHex = (userId: string | null, supplierName: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-documents', userId, supplierName],
    queryFn: async () => {
      if (!userId && !supplierName) return [];
      
      const orFilter = userId && supplierName
        ? `assigned_to.eq.${userId},tags.cs.{${supplierName}}`
        : userId
        ? `assigned_to.eq.${userId}`
        : `tags.cs.{${supplierName}}`;
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(orFilter)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId || !!supplierName,
  });
};
