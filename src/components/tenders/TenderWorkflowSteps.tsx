import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Upload, Eye, CheckCircle, Clock, AlertTriangle, Workflow } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { DEV_MODE } from '@/config/constants';
import WorkflowStepSelector from './WorkflowStepSelector';
import StandardWorkflowDocumentSuggestions from './StandardWorkflowDocumentSuggestions';
import { OFFICIAL_WORKFLOW_STEPS, getStepIcon, getStepColor, OfficialWorkflowStep } from './OfficialWorkflowSteps';
import { 
  PROCUREMENT_PHASES, 
  PROCUREMENT_STAGES, 
  PROCUREMENT_PHASE_LABELS,
  ProcurementPhase,
  ProcurementStage 
} from './PublicProcurementWorkflow';
import { 
  TenderDocumentCategory, 
  TenderDocumentSubcategory, 
  TENDER_DOCUMENT_LABELS, 
  TENDER_CATEGORY_LABELS,
  ADMINISTRATIVE_SUBCATEGORY_GROUPS 
} from '@/types/tender';

interface TenderStep {
  id: string;
  tender_id: string;
  step_number: number;
  title: string;
  description?: string;
  required_documents: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  due_date?: string;
  procurement_phase?: ProcurementPhase;
  procurement_stage?: string;
  created_at: string;
  updated_at: string;
}

