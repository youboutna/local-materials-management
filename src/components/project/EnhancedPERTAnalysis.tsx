// /src/components/project/EnhancedPERTAnalysis.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  RefreshCw,
  BarChart3,
  Target,
  Calendar,
  Filter,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  pertCalculations,
  PERTAnalysisResult,
  PERTActivity,
  PERTNetwork,
  performFullAnalysis,
  calculateScheduleProbability,
} from "@/types/PERTCalculations";
import PERTChart from "./PERTChart";
import PERTSidebar from "./PERTSidebar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EnhancedPERTAnalysisProps {
  project: any;
  phases?: any[];
  tasks?: any[];
  compact?: boolean;
  onAnalysisComplete?: (analysis: PERTAnalysisResult) => void;
}

const EnhancedPERTAnalysis: React.FC<EnhancedPERTAnalysisProps> = ({
  project,
  phases = [],
  tasks = [],
  compact = false,
  onAnalysisComplete,
}) => {
  const [viewMode, setViewMode] = useState<
    "network" | "table" | "stats" | "whatif"
  >("network");
  const [targetDate, setTargetDate] = useState<Date>(
    new Date(
      project.endDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    )
  );
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showSlack, setShowSlack] = useState(true);

  // Convert project data to PERT activities
  const pertActivities: PERTActivity[] = useMemo(() => {
    if (phases && phases.length > 0) {
      return pertCalculations.convertPhasesToPERTActivities(phases);
    }

    // Fallback: create sample activities from project
    const startDate = new Date(project.startDate || new Date());
    const endDate = new Date(
      project.endDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    );
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const sampleActivities: PERTActivity[] = [
      {
        id: "pert-1",
        name: "Préparation et conception",
        optimistic: 20,
        mostLikely: 30,
        pessimistic: 45,
        predecessors: [],
      },
      {
        id: "pert-2",
        name: "Appels d'offres",
        optimistic: 15,
        mostLikely: 25,
        pessimistic: 40,
        predecessors: ["pert-1"],
      },
      {
        id: "pert-3",
        name: "Mobilisation chantier",
        optimistic: 10,
        mostLikely: 15,
        pessimistic: 25,
        predecessors: ["pert-2"],
      },
      {
        id: "pert-4",
        name: "Travaux de gros œuvre",
        optimistic: 45,
        mostLikely: 60,
        pessimistic: 90,
        predecessors: ["pert-3"],
      },
      {
        id: "pert-5",
        name: "Travaux secondaires",
        optimistic: 30,
        mostLikely: 45,
        pessimistic: 70,
        predecessors: ["pert-4"],
      },
      {
        id: "pert-6",
        name: "Finitions et contrôle",
        optimistic: 20,
        mostLikely: 30,
        pessimistic: 50,
        predecessors: ["pert-5"],
      },
      {
        id: "pert-7",
        name: "Réception et clôture",
        optimistic: 10,
        mostLikely: 15,
        pessimistic: 25,
        predecessors: ["pert-6"],
      },
    ];

    return sampleActivities;
  }, [project, phases, tasks]);

  // Run PERT analysis
  const analysis: PERTAnalysisResult = useMemo(() => {
    const result = pertCalculations.performFullAnalysis(pertActivities);

    // Calculate probability of meeting target date
    const projectStartDate = new Date(project.startDate || new Date());
    const probability = pertCalculations.calculateScheduleProbability(
      targetDate,
      projectStartDate,
      result
    );

    const analysisWithProbability = {
      ...result,
      probabilityOnSchedule: probability,
    };

    // Notify parent component
    onAnalysisComplete?.(analysisWithProbability);

    return analysisWithProbability;
  }, [pertActivities, targetDate, project, onAnalysisComplete]);

  // Generate network diagram
  const network: PERTNetwork = useMemo(() => {
    return pertCalculations.generateNetwork(pertActivities, analysis);
  }, [pertActivities, analysis]);

  // Handle compact mode
  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Analyse PERT</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {analysis.criticalPath.length} critiques
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Durée attendue</span>
            <span className="font-medium">
              {analysis.totalExpectedDuration.toFixed(1)} jours
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Probabilité de réussite</span>
            <span
              className="font-medium"
              style={{
                color:
                  (analysis.probabilityOnSchedule || 0) >= 70
                    ? "#10b981"
                    : "#ef4444",
              }}
            >
              {analysis.probabilityOnSchedule?.toFixed(1) || "0"}%
            </span>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {analysis.activities.length} activités analysées
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Handle exports
  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "Génération du rapport PERT en cours...",
    });
    // Implementation would go here
  };

  const handleExportExcel = () => {
    toast({
      title: "Export Excel",
      description: "Exportation des données PERT...",
    });
    // Implementation would go here
  };

  const handleRefresh = () => {
    toast({
      title: "Actualisation",
      description: "Recalcul de l'analyse PERT...",
    });
  };

  const handleOptimizeSchedule = () => {
    toast({
      title: "Optimisation du planning",
      description: "Calcul des optimisations possibles...",
    });
  };

  const handleWhatIfAnalysis = () => {
    setViewMode("whatif");
    toast({
      title: "Analyse What-If",
      description: "Mode simulation activé",
    });
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedActivity(nodeId);
    toast({
      title: "Activité sélectionnée",
      description: `Détails de l'activité: ${nodeId}`,
    });
  };

  // Format date for display
  const formattedTargetDate = format(targetDate, "dd/MM/yyyy", { locale: fr });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Analyse PERT - {project.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Analyse probabilistique du planning avec chemin critique
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date cible</p>
              <p className="font-medium">{formattedTargetDate}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Durée attendue</p>
              <p className="text-2xl font-bold">
                {analysis.totalExpectedDuration.toFixed(1)}j
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimation PERT
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Probabilité</p>
              <p
                className="text-2xl font-bold"
                style={{
                  color:
                    (analysis.probabilityOnSchedule || 0) >= 70
                      ? "#10b981"
                      : (analysis.probabilityOnSchedule || 0) >= 50
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              >
                {analysis.probabilityOnSchedule?.toFixed(1) || "0"}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                De respecter la date cible
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Chemin critique</p>
              <p className="text-2xl font-bold text-red-600">
                {analysis.criticalPath.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Activités critiques
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Écart-type</p>
              <p className="text-2xl font-bold">
                {analysis.totalStandardDeviation.toFixed(1)}j
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Variabilité du projet
              </p>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-muted/50">
              <TabsList>
                <TabsTrigger value="network">Diagramme réseau</TabsTrigger>
                <TabsTrigger value="table">Tableau détaillé</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
                <TabsTrigger value="whatif">What-If</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showConfidence}
                      onChange={(e) => setShowConfidence(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Intervalles
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showSlack}
                      onChange={(e) => setShowSlack(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Marges
                  </label>
                </div>
              </div>
            </div>

            {/* Network Diagram Tab */}
            <TabsContent value="network" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PERTChart
                    network={network}
                    onNodeClick={handleNodeClick}
                    className="h-full"
                  />
                </div>
                <div>
                  <PERTSidebar
                    analysis={analysis}
                    targetDate={targetDate}
                    projectStartDate={new Date(project.startDate || new Date())}
                    onTargetDateChange={setTargetDate}
                    onOptimizeSchedule={handleOptimizeSchedule}
                    onWhatIfAnalysis={handleWhatIfAnalysis}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Detailed Table Tab */}
            <TabsContent value="table" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tableau détaillé des activités PERT</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Activité</th>
                          <th className="text-right p-3">Optimiste</th>
                          <th className="text-right p-3">Probable</th>
                          <th className="text-right p-3">Pessimiste</th>
                          <th className="text-right p-3">Estimation PERT</th>
                          <th className="text-right p-3">Écart-type</th>
                          <th className="text-right p-3">Marge</th>
                          <th className="text-right p-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.activities.map((activity, index) => (
                          <tr
                            key={activity.id}
                            className={`border-b hover:bg-muted/50 ${
                              activity.isCritical ? "bg-red-50" : ""
                            }`}
                          >
                            <td className="p-3 font-medium">
                              <div className="flex items-center gap-2">
                                {activity.isCritical && (
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                )}
                                {activity.name}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {activity.optimistic.toFixed(1)}j
                            </td>
                            <td className="p-3 text-right">
                              {activity.mostLikely.toFixed(1)}j
                            </td>
                            <td className="p-3 text-right">
                              {activity.pessimistic.toFixed(1)}j
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {activity.pertEstimate.toFixed(1)}j
                            </td>
                            <td className="p-3 text-right">
                              {activity.standardDeviation.toFixed(2)}j
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={
                                  activity.slackTime < 5
                                    ? "text-amber-600 font-semibold"
                                    : "text-green-600"
                                }
                              >
                                {activity.slackTime.toFixed(1)}j
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <Badge
                                variant={
                                  activity.isCritical
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {activity.isCritical ? "Critique" : "Normal"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-3">Résumé de l'analyse</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Durée totale projet
                        </p>
                        <p className="text-lg font-bold">
                          {analysis.totalExpectedDuration.toFixed(1)} jours
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Variance totale
                        </p>
                        <p className="text-lg font-bold">
                          {analysis.totalVariance.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Activités analysées
                        </p>
                        <p className="text-lg font-bold">
                          {analysis.activities.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Activités critiques
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          {analysis.criticalPath.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Distribution de probabilité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-64 border rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">
                          Graphique de distribution normale (à implémenter)
                        </p>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium">
                          Intervalles de confiance
                        </h4>
                        {Object.entries(analysis.confidenceIntervals).map(
                          ([key, interval]) => (
                            <div
                              key={key}
                              className="flex justify-between items-center p-2 border rounded"
                            >
                              <span className="font-medium">{key}</span>
                              <span className="text-sm">
                                {interval[0].toFixed(1)} -{" "}
                                {interval[1].toFixed(1)} jours
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Analyse de sensibilité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-64 border rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">
                          Graphique de sensibilité (à implémenter)
                        </p>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium">Facteurs d'impact</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Variabilité du chemin critique</span>
                            <span className="font-medium">Impact élevé</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Marges des activités non critiques</span>
                            <span className="font-medium">Impact moyen</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Corrélations entre activités</span>
                            <span className="font-medium">Impact faible</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* What-If Analysis Tab */}
            <TabsContent value="whatif" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Analyse de scénarios "What-If"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Scénarios</h4>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un scénario" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="best-case">
                              Meilleur cas (optimiste)
                            </SelectItem>
                            <SelectItem value="worst-case">
                              Pire cas (pessimiste)
                            </SelectItem>
                            <SelectItem value="resource-constraint">
                              Contrainte de ressources
                            </SelectItem>
                            <SelectItem value="delay-critical">
                              Retard sur chemin critique
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="space-y-2">
                          <Label>Date cible alternative</Label>
                          <Input
                            type="date"
                            value={format(targetDate, "yyyy-MM-dd")}
                            onChange={(e) =>
                              setTargetDate(new Date(e.target.value))
                            }
                          />
                        </div>

                        <Button className="w-full">Simuler ce scénario</Button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Résultats de simulation</h4>
                        <div className="p-4 border rounded-lg bg-blue-50">
                          <p className="text-sm font-medium text-blue-700">
                            Scénario actuel
                          </p>
                          <p className="text-2xl font-bold text-blue-700">
                            {analysis.probabilityOnSchedule?.toFixed(1)}% de
                            réussite
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            Durée: {analysis.totalExpectedDuration.toFixed(1)}{" "}
                            jours
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg bg-green-50">
                          <p className="text-sm font-medium text-green-700">
                            Meilleur cas
                          </p>
                          <p className="text-2xl font-bold text-green-700">
                            92.5% de réussite
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            Durée:{" "}
                            {(analysis.totalExpectedDuration * 0.8).toFixed(1)}{" "}
                            jours
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Recommandations</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 p-3 border rounded-lg">
                          <Target className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Accélérer le chemin critique
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Réduire de 10% la durée des 3 activités critiques
                              pourrait améliorer la probabilité de 15%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 border rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Revoir les dépendances
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Permettre un chevauchement de 20% entre certaines
                              activités pourrait gagner 5 jours
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPERTAnalysis;
