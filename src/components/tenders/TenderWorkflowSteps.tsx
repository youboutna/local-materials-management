import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Plus, Upload, Eye, CheckCircle, Clock, AlertTriangle, Workflow, ChevronDown, ChevronUp, Search, X, Share2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflowSteps } from '@/hooks/useWorkflowSteps';
import { WorkflowStepDTO, DocumentUploadDTO, DocumentShareDTO } from '@/types/workflow-dto';
import { DEV_MODE } from '@/config/constants';
import WorkflowStepSelector from './WorkflowStepSelector';
import StandardWorkflowDocumentSuggestions from './StandardWorkflowDocumentSuggestions';
import {
  PROCUREMENT_PHASES,
  PROCUREMENT_STAGES,
  PROCUREMENT_PHASE_LABELS,
  ProcurementPhase,
  ProcurementStage,
  getSuggestedDocuments
} from './PublicProcurementWorkflow';
import {
  TenderDocumentCategory,
  TenderDocumentSubcategory,
  TENDER_DOCUMENT_LABELS,
  TENDER_CATEGORY_LABELS,
  ADMINISTRATIVE_SUBCATEGORY_GROUPS
} from '@/types/tender';
import ProcurementStepSelector from './ProcurementStepSelector';

// Interfaces moved to DTO types

interface TenderWorkflowStepsProps {
  tenderId: string;
  readonly?: boolean;
  projectId?: string;
  onShareWithSuppliers?: (shareData: DocumentShareDTO) => void;
}

