/**
 * InspectionCrud - MIGRATED TO HEXAGONAL ARCHITECTURE
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import {
  useInspectionsList,
  useCreateInspection,
  useUpdateInspection,
  useDeleteInspection,
  type InspectionFormData,
  type InspectionRow
} from '@/hooks/hexagonal';

const InspectionCrud: React.FC = () => {
  const [selectedInspection, setSelectedInspection] = useState<InspectionRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<InspectionFormData>({
    project_id: '',
    inspector: '',
    date: '',
    status: 'scheduled',
    progress_at_inspection: 0,
    comments: ''
  });

  // Hexagonal hooks
  const { data: inspections = [], isLoading } = useInspectionsList();
  const createMutation = useCreateInspection();
  const updateMutation = useUpdateInspection();
  const deleteMutation = useDeleteInspection();

  const statusOptions = [
    { value: 'scheduled', label: 'Programmée', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'in_progress', label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'completed', label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'approved', label: 'Approuvée', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    { value: 'rejected', label: 'Rejetée', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    { value: 'cancelled', label: 'Annulée', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
  ];

  const getStatusConfig = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      inspector: '',
      date: '',
      status: 'scheduled',
      progress_at_inspection: 0,
      comments: ''
    });
    setSelectedInspection(null);
    setIsEditing(false);
    setIsViewMode(false);
  };

  const openEditForm = (inspection: InspectionRow) => {
    setFormData({
      project_id: inspection.project_id,
      inspector: inspection.inspector,
      date: inspection.date ? new Date(inspection.date).toISOString().split('T')[0] : '',
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection,
      comments: inspection.comments || ''
    });
    setSelectedInspection(inspection);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (inspection: InspectionRow) => {
    setFormData({
      project_id: inspection.project_id,
      inspector: inspection.inspector,
      date: inspection.date ? new Date(inspection.date).toISOString().split('T')[0] : '',
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection,
      comments: inspection.comments || ''
    });
    setSelectedInspection(inspection);
    setIsEditing(false);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedInspection) {
        await updateMutation.mutateAsync({ id: selectedInspection.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
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
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting inspection:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestion des Inspections</CardTitle>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails' : isEditing ? 'Modifier' : 'Nouvelle Inspection'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Projet</Label>
                <ProjectSelector
                  value={formData.project_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, project_id: value || '' }))}
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
                  <Label htmlFor="date">Date</Label>
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
                  value={formData.progress_at_inspection}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress_at_inspection: parseInt(e.target.value) || 0 }))}
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
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
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
              {inspections.map((inspection) => {
                const statusConfig = getStatusConfig(inspection.status);
                return (
                  <TableRow key={inspection.id}>
                    <TableCell>{inspection.project_id}</TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>
                      {inspection.date && new Date(inspection.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{inspection.progress_at_inspection}%</TableCell>
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

export default InspectionCrud;
