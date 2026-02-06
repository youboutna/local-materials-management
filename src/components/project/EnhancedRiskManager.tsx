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
    risk_title: '',
    risk_description: '',
    probability_numeric: '',
    impact_numeric: '',
    mitigation_plan: '',
    status_new: 'identified',
    owner_id: '',
    due_date: '',
    related_tasks: [],
    phase_id: '',
    construction_phase: '',
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
      const probability = parseInt(formData.probability_numeric);
      const impact = parseInt(formData.impact_numeric);
      const riskScore = calculateRiskScore(probability, impact);
      const riskLevel = getRiskLevel(riskScore);

      const riskData = {
        risk_title: formData.risk_title,
        risk_description: formData.risk_description,
        probability_numeric: probability,
        impact_numeric: impact,
        risk_score: riskScore,
        risk_level: riskLevel,
        mitigation_plan: formData.mitigation_plan,
        status_new: formData.status_new,
        owner_id: formData.owner_id,
        due_date: formData.due_date,
        phase_id: formData.phase_id,
        project_id: projectId,
        identified_by: 'current_user', // This should come from auth context
        identified_date: new Date().toISOString(),
      };

      if (editingId) {
        await updateRiskMutation.mutateAsync({ id: editingId, data: riskData });
        setEditingId(null);
      } else {
        await createRiskMutation.mutateAsync(riskData);
      }

      // Reset form
      setFormData({
        risk_title: '',
        risk_description: '',
        probability_numeric: '',
        impact_numeric: '',
        mitigation_plan: '',
        status_new: 'identified',
        owner_id: '',
        due_date: '',
        related_tasks: [],
        phase_id: '',
        construction_phase: '',
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
      risk_title: risk.risk_title,
      risk_description: risk.risk_description || '',
      probability_numeric: risk.probability_numeric?.toString() || '',
      impact_numeric: risk.impact_numeric?.toString() || '',
      mitigation_plan: risk.mitigation_plan || '',
      status_new: risk.status_new || 'identified',
      owner_id: risk.owner_id || '',
      due_date: risk.due_date || '',
      related_tasks: [],
      phase_id: risk.phase_id || '',
      construction_phase: '',
      applyToAllPhases: false,
      selectedPhases: [],
    });
    setEditingId(risk.id);
    setIsCreating(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('ÃŠtes-vous sÃ»r de vouloir supprimer ce risque ?')) {
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
    return getRiskLevel(risk.risk_score || 0) === selectedRiskLevel;
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
                  <h3 className="text-lg font-semibold mb-2">{risk.risk_title}</h3>
                  <p className="text-muted-foreground mb-3">{risk.risk_description}</p>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getRiskLevelColor(getRiskLevel(risk.risk_score || 0))}>
                      {getRiskLevel(risk.risk_score || 0).toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      Score: {risk.risk_score || 0}
                    </Badge>
                    <Badge variant="outline">
                      {risk.status_new || 'IdentifiÃ©'}
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
                  <span className="text-muted-foreground">ProbabilitÃ©:</span>
                  <span className="ml-2">{risk.probability_numeric}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Impact:</span>
                  <span className="ml-2">{risk.impact_numeric}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Responsable:</span>
                  <span className="ml-2">
                    {employees.find(emp => emp.id === risk.owner_id)?.full_name || 'Non assignÃ©'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date limite:</span>
                  <span className="ml-2">{risk.due_date || 'Non dÃ©finie'}</span>
                </div>
              </div>

              {risk.mitigation_plan && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Plan de mitigation:</h4>
                  <p className="text-sm text-muted-foreground">{risk.mitigation_plan}</p>
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
              {editingId ? 'Modifier le risque' : 'CrÃ©er un nouveau risque'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="risk_title">Titre du risque</Label>
                <Input
                  id="risk_title"
                  value={formData.risk_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, risk_title: e.target.value }))}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="risk_description">Description</Label>
                <Textarea
                  id="risk_description"
                  value={formData.risk_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, risk_description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="probability_numeric">ProbabilitÃ© (1-5)</Label>
                <Select value={formData.probability_numeric} onValueChange={(value) => setFormData(prev => ({ ...prev, probability_numeric: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - TrÃ¨s faible</SelectItem>
                    <SelectItem value="2">2 - Faible</SelectItem>
                    <SelectItem value="3">3 - Moyenne</SelectItem>
                    <SelectItem value="4">4 - Ã‰levÃ©e</SelectItem>
                    <SelectItem value="5">5 - TrÃ¨s Ã©levÃ©e</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="impact_numeric">Impact (1-5)</Label>
                <Select value={formData.impact_numeric} onValueChange={(value) => setFormData(prev => ({ ...prev, impact_numeric: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - TrÃ¨s faible</SelectItem>
                    <SelectItem value="2">2 - Faible</SelectItem>
                    <SelectItem value="3">3 - Moyen</SelectItem>
                    <SelectItem value="4">4 - Ã‰levÃ©</SelectItem>
                    <SelectItem value="5">5 - TrÃ¨s Ã©levÃ©</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="owner_id">Responsable</Label>
                <Select value={formData.owner_id} onValueChange={(value) => setFormData(prev => ({ ...prev, owner_id: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name} ({employee.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Date limite</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phase_id">Phase</Label>
                <Select value={formData.phase_id} onValueChange={(value) => setFormData(prev => ({ ...prev, phase_id: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.phase_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status_new">Statut</Label>
                <Select value={formData.status_new} onValueChange={(value) => setFormData(prev => ({ ...prev, status_new: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identified">IdentifiÃ©</SelectItem>
                    <SelectItem value="mitigated">MitigÃ©</SelectItem>
                    <SelectItem value="accepted">AcceptÃ©</SelectItem>
                    <SelectItem value="closed">ClÃ´turÃ©</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="mitigation_plan">Plan de mitigation</Label>
                <Textarea
                  id="mitigation_plan"
                  value={formData.mitigation_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, mitigation_plan: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createRiskMutation.isPending || updateRiskMutation.isPending}>
                {editingId ? 'Mettre Ã  jour' : 'CrÃ©er'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedRiskManager;
