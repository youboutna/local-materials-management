/**
 * ContractDetail — fiche contrat : entête, montants, transitions de statut.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
} from '@/application/services/ContractService';
import { useContractHex, useContractStatusMutation } from '@/hooks/hexagonal/useContractsHex';

const formatAmount = (value: number, currency: string) =>
  `${new Intl.NumberFormat('fr-FR').format(value || 0)} ${currency}`;

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, error } = useContractHex(id);
  const { changeStatus, isPending } = useContractStatusMutation();

  const handleStatus = async (status: string) => {
    if (!id) return;
    try {
      await changeStatus(id, status);
      toast.success(`Statut mis à jour : ${CONTRACT_STATUS_LABELS[status] ?? status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Mise à jour impossible');
    }
  };

  return (
    <AppLayout pageTitle="Contrat">
      <div className="mt-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/contracts')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour aux contrats
        </Button>

        {isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement du contrat…
          </div>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}

        {!isLoading && !contract && !error && (
          <p className="text-sm text-muted-foreground">Contrat introuvable.</p>
        )}

        {contract && (
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{contract.title}</CardTitle>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {contract.contractNumber}
                </p>
              </div>
              <ContractStatusBadge status={contract.status} />
            </CardHeader>

            <CardContent className="space-y-4">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Montant</dt>
                  <dd className="font-medium tabular-nums">
                    {formatAmount(contract.totalAmount, contract.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="font-medium">{contract.contractType}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Signé le</dt>
                  <dd className="font-medium">{formatDate(contract.signedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Début</dt>
                  <dd className="font-medium">{formatDate(contract.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Fin</dt>
                  <dd className="font-medium">{formatDate(contract.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Projet lié</dt>
                  <dd>
                    {contract.projectId ? (
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={() => navigate(`/projects/${contract.projectId}`)}
                      >
                        Ouvrir le projet
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Appel d'offres</dt>
                  <dd>
                    {contract.tenderId ? (
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={() => navigate(`/tenders/${contract.tenderId}`)}
                      >
                        Ouvrir l'appel d'offres
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
              </dl>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Changer le statut</p>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_STATUSES.filter((s) => s !== contract.status).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleStatus(status)}
                    >
                      {CONTRACT_STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
