/**
 * ShareSecretWithSupplierDialog — partage direct d'un code secret avec un
 * fournisseur (même ergonomie que le partage de document).
 * Sélection du fournisseur via `useSuppliersSelector` (hexagonal), envoi via
 * `TenderSharingService.shareWithSupplier`. Aucun appel Supabase dans l'UI.
 */
import React, { useMemo, useState } from 'react';
import { Check, Loader2, Mail, Search } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSuppliersSelector } from '@/hooks/hexagonal/useSelectorsHex';
import { TenderSharingService } from '@/application/services/TenderSharingService';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId: string;
  tenderTitle: string;
  secretCode: string;
  secretId?: string;
  expiresAt?: string | null;
}

export const ShareSecretWithSupplierDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  tenderId,
  tenderTitle,
  secretCode,
  secretId,
  expiresAt,
}) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: suppliers = [], isLoading } = useSuppliersSelector(debounced, open);

  const selected = useMemo(
    () => suppliers.find((s) => s.id === selectedId) ?? null,
    [suppliers, selectedId],
  );

  const targetEmail = email.trim() || selected?.email || '';

  const handleSend = async () => {
    if (!targetEmail) {
      toast({
        title: 'E-mail requis',
        description: 'Sélectionnez un fournisseur disposant d’un e-mail ou saisissez une adresse.',
        variant: 'destructive',
      });
      return;
    }
    setSending(true);
    try {
      await TenderSharingService.shareWithSupplier({
        tenderId,
        tenderTitle,
        secretCode,
        secretId,
        supplierEmail: targetEmail,
        supplierName: selected?.name,
        expiresAt: expiresAt ?? null,
        message: message.trim() || undefined,
      });
      toast({ title: 'Code partagé', description: `Envoyé à ${targetEmail}` });
      onOpenChange(false);
      setMessage('');
      setEmail('');
      setSelectedId(null);
    } catch (e) {
      toast({
        title: 'Échec du partage',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partager le code avec un fournisseur</DialogTitle>
          <DialogDescription>
            Le fournisseur recevra le code d’accès et le lien du portail sécurisé pour «{' '}
            {tenderTitle} ».
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-supplier-search">Fournisseur</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="share-supplier-search"
                className="pl-8"
                placeholder="Rechercher un fournisseur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-40 rounded-md border">
              {isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">Chargement…</div>
              ) : suppliers.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">Aucun fournisseur trouvé.</div>
              ) : (
                <ul className="divide-y">
                  {suppliers.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(s.id);
                          setEmail(s.email ?? '');
                        }}
                        className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{s.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {s.email || 'e-mail non renseigné'}
                          </span>
                        </span>
                        {selectedId === s.id && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-supplier-email">E-mail destinataire</Label>
            <Input
              id="share-supplier-email"
              type="email"
              placeholder="fournisseur@exemple.mr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-supplier-message">Message (optionnel)</Label>
            <Textarea
              id="share-supplier-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisions sur le dossier, la date limite…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {secretCode}
            </Badge>
            <span>
              expire{' '}
              {expiresAt ? new Date(expiresAt).toLocaleDateString('fr-FR') : 'sans date limite'}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending || !targetEmail}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSecretWithSupplierDialog;
