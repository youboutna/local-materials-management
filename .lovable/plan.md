# Fix des incohérences de données des rapports projet

## Constat (scan complet)
- `SupabaseReportingAdapter.ts:259-261` : santé projet calculée avec **85 / 90 / 88 en dur**.
- `SupabaseReportingAdapter.ts:58-60` : progression de phase écrasée par un calcul **temps écoulé**, dates manquantes remplacées par `new Date()`.
- `reportCalculations.ts:145-160` : **7 activités PERT fictives** ("Fondations et terrassement"…) quand aucune phase n'est fournie → 1 485 j fantômes.
- `CompactProjectReportGenerator.tsx:147` / `:254` : `calculatePERTAnalysis(project)` reçoit un **projet au lieu des phases** → déclenche exactement ce fallback fictif.
- 3 implémentations EVM concurrentes (`ReportCalculations`, `ProjectCalculationService`, `ProjectAnalyticsService`) avec `CPI = 1` quand AC = 0 → "sous budget" alors que l'engagement est à 0 %.
- `costVariance` affiché comme reste à consommer et non comme écart.
- Progression globale = moyenne simple des tâches, le champ `weight` des phases (DB `btp.project_phases.weight`) n'est **jamais** utilisé.
- `project_phases.estimated_cost` / `actual_cost` existent en base mais ne sont **jamais lus** par la chaîne de reporting.
- `ProjectCalculationService` : `quality || 85`, `stakeholderSatisfaction = 75`, `risk = 100 - score` (métrique circulaire).

## Travaux
1. **`PhaseWeightingService`** (nouveau) : cascade de pondération — poids explicite → budget de phase → durée → poids égal, avec normalisation à 1.
2. **`EvmService`** (nouveau, source unique) : PV/EV/AC, CV = EV − AC, SV = EV − PV, CPI/SPI **nullables** (`null` si AC = 0 ou PV = 0), EAC/ETC/VAC, statut coût/délai explicite (`n/a` possible).
3. **`ReportCalculations`** : délègue l'EVM à `EvmService`, supprime les activités PERT fictives (retour vide + drapeau `isEstimated`).
4. **`SupabaseReportingAdapter`** : suppression des 85/90/88, progression réelle (`??` et non `||`), plus de dates fabriquées, lecture de `estimated_cost` / `actual_cost` par phase, TEP pondéré.
5. **`ProjectCalculationService`** : progression pondérée par phase, suppression des constantes 85/75, risque issu des risques réels.
6. **Générateurs de rapports** : passage des phases réelles au PERT, progression pondérée unique côté PDF.
