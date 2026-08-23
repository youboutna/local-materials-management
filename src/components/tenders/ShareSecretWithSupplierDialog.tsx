import { TenderSharingService } from '@/application/services/TenderSharingService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useSuppliersSelector } from '@/hooks/hexagonal/useSelectorsHex';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Building2, Check, Loader2, Mail, Pencil, Search, User } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { T } from '@/components/i18n/T';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId: string;
  tenderTitle: string;
  secretCode: string;
  secretId?: string;
  expiresAt?: string | null;
  defaultEmail?: string; // Email pré-rempli depuis le secret
}

export const ShareSecretWithSupplierDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  tenderId,
  tenderTitle,
  secretCode,
  secretId,
  expiresAt,
  defaultEmail = '',
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const { data: suppliers = [], isLoading } = useSuppliersSelector(debounced, open);

  const selected = useMemo(
    () => suppliers.find((s) => s.id === selectedId) ?? null,
    [suppliers, selectedId],
  );

  // Mettre à jour l'email quand un fournisseur est sélectionné
  useEffect(() => {
    if (selected) {
      setEmail(selected.email || '');
    }
  }, [selected]);

  // Mettre à jour l'email par défaut quand le dialogue s'ouvre
  useEffect(() => {
    if (open && defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [open, defaultEmail]);

  const recipientId = selected?.id || null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSend = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      toast({
        title: 'E-mail requis',
        description: 'Veuillez saisir une adresse email valide.',
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
        supplierName: selected?.name || 'Fournisseur',
        recipientId: recipientId || undefined,
        senderName: user?.fullName || user?.email || 'Utilisateur',
        senderEmail: user?.email || 'non disponible',
        senderId: user?.id || undefined,
        expiresAt: expiresAt ?? null,
        message: message.trim() || undefined,
      });

      toast({
        title: 'Code partagé',
        description: `Envoyé à ${targetEmail}${selected?.name ? ` (${selected.name})` : ''}`,
      });
      onOpenChange(false);
      setMessage('');
      setEmail('');
      setSelectedId(null);
      setSearch('');
    } catch (error) {
      toast({
        title: 'Échec du partage',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
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
          <DialogTitle><T k="auto.sharesecretwithsupplierdialog.partager_le_code_avec_un_fournisseur" fallback="Partager le code avec un fournisseur" /></DialogTitle>
          <DialogDescription>
            Le fournisseur recevra le code d’accès et le lien du portail sécurisé pour «{' '}
            {tenderTitle} ».
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Émetteur */}
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(user.fullName || user.email || 'U')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.fullName || 'Utilisateur'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  <User className="inline h-3 w-3 mr-1" />
                  {user.email}
                </p>
              </div>
              <Badge variant="outline" className="text-xs"><T k="auto.sharesecretwithsupplierdialog.emetteur" fallback="Émetteur" /></Badge>
            </div>
          )}

          {/* Sélecteur de fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="share-supplier-search"><T k="auto.sharesecretwithsupplierdialog.fournisseur_destinataire" fallback="Fournisseur destinataire" /></Label>
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
                <div className="p-3 text-sm text-muted-foreground"><T k="auto.sharesecretwithsupplierdialog.aucun_fournisseur_trouve" fallback="Aucun fournisseur trouvé." /></div>
              ) : (
                <ul className="divide-y">
                  {suppliers.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(s.id);
                          // L'email sera mis à jour via useEffect
                        }}
                        className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{s.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            <Building2 className="inline h-3 w-3 mr-1" />
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

          {/* Email modifiable */}
          <div className="space-y-2">
            <Label htmlFor="share-supplier-email" className="flex items-center gap-2">
              <T k="auto.sharesecretwithsupplierdialog.e_mail_destinataire" fallback="E-mail destinataire" />
              <span className="text-xs text-muted-foreground font-normal">(modifiable)</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="share-supplier-email"
                type="email"
                className="pl-8"
                placeholder="fournisseur@exemple.mr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {selected && email !== selected.email && selected.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                <T k="auto.sharesecretwithsupplierdialog.email_modifie_manuellement_l_uuid_du_fournisseur" fallback="Email modifié manuellement. L'UUID du fournisseur est conservé pour le suivi." />
              </p>
            )}
          </div>

          {/* Message optionnel */}
          <div className="space-y-2">
            <Label htmlFor="share-supplier-message"><T k="auto.sharesecretwithsupplierdialog.message_optionnel" fallback="Message (optionnel)" /></Label>
            <Textarea
              id="share-supplier-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisions sur le dossier, la date limite…"
            />
          </div>

          {/* Code secret */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {secretCode}
            </Badge>
            <span>
              expire {expiresAt ? new Date(expiresAt).toLocaleDateString('fr-FR') : 'sans date limite'}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            <T k="auto.sharesecretwithsupplierdialog.annuler" fallback="Annuler" />
          </Button>
          <Button onClick={handleSend} disabled={sending || !email.trim()}>
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