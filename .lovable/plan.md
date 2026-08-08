# Plan de mise en conformité hexagonale (rapport-audit.json)

## Ce que dit le rapport
979 fichiers scannés, 7 192 erreurs / 15 689 avertissements. Le volume est trompeant : 2 règles (R004 snake_case, R017 "possible mock") produisent 90 % du bruit et sont majoritairement des faux positifs (accès légitimes aux lignes DB dans les adapters/transformers, gros objets de config lus comme "mock"). Les violations réellement bloquantes sont peu nombreuses et parfaitement délimitées.

| Règle | Nature | Volume | Fichiers |
|---|---|---|---|
| R003 / R008 | Appel Supabase direct hors adapter (UI/services) | 23 | 17 |
| R009 | Instanciation `new XService()` au lieu de factory | 204 | 94 |
| R014 | Types dupliqués | 299 | 86 |
| R016 | Types définis hors `domain`/`dtos` | 440 | 172 |
| R007 | snake_case dans les DTO | 154 | 44 |
| R005 | `any` explicite | 636 | 199 |
| R010 | Transformers incomplets | 21 | 21 |
| R011/R012/R013/R015 | Mocks, TODO non implémentés, mapping mal placé | 34 | 23 |
| R004 / R017 | Bruit (faux positifs à filtrer) | 20 955 | — |

## Organisation : 6 lots exécutés en parallèle

### Lot A — Supabase hors adapter (bloquant, priorité 1)
Déplacer chaque accès direct vers un adapter + service :
- `documentsTableAdapter.tsx` (select/insert/delete documents) → `DocumentService` / `SupabaseDocumentAdapter`
- `pages/Documents.tsx`, `pages/UnifiedSupplierPortal.tsx`, `BoqWorkspace.tsx`, `BoqDevisDialog.tsx`, `SecretCodeAccessGate.tsx`, `SupplierSecureAccessPortal.tsx`, `TaskAssigneeSelector.tsx`, `SupplierInspectionExecutionDialog.tsx`, `WorkflowInspection.tsx` → hooks hexagonaux existants
- `functions.invoke` (email, notification soumission) → un `NotificationGatewayAdapter` unique appelé par `SupplierNotificationService`, `DocumentService`, `TenderSubmissionNotificationService`
- `AwardedTenderToProjectService` (`phase_employees.insert`) → `SupabasePhaseAdapter`

### Lot B — Factories & services (R009)
Remplacer les `new XService(...)` par `getXService()` / `RepositoryFactory` dans les 94 fichiers, en commençant par les plus denses : `useProjectPayments`, `useMaterialsHex`, `usePhaseDetails`, `useInvoicesHex`, `useDocumentsHex`, `PaymentBlockingInterface`, `ProjectDetailByDTO`, `projectDataCalculations`.

### Lot C — Unification des types (R014 + R016)
- Supprimer les doublons : `ProjectAnalyticsDTO`, `RiskAssessmentDTO`, `CostCalculation` (garder `ProjectReportDTO`), `PhaseStepDTO`/`PhaseTaskDTO` (garder `dtos/transforms/shared.ts`), `ProjectStatus`, `MilestoneType`, `ConstructionPhase/Stage`, `ProjectData`, `TaskAssignment`, `Document`.
- Rapatrier les types de `src/utils/types.ts`, `src/utils/mauritania.ts`, `src/components/documents/hub/types.ts`, `usePhaseWorkflow`, `phaseHelpers`, services d'import/export vers `src/dtos/**` ; ne laisser dans les composants que des `Props`.
- Exceptions à conserver : `src/integrations/supabase/types.ts` (généré), `src/config/**` (référentiels), `hooks/hexagonal/index.ts` (ré-exports).

### Lot D — DTO camelCase (R007) + transformers (R010, R015)
- Convertir les 44 DTO snake_case (gros morceau : `AdvancedTenderEstimateDTO`, `PhaseDTO`, `milestone-dto`, `phase-dto`, `ReportDTO`, `NotificationDTO`) et adapter les transformers, jamais l'UI directement.
- Compléter les 21 transformers manquant `toDTO`/`fromDTO`/`toSupabase`/`fromSupabase`.
- Déplacer `toRow`/`fromRow` de `SupabaseOrganizationAdapter`, `SupabaseOrganizationHierarchyAdapter`, `TenderLotService` vers `src/dtos/transforms/`.

### Lot E — Mocks et implémentations manquantes (R011, R012, R013)
- `KeycloakAuthContext` : `mockProfile` → lecture réelle du profil via `UserService`.
- TODO à finir : `SystemHealthOverview`, `PaymentBlockingInterface`, `MilestoneService` (3), `BankGuaranteeService`, `InspectionWorkflowService`, `ProjectCalculationService`, `useMaterialsHex` (2 stubs), `useProjectMaterialsHex`, `usePhaseEmployeesHex`, `useTenderDocumentsHex`, `EnhancedRiskAnalysisStep`, `EnhancedValidationStep`, `InspectionDetailsStep`, `Users.tsx`, `PhaseStepResourceDialog`.
- `useProjectManager` : supprimer le fallback silencieux, exiger le provider.

### Lot F — Fiabilisation du script d'audit
Le script reste utile mais doit cesser de noyer les vrais problèmes :
- R004 : ne signaler le snake_case que hors `infrastructure/**`, `dtos/transforms/**`, `integrations/supabase/types.ts` et hors chaînes de requête.
- R017 : ne déclencher que sur des identifiants `mock|fake|dummy|sample`, pas sur tout bloc littéral ; exclure `src/config/referentials/**`.
- R014 : dédupliquer le comptage (299 occurrences pour ~60 types réels) et ignorer les ré-exports.
- R016 : whitelister types générés, `Props`, et `src/config/**`.
- Ajouter un `--fail-on=error` exploitable en CI et un mode `--rule R003,R008` pour cibler un lot.
- Corriger `movedTypes` (529 annoncés, 0 listés) et `typesMoved` en dry-run.

## Détails techniques
- Ordre imposé par l'architecture : DB (snake_case) → Adapter → Transformer → Entity → Service → DTO (camelCase) → UI ; aucun `supabase` importé dans `src/components` ou `src/pages` (seules exceptions : `useAuth`, URLs publiques de storage).
- Chaque lot se termine par un typecheck ; les lots C et D touchent les mêmes fichiers de DTO, ils seront donc séquencés entre eux (C puis D) mais parallèles à A, B, E, F.
- Après chaque lot, relance de `npm run fix:hexagonal -- --dry-run --json` pour mesurer la baisse d'erreurs, avec `R005` (`any`) traité en dernier, fichier par fichier, sans changement de comportement.
