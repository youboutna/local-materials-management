// ============================================================
// src/components/payments/UnifiedPaymentFormDialog.tsx
// ============================================================
/**
 * Formulaire unifié de paiement – version corrigée.
 * Transmet tous les champs : projet, phase, inspection, contractant, notes, etc.
 * Upload des documents via GED uniquement (pas de champ "Parcourir" direct).
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
import { Loader2, Paperclip, Sparkles, Trash2, Wallet, Eye, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import {
  PAYMENT_DEFAULT_LEAD_TIME_DAYS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_REQUEST_TYPES,
  PaymentOriginKey,
  PaymentRequestTypeKey,
  getPaymentOrigin,
  getDefaultRequestType,
  getPaymentRequestType,
} from '@/config/referentials/payment-origin.referential';
import { useDocumentViewer } from '@/components/documents/viewer';
import { useSubmitUnifiedPaymentHex, usePaymentFormContextHex } from '@/hooks/hexagonal/useUnifiedPaymentFormHex';
import type { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import type { CreatePaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { formatAmount2 } from '@/utils/reportNumbers';
import { toDateInput } from '@/lib/utils';
import { getDocumentService } from '@/application/services/DocumentService';
import ProjectDocumentUpload from '@/components/project/ProjectDocumentUpload';
import { T } from '@/components/i18n/T';

export interface UnifiedPaymentFormDefaults {
  id?: string;
  projectId?: string;
  projectTitle?: string;
  phaseId?: string;
  inspectionId?: string;
  contractorId?: string;
  contractorName?: string;
  contractorContact?: string;
  amount?: number;
  paymentMethod?: string;
  paymentDate?: string;
  transactionId?: string;
  progressAtPayment?: number;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
  leadTime?: number;
  documentIds?: string[];
  notes?: string;
  contextLabel?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: PaymentOriginKey;
  defaults?: UnifiedPaymentFormDefaults;
  lockProject?: boolean;
  lockContractor?: boolean;
  isEdit?: boolean;
  onCreated?: (paymentId: string) => void;
  onUpdated?: (paymentId: string) => void;
}

export function UnifiedPaymentFormDialog({
  open,
  onOpenChange,
  origin,
  defaults,
  lockProject,
  lockContractor,
  isEdit = false,
  onCreated,
  onUpdated,
}: Props) {
  const { toast } = useToast();
  const originDef = getPaymentOrigin(origin);
  const { submitPayment, updatePayment, isPending } = useSubmitUnifiedPaymentHex();
  const { openDocument } = useDocumentViewer();
  const getDocumentsByIds = useMemo(() => {
    const documentService = getDocumentService();
    return async (ids: string[]) => {
      const docs = await Promise.all(ids.map(id => documentService.getDocumentById(id)));
      return docs.filter((d): d is NonNullable<typeof d> => Boolean(d));
    };
  }, []);

  // State
  const [requestType, setRequestType] = useState<PaymentRequestTypeKey>(
    getDefaultRequestType(origin)
  );
  const [projectId, setProjectId] = useState<string | undefined>(defaults?.projectId);
  const [phaseId, setPhaseId] = useState<string>(defaults?.phaseId ?? '');
  const [inspectionId, setInspectionId] = useState<string>(defaults?.inspectionId ?? '');
  const [contractorId, setContractorId] = useState<string | undefined>(defaults?.contractorId);
  const [contractorName, setContractorName] = useState(defaults?.contractorName ?? '');
  const [contractorContact, setContractorContact] = useState(defaults?.contractorContact ?? '');
  const [bankName, setBankName] = useState(defaults?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(defaults?.accountNumber ?? '');
  const [amount, setAmount] = useState<number>(defaults?.amount ?? 0);
  const [paymentDate, setPaymentDate] = useState(
    defaults?.paymentDate ? toDateInput(defaults.paymentDate) : new Date().toISOString().slice(0, 10)
  );
  const [progress, setProgress] = useState<number>(defaults?.progressAtPayment ?? 0);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    defaults?.paymentMethod || PAYMENT_METHOD_OPTIONS[0].value
  );
  const [transactionId, setTransactionId] = useState(defaults?.transactionId ?? '');
  const [leadTime, setLeadTime] = useState<number>(defaults?.leadTime ?? PAYMENT_DEFAULT_LEAD_TIME_DAYS);
  const [notes, setNotes] = useState(defaults?.notes ?? '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentIds, setDocumentIds] = useState<string[]>(defaults?.documentIds || []);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentDTO[]>([]);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  const { phases, inspections, supplier, project } = usePaymentFormContextHex(
    open ? projectId : undefined,
    open ? contractorId : undefined,
  );

  // Charger les documents existants si mode édition
  useEffect(() => {
    if (isEdit && defaults?.documentIds?.length) {
      getDocumentsByIds(defaults.documentIds).then(docs => {
        setUploadedDocs(docs);
      }).catch(console.warn);
    }
  }, [isEdit, defaults?.documentIds, getDocumentsByIds]);

  // Réinitialisation
  useEffect(() => {
    if (!open) return;
    setRequestType(getDefaultRequestType(origin));
    setProjectId(defaults?.projectId);
    setPhaseId(defaults?.phaseId ?? '');
    setInspectionId(defaults?.inspectionId ?? '');
    setContractorId(defaults?.contractorId);
    setContractorName(defaults?.contractorName ?? '');
    setContractorContact(defaults?.contractorContact ?? '');
    setBankName(defaults?.bankName ?? '');
    setAccountNumber(defaults?.accountNumber ?? '');
    setAmount(defaults?.amount ?? 0);
    setPaymentDate(defaults?.paymentDate ? toDateInput(defaults.paymentDate) : new Date().toISOString().slice(0, 10));
    setProgress(defaults?.progressAtPayment ?? 0);
    setPaymentMethod(defaults?.paymentMethod || PAYMENT_METHOD_OPTIONS[0].value);
    setTransactionId(defaults?.transactionId ?? '');
    setLeadTime(defaults?.leadTime ?? PAYMENT_DEFAULT_LEAD_TIME_DAYS);
    setNotes(defaults?.notes ?? '');
    setDocumentIds(defaults?.documentIds || []);
    setSelectedFiles([]);
    setUploadedDocs([]);
  }, [open, origin, defaults]);

  // Auto-complétion fournisseur
  useEffect(() => {
    if (!supplier) return;
    setContractorName((prev) => prev || supplier.name);
    setContractorContact((prev) => prev || supplier.contact);
    setBankName((prev) => prev || supplier.bankName || '');
    setAccountNumber((prev) => prev || supplier.accountNumber || '');
  }, [supplier]);

  // Auto-complétion inspection
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

  const canSubmit = Boolean(projectId) && Boolean(contractorId) && Boolean(contractorName) && Boolean(contractorContact) && amount > 0;
  const requestTypeInfo = getPaymentRequestType(requestType);

  // Gestion des documents
  const handleRemoveDocument = (docId: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    setDocumentIds(prev => prev.filter(id => id !== docId));
    toast({ title: 'Document retiré' });
  };

  const handleViewDocument = (doc: DocumentDTO) => {
    openDocument(doc, { allowStatusChange: false });
  };

  const handleDocumentUploaded = (doc: DocumentDTO) => {
    setUploadedDocs(prev => [...prev, doc]);
    setDocumentIds(prev => [...prev, doc.id]);
    setIsDocumentUploadOpen(false);
    toast({ title: 'Document ajouté', description: 'Le document a été joint au paiement.' });
  };

  // Soumission
  const handleSubmit = async () => {
    if (!canSubmit || !projectId || !contractorId) {
      toast({
        title: 'Champs obligatoires manquants',
        description: 'Projet, contractant, contact et montant sont requis.',
        variant: 'destructive',
      });
      return;
    }

    const initialStatus = requestTypeInfo?.initialStatus || 'pending';

    const baseDto: CreatePaymentDTO = {
      projectId,
      contractorId: contractorId,
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
      notes: notes || undefined,
      documentIds: documentIds,
    };

    console.log('[UI] baseDto:', baseDto);

    let paymentId: string;

    try {
      setIsUploadingDocs(true);

      if (isEdit && defaults?.id) {
        await updatePayment(defaults.id, baseDto as UpdatePaymentDTO);
        paymentId = defaults.id;
        toast({ title: 'Paiement mis à jour' });
        onUpdated?.(paymentId);
      } else {
        const created = await submitPayment({
          payment: baseDto,
          initialStatus,
        });
        paymentId = created.id;
        toast({
          title: 'Demande enregistrée',
          description: `${requestTypeInfo?.label || 'Demande'} de ${formatAmount2(amount)} enregistrée (${originDef?.shortLabel || 'Manuel'}).`,
        });
        onCreated?.(paymentId);
      }

      // Les documents sont gérés via la GED, donc pas de selectedFiles ici.
      // Ils ont déjà été liés via le dialogue ProjectDocumentUpload.

      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEdit ? 'Échec de la mise à jour' : 'Échec de l’enregistrement',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDocs(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {isEdit ? 'Modifier le paiement' : 'Nouvelle demande / paiement'}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Origine : {originDef?.label || 'Manuel'}
            </Badge>
            {defaults?.contextLabel && <span className="text-xs text-muted-foreground">{defaults.contextLabel}</span>}
            {isEdit && <Badge variant="secondary"><T k="auto.unifiedpaymentformdialog.edition" fallback="Édition" /></Badge>}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Type de paiement */}
          <div className="grid gap-2 sm:max-w-xs">
            <Label><T k="auto.unifiedpaymentformdialog.type_de_paiement" fallback="Type de paiement" /></Label>
            <Select
              value={requestType}
              onValueChange={(v) => setRequestType(v as PaymentRequestTypeKey)}
              disabled={originDef?.lockType}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_REQUEST_TYPES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{requestTypeInfo?.description}</p>
          </div>

          {/* Section 1 – Informations générales */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm"><T k="auto.unifiedpaymentformdialog.informations_generales" fallback="Informations générales" /></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {lockProject && projectId ? (
                <div className="grid gap-2">
                  <Label>Projet *</Label>
                  <Input value={projectLabel || projectId} readOnly />
                </div>
              ) : (
                <ProjectSelector
                  value={projectId}
                  onChange={(id) => { setProjectId(id); setPhaseId(''); setInspectionId(''); }}
                  label="Projet *"
                  required
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label><T k="auto.unifiedpaymentformdialog.phase_liee_optionnel" fallback="Phase liée (optionnel)" /></Label>
                  <Select value={phaseId || 'none'} onValueChange={(v) => setPhaseId(v === 'none' ? '' : v)} disabled={!projectId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une phase" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><T k="auto.unifiedpaymentformdialog.aucune" fallback="Aucune" /></SelectItem>
                      {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label><T k="auto.unifiedpaymentformdialog.inspection_liee_optionnel" fallback="Inspection liée (optionnel)" /></Label>
                  <Select value={inspectionId || 'none'} onValueChange={(v) => setInspectionId(v === 'none' ? '' : v)} disabled={!projectId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une inspection" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><T k="auto.unifiedpaymentformdialog.aucune" fallback="Aucune" /></SelectItem>
                      {inspections.map((i) => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {lockContractor ? (
                <div className="grid gap-2"><Label>Contractant *</Label><Input value={contractorName} readOnly /></div>
              ) : (
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
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2"><Label>Contact du contractant *</Label><Input value={contractorContact} onChange={(e) => setContractorContact(e.target.value)} placeholder="Auto-rempli" /></div>
                <div className="grid gap-2"><Label><T k="auto.unifiedpaymentformdialog.nom_de_la_banque" fallback="Nom de la banque" /></Label><Input value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Numéro de compte / RIB</Label><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 – Montants et dates */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm"><T k="auto.unifiedpaymentformdialog.montants_et_dates" fallback="Montants et dates" /></CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2"><Label>Montant (MRU) *</Label><Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
              <div className="grid gap-2"><Label>Date de paiement prévue *</Label><Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></div>
              <div className="grid gap-2"><Label><T k="auto.unifiedpaymentformdialog.progression" fallback="Progression (%)" /></Label><Input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} /></div>
            </CardContent>
          </Card>

          {/* Section 3 – Détails du paiement */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm"><T k="auto.unifiedpaymentformdialog.details_du_paiement" fallback="Détails du paiement" /></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2"><Label>Méthode de paiement *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label><T k="auto.unifiedpaymentformdialog.id_de_transaction" fallback="ID de transaction" /></Label><Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Référence bancaire (optionnel)" /></div>
                <div className="grid gap-2"><Label><T k="auto.unifiedpaymentformdialog.delai_de_livraison_jours" fallback="Délai de livraison (jours)" /></Label><Input type="number" min={0} value={leadTime} onChange={(e) => setLeadTime(Number(e.target.value))} /></div>
              </div>
              <div className="grid gap-2"><Label><T k="auto.unifiedpaymentformdialog.notes_optionnel" fallback="Notes (optionnel)" /></Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
            </CardContent>
          </Card>

          {/* Section 4 – Documents justificatifs (SANS champ "Parcourir") */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <T k="auto.unifiedpaymentformdialog.documents_justificatifs" fallback="Documents justificatifs" />
                <Badge variant="outline" className="ml-2">{uploadedDocs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadedDocs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm truncate">{doc.title || doc.fileName}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)} title="Voir"><Eye className="h-4 w-4" /></Button>
                        {isEdit && <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(doc.id)} title="Retirer" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDocumentUploadOpen(true)} disabled={isUploadingDocs}>
                  <Upload className="h-4 w-4 mr-2" />
                  <T k="auto.unifiedpaymentformdialog.gerer_documents" fallback="Gérer documents" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  <T k="auto.unifiedpaymentformdialog.les_documents_seront_associes_au_paiement_via_la" fallback="Les documents seront associés au paiement via la GED." />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending || isUploadingDocs}>
            <T k="auto.unifiedpaymentformdialog.annuler" fallback="Annuler" />
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || isUploadingDocs || !canSubmit}>
            {isPending || isUploadingDocs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Mettre à jour' : (originDef?.submitLabel || 'Enregistrer')}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Dialogue d'upload de documents via GED */}
      {projectId && (
        <Dialog open={isDocumentUploadOpen} onOpenChange={setIsDocumentUploadOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle><T k="auto.unifiedpaymentformdialog.ajouter_un_document_justificatif" fallback="Ajouter un document justificatif" /></DialogTitle>
              <DialogDescription>
                <T k="auto.unifiedpaymentformdialog.telechargez_un_document_pour_ce_paiement_le_type" fallback="Téléchargez un document pour ce paiement. Le type sera défini sur" /> <strong>« contract »</strong>.
              </DialogDescription>
            </DialogHeader>
            <ProjectDocumentUpload
              projectId={projectId}
              context="project"
              contextLabel={isEdit ? `Paiement ${defaults?.id?.slice(0, 8) || ''}` : 'Nouveau paiement'}
              defaultDocumentType="contract" // ✅ Explicitement 'contract'
              onDocumentUploaded={() => {
                setIsDocumentUploadOpen(false);
                toast({ title: 'Document ajouté', description: 'Le document a été joint au projet.' });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

export default UnifiedPaymentFormDialog;