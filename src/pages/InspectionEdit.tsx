import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InspectionService } from '@/services/InspectionService';
import { InspectionDTO, UpdateInspectionDTO } from '@/types/inspection.dto';
import ProjectSelector from '@/components/selectors/ProjectSelector';

const InspectionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inspection, setInspection] = useState<InspectionDTO | null>(null);

  const [formData, setFormData] = useState({
    project_id: '',
    inspector: '',
    date: '',
    status: 'scheduled',
    progress_at_inspection: 0,
    comments: ''
  });

  const statusOptions = [
    { value: 'scheduled', label: 'Programmée', icon: Clock },
    { value: 'in_progress', label: 'En cours', icon: Clock },
    { value: 'approved', label: 'Approuvée', icon: CheckCircle },
    { value: 'rejected', label: 'Rejetée', icon: XCircle },
    { value: 'requires_changes', label: 'Modifications requises', icon: AlertTriangle }
  ];

  useEffect(() => {
    if (id) {
      loadInspection();
    }
  }, [id]);

  const loadInspection = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await InspectionService.getInspectionById(id);
      
      if (data) {
        setInspection(data);
        setFormData({
          project_id: data.project_id,
          inspector: data.inspector,
          date: new Date(data.date).toISOString().split('T')[0],
          status: data.status,
          progress_at_inspection: data.progress_at_inspection || 0,
          comments: data.comments || ''
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Inspection non trouvée',
          variant: 'destructive'
        });
        navigate('/inspection-monitoring');
      }
    } catch (error) {
      console.error('Error loading inspection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'inspection',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !formData.inspector || !formData.date) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      const updates: UpdateInspectionDTO = {
        inspector: formData.inspector,
        date: formData.date,
        status: formData.status,
        progress_at_inspection: formData.progress_at_inspection,
        comments: formData.comments
      };

      await InspectionService.updateInspection(id, updates);
      
      toast({
        title: 'Succès',
        description: 'Inspection mise à jour avec succès'
      });
      
      navigate(`/inspections/${id}`);
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'inspection',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return <Navigate to="/inspection-monitoring" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Modifier l'Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">Projet</Label>
                <ProjectSelector
                  value={formData.project_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, project_id: value || '' }))}
                  disabled
                />
              </div>
              
              <div>
                <Label htmlFor="inspector">Inspecteur *</Label>
                <Input
                  id="inspector"
                  value={formData.inspector}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspector: e.target.value }))}
                  required
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
                />
              </div>
              
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
                <Label htmlFor="progress">Progression (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_at_inspection}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress_at_inspection: parseInt(e.target.value) || 0 }))}
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
                placeholder="Observations et commentaires sur l'inspection..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionEdit;
