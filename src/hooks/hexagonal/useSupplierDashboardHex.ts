/**
 * Hexagonal hook for supplier dashboard data
 */
import { AuthService, getAuthService} from '@/application/services/AuthService';
import { DocumentService, getDocumentService} from '@/application/services/DocumentService';
import { NotificationService } from '@/application/services/NotificationService';
import { SupplierPaymentService, getSupplierPaymentService} from '@/application/services/SupplierPaymentService';
import { SupplierPortalService, getSupplierPortalService} from '@/application/services/SupplierPortalService';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

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
    const authService = getAuthService();
    
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
      
      const supplierPortalService = getSupplierPortalService();
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
      
      const supplierPaymentService = getSupplierPaymentService();
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
      
      const documentService = getDocumentService();
      
      // Get documents by phase (using userId as phaseId for now)
      // This is a temporary solution until proper supplier document methods exist
      let documents: any[] = [];
      if (userId) {
        documents = await documentService.getDocumentsByPhase(userId) as any[];
      }
      
      return documents || [];
    },
    enabled: !!userId || !!supplierName,
  });
};
