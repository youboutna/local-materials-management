import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Send, 
  Eye,
  Calculator,
  Download,
  Share2,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import TenderQuantitativeEstimate from '@/components/tenders/TenderQuantitativeEstimate';
import { SupplierTenderAccessGuard } from '@/components/suppliers/SupplierTenderAccessGuard';
import { SubmissionSecretService } from '@/services/SubmissionSecretService';
import { SubmissionSecretDisplay } from '@/components/suppliers/SubmissionSecretDisplay';

interface PublicTender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  deadline_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  current_phase?: number;
  created_at: string;
  updated_at: string;
  project?: {
    title: string;
    description?: string;
    location?: string;
  };
}

interface BidSubmission {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  metadata?: {
    tender_id?: string;
    submission_date?: string;
    submission_type?: string;
    administrative_docs?: string[];
    technical_docs?: string[];
    financial_docs?: string[];
  };
}

interface SharedDocument {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  description?: string;
  created_at: string;
  metadata?: {
    tender_id?: string;
    phase?: number;
    shared_by?: string;
  };
}

const DOCUMENT_CATEGORIES = {
  administrative: 'Documents Administratifs',
  technical: 'Documents Techniques', 
  financial: 'Documents Financiers'
} as const;

const REQUIRED_DOCUMENTS = {
  administrative: [
    'Registre de commerce',
    'Statuts de la société',
    'Déclaration fiscale',
    'Certificat de conformité',
    'Attestation d\'assurance'
  ],
  technical: [
    'CV et références techniques',
    'Certificats de qualification',
    'Plan de réalisation',
    'Méthodologie',
    'Planning prévisionnel'
  ],
  financial: [
    'Devis quantitatif estimatif',
    'Garantie bancaire',
    'Bilan financier',
    'Références bancaires',
    'Caution de soumission'
  ]
};

