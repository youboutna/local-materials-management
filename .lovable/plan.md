
# Refonte tender/supplier portals — alignement architecture & UI

## 1. Diagnostic (lecture du code)

### Pages & composants concernés
| Surface | Fichier | LOC | Statut |
|---|---|---:|---|
| `/tender-management` | `pages/TenderManagement.tsx` | 509 | 8 onglets redondants, `TenderDTO` incomplet |
| `/supplier-portal` | `pages/UnifiedSupplierPortal.tsx` | 1000 | `@ts-nocheck`, monolithe 8 onglets |
| `/supplier-portal` (legacy) | `pages/SupplierPortal.tsx` | 475 | **orphelin** non routé |
| (legacy) | `pages/SupplierDashboard.tsx` | 308 | **orphelin** non routé |
| `/supplier-tender` | `components/suppliers/EnhancedSupplierTenderPortal.tsx` | 698 | `supabase.from()` direct, 4 onglets, types `@/types/*` |
| `/supplier-access` | `components/tenders/SupplierSecureAccessPortal.tsx` | 292 | `supabase.from('tenders')` direct |
| `/evaluation-access` | `components/tenders/EvaluationAccessPortal.tsx` | 268 | OK service, mais duplique le gate du précédent |
| Composants tender/workflow | `TenderWorkflowSteps`, `PublicProcurementWorkflow`, `WorkflowStepSelector`, `StepDocumentsSection`, `StandardWorkflowDocumentSuggestions` | — | import `@/types/workflow` & `@/types/tender` legacy |

### Incohérences détectées
1. **Doublons d'onglets** dans `TenderManagement` : `workflow` / `stepper` / `steps` couvrent le même cycle ; `phases` / `lots` / `timeline` se chevauchent.
2. **Doublons de portails** : `SupplierPortal.tsx` et `SupplierDashboard.tsx` orphelins ; `EnhancedSupplierTenderPortal` embarqué deux fois (onglet « tenders » de Unified + page `/supplier-tender`).
3. **Doublons de gate code-secret** : `SupplierSecureAccessPortal` et `EvaluationAccessPortal` partagent la même UI de saisie de code (un seul `SecretCodeGate` paramétrable suffit).
4. **Violations Règle #1 (Hexagonale)** :
   - `supabase.from()` direct dans `SupplierSecureAccessPortal`, `EnhancedSupplierTenderPortal`.
   - Imports `@/types/workflow`, `@/types/workflow-dto`, `@/types/tender`, `@/types/paymentInitiation` (au lieu de `@/dtos/*`).
   - `@ts-nocheck` sur 4 fichiers de scope.
5. **Round-trip DB cassé** : `TenderDTO` (8 champs) ↔ table `tenders` (≥20 colonnes : `tender_number`, `deadline_date`, `budget_min/max`, `evaluation_criteria`, `eligibility_requirements`, `publication_date`, `current_phase`, `financing_source`, `project_reference`…) ↔ `Tender` entity (couvre tout) ↔ `SupabaseTenderAdapter` (mapping partiel, `update()` ne mappe que 3 champs).
6. **Référentiels non branchés** : `standardWorkflow` codé en dur au lieu de `mauritanian-public-procurement.referential.ts` ; aucune alerte délai via `DeviationEngine` ; aucune intégration `indicator-templates` pour le TBI tender.

## 2. Objectifs

- 100 % du scope conforme `docs/PROMPTS.md` (flèche sacrée UI → Transformer → DTO → Service → Adapter → DB).
- Onglets dédoublonnés, UX cohérente avec la promesse « ERP intégré HadraTech-GPI ».
- Round-trip complet : chaque champ de formulaire trouvé → DTO → entity → DB et inversement (hydratation initiale + sauvegarde + relecture).
- Comportement métier (étapes, délais, indicateurs) lu depuis `src/config/referentials/`.

## 3. Plan d'exécution (ordre)

### Étape A — Nettoyage des orphelins & des doublons
- Supprimer `src/pages/SupplierPortal.tsx`, `src/pages/SupplierDashboard.tsx`.
- Supprimer `useSupplierDashboardHex` si plus référencé après suppression.
- Retirer la route `/supplier-submissions` redondante (déjà couverte par onglet `submit` de `EnhancedSupplierTenderPortal`) ou la garder uniquement en deep-link.
- Fusionner `SupplierSecureAccessPortal` + `EvaluationAccessPortal` → un composant générique `components/access/SecretCodeAccessGate.tsx` + deux wrappers minces (`/supplier-access`, `/evaluation-access`) qui choisissent le panneau résultat (`DocumentDownloadPanel` vs `SubmissionEvaluationPanel`).

### Étape B — Hexagonalisation (Règle #1 + #2)
1. Étendre `TenderDTO` (`dtos/entities/TenderDTO.ts`) avec : `tenderNumber`, `deadlineDate`, `publicationDate`, `budgetMin`, `budgetMax`, `currentPhase`, `evaluationCriteria`, `eligibilityRequirements`, `financingSource`, `projectReference`.
2. Créer `dtos/transforms/TenderTransformer.ts` (`fromSupabase`, `toSupabase`, `toDTO`, `fromDTO`, `formToCreateRequest`) — bidirectionnel complet snake_case ↔ camelCase.
3. Compléter `SupabaseTenderAdapter` : `mapToEntity` couvre toutes les colonnes ; `save`/`update` utilisent `TenderTransformer.toSupabase` pour ne plus oublier de champs.
4. Idem `TenderSubmissionDTO` + `TenderSubmissionTransformer` (round-trip soumission fournisseur).
5. Remplacer tous les `supabase.from(...)` du scope par `TenderService` / `TenderSubmissionService` / `TenderSharingService`.
6. Remplacer imports `@/types/workflow*`, `@/types/tender`, `@/types/paymentInitiation` par les DTOs (`@/dtos/workflows/WorkflowDTO`, `@/dtos/entities/TenderDocumentDTO`, etc.). Migrer les constantes (`TENDER_DOCUMENT_LABELS`, etc.) vers `src/config/referentials/tenders/`.
7. Retirer `@ts-nocheck` des fichiers du scope une fois les types alignés.

### Étape C — Référentiels (Règle d'or `ARCHITECTURE_REFERENTIELS`)
- Brancher `mauritanian-public-procurement.referential.ts` dans `TenderWorkflowSteps`, `PublicProcurementWorkflow`, `WorkflowStepSelector` (suppression de `standardWorkflow` hardcodé).
- `TenderTimelineCard` consomme `DeviationEngine` pour les délais AON/gré-à-gré (alerte rouge si seuil dépassé).
- Carte d'indicateurs tender (taux soumissions, écart délai, taux conformité) via `indicator-templates.referential.ts`.

### Étape D — Refonte UI (dédoublonnage des onglets)

**`/tender-management` — 8 onglets → 4** :
```text
| Workflow & Étapes | Lots & Phases | Documents | Évaluation |
```
- `Workflow & Étapes` = fusion `workflow + stepper + steps + timeline` (un seul `TenderWorkflowBoard` piloté par référentiel, avec mini-timeline en en-tête).
- `Lots & Phases` = fusion `phases + lots` (table maître-détail).
- `Documents` = inchangé mais consomme `TenderDocumentService`.
- `Évaluation` = inchangé, déjà consolidé.

**`/supplier-portal` (UnifiedSupplierPortal, 8 onglets → 5)** :
```text
| Mes Appels d'Offres | Documents | Paiements & Factures | Tâches & Inspections | Notifications |
```
- Fusion `tenders` + onglet « submit »/« estimate » du EnhancedSupplierTenderPortal sous **un seul** sous-onglet « Mes Appels d'Offres » (plus de double-emploi avec `/supplier-tender`).
- Fusion `documents` + `upload` (l'upload devient un bouton dans le tableau Documents).
- Fusion `payments` + `invoices` → « Paiements & Factures ».
- Fusion `tasks` + `inspections` → « Tâches & Inspections » (table unifiée filtrable).
- Notifications garde son badge.
- Découper le fichier de 1000 lignes en sous-composants `tabs/<Tab>.tsx`.

**`/supplier-tender`** : devient un **deep-link** réutilisant `EnhancedSupplierTenderPortal` refondu en 3 onglets (`Parcourir | Soumettre | Mes estimations`), l'onglet « documents » étant déjà dans le portail unifié.

**`/supplier-access` & `/evaluation-access`** : nouveau gate commun + panneau dédié, plus aucune duplication.

### Étape E — Round-trip de validation
Pour chaque entité (Tender, TenderSubmission, TenderDocument, SharedSecret) :
1. Charger le formulaire à partir du DTO.
2. Soumettre → Service → Adapter → DB.
3. Relire l'enregistrement et confirmer que chaque champ est restitué (manuellement via le preview + un test smoke).

## 4. Livrables
- Suppression : 2 pages orphelines + 1 composant gate dupliqué.
- Nouveaux : `TenderTransformer`, `TenderSubmissionTransformer`, `SecretCodeAccessGate`, sous-composants d'onglets supplier portal, référentiels tender documents.
- Modifs : `TenderDTO`, `SupabaseTenderAdapter`, `TenderManagement`, `UnifiedSupplierPortal`, `EnhancedSupplierTenderPortal`, `SupplierSecureAccessPortal`, `EvaluationAccessPortal`, `TenderWorkflowSteps`, `PublicProcurementWorkflow`, `WorkflowStepSelector`, `StepDocumentsSection`, `StandardWorkflowDocumentSuggestions`, `TenderTimelineCard`, `App.tsx` (routes).
- Mémoire projet : ajouter entrée `mem://features/tender-supplier-portals-refonte`.

## 5. Hors-scope
- Pas de changement de schéma DB (les colonnes `tenders` existent déjà ; on aligne uniquement DTO/Adapter).
- Pas de refonte des notifications/emails fournisseurs.
- Pas de réécriture des services `TenderSubmissionService` côté logique métier (uniquement consommation).
