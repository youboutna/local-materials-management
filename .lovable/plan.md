
# Liaison stratégique & budgétaire des projets

Objectif : permettre de rattacher (optionnellement) un projet à des stratégies nationales/sectorielles, des objectifs mesurables (KPIs) et à une ou plusieurs lignes de la Loi de Finances 2026, avec autocomplétion. Zéro hardcode, zéro import legacy, flow hexagonal complet UI → DTO camelCase → Service → Adapter → DB snake_case.

## 1. Référentiels (`src/config/referentials/`)

Nouveaux fichiers, types trilingues `MultiLangLabel`, fonctions de recherche pures :

```text
referentials/
├── strategies/
│   ├── scapp-national-strategy.referential.ts   # SCAPP 2016-2030 (squelette enrichi)
│   ├── sectorial-strategies.referential.ts      # PNDS / SDAU / sectorielles (réutilise existants)
│   └── index.ts
├── objectives/
│   ├── measurable-objectives.referential.ts     # agrège tous les MeasurableObjective
│   ├── key-performance-indicators.referential.ts
│   └── index.ts
└── linkage/
    ├── autocomplete-provider.ts                 # index full-text in-memory
    ├── linkage-builder.config.ts                # config form (sections optionnelles)
    ├── budget-autocomplete.ts                   # scan budget2026Referential
    └── index.ts
```

Chaque champ est `isOptional: true`. Aucun import depuis `@/services/*` ou `@/types/*`.

## 2. Schéma DB (migration Supabase, schéma `btp` + vues `public`)

Deux tables dédiées multi-lignes :

```sql
btp.project_strategy_links (
  id, project_id, source_referential,           -- 'SCAPP' | 'PNDS' | ...
  lever_code, chantier_code, intervention_code,
  objective_code,                               -- nullable
  contribution_pct numeric(5,2) default 0,
  justification text,
  created_at, updated_at, created_by
)

btp.project_budget_links (
  id, project_id,
  ministry_code, program_code, action_code,
  chapter_code, line_code,                      -- nullable hierarchical
  allocated_ce numeric, allocated_cp numeric,
  fiscal_year int,                              -- default 2026
  notes text,
  created_at, updated_at, created_by
)
```

- RLS : SELECT/INSERT/UPDATE/DELETE pour utilisateurs ayant accès au projet (même pattern que `project_alerts`).
- Vues `public.project_strategy_links` / `public.project_budget_links` (proxy) — règle multi-schéma.
- Index sur `project_id`, `objective_code`, `line_code`.

## 3. Couche hexagonale

```text
src/
├── domain/entities/
│   ├── ProjectStrategyLink.ts
│   └── ProjectBudgetLink.ts
├── domain/repositories/
│   ├── IProjectStrategyLinkRepository.ts
│   └── IProjectBudgetLinkRepository.ts
├── dtos/entities/
│   ├── ProjectStrategyLinkDTO.ts
│   └── ProjectBudgetLinkDTO.ts
├── dtos/transforms/
│   ├── ProjectStrategyLinkTransformer.ts        # fromSupabase/toSupabase/toDTO/fromDTO/formToCreate
│   └── ProjectBudgetLinkTransformer.ts
├── infrastructure/supabase/adapters/
│   ├── SupabaseProjectStrategyLinkAdapter.ts
│   └── SupabaseProjectBudgetLinkAdapter.ts
├── application/services/
│   ├── ProjectStrategyLinkService.ts
│   └── ProjectBudgetLinkService.ts
└── hooks/hexagonal/
    ├── useProjectStrategyLinksHex.ts
    └── useProjectBudgetLinksHex.ts
```

Conventions : DTOs camelCase, adapters snake_case, entités `Interface + create()`. Hooks TanStack v5 (pas de `onError/onSuccess`).

## 4. UI — étape workflow

Nouveau composant `src/components/workflow/StrategicLinkageStep.tsx` intégré au workflow de création/édition projet :

- Section **Stratégie** : autocomplete Levier → Chantier → Intervention (cascading), filtre via `autocompleteProvider`.
- Section **Objectifs** : multi-select objectifs mesurables + champ contribution %.
- Section **Budget** : autocomplete Programme → Action → Ligne (cascading via `budget2026Referential`), montant CE/CP alloué.
- Section **Justification** : textarea libre.

Toutes les sections sont collapsibles et marquées « Optionnel ». Form state → `LinkageTransformer.formToCreate*DTO()` → service.

## 5. Vérifications (Règle #9)

- Aucun import `@/services/*` ou `@/types/*` dans nouveaux fichiers.
- Aucun `supabase.from()` hors adapters.
- Build TS pass + preview rendue.

## Détails techniques

- `AutocompleteProvider` : index tokenisé NFD, scoring exact/prefix/contains, séparé `strategy` vs `budget`.
- Transformers gèrent les colonnes nullable via standard `null/undefined` (mémoire DTO Nullability).
- Service factory dans `RepositoryFactory.ts`.
- Mémoires à ajouter : `mem://features/strategy-budget-linkage` + `mem://design/linkage-step-ui`.

## Étapes d'exécution

1. Migration SQL (tables + vues + RLS + index).
2. Référentiels (`strategies/`, `objectives/`, `linkage/`).
3. Domain → DTOs → Transformers → Adapters → Services → Hooks (en parallèle là où possible).
4. UI `StrategicLinkageStep` + intégration workflow Create/Edit.
5. Update `index.ts` exports + mémoires.
