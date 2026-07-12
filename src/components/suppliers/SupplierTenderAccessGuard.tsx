import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const SESSION_KEY = 'supplier-tender-secret';

export const SupplierTenderAccessGuard: React.FC<SupplierTenderAccessGuardProps> = ({
  onAccessGranted,
  children
}) => {
  const [searchParams] = useSearchParams();
  const [secretCode, setSecretCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [grantedTenderId, setGrantedTenderId] = useState<string | null>(null);
  const [supplierEmail, setSupplierEmail] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-unlock from URL params (redirect from /supplier-access) or persisted session.
  useEffect(() => {
    if (hasAccess) return;
    const urlTid = searchParams.get('tenderId');
    const urlSecret = searchParams.get('secret');
    if (urlTid) {
      setHasAccess(true);
      setGrantedTenderId(urlTid);
      const email = searchParams.get('email') ?? '';
      setSupplierEmail(email);
      onAccessGranted(urlTid, email);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ tenderId: urlTid, secretCode: urlSecret ?? '', email }));
      } catch { /* noop */ }
      return;
    }
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tenderId) {
          setHasAccess(true);
          setGrantedTenderId(parsed.tenderId);
          setSupplierEmail(parsed.email ?? '');
          onAccessGranted(parsed.tenderId, parsed.email ?? '');
        }
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


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
      const validation = await TenderSharingService.validateSecret(secretCode.trim(), '');
      
      if (!validation.isValid) {
        toast({
          title: 'Code invalide',
          description: validation.message || 'Le code secret est invalide, expiré ou a atteint son nombre maximum d\'accès.',
          variant: 'destructive',
        });
        return;
      }

      // Log the access
      await TenderSharingService.logAccess({
        sharingSecretId: secretCode,
        actionType: 'view',
        accessedAt: new Date().toISOString(),
        accessedBy: null,
        sharedBy: null,
        metadata: {
          access_type: 'supplier_tender_portal',
          timestamp: new Date().toISOString()
        }
      });

      setHasAccess(true);
      setGrantedTenderId(validation.tenderId || null);
      
      // Get supplier email from validated secret
      const email = validation.message || '';
      setSupplierEmail(email);
      
      toast({
        title: 'Accès autorisé',
        description: 'Vous avez accès aux détails de l\'appel d\'offres et pouvez soumettre votre candidature.',
      });

      if (validation.tenderId) {
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ tenderId: validation.tenderId, secretCode: secretCode.trim(), email }));
        } catch { /* noop */ }
        onAccessGranted(validation.tenderId, email);
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
