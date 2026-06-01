## Contexte

Le stack hexagonal de liaison stratégique (SCAPP) et budgétaire (LF 2026) est **finalisé et opérationnel** : adapter → service → hook → UI (StrategicLinkageStep) → workflow étape 7. Round-trip UI→DB validé via les vues proxy `public.project_strategy_links` et `public.project_budget_links`.

Ce plan couvre l'étape suivante demandée : **navigation, classification des phases, UX formulaires, accessibilité**.

## 1. Navigation enrichie (sidebar + breadcrumb)

- Ajouter dans `AppSidebar` un groupe **"Cycle de vie projet"** avec sous-menus :
  - Planification (projets en `DRAFT`/`EN_ATTENTE`)
  - Exécution (`EN_COURS`)
  - Contrôle & Inspections (`/inspections`, `/comprehensive-monitoring`)
  - Paiements & échéances (`/payment-control`, `/bank-guarantees`)
  - Clôture (`CLOTURE`/`TERMINE`)
- Ajouter un groupe **"Référentiels & Reporting"** : Documents, Rapports, Notifications.
- Surligner la route active via `NavLink` + `useLocation`.
- Breadcrumb global dans `AppLayout` dérivé du `pathname`.

## 2. Distinction phases Planif / Exéc / Contrôle / Clôture

- Étendre `PhaseType` enum (DTO existant) avec un champ dérivé `lifecycleStage: 'PLANIFICATION' | 'EXECUTION' | 'CONTROLE' | 'CLOTURE'`.
- Helper pur `getPhaseLifecycleStage(phase: PhaseDTO)` dans `src/utils/phaseHelpers.ts` (logique basée sur `type` + `status`, zéro hardcode dans l'UI).
- Badge couleur dans `WaterfallProjectPhasesManager`, `PhaseDetail`, `WaterfallGanttChart` (tokens sémantiques `--stage-plan|exec|control|close` ajoutés dans `index.css`).
- Filtres par étape dans `/projects/:id/phases`.

## 3. Page `PhaseDetail` enrichie

- Onglets : *Planification* (tâches, ressources), *Exécution* (avancement, photos), *Contrôle* (inspections liées), *Paiements* (échéances), *Documents*, *Rapports*.
- Liens directs cross-modules (vers inspection, paiement, document).

## 4. UX formulaires

- Wrapper `<FormSection title description>` standard (Card + bordure gauche colorée par stage).
- Inputs : labels au-dessus, `aria-describedby` pour aide, erreurs en `role="alert"`.
- `ProjectInfoStep`, `StakeholdersTeamStep`, `RiskAnalysisStep`, `StrategicLinkageStep` migrent vers ce wrapper.
- Autocomplete : raccourcis clavier (↑ ↓ Enter Esc), focus trap, annonces ARIA.

## 5. Suppression résiduelle de hardcode

- Audit `grep "hardcoded\|TODO\|mock"` dans `src/components/project/`.
- Remplacement par lectures de `src/config/referentials/*`.

## 6. Vérifications

- Build TS sans erreurs.
- Routes accessibles via clavier (Tab) + lecteur d'écran (labels ARIA).
- Round-trip : créer projet → étape 7 → reload `/projects/:id/edit` → liens présents.

## Découpage en tâches (exécutables en parallèle)

```text
T1  AppSidebar enrichi + groupes cycle de vie
T2  Helper lifecycleStage + tokens CSS + badges
T3  PhaseDetail onglets + cross-module links
T4  Wrapper FormSection + migration 4 steps
T5  Accessibilité autocomplete (kbd/ARIA)
T6  Audit hardcode + nettoyage
```

T1, T2, T4 sont indépendants ; T3 dépend de T2 ; T5 dépend de T4 ; T6 transverse.

## Estimation

~6-8 fichiers nouveaux, ~15 fichiers édités, ~600 lignes nettes. Pas de migration DB.
