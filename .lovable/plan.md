## Périmètre
- `/projects/create` → `ProjectCreate.tsx` → `ProjectCreationWorkflow.tsx` (8 étapes, ~496 L) → `steps/*` (12 fichiers, ~5300 L)
- `/projects/:id` → `ProjectDetail.tsx` → `ProjectDetailByDTO.tsx` (**2041 L**) + sous-composants (`ProjectPhases`, `PhaseList`, `ProjectMaterials`, `ProjectDocuments`, `ProjectGantt`, `EnhancedRiskManager`, `EnhancedTaskManager`, `PhaseDetailsPage`, `PaymentHistory`, `InspectionsList`, etc.)
- `/projects/:id/edit` → `ProjectEdit.tsx` (réutilise le workflow en mode edit)

## Règles transversales (rappelées avant chaque PR)
Conformes à `docs/PROMPTS.md` + `docs/ARCHITECTURE_REFERENTIELS.md` :
- Zéro `supabase.from()` / `supabase.schema()` dans pages & composants
- Flow obligatoire : UI → Transformer → DTO (camelCase) → Service → Adapter → DB (snake_case)
- Hooks via `useUnifiedProjectWorkflow` / `useProjectsHex` ; mutations TanStack v5 (pas de `onError/onSuccess` sur `useQuery`)
- `AppLayout` sans `pageDescription` ; tokens sémantiques uniquement (pas de `text-white`, `bg-[#xxx]`)
- Référentiels = source de vérité (phases, indicateurs, écarts) — pas de hardcoding métier

---

## Vague A — Bugs save & round-trip (priorité 1, ~1-2h)

### A1. `/projects/create` — workflow 8 étapes
Audit étape par étape du round-trip UI ↔ DTO ↔ Service ↔ DB :

| # | Étape | Composant | Vérification |
|---|---|---|---|
| 1 | Infos projet | `ProjectInfoStep` | Title/desc/budget/dates/status → `CreateProjectDTO` ; pas d'`id` côté UI (gen DB) |
| 2 | Parties prenantes | `StakeholdersTeamStep` | Promotion auto Chef projet → `projectManagerId` |
| 3 | Localisation | `InteractiveMapGIS` inline | **Bug actuel** : injecte un `uuidv4()` côté UI → conflit avec `gen_random_uuid()` DB. **Fix** : ne jamais setter `id` côté UI. |
| 4 | Phases | `ConstructionPhaseManager` | Génération depuis référentiels `projectTypes` ; persistance via `PhaseService` (pas en formMode) |
| 5 | Risques | `RiskAnalysisStep` | DTO `RiskDTO[]` → `RiskRepository.saveBatch` |
| 6 | Conformité | `EnhancedComplianceStep` | DTO `ComplianceItemDTO[]` |
| 7 | Stratégie/Budget | `StrategicLinkageStep` | Links → `project_strategy_links` / `project_budget_links` |
| 8 | Résumé | inline | Affichage récap + bouton final |

**Fixes attendus** :
- Supprimer `uuidv4()` à l'étape 3 — laisser l'adapter Project gérer l'ID (cohérent avec fix tender)
- `handleSubmit` : éviter `window.location.href` (utiliser `navigate()` via prop `onSubmit` déjà fournie)
- Toasts d'erreur si étape échoue (pas seulement `console.error`)
- Bouton "Sauvegarder" → invalider queries `['project-workflow-data']` après succès (déjà fait dans le hook, vérifier)

### A2. `/projects/:id/edit`
- Vérifier que `useUnifiedProjectWorkflow('edit', id)` hydrate bien les 8 étapes via `initializeEditWorkflow`
- Tester save par étape (ne doit pas créer un doublon)

### A3. `ProjectPhases.tsx` (legacy)
- `new PhaseService(null as any)` → casser : injecter `RepositoryFactory.getPhaseRepository()`
- Boucle `for...of` update phases : transformer en batch `phaseService.saveBatch(projectId, phases)`

---

## Vague B — `/projects/:id` : design + CRUD finalisé (~2-3h)

### B1. Découpe `ProjectDetailByDTO.tsx` (2041 L → max 400 L/fichier)
Le fichier est ingérable. Extraction en sous-composants colocalisés :
- `ProjectDetailHeader.tsx` (titre, statut, actions edit/delete)
- `ProjectDetailTabs.tsx` (orchestrateur d'onglets)
- `tabs/OverviewTab.tsx`, `tabs/PhasesTab.tsx`, `tabs/MaterialsTab.tsx`, `tabs/DocumentsTab.tsx`, `tabs/TasksTab.tsx`, `tabs/RisksTab.tsx`, `tabs/PaymentsTab.tsx`, `tabs/InspectionsTab.tsx`, `tabs/GanttTab.tsx`

### B2. Suppression `pageDescription` (mémoire UI density standard)
`ProjectDetail.tsx` ligne 38 → retirer `pageDescription="Détail du projet"`.

### B3. UI densification
- Tabs sticky en haut
- Cards KPI compactes (grille 4 colonnes desktop, 2 mobile)
- Badges sémantiques (`bg-success/10 text-success`, etc.) — pas de couleurs hardcodées
- Espaces réduits (p-3/p-4 au lieu de p-6) cohérents avec workflow

### B4. CRUD finalisé par onglet
Vérifier qu'à chaque onglet :
- Bouton "Ajouter/Modifier/Supprimer" branché à un Service (pas Supabase direct)
- Confirmation avant suppression (`AlertDialog`)
- Toast succès/erreur
- Invalidation TanStack Query ciblée

---

## Vague C — Sous-composants partagés (~1-2h)

Audit rapide + fixes ciblés (pas de réécriture) :
- `ConstructionPhaseManager.tsx` — vérifier la génération depuis référentiel + sauvegarde
- `PhaseList.tsx`, `PhaseDetailsPage.tsx` — round-trip Phase
- `ProjectMaterials.tsx`, `ProjectDocuments.tsx` — service-only
- `EnhancedRiskManager.tsx`, `EnhancedTaskManager.tsx` — TanStack v5 conformity

---

## Livrables
- ~15-25 fichiers édités, 0 fichier nouveau côté domaine
- 8-12 nouveaux fichiers `tabs/*` pour découper `ProjectDetailByDTO`
- Mémoires à créer : `mem://features/project-workflow-id-policy` (jamais d'ID UI-side), `mem://style/project-detail-tabs-decomposition`

## Question
Ordre proposé : **A → B → C**. Je commence par la **Vague A (bugs save round-trip)** immédiatement, ou tu préfères que j'attaque **B1 (découpe ProjectDetailByDTO)** en premier parce que le fichier 2041L te bloque visuellement ?