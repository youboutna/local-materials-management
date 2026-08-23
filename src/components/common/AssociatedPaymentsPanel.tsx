import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UnifiedPaymentFormDialog } from '@/components/payments/UnifiedPaymentFormDialog';
import { PaymentOriginKey } from '@/config/referentials/payment-origin.referential';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { getPaymentService } from '@/application/services/PaymentService';

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
interface AssociatedPaymentsPanelProps {
  entityType: 'project' | 'inspection' | 'supplier' | 'validation';
  entityId: string;
  showActions?: boolean;
  onPaymentCreated?: () => void;
}

export const AssociatedPaymentsPanel: React.FC<AssociatedPaymentsPanelProps> = ({
  entityType,
  entityId,
  showActions = true,
  onPaymentCreated,
}) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const paymentService = getPaymentService();

  const { data: payments, isLoading, error, refetch } = useQuery<PaymentDTO[]>({
    queryKey: ['associated-payments', entityType, entityId],
    queryFn: () => paymentService.getPaymentsByEntity(entityType, entityId),
    enabled: !!entityId,
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['associated-payments', entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    if (onPaymentCreated) onPaymentCreated();
    toast.success('Paiement créé avec succès');
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive"><T k="auto.associatedpaymentspanel.erreur_lors_du_chargement_des_paiements" fallback="Erreur lors du chargement des paiements." /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Paiements associés ({payments?.length || 0})</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          + Créer une demande
        </Button>
      </div>

      {payments && payments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><T k="auto.associatedpaymentspanel.date" fallback="Date" /></TableHead>
              <TableHead><T k="auto.associatedpaymentspanel.projet" fallback="Projet" /></TableHead>
              <TableHead><T k="auto.associatedpaymentspanel.contractant" fallback="Contractant" /></TableHead>
              <TableHead><T k="auto.associatedpaymentspanel.montant" fallback="Montant" /></TableHead>
              <TableHead><T k="auto.associatedpaymentspanel.statut" fallback="Statut" /></TableHead>
              <TableHead><T k="auto.associatedpaymentspanel.origine" fallback="Origine" /></TableHead>
              {showActions && <TableHead><T k="auto.associatedpaymentspanel.actions" fallback="Actions" /></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.createdAt || payment.date)}</TableCell>
                <TableCell>{payment.projectName || payment.projectId}</TableCell>
                <TableCell>{payment.contractor}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>
                  <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>
                    <TranslatedStatus code={payment.status} />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{payment.origin || 'manual'}</Badge>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <Button variant="ghost" size="sm"><T k="auto.associatedpaymentspanel.voir" fallback="Voir" /></Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground"><T k="auto.associatedpaymentspanel.aucun_paiement_associe" fallback="Aucun paiement associé." /></p>
      )}

      <UnifiedPaymentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        origin="manual"
        defaults={{
          projectId: entityType === 'project' ? entityId : undefined,
          inspectionId: entityType === 'inspection' ? entityId : undefined,
          contractorId: entityType === 'supplier' ? entityId : undefined,
        }}
        onCreated={handleSuccess}
      />
    </div>
  );
};