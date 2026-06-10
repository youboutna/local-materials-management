## Objectif global

Pour chaque page route de `src/App.tsx`, garantir le round-trip **UI ↔ DTO ↔ Service ↔ Adapter ↔ DB** conforme aux règles de `docs/PROMPTS.md` et `docs/ARCHITECTURE.md`, corriger les bugs `save` (en commençant par les mocks de `RepositoryFactory`), et densifier l'UI sans refonte (tokens sémantiques, headers compacts, `AppLayout` sans description).

Le travail est **trop volumineux pour une seule itération** : je propose un plan en vagues. À chaque vague, mêmes étapes : audit → fix CRUD → polish UI → vérif build/logs → mémoire mise à jour.

## Règles d'or appliquées partout

- Aucun `supabase.from(...)` ni `.schema(...)` dans `src/components/**` ou `src/pages/**`. Seuls les Services + hooks `hexagonal/*` y ont droit.
- Chaque Service consomme un Repository concret (jamais le mock fallback en prod).
- DTO camelCase, DB snake_case, transformer explicite dans les deux sens.
- `useQuery`/`useMutation` v5 : pas d'`onError`/`onSuccess` callbacks ; toasts dans les hooks après `await mutateAsync`.
- Tokens sémantiques uniquement (`bg-card`, `text-foreground`, `border-border`…), pas de `text-white` / `bg-[#...]`.
- `AppLayout` sans `pageDescription` (densité headers, mem `style/layout-header-density-standard`).

## Vague 1 — Projects & Phases (priorité user)

Routes : `/projects`, `/projects/create`, `/projects/:id`, `/projects/:id/edit`, `/projects/import`, `/projects/:id/phases/*` (et `MilestoneDetail`, `TaskDetail` dérivés).

1. Audit `ProjectCreate.tsx`, `ProjectEdit.tsx`, `ProjectDetail.tsx`, composants `ProjectWorkflow*`, `Phase*Tab`, `Step*Tab`.
2. Vérifier que chaque onglet (Identification, Localisation, Budget, Phases, Steps, Stakeholders, Documents) :
   - lit ses valeurs via `useProject*` hook hexagonal,
   - persiste via `ProjectWorkflowService` (pas d'appel Supabase direct),
   - transforme `formState → CreateProjectDTO / UpdateProjectDTO` via un Transformer dédié.
3. Brancher la génération phases/steps sur référentiel (`config/referentials/`) via `PhaseGeneratorService`.
4. Fixer toute regression `save` (toasts succès/erreur, invalidation queries, redirection).
5. UI : compacter headers de tabs, retirer descriptions verbales, normaliser cards (`Card` + `CardHeader` slim).

## Vague 2 — Comprehensive Monitoring (6 onglets)

Routes : `/comprehensive-monitoring`, `/inspection-monitoring`, `/bank-guarantee-monitor`, `/insurance-management`.

1. `SystemHealthOverview` : alertes via `MonitoringAlertService` → `project_alerts` (acknowledge/resolve). Métriques via `PerformanceMonitoringService` réel (remplacer mock dans `RepositoryFactory.getPerformanceMonitoringRepository`).
2. `PerformanceMetrics` : brancher historique réel.
3. `RoleBasedInspectionMonitoring`, `UnifiedInsuranceManager`, `EnhancedPaymentBlockingInterface`, `BankGuaranteeMonitor` : audit zéro-Supabase, CRUD complet (create/edit/delete), confirmations dialog.
4. UI : grid KPI cohérente, badges sémantiques (`destructive`, `secondary`, `default`), tabs sticky.

## Vague 3 — Tenders & Estimates (bug save prioritaire)

Routes : `/tenders`, `/tenders/:id`, `/tenders/import`.

1. **Fix bloquant** : remplacer le mock `getTenderEstimateRepository` dans `src/repositories/RepositoryFactory.ts` par le vrai `TenderEstimateAdapter` (déjà exporté dans `infrastructure/supabase/adapters/index.ts`). C'est la cause directe du « Failed to save tender ».
2. Vérifier `TenderEstimateService` + DTOs (`tender_estimates`, `tender_estimate_items`) round-trip.
3. RLS : conserver politique `submitted_by = auth.uid()` (mem `tender-security-rls`).
4. UI : densifier toolbar, normaliser dialog d'estimate (DialogDescription a11y).

## Vague 4 — Inspections, Payments, Documents, Suppliers, Employees, Materials, Tasks

Routes : `/inspections/*`, `/payments/*`, `/documents`, `/suppliers/*`, `/employees`, `/materials/*`, `/tasks/*`, `/milestones/:id`.

Pour chacune : même grille audit/fix/UI que vagues précédentes. Une PR par domaine pour rester revuable.

## Vague 5 — Profil, Settings, Auth, Workflow Test, NotFound

Polish UI + vérif que `useAuth` est la seule porte Supabase autorisée.

## Détails techniques transverses

- **Fix prioritaire #1** : `src/repositories/RepositoryFactory.ts` → `getTenderEstimateRepository` doit retourner `new TenderEstimateAdapter()` (vrai adapter).
- **Fix prioritaire #2** : `getPerformanceMonitoringRepository` → `new SupabaseMonitoringAdapter()`.
- **Dialog a11y** : déjà patché globalement dans `dialog.tsx`, juste vérifier qu'aucune Dialog custom ne re-crée le warning.
- **Mémoire** : après chaque vague, écrire `mem://features/<page>-crud-roundtrip` + mettre à jour `mem://index.md`.

## Livraison

- 1 vague par message (sinon diff ingérable).
- Chaque vague se termine par : liste fichiers changés, vérif logs console, note mémoire ajoutée.
- Démarrage proposé : **Vague 1 (Projects & Phases)** dans le prochain message dès validation du plan.

## Question ouverte

Souhaites-tu que je démarre immédiatement la **Vague 3 (fix save tender — 5 min, débloque ta démo)** avant la Vague 1 (Projects, plus long) ? Sinon je suis l'ordre proposé.
