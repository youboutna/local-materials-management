import React, { useState } from 'react';
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
import { Plus, Eye, Edit, Trash2, CheckCircle, AlertCircle, Clock, FileText, ExternalLink, Download } from 'lucide-react';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import UserSelector from '@/components/selectors/UserSelector';
import DocumentViewer from '@/components/documents/DocumentViewer';
import DocumentSection from '@/components/common/DocumentSection';
import { format } from 'date-fns';
import {
  useEnhancedInspectionCrudHex,
  type Inspection,
  type InspectionFormData
} from '@/hooks/hexagonal'

const EnhancedInspectionCrud = () => {
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

  // Use hexagonal hook
  const {
    inspections,
    isLoading,
    error,
    createInspection,
    updateInspection,
    deleteInspection
  } = useEnhancedInspectionCrudHex();

  const inspectionStatuses = [
    { value: 'scheduled', label: 'ProgrammÃ©e', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'in_progress', label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'completed', label: 'TerminÃ©e', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'failed', label: 'Ã‰chec', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    { value: 'postponed', label: 'ReportÃ©e', color: 'bg-gray-100 text-gray-800', icon: Clock }
  ];

  const inspectionTypes = [
    { value: 'routine', label: 'Inspection Routine' },
    { value: 'quality', label: 'ContrÃ´le QualitÃ©' },
    { value: 'safety', label: 'SÃ©curitÃ©' },
    { value: 'environmental', label: 'Environnementale' },
    { value: 'final', label: 'RÃ©ception Finale' },
    { value: 'compliance', label: 'ConformitÃ© RÃ©glementaire' }
  ];

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
        await updateInspection(selectedInspection.id, formData);
      } else {
        await createInspection(formData);
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving inspection:', error);
    }
  };

  const handleDelete = async (inspectionId: string) => {
    if (confirm('ÃŠtes-vous sÃ»r de vouloir supprimer cette inspection ?')) {
      try {
        await deleteInspection(inspectionId);
      } catch (error) {
        console.error('Error deleting inspection:', error);
      }
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

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Erreur: {error instanceof Error ? error.message : 'Erreur inconnue'}</div>
      </div>
    );
  }

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
                {isViewMode ? 'DÃ©tails de l\'Inspection' : 
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
                  <UserSelector
                    value={formData.inspector}
                    onChange={(value) => setFormData(prev => ({ ...prev, inspector: value }))}
                    disabled={isViewMode}
                    placeholder="SÃ©lectionner un inspecteur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspection_date">Date d'inspection *</Label>
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
                          <div className="flex items-center gap-2">
                            <status.icon className="h-4 w-4" />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="progress_at_inspection">Progression (%)</Label>
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
                  <Label htmlFor="defects_found">DÃ©fauts trouvÃ©s</Label>
                  <Input
                    id="defects_found"
                    type="number"
                    min="0"
                    value={formData.defects_found}
                    onChange={(e) => setFormData(prev => ({ ...prev, defects_found: parseInt(e.target.value) || 0 }))}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspection_type">Type d'inspection</Label>
                  <Select 
                    value={formData.inspection_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, inspection_type: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label htmlFor="next_inspection_date">Prochaine inspection</Label>
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
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                  disabled={isViewMode}
                />
              </div>

              <div>
                <Label htmlFor="recommendations">Recommandations</Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                  rows={3}
                  disabled={isViewMode}
                />
              </div>

              <div>
                <Label>Documents de support</Label>
                <DocumentSelector
                  onDocumentsChange={handleDocumentSelect}
                  selectedDocuments={uploadedDocuments}
                  disabled={isViewMode}
                />
              </div>

              {!isViewMode && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Mettre Ã  jour' : 'CrÃ©er'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Chargement des inspections...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Inspecteur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>DÃ©fauts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => {
                const statusConfig = getStatusConfig(inspection.status);
                return (
                  <TableRow key={inspection.id}>
                    <TableCell>{inspection.project_id}</TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>
                      {inspection.inspection_date && format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{inspection.progress_at_inspection}%</TableCell>
                    <TableCell>
                      {inspectionTypes.find(t => t.value === inspection.inspection_type)?.label || inspection.inspection_type}
                    </TableCell>
                    <TableCell>{inspection.defects_found || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openViewForm(inspection)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditForm(inspection)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(inspection.id)}>
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
