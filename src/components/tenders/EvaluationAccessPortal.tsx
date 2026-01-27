// Portal for accessing tender evaluation using secret code
// Decoupled component with service layer integration

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { SubmissionSecretService } from '@/application/services/SubmissionSecretService';
import { SubmissionEvaluationPanel } from '@/components/tenders/SubmissionEvaluationPanel';
import { 
  Shield, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  User
} from 'lucide-react';


export const EvaluationAccessPortal: React.FC = () => {
  const [secretCode, setSecretCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [tenderId, setTenderId] = useState<string | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = await SubmissionSecretService.validateSecret(code);
      
      if (result.is_valid && result.submission_id) {
        // Log the access
        await SubmissionSecretService.logAccess({
          submission_id: result.submission_id,
          action_type: 'view',
          accessed_sections: ['portal'],
          user_agent: navigator.userAgent
        });
      }
      
      return result;
    },
    onSuccess: (data) => {
      setValidationResult(data);
      
      if (data.is_valid && data.tender_id && data.submission_id) {
        setAccessGranted(true);
        setSubmissionId(data.submission_id);
        setTenderId(data.tender_id);
      }
    },
    onError: (error) => {
      setValidationResult({
        is_valid: false,
        message: 'Erreur de connexion au serveur'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secretCode.trim()) {
      setValidationResult({
        is_valid: false,
        message: 'Veuillez entrer un code secret'
      });
      return;
    }
    
    setValidationResult(null);
    validateMutation.mutate(secretCode.trim().toUpperCase());
  };

  const formatSecretCode = (value: string) => {
    // Auto-format as XXXX-XXXX-XXXX
    const cleaned = value.replace(/[^A-Z0-9]/g, '');
    const parts: string[] = [];
    
    for (let i = 0; i < cleaned.length && i < 12; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    
    return parts.join('-');
  };

  // If access is granted, show the evaluation panel
  if (accessGranted && submissionId && tenderId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Commission d'Évaluation</h1>
                <p className="text-sm text-muted-foreground">Accès sécurisé autorisé</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setAccessGranted(false);
                setSubmissionId(null);
                setTenderId(null);
                setSecretCode('');
                setValidationResult(null);
              }}
            >
              <Lock className="h-4 w-4 mr-2" />
              Quitter
            </Button>
          </div>
          
          <SubmissionEvaluationPanel 
            submissionId={submissionId} 
            tenderId={tenderId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Accès Évaluation</h1>
          <p className="text-muted-foreground">
            Portail sécurisé d'évaluation des soumissions
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Code Secret d'Accès</CardTitle>
            <CardDescription>
              Entrez le code secret fourni par le soumissionnaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Secret Code Input */}
              <div className="space-y-2">
                <Label htmlFor="secret-code" className="text-base font-medium">
                  Code Secret
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="secret-code"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={secretCode}
                    onChange={(e) => setSecretCode(formatSecretCode(e.target.value.toUpperCase()))}
                    className="pl-10 text-lg font-mono tracking-wider uppercase"
                    maxLength={14}
                    autoComplete="off"
                    disabled={validateMutation.isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Le code est composé de 12 caractères alphanumériques
                </p>
              </div>

              {/* Validation Result */}
              {validationResult && (
                <Alert className={validationResult.is_valid ? 'border-green-500 bg-green-50' : 'border-destructive bg-destructive/10'}>
                  <div className="flex items-start gap-3">
                    {validationResult.is_valid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <AlertDescription className="font-medium">
                        {validationResult.message}
                      </AlertDescription>
                      
                      {validationResult.is_valid && validationResult.supplier_name && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Soumissionnaire:</span>
                            <span>{validationResult.supplier_name}</span>
                          </div>
                          <div className="text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4 inline mr-1" />
                            Accès autorisé - Chargement du dossier...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={validateMutation.isPending || (validationResult?.is_valid === true)}
              >
                {validateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Vérification...
                  </>
                ) : validationResult?.is_valid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Accès Autorisé
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Valider le Code
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">
                  Accès Réglementé
                </p>
                <p className="text-sm text-amber-700">
                  Cet accès est réservé aux membres autorisés de la commission d'évaluation.
                  Toutes les actions sont tracées et auditées conformément aux réglementations
                  mauritaniennes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Vous n'avez pas de code d'accès?
            <br />
            Contactez le soumissionnaire ou l'administrateur système.
          </p>
        </div>
      </div>
    </div>
  );
};
