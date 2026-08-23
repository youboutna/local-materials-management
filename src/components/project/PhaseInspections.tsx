import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePhaseInspectionsListHex, useAddPhaseInspectionHex, useDeletePhaseInspectionHex } from '@/hooks/hexagonal/usePhaseInspectionsHex';
import { useNavigate } from 'react-router-dom';
import { useStorageHex } from '@/hooks/hexagonal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, ClipboardCheck, Trash2, Calendar, User, ExternalLink, Upload, Pencil, Play } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useProjectProgressSync } from '@/hooks/useProjectProgressSync';
import { InspectorSelector } from '@/components/selectors/InspectorSelector';

import { i18nService } from '@/application/services/I18nService';
import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
interface PhaseInspectionsProps {
  phaseId: string;
  projectId: string;
}

interface InspectionFormData {
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: string;
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
    progressAtInspection: '',
    comments: '',
    documents: [],
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const { syncProgress } = useProjectProgressSync(projectId);
  const { uploadFile, getPublicUrl } = useStorageHex('inspection-documents');

  const { data: inspections, isLoading } = usePhaseInspectionsListHex(phaseId);

  const addInspectionMutationBase = useAddPhaseInspectionHex(phaseId, projectId, syncProgress);
  const addInspectionMutation = {
    ...addInspectionMutationBase,
    mutate: async (inspectionData: InspectionFormData) => {
      let documentsData = {};
      if (inspectionData.documents && inspectionData.documents.length > 0) {
        const uploadPromises = inspectionData.documents.map(async (file) => {
          const folder = `inspections/${projectId}`;
          const uploadResult = await uploadFile({ file, folder });
          const publicUrl = getPublicUrl(uploadResult.path);
          return {
            name: file.name,
            url: publicUrl,
            uploadedAt: new Date().toISOString()
          };
        });

        const uploadedDocs = await Promise.all(uploadPromises);
        documentsData = { validation_documents: uploadedDocs };
      }

      addInspectionMutationBase.mutate(
        { ...inspectionData, documentsData },
        {
          onSuccess: () => {
            setIsAdding(false);
            resetForm();
            toast({ title: 'Inspection ajoutée avec succès', description: 'La progression du projet a été mise à jour automatiquement' });
          },
        }
      );
    },
  };

  const deleteInspectionMutationBase = useDeletePhaseInspectionHex(phaseId);
  const deleteInspectionMutation = {
    ...deleteInspectionMutationBase,
    mutate: (id: string) => {
      deleteInspectionMutationBase.mutate(id, {
        onSuccess: () => {
          toast({ title: 'Inspection supprimée avec succès' });
        },
      });
    },
  };

  const resetForm = () => {
    setInspectorId('');
    setFormData({
      inspector: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      progressAtInspection: '',
      comments: '',
      documents: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    if (formData.progressAtInspection && (parseInt(formData.progressAtInspection) < 0 || parseInt(formData.progressAtInspection) > 100)) {
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
      case 'approved': return 'bg-success-soft text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      case 'completed': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => i18nService.translateStatus(status);

  if (isLoading) {
    return <div className="animate-pulse"><T k="auto.phaseinspections.chargement_des_inspections" fallback="Chargement des inspections..." /></div>;
  }

  const averageProgress = inspections && inspections.length > 0 
    ? inspections.reduce((sum, inspection) => sum + (inspection.progress_at_inspection || 0), 0) / inspections.length
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
              <T k="auto.phaseinspections.voir_toutes_les_inspections" fallback="Voir toutes les inspections" />
            </Button>
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  <T k="auto.phaseinspections.ajouter_une_inspection" fallback="Ajouter une inspection" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle><T k="auto.phaseinspections.nouvelle_inspection" fallback="Nouvelle inspection" /></DialogTitle>
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
                    <Label htmlFor="status"><T k="auto.phaseinspections.statut" fallback="Statut" /></Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending"><TranslatedStatus code="pending" /></SelectItem>
                        <SelectItem value="completed"><TranslatedStatus code="completed" /></SelectItem>
                        <SelectItem value="approved"><TranslatedStatus code="approved" /></SelectItem>
                        <SelectItem value="rejected"><TranslatedStatus code="rejected" /></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="progressAtInspection"><T k="auto.phaseinspections.progression_observee" fallback="Progression observée (%)" /></Label>
                    <Input
                      id="progressAtInspection"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progressAtInspection}
                      onChange={(e) => setFormData({ ...formData, progressAtInspection: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments"><T k="auto.phaseinspections.commentaires" fallback="Commentaires" /></Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Observations, remarques, recommandations..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="documents"><T k="auto.phaseinspections.documents_de_validation" fallback="Documents de validation" /></Label>
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
                    <T k="auto.phaseinspections.annuler" fallback="Annuler" />
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
                    {(inspection.status === 'pending' || inspection.status === 'scheduled' || inspection.status === 'in_progress') && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => navigate(`/inspections/${inspection.id}`)}
                        title="Exécuter l'inspection"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        <T k="auto.phaseinspections.executer" fallback="Exécuter" />
                      </Button>
                    )}
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
                      onClick={() => navigate(`/inspections/${inspection.id}`)}
                      title="Consulter"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteInspectionMutation.mutate(inspection.id || '')}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(inspection.status || '')}>
                    {getStatusLabel(inspection.status || '')}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(inspection.date || '').toLocaleDateString()}
                  </Badge>
                  {(inspection.progress_at_inspection || 0) > 0 && (
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
            <p className="text-sm text-muted-foreground"><T k="auto.phaseinspections.aucune_inspection_enregistree_pour_cette_phase" fallback="Aucune inspection enregistrée pour cette phase." /></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseInspections;
