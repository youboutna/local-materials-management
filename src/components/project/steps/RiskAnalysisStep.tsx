import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface Risk {
  id: string;
  name: string;
  description: string;
  category: string;
  probability: string;
  impact: string;
  severity: string;
  mitigation: string;
  responsible: string;
  status: string;
}

interface RiskAnalysisStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

const RiskAnalysisStep: React.FC<RiskAnalysisStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const [risks, setRisks] = useState<Risk[]>(formData.risks || []);
  const [newRisk, setNewRisk] = useState<Partial<Risk>>({
    name: '',
    description: '',
    category: 'technique',
    probability: 'moyenne',
    impact: 'moyen',
    mitigation: '',
    responsible: '',
    status: 'identifié'
  });

  const riskCategories = [
    { value: 'technique', label: 'Technique' },
    { value: 'financier', label: 'Financier' },
    { value: 'planning', label: 'Planning' },
    { value: 'environnemental', label: 'Environnemental' },
    { value: 'juridique', label: 'Juridique' },
    { value: 'ressources', label: 'Ressources humaines' }
  ];

  const probabilityLevels = [
    { value: 'faible', label: 'Faible', color: 'bg-green-100 text-green-800' },
    { value: 'moyenne', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'elevee', label: 'Élevée', color: 'bg-red-100 text-red-800' }
  ];

  const impactLevels = [
    { value: 'faible', label: 'Faible', color: 'bg-green-100 text-green-800' },
    { value: 'moyen', label: 'Moyen', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'eleve', label: 'Élevé', color: 'bg-red-100 text-red-800' }
  ];

  const calculateSeverity = (probability: string, impact: string): string => {
    const probValue = probability === 'faible' ? 1 : probability === 'moyenne' ? 2 : 3;
    const impactValue = impact === 'faible' ? 1 : impact === 'moyen' ? 2 : 3;
    const severity = probValue * impactValue;
    
    if (severity <= 2) return 'faible';
    if (severity <= 4) return 'moyen';
    return 'eleve';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'faible': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'eleve': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addRisk = () => {
    if (!newRisk.name || !newRisk.description) return;
    
    const risk: Risk = {
      id: Date.now().toString(),
      name: newRisk.name,
      description: newRisk.description,
      category: newRisk.category || 'technique',
      probability: newRisk.probability || 'moyenne',
      impact: newRisk.impact || 'moyen',
      severity: calculateSeverity(newRisk.probability || 'moyenne', newRisk.impact || 'moyen'),
      mitigation: newRisk.mitigation || '',
      responsible: newRisk.responsible || '',
      status: newRisk.status || 'identifié'
    };
    
    const updatedRisks = [...risks, risk];
    setRisks(updatedRisks);
    onUpdate({ risks: updatedRisks });
    
    setNewRisk({
      name: '',
      description: '',
      category: 'technique',
      probability: 'moyenne',
      impact: 'moyen',
      mitigation: '',
      responsible: '',
      status: 'identifié'
    });
  };

  const removeRisk = (id: string) => {
    const updatedRisks = risks.filter(risk => risk.id !== id);
    setRisks(updatedRisks);
    onUpdate({ risks: updatedRisks });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Analyse et Mitigation des Risques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Formulaire d'ajout de risque */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-medium mb-4">Identifier un nouveau risque</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du risque *</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: Retard de livraison matériaux"
                    value={newRisk.name || ''}
                    onChange={(e) => setNewRisk({...newRisk, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={newRisk.category || 'technique'}
                    onChange={(e) => setNewRisk({...newRisk, category: e.target.value})}
                  >
                    {riskCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Description détaillée du risque et de ses causes potentielles"
                  rows={3}
                  value={newRisk.description || ''}
                  onChange={(e) => setNewRisk({...newRisk, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Probabilité</label>
                  <select 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={newRisk.probability || 'moyenne'}
                    onChange={(e) => setNewRisk({...newRisk, probability: e.target.value})}
                  >
                    {probabilityLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Impact</label>
                  <select 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={newRisk.impact || 'moyen'}
                    onChange={(e) => setNewRisk({...newRisk, impact: e.target.value})}
                  >
                    {impactLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Plan de mitigation</label>
                <textarea 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Actions préventives et correctives pour réduire le risque"
                  rows={2}
                  value={newRisk.mitigation || ''}
                  onChange={(e) => setNewRisk({...newRisk, mitigation: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Responsable</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Personne responsable du suivi de ce risque"
                  value={newRisk.responsible || ''}
                  onChange={(e) => setNewRisk({...newRisk, responsible: e.target.value})}
                />
              </div>
              
              <Button onClick={addRisk} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le risque
              </Button>
            </div>
          </div>

          {/* Liste des risques identifiés */}
          <div>
            <h3 className="text-lg font-medium mb-4">Risques identifiés ({risks.length})</h3>
            {risks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun risque identifié pour le moment
              </div>
            ) : (
              <div className="space-y-4">
                {risks.map((risk) => (
                  <div key={risk.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{risk.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRisk(risk.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{risk.category}</Badge>
                      <Badge className={probabilityLevels.find(p => p.value === risk.probability)?.color}>
                        Probabilité: {probabilityLevels.find(p => p.value === risk.probability)?.label}
                      </Badge>
                      <Badge className={impactLevels.find(i => i.value === risk.impact)?.color}>
                        Impact: {impactLevels.find(i => i.value === risk.impact)?.label}
                      </Badge>
                      <Badge className={getSeverityColor(risk.severity)}>
                        Criticité: {risk.severity}
                      </Badge>
                    </div>
                    
                    {risk.mitigation && (
                      <div className="text-sm">
                        <strong>Plan de mitigation:</strong> {risk.mitigation}
                      </div>
                    )}
                    
                    {risk.responsible && (
                      <div className="text-sm mt-1">
                        <strong>Responsable:</strong> {risk.responsible}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAnalysisStep;