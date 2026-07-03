## Objectif
Aligner **45 fichiers** (31 composants + 2 pages + 3 contexts + 4 hooks + 5 domain/utils/scripts) sur les règles de `docs/PROMPTS.md` : **zéro import `@/integrations/supabase` dans `src/components/**`, `src/pages/**`, `src/contexts/**` (sauf `useAuth` interne), `src/hooks/hexagonal/**` (doivent passer par Services)**. Flux obligatoire : UI → Hook hexagonal → Service → Repository → Adapter → DB.

## Périmètre exact (45 fichiers détectés par scan)

**Composants UI (31)** — passent tous via un Service/hook hexagonal :
- Tenders (6) : `TenderProjectStructure`, `EnhancedTenderEstimator`, `TenderExcelImporter`, `TenderEvaluationPanel`, `TenderDocumentManager`, `PublicTendersList`
- Suppliers (5) : `EnhancedSupplierTenderPortal`, `SupplierDocumentUpload`, `TaskCompletion`, `SupplierInspectionExecutionDialog`, + `documents/TenderDocumentUploadForm`
- Project (7) : `PhaseWorkflowContainer`, `PhaseStepTaskManager`, `TeamOverview`, `ProjectCreateByDTO`, `EnhancedWorkflowPhaseManager`, `ProjectFormWithMap`, `inspection/InspectionFormWithContext`
- Inspections (3) : `AdvancedInspectionScheduler`, `EnhancedScheduleInspectionModal`, `InspectionFormWithProjectSelector`
- Divers (10) : `ActionsDropdown`, `EscalationThresholdsSettings`, `TaskAssignments`, `UnifiedInsuranceManager`, `ConsultantValidationPanel`, `NotificationCrud`, `PaymentRequestModal`, `AdminEmailsSettings`, `UserManagementDialog`, `WorkspaceCreateDialog`

**Pages (2)** : `Suppliers.tsx`, `TendersPublic.tsx`
**Contexts (3)** : `AuthContext`, `HexagonalAuthContext`, `UnifiedAuthContext` (unifier — cf. mémoire `auth/hexagonal-unification`)
**Hooks hexagonaux violants (4)** : `usePhaseMaterialsHex`, `useReceptionManagement`, `useUnifiedSupplierPortalHex`, `useProjectCheckpoints`
**Domain/Utils (5)** : `MaterialRepository`, `SupplierPaymentRepository`, `TenderRepository` (interfaces qui importent le type Supabase — retirer), `notificationToTaskMapper`, `scripts/loadDataToSupabase`

## Stratégie d'exécution — un seul batch

### Phase A — Cartographie & Services manquants (lecture parallèle)
1. Lire les 45 fichiers pour recenser chaque appel `supabase.*` (from/storage/functions/rpc/auth).
2. Croiser avec `src/application/services/*` pour identifier les méthodes manquantes.
3. Créer/étendre les Services et Repository interfaces requis :
   - `SupplierPortalService` (portail + accès sécurisé)
   - `TenderPublicService` (liste publique AO)
   - `WorkspaceService.create/list`
   - `UserAdminService` (CRUD users + rôles)
   - `NotificationService.crud` complet
   - `PaymentService.createRequest`
   - `InsuranceService.upsertUnified`
   - `InspectionSchedulerService` (advanced + enhanced)
   - `EscalationSettingsService`, `AdminEmailsService`
   - `TaskAssignmentService`
   - `MaterialService`, `CheckpointService` pour purger les hooks
4. Ajouter méthodes de storage manquantes derrière un port `StorageGateway` (upload/getPublicUrl/remove) — un seul adapter dans `infrastructure/supabase/adapters/SupabaseStorageAdapter.ts`.

### Phase B — Réécriture parallèle des 45 fichiers
- Remplacer chaque `import { supabase }` par les hooks hexagonaux correspondants (`useXxxHex`) ou appel de service via `RepositoryFactory`.
- Contexts auth : conserver uniquement `HexagonalAuthContext`, faire de `AuthContext`/`UnifiedAuthContext` de simples ré-exports (compat) — mémoire `auth/hexagonal-unification`.
- Hooks hex violants : rediriger vers Service correspondant, plus aucun accès direct DB.
- Domain repositories : retirer les imports du type Supabase (`Database['public']…`) et redéfinir les types dans `src/dtos/entities/*`.
- Utils/scripts : `notificationToTaskMapper` → prendre DTO en entrée ; `loadDataToSupabase` → déplacer sous `src/infrastructure/scripts/` (hors périmètre UI).

### Phase C — Vérification stricte
1. `rg "@/integrations/supabase" src/components src/pages src/contexts src/hooks/hexagonal src/domain src/utils` → doit être **vide** (sauf `contexts/HexagonalAuthContext` autorisé pour `auth`).
2. `bunx tsgo -p tsconfig.app.json` → 0 erreur.
3. Build Vite auto (harness) → OK.
4. Lancer app + smoke test Playwright sur : liste AO, détail AO, création projet, portail fournisseur (code secret), inspection scheduler, notifications.

## Livrables & rapport final
- Liste exhaustive **fichiers créés** (nouveaux Services, StorageGateway, DTOs).
- Liste **fichiers modifiés** (45 cibles + adapters/factory).
- Liste **fichiers supprimés/déplacés** (scripts legacy).
- **Points de vérification manuels** :
  1. Portail fournisseur via code secret (`/supplier-secure-access?code=…`).
  2. CRUD AO complet + workflow + décision.
  3. Création workspace + invite user.
  4. Upload document AO (storage via gateway).
  5. Planif inspection + PV.
  6. Notifications CRUD + escalade admin.

## Notes techniques
- Respect strict des mémoires : pas de React dans services, DTO camelCase, entités `Interface + create()`, TanStack Query v5 sans `onError/onSuccess`, imports dynamiques du client Supabase dans les adapters.
- StorageGateway = seul point autorisé à toucher `supabase.storage` hors UI.
- Aucun ID généré côté UI (mémoire `project-workflow-id-policy`).
- Grants public respectés pour toute nouvelle table (aucune prévue ici).
