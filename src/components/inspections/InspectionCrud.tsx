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
  useInspectionsListCrud,
  useCreateInspection,
  useUpdateInspection,
  useDeleteInspection,
  InspectionFormData,
  InspectionRow
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
  const { data: inspections = [], isLoading } = useInspectionsListCrud();
  const createMutation = useCreateInspection();
  const updateMutation = useUpdateInspection();
  const deleteMutation = useDeleteInspection();

  const statusOptions = [
    { value: 'scheduled', label: 'Programmée', color: 'bg-blue-100 text-blue-800', icon: Clock },
    { value: 'in_progress', label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'completed', label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'cancelled', label: 'Annulée', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
    { value: 'failed', label: 'Échouée', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  ];

  const resetForm = () => {
    setFormData({
      project_id: '',
      inspector: '',
      date: '',
      status: 'scheduled',
      progress_at_inspection: 0,
      comments: ''
    });
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (inspection: InspectionRow) => {
    setFormData({
      project_id: inspection.project_id,
      inspector: inspection.inspector,
      date: inspection.date.split('T')[0],
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
      date: inspection.date.split('T')[0],
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection,
      comments: inspection.comments || ''
    });
    setSelectedInspection(inspection);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.inspector || !formData.date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedInspection) {
        await updateMutation.mutateAsync({ id: selectedInspection.id, data: formData });
        toast({ title: "Succès", description: "Inspection mise à jour avec succès" });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Succès", description: "Inspection créée avec succès" });
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
      try {
        await deleteMutation.mutateAsync(inspectionId);
        toast({ title: "Succès", description: "Inspection supprimée avec succès" });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const handleProjectChange = (projectId: string | undefined) => {
    setFormData(prev => ({ ...prev, project_id: projectId || '' }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🔍 Gestion des Inspections</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails de l\'Inspection' : isEditing ? 'Modifier l\'Inspection' : 'Nouvelle Inspection'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectSelector
                  value={formData.project_id}
                  onChange={handleProjectChange}
                  label="Projet"
                  required
                  disabled={isViewMode}
                />
                
                <div>
                  <Label htmlFor="inspector">Inspecteur *</Label>
                  <Input
                    id="inspector"
                    value={formData.inspector}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspector: e.target.value }))}
                    required
                    disabled={isViewMode}
                    placeholder="Nom de l'inspecteur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date d'inspection *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
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
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
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
              </div>

              <div>
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                  disabled={isViewMode}
                  placeholder="Observations et commentaires sur l'inspection..."
                />
              </div>

              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Inspections</CardTitle>
        </CardHeader>
        <CardContent>
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
                const StatusIcon = statusConfig.icon;
                
                return (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">
                      {inspection.project_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{inspection.inspector}</TableCell>
                    <TableCell>
                      {new Date(inspection.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all" 
                            style={{ width: `${inspection.progress_at_inspection}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {inspection.progress_at_inspection}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openViewForm(inspection)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditForm(inspection)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(inspection.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {inspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucune inspection trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionCrud;
