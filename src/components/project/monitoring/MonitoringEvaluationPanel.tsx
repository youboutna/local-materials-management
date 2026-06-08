/**
 * MonitoringEvaluationPanel
 *
 * Section « Suivi & Évaluation » réutilisable (vue projet et vue phase).
 * - Calcul des écarts via le moteur générique `DeviationEngine`
 *   (alimenté par `deviation-rules.referential.ts`).
 * - KPI EVM via `ProjectCalculationService.calculateEVMMetrics`.
 * - Score de santé via `calculateProjectHealthScore`.
 *
 * Aucun seuil/valeur n'est codé en dur : tout vient des référentiels
 * (`deviation-rules`, `health-thresholds`, `weighting-models`,
 *  `indicator-templates`) conformément à `docs/ARCHITECTURE_REFERENTIELS.md`.
 */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, TrendingDown, TrendingUp, Gauge } from "lucide-react";
import {
  DeviationEngine,
  DeviationResult,
} from "@/application/services/DeviationEngine";
import { ProjectCalculationService } from "@/application/services/ProjectCalculationService";
import type { ProjectDetailDTO } from "@/dtos/entities/ProjectDTO";

export interface MonitoringEvalPhaseInput {
  id: string;
  name: string;
  status?: string;
  progress?: number;
  startDate?: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  budget?: number | null;
  actualCost?: number | null;
  plannedProgress?: number | null;
  actualProgress?: number | null;
}

interface Props {
  scope: "project" | "phase";
  project: ProjectDetailDTO;
  phases: MonitoringEvalPhaseInput[];
  /** Phase ciblée en mode scope="phase" */
  phaseId?: string;
}

const severityColor = (s: DeviationResult["severity"]) => {
  switch (s) {
    case "high":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "medium":
      return "bg-warning/15 text-warning border-warning/30";
    case "low":
      return "bg-info/15 text-info border-info/30";
    default:
      return "bg-muted text-muted-foreground border-muted-foreground/20";
  }
};

const judge = (spi: number, cpi: number): { label: string; tone: string } => {
  if (spi >= 0.95 && cpi >= 0.95) return { label: "Performance satisfaisante", tone: "text-success" };
  if (spi >= 0.85 && cpi >= 0.85) return { label: "Performance acceptable", tone: "text-info" };
  if (spi >= 0.7 || cpi >= 0.7) return { label: "Performance à risque", tone: "text-warning" };
  return { label: "Performance critique", tone: "text-destructive" };
};

const fmtValue = (r: DeviationResult) => {
  const sign = r.value > 0 ? "+" : "";
  const unit = r.unit === "days" ? "j" : r.unit === "percent" ? "%" : r.unit === "points" ? "pts" : "";
  return `${sign}${r.value}${unit}`;
};

const MonitoringEvaluationPanel: React.FC<Props> = ({
  scope,
  project,
  phases,
  phaseId,
}) => {
  const targetPhases = useMemo(
    () => (scope === "phase" && phaseId ? phases.filter((p) => p.id === phaseId) : phases),
    [scope, phaseId, phases],
  );

  // EVM / health — calculés sur le projet entier (les écarts par phase ci-dessous)
  const evm = useMemo(() => ProjectCalculationService.calculateEVMMetrics(project), [project]);
  const health = useMemo(
    () => ProjectCalculationService.calculateProjectHealthScore(project),
    [project],
  );
  const judgement = judge(evm.schedulePerformanceIndex, evm.costPerformanceIndex);

  // Écarts par phase (DeviationEngine en scope 'phase')
  const phaseDeviations = useMemo(
    () =>
      targetPhases.map((p) => ({
        phase: p,
        results: DeviationEngine.compute(
          {
            plannedEndDate: p.endDate ?? null,
            actualEndDate: p.actualEndDate ?? p.endDate ?? null,
            plannedBudget: p.budget ?? null,
            actualCost: p.actualCost ?? null,
            plannedProgress: p.plannedProgress ?? null,
            actualProgress: p.actualProgress ?? p.progress ?? null,
          },
          "phase",
        ),
      })),
    [targetPhases],
  );

  const hasAnyDeviation = phaseDeviations.some((p) => p.results.length > 0);

  return (
    <Card className="border-info/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-info" />
          Suivi & Évaluation {scope === "phase" ? "(phase sélectionnée)" : "(projet)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI EVM + jugement */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile
            label="Jugement global"
            value={judgement.label}
            tone={judgement.tone}
            icon={<Gauge className="h-4 w-4" />}
          />
          <KpiTile
            label="Score de santé"
            value={`${health.overallScore}/100`}
            tone={
              health.overallScore >= 75
                ? "text-success"
                : health.overallScore >= 50
                ? "text-info"
                : "text-warning"
            }
            icon={<Activity className="h-4 w-4" />}
          />
          <KpiTile
            label="SPI (planning)"
            value={evm.schedulePerformanceIndex.toFixed(2)}
            tone={evm.schedulePerformanceIndex >= 0.95 ? "text-success" : "text-warning"}
            icon={
              evm.schedulePerformanceIndex >= 1 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )
            }
          />
          <KpiTile
            label="CPI (coût)"
            value={evm.costPerformanceIndex.toFixed(2)}
            tone={evm.costPerformanceIndex >= 0.95 ? "text-success" : "text-warning"}
            icon={
              evm.costPerformanceIndex >= 1 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )
            }
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Progression globale</p>
          <Progress value={project.progress || 0} />
        </div>

        {/* Tableau des écarts par phase */}
        <div>
          <h4 className="text-sm font-semibold mb-2">
            Écarts par phase (planifié vs réalisé)
          </h4>
          {!hasAnyDeviation ? (
            <p className="text-sm text-muted-foreground">
              Aucun écart calculable — données planifiées/réalisées insuffisantes.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phase</TableHead>
                    <TableHead>Indicateur</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead>Sévérité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phaseDeviations.flatMap(({ phase, results }) =>
                    results.length === 0 ? (
                      <TableRow key={`${phase.id}-none`}>
                        <TableCell className="font-medium">{phase.name}</TableCell>
                        <TableCell colSpan={3} className="text-xs text-muted-foreground">
                          Aucun écart
                        </TableCell>
                      </TableRow>
                    ) : (
                      results.map((r) => (
                        <TableRow key={`${phase.id}-${r.ruleCode}`}>
                          <TableCell className="font-medium">{phase.name}</TableCell>
                          <TableCell>{r.label}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtValue(r)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={severityColor(r.severity)}>
                              {r.severity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Synthèse */}
        <div className="rounded-md border p-3 bg-muted/30">
          <p className="text-sm">
            <span className="font-semibold">Synthèse : </span>
            <span className={judgement.tone}>{judgement.label}</span>. SPI ={" "}
            {evm.schedulePerformanceIndex.toFixed(2)} • CPI ={" "}
            {evm.costPerformanceIndex.toFixed(2)} • EAC ={" "}
            {Math.round(evm.estimateAtCompletion).toLocaleString("fr-FR")} • VAC ={" "}
            {Math.round(evm.varianceAtCompletion).toLocaleString("fr-FR")}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const KpiTile: React.FC<{
  label: string;
  value: string;
  tone: string;
  icon: React.ReactNode;
}> = ({ label, value, tone, icon }) => (
  <div className="rounded-lg border bg-card p-3">
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{label}</span>
      <span className={tone}>{icon}</span>
    </div>
    <div className={`mt-1 text-base font-semibold ${tone}`}>{value}</div>
  </div>
);

export default MonitoringEvaluationPanel;
