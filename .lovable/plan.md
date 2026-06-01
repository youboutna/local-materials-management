
# Plan : Cohérence mapping & hydratation des vues Projet / Phase / Jalon / Rapports

## Diagnostic (basé sur capture + code)

Sur `/projects/:id` (statut INSPECTION, 96% progression, 1 phase, 2191j de retard) :

1. **Onglet "Exécution" quasi vide** — `ProjectDetailByDTO.tsx` ligne 1313 : le panneau `value="tasks"` ne contient QUE `EnhancedTaskManager`. Il ignore complètement les **inspections**, **paiements en cours**, **étapes workflow** et **PV** — alors qu'au statut INSPECTION, l'exécution = inspections + livrables, pas les tâches Gantt.
2. **PHASES 0/1** — `1 phase` existe mais "0 en cours" car la phase est en statut `inspection`/`completed`, non `in_progress`. Le compteur ne suit pas le statut dynamique (cf. mémoire `project-phase-dynamic-calculation`).
3. **Encodage cassé** — `EnhancedTaskManager.tsx:790,940` : "trouvÃe", "CrÃeze" → fichier mal encodé (Latin1/UTF8 mix), visible aussi dans la capture ("Aucune tâche trouvÃe").
4. **DÉLAI "2191j de retard"** sur un projet 96% complet → calcul d'écart basé sur `end_date` initiale sans tenir compte du statut/avancement réel. Devrait passer par `DeviationEngine` (mémoire `tbi-deviation-engine`).
5. **Vue Phase (`PhaseDetailPage` / `PhaseDetailsPage`)** — deux composants quasi dupliqués (346 vs 485 lignes) : sources de désynchronisation hydratation.
6. **Vue Jalons (`PhaseMilestones`, `UnifiedMilestoneManager`)** : ne reflète pas l'état réel des inspections/checkpoints liés (pas de jointure côté DTO).
7. **Rapports (`CompactProjectReportGenerator`, `ReportManager`)** : consomment `project` brut depuis le composant parent, sans passer par `ReportingService` complet → KPIs financiers/écarts manquants.

## Corrections proposées

### 1. Onglet "Exécution" du projet — rendre contextuel au statut
Dans `ProjectDetailByDTO.tsx`, remplacer le contenu du `TabsContent value="tasks"` par un sous-routage interne :
```
Exécution
 ├─ Tâches            (EnhancedTaskManager)
 ├─ Inspections       (InspectionsList filtré projectId)
 ├─ Paiements en cours (PaymentHistory pending/in_review)
 └─ Workflow / Étapes (PhaseWorkflowContainer de la phase active)
```
- Onglet actif par défaut = celui qui correspond au statut projet (`inspection` → Inspections).
- Récupération via hooks hexagonaux existants : `useInspectionsHex`, `useProjectPaymentsHex`, `useWorkflowOrchestrator`.

### 2. Carte "PHASES x/y" — statut dynamique
- Brancher sur `ProjectAnalyticsService.getPhaseProgressSummary(projectId)` qui retourne `{ total, inProgress, completed, blocked }`.
- Affiche `inProgress/total` et tooltip détaillé (mémoire `project-phase-dynamic-calculation` respectée).

### 3. Carte "DÉLAI" — DeviationEngine
- Remplacer le calcul inline `(today - endDate)` par `DeviationEngine.compute({ planned, actual, indicatorTemplate: 'project-delay' })`.
- Si projet >= 95% completé → afficher "Clôture en cours" + écart final, pas "retard".

### 4. Encodage UTF-8
- Réécrire `EnhancedTaskManager.tsx` (lignes 623, 790, 940) et grep global `Ãe|Ã©|Ã¨` pour réparer tous les caractères corrompus.

### 5. Fusion PhaseDetailPage / PhaseDetailsPage
- Garder `PhaseDetailsPage` (le plus complet, 485 l.) comme source unique.
- Supprimer `PhaseDetailPage.tsx` et rediriger ses imports.
- Aligner sur DTO `PhaseDetailDTO` (camelCase), hydratation via `PhaseService.getPhaseDetail(phaseId)` qui agrège : steps, tasks, inspections, payments, jalons.

### 6. Vue Jalons cohérente
- `MilestoneService.getEnriched(milestoneId)` : joindre checkpoints + inspections + statut de paiement associé.
- `PhaseMilestones` et `UnifiedMilestoneManager` consomment ce DTO enrichi (au lieu de fetcher séparément).

### 7. Rapports — passer par ReportingService
- `CompactProjectReportGenerator` et `ReportManager` : recevoir `ProjectReportDTO` complet depuis `ReportingService.buildProjectReport(projectId)` (déjà défini dans `IReportingRepository`).
- Inclure : KPIs référentiels (TBI), écarts (DeviationEngine), résumé financier réel (`calculateRealProjectCosts`), inspections, jalons.

## Détails techniques

| Fichier | Action |
|---|---|
| `src/components/project/ProjectDetailByDTO.tsx` | Restructure onglet Exécution en sous-tabs ; remplace calcul délai/phases par services |
| `src/application/services/ProjectAnalyticsService.ts` | Ajouter `getPhaseProgressSummary` si absent |
| `src/application/services/DeviationEngine.ts` | Exposer `computeProjectDelay(project)` utilisant indicator-template |
| `src/components/project/EnhancedTaskManager.tsx` | Fix encodage UTF-8 |
| `src/components/project/PhaseDetailsPage.tsx` | Devient source unique, consomme `PhaseDetailDTO` |
| `src/components/project/PhaseDetailPage.tsx` | **Supprimé**, imports redirigés |
| `src/application/services/PhaseService.ts` | Ajouter `getPhaseDetail(phaseId)` agrégateur |
| `src/application/services/MilestoneService.ts` | Ajouter `getEnriched(milestoneId)` |
| `src/components/project/PhaseMilestones.tsx`, `UnifiedMilestoneManager.tsx` | Consommer DTO enrichi |
| `src/components/reports/CompactProjectReportGenerator.tsx`, `ReportManager.tsx` | Consommer `ProjectReportDTO` via `ReportingService` |

## Conformité aux règles PROMPTS.md
- Flow respecté : DB → Adapter → Transformer → Entity → Service → DTO → UI.
- Aucun `supabase` direct ajouté dans React.
- Référentiels (indicator-templates, deviation-rules, weighting-models) utilisés pour tout calcul d'écart / statut dynamique.
- TanStack Query v5 : pas de `onError`/`onSuccess`.

## Hors scope (à confirmer)
- Refonte visuelle des cartes KPI (icônes, couleurs) — non demandé.
- Migration de nouvelles tables — pas nécessaire, tout existe déjà.
