## Problème observé

`ProjectReportGenerator` / `CompactProjectReportGenerator` impriment **"Phase : Non définie"** alors que `PhaseList` affiche "Phases du projet (4)". La cause est un **mauvais mapping snake_case → camelCase** dans la chaîne reporting, qui viole `docs/PROMPTS.md` (RÈGLE #1 et #2) :

1. `SupabaseReportingAdapter.transformProjectForReport` retourne `reportDTO.project.phases` en **étalant des lignes snake_case** (`{ ...p }`) sans transformer. Aucune clé `name` (la DB a `phase_name`), aucun `plannedPhases`.
2. `CompactProjectReportGenerator` recopie `plannedPhases: reportProject.plannedPhases || []` — le champ n'existe pas dans le DTO retourné → tableau vide.
3. `CompactProjectPDFDocument.getCurrentPhase` lit `enrichedData.plannedPhases` (vide) → "Non définie", et `phase.name` (inexistant) dans la grille des phases.
4. `ProjectPDFDocument` lit `enrichedData.phases` (qui existe mais en snake_case → `name` undefined dans les colonnes).

Tous les autres générateurs de rapport (`InspectionReportGenerator`, `SupplierPaymentReportGenerator`, `TenderReportGenerator`) reposent sur la même chaîne et héritent du défaut.

## Objectif

Aligner reporting sur l'architecture hexagonale : **un seul point de transformation** (Transformer) qui produit un DTO camelCase consommable tel quel par les composants PDF. Zéro `(x as any).phase_name` côté UI.

## Changements (refactor only, pas de nouveau fichier)

### 1. `src/infrastructure/supabase/adapters/SupabaseReportingAdapter.ts`
- Retirer `@ts-nocheck`.
- Dans `transformProjectForReport`, utiliser `toPhaseViewModel` (déjà existant dans `src/utils/phaseViewModel.ts`) pour mapper chaque ligne `project_phases` en camelCase (`id, projectId, title, status, progress, budget, actualCost, startDate, endDate, plannedProgress`).
- Renvoyer dans `reportDTO.project` :
  - `phases`: tableau normalisé camelCase (clé `name = phaseViewModel.title` pour rester compatible `EnhancedPhaseDTO.name`).
  - `plannedPhases`: même tableau, alias pour les consommateurs `ProjectDetailDTO`.
  - `milestones`, `materials`, `inspections`: déjà OK mais passés via les transformers existants si présents, sinon mapping minimal camelCase.
- `getProjectPhases` : remplacer le mapping en ligne par `toPhaseViewModel` + complétion `EnhancedPhaseDTO` (tasks/milestones vides documentés en TODO).

### 2. `src/components/reports/CompactProjectReportGenerator.tsx`
- Remplir `plannedPhases` depuis `reportProject.plannedPhases ?? reportProject.phases ?? []` (fallback robuste, pas de double source de vérité).
- Idem pour la boucle multi-projets.
- Retirer les `(reportProject as any)` qui masquent les casses : typer `reportProject` comme `Partial<ProjectDetailDTO>`.

### 3. `src/components/reports/pdf/CompactProjectPDFDocument.tsx`
- `getCurrentPhase` : accepter `PhaseViewModel[]`, lire `phase.title` (et fallback `phase.name`) au lieu de `phase.name` uniquement.
- Bloc liste phases (l.783) : `phase.title ?? phase.name ?? \`Phase ${idx+1}\`` (plus de `substring(0,20) ||` qui produit `undefined`).
- Footer `Phase: {getCurrentPhase(phases)}` : si toujours vide après hydration, afficher `—` plutôt que `Non définie`.

### 4. `src/components/reports/pdf/ProjectPDFDocument.tsx`
- Bloc phases (l.311) : utiliser `p.title ?? p.name ?? '—'`, `p.startDate`, `p.endDate`, `p.progress` (déjà camelCase après refactor adapter).
- Bloc Gantt (l.597) : idem.
- Bloc milestones (l.490) : `milestone.title ?? milestone.name ?? '—'`.

### 5. `src/application/services/enhancedReportingService.ts`
- Ligne 160 : `name: phase.phase_name || 'Phase sans nom'` → utiliser `toPhaseViewModel(phase).title`. Supprime la chaîne fallback "Phase sans nom".

### 6. Vérifications croisées (round-trip UI ↔ DB)
- Confirmer que les autres consommateurs (`PhaseList`, `EnhancedWorkflowPhaseManager`) restent OK : ils utilisent déjà `PhaseConstructionTransformer.toSummary` ou `toPhaseViewModel`.
- Aucun changement DB requis.

## Détails techniques

- `phase_name` (DB) → `title` (DTO/ViewModel) est la convention déjà retenue (`toPhaseViewModel` ligne 76). On l'applique partout dans le reporting au lieu de réinventer le mapping.
- Tous les fallbacks "Non définie" / "Sans nom" sont remplacés par `—` (tiret cadratin) quand la donnée existe mais n'a pas pu être hydratée — cela rend visible une erreur de pipeline plutôt que de la masquer.
- Aucun nouveau fichier ; aucun changement de schéma ; aucune nouvelle dépendance.

## Critères d'acceptation

1. PDF rapport projet (résumé + détaillé) : footer affiche `Phase X/4 - <titre>` quand le projet a 4 phases.
2. Tableau "Phases du projet" du PDF liste les 4 phases avec leur titre réel (DB `phase_name`).
3. Aucun `@ts-nocheck` ajouté ; celui de `SupabaseReportingAdapter` retiré.
4. `grep "phase_name" src/components/reports` retourne 0 résultat.
5. Build TypeScript passe.
