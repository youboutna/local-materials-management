import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AuthService } from '@/application/services/AuthService';
import { SupplierService } from '@/application/services/SupplierService';
import { ProjectService } from '@/application/services/ProjectService';
import { useAuth } from '@/contexts/use-auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { NotificationService } from '@/application/services/NotificationService';
import { PaymentRequestDetailsDialog } from './PaymentRequestDetailsDialog';

interface PaymentRequest {
  id: string;
  supplier_id: string;
  project_id: string;
  amount: number;
  description: string;
  payment_reason: string;
  status: string;
  requested_date: string;
  notes: string;
  suppliers?: {
    name: string;
    account_number: string | null;
    bank_name: string | null;
    rib: string | null;
  };
  projects?: {
    title: string;
  };
}

export const PaymentRequestsManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Initialize services
  const authService = new AuthService(RepositoryFactory.getAuthRepository());
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
  const paymentRequestService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());
  const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());

  const { data: paymentRequests = [], refetch } = useQuery({
    queryKey: ['payment-requests-management'],
    queryFn: async () => {
      // Use PaymentRequestService to get all payment requests
      const requests = await paymentRequestService.getAllPaymentRequests();
      
      // Fetch supplier and project data separately
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const [supplierData, projectData] = await Promise.all([
            supplierService.getSupplierById(request.supplierId || (request as any).supplier_id),
            request.projectId || (request as any).project_id ? projectService.getProjectById(request.projectId || (request as any).project_id) : Promise.resolve(null)
          ]);
          
          return {
            ...request,
            suppliers: supplierData ? {
              name: supplierData.name,
              account_number: (supplierData as any).account_number || null,
              bank_name: (supplierData as any).bank_name || null,
              rib: (supplierData as any).rib || null
            } : undefined,
            projects: projectData ? {
              title: projectData.title
            } : undefined,
          };
        })
      );

      return enrichedRequests as unknown as PaymentRequest[];
    },
  });

  const handleView = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const checkBankingInfo = (request: PaymentRequest) => {
    return !!(
      request.suppliers?.account_number ||
      request.suppliers?.bank_name ||
      request.suppliers?.rib
    );
  };

  const handleApprove = async (request: PaymentRequest) => {
    if (!checkBankingInfo(request)) {
      // Send notification to supplier to complete banking info
      await notificationService.createNotification({
        recipient_id: request.supplier_id,
        title: 'Informations bancaires requises',
        message: 'Veuillez compléter vos informations bancaires pour recevoir le paiement.',
        type: 'warning',
        read: false
      });
      
      toast({
        title: '⚠️ Informations bancaires requises',
        description: 'Une notification a été envoyée au fournisseur pour compléter ses informations bancaires.',
        variant: 'default',
      });
      return;
    }

    try {
      // Update payment request status using PaymentRequestService
      await paymentRequestService.updatePaymentRequest(request.id, {
        status: 'approved',
        notes: `Approuvé par ${user?.email || 'admin'}`
      });
      
      // Notify supplier
      await notificationService.createNotification({
        recipient_id: request.supplier_id,
        title: 'Demande de paiement approuvée',
        message: `Votre demande de paiement de ${request.amount}€ a été approuvée.`,
        type: 'success',
        read: false
      });
      
      toast({
        title: '✅ Demande approuvée',
        description: 'La demande de paiement a été approuvée avec succès.',
      });

      refetch();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver la demande.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (request: PaymentRequest, reason: string) => {
    try {
      // Update payment request status using PaymentRequestService
      await paymentRequestService.updatePaymentRequest(request.id, {
        status: 'rejected',
        notes: `Rejeté par ${user?.email || 'admin'}: ${reason}`
      });
      
      // Notify supplier
      await notificationService.createNotification({
        recipient_id: request.supplier_id,
        title: 'Demande de paiement rejetée',
        message: `Votre demande de paiement a été rejetée. Raison: ${reason}`,
        type: 'error',
        read: false
      });
      
      toast({
        title: '❌ Demande rejetée',
        description: 'La demande de paiement a été rejetée.',
      });

      refetch();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter la demande.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'En attente' },
      approved: { variant: 'default', label: 'Approuvé' },
      rejected: { variant: 'destructive', label: 'Rejeté' },
      paid: { variant: 'default', label: 'Payé' },
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      inspection_fee: 'Frais d\'inspection',
      progress_payment: 'Paiement d\'avancement',
      inspection_completion: 'Achèvement inspection',
      services: 'Services',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historique des Demandes de Paiement</h2>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Info bancaire</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Aucune demande de paiement
                </TableCell>
              </TableRow>
            ) : (
              paymentRequests.map((request) => {
                const hasBankingInfo = checkBankingInfo(request);
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      {new Date(request.requested_date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.projects?.title || request.project_id}
                    </TableCell>
                    <TableCell>{request.suppliers?.name || 'N/A'}</TableCell>
                    <TableCell className="font-semibold">
                      {request.amount.toLocaleString('fr-FR')} MRU
                    </TableCell>
                    <TableCell>{getReasonLabel(request.payment_reason)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {hasBankingInfo ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complète
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Manquante
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(request)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Raison du rejet:');
                                if (reason) handleReject(request, reason);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentRequestDetailsDialog
        request={selectedRequest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
