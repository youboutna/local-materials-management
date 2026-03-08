import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TenderSharingService } from '@/application/services/TenderSharingService';
import { CreateSharingSecretDTO } from '@/dtos/entities/tender-sharing-dto';
import { Copy, Check, Shield, Clock, Users, Lock, Eye, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface SecureSharingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId: string;
  tenderTitle: string;
  documentIds?: string[];
  workflowPhase?: string;
  workflowStage?: string;
}

export const SecureSharingDialog: React.FC<SecureSharingDialogProps> = ({
  isOpen,
  onOpenChange,
  tenderId,
  tenderTitle,
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
      queryClient.invalidateQueries({ queryKey: ['tender-sharing-secrets', tenderId] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-sharing-secrets', tenderId] });
      toast({
        title: 'Code désactivé',
        description: 'Le code de partage a été désactivé'
      });
    }
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
              <DialogTitle className="text-xl">Partage Sécurisé</DialogTitle>
              <DialogDescription className="text-sm">
                {tenderTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Secret */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Créer un nouveau code de partage
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email du fournisseur (optionnel)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="fournisseur@example.com"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiration">Expiration (jours)</Label>
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
                  <Label htmlFor="maxAccess">Accès maximum</Label>
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
                    Étape: <span className="font-medium">{workflowStage}</span>
                  </p>
                </div>
              )}

              <Button 
                onClick={() => createSecretMutation.mutate()}
                disabled={createSecretMutation.isPending}
                className="w-full"
              >
                {createSecretMutation.isPending ? 'Création...' : 'Générer le code de partage'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Secrets */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Codes de partage actifs ({secrets?.filter(s => s.is_active).length || 0})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : secrets && secrets.length > 0 ? (
              <div className="grid gap-3">
                {secrets.map((secret) => (
                  <Card key={secret.id} className={`${!secret.is_active ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <code className="px-3 py-1.5 bg-muted rounded-md font-mono text-lg font-bold">
                              {secret.secret_code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(secret.secret_code)}
                            >
                              {copiedCode === secret.secret_code ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-xs">
                            {secret.supplier_email && (
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {secret.supplier_email}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Expire: {format(new Date(secret.expires_at), 'dd/MM/yyyy')}
                            </Badge>
                            <Badge variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              {secret.access_count}/{secret.max_access_count} accès
                            </Badge>
                            {secret.workflow_stage && (
                              <Badge variant="secondary">
                                {secret.workflow_stage}
                              </Badge>
                            )}
                            {secret.is_active ? (
                              <Badge variant="default">Actif</Badge>
                            ) : (
                              <Badge variant="destructive">Inactif</Badge>
                            )}
                          </div>
                        </div>
                        
                        {secret.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateSecret.mutate(secret.id)}
                            disabled={deactivateSecret.isPending}
                          >
                            Désactiver
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
                  <p>Aucun code de partage créé</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Security Information */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Informations de sécurité
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
