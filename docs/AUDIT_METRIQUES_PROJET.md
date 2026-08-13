# Audit — Source unique de vérité des métriques projet

Périmètre audité : toutes les routes de `src/App.tsx` (dashboard, `/projects`, `/projects/create`, `/projects/:id/*`, phases, jalons, monitoring), composants de rapports et générateurs PDF.

Principe rappelé : **la source unique de vérité est un service**, pas un composant. Aucun `Math.`, `toFixed`, `reduce` métier ne doit rester dans le JSX.

## A) Page / route → composants → source de données → verdict

| Page/Route | Onglet | Composants | Source | Verdict |
|---|---|---|---|---|
| `/dashboard` | — | stats inline | fallback `reduce` budget (`Dashboard.tsx:92`), `(total/1e6).toFixed(1)` (`:276`) | calcul inline |
| `/projects` | bandeau | `PortfolioMetricsSummary` | `ProjectMetricsOrchestrator` + `reportNumbers` | conforme |
| `/projects` | Waterfall | `WaterfallProjectManager`, `WaterfallGanttChart`, `GanttDiagramWithMilestones`, `WaterfallProjectKPIs` | `ProjectCalculationService.calculateEVMMetrics` (moteur EVM parallèle) | service divergent |
| `/projects` | cartes | montants/coordonnées | `toLocaleString`/`toFixed` inline (`:387,399-400`) | formatage inline |
| `/projects/create` | aperçu | `WorkflowMetricsPreview` → `ProjectMetricsPanel` | orchestrateur | conforme |
| `/projects/:id/edit` | aperçu | `WorkflowMetricsPreview` | orchestrateur | conforme |
| `/projects/:id` | overview | Progress + bloc Jalons | `ProgressService` **et** `MilestoneService.getMilestoneProgress` (2 sources) | mixte |
| `/projects/:id` | financial | `FinancialOverview` | `spent` via `reduce` (`:1183`), avance `(budget*pct)/100` (`:1224-1229`) | calcul inline |
| `/projects/:id` | phases → Gantt | `GanttChart`, `UnifiedGanttChart`, fallback `ProjectGantt` | 3 pipelines : `ProjectCalculationService.generateGanttChart`, `GanttPertDataService`, orchestrateur | 3 doublons actifs |
| `/projects/:id` | phases → PERT | `PERTDiagram`, `UnifiedPERTAnalysis` | 2 moteurs PERT | doublon |
| `/projects/:id` | monitoring | `ProjectMetricsPanel` + bloc KPI inline (`:1587-1745`) + `MonitoringEvaluationPanel` | orchestrateur **et** `ProjectAnalyticsService` **et** `ProjectCalculationService` | 3 sources sur un seul écran |
| `/projects/:id` | suivi-évaluation | `MonitoringEvaluationPanel` | `ProjectCalculationService.calculateEVMMetrics` + `calculateProjectHealthScore` | 3ᵉ moteur EVM |
| `ProjectPhasesDetail.tsx` | — | `ProjectMetricsPanel` | — | page hors routing (`App.tsx:57`) |
| Rapport détaillé PDF | — | `PhaseGanttBars` | orchestrateur + `EvmService` + `PhaseWeightingService` | conforme (sauf ratios `:316,320`) |
| Rapport compact PDF | — | `CompactProjectPDFDocument` | `ProjectAnalyticsService` | non aligné orchestrateur |

## B) Orphelins à supprimer

- `src/pages/ProjectPhasesDetail.tsx` (retiré du routing)
- `GanttDiagramWithMilestones.tsx`, `WaterfallProjectKPIs.tsx` (branche Waterfall legacy)
- `monitoring/PhaseMonitoringDashboard.tsx`, `monitoring/UnifiedPhaseWorkflow.tsx` (à confirmer via ré-exports `index.ts`)

## C) Doublons → cible

1. **Gantt** : garder `ProjectGanttTimeline` (vue pure) + `PhaseGanttBars` (PDF), alimentés par `orchestrator.compute().gantt`. Supprimer `UnifiedGanttChart`, `GanttChart` planning, branche Waterfall ; `GanttPertDataService` devient adaptateur interne.
2. **PERT** : un seul calcul exposé par l'orchestrateur, une seule vue.
3. **EVM** : `EvmService` seul moteur ; `ProjectCalculationService.calculateEVMMetrics` délègue ou disparaît.
4. **Santé globale** : 3 formules aujourd'hui (orchestrateur, JSX `:1688-1694`, `ProjectCalculationService:400-431`) → une seule.
5. **Progression jalons** : portée par l'orchestrateur (pondération phases + jalons), suppression de la query parallèle.
6. **KPI** : suppression du bloc inline au profit de `ProjectMetricsPanel`.
7. **Formatage** : `reportNumbers.ts` partout (167 `toFixed`/`toLocaleString` restants).
8. **Alertes** : `MetricAlertRulesService` (pur/calculé) vs `AlertService`/`MonitoringAlertService` (persistés) → fusionner les deux services persistés.

## D) Calculs inline à déplacer

`Dashboard.tsx:92,276` · `ProjectDetailByDTO.tsx:1183,1224-1229,1613,1678-1694` · `ProjectPDFDocument.tsx:316,320` · `Projects.tsx:387,399-400` · `WaterfallProjectKPIs.tsx:88,108-131`

## E) Architecture cible

1. **1 service** : `ProjectMetricsOrchestrator`, seule porte d'entrée métier (délègue à `EvmService`, `PhaseWeightingService`, `WeightedProgressCalculator`, `MetricAlertRulesService`).
2. **1 hook** : `useProjectMetrics` remplace les queries ad hoc `project-kpis`, `project-pert`, `project-gantt`, `milestone-progress`.
3. **N vues sans logique** : `ProjectMetricsPanel`, `ProjectGanttTimeline`, `PhaseGanttBars`, `PortfolioMetricsSummary`, `MonitoringEvaluationPanel` reçoivent des valeurs déjà calculées et formatées.
4. **Ordre de bascule** : (a) unifier EVM, (b) unifier Gantt/PERT, (c) supprimer orphelins, (d) généraliser `reportNumbers.ts`, (e) supprimer doubles calculs santé/jalons.
