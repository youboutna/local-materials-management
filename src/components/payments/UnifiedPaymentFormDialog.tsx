/**
 * Formulaire unifié de paiement (présentation uniquement).
 * Un seul composant pour tous les points d'entrée : auto post-inspection,
 * gestionnaire projet, portail fournisseur, saisie manuelle.
 * Auto-complétion contextuelle (projet → phases/inspections, fournisseur → contact/RIB).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Paperclip, Sparkles, Trash2, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { useMonitoringDocumentAdapter } from '@/components/documents/adapters/monitoringDocumentAdapter';
import {
  PAYMENT_DEFAULT_LEAD_TIME_DAYS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_REQUEST_TYPES,
  PaymentOriginKey,
  PaymentRequestTypeKey,
  getPaymentOrigin,
  getPaymentRequestType,
} from '@/config/referentials/payment-origin.referential';
import {
  usePaymentFormContextHex,
  useSubmitUnifiedPaymentHex,
} from '@/hooks/hexagonal/useUnifiedPaymentFormHex';
import type { CreatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { formatAmount2 } from '@/utils/reportNumbers';

export interface UnifiedPaymentFormDefaults {
  projectId?: string;
  projectTitle?: string;
  phaseId?: string;
  inspectionId?: string;
  contractorId?: string;
  contractorName?: string;
  contractorContact?: string;
  amount?: number;
  contextLabel?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: PaymentOriginKey;
  defaults?: UnifiedPaymentFormDefaults;
  /** Verrouille le projet (contexte projet / inspection) */
  lockProject?: boolean;
  /** Verrouille le contractant (portail fournisseur) */
  lockContractor?: boolean;
  onCreated?: (paymentId: string) => void;
}