const EnhancedSupplierTenderPortal = () => {
  const [selectedTender, setSelectedTender] = useState<PublicTender | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: File}>({});
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof DOCUMENT_CATEGORIES | null>(null);
  const [submissionData, setSubmissionData] = useState({
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('browse');
  const [hasAccessToTender, setHasAccessToTender] = useState(false);
  const [accessGrantedTenderId, setAccessGrantedTenderId] = useState<string | null>(null);
  const [supplierEmailFromSecret, setSupplierEmailFromSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();

  const handleAccessGranted = (tenderId: string, supplierEmail: string) => {
    setHasAccessToTender(true);
    setAccessGrantedTenderId(tenderId);
    setSupplierEmailFromSecret(supplierEmail);
  };

  // Fetch public tenders and filter for submission phase
  const { data: publicTenders, isLoading } = useQuery({
    queryKey: ['public-tenders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenders')
        .select(`
          *,
          project:projects(title, description, location)
        `)
        .eq('status', 'published')
        .order('launch_date', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const filtered = (data || []).filter((tender: any) => {
        // Check if tender is in submission phase (phase 2)
        const isPhase2 = Number(tender.current_phase) === 2;
        
        // Check if deadline is in the future
        let hasValidDeadline = false;
        if (tender.deadline_date) {
          const deadline = new Date(tender.deadline_date);
          hasValidDeadline = !isNaN(deadline.getTime()) && deadline >= now;
        }
        
        return isPhase2 && hasValidDeadline;
      });

      return filtered as PublicTender[];
    }
  });

  // Fetch shared documents for selected tender
  const { data: sharedDocuments } = useQuery({
    queryKey: ['shared-documents', selectedTender?.id],
    queryFn: async () => {
      if (!selectedTender?.id) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'tender')
        .eq('is_shared_with_suppliers', true)
        .contains('metadata', { tender_id: selectedTender.id });

      if (error) throw error;
      return (data || []) as SharedDocument[];
    },
    enabled: !!selectedTender?.id
  });

  // Fetch user's bid submission for selected tender
  const { data: userSubmission } = useQuery({
    queryKey: ['user-submission', selectedTender?.id],
    queryFn: async () => {
      if (!selectedTender?.id) return null;
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('tender_id', selectedTender.id)
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTender?.id
  });

  // Submit comprehensive bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTender?.id) throw new Error('Appel d\'offres non sélectionné');
      
      // Validate deadline
      if (selectedTender.deadline_date) {
        const deadline = new Date(selectedTender.deadline_date);
        const now = new Date();
        
        // Check if deadline is a valid date
        if (isNaN(deadline.getTime())) {
          throw new Error('Date limite de soumission invalide');
        }
        
        if (now > deadline) {
          throw new Error('La date limite de soumission est dépassée');
        }
      }
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      // Get user profile for supplier info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.user.id)
        .single();

      // Check if user already has a submission for this tender
      const { data: existingSubmission } = await supabase
        .from('tender_submissions')
        .select('id')
        .eq('tender_id', selectedTender.id)
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (existingSubmission) {
        throw new Error('Vous avez déjà soumissionné pour cet appel d\'offres');
      }

      // Create tender submission record first
      const { data: submission, error: submissionError } = await supabase
        .from('tender_submissions')
        .insert({
          tender_id: selectedTender.id,
          user_id: user.user.id,
          supplier_name: profile?.full_name || 'Fournisseur',
          supplier_email: user.user.email || '',
          submission_date: new Date().toISOString(),
          status: 'submitted'
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Upload files and create document records
      const uploadedDocs: {[key: string]: string[]} = {
        administrative: [],
        technical: [],
        financial: []
      };

      console.log("All selectedFiles:", selectedFiles);
      console.log("Files to process:", Object.entries(selectedFiles));

      try {
        for (const [docKey, file] of Object.entries(selectedFiles)) {
          console.log("Processing document:", docKey, "File:", file.name);
          const [category] = docKey.split('-');
          console.log("Extracted category:", category);
          const subcategory = docKey.split('-').slice(1).join('-');
          console.log("Extracted subcategory:", subcategory);
          
          const uploadResult = await uploadFile(
            file, 
            `tender-submissions/${selectedTender.id}/${user.user.id}/${category}/${file.name}`
          );
          console.log("Upload result:", uploadResult);

          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || 'Échec du téléchargement du fichier');
          }

          // Create document record
          const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
              title: file.name,
              description: `${subcategory} - ${categoryLabel}`,
              file_url: uploadResult.url,
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
              document_type: 'supplier_upload',
              uploaded_by: user.user.id,
              metadata: {
                tender_id: selectedTender.id,
                submission_id: submission.id,
                category: category,
                subcategory: subcategory,
                document_key: docKey
              }
            })
            .select()
            .single();

          if (docError) {
            console.error('Error creating document record:', docError);
            throw new Error(`Erreur lors de la création du document: ${docError.message}`);
          }

          if (!document) {
            throw new Error('Aucun document créé');
          }

          // Link document to submission
          const { error: linkError } = await supabase
            .from('tender_submission_documents')
            .insert({
              submission_id: submission.id,
              document_id: document.id,
              category: category as 'administrative' | 'technical' | 'financial',
              subcategory: subcategory
            });

          if (linkError) {
            console.error('Error linking document to submission:', linkError);
            throw new Error(`Erreur lors de la liaison du document: ${linkError.message}`);
          }

          uploadedDocs[category as keyof typeof uploadedDocs].push(document.id);
        }

        // Generate secret code for evaluation commission access
        try {
          const expiresAt = SubmissionSecretService.getDefaultExpirationDate(30); // 30 days validity
          await SubmissionSecretService.createSubmissionSecret({
            submission_id: submission.id,
            expires_at: expiresAt,
            max_access: 50, // Allow up to 50 accesses for evaluation
            evaluation_phase: 'evaluation',
            evaluation_stage: 'initial'
          });
        } catch (secretError) {
          console.error('Error generating secret code:', secretError);
          // Don't fail the submission if secret generation fails
        }

        return submission;
      } catch (uploadError) {
        // Rollback: delete the submission if file upload fails
        console.error('Upload error, rolling back submission:', uploadError);
        await supabase
          .from('tender_submissions')
          .delete()
          .eq('id', submission.id);
        
        throw uploadError;
      }
    },
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: ['user-submission'] });
      setSelectedFiles({});
      setSubmissionData({ notes: '' });
      toast({
        title: 'Soumission envoyée',
        description: 'Votre dossier de candidature a été soumis avec succès.',
      });
    },
    onError: (error) => {
      console.error('Submit bid error:', error);
      let message = 'Erreur lors de la soumission du dossier.';
      if (
        error instanceof Error &&
        (error.message.includes('already exists') ||
         error.message.includes('duplicate') ||
         error.message.includes('unique constraint'))
      ) {
        message = 'Vous avez déjà soumis un dossier pour cet appel d\'offres.';
      }
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = (category: keyof typeof DOCUMENT_CATEGORIES, documentType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const key = `${category}-${documentType}`;
        setSelectedFiles(prev => ({ ...prev, [key]: file }));
      }
    };
    input.click();
  };

  const removeFile = (key: string) => {
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
  };

  const canSubmitBid = () => {
    // Check if deadline has passed
    if (selectedTender?.deadline_date) {
      const deadline = new Date(selectedTender.deadline_date);
      const now = new Date();
      if (now > deadline) return false;
    }

    // Check if tender is in submission phase (phase 2)
    return selectedTender?.current_phase === 2;
  };

  const isSubmissionComplete = () => {
    const adminFiles = Object.keys(selectedFiles).filter(key => key.startsWith('administrative')).length;
    const techFiles = Object.keys(selectedFiles).filter(key => key.startsWith('technical')).length;
    const finFiles = Object.keys(selectedFiles).filter(key => key.startsWith('financial')).length;
    
    return adminFiles >= 2 && techFiles >= 2 && finFiles >= 2; // Minimum requirements
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SupplierTenderAccessGuard onAccessGranted={handleAccessGranted}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Portail Fournisseurs - Appels d'Offres</h1>
            <p className="text-muted-foreground mt-2">
              Consultez et soumissionnez aux appels d'offres publics
            </p>
            {hasAccessToTender && supplierEmailFromSecret && (
              <Badge variant="outline" className="mt-2">
                Accès autorisé pour: {supplierEmailFromSecret}
              </Badge>
            )}
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Parcourir</TabsTrigger>
          <TabsTrigger value="documents">Documents Partagés</TabsTrigger>
          <TabsTrigger value="submit">Soumissionner</TabsTrigger>
          <TabsTrigger value="estimate">Devis</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {publicTenders && publicTenders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTenders.map((tender) => (
                <Card key={tender.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{tender.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{tender.description}</p>
                      </div>
                      
                      {tender.project && (
                        <div className="bg-muted/50 p-3 rounded">
                          <p className="text-sm font-medium">Projet: {tender.project.title}</p>
                          {tender.project.location && (
                            <p className="text-xs text-muted-foreground">Lieu: {tender.project.location}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="default">
                          Appel de soumissions
                        </Badge>
                        <Button 
                          onClick={() => {
                            setSelectedTender(tender);
                            setActiveTab('submit');
                          }}
                          size="sm"
                        >
                          Soumissionner
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {tender.launch_date && (
                          <p>Lancé le {new Date(tender.launch_date).toLocaleDateString()}</p>
                        )}
                        {tender.deadline_date && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Limite: {new Date(tender.deadline_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun appel d'offres disponible</h3>
                <p className="text-muted-foreground mb-4">
                  Les appels d'offres sont affichés uniquement s'ils répondent aux critères suivants :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• Statut : Publié</li>
                  <li>• Phase : Phase 2 (Appel de soumissions)</li>
                  <li>• Date limite : Dans le futur</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {selectedTender ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Documents partagés - {selectedTender.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Documents mis à disposition par l'organisme pour cette phase
                  </p>
                  
                  {sharedDocuments && sharedDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sharedDocuments.map((doc) => (
                        <Card key={doc.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{doc.title}</h4>
                              <p className="text-sm text-muted-foreground">{doc.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Partagé le {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(doc.file_url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Télécharger
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun document partagé pour le moment
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un appel d'offres</h3>
                <p className="text-muted-foreground mb-4">
                  Choisissez un appel d'offres pour voir les documents partagés.
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  Parcourir les appels d'offres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          {selectedTender ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Soumission - {selectedTender.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded">
                      {canSubmitBid() ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm">Phase de soumission active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm">Phase de soumission fermée</span>
                        </>
                      )}
                      {selectedTender.deadline_date && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Limite: {new Date(selectedTender.deadline_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {userSubmission ? (
                      <>
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-3">
                          <div>
                            <h4 className="font-medium text-green-800 mb-1">Soumission envoyée avec succès</h4>
                            <p className="text-sm text-green-600">
                              Votre dossier de candidature a été soumis le{' '}
                              {new Date(userSubmission.submission_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Statut: {userSubmission.status === 'submitted' ? 'En cours d\'évaluation' : userSubmission.status}
                            </p>
                          </div>
                        </div>
                        
                        {/* Display Secret Code for Evaluation Commission */}
                        <SubmissionSecretDisplay submissionId={userSubmission.id} />
                      </>
                    ) : canSubmitBid() && (
                      <div className="space-y-6">
                        {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, categoryLabel]) => (
                          <Card key={categoryKey}>
                            <CardHeader>
                              <CardTitle className="text-lg">{categoryLabel}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {REQUIRED_DOCUMENTS[categoryKey as keyof typeof REQUIRED_DOCUMENTS].map((docType) => {
                                  const key = `${categoryKey}-${docType}`;
                                  const file = selectedFiles[key];
                                  
                                  return (
                                    <div key={docType} className="flex items-center justify-between p-3 border rounded">
                                      <div>
                                        <p className="font-medium text-sm">{docType}</p>
                                        {file && (
                                          <p className="text-xs text-muted-foreground">{file.name}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        {file ? (
                                          <>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => removeFile(key)}
                                            >
                                              Remplacer
                                            </Button>
                                          </>
                                        ) : (
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleFileSelect(categoryKey as keyof typeof DOCUMENT_CATEGORIES, docType)}
                                          >
                                            <Upload className="h-4 w-4 mr-1" />
                                            Choisir
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        <Card>
                          <CardContent className="p-6">
                            <Label htmlFor="notes">Notes supplémentaires (optionnel)</Label>
                            <Textarea
                              id="notes"
                              value={submissionData.notes}
                              onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Ajoutez des informations complémentaires..."
                              rows={3}
                              className="mt-2"
                            />
                          </CardContent>
                        </Card>

                        <div className="flex justify-end gap-4">
                          <div className="text-sm text-muted-foreground">
                            Fichiers sélectionnés: {Object.keys(selectedFiles).length}
                            {isSubmissionComplete() && (
                              <span className="text-green-600 ml-2">✓ Dossier complet</span>
                            )}
                          </div>
                          <Button
                            onClick={() => submitBidMutation.mutate()}
                            disabled={!isSubmissionComplete() || submitBidMutation.isPending || uploading}
                            size="lg"
                          >
                            {submitBidMutation.isPending || uploading ? (
                              'Soumission en cours...'
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Soumettre le dossier
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un appel d'offres</h3>
                <p className="text-muted-foreground mb-4">
                  Choisissez un appel d'offres pour préparer votre dossier de candidature.
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  Parcourir les appels d'offres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="estimate" className="space-y-6">
          {selectedTender ? (
            <TenderQuantitativeEstimate 
              tenderId={selectedTender.id}
              projectId={selectedTender.project_id}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un appel d'offres</h3>
                <p className="text-muted-foreground mb-4">
                  Choisissez un appel d'offres pour créer votre devis quantitatif estimatif.
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  Parcourir les appels d'offres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </SupplierTenderAccessGuard>
  );
};

export default EnhancedSupplierTenderPortal;