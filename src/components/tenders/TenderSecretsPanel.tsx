/**
 * TenderSecretsPanel — Gestion centralisée des codes secrets d'AO (Lot 5)
 * Utilise ITenderSharingRepository via useTenderSharingSecrets/useRevokeTenderSecret/useDeleteTenderSecret.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ShieldX, Trash2, Plus, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useTenderSharingSecrets,
  useRevokeTenderSecret,
  useDeleteTenderSecret,
} from '@/hooks/hexagonal';
import { SecureSharingDialog } from './SecureSharingDialog';

interface TenderSecretsPanelProps {
  tenderId: string;
  tenderTitle: string;
}

export function TenderSecretsPanel({ tenderId, tenderTitle }: TenderSecretsPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: secrets = [], isLoading } = useTenderSharingSecrets(tenderId);
  const revoke = useRevokeTenderSecret();
  const remove = useDeleteTenderSecret();
  const { toast } = useToast();

  const copyPortalLink = (code: string) => {
    const url = `${window.location.origin}/supplier-secure-access?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Lien copié', description: url });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Codes secrets ({secrets.length})
          </CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nouveau code
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Chargement…</div>
          ) : secrets.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Aucun code secret. Cliquez sur « Nouveau code » pour partager cet AO avec un fournisseur.
            </div>
          ) : (
            <div className="space-y-2">
              {secrets.map((s: any) => {
                const expired = s.expiresAt && new Date(s.expiresAt) < new Date();
                const capped = s.maxAccessCount && s.accessCount >= s.maxAccessCount;
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {s.secretCode}
                        </code>
                        <Badge variant={s.isActive && !expired ? 'default' : 'secondary'}>
                          {s.isActive && !expired ? 'Actif' : expired ? 'Expiré' : 'Révoqué'}
                        </Badge>
                        {capped && <Badge variant="destructive">Quota atteint</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {s.supplierEmail || '—'} · expire {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('fr-FR') : '—'} · {s.accessCount}/{s.maxAccessCount ?? '∞'} accès
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="ghost" title="Copier le code" onClick={() => { navigator.clipboard.writeText(s.secretCode); toast({ title: 'Code copié' }); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Copier le lien portail" onClick={() => copyPortalLink(s.secretCode)}>
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      {s.isActive && (
                        <Button size="sm" variant="outline" title="Révoquer" onClick={() => revoke.mutate(s.id)} disabled={revoke.isPending}>
                          <ShieldX className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" title="Supprimer" onClick={() => remove.mutate(s.id)} disabled={remove.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SecureSharingDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        tenderId={tenderId}
        tenderTitle={tenderTitle}
      />
    </>
  );
}

export default TenderSecretsPanel;