export function UnifiedPaymentFormDialog({
  open,
  onOpenChange,
  origin,
  defaults,
  lockProject,
  lockContractor,
  onCreated,
}: Props) {
  const { toast } = useToast();
  const originDef = getPaymentOrigin(origin);
  const { submitPayment, isPending } = useSubmitUnifiedPaymentHex();
  const documentsContract = useMonitoringDocumentAdapter('payment');

  const [requestType, setRequestType] = useState<PaymentRequestTypeKey>(originDef.defaultType);
  const [projectId, setProjectId] = useState<string | undefined>(defaults?.projectId);
  const [phaseId, setPhaseId] = useState<string>(defaults?.phaseId ?? '');
  const [inspectionId, setInspectionId] = useState<string>(defaults?.inspectionId ?? '');
  const [contractorId, setContractorId] = useState<string | undefined>(defaults?.contractorId);
  const [contractorName, setContractorName] = useState(defaults?.contractorName ?? '');
  const [contractorContact, setContractorContact] = useState(defaults?.contractorContact ?? '');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState<number>(defaults?.amount ?? 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHOD_OPTIONS[0].value);
  const [transactionId, setTransactionId] = useState('');
  const [leadTime, setLeadTime] = useState<number>(PAYMENT_DEFAULT_LEAD_TIME_DAYS);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const { phases, inspections, supplier, project } = usePaymentFormContextHex(
    open ? projectId : undefined,
    open ? contractorId : undefined,
  );

  // Réinitialisation sur ouverture avec les valeurs du contexte d'appel
  useEffect(() => {
    if (!open) return;
    setRequestType(originDef.defaultType);
    setProjectId(defaults?.projectId);
    setPhaseId(defaults?.phaseId ?? '');
    setInspectionId(defaults?.inspectionId ?? '');
    setContractorId(defaults?.contractorId);
    setContractorName(defaults?.contractorName ?? '');
    setContractorContact(defaults?.contractorContact ?? '');
    setAmount(defaults?.amount ?? 0);
    setFiles([]);
    setNotes('');
    setTransactionId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-complétion depuis le fournisseur sélectionné (contact + RIB)
  useEffect(() => {
    if (!supplier) return;
    setContractorName((prev) => prev || supplier.name);
    setContractorContact((prev) => prev || supplier.contact);
    setBankName((prev) => prev || supplier.bankName || '');
    setAccountNumber((prev) => prev || supplier.accountNumber || '');
  }, [supplier]);

  // Auto-complétion depuis l'inspection sélectionnée (phase + progression)
  useEffect(() => {
    if (!inspectionId) return;
    const insp = inspections.find((i) => i.id === inspectionId);
    if (!insp) return;
    if (insp.phaseId) setPhaseId((prev) => prev || insp.phaseId!);
    if (typeof insp.progress === 'number') setProgress((prev) => (prev ? prev : insp.progress!));
  }, [inspectionId, inspections]);

  const projectLabel = useMemo(
    () => (project as any)?.title ?? defaults?.projectTitle ?? '',
    [project, defaults?.projectTitle],
  );

  const canSubmit = Boolean(projectId) && Boolean(contractorName) && Boolean(contractorContact) && amount > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !projectId) {
      toast({
        title: 'Champs obligatoires manquants',
        description: 'Projet, contractant, contact et montant sont requis.',
        variant: 'destructive',
      });
      return;
    }

    const dto: CreatePaymentDTO = {
      projectId,
      contractorId: contractorId ?? '',
      contractorName,
      contractorContact,
      amount,
      paymentMethod,
      paymentDate,
      transactionId: transactionId || `TX-${Date.now()}`,
      progressAtPayment: progress,
      inspectionId: inspectionId || undefined,
      phaseId: phaseId || undefined,
      bankName: bankName || undefined,
      accountNumber: accountNumber || undefined,
      supplierId: contractorId,
    };

    try {
      const created = await submitPayment({
        payment: dto,
        initialStatus: getPaymentRequestType(requestType).initialStatus,
      });

      // Pièces justificatives → GED (scope « payment »)
      if (files.length && documentsContract.onUpload) {
        for (const file of files) {
          try {
            await documentsContract.onUpload({
              file,
              title: file.name,
              description: notes || undefined,
              category: 'contract',
              extras: { project_id: projectId },
            });
          } catch (uploadError) {
            console.warn('[UnifiedPaymentForm] Upload document échoué:', uploadError);
          }
        }
      }

      toast({
        title: 'Demande enregistrée',
        description: `${getPaymentRequestType(requestType).label} de ${formatAmount2(amount)} enregistrée (${originDef.shortLabel}).`,
      });
      onOpenChange(false);
      onCreated?.(created.id);
    } catch (error) {
      toast({
        title: 'Échec de l’enregistrement',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Nouvelle demande / paiement
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Origine : {originDef.label}
            </Badge>
            {defaults?.contextLabel && (
              <span className="text-xs text-muted-foreground">{defaults.contextLabel}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Type de paiement */}
          <div className="grid gap-2 sm:max-w-xs">
            <Label>Type de paiement</Label>
            <Select
              value={requestType}
              onValueChange={(v) => setRequestType(v as PaymentRequestTypeKey)}
              disabled={originDef.lockType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_REQUEST_TYPES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getPaymentRequestType(requestType).description}
            </p>
          </div>

          {/* Section 1 – Informations générales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lockProject && projectId ? (
                <div className="grid gap-2">
                  <Label>Projet *</Label>
                  <Input value={projectLabel || projectId} readOnly />
                </div>
              ) : (
                <ProjectSelector
                  value={projectId}
                  onChange={(id) => {
                    setProjectId(id);
                    setPhaseId('');
                    setInspectionId('');
                  }}
                  label="Projet *"
                  required
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Phase liée (optionnel)</Label>
                  <Select
                    value={phaseId || 'none'}
                    onValueChange={(v) => setPhaseId(v === 'none' ? '' : v)}
                    disabled={!projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {phases.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Inspection liée (optionnel)</Label>
                  <Select
                    value={inspectionId || 'none'}
                    onValueChange={(v) => setInspectionId(v === 'none' ? '' : v)}
                    disabled={!projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une inspection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {inspections.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {lockContractor ? (
                <div className="grid gap-2">
                  <Label>Contractant *</Label>
                  <Input value={contractorName} readOnly />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>Contractant / Fournisseur *</Label>
                  <SupplierSelector
                    value={{ id: contractorId, name: contractorName, contact: contractorContact, leadTime }}
                    onChange={(s) => {
                      setContractorId(s.id);
                      setContractorName(s.name);
                      setContractorContact(s.contact);
                      setLeadTime(s.leadTime || PAYMENT_DEFAULT_LEAD_TIME_DAYS);
                    }}
                    allowCustom
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Contact du contractant *</Label>
                  <Input
                    value={contractorContact}
                    onChange={(e) => setContractorContact(e.target.value)}
                    placeholder="Auto-rempli depuis le fournisseur"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nom de la banque</Label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Numéro de compte / RIB</Label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 – Montants et dates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Montants et dates</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Montant (MRU) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date de paiement prévue *</Label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Progression (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3 – Détails du paiement */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Détails du paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Méthode de paiement *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>ID de transaction</Label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Référence bancaire (optionnel)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Délai de livraison (jours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={leadTime}
                    onChange={(e) => setLeadTime(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes (optionnel)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Section 4 – Documents justificatifs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Documents justificatifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {f.name} <span className="text-muted-foreground">({Math.round(f.size / 1024)} Ko)</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Les pièces jointes apparaissent dans l’onglet « Documents » du contrôle des paiements.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {originDef.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UnifiedPaymentFormDialog;
