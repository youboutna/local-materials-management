import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, AlertTriangle, Shield, Target, TrendingUp, User, Calendar, Building, AlertCircle } from 'lucide-react';
import { 
  useEnhancedRiskManagerHex,
  ProjectRisk,
  RiskFormData,
  ProjectPhase,
  Employee,
  Supplier
} from '@/hooks/hexagonal/useEnhancedRiskManagerHex';

interface EnhancedRiskManagerProps {
  projectId: string;
  risks?: ProjectRisk[];
  setRisks?: (risks: ProjectRisk[]) => void;
  phases?: ProjectPhase[];
}

const EnhancedRiskManager: React.FC<EnhancedRiskManagerProps> = ({ 
  projectId, 
  risks: propRisks, 
  setRisks: propSetRisks,
  phases: propPhases 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [formData, setFormData] = useState<RiskFormData>({
    title: '',
    description: '',
    probability: '',
    impact: '',
    mitigationPlan: '',
    status: 'identified',
    ownerId: '',
    dueDate: '',
    relatedTasks: [],
    phaseId: '',
    constructionPhase: '',
    applyToAllPhases: false,
    selectedPhases: [],
  });

  // Use hexagonal hook
  const {
    risks,
    tasks,
    phases,
    employees,
    suppliers,
    riskTaskRelations,
    isLoading,
    error,
    createRiskMutation,
    updateRiskMutation,
    deleteRiskMutation,
    createRiskTaskRelationMutation,
    refetch
  } = useEnhancedRiskManagerHex(projectId, propRisks, propPhases);

  // Calculate risk score
  const calculateRiskScore = (probability: number, impact: number) => {
    return probability * impact;
  };

  // Get risk level based on score
  const getRiskLevel = (score: number) => {
    if (score <= 3) return 'low';
    if (score <= 6) return 'medium';
    if (score <= 9) return 'high';
    return 'critical';
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const probability = parseInt(String(formData.probability), 10) || 0;
      const impact = parseInt(String(formData.impact), 10) || 0;
      const riskScore = calculateRiskScore(probability, impact);
      const riskLevel = getRiskLevel(riskScore);

      const riskData = {
        title: formData.title,
        description: formData.description,
        probability: probability,
        impact: impact,
        riskScore: riskScore,
        riskLevel: riskLevel,
        mitigationPlan: formData.mitigationPlan,
        status: formData.status,
        ownerId: formData.ownerId,
        dueDate: formData.dueDate,
        phaseId: formData.phaseId,
        projectId: projectId,
        identifiedBy: 'current_user',
        identifiedDate: new Date().toISOString(),
      } as any;

      if (editingId) {
        await updateRiskMutation.mutateAsync({ id: editingId, data: riskData });
        setEditingId(null);
      } else {
        await createRiskMutation.mutateAsync(riskData);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        probability: '',
        impact: '',
        mitigationPlan: '',
        status: 'identified',
        ownerId: '',
        dueDate: '',
        relatedTasks: [],
        phaseId: '',
        constructionPhase: '',
        applyToAllPhases: false,
        selectedPhases: [],
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving risk:', error);
    }
  };

  // Handle edit
  const handleEdit = (risk: ProjectRisk) => {
    setFormData({
      title: risk.title,
      description: risk.description || '',
      probability: risk.probability?.toString() ?? '',
      impact: risk.impact?.toString() ?? '',
      mitigationPlan: risk.mitigationPlan || '',
      status: risk.status || 'identified',
      ownerId: risk.ownerId ?? risk.owner ?? '',
      dueDate: risk.dueDate ?? '',
      relatedTasks: [],
      phaseId: risk.phaseId || '',
      constructionPhase: '',
      applyToAllPhases: false,
      selectedPhases: [],
    });
    setEditingId(risk.id);
    setIsCreating(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce risque ?')) {
      try {
        await deleteRiskMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting risk:', error);
      }
    }
  };

  // Filter risks by level
  const filteredRisks = risks.filter(risk => {
    if (selectedRiskLevel === 'all') return true;
    return getRiskLevel(risk.riskScore || 0) === selectedRiskLevel;
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Erreur: {error instanceof Error ? error.message : 'Erreur inconnue'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Risques</h1>
          <p className="text-muted-foreground">
            Identification et suivi des risques du projet
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Risque
        </Button>
      </div>

      {/* Risk Level Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtre par niveau de risque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {['all', 'low', 'medium', 'high', 'critical'].map((level) => (
              <Button
                key={level}
                variant={selectedRiskLevel === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRiskLevel(level)}
              >
                {level === 'all' ? 'Tous' : level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risks List */}
      <div className="grid gap-4">
        {filteredRisks.map((risk) => (
          <Card key={risk.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{risk.title}</h3>
                  <p className="text-muted-foreground mb-3">{risk.description}</p>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getRiskLevelColor(getRiskLevel(risk.riskScore || 0))}>
                      {getRiskLevel(risk.riskScore || 0).toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      Score: {risk.riskScore || 0}
                    </Badge>
                    <Badge variant="outline">
                      {risk.status || 'Identifié'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(risk)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(risk.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Probabilité:</span>
                  <span className="ml-2">{risk.probability}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Impact:</span>
                  <span className="ml-2">{risk.impact}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Responsable:</span>
                  <span className="ml-2">
                    {employees.find(emp => emp.id === risk.ownerId)?.fullName || 'Non assigné'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date limite:</span>
                  <span className="ml-2">{risk.dueDate || 'Non définie'}</span>
                </div>
              </div>

              {risk.mitigationPlan && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Plan de mitigation:</h4>
                  <p className="text-sm text-muted-foreground">{risk.mitigationPlan}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Risk Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier le risque' : 'Créer un nouveau risque'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Titre du risque</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="probability">Probabilité (1-5)</Label>
                <Select value={String(formData.probability)} onValueChange={(value) => setFormData(prev => ({ ...prev, probability: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Très faible</SelectItem>
                    <SelectItem value="2">2 - Faible</SelectItem>
                    <SelectItem value="3">3 - Moyenne</SelectItem>
                    <SelectItem value="4">4 - Élevée</SelectItem>
                    <SelectItem value="5">5 - Très élevée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="impact">Impact (1-5)</Label>
                <Select value={String(formData.impact)} onValueChange={(value) => setFormData(prev => ({ ...prev, impact: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Très faible</SelectItem>
                    <SelectItem value="2">2 - Faible</SelectItem>
                    <SelectItem value="3">3 - Moyen</SelectItem>
                    <SelectItem value="4">4 - Élevé</SelectItem>
                    <SelectItem value="5">5 - Très élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ownerId">Responsable</Label>
                <Select value={formData.ownerId} onValueChange={(value) => setFormData(prev => ({ ...prev, ownerId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Date limite</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phaseId">Phase</Label>
                <Select value={formData.phaseId} onValueChange={(value) => setFormData(prev => ({ ...prev, phaseId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={String(formData.status)} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identified">Identifié</SelectItem>
                    <SelectItem value="mitigated">Mitigé</SelectItem>
                    <SelectItem value="accepted">Accepté</SelectItem>
                    <SelectItem value="closed">Clôturé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="mitigationPlan">Plan de mitigation</Label>
                <Textarea
                  id="mitigationPlan"
                  value={formData.mitigationPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, mitigationPlan: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createRiskMutation.isPending || updateRiskMutation.isPending}>
                {editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedRiskManager;
