import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Plus, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ComplianceItem {
  id: string;
  category: 'regulatory' | 'financial' | 'technical' | 'environmental';
  title: string;
  description?: string;
  status: 'compliant' | 'pending' | 'non_compliant' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  responsible_person?: string;
  documents?: string[];
  notes?: string;
}

interface PhaseComplianceProps {
  phaseId: string;
  projectId: string;
}

const PhaseCompliance: React.FC<PhaseComplianceProps> = ({ phaseId, projectId }) => {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    category: 'regulatory' as 'regulatory' | 'financial' | 'technical' | 'environmental',
    title: '',
    description: '',
    status: 'pending' as 'compliant' | 'pending' | 'non_compliant' | 'in_review',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    deadline: '',
    responsible_person: '',
    notes: ''
  });

  useEffect(() => {
    loadComplianceItems();
  }, [phaseId]);

  const loadComplianceItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('phase_id', phaseId)
        .eq('document_type', 'project_report')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform documents to compliance items
      const items: ComplianceItem[] = (data || []).map(doc => {
        const metadata = doc.metadata as any || {};
        return {
          id: doc.id,
          category: metadata.category || 'regulatory',
          title: doc.title,
          description: doc.description || undefined,
          status: metadata.status || 'pending',
          priority: metadata.priority || 'medium',
          deadline: doc.deadline_date || undefined,
          responsible_person: metadata.responsible_person,
          documents: metadata.documents || [],
          notes: metadata.notes
        };
      });

      setComplianceItems(items);
    } catch (error) {
      console.error('Error loading compliance items:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les éléments de conformité',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const complianceData = {
        title: formData.title,
        description: formData.description,
        document_type: 'project_report' as const,
        phase_id: phaseId,
        project_id: projectId,
        deadline_date: formData.deadline || null,
        metadata: {
          category: formData.category,
          status: formData.status,
          priority: formData.priority,
          responsible_person: formData.responsible_person,
          notes: formData.notes,
          documents: []
        }
      };

      let result;
      if (editingItem) {
        result = await supabase
          .from('documents')
          .update(complianceData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('documents')
          .insert(complianceData);
      }

      if (result.error) throw result.error;

      toast({
        title: 'Succès',
        description: editingItem ? 'Élément modifié' : 'Élément ajouté'
      });

      setIsDialogOpen(false);
      resetForm();
      loadComplianceItems();
    } catch (error) {
      console.error('Error saving compliance item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (item: ComplianceItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      title: item.title,
      description: item.description || '',
      status: item.status,
      priority: item.priority,
      deadline: item.deadline ? item.deadline.split('T')[0] : '',
      responsible_person: item.responsible_person || '',
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      category: 'regulatory',
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      deadline: '',
      responsible_person: '',
      notes: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'non_compliant': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_review': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Conformité de la Phase
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Modifier' : 'Ajouter'} un élément de conformité
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regulatory">Réglementaire</SelectItem>
                      <SelectItem value="financial">Financière</SelectItem>
                      <SelectItem value="technical">Technique</SelectItem>
                      <SelectItem value="environmental">Environnementale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de l'élément de conformité"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_review">En révision</SelectItem>
                      <SelectItem value="compliant">Conforme</SelectItem>
                      <SelectItem value="non_compliant">Non conforme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deadline">Date limite</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="responsible">Responsable</Label>
                <Input
                  id="responsible"
                  value={formData.responsible_person}
                  onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                  placeholder="Personne responsable"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes additionnelles"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  {editingItem ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {complianceItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun élément de conformité pour cette phase
          </div>
        ) : (
          <div className="space-y-4">
            {complianceItems.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                onClick={() => handleEdit(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(item.status)}
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge variant="outline">
                        {item.category}
                      </Badge>
                      {item.deadline && (
                        <Badge variant="outline">
                          Échéance: {new Date(item.deadline).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {item.responsible_person && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Responsable: {item.responsible_person}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseCompliance;