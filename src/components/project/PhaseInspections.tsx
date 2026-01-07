import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, ClipboardCheck, Trash2, Calendar, User, ExternalLink, Upload, Pencil } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { ProjectService } from '@/services/ProjectService';
import { useProjectProgressSync } from '@/hooks/useProjectProgressSync';
import { InspectorSelector } from '@/components/selectors/InspectorSelector';

interface PhaseInspectionsProps {
  phaseId: string;
  projectId: string;
}

interface InspectionFormData {
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: string;
  comments: string;
  documents?: File[];
}

const PhaseInspections: React.FC<PhaseInspectionsProps> = ({ phaseId, projectId }) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [inspectorId, setInspectorId] = useState('');
  const [formData, setFormData] = useState<InspectionFormData>({
    inspector: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    progress_at_inspection: '',
    comments: '',
    documents: [],
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const { syncProgress } = useProjectProgressSync(projectId);
  const projectService = new ProjectService();

  const { data: inspections, isLoading } = useQuery({
    queryKey: ['phase-inspections', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('phase_id', phaseId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addInspectionMutation = useMutation({
    mutationFn: async (inspectionData: InspectionFormData) => {
      // Upload documents if any
      let documentsData = {};
      if (inspectionData.documents && inspectionData.documents.length > 0) {
        const uploadPromises = inspectionData.documents.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `inspections/${projectId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('project-documents')
            .getPublicUrl(filePath);

          return {
            name: file.name,
            url: publicUrl,
            uploadedAt: new Date().toISOString()
          };
        });

        const uploadedDocs = await Promise.all(uploadPromises);
        documentsData = { validation_documents: uploadedDocs };
      }

      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          inspector: inspectionData.inspector,
          date: new Date(inspectionData.date).toISOString(),
          status: inspectionData.status,
          progress_at_inspection: parseInt(inspectionData.progress_at_inspection) || 0,
          comments: inspectionData.comments,
          documents: documentsData,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Synchronize project progress
      await syncProgress();
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsAdding(false);
      resetForm();
      toast({ title: 'Inspection ajoutée avec succès', description: 'La progression du projet a été mise à jour automatiquement' });
    },
  });

  const deleteInspectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      toast({ title: 'Inspection supprimée avec succès' });
    },
  });

  const resetForm = () => {
    setInspectorId('');
    setFormData({
      inspector: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      progress_at_inspection: '',
      comments: '',
      documents: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.inspector.trim()) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez sélectionner un inspecteur',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.date) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez sélectionner une date d\'inspection',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.progress_at_inspection && (parseInt(formData.progress_at_inspection) < 0 || parseInt(formData.progress_at_inspection) > 100)) {
      toast({
        title: 'Erreur de validation',
        description: 'La progression doit être entre 0 et 100%',
        variant: 'destructive',
      });
      return;
    }
    
    addInspectionMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: 'Approuvée',
      pending: 'En attente',
      rejected: 'Rejetée',
      completed: 'Terminée',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des inspections...</div>;
  }

  const averageProgress = inspections && inspections.length > 0 
    ? inspections.reduce((sum, inspection) => sum + inspection.progress_at_inspection, 0) / inspections.length
    : 0;
    
  const totalPages = Math.ceil((inspections?.length || 0) / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedInspections = inspections?.slice(startIndex, startIndex + pageSize) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Inspections de la phase ({inspections?.length || 0})
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/inspection-monitoring')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir toutes les inspections
            </Button>
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une inspection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouvelle inspection</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InspectorSelector
                      projectId={projectId}
                      value={inspectorId}
                      onValueChange={(id, name) => {
                        setInspectorId(id);
                        setFormData({ ...formData, inspector: name });
                      }}
                      label="Inspecteur *"
                      placeholder="Sélectionner un inspecteur"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date d'inspection *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                        <SelectItem value="approved">Approuvée</SelectItem>
                        <SelectItem value="rejected">Rejetée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="progress_at_inspection">Progression observée (%)</Label>
                    <Input
                      id="progress_at_inspection"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress_at_inspection}
                      onChange={(e) => setFormData({ ...formData, progress_at_inspection: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments">Commentaires</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Observations, remarques, recommandations..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="documents">Documents de validation</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      id="documents"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setFormData({ ...formData, documents: files });
                      }}
                      className="hidden"
                    />
                    <label htmlFor="documents" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {formData.documents && formData.documents.length > 0
                          ? `${formData.documents.length} fichier(s) sélectionné(s)`
                          : 'Cliquez pour ajouter des documents (PDF, images, Word)'}
                      </p>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={addInspectionMutation.isPending}>
                    {addInspectionMutation.isPending ? 'Ajout en cours...' : 'Ajouter l\'inspection'}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {inspections && inspections.length > 0 ? (
          <div className="space-y-4">
            {averageProgress > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Progression moyenne observée: {Math.round(averageProgress)}%
                </p>
              </div>
            )}
            
            {paginatedInspections.map((inspection) => (
              <div key={inspection.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <h3 className="font-medium">{inspection.inspector}</h3>
                    </div>
                    {inspection.comments && (
                      <p className="text-sm text-muted-foreground mt-1">{inspection.comments}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/inspection-monitoring?id=${inspection.id}`)}
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteInspectionMutation.mutate(inspection.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(inspection.status)}>
                    {getStatusLabel(inspection.status)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(inspection.date).toLocaleDateString()}
                  </Badge>
                  {inspection.progress_at_inspection > 0 && (
                    <Badge variant="secondary">
                      Progression: {inspection.progress_at_inspection}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {inspections && inspections.length > pageSize && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={inspections.length}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                showItemsPerPage={false}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Aucune inspection enregistrée pour cette phase.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseInspections;