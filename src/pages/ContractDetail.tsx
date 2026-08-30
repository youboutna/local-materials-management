/**
 * ContractDetail — fiche contrat : entête, montants, lignes figées, transitions de statut.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, FileDown, Pencil, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import ContractLinesTable from '@/components/contracts/ContractLinesTable';
import ContractFormDialog from '@/components/contracts/ContractFormDialog';
import ProjectDocumentUpload from '@/components/project/ProjectDocumentUpload';
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
} from '@/application/services/ContractService';
import { getContractPdfService } from '@/application/services/ContractPdfService';
import {
  useContractHex,
  useContractStatusMutation,
  useContractLinesHex,
  useContractMutations,
} from '@/hooks/hexagonal/useContractsHex';

const formatAmount = (value: number, currency: string) =>
  `${new Intl.NumberFormat('fr-FR').format(value || 0)} ${currency}`;

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, error } = useContractHex(id);
  const { data: lines = [] } = useContractLinesHex(id);
  const { changeStatus, isPending } = useContractStatusMutation();
  const { attachSignedDocument } = useContractMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleStatus = async (status: string) => {
    if (!id) return;
    try {
      await changeStatus(id, status);
      toast.success(`Statut mis à jour : ${CONTRACT_STATUS_LABELS[status] ?? status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Mise à jour impossible');
    }
  };

  const handleExportPdf = () => {
    if (!contract) return;
    try {
      getContractPdfService().download(contract, lines, {
        supplierName: String((contract.metadata as any)?.supplierName ?? ''),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export PDF impossible');
    }
  };

  const handleSignedUploaded = async () => {
    if (!id) return;
    setUploadOpen(false);
    try {
      await attachSignedDocument(id, {});
      toast.success('Contrat signé rattaché');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rattachement impossible');
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
          <>
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">{contract.title}</CardTitle>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {contract.contractNumber}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ContractStatusBadge status={contract.status} />
                  <Button size="sm" variant="outline" onClick={handleExportPdf}>
                    <FileDown className="mr-1.5 h-4 w-4" /> PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-1.5 h-4 w-4" /> Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-1.5 h-4 w-4" /> Contrat signé
                  </Button>
                </div>
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
                    <dd className="font-medium">
                      {CONTRACT_TYPE_LABELS[contract.contractType] ?? contract.contractType}
                    </dd>
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
                  {contract.signedDocumentUrl && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Contrat signé</dt>
                      <dd>
                        <a
                          href={contract.signedDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline"
                        >
                          Ouvrir le document
                        </a>
                      </dd>
                    </div>
                  )}
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

            <ContractLinesTable
              contractId={contract.id}
              currency={contract.currency}
              sourceEstimateId={contract.sourceEstimateId}
            />

            <ContractFormDialog open={editOpen} onOpenChange={setEditOpen} contract={contract} />

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Contrat signé</DialogTitle>
                  <DialogDescription>
                    Déposez le contrat signé ({contract.contractNumber}). Le statut passera à « Signé ».
                  </DialogDescription>
                </DialogHeader>
                <ProjectDocumentUpload
                  projectId={contract.projectId ?? null}
                  context="project"
                  contextLabel={`Contrat ${contract.contractNumber}`}
                  onDocumentUploaded={handleSignedUploaded}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </AppLayout>
  );
}

  );
}
