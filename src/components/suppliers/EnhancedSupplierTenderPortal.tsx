import { SubmissionProgressTracker, SubmissionStep } from '@/components/suppliers/SubmissionProgressTracker';
import { useDocumentViewer } from "@/components/documents/viewer";
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
import { TenderService, getTenderService} from '@/application/services/TenderService';
import { TenderSubmissionService, UploadedDocument } from '@/application/services/TenderSubmissionService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Send,
  Share2,
  Upload,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDocumentService } from '@/application/services/DocumentService';
import { getUserService } from '@/application/services/UserService';
import { T } from '@/components/i18n/T';
import { computeTenderSubmissionWindow } from '@/domain/services/tenderSubmissionWindow';

import { SupplierSubmissionWizard } from '@/components/suppliers/SupplierSubmissionWizard';
import {
  SupplierTenderDetailHeader,
  SupplierTenderList,
  type SupplierTenderViewModel,
} from '@/components/suppliers/SupplierTenderExperience';



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
              <Upload className="h-4 w-4" /> <T k="auto.enhancedsuppliertenderportal.importer_chiffrage" fallback="Importer chiffrage" />
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
  const { openDocument } = useDocumentViewer();
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
  const { getUser, isAuthenticated } = useAuth();
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
      const service = getTenderService();
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
      
      const docs = await getDocumentService().getSharedTenderDocuments(selectedTender.id);
      return docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        file_url: doc.fileUrl || '',
        file_name: doc.fileName || doc.title,
        description: doc.description || undefined,
        created_at: doc.createdAt,
        metadata: (doc.metadata || undefined) as SharedDocument['metadata'],
      }));
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

      // Get user profile for supplier info (via service, jamais Supabase depuis l'UI)
      const profileUser = await getUserService().getUserById(user.id);
      const profile = profileUser ? { full_name: profileUser.fullName } : null;

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

  /** Dépôt groupé : les fichiers sont indexés par catégorie + nom de fichier normalisé. */
  const handleAddFiles = (category: keyof typeof DOCUMENT_CATEGORIES, files: File[]) => {
    setSelectedFiles(prev => {
      const next = { ...prev };
      files.forEach((file) => {
        const slug = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
        next[`${category}-${slug}`] = file;
      });
      return next;
    });
  };


  const removeFile = (key: string) => {
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
  };

  // Fenêtre de soumission calculée par le domaine (date limite = source de vérité)
  const submissionWindow = computeTenderSubmissionWindow({
    status: selectedTender?.status,
    currentPhase: selectedTender?.current_phase,
    deadlineDate: selectedTender?.deadline_date,
    launchDate: selectedTender?.launch_date,
    grantedBySecret: !!accessGrantedTenderId && accessGrantedTenderId === selectedTender?.id,
  });

  const canSubmitBid = () => submissionWindow.canSubmit;


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

  const tenderViewModels: SupplierTenderViewModel[] = (publicTenders ?? []).map((tender) => ({
    id: tender.id,
    title: tender.title,
    description: tender.description,
    projectReference: tender.project_reference,
    deadlineDate: tender.deadline_date,
    launchDate: tender.launch_date,
    status: tender.status,
    currentPhase: tender.current_phase,
    projectTitle: tender.project?.title,
    location: tender.project?.location,
  }));

  const selectedTenderViewModel: SupplierTenderViewModel | null = selectedTender ? {
    id: selectedTender.id,
    title: selectedTender.title,
    description: selectedTender.description,
    projectReference: selectedTender.project_reference,
    deadlineDate: selectedTender.deadline_date,
    launchDate: selectedTender.launch_date,
    status: selectedTender.status,
    currentPhase: selectedTender.current_phase,
    projectTitle: selectedTender.project?.title,
    location: selectedTender.project?.location,
  } : null;


  const selectTender = (tenderId: string) => {
    const tender = publicTenders?.find((item) => item.id === tenderId) ?? null;
    if (!tender) return;
    setSelectedTender(tender);
    setActiveTab('submit');
  };

  const createQuote = (tenderId: string) => {
    window.dispatchEvent(new CustomEvent('boq-create-quote', { detail: { tenderId } }));
  };

  const openDao = () => {
    const document = sharedDocuments?.[0];
    if (!document) return;
    openDocument(document, { proxy: true, allowStatusChange: false });
  };

  return (
    <SupplierTenderAccessGuard onAccessGranted={handleAccessGranted}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">{t('supplier_tender.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('supplier_tender.subtitle')}</p>
            {hasAccessToTender && supplierEmailFromSecret && (
              <Badge variant="outline" className="mt-2">
                {t('supplier_tender.access_granted_for')} {supplierEmailFromSecret}
              </Badge>
            )}
          </div>
        </div>

        {selectedTenderViewModel && (
          <SupplierTenderDetailHeader
            tender={selectedTenderViewModel}
            selectedDocuments={Object.keys(selectedFiles).length}
            isComplete={isSubmissionComplete()}
            isSubmitted={Boolean(userSubmission)}
            canSubmit={canSubmitBid()}
            hasDao={Boolean(sharedDocuments?.length)}
            onBack={() => {
              setSelectedTender(null);
              setActiveTab('browse');
            }}
            onOpenDao={openDao}
            onOpenSubmission={() => setActiveTab('submit')}
          />
        )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-3 sm:max-w-xl">
          <TabsTrigger value="browse">{t('supplier_tender.tabs.browse')}</TabsTrigger>
          <TabsTrigger value="documents">{t('supplier_tender.tabs.documents')}</TabsTrigger>
          <TabsTrigger value="submit">{t('supplier_tender.tabs.submit')}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {tenderViewModels.length > 0 ? (
            <SupplierTenderList
              tenders={tenderViewModels}
              onSelect={selectTender}
              onCreateQuote={createQuote}
              onSubmit={selectTender}
            />

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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDocument(doc, { proxy: true, allowStatusChange: false })}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                <T k="auto.enhancedsuppliertenderportal.voir" fallback="Voir" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDocument(doc, { proxy: true, allowStatusChange: false })}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                {t('supplier_tender.actions.download')}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      <T k="auto.enhancedsuppliertenderportal.aucun_document_partage_pour_le_moment" fallback="Aucun document partagé pour le moment" />
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2"><T k="auto.enhancedsuppliertenderportal.selectionnez_un_appel_d_offres" fallback="Sélectionnez un appel d'offres" /></h3>
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
                    <div className="flex flex-wrap items-center gap-2 rounded border bg-muted/40 p-3">
                      {submissionWindow.canSubmit ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="text-sm font-medium">
                            {submissionWindow.deadline
                              ? `La soumission est ouverte jusqu'au ${submissionWindow.deadline.toLocaleDateString('fr-FR')}.`
                              : 'La soumission est ouverte.'}
                          </span>
                          {submissionWindow.daysRemaining !== null && (
                            <Badge className="bg-success text-success-foreground">
                              {submissionWindow.daysRemaining} jours restants
                            </Badge>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {submissionWindow.reason === 'deadline_passed'
                              ? 'Date limite dépassée'
                              : submissionWindow.reason === 'cancelled'
                                ? 'Appel d\u2019offres clôturé / annulé'
                                : 'Soumission non encore ouverte'}
                            {submissionWindow.deadline
                              ? ` — limite : ${submissionWindow.deadline.toLocaleDateString('fr-FR')}`
                              : ''}
                          </span>
                        </>
                      )}
                    </div>


                    {userSubmission ? (
                      <>
                        <div className="bg-success-soft border border-success/30 p-4 rounded-lg space-y-3">
                          <div>
                            <h4 className="font-medium text-success mb-1"><T k="auto.enhancedsuppliertenderportal.soumission_envoyee_avec_succes" fallback="Soumission envoyée avec succès" /></h4>
                            <p className="text-sm text-success">
                              Votre dossier de candidature a été soumis le{' '}
                              {new Date(userSubmission.submission_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-success mt-1">
                              Statut: {userSubmission.status === 'submitted' ? 'En cours d\'évaluation' : userSubmission.status}
                            </p>
                          </div>
                        </div>
                        
                        {/* Display Secret Code for Evaluation Commission */}
                        <SubmissionSecretDisplay submissionId={userSubmission.id} />
                      </>
                    ) : (
                      <SupplierSubmissionWizard
                        files={selectedFiles}
                        notes={submissionData.notes}
                        isPending={submitBidMutation.isPending || uploading}
                        isComplete={isSubmissionComplete()}
                        canSubmit={canSubmitBid()}
                        blockedReason={
                          canSubmitBid()
                            ? undefined
                            : t('supplier_experience.status_closed', undefined, 'Soumission fermée')
                        }

                        onAddFiles={handleAddFiles}
                        onRemoveFile={removeFile}
                        onNotesChange={(notes) => setSubmissionData((prev) => ({ ...prev, notes }))}
                        onSubmit={() => submitBidMutation.mutate()}
                      >
                        {submissionStep !== 'idle' && (
                          <SubmissionProgressTracker
                            currentStep={submissionStep}
                            totalDocuments={uploadProgress.total}
                            uploadedDocuments={uploadProgress.current}
                            error={submissionError}
                          />
                        )}
                      </SupplierSubmissionWizard>
                    )}

                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2"><T k="auto.enhancedsuppliertenderportal.selectionnez_un_appel_d_offres" fallback="Sélectionnez un appel d'offres" /></h3>
                <p className="text-muted-foreground mb-4">
                  <T k="auto.enhancedsuppliertenderportal.choisissez_un_appel_d_offres_pour_preparer_votre" fallback="Choisissez un appel d'offres pour préparer votre dossier de candidature." />
                </p>
                <Button onClick={() => setActiveTab('browse')}>
                  <T k="auto.enhancedsuppliertenderportal.parcourir_les_appels_d_offres" fallback="Parcourir les appels d'offres" />
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