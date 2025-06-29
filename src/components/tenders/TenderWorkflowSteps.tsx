
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Upload, Eye, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';

interface TenderStep {
  id: string;
  tender_id: string;
  step_number: number;
  title: string;
  description?: string;
  required_documents: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  due_date?: string;
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
}

const TenderWorkflowSteps = ({ tenderId, readonly = false }: TenderWorkflowStepsProps) => {
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stepFormData, setStepFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    step_number: 1
  });
  const [documentFormData, setDocumentFormData] = useState({
    document_type: '',
    is_required: true,
    title: '',
    description: ''
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

  // Fetch step documents
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

  // Add new step mutation
  const addStepMutation = useMutation({
    mutationFn: async (stepData: typeof stepFormData) => {
      const { data, error } = await supabase
        .from('tender_steps')
        .insert([{
          tender_id: tenderId,
          title: stepData.title,
          description: stepData.description,
          step_number: stepData.step_number,
          due_date: stepData.due_date || null,
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
      setStepFormData({ title: '', description: '', due_date: '', step_number: 1 });
    },
    onError: (error) => {
      console.error('Add step error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout de l\'étape.',
        variant: 'destructive',
      });
    },
  });

  // Add document to step mutation
  const addDocumentMutation = useMutation({
    mutationFn: async ({ file, documentData, stepId }: { file: File; documentData: any; stepId: string }) => {
      // Upload file first
      const uploadResult = await uploadFile(file, `tender-steps/${tenderId}/${stepId}`);
      
      if (!uploadResult.success) {
        throw new Error('File upload failed');
      }

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
          document_type: 'tender'
        }])
        .select()
        .single();

      if (docError) throw docError;

      // Create step document record
      const { data: stepDoc, error: stepDocError } = await supabase
        .from('tender_step_documents')
        .insert([{
          step_id: stepId,
          document_id: document.id,
          document_type: documentData.document_type,
          is_required: documentData.is_required,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (stepDocError) throw stepDocError;

      return { document, stepDoc };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['step-documents', tenderId] });
      toast({
        title: 'Document ajouté',
        description: 'Le document a été ajouté à l\'étape avec succès.',
      });
      setIsAddDocumentDialogOpen(false);
      setSelectedFile(null);
      setDocumentFormData({ document_type: '', is_required: true, title: '', description: '' });
    },
    onError: (error) => {
      console.error('Add document error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout du document.',
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
            {!readonly && (
              <Button onClick={() => setIsAddStepDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Étape
              </Button>
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
                      {!readonly && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddDocumentDialog(step.id)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Ajouter Document
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  {stepDocs.length > 0 && (
                    <CardContent className="pt-0">
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
                                {stepDoc.document.file_name}
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
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsAddStepDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter la première étape
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Step Dialog */}
      <Dialog open={isAddStepDialogOpen} onOpenChange={setIsAddStepDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une Étape</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddStep} className="space-y-4">
            <div>
              <Label>Numéro d'étape</Label>
              <Input
                type="number"
                value={stepFormData.step_number}
                onChange={(e) => setStepFormData(prev => ({ ...prev, step_number: parseInt(e.target.value) || 1 }))}
                min="1"
                required
              />
            </div>

            <div>
              <Label>Titre</Label>
              <Input
                value={stepFormData.title}
                onChange={(e) => setStepFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={stepFormData.description}
                onChange={(e) => setStepFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={stepFormData.due_date}
                onChange={(e) => setStepFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddStepDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={addStepMutation.isPending}>
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
            <DialogTitle>Ajouter un Document à l'Étape</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddDocument} className="space-y-4">
            <div>
              <Label>Type de document</Label>
              <Input
                value={documentFormData.document_type}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, document_type: e.target.value }))}
                placeholder="ex: Cahier des charges, Contrat, etc."
                required
              />
            </div>

            <div>
              <Label>Titre</Label>
              <Input
                value={documentFormData.title}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={documentFormData.description}
                onChange={(e) => setDocumentFormData(prev => ({ ...prev, description: e.target.value }))}
              />
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

            <div>
              <Label>Fichier</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDocumentDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading || addDocumentMutation.isPending}>
                {uploading || addDocumentMutation.isPending ? 'Téléchargement...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderWorkflowSteps;
