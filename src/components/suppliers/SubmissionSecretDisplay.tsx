import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubmissionSecretService } from '@/application/services/SubmissionSecretService';
import { SubmissionSecretDTO } from '@/dtos/entities/SubmissionSecretDTO';
import { T } from '@/components/i18n/T';

interface SubmissionSecretDisplayProps {
  submissionId: string;
}

export const SubmissionSecretDisplay: React.FC<SubmissionSecretDisplayProps> = ({ submissionId }) => {
  const [showSecret, setShowSecret] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch submission secret
  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission-secret-display', submissionId],
    queryFn: async (): Promise<SubmissionSecretDTO | null> => {
      const data = await SubmissionSecretService.getSubmissionById(submissionId);
      return data;
    },
    enabled: !!submissionId
  });

  // Regenerate secret mutation
  const regenerateMutation = useMutation({
    mutationFn: () => SubmissionSecretService.regenerateSecret(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-secret-display', submissionId] });
      toast({
        title: "Code régénéré",
        description: "Un nouveau code secret a été généré avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de régénérer le code secret.",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Code copié",
      description: "Le code secret a été copié dans le presse-papier.",
    });
  };

  const formatSecretCode = (code: string): string => {
    // Format: ABC123-DEF456
    if (code.length >= 6) {
      return `${code.substring(0, 6)}-${code.substring(6)}`;
    }
    return code;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!submission?.secretCode) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucun code secret n'a été généré pour cette soumission. Veuillez contacter l'administration.
        </AlertDescription>
      </Alert>
    );
  }

  const secretValid = SubmissionSecretService.isSecretValid(submission);
  const formattedCode = formatSecretCode(submission.secretCode);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          <T k="auto.submissionsecretdisplay.code_secret_pour_la_commission_d_evaluation" fallback="Code Secret pour la Commission d'Évaluation" />
        </CardTitle>
        <CardDescription>
          Partagez ce code avec la commission d'évaluation pour leur permettre d'accéder à votre dossier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Secret Code Display */}
        <div className="bg-card border-2 border-dashed border-primary/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground"><T k="auto.submissionsecretdisplay.code_secret" fallback="Code Secret" /></span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? (
                <><EyeOff className="h-4 w-4 mr-1" /> <T k="auto.submissionsecretdisplay.masquer" fallback="Masquer" /></>
              ) : (
                <><Eye className="h-4 w-4 mr-1" /> <T k="auto.submissionsecretdisplay.afficher" fallback="Afficher" /></>
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <code className="flex-1 text-2xl font-mono font-bold tracking-wider text-center py-3 px-4 bg-muted rounded">
              {showSecret ? formattedCode : '•••••••••••'}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(submission.secretCode || '')}
              disabled={!showSecret}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={secretValid.valid ? "default" : "destructive"}>
            {secretValid.valid ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> <T k="auto.submissionsecretdisplay.actif" fallback="Actif" /></>
            ) : (
              <><AlertCircle className="h-3 w-3 mr-1" /> {secretValid.reason}</>
            )}
          </Badge>
          
          {submission.expiresAt && (
            <Badge variant="outline">
              Expire le: {new Date(submission.expiresAt).toLocaleDateString()}
            </Badge>
          )}
          
          <Badge variant="outline">
            Accès: {submission.accessCount}/{submission.maxAccess}
          </Badge>
        </div>

        {/* Instructions */}
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-1">
            <p className="font-medium"><T k="auto.submissionsecretdisplay.instructions_importantes" fallback="Instructions importantes:" /></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><T k="auto.submissionsecretdisplay.communiquez_ce_code_uniquement_a_la_commission_d" fallback="Communiquez ce code uniquement à la commission d'évaluation officielle" /></li>
              <li><T k="auto.submissionsecretdisplay.le_code_permet_d_acceder_a_tous_vos_documents_de" fallback="Le code permet d'accéder à tous vos documents de soumission" /></li>
              <li><T k="auto.submissionsecretdisplay.vous_pouvez_regenerer_un_nouveau_code_si_necessa" fallback="Vous pouvez régénérer un nouveau code si nécessaire" /></li>
              <li>Le code expire automatiquement après {submission.maxAccess} accès ou à la date d'expiration</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
          >
            {regenerateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                <T k="auto.submissionsecretdisplay.regeneration" fallback="Régénération..." />
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <T k="auto.submissionsecretdisplay.regenerer_le_code" fallback="Régénérer le Code" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
