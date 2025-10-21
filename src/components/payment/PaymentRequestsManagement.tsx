import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { PaymentRequestDetailsDialog } from './PaymentRequestDetailsDialog';
import { sendNotification } from '@/services/notificationService';

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

  const { data: paymentRequests = [], refetch } = useQuery({
    queryKey: ['payment-requests-management'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .order('requested_date', { ascending: false });

      if (error) throw error;

      // Fetch supplier and project data separately
      const enrichedRequests = await Promise.all(
        (requests || []).map(async (request) => {
          const [supplierData, projectData] = await Promise.all([
            supabase.from('suppliers').select('name, account_number, bank_name, rib').eq('id', request.supplier_id).single(),
            request.project_id ? supabase.from('projects').select('title').eq('id', request.project_id).single() : Promise.resolve({ data: null, error: null })
          ]);

          return {
            ...request,
            suppliers: supplierData.data || undefined,
            projects: projectData.data || undefined,
          };
        })
      );

      return enrichedRequests as PaymentRequest[];
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
      await sendNotification({
        recipient_id: request.supplier_id,
        title: 'Informations bancaires requises',
        message: `Pour traiter votre demande de paiement de ${request.amount} MRU, veuillez compléter vos informations bancaires et joindre la facture de décompte.`,
        type: 'payment_warning',
        related_id: request.id,
        metadata: {
          request_id: request.id,
          amount: request.amount,
          project_id: request.project_id
        }
      });

      toast({
        title: '⚠️ Informations bancaires manquantes',
        description: 'Une notification a été envoyée au fournisseur pour compléter ses informations bancaires.',
        variant: 'default',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('supplier_payment_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      // Notify supplier
      await sendNotification({
        recipient_id: request.supplier_id,
        title: 'Demande de paiement approuvée',
        message: `Votre demande de paiement de ${request.amount} MRU a été approuvée.`,
        type: 'payment_completed',
        related_id: request.id,
        metadata: {
          request_id: request.id,
          amount: request.amount
        }
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
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (request: PaymentRequest, reason: string) => {
    try {
      const { error } = await supabase
        .from('supplier_payment_requests')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', request.id);

      if (error) throw error;

      // Notify supplier
      await sendNotification({
        recipient_id: request.supplier_id,
        title: 'Demande de paiement rejetée',
        message: `Votre demande de paiement de ${request.amount} MRU a été rejetée. Raison: ${reason}`,
        type: 'payment_failed',
        related_id: request.id,
        metadata: {
          request_id: request.id,
          amount: request.amount,
          reason
        }
      });

      toast({
        title: 'Demande rejetée',
        description: 'La demande de paiement a été rejetée.',
      });

      refetch();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Erreur',
        description: error.message,
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
