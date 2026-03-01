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
import { format } from 'date-fns';
import { useEnhancedInspectionCrudHex } from '@/hooks/hexagonal';
import type { InspectionDTO, InspectionStatus, CreateInspectionDTO } from '@/dtos/entities/InspectionDTO';

interface LocalInspectionFormData {
  projectId: string;
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: number;
  comments: string;
  phaseId: string;
}

const EnhancedInspectionCrud = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionDTO | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  const [formData, setFormData] = useState<LocalInspectionFormData>({
    projectId: '',
    inspector: '',
    date: '',
    status: 'scheduled',
    progressAtInspection: 0,
    comments: '',
    phaseId: '',
  });

  // Use hexagonal hook
  const {
    inspections,
    isLoading,
    createInspection,
    updateInspection,
    deleteInspection
  } = useEnhancedInspectionCrudHex();

  const statusOptions = [
    { value: 'scheduled', label: 'Programmée', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'in_progress', label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    { value: 'completed', label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'approved', label: 'Approuvée', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    { value: 'rejected', label: 'Rejetée', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    { value: 'cancelled', label: 'Annulée', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
  ];

  const getStatusConfig = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      inspector: '',
      date: '',
      status: 'scheduled' as InspectionStatus,
      progressAtInspection: 0,
      comments: '',
      phaseId: ''
    });
    setUploadedDocuments([]);
    setSelectedInspection(null);
    setIsEditing(false);
    setIsViewMode(false);
  };

  const openEditForm = (inspection: InspectionDTO) => {
    const projectId = inspection.projectId || '';
    const date = inspection.scheduledDate ? new Date(inspection.scheduledDate).toISOString().split('T')[0] : '';
    const progress = inspection.progress ?? 0;
    const phaseId = inspection.phaseId || '';
    
    setFormData({
      projectId: projectId,
      inspector: inspection.inspector || '',
      date: date,
      status: inspection.status,
      progressAtInspection: progress,
      comments: inspection.description || '',
      phaseId: phaseId,
    });
    setSelectedInspection(inspection);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (inspection: InspectionDTO) => {
    const projectId = inspection.projectId || '';
    const date = inspection.date ? new Date(inspection.date).toISOString().split('T')[0] : '';
    const progress = inspection.progress ?? 0;
    const phaseId = inspection.phaseId || '';
    
    setFormData({
      projectId: projectId,
      inspector: inspection.inspector || '',
      date: date,
      status: inspection.status,
      progressAtInspection: progress,
      comments: inspection.description || '',
      phaseId: phaseId,
    });
    setSelectedInspection(inspection);
    setIsEditing(false);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const inspectionData = {
        projectId: formData.projectId,
        inspector: formData.inspector,
        date: formData.date,
        status: formData.status as InspectionStatus,
        progressAtInspection: formData.progressAtInspection,
        comments: formData.comments,
        phaseId: formData.phaseId || undefined,
      };
      if (isEditing && selectedInspection) {
        await updateInspection(selectedInspection.id, {
          status: formData.status as InspectionStatus,
          notes: formData.comments
        });
      } else {
        const createData: CreateInspectionDTO = {
          projectId: formData.projectId,
          inspector: formData.inspector,
          date: formData.date,
          status: formData.status as InspectionStatus,
          progress: formData.progressAtInspection,
          comments: formData.comments,
          phaseId: formData.phaseId
        };
        await createInspection(createData);
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving inspection:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette inspection ?')) {
      try {
        await deleteInspection(id);
      } catch (error) {
        console.error('Error deleting inspection:', error);
      }
    }
  };

  const handleDocumentSelect = (documents: File[]) => {
    setUploadedDocuments(documents);
  };

  // Use centralized InspectionDTO directly (Rule #3 compliance)
  const typedInspections: InspectionDTO[] = inspections || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gestion des Inspections
        </CardTitle>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails de l\'inspection' : isEditing ? 'Modifier l\'inspection' : 'Nouvelle inspection'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Projet</Label>
                <ProjectSelector
                  value={formData.projectId}
                  onChange={(value) => setFormData(prev => ({ ...prev, projectId: value || '' }))}
                  disabled={isViewMode}
                />
              </div>

              <div>
                <Label htmlFor="inspector">Inspecteur</Label>
                <Input
                  id="inspector"
                  value={formData.inspector}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspector: e.target.value }))}
                  disabled={isViewMode}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date d'inspection</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    disabled={isViewMode}
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
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="progress">Progression (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.progressAtInspection}
                  onChange={(e) => setFormData(prev => ({ ...prev, progressAtInspection: parseInt(e.target.value) || 0 }))}
                  disabled={isViewMode}
                />
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

              {!isViewMode && (
                <div className="flex justify-end gap-2 pt-4">
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typedInspections.map((inspection) => {
                const statusConfig = getStatusConfig(inspection.status);
                const projectId = inspection.projectId || '';
                const progress = inspection.progress ?? 0;
                
                return (
                  <TableRow key={inspection.id}>
                    <TableCell>{projectId}</TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>
                      {inspection.scheduledDate && format(new Date(inspection.scheduledDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{progress}%</TableCell>
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
