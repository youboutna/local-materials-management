## Objectif

1. Corriger les incohérences de mapping dans `ProjectDetail` (phase actuelle « Aucune phase définie » / compteur Phases `0/4`).
2. Intégrer une section **Suivi & Évaluation** (monitoringEvaluation) dans les vues `ProjectDetail` et `ProjectPhasesDetail`, alimentée par le même `DeviationEngine` que le rapport PDF, conformément à `docs/ARCHITECTURE_REFERENTIELS.md` (référentiels = légos métier, calcul dans le moteur générique).

## Diagnostic des incohérences

| Symptôme | Cause | Fichier |
|---|---|---|
| `Phase actuelle : Aucune phase définie` | `currentPhaseInfo` lit `p.name` sur `projectDetail.plannedPhases` alors que le `PhaseDTO` expose `phase_name` (snake_case côté DTO de transformation). Résultat : tous les fallbacks → `null`. | `src/components/project/ProjectDetailByDTO.tsx` (l. 311-345) |
| Compteur `Phases 0/4` malgré le projet terminé | `phasesStats` est correct sur le total (utilise le hook hex `useProjectPhasesHex`) mais le `completed` reste à 0 car les phases héritées n'ont jamais leur `status` synchronisé avec le statut projet (`terminé`). | `src/components/project/ProjectDetailByDTO.tsx` (l. 787-794) |
| « Étape actuelle : N/A » | Même cause que (1) : la source de phases n'est pas la même que `computedPhases`, et `stages` ne sont jamais inspectés. | idem |

## Modifications

### 1. Fix mapping phase actuelle / stats (frontend uniquement)
- `src/components/project/ProjectDetailByDTO.tsx`
  - Faire dériver `currentPhaseInfo` de `computedPhases` (déjà normalisé : `phase_name`, `status`, `stages`) plutôt que de `phasesSource` brut.
  - Étape actuelle : prendre le premier `stage` non terminé du phase courante.
  - `phasesStats.completed` : si toutes les phases sont en `planned/pending` mais que `project.status === 'completed' | 'terminé'` et `project.progress >= 100`, considérer total = completed (alignement avec règle « Dynamic Phase Calculation »).

### 2. Section Suivi & Évaluation (UI)
Créer un composant réutilisable `MonitoringEvaluationPanel` qui :
- Reçoit `projectDetail`, `phases`, et un `scope: 'project' | 'phase'`.
- Calcule via `DeviationEngine.compute(...)` (déjà utilisé par le PDF) les écarts coût/délai/avancement par phase.
- Affiche : cartes KPI (SPI, CPI, score santé, jugement global), tableau des écarts (Phase, Indicateur, Planifié, Réalisé, Écart, Sévérité, Jugement), synthèse + recommandation.
- Réutilise `ProjectAnalyticsService.calculateEVMMetrics` + `health-thresholds.referential` (aucune valeur codée en dur).

Intégrations :
- `ProjectDetailByDTO.tsx` : nouvel onglet **Suivi & Évaluation** dans le bloc `Tabs` (avant « Localisation ») rendant `<MonitoringEvaluationPanel scope="project" />`.
- `ProjectPhasesDetail.tsx` : nouvel onglet **Suivi & Éval.** rendant `<MonitoringEvaluationPanel scope="phase" phaseId={selectedPhaseId} />` (filtre auto sur la phase sélectionnée).

### 3. Pas de changement de schéma
Aucune migration ; tout le calcul s'appuie sur les données déjà hydratées + les référentiels existants (`deviation-rules`, `indicator-templates`, `weighting-models`, `health-thresholds`).

## Fichiers touchés

- `src/components/project/ProjectDetailByDTO.tsx` (fix mapping + nouvel onglet)
- `src/pages/ProjectPhasesDetail.tsx` (nouvel onglet)
- `src/components/project/monitoring/MonitoringEvaluationPanel.tsx` (nouveau)

## Hors périmètre

- Pas de retouche aux services hexagonaux ni aux adapters Supabase.
- Pas de modification du PDF (déjà fait précédemment).
- Pas de refonte visuelle des autres KPI cards.
