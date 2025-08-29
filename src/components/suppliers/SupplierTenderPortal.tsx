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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Send, 
  Download,
  Calculator,
  Eye 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import TenderQuantitativeEstimate from '@/components/tenders/TenderQuantitativeEstimate';
import { 
  TenderDocumentCategory, 
  TenderDocumentSubcategory, 
  TENDER_DOCUMENT_LABELS, 
  TENDER_CATEGORY_LABELS 
} from '@/types/tender';

interface PublicTender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  current_phase: number;
  created_at: string;
  updated_at: string;
  project?: {
    title: string;
    description?: string;
    location?: string;
  };
}

interface TenderDocumentRequirement {
  id: string;
  tender_id: string;
  category: TenderDocumentCategory;
  subcategory: TenderDocumentSubcategory;
  is_required: boolean;
  description?: string;
}

interface SupplierSubmission {
  id: string;
  tender_id: string;
  supplier_id: string;
  document_id: string;
  submission_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_revision';
  reviewer_notes?: string;
  document?: {
    id: string;
    title: string;
    file_url?: string;
    file_name?: string;
  };
  tender_document?: {
    category: string;
    subcategory: string;
    is_required: boolean;
  };
}

const SupplierTenderPortal = () => {
  const [selectedTender, setSelectedTender] = useState<PublicTender | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<TenderDocumentRequirement | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: ''
  });
  const [activeTab, setActiveTab] = useState('browse');
  const [supplierProfile, setSupplierProfile] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();

  // Get current user and supplier profile
  useEffect(() => {
    const getCurrentSupplier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setSupplierProfile(supplier);
      }
    };
    getCurrentSupplier();
  }, []);

  // Fetch public tenders in phase 2 (call for submissions)
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
        .eq('current_phase', 2)
        .order('launch_date', { ascending: false });

      if (error) throw error;
      return (data || []) as PublicTender[];
    }
  });

  // Fetch tender document requirements
  const { data: documentRequirements } = useQuery({
    queryKey: ['tender-requirements', selectedTender?.id],
    queryFn: async () => {
      if (!selectedTender?.id) return [];
      
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('tender_id', selectedTender.id)
        .eq('is_required', true);

      if (error) throw error;
      return (data || []) as TenderDocumentRequirement[];
    },
    enabled: !!selectedTender?.id
  });

  // Fetch supplier submissions for selected tender
  const { data: supplierSubmissions } = useQuery({
    queryKey: ['supplier-submissions', selectedTender?.id, supplierProfile?.id],
    queryFn: async () => {
      if (!selectedTender?.id || !supplierProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('tender_document_submissions')
        .select(`
          *,
          document:documents(id, title, file_url, file_name),
          tender_document:tender_documents(category, subcategory, is_required)
        `)
        .eq('tender_id', selectedTender.id)
        .eq('supplier_id', supplierProfile.id);

      if (error) throw error;
      return (data || []) as SupplierSubmission[];
    },
    enabled: !!selectedTender?.id && !!supplierProfile?.id
  });

  // Submit document mutation
  const submitDocumentMutation = useMutation({
    mutationFn: async ({
      file,
      formData,
      requirement
    }: {
      file: File;
      formData: typeof uploadFormData;
      requirement: TenderDocumentRequirement;
    }) => {
      if (!supplierProfile?.id) throw new Error('Profil fournisseur non trouvé');

      // Upload file
      const uploadResult = await uploadFile(file, `tender-submissions/${selectedTender?.id}/${supplierProfile.id}`);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Échec du téléchargement');
      }

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert([{
          title: formData.title,
          description: formData.description,
          file_url: uploadResult.url,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          document_type: 'tender_submission',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'pending'
        }])
        .select()
        .single();

      if (docError) throw docError;

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('tender_document_submissions')
        .insert([{
          tender_id: selectedTender?.id,
          supplier_id: supplierProfile.id,
          document_id: document.id,
          submission_date: new Date().toISOString(),
          status: 'pending'
        }])
        .select()
        .single();

      if (submissionError) throw submissionError;

      return { document, submission };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-submissions'] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadFormData({ title: '', description: '' });
      setSelectedDocument(null);
      toast({
        title: 'Document soumis',
        description: 'Votre document a été soumis avec succès.',
      });
    },
    onError: (error) => {
      console.error('Submit document error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la soumission du document.',
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadFormData.title) {
        setUploadFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleSubmitDocument = () => {
    if (!selectedFile || !selectedDocument || !uploadFormData.title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis.',
        variant: 'destructive',
      });
      return;
    }

    submitDocumentMutation.mutate({
      file: selectedFile,
      formData: uploadFormData,
      requirement: selectedDocument
    });
  };

  const openUploadDialog = (requirement: TenderDocumentRequirement) => {
    setSelectedDocument(requirement);
    setIsUploadDialogOpen(true);
  };

  const getSubmissionStatus = (requirement: TenderDocumentRequirement) => {
    return supplierSubmissions?.find(
      sub => sub.tender_document?.category === requirement.category && 
             sub.tender_document?.subcategory === requirement.subcategory
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'requires_revision':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'requires_revision':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Portail des Appels d'Offres</h1>
          <p className="text-gray-600 mt-2">
            Soumissionnez aux appels d'offres publics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Parcourir les AO</TabsTrigger>
          <TabsTrigger value="documents">Mes Documents</TabsTrigger>
          <TabsTrigger value="estimate">Devis Quantitatif</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTenders?.map((tender) => (
              <Card key={tender.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{tender.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{tender.description}</p>
                    </div>
                    
                    {tender.project && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm font-medium">Projet: {tender.project.title}</p>
                        {tender.project.location && (
                          <p className="text-xs text-gray-600">Lieu: {tender.project.location}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800">
                        Phase 2 - Appel de soumissions
                      </Badge>
                      <Button 
                        onClick={() => {
                          setSelectedTender(tender);
                          setActiveTab('documents');
                        }}
                        size="sm"
                      >
                        Soumissionner
                      </Button>
                    </div>
                    
                    {tender.launch_date && (
                      <p className="text-xs text-gray-500">
                        Lancé le {new Date(tender.launch_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {selectedTender ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents requis - {selectedTender.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{selectedTender.description}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documentRequirements?.map((requirement) => {
                  const submission = getSubmissionStatus(requirement);
                  
                  return (
                    <Card key={requirement.id}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">
                                {TENDER_DOCUMENT_LABELS[requirement.subcategory]}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {TENDER_CATEGORY_LABELS[requirement.category]}
                              </p>
                              {requirement.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {requirement.description}
                                </p>
                              )}
                            </div>
                            {requirement.is_required && (
                              <Badge variant="outline" className="text-red-600">
                                Obligatoire
                              </Badge>
                            )}
                          </div>

                          {submission ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(submission.status)}
                                <Badge className={getStatusColor(submission.status)}>
                                  {submission.status === 'pending' ? 'En attente' :
                                   submission.status === 'approved' ? 'Approuvé' :
                                   submission.status === 'rejected' ? 'Rejeté' : 'Révision requise'}
                                </Badge>
                              </div>
                              
                              <p className="text-sm font-medium">{submission.document?.title}</p>
                              
                              {submission.reviewer_notes && (
                                <div className="bg-gray-50 p-2 rounded text-sm">
                                  <p className="font-medium">Notes:</p>
                                  <p>{submission.reviewer_notes}</p>
                                </div>
                              )}
                              
                              <div className="flex gap-2">
                                {submission.document?.file_url && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(submission.document?.file_url, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Voir
                                  </Button>
                                )}
                                {submission.status === 'requires_revision' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openUploadDialog(requirement)}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Réviser
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => openUploadDialog(requirement)}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Télécharger le document
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un appel d'offres</h3>
                <p className="text-gray-600 mb-4">
                  Choisissez un appel d'offres pour voir les documents requis.
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
                <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un appel d'offres</h3>
                <p className="text-gray-600 mb-4">
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

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Télécharger un document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDocument && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium text-sm">
                  {TENDER_DOCUMENT_LABELS[selectedDocument.subcategory]}
                </p>
                <p className="text-xs text-gray-600">
                  {TENDER_CATEGORY_LABELS[selectedDocument.category]}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>

            <div>
              <Label htmlFor="title">Titre du document</Label>
              <Input
                id="title"
                value={uploadFormData.title}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du document"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du document"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsUploadDialogOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSubmitDocument}
                disabled={uploading || submitDocumentMutation.isPending}
                className="flex-1"
              >
                {uploading || submitDocumentMutation.isPending ? (
                  'Téléchargement...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Soumettre
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierTenderPortal;