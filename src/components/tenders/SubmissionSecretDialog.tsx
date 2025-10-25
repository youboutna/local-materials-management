// Dialog for generating and managing submission secret codes
// Decoupled UI component using service layer

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SubmissionSecretService } from '@/services/SubmissionSecretService';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Calendar, 
  Shield, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubmissionSecretDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  supplierName: string;
  tenderId: string;
}

export const SubmissionSecretDialog: React.FC<SubmissionSecretDialogProps> = ({
  isOpen,
  onOpenChange,
  submissionId,
  supplierName,
  tenderId
}) => {
  const [expiryDays, setExpiryDays] = useState(30);
  const [maxAccess, setMaxAccess] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current submission details
  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission-secret', submissionId],
    queryFn: async () => {
      return SubmissionSecretService.getSubmissionBySecret(submissionId);
    },
    enabled: isOpen && !!submissionId
  });

  // Create secret mutation
  const createSecretMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = SubmissionSecretService.getDefaultExpirationDate(expiryDays);
      
      return SubmissionSecretService.createSubmissionSecret({
        submission_id: submissionId,
        expires_at: expiresAt,
        max_access: maxAccess
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission-secret', submissionId] });
      toast({
        title: "Code secret généré",
        description: `Code créé avec succès pour ${supplierName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le code secret",
        variant: "destructive"
      });
    }
  });

  // Regenerate secret mutation
  const regenerateSecretMutation = useMutation({
    mutationFn: () => SubmissionSecretService.regenerateSecret(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-secret', submissionId] });
      toast({
        title: "Code régénéré",
        description: "Un nouveau code secret a été créé",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de régénérer le code",
        variant: "destructive"
      });
    }
  });

  // Deactivate secret mutation
  const deactivateSecretMutation = useMutation({
    mutationFn: () => SubmissionSecretService.deactivateSecret(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-secret', submissionId] });
      toast({
        title: "Code désactivé",
        description: "Le code secret a été désactivé",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de désactiver le code",
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Code copié dans le presse-papiers",
    });
  };

  const hasSecret = submission?.secret_code;
  const secretValid = submission ? SubmissionSecretService.isSecretValid(submission) : { valid: false };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Code Secret de Soumission
          </DialogTitle>
          <DialogDescription>
            Générez et gérez le code d'accès sécurisé pour l'évaluation de: <strong>{supplierName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : hasSecret ? (
            <>
              {/* Existing Secret Display */}
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Code Secret Actif
                  </CardTitle>
                  <CardDescription>
                    Code d'accès pour la commission d'évaluation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Secret Code Display */}
                  <div className="flex items-center gap-2 p-4 bg-background rounded-lg border-2 border-dashed">
                    <code className="flex-1 text-2xl font-mono font-bold text-primary tracking-wider">
                      {submission.secret_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(submission.secret_code!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Statut:</span>
                    {secretValid.valid ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <Ban className="h-3 w-3 mr-1" />
                        {secretValid.reason}
                      </Badge>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Accès utilisés
                      </div>
                      <div className="text-lg font-bold">
                        {submission.secret_access_count} / {submission.max_secret_access}
                      </div>
                    </div>

                    {submission.secret_expires_at && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Expire le
                        </div>
                        <div className="text-lg font-bold">
                          {format(new Date(submission.secret_expires_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateSecretMutation.mutate()}
                      disabled={regenerateSecretMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Régénérer
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deactivateSecretMutation.mutate()}
                      disabled={deactivateSecretMutation.isPending || !submission.is_secret_active}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Désactiver
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900">
                        Instructions de sécurité
                      </p>
                      <p className="text-sm text-amber-700">
                        Partagez ce code uniquement avec les membres autorisés de la commission d'évaluation.
                        Le code permet l'accès complet au dossier de soumission.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Create Secret Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Générer un Code Secret</CardTitle>
                  <CardDescription>
                    Configurez les paramètres de sécurité pour l'accès au dossier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry-days">
                      Durée de validité (jours)
                    </Label>
                    <Input
                      id="expiry-days"
                      type="number"
                      min="1"
                      max="365"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Le code expirera automatiquement après {expiryDays} jours
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-access">
                      Nombre d'accès maximum
                    </Label>
                    <Input
                      id="max-access"
                      type="number"
                      min="1"
                      max="100"
                      value={maxAccess}
                      onChange={(e) => setMaxAccess(parseInt(e.target.value) || 10)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Limite le nombre de fois où le code peut être utilisé
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => createSecretMutation.mutate()}
                    disabled={createSecretMutation.isPending}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {createSecretMutation.isPending ? 'Génération...' : 'Générer le Code Secret'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
