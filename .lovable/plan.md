
# Plan v2 — Noyau composable BOQ + Correctifs Métré/PDF

## Constat architectural

Trois surfaces manipulent la même donnée métier (une ligne = désignation + unité + quantité + PU + WBS + source) avec du code dupliqué :

- **QuantityTakeoff** (métré projet) — `QuantityTakeoffService`, `QuantityTakeoffForm`, `AdvancedQuantityCalculator`
- **DQE Import** — `DQEImportService`, `DQEParsedRow`, `DQEImportDialog`
- **Tender Estimator** — `TenderEstimateService`, `QuantitativeEstimateExporter`, `DqeResourcePicker`, `SupplierBidWizard`

Chacun a son parseur, son mapping, son transformer, son composant "matériau + quantité + prix". → Duplication, bugs isolés (create métré cassé, PDF cassé), incohérences PU/TVA.

## Cible : un noyau `boq` (Bill Of Quantities) partagé

```text
src/
├── domain/boq/                       # Modèle unifié
│   ├── BoqLine.ts                    # Entity: designation, unit, qty, unitPrice, vat, wbsRef, materialRef, source
│   ├── BoqDocument.ts                # Aggregate: lines + totals + context (projectId | tenderId | submissionId)
│   └── WbsRef.ts                     # { phaseId, milestoneId, taskId }
│
├── application/services/boq/
│   ├── BoqCalculatorService.ts       # Pur : calc qty (L*W*H), totals HT/TVA/TTC, agrégations par phase/jalon
│   ├── BoqValidatorService.ts        # Validation unité/dimensions/PU, messages ciblés
│   ├── BoqImportOrchestrator.ts      # PDF|Excel|CSV → BoqLine[] avec mapping assisté
│   └── parsers/
│       ├── IDocumentParser.ts        # Port
│       ├── PdfBoqParser.ts           # pdfjs + reconstruction lignes par y + tableaux
│       ├── SpreadsheetBoqParser.ts   # xlsx + csv (papaparse)
│       └── OcrFallbackParser.ts      # Tesseract.js (rendu canvas pdfjs)
│
├── infrastructure/adapters/boq/
│   ├── SupabaseBoqRepository.ts      # CRUD générique paramétré par `source` (quantity_takeoffs | tender_estimate_items | dqe_lines)
│   └── BoqLineMapper.ts              # snake_case ↔ camelCase bidirectionnel unique
│
├── dtos/boq/
│   ├── BoqLineDTO.ts                 # camelCase, forme unique
│   └── ImportMappingDTO.ts
│
├── config/referentials/
│   ├── wbs/wbs.referential.ts        # Phases → Jalons → Tâches
│   └── boq/units.referential.ts      # m³/m²/m/unité + règles dimensions requises
│
└── components/boq/                   # Composants UI réutilisables
    ├── BoqLineEditor.tsx             # Édition d'une ligne (matériau, WBS, unité, dims, PU, total)
    ├── BoqLineTable.tsx              # Tableau editable + totaux par phase
    ├── WbsSelector.tsx               # Cascade Phase → Jalon → Tâche
    ├── MaterialPicker.tsx            # Sélection matériau + affichage PU
    ├── PriceSummary.tsx              # Qté × PU = HT + TVA + TTC
    ├── ImportDropzone.tsx            # PDF/Excel/CSV drop
    └── ImportMappingWizard.tsx       # Assistant colonnes → champs
```

**Consommateurs (deviennent minces)** :
- `QuantityTakeoffForm` = `<BoqLineEditor source="project">` + submit vers `SupabaseBoqRepository(source='quantity_takeoffs')`.
- `DQEImportDialog` = `<ImportDropzone>` + `<ImportMappingWizard>` + `<BoqLineTable source="dqe">`.
- `TenderEstimateService` + `QuantitativeEstimateExporter` = `<BoqLineTable source="tender_estimate">` + agrégations `BoqCalculatorService`.
- `SupplierBidWizard` = même `<BoqLineTable>` en mode lecture + colonnes prix soumissionnaire.

## Flux hexagonal (immutable)

```text
UI (BoqLineEditor camelCase)
  → BoqLineMapper.toDto()
  → BoqLineDTO (camelCase)
  → BoqCalculatorService / BoqValidatorService (pur domaine)
  → IBoqRepository (port)
  → SupabaseBoqRepository (adapter, snake_case, table selon source)
  → DB
```

Aucun `supabase.from()` en UI/hooks. Un seul mapper bidirectionnel. Référentiels centralisés.

---

## P0 — Correctifs bloquants (bugs actuels)

### Bug 1 : « Impossible de créer le métré »
`QuantityTakeoffService.createQuantityTakeoff` cast `projectRepository` vers `{ createQuantityTakeoff }` inexistant → l'appel échoue silencieusement.
- Remplacer par `IBoqRepository` (nouveau) OU dans un premier temps câbler `SupabaseQuantityTakeoffAdapter` déjà existant via `RepositoryFactory`.
- Toast d'erreur = `error.message` réel, plus le texte générique.
- `BoqValidatorService` : messages ciblés (unité manquante, largeur requise pour m², hauteur pour m³, matériau requis).

