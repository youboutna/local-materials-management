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
    updateDates,
    useStepDocuments
  } = useWorkflowSteps(tenderId);

  // Utility functions
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

  const filteredSteps = steps?.filter(step =>
    step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    step.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Event handlers
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

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  if (stepsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Chargement des étapes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Étapes du workflow
          </CardTitle>
          <div className="flex items-center gap-4 mb-4">
            <Progress value={getProgressPercentage()} className="flex-1" />
            <span className="text-sm font-medium">
              {Math.round(getProgressPercentage())}% complété ({progress?.completed_steps || 0}/{progress?.total_steps || 0})
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une étape..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

        {filteredSteps?.map((step) => {
          const isExpanded = expandedSteps.has(step.id);
          const stepDocumentsQuery = useStepDocuments(step.id);
          const stepDocuments = stepDocumentsQuery.data || [];
          const hasShareableDocuments = stepDocuments.some(doc => doc.can_share);
          const isLoadingDocuments = stepDocumentsQuery.isLoading;

          return (
            <Card key={step.id} className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{step.step_number}</Badge>
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(step.status)}>
                      {getStatusIcon(step.status)}
                      <span className="ml-1">
                        {step.status === 'pending' ? 'En attente' :
                         step.status === 'in_progress' ? 'En cours' :
                         step.status === 'completed' ? 'Terminée' :
                         step.status === 'approved' ? 'Approuvée' : step.status}
                      </span>
                    </Badge>
                    
                    <Badge variant="secondary">
                      {step.tasks_completed}/{step.tasks_total} tâches terminées
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStepExpansion(step.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-muted-foreground">
                    {step.description}
                  </div>
                  
                  {!readonly && (
                    <div className="flex gap-2">
                      {step.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus({ stepId: step.id, status: 'in_progress' })}
                        >
                          Démarrer
                        </Button>
                      )}
                      {step.can_upload_documents && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddDocumentDialog(step)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Ajouter document
                        </Button>
                      )}
                      
                      <Select
                        value={step.status}
                        onValueChange={(value) => updateStatus({ stepId: step.id, status: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                          <SelectItem value="approved">Approuvée</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {hasShareableDocuments && onShareWithSuppliers && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareDocuments(step)}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Partager
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                      <TabsTrigger value="tasks">Tâches</TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phase de marché</label>
                          <p className="text-sm">{step.procurement_phase || 'Non spécifiée'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Étape</label>
                          <p className="text-sm">{step.procurement_stage || 'Non spécifiée'}</p>
                        </div>
                        
                        {/* Editable Date Fields */}
                        <div>
                          <Label htmlFor={`due-date-${step.id}`} className="text-sm font-medium text-muted-foreground">
                            Date d'échéance
                          </Label>
                          {!readonly ? (
                            <Input
                              id={`due-date-${step.id}`}
                              type="date"
                              value={step.due_date ? step.due_date.split('T')[0] : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateDates({ 
                                    stepId: step.id, 
                                    dates: { due_date: e.target.value } 
                                  });
                                }
                              }}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm">
                              {step.due_date ? new Date(step.due_date).toLocaleDateString() : 'Non définie'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor={`submission-date-${step.id}`} className="text-sm font-medium text-muted-foreground">
                            Date de soumission
                          </Label>
                          {!readonly ? (
                            <Input
                              id={`submission-date-${step.id}`}
                              type="date"
                              value={step.submission_date ? step.submission_date.split('T')[0] : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateDates({ 
                                    stepId: step.id, 
                                    dates: { submission_date: e.target.value } 
                                  });
                                }
                              }}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm">
                              {step.submission_date ? new Date(step.submission_date).toLocaleDateString() : 'Non définie'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor={`review-deadline-${step.id}`} className="text-sm font-medium text-muted-foreground">
                            Date limite de révision
                          </Label>
                          {!readonly ? (
                            <Input
                              id={`review-deadline-${step.id}`}
                              type="date"
                              value={step.review_deadline ? step.review_deadline.split('T')[0] : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateDates({ 
                                    stepId: step.id, 
                                    dates: { review_deadline: e.target.value } 
                                  });
                                }
                              }}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm">
                              {step.review_deadline ? new Date(step.review_deadline).toLocaleDateString() : 'Non définie'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor={`approval-deadline-${step.id}`} className="text-sm font-medium text-muted-foreground">
                            Date limite d'approbation
                          </Label>
                          {!readonly ? (
                            <Input
                              id={`approval-deadline-${step.id}`}
                              type="date"
                              value={step.approval_deadline ? step.approval_deadline.split('T')[0] : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateDates({ 
                                    stepId: step.id, 
                                    dates: { approval_deadline: e.target.value } 
                                  });
                                }
                              }}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm">
                              {step.approval_deadline ? new Date(step.approval_deadline).toLocaleDateString() : 'Non définie'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Date de finalisation</label>
                          <p className="text-sm">
                            {step.actual_completion_date ? new Date(step.actual_completion_date).toLocaleDateString() : 'Non finalisée'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Progression</label>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {step.tasks_completed}/{step.tasks_total} tâches terminées
                            </p>
                            <Progress 
                              value={(step.tasks_completed / step.tasks_total) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Tâches de l'étape</h4>
                        <div className="grid gap-2">
                          {step.tasks_total > 0 ? (
                            Array.from({ length: step.tasks_total }, (_, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 border rounded">
                                {i < step.tasks_completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">
                                  Tâche {i + 1} - {i < step.tasks_completed ? 'Terminée' : 'En attente'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Aucune tâche définie pour cette étape.
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                     <TabsContent value="documents" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Documents</h4>
                          {!readonly && step.can_upload_documents && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAddDocumentDialog(step)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter
                            </Button>
                          )}
                        </div>

                        {/* Upload Status Indicator */}
                        {!step.can_upload_documents && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Upload de documents non disponible pour cette étape (statut: {step.status})
                            </p>
                          </div>
                        )}

                        {/* Required Documents List */}
                        {step.required_documents && step.required_documents.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Documents requis:</h5>
                            <div className="grid gap-2">
                              {step.required_documents.map((docType, index) => {
                                const hasDocument = stepDocuments.some(doc => 
                                  doc.document_type === docType || doc.document.title.toLowerCase().includes(docType.toLowerCase())
                                );
                                return (
                                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                    {hasDocument ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    )}
                                    <span className="text-sm">{docType}</span>
                                    {hasDocument && <Badge variant="secondary" className="ml-auto">Fourni</Badge>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                         {isLoadingDocuments ? (
                           <div className="flex items-center justify-center p-4">
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                             <span className="ml-2 text-sm">Chargement des documents...</span>
                           </div>
                         ) : stepDocuments.length > 0 ? (
                           <div className="grid gap-2">
                             {stepDocuments.map((doc) => (
                               <div key={doc.id} className="flex items-center gap-2 p-3 border rounded">
                                 <FileText className="h-4 w-4" />
                                 <div className="flex-1">
                                   <div className="font-medium text-sm">
                                     {doc.document.title}
                                   </div>
                                   {doc.document.description && (
                                     <div className="text-xs text-muted-foreground">
                                       {doc.document.description}
                                     </div>
                                   )}
                                   <div className="text-xs text-muted-foreground mt-1">
                                     Type: {doc.document_type} | Requis: {doc.is_required ? 'Oui' : 'Non'}
                                   </div>
                                 </div>
                                 <Badge variant="outline" className={getStatusColor(doc.status)}>
                                   {getStatusIcon(doc.status)}
                                   <span className="ml-1">
                                     {doc.status === 'pending' ? 'En attente' :
                                      doc.status === 'submitted' ? 'Soumis' :
                                      doc.status === 'approved' ? 'Approuvé' :
                                      doc.status === 'rejected' ? 'Rejeté' : doc.status}
                                   </span>
                                 </Badge>
                                 {doc.document.file_url && (
                                   <Button
                                     size="sm"
                                     variant="ghost"
                                     onClick={() => window.open(doc.document.file_url, '_blank')}
                                   >
                                     <Eye className="h-4 w-4" />
                                   </Button>
                                 )}
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="text-center py-4">
                             <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                             <p className="text-sm text-muted-foreground">
                               Aucun document pour cette étape.
                             </p>
                             {step.can_upload_documents && !readonly && (
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="mt-2"
                                 onClick={() => openAddDocumentDialog(step)}
                               >
                                 <Plus className="h-4 w-4 mr-1" />
                                 Ajouter le premier document
                               </Button>
                             )}
                           </div>
                         )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          );
        })}

        {filteredSteps?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Aucune étape trouvée pour cette recherche.' : 'Aucune étape définie pour ce marché public.'}
            </p>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Add Document Dialog */}
      <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
            <DialogDescription>
              Téléchargez un document pour l'étape: {selectedStep?.title}
              {selectedStep?.can_upload_documents ? "" : " (Étape non démarrée - fonctionnalité limitée)"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDocument} className="space-y-4">
            <div>
              <Label htmlFor="file">Fichier *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                required
                disabled={!selectedStep?.can_upload_documents}
              />
            </div>

            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={documentFormData.title}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du document"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={documentFormData.description}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du document"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={documentFormData.category}
                onValueChange={(value) => setDocumentFormData(prev => ({ 
                  ...prev, 
                  category: value as TenderDocumentCategory,
                  subcategory: 'lettre_soumission'
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TENDER_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_required"
                checked={documentFormData.is_required}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, is_required: e.target.checked }))}
              />
              <Label htmlFor="is_required">Document requis</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDocumentDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={uploading || !selectedFile || !selectedStep?.can_upload_documents}
              >
                {uploading ? 'Téléchargement...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderWorkflowSteps;