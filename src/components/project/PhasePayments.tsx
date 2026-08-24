/**
 * PhasePayments — paiements rattachés à la phase courante.
 *
 * Architecture hexagonale : DTO camelCase issus de PaymentService,
 * progression bornée par PhaseMetricsService (fin du bug « 807500% »),
 * édition in-situ via UnifiedPaymentFormDialog (contexte projet/phase conservé).
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Trash2, Calendar, ExternalLink, Pencil, Layers } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { UnifiedPaymentFormDialog, type UnifiedPaymentFormDefaults } from '@/components/payments/UnifiedPaymentFormDialog';
import {
  usePhasePayments,
  useDeletePhasePayment,
} from '@/hooks/hexagonal/usePhasePaymentsHex';
import { PhaseMetricsService, normalizeProgressPercent } from '@/application/services/PhaseMetricsService';
import { PAYMENT_METHOD_OPTIONS } from '@/config/referentials/payment-origin.referential';
import type { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { formatAmount2 } from '@/utils/reportNumbers';
import { T } from '@/components/i18n/T';

interface PhasePaymentsProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
  /** Budget de la phase pour afficher le taux de consommation. */
  phaseBudget?: number;
}

const PhasePayments: React.FC<PhasePaymentsProps> = ({ phaseId, projectId, phaseName, phaseBudget }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const { data: payments = [], isLoading } = usePhasePayments(phaseId);
  const deletePaymentMutation = useDeletePhasePayment(phaseId, projectId);

  const financials = useMemo(
    () =>
      PhaseMetricsService.computeFinancials({
        estimatedCost: phaseBudget ?? 0,
        paymentAmounts: payments.map((p) => p.amount),
      }),
    [payments, phaseBudget]
  );

  const getPaymentMethodLabel = (method?: string) =>
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label || method || '—';

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMutation.mutateAsync(id);
      toast({ title: 'Paiement supprimé' });
    } catch {
      /* toast géré par le hook */
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (payment: PaymentDTO) => {
    setEditing(payment);
    setDialogOpen(true);
  };

  const dialogDefaults: UnifiedPaymentFormDefaults = useMemo(
    () => ({
      id: editing?.id,
      projectId,
      phaseId,
      contractorId: editing?.contractorId,
      contractorName: editing?.contractorName,
      contractorContact: editing?.contractorContact,
      amount: editing?.amount,
      paymentMethod: editing?.paymentMethod,
      paymentDate: editing?.paymentDate,
      transactionId: editing?.transactionId,
      progressAtPayment: normalizeProgressPercent(editing?.progressAtPayment),
      bankName: editing?.bankName,
      accountNumber: editing?.accountNumber,
      receiverName: editing?.receiverName,
      notes: editing?.notes,
      documentIds: editing?.documentIds,
      inspectionId: editing?.inspectionId,
      contextLabel: phaseName ? `Phase : ${phaseName}` : undefined,
    }),
    [editing, phaseId, projectId, phaseName]
  );

  if (isLoading) {
    return <div className="animate-pulse"><T k="auto.phasepayments.chargement_des_paiements" fallback="Chargement des paiements..." /></div>;
  }

  const totalPages = Math.ceil(payments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPayments = payments.slice(startIndex, startIndex + pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <T k="auto.phasepayments.paiements_de_la_phase" fallback="Paiements de la phase" /> ({payments.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/payment-control?phase=${phaseId}&project=${projectId}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <T k="auto.phasepayments.voir_tous_les_paiements" fallback="Voir tous les paiements" />
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              <T k="auto.phasepayments.ajouter_un_paiement" fallback="Ajouter un paiement" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  <T k="auto.phasepayments.total_paye" fallback="Total payé" /> : {formatAmount2(financials.paidAmount)} MRU
                </span>
                {financials.budget > 0 && (
                  <span className="text-muted-foreground">
                    <T k="auto.phasepayments.budget_phase" fallback="Budget phase" /> : {formatAmount2(financials.budget)} MRU
                    {' · '}
                    <T k="auto.phasepayments.consommation" fallback="Consommation" /> : {financials.consumptionRate}%
                  </span>
                )}
              </div>
              {financials.budget > 0 && (
                <Progress value={Math.min(100, financials.consumptionRate)} className="h-1.5" />
              )}
            </div>

            {paginatedPayments.map((payment) => {
              const progressValue = normalizeProgressPercent(payment.progressAtPayment);
              return (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-lg">{formatAmount2(payment.amount)} MRU</h3>
                      <p className="text-sm text-muted-foreground">
                        {payment.contractorName || payment.receiverName || '—'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(payment)} title="Modifier" aria-label="Modifier le paiement">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/payments/${payment.id}`)}
                        title="Consulter"
                        aria-label="Consulter le paiement"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(payment.id)}
                        title="Supprimer"
                        aria-label="Supprimer le paiement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary">{getPaymentMethodLabel(payment.paymentMethod)}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {phaseName || <T k="auto.phasepayments.phase_liee" fallback="Phase liée" />}
                    </Badge>
                    {progressValue > 0 && (
                      <Badge>
                        <T k="auto.phasepayments.progression_label" fallback="Progression" /> : {progressValue}%
                      </Badge>
                    )}
                  </div>

                  {payment.transactionId && (
                    <p className="text-xs text-muted-foreground">Transaction : {payment.transactionId}</p>
                  )}
                </div>
              );
            })}

            {payments.length > pageSize && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={payments.length}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                showItemsPerPage={false}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              <T k="auto.phasepayments.aucun_paiement_enregistre_pour_cette_phase" fallback="Aucun paiement enregistré pour cette phase." />
            </p>
          </div>
        )}
      </CardContent>

      <UnifiedPaymentFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        origin="project"
        defaults={dialogDefaults}
        lockProject
        isEdit={!!editing}
        onCreated={() => setDialogOpen(false)}
        onUpdated={() => setDialogOpen(false)}
      />
    </Card>
  );
};

export default PhasePayments;
