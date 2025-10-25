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
import { SubmissionSecretService } from '@/services/SubmissionSecretService';

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
    queryFn: async () => {
      const data = await SubmissionSecretService.getSubmissionBySecret(submissionId);
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

  if (!submission?.secret_code) {
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
  const formattedCode = formatSecretCode(submission.secret_code);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Code Secret pour la Commission d'Évaluation
        </CardTitle>
        <CardDescription>
          Partagez ce code avec la commission d'évaluation pour leur permettre d'accéder à votre dossier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Secret Code Display */}
        <div className="bg-card border-2 border-dashed border-primary/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Code Secret</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? (
                <><EyeOff className="h-4 w-4 mr-1" /> Masquer</>
              ) : (
                <><Eye className="h-4 w-4 mr-1" /> Afficher</>
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
              onClick={() => copyToClipboard(submission.secret_code || '')}
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
              <><CheckCircle className="h-3 w-3 mr-1" /> Actif</>
            ) : (
              <><AlertCircle className="h-3 w-3 mr-1" /> {secretValid.reason}</>
            )}
          </Badge>
          
          {submission.secret_expires_at && (
            <Badge variant="outline">
              Expire le: {new Date(submission.secret_expires_at).toLocaleDateString()}
            </Badge>
          )}
          
          <Badge variant="outline">
            Accès: {submission.secret_access_count}/{submission.max_secret_access}
          </Badge>
        </div>

        {/* Instructions */}
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-1">
            <p className="font-medium">Instructions importantes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Communiquez ce code uniquement à la commission d'évaluation officielle</li>
              <li>Le code permet d'accéder à tous vos documents de soumission</li>
              <li>Vous pouvez régénérer un nouveau code si nécessaire</li>
              <li>Le code expire automatiquement après {submission.max_secret_access} accès ou à la date d'expiration</li>
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
                Régénération...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer le Code
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