const TenderWorkflowSteps = ({ tenderId, projectId, readonly = false, onShareWithSuppliers }: TenderWorkflowStepsProps) => {
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [isProcurementWorkflowDialogOpen, setIsProcurementWorkflowDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStepDTO | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [documentFormData, setDocumentFormData] = useState({
    category: 'administrative' as TenderDocumentCategory,
    subcategory: 'lettre_soumission' as TenderDocumentSubcategory,
    title: '',
    description: '',
    is_required: true
  });

  // Use the new workflow steps hook
  const {
    steps,
    progress,
    stepsLoading,
    progressLoading,
    uploading,
    uploadDocument,
    updateStatus,
    useStepDocuments
  } = useWorkflowSteps(tenderId);

  // Data is now handled by the hook

  // Status update is now handled by the hook
  // Add these handler functions inside the TenderWorkflowSteps component, before the return statement
  // Add these utility functions as well

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = () => {
    return progress?.progress_percentage || 0;
  };

  const getExistingStepNumbers = () => {
    return steps?.map(step => step.step_number) || [];
  };

  const getExistingProcurementSteps = () => {
    if (!steps) return [];

    return steps
      .filter(step => step.procurement_phase && step.procurement_stage)
      .map(step => {
        const phase = step.procurement_phase as ProcurementPhase;
        const stageValue = step.procurement_stage as ProcurementStage;

        const stageObject = PROCUREMENT_STAGES[phase]?.find(
          s => s.value === stageValue
        );

        if (stageObject) {
          return {
            phase: phase,
            stage: stageObject
          };
        }

        return {
          phase: phase,
          stage: {
            value: stageValue,
            label: stageValue
          }
        };
      });
  };

  const filteredSteps = steps?.filter(step =>
    step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    step.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Task calculations are now handled in the service layer
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
      return;
    }

    const uploadData: DocumentUploadDTO = {
      file: selectedFile,
      step_id: selectedStepId,
      title: documentFormData.title,
      description: documentFormData.description,
      category: documentFormData.category,
      subcategory: documentFormData.subcategory,
      is_required: documentFormData.is_required
    };

    uploadDocument({ uploadData, projectId });
    setIsAddDocumentDialogOpen(false);
    setSelectedFile(null);
    setSelectedStepId(null);
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

  const handleShareDocuments = (step: WorkflowStepDTO) => {
    if (!onShareWithSuppliers) return;

    const stepDocuments = useStepDocuments(step.id);
    const shareableDocuments = stepDocuments.data?.filter(doc => doc.can_share) || [];
    
    if (shareableDocuments.length === 0) return;

    const shareData: DocumentShareDTO = {
      document_ids: shareableDocuments.map(doc => doc.document_id),
      step_title: step.title,
      procurement_phase: step.procurement_phase,
      procurement_stage: step.procurement_stage
    };

    onShareWithSuppliers(shareData);
  };

  const openAddDocumentDialog = (step: WorkflowStepDTO) => {
    setSelectedStep(step);
    setSelectedStepId(step.id);
    setIsAddDocumentDialogOpen(true);
  };

  // Function moved above

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  // Mutations removed - handled by the service layer now
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
        }]);

      if (tenderDocError) throw new Error(`Tender document creation failed: ${tenderDocError.message}`);

      const { error: stepDocError } = await supabase
        .from('tender_step_documents')
        .insert([{
          step_id: stepId,
          document_id: document.id,
          document_type: `${documentData.category}_${documentData.subcategory}`,
          is_required: documentData.is_required,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }]);

      if (stepDocError) throw new Error(`Step document creation failed: ${stepDocError.message}`);

      return { document };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['step-documents', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });
      toast({
        title: 'Document ajouté',
        description: 'Le document a été ajouté à l\'étape avec succès.',
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


  if (stepsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-terracotta-600" />
              <CardTitle>Étapes du Processus d'Appel d'Offres</CardTitle>
            </div>

            {(!readonly || DEV_MODE) && (
              <div className="flex flex-wrap gap-2">
              
                <Button
                  variant="outline"
                  onClick={() => setIsProcurementWorkflowDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Workflow className="h-4 w-4" />
                   Workflow Officiel
                </Button>
                <Button
                  onClick={() => setIsAddStepDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
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
          {/* Progress Bar */}
          {(tenderSteps?.length || 0) > 0 && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progression globale</span>
                <span>{Math.round(getProgressPercentage())}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une étape..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {filteredSteps?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>{searchTerm ? 'Aucune étape trouvée' : 'Aucune étape définie pour cet appel d\'offres.'}</p>
                {!readonly && !searchTerm && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
    
                    <Button
                      onClick={() => setIsAddStepDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter une Étape
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredSteps?.map((step) => {
                const stepDocs = stepDocuments?.filter(doc => doc.step_id === step.id) || [];
                const isExpanded = expandedSteps.has(step.id);

                return (
                  <Card key={step.id} className="border-l-4 border-l-terracotta-500 transition-all hover:shadow-md">
                    <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleStepExpansion(step.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
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
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-foreground mb-1">
                                {step.title}
                              </h3>
                              <div className="text-xs text-muted-foreground">
                                {getCompletedTasksCount(step.id)}/{getTotalTasksCount(step)} tâches • {getCompletedTasksCount(step.id)}/{getTotalTasksCount(step)} terminées
                              </div>
                              {step.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {step.description}
                                </p>
                              )}
                              {step.due_date && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Échéance: {new Date(step.due_date).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStepExpansion(step.id);
                              }}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview" className="text-xs">Aperçu</TabsTrigger>
                            <TabsTrigger value="tasks" className="text-xs">
                              Tâches ({getCompletedTasksCount(step.id)}/{getTotalTasksCount(step)})
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="text-xs">
                              Documents ({stepDocs.length})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="overview" className="mt-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Progression de l'étape</span>
                                <span className="text-sm text-muted-foreground">
                                  {getCompletedTasksCount(step.id)}/{getTotalTasksCount(step)} terminées
                                </span>
                              </div>
                              <Progress 
                                value={(getCompletedTasksCount(step.id) / getTotalTasksCount(step)) * 100} 
                                className="h-2" 
                              />
                              
                              {step.status !== 'completed' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateStepStatusMutation.mutate({ 
                                      stepId: step.id, 
                                      status: step.status === 'pending' ? 'in_progress' : 'completed' 
                                    })}
                                    disabled={updateStepStatusMutation.isPending}
                                  >
                                    {step.status === 'pending' ? 'Commencer' : 'Terminer l\'étape'}
                                  </Button>
                                  {stepDocs.length > 0 && onShareWithSuppliers && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onShareWithSuppliers(step.title, step.procurement_phase as any)}
                                      className="flex items-center gap-2"
                                    >
                                      <Share2 className="h-4 w-4" />
                                      Partager
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="tasks" className="mt-4">
                            <div className="space-y-3">
                              {getTasksForStep(step).length > 0 ? (
                                getTasksForStep(step).map((task, index) => {
                                  const taskDocument = stepDocs.find(doc => 
                                    doc.document?.title.toLowerCase().includes(task.label.toLowerCase()) ||
                                    doc.document_type.toLowerCase().includes(task.code)
                                  );
                                  const isCompleted = taskDocument?.status === 'approved' || taskDocument?.status === 'submitted';
                                  
                                  return (
                                    <div key={task.id} className="border rounded-lg p-3 bg-muted/30">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-sm">{task.label}</h5>
                                          {task.description && (
                                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {isCompleted ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Terminé
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline">
                                              <Clock className="h-3 w-3 mr-1" />
                                              En attente
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {!isCompleted && !readonly && (
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openAddDocumentDialog(step.id)}
                                            className="flex items-center gap-2"
                                          >
                                            <Upload className="h-3 w-3" />
                                            Uploader Document
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {isCompleted && taskDocument && (
                                        <div className="mt-2 p-2 bg-background rounded border">
                                          <p className="text-xs text-muted-foreground">
                                            Document: {taskDocument.document?.title}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                  <p className="text-sm">Aucune tâche définie pour cette étape</p>
                                  {!readonly && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openAddDocumentDialog(step.id)}
                                      className="mt-2"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Ajouter Document
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="documents" className="mt-4">
                            {stepDocs.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {stepDocs.map((stepDoc) => (
                                  <div key={stepDoc.id} className="border rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
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
                                      <p className="text-xs text-muted-foreground mb-2">
                                        Fichier: {stepDoc.document.file_name}
                                      </p>
                                    )}

                                    {stepDoc.reviewer_notes && (
                                      <div className="text-xs text-muted-foreground mb-2 p-2 bg-background rounded">
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
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Aucun document ajouté</p>
                                {!readonly && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openAddDocumentDialog(step.id)}
                                    className="mt-2"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Ajouter Document
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            {(!readonly || DEV_MODE) && (
                              <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                                <Button
                                  size="sm"
                                  variant={selectedStepForSuggestions === step.step_number ? "default" : "outline"}
                                  onClick={() => setSelectedStepForSuggestions(
                                    selectedStepForSuggestions === step.step_number ? null : step.step_number
                                  )}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  {selectedStepForSuggestions === step.step_number ? 'Masquer' : 'Suggérer'} Documents
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAddDocumentDialog(step.id)}
                                  className="flex items-center gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  Ajouter Document
                                </Button>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                        
                        {/* Document Suggestions */}
                        {selectedPhase && selectedStepForSuggestions && (
                          <div className="mt-4 border-t pt-4">
                            <StandardWorkflowDocumentSuggestions
                              selectedPhase={selectedPhase}
                              onAddDocument={handleAddSuggestedDocument}
                              existingDocuments={getExistingDocuments()}
                            />
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
    
      <ProcurementStepSelector
      isOpen={isProcurementWorkflowDialogOpen}
      onClose={() => setIsProcurementWorkflowDialogOpen(false)}
      onSelectStep={handleSelectProcurementStep}
      existingSteps={getExistingProcurementSteps()}
    />

      {/* Add Step Dialog */}
      <Dialog open={isAddStepDialogOpen} onOpenChange={setIsAddStepDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une Étape Personnalisée</DialogTitle>
            <DialogDescription>
              Créez une nouvelle étape personnalisée pour votre processus d'appel d'offres.
            </DialogDescription>
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
              />
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
            <DialogTitle>Ajouter un Document</DialogTitle>
            <DialogDescription>
              Ajoutez un document à l'étape sélectionnée.
            </DialogDescription>
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
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_required" className="text-sm">Document requis pour cette étape</Label>
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

            <div className="flex justify-end gap-2 pt-4">
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