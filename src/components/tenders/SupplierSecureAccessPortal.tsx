import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TenderSharingService } from '@/services/TenderSharingService';
import { Shield, Lock, FileText, Download, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const SupplierSecureAccessPortal = () => {
  const [secretCode, setSecretCode] = useState('');
  const [validatedSecret, setValidatedSecret] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Fetch tender and documents after validation
  const { data: tenderData, isLoading: tenderLoading } = useQuery({
    queryKey: ['tender-by-secret', validatedSecret?.tender_id],
    queryFn: async () => {
      if (!validatedSecret?.tender_id) return null;
      
      const { data, error } = await supabase
        .from('tenders')
        .select('*, project:projects(title, description)')
        .eq('id', validatedSecret.tender_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!validatedSecret?.tender_id
  });

  const { data: documents } = useQuery({
    queryKey: ['tender-documents', validatedSecret?.tender_id, validatedSecret?.allowed_documents],
    queryFn: async () => {
      if (!validatedSecret?.tender_id) return [];
      
      let query = supabase
        .from('documents')
        .select('*')
        .or(`metadata->>'tender_id'.eq.${validatedSecret.tender_id},project_id.eq.${tenderData?.project_id}`)
        .eq('is_shared_with_suppliers', true);
      
      // Filter by allowed documents if specified
      if (validatedSecret.allowed_documents && validatedSecret.allowed_documents.length > 0) {
        query = query.in('id', validatedSecret.allowed_documents);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!validatedSecret?.tender_id && !!tenderData
  });

  const handleValidateCode = async () => {
    if (!secretCode || secretCode.length < 8) {
      toast({
        title: 'Code invalide',
        description: 'Veuillez entrer un code valide',
        variant: 'destructive'
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await TenderSharingService.validateSecret(secretCode.toUpperCase());
      
      if (result.is_valid) {
        setValidatedSecret(result);
        
        // Log access
        await TenderSharingService.logAccess({
          sharing_secret_id: secretCode,
          action_type: 'view',
          accessed_documents: [],
          metadata: { validated_at: new Date().toISOString() }
        });
        
        toast({
          title: 'Accès autorisé',
          description: result.message
        });
      } else {
        toast({
          title: 'Accès refusé',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la validation du code',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownload = async (doc: any) => {
    if (!doc.file_url) return;
    
    // Log download action
    await TenderSharingService.logAccess({
      sharing_secret_id: secretCode,
      action_type: 'download',
      accessed_documents: [doc.id],
      metadata: { document_title: doc.title }
    });
    
    window.open(doc.file_url, '_blank');
  };

  if (!validatedSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Accès Sécurisé Fournisseur</CardTitle>
            <CardDescription>
              Entrez votre code de partage pour accéder aux documents de l'appel d'offres
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="CODE-DE-PARTAGE"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground text-center">
                Format: 12 caractères alphanumériques
              </p>
            </div>
            
            <Button 
              onClick={handleValidateCode}
              disabled={isValidating || !secretCode}
              className="w-full"
            >
              {isValidating ? 'Validation...' : 'Accéder aux documents'}
            </Button>

            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Sécurité et confidentialité
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Connexion sécurisée et chiffrée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Tous les accès sont enregistrés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Conforme aux normes mauritaniennes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Accès autorisé
                  </Badge>
                  <Badge variant="outline">{secretCode}</Badge>
                </div>
                {tenderData && (
                  <>
                    <h1 className="text-2xl font-bold">{tenderData.title}</h1>
                    <p className="text-muted-foreground">{tenderData.description}</p>
                    {tenderData.project && (
                      <p className="text-sm text-muted-foreground">
                        Projet: {tenderData.project.title}
                      </p>
                    )}
                  </>
                )}
              </div>
              <Button variant="outline" onClick={() => setValidatedSecret(null)}>
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents accessibles
            </CardTitle>
            <CardDescription>
              Documents partagés pour cette soumission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenderLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid gap-3">
                {documents.map((doc: any) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{doc.title}</h3>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {doc.document_type}
                              </Badge>
                              {doc.file_size && (
                                <Badge variant="outline" className="text-xs">
                                  {(doc.file_size / 1024).toFixed(0)} KB
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {doc.file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun document disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Rappel important</p>
              <p className="mt-1">
                Les documents accessibles via ce code sont strictement confidentiels. 
                Toute utilisation non autorisée ou partage avec des tiers est interdit 
                et peut entraîner des sanctions selon le code des marchés publics mauritanien.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