### Bug 2 : « Impossible d'analyser le PDF »
`parseInvoiceFromPdf` (`utils/integrations.ts`) fait `split("\n")` sur du texte pdfjs sans retour ligne.
- `PdfBoqParser` : reconstruction lignes via `item.transform[5]` (y), clustering colonnes via `x`, détection tableaux.
- `OcrFallbackParser` : si texte < 500 char ou < 100 lettres → rendu canvas + Tesseract.js.
- Erreur enrichie (page, cause).

## P1 — Noyau BOQ + intégration 3 surfaces

1. Créer `domain/boq/`, `dtos/boq/`, `BoqLineMapper`.
2. Créer `BoqCalculatorService` + `BoqValidatorService` (pur TS).
3. Créer `IBoqRepository` + `SupabaseBoqRepository` (paramétré par `source`).
4. Créer composants `components/boq/*` (BoqLineEditor, WbsSelector, MaterialPicker, PriceSummary, BoqLineTable).
5. Créer `config/referentials/wbs/wbs.referential.ts` (Gros œuvre / Second œuvre / VRD / Finitions × jalons × tâches).
6. Migrer `QuantityTakeoffForm` → `<BoqLineEditor source="project">`.
7. Migrer `DQEImportDialog` → `<ImportDropzone>` + `<ImportMappingWizard>`.
8. Migrer `TenderEstimateService` / `QuantitativeEstimateExporter` sur `BoqCalculatorService`.

## P1 — Parseurs multi-formats + assistant mapping

- `SpreadsheetBoqParser` : xlsx + papaparse (déjà présents), détection colonnes par fuzzy (`designation|libellé`, `unité|unit`, `qté|quantité|qty`, `PU|prix unit`, `phase`, `matériau`).
- `ImportMappingWizard` : preview 10 lignes + selects source→cible si confiance < 0.8 ; validation → `BoqLine[]` → persistance en lot.
- Idempotent pour DQE, devis fournisseur, métré importé.

## P1 — Matériau → PU → coût ligne

- `MaterialPicker` : `useMaterialById(id)` → renvoie `unitPrice`, `vatRate`, `preferredSupplierId`.
- `PriceSummary` sous chaque ligne : `HT = qty × unitPrice`, `TVA = HT × vatRate`, `TTC = HT + TVA`.
- Persisté dans `unit_price` + `total_value` (colonnes existantes côté service, à câbler UI).

## P2 — Suivi budgétaire

- `BoqCalculatorService.aggregateByMilestone(lines)` → `{ milestoneId, budgetHt, budgetTtc }`.
- `MilestoneBudgetDashboard` : prévu (BOQ) vs réel (paiements/inspections) + écart %.
- Réutilisable projet ET tender (comparer estimation vs meilleure offre).

---

## Migration DB (une seule)

- `quantity_takeoffs` : ajouter `task_id text NULL`, `total_value numeric NULL` (si absent).
- Alignement colonnes communes `tender_estimate_items` / `quantity_takeoffs` sur les champs BOQ (pas de renommage destructif ; le mapper absorbe les différences).

---

## Exécution — batchs parallèles après approbation

```text
Batch A (P0)                Batch B (Noyau)              Batch C (Parseurs)
─ Fix QuantityTakeoffSvc    ─ domain/boq                 ─ PdfBoqParser
─ Fix parser PDF            ─ BoqCalculator/Validator    ─ SpreadsheetBoqParser
─ Toasts ciblés             ─ SupabaseBoqRepository      ─ OcrFallbackParser
                            ─ BoqLineMapper              ─ ImportMappingWizard

              ▼ (dépend de A + B + C)
Batch D (Intégrations)                     Batch E (P2)
─ QuantityTakeoffForm → BoqLineEditor      ─ MilestoneBudgetDashboard
─ DQEImportDialog → composants boq         ─ Agrégations tender vs offres
─ TenderEstimateService → BoqCalculator
─ SupplierBidWizard → BoqLineTable
```

A + B + C en parallèle, puis D en parallèle avec E.

---

## Bénéfices composabilité

- **1 mapper** (au lieu de 3), **1 calculateur** (au lieu de 3), **1 validateur**, **1 parser** stack.
- Ajout futur (avenant, DGD, situation de travaux) = nouveau `source` + réutilisation immédiate de tous les composants UI.
- Correction d'un bug (ex : calcul TVA) propagée à toutes les surfaces.
- Testabilité maximale : services purs TS sans React ni Supabase.

## Contraintes respectées

- Flux hexagonal strict (mapper snake ↔ camel, DTO, ports/adapters).
- Zéro `supabase.from()` en UI/hooks.
- Référentiels dans `src/config/referentials/`.
- TanStack Query v5 (pas de `onError/onSuccess` sur query/mutation).
- Entities readonly + factory `create()`.
