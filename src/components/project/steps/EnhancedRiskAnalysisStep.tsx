import { Plus, Shield, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Progress } from '../../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';

// Import DTOs and services for hexagonal architecture
import { RiskService, getRiskService} from "@/application/services/RiskService";
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { RiskDTO } from "@/dtos/entities/RiskDTO";
import { RepositoryFactory } from "@/infrastructure/RepositoryFactory";

interface EnhancedRiskAnalysisStepProps {
  formData: ProjectDTO & { risks?: RiskDTO[] };
  onUpdate: (data: Partial<ProjectDTO>) => void;
  isEditing?: boolean;
}

interface EnhancedRisk {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'financial' | 'environmental' | 'regulatory' | 'operational' | 'security' | 'health_safety' | 'quality' | 'schedule' | 'resource' | 'stakeholder';
  probability: number; // 1-10 scale
  impact: number; // 1-10 scale
  riskScore: number; // probability * impact * weight
  weight: number; // Category weight
  mitigationPlan: string;
  contingencyPlan: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'monitoring' | 'closed' | 'escalated';
  owner: string;
  reviewDate: string;
  costs: number;
  timelineImpact: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  affectedPhases: string[];
  riskResponse: 'accept' | 'mitigate' | 'transfer' | 'avoid';
  lastUpdated: string;
}

