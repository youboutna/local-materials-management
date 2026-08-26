/**
 * DocumentPartiesDialog — édition de l'en-tête documentaire (émetteur /
 * destinataire) avec autocomplétion sur les organisations et fournisseurs.
 *
 * Règle métier : l'en-tête reste éditable TANT QUE le document n'est pas signé.
 * Après signature, les champs sont verrouillés (lecture seule) et le PDF /
 * Factur-X est généré à partir des valeurs figées.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Lock, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { useDocumentPartySuggestions, type DocumentPartySuggestion } from '@/hooks/boq/useDocumentPartySuggestions';

export interface DocumentRecipientValue {
  name: string;
  email?: string;
}

export interface DocumentPartiesValue {
  /** Titre du document (obligatoire, ex. « DQE »). */
  title?: string;
  /** TypeCode UNTDID 1001 (310 devis, 380 facture) — obligatoire. */
  facturxTypeCode?: string;
  senderName?: string;
  senderAddress?: string;
  senderPhone?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  /** Destinataires additionnels (copies / co-signataires). */
  extraRecipients?: DocumentRecipientValue[];
  /** Référence documentaire affichée sur le PDF (Réf. DQE / N° facture). */
  reference?: string;
  /** Date d'émission ISO (YYYY-MM-DD). */
  issueDate?: string;
  /** Devise ISO 4217. */
  currency?: string;
  /** Validité de l'offre en jours. */
  validityDays?: number;
}


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: DocumentPartiesValue;
  locked?: boolean;
  onSave: (v: DocumentPartiesValue) => void;
}

interface PartyAutocompleteProps {
  label: string;
  value?: string;
  disabled?: boolean;
  suggestions: DocumentPartySuggestion[];
  onPick: (p: DocumentPartySuggestion) => void;
  onType: (v: string) => void;
  placeholder: string;
  emptyLabel: string;
  searchLabel: string;
}

