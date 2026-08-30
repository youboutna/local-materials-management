/**
 * ContractFormDialog — création manuelle / édition d'un contrat.
 * Aucun accès Supabase : passe par useContractMutations.
 */
import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
} from '@/application/services/ContractService';
import { useContractMutations } from '@/hooks/hexagonal/useContractsHex';
import type { ContractRecordDTO } from '@/dtos/entities/ContractRecordDTO';

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
  tenderId?: string | null;
  contract?: ContractRecordDTO | null;
  onSaved?: (contract: ContractRecordDTO) => void;
}

interface FormState {
  contractNumber: string;
  title: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  currency: string;
  signedDocumentUrl: string;
  notes: string;
}

const emptyState: FormState = {
  contractNumber: '',
  title: '',
  contractType: 'works',
  status: 'draft',
  startDate: '',
  endDate: '',
  totalAmount: '0',
  currency: 'MRU',
  signedDocumentUrl: '',
  notes: '',
};

export default function ContractFormDialog({
  open,
  onOpenChange,
  projectId,
  tenderId,
  contract,
  onSaved,
}: ContractFormDialogProps) {
  const { createContract, updateContract, isPending } = useContractMutations();
  const [form, setForm] = useState<FormState>(emptyState);

  useEffect(() => {
    if (!open) return;
    if (contract) {
      setForm({
        contractNumber: contract.contractNumber ?? '',
        title: contract.title ?? '',
        contractType: contract.contractType ?? 'works',
        status: contract.status ?? 'draft',
        startDate: contract.startDate?.slice(0, 10) ?? '',
        endDate: contract.endDate?.slice(0, 10) ?? '',
        totalAmount: String(contract.totalAmount ?? 0),
        currency: contract.currency ?? 'MRU',
        signedDocumentUrl: contract.signedDocumentUrl ?? '',
        notes: String((contract.metadata as any)?.notes ?? ''),
      });
    } else {
      setForm(emptyState);
    }
  }, [open, contract]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Intitulé du contrat requis');
      return;
    }
    try {
      const payload = {
        contractNumber: form.contractNumber.trim() || undefined,
        title: form.title.trim(),
        contractType: form.contractType,
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        totalAmount: Number(form.totalAmount) || 0,
        currency: form.currency,
        signedDocumentUrl: form.signedDocumentUrl.trim() || null,
        projectId: contract?.projectId ?? projectId ?? null,
        tenderId: contract?.tenderId ?? tenderId ?? null,
        metadata: form.notes.trim() ? { notes: form.notes.trim() } : null,
      };

      const saved = contract
        ? await updateContract(contract.id, payload)
        : await createContract(payload);

      toast.success(contract ? 'Contrat mis à jour' : 'Contrat créé');
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Enregistrement impossible');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Modifier le contrat' : 'Nouveau contrat'}</DialogTitle>
          <DialogDescription>
            Saisie manuelle ou import d'un contrat existant. Le numéro est généré automatiquement
            s'il est laissé vide.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-title">Intitulé *</Label>
            <Input
              id="contract-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Contrat de travaux — Lot 1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-number">Numéro</Label>
            <Input
              id="contract-number"
              value={form.contractNumber}
              onChange={(e) => set('contractNumber', e.target.value)}
              placeholder="CTR-2026-…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.contractType} onValueChange={(v) => set('contractType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{CONTRACT_TYPE_LABELS[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{CONTRACT_STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-amount">Montant HT</Label>
            <Input
              id="contract-amount"
              type="number"
              min="0"
              value={form.totalAmount}
              onChange={(e) => set('totalAmount', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-start">Début</Label>
            <Input
              id="contract-start"
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-end">Fin</Label>
            <Input
              id="contract-end"
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-url">Lien du contrat signé (optionnel)</Label>
            <Input
              id="contract-url"
              value={form.signedDocumentUrl}
              onChange={(e) => set('signedDocumentUrl', e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-notes">Notes</Label>
            <Textarea
              id="contract-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {contract ? 'Enregistrer' : 'Créer le contrat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