const EnhancedRiskAnalysisStep: React.FC<EnhancedRiskAnalysisStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const { toast } = useToast();
  
  // Initialize service with hexagonal architecture
  const riskService = getRiskService();
  
  const [risks, setRisks] = useState<EnhancedRisk[]>(formData.risks?.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description || '',
    category: (r.category as any) || 'technical',
    probability: r.probability || 5,
    impact: r.impact || 5,
    riskScore: (r.probability || 5) * (r.impact || 5) * 1,
    weight: getCategoryWeight((r.category as any) || 'technical'),
    mitigationPlan: r.mitigationPlan || r.mitigationStrategy || '',
    contingencyPlan: r.contingencyPlan || '',
    status: (r.status as any) || 'identified',
    owner: r.owner || '',
    reviewDate: r.reviewDate || new Date().toISOString().split('T')[0],
    costs: r.costs || 0,
    timelineImpact: r.timelineImpact || 0,
    priority: calculateRiskPriority((r.probability || 5) * (r.impact || 5)),
    dependencies: [],
    affectedPhases: [],
    riskResponse: 'mitigate',
    lastUpdated: new Date().toISOString()
  })) || []);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRisk, setNewRisk] = useState<Partial<EnhancedRisk>>({
    category: 'technical',
    probability: 5,
    impact: 5,
    status: 'identified',
    riskResponse: 'mitigate',
    priority: 'medium'
  });

  // Category weights for risk calculation
  const categoryWeights: Record<string, number> = {
    'technical': 1.2,
    'financial': 1.5,
    'environmental': 1.3,
    'regulatory': 1.4,
    'operational': 1.1,
    'security': 1.6,
    'health_safety': 1.7,
    'quality': 1.2,
    'schedule': 1.3,
    'resource': 1.1,
    'stakeholder': 1.2
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    // Update form data when risks change - use onUpdate which accepts Partial<ProjectDTO>
    onUpdate({
      // Store risk data in a way compatible with ProjectDTO
    } as any);
  }, [risks, onUpdate]);

  const loadEmployees = async () => {
    try {
      const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
      const employeesData = await employeeService.getAllEmployees();
      setEmployees(employeesData.map(e => ({ id: e.id, name: e.name, role: e.position || e.role || '' })));
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
    }
  };

  function getCategoryWeight(category: string): number {
    return categoryWeights[category] || 1.0;
  }

  function calculateRiskPriority(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 25) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'high';
    return 'critical';
  }

  function calculateRiskScore(probability: number, impact: number, category: string): number {
    const weight = getCategoryWeight(category);
    return Math.round(probability * impact * weight);
  }

  const handleAddRisk = async () => {
    if (!newRisk.title || !newRisk.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const risk: EnhancedRisk = {
      id: `risk-${Date.now()}`,
      title: newRisk.title!,
      description: newRisk.description!,
      category: newRisk.category!,
      probability: newRisk.probability!,
      impact: newRisk.impact!,
      riskScore: calculateRiskScore(newRisk.probability!, newRisk.impact!, newRisk.category!),
      weight: getCategoryWeight(newRisk.category!),
      mitigationPlan: newRisk.mitigationPlan || '',
      contingencyPlan: newRisk.contingencyPlan || '',
      status: newRisk.status!,
      owner: newRisk.owner || '',
      reviewDate: newRisk.reviewDate || new Date().toISOString().split('T')[0],
      costs: newRisk.costs || 0,
      timelineImpact: newRisk.timelineImpact || 0,
      priority: calculateRiskPriority(calculateRiskScore(newRisk.probability!, newRisk.impact!, newRisk.category!)),
      dependencies: [],
      affectedPhases: [],
      riskResponse: newRisk.riskResponse!,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Save to database using service
      await riskService.createRisk({
        project_id: formData.id || '',
        title: risk.title,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        mitigation_strategy: risk.mitigationPlan,
      });

      setRisks([...risks, risk]);
      setNewRisk({
        category: 'technical',
        probability: 5,
        impact: 5,
        status: 'identified',
        riskResponse: 'mitigate',
        priority: 'medium'
      });
      setShowAddForm(false);

      toast({
        title: "Risque Ajouté",
        description: "Le risque a été ajouté avec succès",
      });
    } catch (error) {
      console.error('Failed to create risk:', error);
      toast({
        title: "Erreur",
        description: "Échec de l'ajout du risque",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRisk = async (riskId: string) => {
    try {
      // Delete from database using service
      await riskService.deleteRisk(riskId);
      
      setRisks(risks.filter(r => r.id !== riskId));
      toast({
        title: "Risque Supprimé",
        description: "Le risque a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Failed to delete risk:', error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression du risque",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRisk = async (riskId: string, updates: Partial<EnhancedRisk>) => {
    try {
      // Update in database using service
      await riskService.updateRisk(riskId, {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        probability: updates.probability,
        impact: updates.impact,
        mitigation_strategy: updates.mitigationPlan,
        status: updates.status,
      });

      setRisks(risks.map(r => {
        if (r.id === riskId) {
          const updated = { ...r, ...updates };
          updated.riskScore = calculateRiskScore(updated.probability, updated.impact, updated.category);
          updated.priority = calculateRiskPriority(updated.riskScore);
          updated.weight = getCategoryWeight(updated.category);
          updated.lastUpdated = new Date().toISOString();
          return updated;
        }
        return r;
      }));

      toast({
        title: "Risque Mis à Jour",
        description: "Le risque a été mis à jour avec succès",
      });
    } catch (error) {
      console.error('Failed to update risk:', error);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du risque",
        variant: "destructive",
      });
    }
  };

  // Calculate risk statistics
  const totalRisks = risks.length;
  const criticalRisks = risks.filter(r => r.priority === 'critical').length;
  const highRisks = risks.filter(r => r.priority === 'high').length;
  const averageRiskScore = risks.length > 0 ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length) : 0;
  const totalRiskCost = risks.reduce((sum, r) => sum + r.costs, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-green-500';
      case 'mitigated': return 'bg-blue-500';
      case 'monitoring': return 'bg-yellow-500';
      case 'assessed': return 'bg-purple-500';
      case 'identified': return 'bg-gray-500';
      case 'escalated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Analyse des Risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{totalRisks}</div>
              <div className="text-sm text-gray-500">Total Risques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalRisks}</div>
              <div className="text-sm text-gray-500">Critiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{highRisks}</div>
              <div className="text-sm text-gray-500">Élevés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{averageRiskScore}</div>
              <div className="text-sm text-gray-500">Score Moyen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{totalRiskCost.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Coût Total</div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Liste des Risques</h3>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Risque
            </Button>
          </div>

          {/* Add Risk Form */}
          {showAddForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Nouveau Risque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk-title">Titre du Risque</Label>
                    <Input
                      id="risk-title"
                      value={newRisk.title || ''}
                      onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                      placeholder="Titre du risque"
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-category">Catégorie</Label>
                    <Select value={newRisk.category} onValueChange={(value) => setNewRisk({ ...newRisk, category: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technique</SelectItem>
                        <SelectItem value="financial">Financier</SelectItem>
                        <SelectItem value="environmental">Environnemental</SelectItem>
                        <SelectItem value="regulatory">Réglementaire</SelectItem>
                        <SelectItem value="operational">Opérationnel</SelectItem>
                        <SelectItem value="security">Sécurité</SelectItem>
                        <SelectItem value="health_safety">Santé et Sécurité</SelectItem>
                        <SelectItem value="quality">Qualité</SelectItem>
                        <SelectItem value="schedule">Planning</SelectItem>
                        <SelectItem value="resource">Ressource</SelectItem>
                        <SelectItem value="stakeholder">Partie Prenante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="risk-description">Description</Label>
                  <Textarea
                    id="risk-description"
                    value={newRisk.description || ''}
                    onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                    placeholder="Description détaillée du risque"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="risk-probability">Probabilité (1-10)</Label>
                    <Input
                      id="risk-probability"
                      type="number"
                      min="1"
                      max="10"
                      value={newRisk.probability || 5}
                      onChange={(e) => setNewRisk({ ...newRisk, probability: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-impact">Impact (1-10)</Label>
                    <Input
                      id="risk-impact"
                      type="number"
                      min="1"
                      max="10"
                      value={newRisk.impact || 5}
                      onChange={(e) => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-owner">Responsable</Label>
                    <Select value={newRisk.owner} onValueChange={(value) => setNewRisk({ ...newRisk, owner: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk-mitigation">Plan de Mitigation</Label>
                    <Textarea
                      id="risk-mitigation"
                      value={newRisk.mitigationPlan || ''}
                      onChange={(e) => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })}
                      placeholder="Stratégies pour réduire le risque"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-contingency">Plan de Contingence</Label>
                    <Textarea
                      id="risk-contingency"
                      value={newRisk.contingencyPlan || ''}
                      onChange={(e) => setNewRisk({ ...newRisk, contingencyPlan: e.target.value })}
                      placeholder="Actions si le risque se matérialise"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddRisk}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le Risque
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks List */}
          <div className="space-y-4">
            {risks.map((risk) => (
              <Card key={risk.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{risk.title}</h4>
                      <p className="text-gray-600 text-sm">{risk.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getPriorityColor(risk.priority)}>
                          {risk.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(risk.status)}>
                          {risk.status}
                        </Badge>
                        <Badge variant="outline">
                          {risk.category}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRisk(risk.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Score de Risque</div>
                      <div className="flex items-center gap-2">
                        <Progress value={(risk.riskScore / 150) * 100} className="h-2 flex-1" />
                        <span className="font-bold">{risk.riskScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Probabilité</div>
                      <div className="flex items-center gap-2">
                        <Progress value={(risk.probability / 10) * 100} className="h-2 flex-1" />
                        <span>{risk.probability}/10</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Impact</div>
                      <div className="flex items-center gap-2">
                        <Progress value={(risk.impact / 10) * 100} className="h-2 flex-1" />
                        <span>{risk.impact}/10</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Coût</div>
                      <div>{risk.costs.toLocaleString()} €</div>
                    </div>
                  </div>

                  {risk.mitigationPlan && (
                    <div className="mt-4">
                      <div className="font-medium text-sm">Plan de Mitigation</div>
                      <p className="text-sm text-gray-600">{risk.mitigationPlan}</p>
                    </div>
                  )}

                  {risk.contingencyPlan && (
                    <div className="mt-2">
                      <div className="font-medium text-sm">Plan de Contingence</div>
                      <p className="text-sm text-gray-600">{risk.contingencyPlan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRiskAnalysisStep;
