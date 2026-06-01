## Objectif

Aligner `/projects/:id/phases/:phaseId` (et les écrans de planification) avec l'architecture hexagonale et les goals HadraTech-GPI : **brancher les modules déjà existants** (DQE, QuantityTakeoff, PhaseMaterials, PhaseEmployees, Stakeholders) au lieu d'en réécrire. Round-trip UI → Transformer → DTO → Service → Adapter → DB validé sur chaque tab.

## Audit (constaté, pas inventé)

Modules **déjà construits mais non câblés dans la page Phase** :
- `QuantityTakeoffService` + `useQuantityTakeoffsHex` + `QuantityTakeoffForm` / `QuantityTakeoffsList` / `MetreCalculator`
- `MaterialService` + `usePhaseMaterialsHex` + `PhaseMaterials.tsx` (présent en tab "overview" uniquement, perdu)
- `EmployeeService` + `usePhaseEmployeesHex` (composant `PhaseEmployees.tsx` existe, **jamais monté** dans `PhaseDetailsPage`)
- `StakeholderService` + `ProjectStakeholderService` + `useStakeholdersHex` + `stakeholderRoles.ts` référentiel
- `dqe-categories.referential.ts` + `AdvancedProjectImporter.tsx` (parser DQE) — pas relié à une phase
- `SupplierService`, `SupplierPaymentService`, `InspectorService` — déjà branchés ailleurs

Tabs actuelles `PhaseDetailsPage.tsx` : `hierarchy | workflow | overview`. Pas de Ressources, pas de Métré/DQE, pas de Parties Prenantes. `PhaseMaterials` est enfoui dans "overview".

## Plan d'exécution

### Étape 1 — Refonte des tabs `PhaseDetailsPage`
Passer de 3 → 6 tabs alignées sur le cycle de vie d'une phase :
1. **Hiérarchie** (existant)
2. **Workflow** (existant)
3. **Ressources** (NOUVEAU) — splits internes :
   - Matériaux (`PhaseMaterials` existant)
   - Main d'œuvre (`PhaseEmployees` existant, à monter)
   - Bouton "Importer depuis DQE" (réutilise le parser DQE → pré-remplit lignes Métré + matériaux)
4. **Métré / DQE** (NOUVEAU) — monte `QuantityTakeoffsList` filtré par `phaseId`, avec `QuantityTakeoffForm` + `MetreCalculator` ; lecture seule du référentiel `dqe-categories.referential.ts`
5. **Parties Prenantes** (NOUVEAU) — `StakeholderAssignmentPanel` (à créer, ~150 LOC) qui :
   - Liste les stakeholders du projet via `useStakeholdersHex({ projectId })`
   - Filtre par rôle (`stakeholderRoles.ts` : supplier, bureau de conseil, inspecteur, contractor)
   - Permet d'associer/dissocier un stakeholder à la phase courante via `ProjectStakeholderService.assignToPhase()` (méthode à exposer si manquante — sinon table de liaison `phase_stakeholders` à créer)
6. **Documents** (déplacé depuis overview) — `PhaseDocuments`

Suppression de l'onglet "Vue d'ensemble" redondant (contenu absorbé par Header + Hiérarchie).

### Étape 2 — Brancher le parser DQE sur la phase
- Extraire le parser de `AdvancedProjectImporter.tsx` dans `src/application/services/DQEImportService.ts` (pure TS, pas de React).
- Ajouter `DQEImportDialog` réutilisable dans le tab Ressources : upload Excel/CSV → preview → write via `QuantityTakeoffService.createBatch()` + `MaterialService.linkToPhase()`.
- Pas de nouvelle dépendance ; `xlsx` est déjà installé.

### Étape 3 — Round-trip UI → DB (validation systématique)
Pour chaque tab nouvellement câblée :
- Vérifier que le hook retourne via `Service → Adapter → Transformer` (pas de `supabase.from` direct)
- Vérifier que l'UI utilise le DTO (`@/dtos/entities/*`) — corriger tout import legacy `@/types/*`
- Tester save/load aller-retour (création matériau, employé, ligne métré, assignation stakeholder)

### Étape 4 — Goal "stakeholder à ses propres concerns"
- `StakeholderAssignmentPanel` filtre les actions selon `role` du référentiel :
  - **supplier** → voit Bons de commande + livraisons (lien `/supplier-portal/:id`)
  - **bureau de conseil** → voit Inspections + rapports (lien `/inspections?phaseId=`)
  - **inspecteur** → voit checkpoints à vérifier (lien `/inspector-dashboard`)
  - **contractor** → voit décomptes + paiements
- Réutilise `StakeholderRoleService.getConcernsForRole()` (à ajouter si manquant — sinon mapping statique dans le référentiel).

### Étape 5 — Vérifications
- TypeScript clean sur les fichiers touchés
- Console preview : aucun warning de hook conditionnel
- Test manuel : créer une phase, importer un DQE, voir matériaux/métré peuplés, assigner un fournisseur, vérifier qu'il apparaît dans `/supplier-portal`

## Fichiers

**Édités**
- `src/components/project/PhaseDetailsPage.tsx` (refonte tabs)

**Créés**
- `src/components/project/phase/PhaseResourcesTab.tsx` (~120 LOC, orchestrateur)
- `src/components/project/phase/PhaseQuantityTakeoffTab.tsx` (~60 LOC, wrapper sur composants existants)
- `src/components/project/phase/PhaseStakeholdersTab.tsx` (~150 LOC)
- `src/components/project/phase/DQEImportDialog.tsx` (~180 LOC)
- `src/application/services/DQEImportService.ts` (~120 LOC, extraction du parser existant)

**Hors scope** (à confirmer si souhaité dans un second tour)
- Migration DB `phase_stakeholders` si l'association n'existe pas déjà
- Refonte des autres pages (Project, Tender, Supplier) — la précédente itération les a déjà alignées
- Refactor des services existants (on les consomme tel quels)

## Détails techniques

- Aucun nouveau package
- Tous les nouveaux composants utilisent `@/dtos/entities/*` et hooks `@/hooks/hexagonal/*`
- Tabs construites avec shadcn `Tabs` déjà utilisé
- Le parser DQE extrait suit `mem://architecture/no-react-in-services` : pure TS, retourne `QuantityTakeoffDTO[]` + `MaterialDTO[]`
- `DQEImportDialog` fait la transformation form → DTO selon `mem://architecture/ui-to-dto-transformation`