interface StepDocument {
  id: string;
  step_id: string;
  document_id: string;
  document_type: string;
  is_required: boolean;
  submitted_at?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  reviewer_notes?: string;
  created_at: string;
  document?: {
    id: string;
    title: string;
    description?: string;
    file_url?: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
}

interface TenderWorkflowStepsProps {
  tenderId: string;
  readonly?: boolean;
  projectId?: string;
}

const TenderWorkflowSteps = ({ tenderId, projectId,readonly = false }: TenderWorkflowStepsProps) => {
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [isOfficialWorkflowDialogOpen, setIsOfficialWorkflowDialogOpen] = useState(false);
  const [isProcurementWorkflowDialogOpen, setIsProcurementWorkflowDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedStepForSuggestions, setSelectedStepForSuggestions] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stepFormData, setStepFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    procurement_phase: '' as ProcurementPhase | '',
    procurement_stage: ''
  });
  const [documentFormData, setDocumentFormData] = useState({
    category: 'administrative' as TenderDocumentCategory,
    subcategory: 'lettre_soumission' as TenderDocumentSubcategory,
    title: '',
    description: '',
    is_required: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();

  // Fetch tender steps
  const { data: tenderSteps, isLoading: stepsLoading } = useQuery({
    queryKey: ['tender-steps', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_steps')
        .select('*')
        .eq('tender_id', tenderId)
        .order('step_number', { ascending: true });

      if (error) throw error;
      return (data || []) as TenderStep[];
    },
    enabled: !!tenderId
  });

  // Fetch step documents with tender document integration
  const { data: stepDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['step-documents', tenderId],
    queryFn: async () => {
      if (!tenderSteps?.length) return [];
      
      const stepIds = tenderSteps.map(step => step.id);
      const { data, error } = await supabase
        .from('tender_step_documents')
        .select(`
          *,
          document:documents(
            id,
            title,
            description,
            file_url,
            file_name,
            mime_type,
            file_size
          )
        `)
        .in('step_id', stepIds);

      if (error) throw error;
      return (data || []) as StepDocument[];
    },
    enabled: !!tenderSteps?.length
  });

  // Add official workflow step
  const addOfficialStepMutation = useMutation({
    mutationFn: async (officialStep: OfficialWorkflowStep) => {
      const existingSteps = tenderSteps || [];
      const nextStepNumber = existingSteps.length > 0 
        ? Math.max(...existingSteps.map(s => s.step_number)) + 1 
        : 1;
      
      const { data, error } = await supabase
        .from('tender_steps')
        .insert([{
          tender_id: tenderId,
          title: officialStep.title,
          description: officialStep.description,
          step_number: nextStepNumber,
          required_documents: officialStep.requiredDocuments || [],
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-steps', tenderId] });
      toast({
        title: 'Étape officielle ajoutée',
        description: 'L\'étape du workflow officiel a été ajoutée avec succès.',
      });
      setIsOfficialWorkflowDialogOpen(false);
    },
    onError: (error) => {
      console.error('Add official step error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout de l\'étape officielle.',
        variant: 'destructive',
      });
    },
  });

  // Add procurement workflow step
  const addProcurementStepMutation = useMutation({
    mutationFn: async ({ phase, stage }: { phase: ProcurementPhase; stage: { value: ProcurementStage; label: string } }) => {
      const existingSteps = tenderSteps || [];
      const nextStepNumber = existingSteps.length > 0 
        ? Math.max(...existingSteps.map(s => s.step_number)) + 1 
        : 1;
      
      const { data, error } = await supabase
        .from('tender_steps')
        .insert([{
          tender_id: tenderId,
          title: stage.label,
          description: `Phase: ${PROCUREMENT_PHASE_LABELS[phase]} - ${stage.label}`,
          step_number: nextStepNumber,
          required_documents: [],
          procurement_phase: phase,
          procurement_stage: stage.value,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-steps', tenderId] });
      toast({
        title: 'Étape de marché public ajoutée',
        description: 'L\'étape du workflow de marché public a été ajoutée avec succès.',
      });
      setIsProcurementWorkflowDialogOpen(false);
    },
    onError: (error) => {
      console.error('Add procurement step error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout de l\'étape de marché public.',
        variant: 'destructive',
      });
    },
  });

  // Add new step mutation - Fixed to calculate next step number properly
  const addStepMutation = useMutation({
    mutationFn: async (stepData: typeof stepFormData) => {
      if (!stepData.title.trim()) {
        throw new Error('Le titre de l\'étape est requis');
      }

      const existingSteps = tenderSteps || [];
      const nextStepNumber = existingSteps.length > 0 
        ? Math.max(...existingSteps.map(s => s.step_number)) + 1 
        : 1;
      
      const { data, error } = await supabase
        .from('tender_steps')
        .insert([{
          tender_id: tenderId,
          title: stepData.title.trim(),
          description: stepData.description?.trim() || null,
          step_number: nextStepNumber,
          due_date: stepData.due_date || null,
          procurement_phase: stepData.procurement_phase || null,
          procurement_stage: stepData.procurement_stage || null,
          required_documents: [],
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-steps', tenderId] });
      toast({
        title: 'Étape ajoutée',
        description: 'La nouvelle étape a été ajoutée avec succès.',
      });
      setIsAddStepDialogOpen(false);
      setStepFormData({ title: '', description: '', due_date: '', procurement_phase: '', procurement_stage: '' });
    },
    onError: (error) => {
      console.error('Add step error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'ajout de l\'étape.',
        variant: 'destructive',
      });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async ({ file, documentData, stepId }: { file: File; documentData: any; stepId: string }) => {
      console.log('Starting document upload process...');
      
      // Generate unique file path with timestamp to avoid conflicts
      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilePath = `tender-steps/${tenderId}/${stepId}/${timestamp}_${sanitizedFileName}`;
      
      // Upload file with unique path
      const uploadResult = await uploadFile(file, uniqueFilePath);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(`File upload failed: ${uploadResult.error || 'Unknown error'}`);
      }

      console.log('File uploaded successfully:', uploadResult.url);

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert([{
          title: documentData.title,
          description: documentData.description,
          file_url: uploadResult.url,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          document_type: 'tender',
          project_id: projectId,
          status: 'draft'
        }])
        .select()
        .single();

      if (docError) {
        console.error('Document creation error:', docError);
        throw new Error(`Document creation failed: ${docError.message}`);
      }

      console.log('Document created successfully:', document.id);

      // Create tender document record (for integration with Documents d'Appel d'Offres model)
      const { data: tenderDoc, error: tenderDocError } = await supabase
        .from('tender_documents')
        .insert([{
          project_id: projectId,
          tender_id: tenderId,
          document_id: document.id,
          category: documentData.category,
          subcategory: documentData.subcategory,
          is_required: documentData.is_required,
          is_submitted: true,
          submission_date: new Date().toISOString(),
          status: 'pending'
        }])
        .select()
        .single();

      if (tenderDocError) {
        console.error('Tender document creation error:', tenderDocError);
        throw new Error(`Tender document creation failed: ${tenderDocError.message}`);
      }

      console.log('Tender document created successfully:', tenderDoc.id);

      // Create step document record
      const { data: stepDoc, error: stepDocError } = await supabase
        .from('tender_step_documents')
        .insert([{
          step_id: stepId,
          document_id: document.id,
          document_type: `${documentData.category}_${documentData.subcategory}`,
          is_required: documentData.is_required,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (stepDocError) {
        console.error('Step document creation error:', stepDocError);
        throw new Error(`Step document creation failed: ${stepDocError.message}`);
      }

      console.log('Step document created successfully:', stepDoc.id);

      return { document, tenderDoc, stepDoc };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['step-documents', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });
      toast({
        title: 'Document ajouté',
        description: 'Le document d\'appel d\'offres a été ajouté à l\'étape avec succès.',
      });
      setIsAddDocumentDialogOpen(false);
      setSelectedFile(null);
      setSelectedStepId(null);
      setDocumentFormData({ 
        category: 'administrative', 
        subcategory: 'lettre_soumission', 
        title: '', 
        description: '', 
        is_required: true 
      });
    },
    onError: (error) => {
      console.error('Add document error:', error);
      toast({
        title: 'Erreur',
        description: `Erreur lors de l'ajout du document: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentFormData.title) {
        setDocumentFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepFormData.title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre de l\'étape est requis.',
        variant: 'destructive',
      });
      return;
    }
    addStepMutation.mutate(stepFormData);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedStepId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier et une étape.',
        variant: 'destructive',
      });
      return;
    }

    addDocumentMutation.mutate({ 
      file: selectedFile, 
      documentData: documentFormData,
      stepId: selectedStepId
    });
  };

  const openAddDocumentDialog = (stepId: string) => {
    setSelectedStepId(stepId);
    setIsAddDocumentDialogOpen(true);
  };

  const handleSelectOfficialStep = (officialStep: OfficialWorkflowStep) => {
    addOfficialStepMutation.mutate(officialStep);
  };

  const getExistingStepNumbers = () => {
    return tenderSteps?.map(step => step.step_number) || [];
  };

  const getExistingDocuments = () => {
    return stepDocuments?.map(doc => doc.document?.title || doc.document_type).filter(Boolean) || [];
  };

  const handleAddSuggestedDocument = (documentTemplate: string, category: string) => {
    if (!selectedStepForSuggestions) return;
    
    const stepId = tenderSteps?.find(step => step.step_number === selectedStepForSuggestions)?.id;
    if (!stepId) return;

    // Pre-fill the document form with suggested values
    const categoryMap: Record<string, TenderDocumentCategory> = {
      'planning': 'administrative',
      'publicity': 'administrative',
      'analysis': 'technical',
      'attribution': 'financial',
      'control': 'administrative'
    };

    const subcategoryMap: Record<string, TenderDocumentSubcategory> = {
      'APP Template': 'renseignement_soumissionnaire',
      'Initiation Request': 'lettre_soumission',
      'Lettre de soumission': 'lettre_soumission',
      'Pouvoir de signature': 'pouvoir_signature',
      'Acte de groupement': 'acte_groupement',
      'Attestation d\'impôt': 'attestation_impot',
      'Attestation CNSS': 'attestation_cnss',
      'Attestation non faillite': 'attestation_non_faillite',
      'Notification': 'lettre_soumission',
      'Signed Contract': 'lettre_soumission'
    };

    const mappedCategory = categoryMap[category] || 'administrative';
    const mappedSubcategory = subcategoryMap[documentTemplate] || 'lettre_soumission';

    setDocumentFormData({
      category: mappedCategory,
      subcategory: mappedSubcategory,
      title: documentTemplate,
      description: `Document suggéré pour l'étape ${selectedStepForSuggestions}`,
      is_required: true
    });

    setSelectedStepId(stepId);
    setIsAddDocumentDialogOpen(true);
  };

  if (stepsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-terracotta-600" />
              Étapes du Processus d'Appel d'Offres
            </CardTitle>
            {(!readonly || DEV_MODE) && (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsOfficialWorkflowDialogOpen(true)}
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Workflow Officiel
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsProcurementWorkflowDialogOpen(true)}
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Marché Public
                </Button>
                <Button onClick={() => setIsAddStepDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Étape Personnalisée
                </Button>
                {DEV_MODE && (
                  <Badge variant="secondary" className="text-xs">DEV MODE</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenderSteps?.map((step) => {
              const stepDocs = stepDocuments?.filter(doc => doc.step_id === step.id) || [];
              
              return (
                <Card key={step.id} className="border-l-4 border-l-terracotta-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                           <Badge variant="outline" className="text-xs">
                             Étape {step.step_number}
                           </Badge>
                           <Badge className={getStatusColor(step.status)}>
                             <div className="flex items-center gap-1">
                               {getStatusIcon(step.status)}
                               {step.status === 'completed' ? 'Terminée' : 
                                step.status === 'in_progress' ? 'En cours' : 
                                step.status === 'approved' ? 'Approuvée' : 'En attente'}
                             </div>
                           </Badge>
                           {selectedStepForSuggestions === step.step_number && (
                             <Badge variant="secondary" className="text-xs">
                               Suggestions actives
                             </Badge>
                           )}
                         </div>
                        <h3 className="text-lg font-medium text-adrar-800 mb-1">
                          {step.title}
                        </h3>
                        {step.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {step.description}
                          </p>
                        )}
                        {step.due_date && (
                          <p className="text-xs text-gray-500">
                            Échéance: {new Date(step.due_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                        {(!readonly || DEV_MODE) && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={selectedStepForSuggestions === step.step_number ? "default" : "outline"}
                              onClick={() => setSelectedStepForSuggestions(
                                selectedStepForSuggestions === step.step_number ? null : step.step_number
                              )}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {selectedStepForSuggestions === step.step_number ? 'Masquer' : 'Suggérer'} Documents
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAddDocumentDialog(step.id)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Ajouter Document
                            </Button>
                          </div>
                        )}
                    </div>
                  </CardHeader>
                  
                   {(stepDocs.length > 0 || selectedStepForSuggestions === step.step_number) && (
                     <CardContent className="pt-0">
                       {stepDocs.length > 0 && (
                         <div className="mb-4">
                           <h4 className="font-medium text-sm mb-3">Documents existants:</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {stepDocs.map((stepDoc: StepDocument) => (
                               <div key={stepDoc.id} className="border rounded-lg p-3 bg-gray-50">
                                 <div className="flex items-start justify-between mb-2">
                                   <h4 className="font-medium text-sm">
                                     {stepDoc.document?.title || stepDoc.document_type}
                                   </h4>
                                   <div className="flex items-center gap-2">
                                     {stepDoc.is_required && (
                                       <Badge variant="outline" className="text-xs">
                                         Requis
                                       </Badge>
                                     )}
                                     <Badge className={getStatusColor(stepDoc.status)}>
                                       {stepDoc.status === 'approved' ? 'Approuvé' : 
                                        stepDoc.status === 'submitted' ? 'Soumis' : 
                                        stepDoc.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                     </Badge>
                                   </div>
                                 </div>
                                 
                                 {stepDoc.document?.file_name && (
                                   <div className="text-xs text-gray-500 mb-2">
                                     Fichier: {stepDoc.document.file_name}
                                   </div>
                                 )}
                                 
                                 {stepDoc.reviewer_notes && (
                                   <div className="text-xs text-gray-600 mb-2 p-2 bg-white rounded">
                                     <strong>Notes:</strong> {stepDoc.reviewer_notes}
                                   </div>
                                 )}

                                 <div className="flex justify-end">
                                   {stepDoc.document && (
                                     <Button size="sm" variant="ghost">
                                       <Eye className="h-4 w-4 mr-1" />
                                       Voir
                                     </Button>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       {selectedStepForSuggestions === step.step_number && (
                         <div className="border-t pt-4">
                           <StandardWorkflowDocumentSuggestions
                             selectedStepId={step.step_number}
                             onAddDocument={handleAddSuggestedDocument}
                             existingDocuments={getExistingDocuments()}
                           />
                         </div>
                       )}
                     </CardContent>
                   )}
                </Card>
              );
            })}

            {!tenderSteps?.length && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>Aucune étape définie pour cet appel d'offres.</p>
                {!readonly && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button 
                      onClick={() => setIsOfficialWorkflowDialogOpen(true)}
                      variant="outline"
                    >
                      <Workflow className="h-4 w-4 mr-2" />
                      Utiliser le Workflow Officiel
                    </Button>
                    <Button 
                      onClick={() => setIsAddStepDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une Étape Personnalisée
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Official Workflow Selector */}
      <WorkflowStepSelector
        isOpen={isOfficialWorkflowDialogOpen}
        onClose={() => setIsOfficialWorkflowDialogOpen(false)}
        onSelectStep={handleSelectOfficialStep}
        existingStepNumbers={getExistingStepNumbers()}
      />

      {/* Add Custom Step Dialog - Fixed form validation */}
      <Dialog open={isAddStepDialogOpen} onOpenChange={setIsAddStepDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une Étape Personnalisée</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddStep} className="space-y-4">
            <div>
              <Label htmlFor="step-title">Titre <span className="text-red-500">*</span></Label>
              <Input
                id="step-title"
                value={stepFormData.title}
                onChange={(e) => setStepFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de l'étape"
                required
                className={!stepFormData.title.trim() ? 'border-red-300' : ''}
              />
              {!stepFormData.title.trim() && (
                <p className="text-xs text-red-500 mt-1">Le titre est requis</p>
              )}
            </div>

            <div>
              <Label htmlFor="step-description">Description</Label>
              <Textarea
                id="step-description"
                value={stepFormData.description}
                onChange={(e) => setStepFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de l'étape (optionnelle)"
              />
            </div>

            <div>
              <Label htmlFor="step-due-date">Date d'échéance (optionnelle)</Label>
              <Input
                id="step-due-date"
                type="date"
                value={stepFormData.due_date}
                onChange={(e) => setStepFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddStepDialogOpen(false);
                  setStepFormData({ title: '', description: '', due_date: '', procurement_phase: '', procurement_stage: '' });
                }}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={addStepMutation.isPending || !stepFormData.title.trim()}
              >
                {addStepMutation.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un Document d'Appel d'Offres</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddDocument} className="space-y-4">
            <div>
              <Label>Catégorie</Label>
              <Select 
                value={documentFormData.category} 
                onValueChange={(value: TenderDocumentCategory) => {
                  setDocumentFormData(prev => ({ 
                    ...prev, 
                    category: value,
                    subcategory: value === 'administrative' ? 'lettre_soumission' : 
                                value === 'technical' ? 'preuves_capacites_techniques' : 
                                'preuves_capacites_financieres'
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrative">{TENDER_CATEGORY_LABELS.administrative}</SelectItem>
                  <SelectItem value="technical">{TENDER_CATEGORY_LABELS.technical}</SelectItem>
                  <SelectItem value="financial">{TENDER_CATEGORY_LABELS.financial}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sous-catégorie</Label>
              <Select 
                value={documentFormData.subcategory} 
                onValueChange={(value: TenderDocumentSubcategory) => setDocumentFormData(prev => ({ ...prev, subcategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  {documentFormData.category === 'administrative' ? (
                    Object.entries(ADMINISTRATIVE_SUBCATEGORY_GROUPS).map(([groupKey, group]) => (
                      <div key={groupKey}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                          {group.label}
                        </div>
                        {group.subcategories
                          .filter(subcat => Object.keys(TENDER_DOCUMENT_LABELS).includes(subcat))
                          .map((subcat) => (
                            <SelectItem key={subcat} value={subcat as TenderDocumentSubcategory} className="pl-6">
                              {TENDER_DOCUMENT_LABELS[subcat as keyof typeof TENDER_DOCUMENT_LABELS]}
                            </SelectItem>
                          ))}
                      </div>
                    ))
                  ) : (
                    Object.entries(TENDER_DOCUMENT_LABELS)
                      .filter(([key]) => {
                        if (documentFormData.category === 'technical') {
                          return ['preuves_capacites_techniques', 'experience_generale_marche', 'methodologie', 'personnel_cle', 'planning_travaux', 'calendrier_livraison', 'conformite_techniques', 'description_besoin', 'ddqe', 'termes_reference', 'pv_evaluation_technique'].includes(key);
                        } else {
                          return ['preuves_capacites_financieres', 'chiffre_affaires_annuel', 'devis_quantitatif_estimatif', 'garantie_bancaire', 'garantie_soumission', 'source_financement', 'montant_alloue', 'devis_comparatifs', 'factures_commandes', 'montant_marche'].includes(key);
                        }
                      })
                      .map(([key, label]) => (
                        <SelectItem key={key} value={key as TenderDocumentSubcategory}>
                          {label}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Titre</Label>
              <Input
                value={documentFormData.title}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={TENDER_DOCUMENT_LABELS[documentFormData.subcategory]}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={documentFormData.description}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description optionnelle du document"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_required"
                checked={documentFormData.is_required}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, is_required: e.target.checked }))}
              />
              <Label htmlFor="is_required">Document requis pour cette étape</Label>
            </div>

            <div>
              <Label>Fichier</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                required
              />
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Fichier sélectionné: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDocumentDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading || addDocumentMutation.isPending}>
                {uploading || addDocumentMutation.isPending ? 'Téléchargement...' : 'Ajouter Document'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderWorkflowSteps;
