import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { useToast } from '../../../hooks/use-toast';
import { toDateInput } from '@/lib/utils';

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO, } from "@/dtos/entities/ProjectDTO";
import { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { RiskDTO, RiskCategory, RiskStatus, RiskProbability, RiskImpact, CreateRiskDTO, UpdateRiskDTO, RISK_CATEGORY_LABELS, PROBABILITY_LABELS, IMPACT_LABELS } from "@/dtos/entities/RiskDTO";
import { EmployeeDTO } from "@/dtos/entities/EmployeeDTO";

// Import hexagonal hook for employees (Rule #5: UI Layer Separation)
import { useActiveEmployeesHex } from "@/hooks/hexagonal/useActiveEmployeesHex";

interface RiskAnalysisStepProps {
  workflowData: ProjectWorkflowData | null;
  onStepComplete: (stepData: { risks: RiskDTO[] }) => void;
  isEditing?: boolean;
  mode?: 'create' | 'edit';
}

// Use existing RiskDTO instead of redefining RiskDTO (following PROMPTS.md Rule #4)

const RiskAnalysisStep: React.FC<RiskAnalysisStepProps> = ({
  workflowData,
  onStepComplete,
  isEditing = false,
  mode = isEditing ? 'edit' : 'create',
}) => {
  const projectData = workflowData?.projectData || {} as ProjectDTO;
  const existingRisks = workflowData?.relatedData?.risks || [];
  const { toast } = useToast();
  const [risks, setRisks] = useState<RiskDTO[]>(existingRisks || []);
  
  // Use hexagonal hook for employees (Rule #5: UI Layer Separation)
  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useActiveEmployeesHex();

  // Remove local definitions - use centralized DTO mappings (Rule #4: No type redefinition)

  const addRisk = () => {
    const newRisk: CreateRiskDTO = {
      title: '',
      description: '',
      category: RiskCategory.TECHNICAL,
      probability: 0.6, // 0.0-1.0 scale
      impact: 0.6, // 0.0-1.0 scale
      mitigationStrategy: '',
      mitigationPlan: '',
      assignedTo: '',
      owner: '', // Primary risk owner
      projectId: projectData.id,
      // Additional UI fields
      reviewDate: '',
      costs: 0,
      timelineImpact: 0
    };
    
    // Fallback to local state management
    const riskDTO: RiskDTO = {
      id: Date.now().toString(),
      ...newRisk,
      status: RiskStatus.IDENTIFIED,
      riskScore: newRisk.probability * newRisk.impact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedRisks = [...risks, riskDTO];
    setRisks(updatedRisks);
    onStepComplete({ risks: updatedRisks });
  };

  const updateRisk = (id: string, updates: Partial<RiskDTO>) => {
    // Fallback to local state management
    const updatedRisks = risks.map(risk => {
      if (risk.id === id) {
        const updated = { ...risk, ...updates };
        // Recalculate risk score if probability or impact changed
        if (updates.probability !== undefined || updates.impact !== undefined) {
          updated.riskScore = (updated.probability || 0) * (updated.impact || 0);
        }
        return updated;
      }
      return risk;
    });
    
    setRisks(updatedRisks);
    onStepComplete({ risks: updatedRisks });
  };

  const removeRisk = (id: string) => {
    // Fallback to local state management
    const updatedRisks = risks.filter(risk => risk.id !== id);
    setRisks(updatedRisks);
    onStepComplete({ risks: updatedRisks });
  };

  const getRiskScoreColor = (score: number | undefined) => {
    const safeScore = score || 0;
    if (safeScore <= 5) return 'bg-green-500';
    if (safeScore <= 10) return 'bg-yellow-500';
    if (safeScore <= 15) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRiskScoreLabel = (score: number | undefined) => {
    const safeScore = score || 0;
    if (safeScore <= 5) return 'Faible';
    if (safeScore <= 10) return 'Modéré';
    if (safeScore <= 15) return 'Élevé';
    return 'Critique';
  };

  const getCategoryColor = (category: string) => {
    return RISK_CATEGORY_LABELS[category as RiskCategory]?.color || 'bg-gray-100 text-gray-800';
  };

  const calculateRiskMetrics = () => {
    const totalRisks = risks.length;
    const highRisks = risks.filter(r => (r.riskScore || 0) > 15).length;
    const mitigatedRisks = risks.filter(r => r.status === 'mitigated').length;
    const averageScore = totalRisks > 0 ? risks.reduce((sum, r) => sum + (r.riskScore || 0), 0) / totalRisks : 0;
    
    return { totalRisks, highRisks, mitigatedRisks, averageScore };
  };

  const metrics = calculateRiskMetrics();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Analyse des Risques
        </CardTitle>
        
        {/* Risk Metrics Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{metrics.totalRisks}</p>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Critiques</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{metrics.highRisks}</p>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Mitigés</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{metrics.mitigatedRisks}</p>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Score moyen</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{metrics.averageScore.toFixed(1)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Registre des risques</h4>
            <Button onClick={addRisk} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un risque
            </Button>
          </div>

          <div className="space-y-4">
            {risks.map((risk) => (
              <div key={risk.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Titre du risque *</label>
                        <input
                          type="text"
                          placeholder="Ex: Retard de livraison des matériaux"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={risk.title}
                          onChange={(e) => updateRisk(risk.id, { title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Catégorie</label>
                        <Select
                          value={risk.category}
                          onValueChange={(value) => updateRisk(risk.id, { category: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(RISK_CATEGORY_LABELS).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                {value.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description détaillée</label>
                      <textarea
                        placeholder="Décrivez le risque et ses causes potentielles"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
                        value={risk.description}
                        onChange={(e) => updateRisk(risk.id, { description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Probabilité</label>
                        <Select
                          value={risk.probability.toString()}
                          onValueChange={(value) => updateRisk(risk.id, { probability: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PROBABILITY_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {value} - {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Impact</label>
                        <Select
                          value={risk.impact.toString()}
                          onValueChange={(value) => updateRisk(risk.id, { impact: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(IMPACT_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {value} - {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Responsable</label>
                        <Select
                          value={risk.owner}
                          onValueChange={(value) => updateRisk(risk.id, { owner: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.full_name} - {emp.position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Plan de mitigation</label>
                        <textarea
                          placeholder="Actions pour réduire la probabilité ou l'impact"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent min-h-[60px]"
                          value={risk.mitigationPlan}
                          onChange={(e) => updateRisk(risk.id, { mitigationPlan: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Plan de contingence</label>
                        <textarea
                          placeholder="Actions si le risque se réalise"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent min-h-[60px]"
                          value={risk.contingencyPlan}
                          onChange={(e) => updateRisk(risk.id, { contingencyPlan: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Statut</label>
                        <Select
                          value={risk.status}
                          onValueChange={(value) => updateRisk(risk.id, { status: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="identified">Identifié</SelectItem>
                            <SelectItem value="assessed">Évalué</SelectItem>
                            <SelectItem value="mitigated">Mitigé</SelectItem>
                            <SelectItem value="monitoring">Surveillance</SelectItem>
                            <SelectItem value="closed">Fermé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Date de révision</label>
                        <input
                          type="date"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={toDateInput(risk.reviewDate)}
                          onChange={(e) => updateRisk(risk.id, { reviewDate: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Coût (€)</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={risk.costs || ''}
                          onChange={(e) => updateRisk(risk.id, { costs: parseFloat(e.target.value) })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Impact délai (jours)</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={risk.timelineImpact || ''}
                          onChange={(e) => updateRisk(risk.id, { timelineImpact: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(risk.category)}>
                        {RISK_CATEGORY_LABELS[risk.category as RiskCategory]?.label}
                      </Badge>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Score de risque:</span>
                        <div className={`px-2 py-1 rounded text-white text-sm font-medium ${getRiskScoreColor(risk.riskScore)}`}>
                          {risk.riskScore || 0} - {getRiskScoreLabel(risk.riskScore)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRisk(risk.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {risks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucun risque identifié</h3>
              <p className="text-sm mb-4">
                Commencez par identifier les risques potentiels de votre projet
              </p>
              <Button onClick={addRisk} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter le premier risque
              </Button>
            </div>
          )}

          {/* Risk Matrix Visualization */}
          {risks.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Matrice des risques</h4>
              <div className="grid grid-cols-5 gap-1 max-w-md">
                {[5, 4, 3, 2, 1].map(impact => (
                  [1, 2, 3, 4, 5].map(probability => {
                    const score = probability * impact;
                    const risksInCell = risks.filter(r => r.probability === probability && r.impact === impact);
                    return (
                      <div
                        key={`${probability}-${impact}`}
                        className={`
                          h-8 w-8 border flex items-center justify-center text-xs font-medium text-white
                          ${getRiskScoreColor(score)}
                        `}
                        title={`P:${probability}, I:${impact}, Score:${score}`}
                      >
                        {risksInCell.length}
                      </div>
                    );
                  })
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Axe horizontal: Probabilité (1=Faible, 5=Élevée)</p>
                <p>Axe vertical: Impact (1=Faible, 5=Élevé)</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAnalysisStep;