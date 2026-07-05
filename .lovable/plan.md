## STATUT — Plan v3 FINALISÉ

> **Schéma métier par défaut = `btp`** (Hadratech-GPI). Toutes les tables BOQ
> (`quantity_takeoffs`, `tender_estimate_items`, `project_milestones`,
> `phase_materials`, `phase_employees`, `projects`) vivent dans `btp.*`. Le
> schéma `public` n'expose que les vues transverses (`public.quantity_takeoffs`
> ↦ `btp.quantity_takeoffs`) et les tables d'auth/roles. Toute nouvelle table
> BOQ créée par ce plan DOIT être `btp.<name>` — jamais `public.*`.
> Côté client, accès via `btpClient` (`supabase.schema('btp')`) une fois `btp`
> exposé (Dashboard > API > Exposed schemas + `VITE_BTP_SCHEMA=btp`). Sinon,
> `SupabaseBoqRepository` utilise les vues `public.*` en fallback (déjà en place).

### ✅ Livré (Batches B / C / F / D)

**DB (btp)** : `btp.quantity_takeoffs` + `btp.tender_estimate_items` étendues
(phase/milestone/task, unit_price, total_value, vat_rate, resource_type,
source, bid_ref, submitted_by). Vue `public.quantity_takeoffs` recréée. Non destructif.

**Domaine / DTO** : `src/domain/boq/{BoqLine,BoqDocument,WbsRef}.ts`,
`src/dtos/boq/{BoqLineDTO,BoqLineMapper}.ts` (snake↔camel + `reproject`).

**Ports / Adapter** : `IBoqRepository` + `SupabaseBoqRepository` — un seul
adapter route vers `quantity_takeoffs` ou `tender_estimate_items` selon
`source` (`quantity_takeoff` | `tender_estimate` | `supplier_bid` | `dqe`).

**Parseurs** : `SpreadsheetBoqParser` (xlsx/csv), `PdfBoqParser` (clustering Y
pdfjs), `BoqImportOrchestrator` (auto-mapping fuzzy).

**Orchestration** : `TenderToPlanningService.convert({estimateId, projectId})`.

**Hooks TanStack v5** : `useBoqDocument`, `useBoqImport`, `useTenderToPlanning`.

**UI barrel `src/components/boq/`** : `WbsSelector`, `PriceSummary`,
`ImportDropzone`, `ImportMappingWizard`, `BoqLineTable`, `BoqComparisonTable`,
`BoqImportDialog`.

**Câblages** :
- `AwardedTenderPreviewDialog` → « Copier lignes DQE → métré projet ».
- `PhaseQuantityTakeoffTab` → « Import BOQ » (PDF/Excel/CSV).

### ⏭ Résiduel (composant-à-composant, aucun code métier neuf)

- `SupplierBidWizard` : `<BoqImportDialog source="supplier_bid">` + `<BoqLineTable source="supplier_bid" mode="edit">`.
- `TenderQuantitativeEstimate` / `EnhancedTenderEstimator` : passer sur `<BoqLineTable source="tender_estimate">` + `<PriceSummary>` via `useBoqDocument`.
- `DQEImportDialog` legacy : wrapper autour de `<BoqImportDialog source="dqe">` puis suppression.
- `TenderExcelImporter` : wrapper `<ImportDropzone accept=".xlsx">` + `<ImportMappingWizard>`.
- `PhaseEmployees` : onglet « Estimation » via `<BoqLineTable resourceType="labor">`.
- `FinaancialOverview` : rollup projet via `BoqCalculatorService.aggregateByMilestone`.
- `SubmissionEvaluationPanel` : `<BoqComparisonTable estimateSource="tender_estimate" bidSource="supplier_bid">`.

### 🔒 Règle de schéma appliquée à toute nouvelle migration BOQ

```sql
-- OUI
CREATE TABLE btp.<nouvelle_table_boq> (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.<nouvelle_table_boq> TO authenticated;
GRANT ALL ON btp.<nouvelle_table_boq> TO service_role;
ALTER TABLE btp.<nouvelle_table_boq> ENABLE ROW LEVEL SECURITY;
-- + policy scoped auth.uid()

-- Vue publique optionnelle si un composant public en a besoin :
CREATE OR REPLACE VIEW public.<nouvelle_table_boq> AS
  SELECT * FROM btp.<nouvelle_table_boq>;
GRANT SELECT ON public.<nouvelle_table_boq> TO anon, authenticated;
```

**Jamais** `CREATE TABLE public.<boq_*>` — le schéma métier est `btp`.

---




# Plan v3 — Noyau BOQ composable + câblages transverses

Prolonge Plan v2 (déjà exécuté en P0). Ajoute la carte de câblage complète des composants BOQ sur les 4 parcours métier concernés.

## Rappel : noyau `boq` (statut P0 fait)

- ✅ `config/referentials/boq/units.referential.ts`
- ✅ `config/referentials/wbs/wbs.referential.ts`
- ✅ `application/services/boq/BoqCalculatorService.ts` (calc L×W×H, HT/TVA/TTC, agrégations)
- ✅ `application/services/boq/BoqValidatorService.ts` (messages ciblés)
- ✅ Fix `QuantityTakeoffService.createQuantityTakeoff` (bug création métré)
- ✅ Fix `parseInvoiceFromPdf` (clustering Y pdfjs)

Reste à créer (P1) : domain `BoqLine` / `BoqDocument`, `IBoqRepository` + `SupabaseBoqRepository` paramétré par `source`, mapper unique, composants `components/boq/*` (`BoqLineEditor`, `BoqLineTable`, `WbsSelector`, `MaterialPicker`, `PriceSummary`, `ImportDropzone`, `ImportMappingWizard`), parseurs (`PdfBoqParser`, `SpreadsheetBoqParser`, `OcrFallbackParser`).

---

## Carte de câblage des 4 parcours

### 1) Fournisseur — Parseur devis + Estimator DQE

