import { TenderSharingService } from '@/application/services/TenderSharingService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateSharingSecretDTO } from '@/dtos/entities/tender-sharing-dto';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, Clock, Copy, Eye, Lock, Shield, Users } from 'lucide-react';
import React, { useState } from 'react';
import { T } from '@/components/i18n/T';
import { useHexagonalAuth } from '@/hooks/hexagonal/useHexagonalAuth';
import { TENDER_STATUSES, type TenderStatusCode } from '@/config/referentials/tender/tender-workflow.referential';

interface SecureSharingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId: string;
  tenderTitle: string;
  tenderStatus?: string;
  documentIds?: string[];
  workflowPhase?: string;
  workflowStage?: string;
}

export const SecureSharingDialog: React.FC<SecureSharingDialogProps> = ({
  isOpen,
  onOpenChange,
  tenderId,
  tenderTitle,
  tenderStatus = 'draft',
  documentIds = [],
  workflowPhase,
  workflowStage
}) => {
  const [supplierEmail, setSupplierEmail] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [maxAccess, setMaxAccess] = useState(10);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { hasRole } = useHexagonalAuth();

  // Rôles habilités : ils peuvent générer un code quel que soit l'avancement (hors AO annulé).
  const isPrivileged = ['super_admin', 'admin', 'manager', 'project_manager', 'director', 'directeur'].some((r) =>
    hasRole?.(r),
  );
  const normalizedStatus = (tenderStatus || '').toLowerCase();
  const statusDef = TENDER_STATUSES[normalizedStatus as TenderStatusCode];
  const isTenderActive =
    normalizedStatus !== 'cancelled' && (isPrivileged || !['draft', 'closed'].includes(normalizedStatus));


  // Fetch existing secrets
  const { data: secrets, isLoading } = useQuery({
    queryKey: ['tender-sharing-secrets', tenderId],
    queryFn: () => TenderSharingService.getTenderSharingSecrets(tenderId),
    enabled: isOpen
  });

  // Create secret mutation
  const createSecretMutation = useMutation({
    mutationFn: async () => {
      const dto: CreateSharingSecretDTO = {
        tenderId: tenderId,
        supplierEmail: supplierEmail || undefined,
        expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
        maxAccessCount: maxAccess,
        workflowPhase: workflowPhase,
        workflowStage: workflowStage,
        allowedDocumentIds: documentIds.length > 0 ? documentIds : undefined,
        sharedBy: null
      };
      
      return await TenderSharingService.createSharingSecret(dto);
    },
    onSuccess: (data) => {
      // Mise à jour optimiste immédiate (aucun refresh manuel requis)
      queryClient.setQueryData(['tender-sharing-secrets', tenderId], (prev: any) =>
        Array.isArray(prev) ? [data, ...prev] : [data],
      );
      queryClient.invalidateQueries({ queryKey: ['tender-sharing-secrets'] });
      queryClient.invalidateQueries({ queryKey: ['tender-secrets'] });
      queryClient.invalidateQueries({ queryKey: ['tender-sharing-access-logs'] });
      toast({
        title: 'Code de partage créé',
        description: `Code: ${data.secretCode}`,
      });
      setSupplierEmail('');
    },

    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le code de partage',
        variant: 'destructive'
      });
    }
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: 'Code copié',
      description: 'Le code a été copié dans le presse-papiers'
    });
  };

  const deactivateSecret = useMutation({
    mutationFn: (secretId: string) => TenderSharingService.revokeSecret(secretId),
    onSuccess: (_res, secretId) => {
      queryClient.setQueryData(['tender-sharing-secrets', tenderId], (prev: any) =>
        Array.isArray(prev) ? prev.map((s: any) => (s.id === secretId ? { ...s, isActive: false } : s)) : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['tender-sharing-secrets'] });
      toast({
        title: 'Code désactivé',
        description: 'Le code de partage a été désactivé'
      });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e?.message ?? 'Désactivation impossible', variant: 'destructive' }),
  });


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl"><T k="auto.securesharingdialog.partage_securise" fallback="Partage Sécurisé" /></DialogTitle>
              <DialogDescription className="text-sm">
                {tenderTitle}
              </DialogDescription>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Statut : {statusDef?.label ?? tenderStatus}
                </Badge>
                {isTenderActive && (
                  <Badge className="bg-success text-success-foreground text-xs gap-1">
                    <Check className="h-3 w-3" /> Partage autorisé
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Secret */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <T k="auto.securesharingdialog.creer_un_nouveau_code_de_partage" fallback="Créer un nouveau code de partage" />
              </h3>

              {/* État vide intelligent (jamais bloquant pour un AO publié) */}
              {!isTenderActive && (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  La génération de code est disponible dès la publication de l'appel d'offres (ou pour un profil administrateur / gestionnaire / directeur).
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email"><T k="auto.securesharingdialog.email_du_fournisseur_optionnel" fallback="Email du fournisseur (optionnel)" /></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="fournisseur@example.com"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiration"><T k="auto.securesharingdialog.expiration_jours" fallback="Expiration (jours)" /></Label>
                  <Input
                    id="expiration"
                    type="number"
                    min="1"
                    max="90"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAccess"><T k="auto.securesharingdialog.acces_maximum" fallback="Accès maximum" /></Label>
                  <Input
                    id="maxAccess"
                    type="number"
                    min="1"
                    max="100"
                    value={maxAccess}
                    onChange={(e) => setMaxAccess(parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>

              {documentIds.length > 0 && (
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {documentIds.length} document(s) sélectionné(s)
                  </p>
                </div>
              )}

              {workflowStage && (
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <T k="auto.securesharingdialog.etape" fallback="Étape:" /> <span className="font-medium">{workflowStage}</span>
                  </p>
                </div>
              )}

              <Button 
                onClick={() => createSecretMutation.mutate()}
                disabled={createSecretMutation.isPending || !isTenderActive}
                className={`w-full ${isTenderActive ? 'bg-success text-success-foreground hover:bg-success/90' : ''}`}
              >
                {createSecretMutation.isPending ? 'Création...' : 'Générer le code de partage'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Secrets */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Codes de partage actifs ({secrets?.filter(s => s.isActive).length || 0})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : secrets && secrets.length > 0 ? (
              <div className="grid gap-3">
                {secrets.map((secret) => (
                  <Card key={secret.id} className={`${!secret.isActive ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <code className="px-3 py-1.5 bg-muted rounded-md font-mono text-lg font-bold">
                              {secret.secretCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(secret.secretCode)}
                            >
                              {copiedCode === secret.secretCode ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-xs">
                            {secret.supplierEmail && (
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {secret.supplierEmail}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Expire: {format(new Date(secret.expiresAt), 'dd/MM/yyyy')}
                            </Badge>
                            <Badge variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              {secret.accessCount}/{secret.maxAccessCount} accès
                            </Badge>
                            {secret.workflowStage && (
                              <Badge variant="secondary">
                                {secret.workflowStage}
                              </Badge>
                            )}
                            {secret.isActive ? (
                              <Badge variant="default"><T k="auto.securesharingdialog.actif" fallback="Actif" /></Badge>
                            ) : (
                              <Badge variant="destructive"><T k="auto.securesharingdialog.inactif" fallback="Inactif" /></Badge>
                            )}
                          </div>
                        </div>
                        
                        {secret.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateSecret.mutate(secret.id)}
                            disabled={deactivateSecret.isPending}
                          >
                            <T k="auto.securesharingdialog.desactiver" fallback="Désactiver" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p><T k="auto.securesharingdialog.aucun_code_de_partage_cree" fallback="Aucun code de partage créé" /></p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Security Information */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <T k="auto.securesharingdialog.informations_de_securite" fallback="Informations de sécurité" />
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Les codes sont uniques et à usage limité</li>
                <li>• Tous les accès sont enregistrés dans les journaux d'audit</li>
                <li>• Les codes expirent automatiquement après la date limite</li>
                <li>• Conforme au manuel des procédures mauritaniennes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecureSharingDialog;