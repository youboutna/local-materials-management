import { SubmissionProgressTracker, SubmissionStep } from '@/components/suppliers/SubmissionProgressTracker';
import { SubmissionSecretDisplay } from '@/components/suppliers/SubmissionSecretDisplay';
import { SupplierTenderAccessGuard } from '@/components/suppliers/SupplierTenderAccessGuard';
import { BoqLineTable, BoqImportDialog, useBoqDocument } from '@/components/boq';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { useAuth } from '@/hooks/hexagonal';
import { TenderService } from '@/application/services/TenderService';
import { TenderSubmissionService, UploadedDocument } from '@/application/services/TenderSubmissionService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Send,
  Share2,
  Upload,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';


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
  administrative: 'administrative',
  technical: 'technical', 
  financial: 'financial'
} as const;

// Use keys for required documents so translations can be applied at render time
const REQUIRED_DOCUMENTS = {
  administrative: [
    'registre_commerce',
    'statuts_societe',
    'declaration_fiscale',
    'certificat_conformite',
    'attestation_assurance'
  ],
  technical: [
    'cv_references',
    'certificats_qualification',
    'plan_realisation',
    'methodologie',
    'planning_previsionnel'
  ],
  financial: [
    'devis_quantitatif',
    'garantie_bancaire',
    'bilan_financier',
    'references_bancaires',
    'caution_soumission'
  ]
};

/**
 * SupplierBidBoq — chiffrage fournisseur via noyau BOQ composable.
 * Remplace le legacy TenderQuantitativeEstimate.
 */
const SupplierBidBoq: React.FC<{ tenderId: string }> = ({ tenderId }) => {
  const bid = useBoqDocument({ source: 'supplier_bid', contextId: tenderId });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <BoqImportDialog
          source="supplier_bid"
          contextId={tenderId}
          title="Importer votre chiffrage"
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" /> Importer chiffrage
            </Button>
          }
          onImported={() => bid.refetch()}
        />
      </div>
      {bid.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <BoqLineTable
          lines={bid.lines}
          emptyLabel="Aucune ligne de chiffrage. Importez votre offre pour démarrer."
        />
      )}
    </div>
  );
};


const EnhancedSupplierTenderPortal = () => {
  const [selectedTender, setSelectedTender] = useState<PublicTender | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: File}>({});
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof DOCUMENT_CATEGORIES | null>(null);
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>('idle');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [submissionError, setSubmissionError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('browse');
  const [hasAccessToTender, setHasAccessToTender] = useState(false);
  const [accessGrantedTenderId, setAccessGrantedTenderId] = useState<string | null>(null);
  const [supplierEmailFromSecret, setSupplierEmailFromSecret] = useState<string | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { uploadFile } = useDocumentStorage();
  const { getUser } = useAuth();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();

  const handleAccessGranted = (tenderId: string, supplierEmail: string) => {
    setHasAccessToTender(true);
    setAccessGrantedTenderId(tenderId);
    setSupplierEmailFromSecret(supplierEmail);
  };

  // Auto-grant when arriving via /supplier-portal?tab=tenders&tenderId=...&secret=...
  useEffect(() => {
    const tid = searchParams.get('tenderId');
    const secret = searchParams.get('secret');
    if (tid && !accessGrantedTenderId) {
      setHasAccessToTender(true);
      setAccessGrantedTenderId(tid);
      if (secret) setSupplierEmailFromSecret(prev => prev ?? '');
    }
  }, [searchParams, accessGrantedTenderId]);


  // Fetch the specific tender granted by the secret code so it can be selected
  // even if it is not listed in the public "browse" query.
  const { data: grantedTender } = useQuery({
    queryKey: ['granted-tender', accessGrantedTenderId],
    queryFn: async () => {
      if (!accessGrantedTenderId) return null;
      const service = new TenderService();
      const t = await service.getTenderById({ id: accessGrantedTenderId });
      if (!t) return null;
      return {
        ...(t as any),
        project_id: (t as any).projectId,
        launch_date: (t as any).launchDate,
        attribution_date: (t as any).attributionDate,
        deadline_date: (t as any).deadlineDate,
        selection_mode: (t as any).selectionMode,
        market_type: (t as any).marketType,
        financing_source: (t as any).financingSource,
        project_reference: (t as any).projectReference,
        current_phase: (t as any).currentPhase,
        created_at: (t as any).createdAt,
        updated_at: (t as any).updatedAt,
      } as unknown as PublicTender;
    },
    enabled: !!accessGrantedTenderId,
  });

  useEffect(() => {
    if (grantedTender && (!selectedTender || selectedTender.id !== grantedTender.id)) {
      setSelectedTender(grantedTender);
      setActiveTab('submit');
    }
  }, [grantedTender]);

  // Fetch public tenders for submission (published, phase 2, valid deadline)
  const { data: publicTenders, isLoading } = useQuery({
    queryKey: ['public-tenders'],
    queryFn: async () => {
      const tenders = await TenderService.getPublishedTendersForSubmission();
      return tenders.map(t => ({
        ...t,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString()
      })) as unknown as PublicTender[];
    }
  });

  // Fetch shared documents for selected tender
  const { data: sharedDocuments } = useQuery({
    queryKey: ['shared-documents', selectedTender?.id],
    queryFn: async () => {
      if (!selectedTender?.id) return [];
      
      // TODO: Create DocumentService to handle this
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
      
      const user = await getUser();
      if (!user?.id) return null;

      return await TenderSubmissionService.getUserSubmission(
        selectedTender.id,
        user.id
      );
    },
    enabled: !!selectedTender?.id
  });

  // Submit comprehensive bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async () => {
      setSubmissionStep('creating');
      setSubmissionError('');
      setUploadProgress({ current: 0, total: 0 });
      
      if (!selectedTender?.id) throw new Error('Appel d\'offres non sélectionné');
      
      // Validate deadline
      if (selectedTender.deadline_date) {
        const deadline = new Date(selectedTender.deadline_date);
        const now = new Date();
        
        if (isNaN(deadline.getTime())) {
          throw new Error(t('supplier_tender.errors.invalid_deadline'));
        }
        
        if (now > deadline) {
          throw new Error(t('supplier_tender.errors.deadline_passed'));
        }
      }
      
      const user = await getUser();
      if (!user?.id) throw new Error('Utilisateur non connecté');

      // Get user profile for supplier info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Prepare documents for upload
      const documents: UploadedDocument[] = Object.entries(selectedFiles).map(([docKey, file]) => {
        const [category, ...subcategoryParts] = docKey.split('-');
        return {
          file,
          category: category as 'administrative' | 'technical' | 'financial',
          subcategory: subcategoryParts.join('-')
        };
      });

      // Create submission with documents and secret using hexagonal service
      return await TenderSubmissionService.createSubmissionWithDocuments(
        {
          tender_id: selectedTender.id,
          user_id: user.id,
          supplier_name: profile?.full_name || 'Fournisseur',
          supplier_email: user.email || '',
          submission_date: new Date().toISOString(),
          status: 'submitted'
        },
        documents,
        uploadFile,
        (step, current, total) => {
          setSubmissionStep(step);
          if (step === 'uploading' && current !== undefined && total !== undefined) {
            setUploadProgress({ current, total });
          }
        }
      );
    },
    onSuccess: (submission) => {
      setSubmissionStep('completed');
      queryClient.invalidateQueries({ queryKey: ['user-submission'] });
      setSelectedFiles({});
      setSubmissionData({ notes: '' });
      
      // Reset progress after a delay
      setTimeout(() => {
        setSubmissionStep('idle');
        setUploadProgress({ current: 0, total: 0 });
      }, 3000);
      
      toast({
        title: t('supplier_tender.submit_success'),
        description: t('supplier_tender.submit_success_desc'),
      });
    },
    onError: (error) => {
      setSubmissionStep('error');
      console.error('Submit bid error:', error);
      
      let message = t('supplier_tender.errors.submit_failed');
      if (
        error instanceof Error &&
        (error.message.includes('already exists') ||
         error.message.includes('duplicate') ||
         error.message.includes('unique constraint'))
      ) {
        message = t('supplier_tender.errors.already_submitted');
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      setSubmissionError(message);
      
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = (category: keyof typeof DOCUMENT_CATEGORIES, documentType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
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
    console.log("electedTender?.current_phase: +", selectedTender?.current_phase);
    console.log("selectedTender?.status: +", selectedTender?.status);
    // Check if tender is in submission phase (phase 2)
    return selectedTender?.current_phase === 2 || selectedTender?.status === 'published';
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
            <h1 className="text-3xl font-bold">{t('supplier_tender.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('supplier_tender.subtitle')}</p>
            {hasAccessToTender && supplierEmailFromSecret && (
              <Badge variant="outline" className="mt-2">
                {t('supplier_tender.access_granted_for')} {supplierEmailFromSecret}
              </Badge>
            )}
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">{t('supplier_tender.tabs.browse')}</TabsTrigger>
          <TabsTrigger value="documents">{t('supplier_tender.tabs.documents')}</TabsTrigger>
          <TabsTrigger value="submit">{t('supplier_tender.tabs.submit')}</TabsTrigger>
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
                          <p className="text-sm font-medium">{t('supplier_tender.project_label')}: {tender.project.title}</p>
                          {tender.project.location && (
                            <p className="text-xs text-muted-foreground">{t('supplier_tender.location_label')}: {tender.project.location}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="default">{t('supplier_tender.title')}</Badge>
                        <Button 
                          onClick={() => {
                            setSelectedTender(tender);
                            setActiveTab('submit');
                          }}
                          size="sm"
                        >
                          {t('supplier_tender.actions.submit')}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {tender.launch_date && (
                          <p>{t('supplier_tender.launched_on')} {new Date(tender.launch_date).toLocaleDateString()}</p>
                        )}
                        {tender.deadline_date && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('supplier_tender.deadline_label')}: {new Date(tender.deadline_date).toLocaleDateString()}
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
                <h3 className="text-lg font-semibold mb-2">{t('supplier_tender.empty.no_tenders')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('supplier_tender.criteria_intro')}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                  <li>• {t('supplier_tender.criteria.status')}</li>
                  <li>• {t('supplier_tender.criteria.phase')}</li>
                  <li>• {t('supplier_tender.criteria.deadline')}</li>
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
                  <p className="text-muted-foreground mb-4">{t('supplier_tender.subtitle')}</p>
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
                              {t('supplier_tender.actions.download')}
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
                  <p className="text-muted-foreground mb-4">{t('supplier_tender.empty.select_tender')}</p>
                <Button onClick={() => setActiveTab('browse')}>
                  {t('supplier_tender.tabs.browse')}
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

                        {/* Submission Progress Tracker */}
                        {submissionStep !== 'idle' && (
                          <SubmissionProgressTracker
                            currentStep={submissionStep}
                            totalDocuments={uploadProgress.total}
                            uploadedDocuments={uploadProgress.current}
                            error={submissionError}
                          />
                        )}

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

        {/* Estimate tab retiré : le devis se crée depuis l'onglet "Devis" du portail (BoqWorkspace unifié). */}
      </Tabs>
    </div>
    </SupplierTenderAccessGuard>
  );
};

export default EnhancedSupplierTenderPortal;