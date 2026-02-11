import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TenderSharingService } from '@/application/services/TenderSharingService';

interface SupplierTenderAccessGuardProps {
  onAccessGranted: (tenderId: string, supplierEmail: string) => void;
  children: React.ReactNode;
}

export const SupplierTenderAccessGuard: React.FC<SupplierTenderAccessGuardProps> = ({
  onAccessGranted,
  children
}) => {
  const [secretCode, setSecretCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [grantedTenderId, setGrantedTenderId] = useState<string | null>(null);
  const [supplierEmail, setSupplierEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const handleValidateCode = async () => {
    if (!secretCode.trim()) {
      toast({
        title: 'Code requis',
        description: 'Veuillez entrer le code secret fourni par l\'administration.',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);

    try {
      const validation = await TenderSharingService.validateSecret(secretCode.trim());
      
      if (!validation.is_valid) {
        toast({
          title: 'Code invalide',
          description: validation.message || 'Le code secret est invalide, expiré ou a atteint son nombre maximum d\'accès.',
          variant: 'destructive',
        });
        return;
      }

      // Log the access
      await TenderSharingService.logAccess({
        sharing_secret_id: secretCode,
        action_type: 'view',
        metadata: {
          access_type: 'supplier_tender_portal',
          timestamp: new Date().toISOString()
        }
      });

      setHasAccess(true);
      setGrantedTenderId(validation.tender_id || null);
      
      // Get supplier email from validated secret
      const email = validation.message || '';
      setSupplierEmail(email);
      
      toast({
        title: 'Accès autorisé',
        description: 'Vous avez accès aux détails de l\'appel d\'offres et pouvez soumettre votre candidature.',
      });

      if (validation.tender_id) {
        onAccessGranted(validation.tender_id, email);
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la validation du code.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleValidateCode();
    }
  };

  if (hasAccess && grantedTenderId) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Accès Sécurisé</CardTitle>
          <CardDescription>
            Un code secret est requis pour accéder aux détails de l'appel d'offres et soumettre votre candidature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="secret-code">Code Secret</Label>
            <Input
              id="secret-code"
              type="text"
              placeholder="Entrez le code secret (ex: ABC123-DEF456)"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={isValidating}
              className="font-mono text-center tracking-wider"
            />
          </div>

          <Button
            onClick={handleValidateCode}
            disabled={isValidating || !secretCode.trim()}
            className="w-full"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Validation en cours...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Valider le Code
              </>
            )}
          </Button>

          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">Comment obtenir un code secret ?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Le code vous est fourni par l'administration après votre préqualification</li>
                  <li>Vérifiez vos emails ou notifications pour le code</li>
                  <li>Le code peut avoir une date d'expiration et un nombre d'accès limité</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Connexion sécurisée</span>
              </div>
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Protocole vérifié
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