**Surfaces cibles**
- `SupplierBidWizard.tsx` (dépôt d'offre par fournisseur)
- `EnhancedSupplierTenderPortal.tsx` (portail fournisseur)
- `TenderExcelImporter.tsx` (import xlsx d'un devis fournisseur)

**Câblage**
- Import : `<ImportDropzone accept="pdf,xlsx,csv">` → `BoqImportOrchestrator` → `<ImportMappingWizard>` → `BoqLine[]` (source=`supplier_bid`).
- Édition : `<BoqLineTable source="supplier_bid" mode="edit">` avec colonnes `unitPrice`, `deliveryDelay`, `discountRate`.
- Estimator : `BoqCalculatorService.aggregateByPhase(lines)` → totaux HT/TVA/TTC + comparaison auto vs `tender_estimate_items` (écart % et rang par ligne).
- Persistance : `SupabaseBoqRepository(source='supplier_bid')` → `tender_estimate_items` (colonnes `submitted_by`, `bid_ref`).
- `TenderExcelImporter.tsx` = wrapper mince autour de `<ImportDropzone accept="xlsx">`.

### 2) Estimator DQE (côté acheteur / bureau d'études)

**Surfaces cibles**
- `EnhancedTenderEstimator.tsx`
- `TenderQuantitativeEstimate.tsx`
- `DqeResourcePicker.tsx`
- `DQEImportDialog.tsx` (dans `project/phase/`)

**Câblage**
- Saisie ligne à ligne : `<BoqLineEditor source="tender_estimate">` (WBS + matériau + PU) + `<PriceSummary>`.
- Vue tableau : `<BoqLineTable source="tender_estimate">` avec édition inline, tri par phase/jalon, total pied de page.
- Ressources : `DqeResourcePicker` alimente `materialRef` (via `MaterialPicker`) + `resource_allocation.referential.ts` pour main d'œuvre / équipement (ajout d'un champ `resourceType: 'material'|'labor'|'equipment'` sur `BoqLine`).
- Import DQE existant : `DQEImportDialog` refactor → `<ImportDropzone>` + `<ImportMappingWizard>` + `<BoqLineTable>`.
- Hook `useTenderQuantitativeEstimateHex` : refactor pour consommer `SupabaseBoqRepository(source='tender_estimate')` au lieu du hook custom.

### 3) Projet — Estimation ressources (humaines + matérielles)

**Surfaces cibles**
- `QuantityTakeoffForm.tsx` (P0 déjà partiellement câblé)
- `QuantityTakeoffs.tsx` / `QuantityTakeoffsList.tsx`
- `PhaseMaterials.tsx` (matériaux par phase)
- `PhaseEmployees.tsx` (RH par phase)
- `ProjectMaterials.tsx`

**Câblage**
- `QuantityTakeoffForm` = `<BoqLineEditor source="quantity_takeoff">` avec `resourceType='material'` par défaut ; toggle vers `labor`/`equipment` pour estimer main d'œuvre (unité = h/j, PU = coût horaire depuis `phase_employees.hourly_rate`).
- `QuantityTakeoffsList` = `<BoqLineTable source="quantity_takeoff" projectId=…>` (édition inline + totaux par phase).
- `PhaseMaterials` : passe par la même vue filtrée `resourceType='material'`.
- `PhaseEmployees` : ajout d'un onglet "Estimation" utilisant `<BoqLineTable resourceType='labor'>` (mêmes composants, source `quantity_takeoff`, filtre resourceType).
- Rollup projet : `BoqCalculatorService.rollupByProject(projectId)` alimente `FinaancialOverview.tsx`.

### 4) Cycle appel d'offre accepté → Planification + Import DQE

**Surfaces cibles**
- `PublicProcurementWorkflow.tsx` (workflow public)
- `TenderWorkflowPanel.tsx` (statut attribué → conversion en projet)
- `ProjectCreationWorkflow.tsx` / `ProjectWorkflowService`
- `PhaseStepsManager.tsx` / `PhaseQuantityTakeoffTab.tsx`

**Câblage — Acceptation appel d'offre → planification**
- Nouveau service `application/services/tender/TenderToPlanningService.ts` :
  - Input : `tenderId` attribué + `winningEstimateId`.
  - Étape 1 : lit `BoqLine[]` du tender (`source='tender_estimate'` filtré par lot gagné) via `SupabaseBoqRepository`.
  - Étape 2 : appelle `ProjectWorkflowService.createFromTender()` → crée projet + phases depuis référentiel WBS.
  - Étape 3 : convertit `BoqLine[]` tender → `BoqLine[]` projet (change `source='quantity_takeoff'`, mappe `phaseId`) via `BoqLineMapper.reproject()` (pur, testable).
  - Étape 4 : persist en lot via `SupabaseBoqRepository(source='quantity_takeoff').bulkCreate()`.
  - Étape 5 : alimente `project_milestones` (jalons issus du WBS) + `phase_materials` (agrégation par matériau) via `BoqCalculatorService.aggregateByMaterial()`.
- UI : `<AwardedTenderPreviewDialog>` déjà présent → ajouter bouton "Convertir en projet planifié" appelant `TenderToPlanningService`.
- Toast détaillé : nb phases, nb lignes copiées, matériaux consolidés.

**Câblage — Planification + import parseur devis / DQE**
- Dans `PhaseQuantityTakeoffTab.tsx` (déjà consommateur de `DQEImportDialog`) : le dialog refactored consomme `<ImportDropzone>` + `<ImportMappingWizard>` + preview `<BoqLineTable>`.
- Import direct dans une phase : source = `quantity_takeoff` avec `phaseId` pré-rempli.
- Import devis fournisseur pour valider une phase : `source='supplier_bid'`, écran de comparaison `<BoqComparisonTable estimateSource='quantity_takeoff' bidSource='supplier_bid'>`.
- Nouvelle règle métier : à l'import, si `wbsRef` absent → `ImportMappingWizard` demande phase/jalon obligatoire (`BoqValidatorService.requireWbs`).

---

## Nouveaux fichiers (P1 à créer)

```text
src/domain/boq/
  BoqLine.ts                                 # Entity readonly + factory create()
  BoqDocument.ts
  WbsRef.ts

src/dtos/boq/
  BoqLineDTO.ts                              # camelCase
  ImportMappingDTO.ts
  BoqLineMapper.ts                           # snake↔camel + reproject(tender→projet)

src/domain/repositories/
  IBoqRepository.ts                          # port (paramétré par source)

src/infrastructure/supabase/adapters/
  SupabaseBoqRepository.ts                   # écrit sur quantity_takeoffs | tender_estimate_items selon source

src/application/services/boq/
  BoqImportOrchestrator.ts
  parsers/IDocumentParser.ts
  parsers/PdfBoqParser.ts
  parsers/SpreadsheetBoqParser.ts
  parsers/OcrFallbackParser.ts

src/application/services/tender/
  TenderToPlanningService.ts                 # orchestrateur "tender attribué → projet planifié"

src/components/boq/
  BoqLineEditor.tsx
  BoqLineTable.tsx
  BoqComparisonTable.tsx                     # estimation vs offre / prévu vs réel
  WbsSelector.tsx
  MaterialPicker.tsx
  PriceSummary.tsx
  ImportDropzone.tsx
  ImportMappingWizard.tsx

src/hooks/hexagonal/
  useBoqDocument.ts                          # useQuery paramétré (source, contextId)
  useBoqImport.ts                            # useMutation import
  useTenderToPlanning.ts                     # useMutation acceptation
```

## Fichiers refactorés (P1)

- `QuantityTakeoffForm.tsx`, `QuantityTakeoffsList.tsx` → `<BoqLineEditor>` / `<BoqLineTable>`.
- `DQEImportDialog.tsx` → composants boq.
- `TenderExcelImporter.tsx`, `TenderQuantitativeEstimate.tsx`, `EnhancedTenderEstimator.tsx`, `DqeResourcePicker.tsx` → boq.
- `SupplierBidWizard.tsx` → `<ImportDropzone>` + `<BoqLineTable source="supplier_bid">`.
- `AwardedTenderPreviewDialog.tsx` → bouton conversion + `useTenderToPlanning`.
- `PhaseQuantityTakeoffTab.tsx`, `PhaseMaterials.tsx`, `PhaseEmployees.tsx` → filtres BOQ.
- `useTenderQuantitativeEstimateHex.ts`, `useQuantityTakeoffHex.ts` → délèguent à `useBoqDocument`.
- `FinaancialOverview.tsx` → rollup via `BoqCalculatorService`.

## Migration DB (une seule)

```sql
-- Extension BoqLine sur les 2 tables existantes (nullable, non destructif)
ALTER TABLE public.quantity_takeoffs
  ADD COLUMN IF NOT EXISTS task_id text NULL,
  ADD COLUMN IF NOT EXISTS total_value numeric NULL,
  ADD COLUMN IF NOT EXISTS resource_type text NULL DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS vat_rate numeric NULL DEFAULT 0;

ALTER TABLE public.tender_estimate_items
  ADD COLUMN IF NOT EXISTS task_id text NULL,
  ADD COLUMN IF NOT EXISTS resource_type text NULL DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS bid_ref text NULL,
  ADD COLUMN IF NOT EXISTS submitted_by uuid NULL;
```

Grants + policies conservés (les 2 tables existent déjà). Pas de renommage — `BoqLineMapper` absorbe les différences (`unit_price` vs `pu`, etc.).

---

## Exécution — batchs parallèles

```text
Batch B (Noyau)              Batch C (Parseurs)           Batch F (Migration DB)
─ domain/boq                 ─ PdfBoqParser               ─ SQL ALTER (une passe)
─ IBoqRepository             ─ SpreadsheetBoqParser
─ SupabaseBoqRepository      ─ OcrFallbackParser
─ BoqLineMapper              ─ BoqImportOrchestrator
─ hooks useBoqDocument       ─ ImportMappingWizard

              ▼ (dépend de B + C + F)
Batch D (Intégrations UI parallèles)
─ D1 Fournisseur : SupplierBidWizard, TenderExcelImporter, EnhancedSupplierTenderPortal
─ D2 Estimator   : EnhancedTenderEstimator, TenderQuantitativeEstimate, DqeResourcePicker, DQEImportDialog
─ D3 Projet      : QuantityTakeoffForm/List, PhaseMaterials, PhaseEmployees, ProjectMaterials
─ D4 Cycle AO    : TenderToPlanningService + AwardedTenderPreviewDialog + PhaseQuantityTakeoffTab

              ▼
Batch E (P2)
─ BoqComparisonTable
─ MilestoneBudgetDashboard (prévu vs réel)
─ FinaancialOverview rollup
```

B + C + F en parallèle → D1..D4 en parallèle → E.

---

## Contraintes respectées

- Flux hexagonal strict (UI → transformer → DTO → service → domaine ← adapter ← DB).
- Zéro `supabase.from()` en UI/hooks.
- Référentiels BOQ/WBS/DQE centralisés dans `src/config/referentials/`.
- TanStack Query v5 (aucun `onError`/`onSuccess`).
- Entities readonly + factory `create()`.
- Adapters retournent Entities/DTO, jamais des payloads Supabase bruts.
- Services purs TS, sans React ni Supabase direct.

## Bénéfices

- Un fournisseur qui dépose un devis PDF, un BE qui bâtit un DQE, un chef de projet qui saisit un métré, et l'orchestrateur qui convertit un AO gagné en planning : **tous** consomment les **mêmes** composants et **la même** stack de parseurs / calculateurs / validateurs.
- Nouveau parcours (avenant, décompte, situation) = 1 nouvelle valeur `source` + réutilisation UI immédiate.
- Comparaisons transverses (estimation vs offre, prévu vs réel) triviales via `BoqComparisonTable`.