const PartyAutocomplete: React.FC<PartyAutocompleteProps> = ({
  label, value, disabled, suggestions, onPick, onType, placeholder, emptyLabel, searchLabel,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value ?? ''}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onType(e.target.value)}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" disabled={disabled} aria-label={searchLabel}>
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="end">
            <Command>
              <CommandInput placeholder={searchLabel} />
              <CommandList>
                <CommandEmpty>{emptyLabel}</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((s) => (
                    <CommandItem
                      key={s.id}
                      value={`${s.name} ${s.kind}`}
                      onSelect={() => { onPick(s); setOpen(false); }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', value === s.name ? 'opacity-100' : 'opacity-0')} />
                      <span className="flex-1 truncate">{s.name}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{s.kind}</Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export const DocumentPartiesDialog: React.FC<Props> = ({ open, onOpenChange, value, locked = false, onSave }) => {
  const { t } = useI18n();
  const { suggestions } = useDocumentPartySuggestions();
  const [draft, setDraft] = React.useState<DocumentPartiesValue>(value);

  React.useEffect(() => { if (open) setDraft(value); }, [open, value]);

  const patch = (p: Partial<DocumentPartiesValue>) => setDraft((prev) => ({ ...prev, ...p }));

  const recipients = draft.extraRecipients ?? [];
  const patchRecipient = (index: number, p: Partial<DocumentRecipientValue>) =>
    patch({ extraRecipients: recipients.map((r, i) => (i === index ? { ...r, ...p } : r)) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dqe.parties.edit_title')}</DialogTitle>
          <DialogDescription>
            {locked ? t('dqe.parties.locked_hint') : t('dqe.parties.edit_hint')}
          </DialogDescription>
        </DialogHeader>

        {locked && (
          <Badge variant="secondary" className="w-fit">
            <Lock className="h-3 w-3 mr-1" />
            {t('dqe.parties.locked_badge')}
          </Badge>
        )}

        <div className="space-y-4">
          {/* En-tête documentaire : référence, date, devise, validité */}
          <div className="grid grid-cols-1 gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>{t('dqe.header.reference') || 'Référence'}</Label>
              <Input value={draft.reference ?? ''} disabled={locked}
                onChange={(e) => patch({ reference: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t('dqe.header.issue_date') || "Date d'émission"}</Label>
              <Input type="date" value={draft.issueDate ?? ''} disabled={locked}
                onChange={(e) => patch({ issueDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t('dqe.header.currency') || 'Devise'}</Label>
              <Input value={draft.currency ?? ''} disabled={locked} placeholder="MRU"
                onChange={(e) => patch({ currency: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-1">
              <Label>{t('dqe.header.validity_days') || 'Validité (jours)'}</Label>
              <Input type="number" min={1} value={draft.validityDays ?? ''} disabled={locked}
                onChange={(e) => patch({ validityDays: Number(e.target.value) || undefined })} />
            </div>
          </div>


          <PartyAutocomplete
            label={t('dqe.parties.sender')}
            value={draft.senderName}
            disabled={locked}
            suggestions={suggestions}
            searchLabel={t('dqe.parties.search')}
            emptyLabel={t('dqe.parties.no_result')}
            placeholder={t('dqe.parties.sender_placeholder')}
            onType={(v) => patch({ senderName: v })}
            onPick={(s) => patch({
              senderName: s.name,
              senderAddress: s.address ?? draft.senderAddress,
              senderPhone: s.phone ?? draft.senderPhone,
              senderEmail: s.email ?? draft.senderEmail,
            })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1 sm:col-span-3">
              <Label>{t('dqe.parties.sender_address')}</Label>
              <Input value={draft.senderAddress ?? ''} disabled={locked}
                onChange={(e) => patch({ senderAddress: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t('dqe.parties.sender_phone')}</Label>
              <Input value={draft.senderPhone ?? ''} disabled={locked}
                onChange={(e) => patch({ senderPhone: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>{t('dqe.parties.sender_email')}</Label>
              <Input type="email" value={draft.senderEmail ?? ''} disabled={locked}
                onChange={(e) => patch({ senderEmail: e.target.value })} />
            </div>
          </div>

          <PartyAutocomplete
            label={t('dqe.parties.recipient')}
            value={draft.recipientName}
            disabled={locked}
            suggestions={suggestions}
            searchLabel={t('dqe.parties.search')}
            emptyLabel={t('dqe.parties.no_result')}
            placeholder={t('dqe.parties.recipient_placeholder')}
            onType={(v) => patch({ recipientName: v })}
            onPick={(s) => patch({
              recipientName: s.name,
              recipientEmail: s.email ?? draft.recipientEmail,
            })}
          />

          <div className="space-y-1">
            <Label>{t('dqe.parties.recipient_email')}</Label>
            <Input type="email" value={draft.recipientEmail ?? ''} disabled={locked}
              onChange={(e) => patch({ recipientEmail: e.target.value })} />
          </div>

          {/* Destinataires additionnels (copies / co-signataires) */}
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>{t('dqe.header.extra_recipients') || 'Destinataires additionnels'}</Label>
              <Button type="button" variant="outline" size="sm" disabled={locked}
                onClick={() => patch({ extraRecipients: [...recipients, { name: '', email: '' }] })}>
                <Plus className="mr-1 h-3 w-3" />
                {t('common.add') || 'Ajouter'}
              </Button>
            </div>
            {recipients.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('dqe.header.extra_recipients_hint') || 'Aucun destinataire additionnel.'}
              </p>
            ) : (
              recipients.map((r, index) => (
                <div key={`recipient-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input value={r.name} disabled={locked}
                    placeholder={t('dqe.parties.recipient_placeholder')}
                    onChange={(e) => patchRecipient(index, { name: e.target.value })} />
                  <Input type="email" value={r.email ?? ''} disabled={locked}
                    placeholder={t('dqe.parties.recipient_email')}
                    onChange={(e) => patchRecipient(index, { email: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" disabled={locked}
                    aria-label={t('common.delete') || 'Supprimer'}
                    onClick={() => patch({ extraRecipients: recipients.filter((_, i) => i !== index) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button disabled={locked} onClick={() => { onSave(draft); onOpenChange(false); }}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
