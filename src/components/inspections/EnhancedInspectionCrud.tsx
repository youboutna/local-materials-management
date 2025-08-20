import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Trash2, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { format } from 'date-fns';

interface Inspection {
  id: string;
  project_id: string;
  inspector: string;
  inspection_date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string;
  phase_id?: string;
  supporting_documents?: string[];
  inspection_type?: string;
  defects_found?: number;
  recommendations?: string;
  next_inspection_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface InspectionFormData {
  project_id: string;
  inspector: string;
  inspection_date: string;
  status: string;
  progress_at_inspection: number;
  comments: string;
  phase_id: string;
  supporting_documents: string[];
  inspection_type: string;
  defects_found: number;
  recommendations: string;
  next_inspection_date: string;
}

const EnhancedInspectionCrud = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  const [formData, setFormData] = useState<InspectionFormData>({
    project_id: '',
    inspector: '',
    inspection_date: '',
    status: 'scheduled',
    progress_at_inspection: 0,
    comments: '',
    phase_id: '',
    supporting_documents: [],
    inspection_type: 'routine',
    defects_found: 0,
    recommendations: '',
    next_inspection_date: ''
  });

  const inspectionStatuses = [
    { value: 'scheduled', label: 'Programmée', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'in_progress', label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'completed', label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'failed', label: 'Échec', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    { value: 'postponed', label: 'Reportée', color: 'bg-gray-100 text-gray-800', icon: Clock }
  ];

  const inspectionTypes = [
    { value: 'routine', label: 'Inspection Routine' },
    { value: 'quality', label: 'Contrôle Qualité' },
    { value: 'safety', label: 'Sécurité' },
    { value: 'environmental', label: 'Environnementale' },
    { value: 'final', label: 'Réception Finale' },
    { value: 'compliance', label: 'Conformité Réglementaire' }
  ];

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedInspections: Inspection[] = (data || []).map(inspection => ({
        ...inspection,
        inspection_date: (inspection as any).date || '',
        comments: inspection.comments || undefined,
        phase_id: inspection.phase_id || undefined
      }));
      
      setInspections(transformedInspections);
    } catch (error) {
      console.error('Error loading inspections:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les inspections',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      inspector: '',
      inspection_date: '',
      status: 'scheduled',
      progress_at_inspection: 0,
      comments: '',
      phase_id: '',
      supporting_documents: [],
      inspection_type: 'routine',
      defects_found: 0,
      recommendations: '',
      next_inspection_date: ''
    });
    setUploadedDocuments([]);
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (inspection: Inspection) => {
    setFormData({
      project_id: inspection.project_id,
      inspector: inspection.inspector,
      inspection_date: inspection.inspection_date,
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection,
      comments: inspection.comments || '',
      phase_id: inspection.phase_id || '',
      supporting_documents: inspection.supporting_documents || [],
      inspection_type: inspection.inspection_type || 'routine',
      defects_found: inspection.defects_found || 0,
      recommendations: inspection.recommendations || '',
      next_inspection_date: inspection.next_inspection_date || ''
    });
    setSelectedInspection(inspection);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (inspection: Inspection) => {
    setFormData({
      project_id: inspection.project_id,
      inspector: inspection.inspector,
      inspection_date: inspection.inspection_date,
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection,
      comments: inspection.comments || '',
      phase_id: inspection.phase_id || '',
      supporting_documents: inspection.supporting_documents || [],
      inspection_type: inspection.inspection_type || 'routine',
      defects_found: inspection.defects_found || 0,
      recommendations: inspection.recommendations || '',
      next_inspection_date: inspection.next_inspection_date || ''
    });
    setSelectedInspection(inspection);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.inspector || !formData.inspection_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedInspection) {
        const updatedInspection: Inspection = {
          ...selectedInspection,
          ...formData,
          supporting_documents: uploadedDocuments.map(doc => doc.id),
          updated_at: new Date().toISOString()
        };
        setInspections(prev => prev.map(i => i.id === selectedInspection.id ? updatedInspection : i));
        toast({
          title: "Succès",
          description: "Inspection mise à jour avec succès",
        });
      } else {
        const newInspection: Inspection = {
          id: `insp-${Date.now()}`,
          ...formData,
          supporting_documents: uploadedDocuments.map(doc => doc.id),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setInspections(prev => [...prev, newInspection]);
        toast({
          title: "Succès",
          description: "Inspection créée avec succès",
        });
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (inspectionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inspection ?')) {
      setInspections(prev => prev.filter(i => i.id !== inspectionId));
      toast({
        title: "Succès",
        description: "Inspection supprimée avec succès",
      });
    }
  };

  const getStatusConfig = (status: string) => {
    return inspectionStatuses.find(s => s.value === status) || inspectionStatuses[0];
  };

  const handleProjectChange = (projectId: string | undefined) => {
    setFormData(prev => ({ ...prev, project_id: projectId || '' }));
  };

  const handleDocumentSelect = (documents: any[]) => {
    setUploadedDocuments(documents);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gestion des Inspections
        </CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails de l\'Inspection' : 
                 isEditing ? 'Modifier l\'Inspection' : 'Nouvelle Inspection'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Projet *</Label>
                  <ProjectSelector
                    onChange={(projectId) => handleProjectChange(projectId)}
                    value={formData.project_id}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label>Inspecteur *</Label>
                  <SupplierSelector
                    value={{
                      name: formData.inspector,
                      contact: '',
                      leadTime: 0
                    }}
                    onChange={(supplier) => {
                      setFormData(prev => ({
                        ...prev,
                        inspector: supplier.name
                      }));
                    }}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="inspection_date">Date d'Inspection *</Label>
                  <Input
                    id="inspection_date"
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="inspection_type">Type d'Inspection</Label>
                  <Select 
                    value={formData.inspection_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, inspection_type: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectionStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="progress_at_inspection">Progrès (%)</Label>
                  <Input
                    id="progress_at_inspection"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_at_inspection}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress_at_inspection: parseInt(e.target.value) || 0 }))}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="defects_found">Défauts Trouvés</Label>
                  <Input
                    id="defects_found"
                    type="number"
                    min="0"
                    value={formData.defects_found}
                    onChange={(e) => setFormData(prev => ({ ...prev, defects_found: parseInt(e.target.value) || 0 }))}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="next_inspection_date">Prochaine Inspection</Label>
                  <Input
                    id="next_inspection_date"
                    type="date"
                    value={formData.next_inspection_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_inspection_date: e.target.value }))}
                    disabled={isViewMode}
                  />
                </div>
              </div>
              
              <div>
                <Label>Documents Justificatifs</Label>
                <DocumentSelector
                  onChange={(documentId, document) => {
                    if (document) {
                      setUploadedDocuments(prev => [...prev, document]);
                    }
                  }}
                  documentType="inspection_report"
                  disabled={isViewMode}
                />
              </div>
              
              <div>
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  disabled={isViewMode}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="recommendations">Recommandations</Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                  disabled={isViewMode}
                  rows={3}
                />
              </div>
              
              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {inspections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune inspection trouvée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Inspecteur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Progrès</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => {
                const statusConfig = getStatusConfig(inspection.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">{inspection.project_id}</TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>{format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {inspectionTypes.find(t => t.value === inspection.inspection_type)?.label || 'Routine'}
                    </TableCell>
                    <TableCell>{inspection.progress_at_inspection}%</TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewForm(inspection)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(inspection)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(inspection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedInspectionCrud;