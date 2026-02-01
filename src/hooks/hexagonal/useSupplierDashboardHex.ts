/**
 * Hexagonal hook for supplier dashboard data
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/application/services/AuthService';
import { SupplierPortalService } from '@/application/services/SupplierPortalService';
import { NotificationService } from '@/application/services/NotificationService';
import { DocumentService } from '@/application/services/DocumentService';
import { SupplierPaymentService } from '@/application/services/SupplierPaymentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useEffect, useState } from 'react';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

export interface SupplierDashboardData {
  supplier: SupplierDTO | null;
  notifications: NotificationDTO[];
  payments: PaymentDTO[];
  documents: DocumentDTO[];
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
    const authService = new AuthService(RepositoryFactory.getAuthRepository());
    
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
      
      const supplierPortalService = new SupplierPortalService(
        RepositoryFactory.getSupplierRepository()
      );
      const supplier = await supplierPortalService.getSupplierProfile(userId);
      
      return supplier;
    },
    enabled: !!userId,
  });
};

export const useSupplierNotificationsHex = (supplierId: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-notifications', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const notificationService = new NotificationService(
        RepositoryFactory.getNotificationRepository()
      );
      
      // Get notifications for supplier (using user notifications method)
      const notifications = await notificationService.getUserNotifications(supplierId, 20);
      
      return notifications || [];
    },
    enabled: !!supplierId,
  });
};

export const useSupplierPaymentsHex = (supplierId: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-payments', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const supplierPaymentService = new SupplierPaymentService();
      const payments = await supplierPaymentService.getPaymentRequestsBySupplierId({
        supplierId
      });
      
      return payments || [];
    },
    enabled: !!supplierId,
  });
};

export const useSupplierDocumentsHex = (userId: string | null, supplierName: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-documents', userId, supplierName],
    queryFn: async () => {
      if (!userId && !supplierName) return [];
      
      const documentService = new DocumentService();
      
      // Get documents by phase (using userId as phaseId for now)
      // This is a temporary solution until proper supplier document methods exist
      let documents = [];
      if (userId) {
        documents = await documentService.getDocumentsByPhase(userId);
      }
      
      return documents || [];
    },
    enabled: !!userId || !!supplierName,
  });
};
