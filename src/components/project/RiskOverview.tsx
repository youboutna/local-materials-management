// components/project/RiskOverview.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RiskOverviewProps {
  risks: any[];
  projectId: string;
}

const RiskOverview: React.FC<RiskOverviewProps> = ({ risks, projectId }) => {
  const navigate = useNavigate();
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  const getRiskSeverity = (probability: number, impact: number) => {
    const score = probability * impact / 100;
    if (score >= 56) return { label: "Critique", color: "bg-red-100 text-red-800 border-red-200" };
    if (score >= 36) return { label: "Élevé", color: "bg-orange-100 text-orange-800 border-orange-200" };
    if (score >= 16) return { label: "Moyen", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    return { label: "Faible", color: "bg-green-100 text-green-800 border-green-200" };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Risques du projet</h3>
        <Button onClick={() => navigate(`/projects/${projectId}/risks/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau risque
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {risks.map((risk, index) => {
          const severity = getRiskSeverity(risk.probability, risk.impact);
          
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{risk.title}</span>
                  <Badge className={severity.color}>{severity.label}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm">{risk.description}</p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">Probabilité: </span>
                      {risk.probability}%
                    </div>
                    <div>
                      <span className="font-medium">Impact: </span>
                      {risk.impact}%
                    </div>
                    <div>
                      <span className="font-medium">Score: </span>
                      {(risk.probability * risk.impact / 100).toFixed(1)}
                    </div>
                  </div>

                  {risk.mitigationPlan && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Plan d'atténuation:</h4>
                      <p className="text-sm">{risk.mitigationPlan}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{risk.status}</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedRisk(expandedRisk === risk.id ? null : risk.id)}
                    >
                      {expandedRisk === risk.id ? "Moins" : "Plus"} de détails
                    </Button>
                  </div>

                  {expandedRisk === risk.id && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Détails supplémentaires:</h4>
                      <p className="text-sm">Identifié le: {new Date(risk.createdAt || risk.created_at).toLocaleDateString()}</p>
                      {risk.relatedTasks && risk.relatedTasks.length > 0 && (
                        <p className="text-sm mt-1">
                          Tâches associées: {risk.relatedTasks.length}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {risks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground text-center mb-4">
              Aucun risque identifié pour ce projet
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/risks/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un risque
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RiskOverview;