
# Plan v2 — Nettoyage workflow `projects/create` + Ressources DQE/manuelles dans les phases

## Partie A — Déduplication step Parties Prenantes (inchangée)

Voir constat précédent : dans `StakeholdersTeamStep.tsx`, les onglets `Équipe`, `Contractants`, `Documents` sont des doublons ou du code mort. Le seul flux légitime est :
```
UI form → StakeholderUITransformer.formToCreateRequest → CreateStakeholderDTO (camelCase)
        → ProjectStakeholderService → IProjectStakeholderRepository → Supabase
```

### Changements
1. `StakeholdersTeamStep.tsx` : supprimer les 3 onglets redondants, garder une **liste unique** + **segmented filter** (Tous / Équipe / Externes / Contractants) en vue filtrée sur la même `stakeholders[]`.
2. Supprimer `state teamMembers` (dead local) et `src/components/project/steps/TeamContractorsStep.tsx` (107 l, non importé).

## Partie B — Documents réels par partie prenante (remplace l'onglet info)

Le composant `StakeholderDocumentUpload` (wrapper de `ProjectDocumentUpload` avec `context="stakeholder"`) existe déjà. Il faut juste l'exposer dans la liste.

### Changements
1. Dans la liste unique de Partie A, ajouter sur chaque carte stakeholder un bouton **"Documents"** qui ouvre un `Dialog` contenant `<StakeholderDocumentUpload projectId stakeholderId stakeholderName />`.
2. Indicateur visuel (badge "n doc.") si `useStakeholderDocuments(projectId, stakeholderId).length > 0` — utiliser le hook existant si présent, sinon défaut sans badge (pas de nouveau service).
3. Le bloc d'aide statique "Documents requis" (contrat, conventions, …) est conservé une seule fois en `<Alert>` discrète au-dessus de la liste, à titre informatif.

Aucune nouvelle table : les documents existent déjà dans `project_documents` avec `stakeholder_id` (vérifier via grep `ProjectDocumentUpload` — schéma déjà supporté). Si la colonne `stakeholder_id` manque côté DB, migration sera ajoutée à ce moment-là.

## Partie C — Ressources DQE / manuelles dans les étapes de phase (planification & exécution)

### Constat
- `DQEImportService` + `DQEImportDialog` existent et persistent via `QuantityTakeoffService`.
- `PhaseQuantityTakeoffTab.tsx` expose déjà `<DQEImportDialog projectId phaseId />` au niveau **phase**.
- `PhaseStepsManager.tsx` (890 l) gère les étapes (`PhaseStepDTO`) et tâches (`PhaseTaskDTO`) mais n'offre **aucune entrée ressources** (DQE ou manuel) au niveau étape/tâche.
- `PhaseMaterials`, `PhaseEmployees` existent au niveau phase via `usePhaseMaterialsHex`, `usePhaseEmployeesHex`.

### Objectif
Au niveau **étape de phase** (et réutilisable en exécution via `StepDetailPanel`), permettre 3 actions équivalentes pour constituer les ressources :
1. **Importer DQE** (xlsx) — réutilise `DQEImportDialog`, propage `phaseId` + `stepId`.
2. **Ajouter manuellement un matériau** — nouveau `PhaseStepResourceDialog` qui réutilise `MaterialSelector` + `calculateQuantity()` puis appelle `useCreateQuantityTakeoff`.
3. **Ajouter manuellement une ressource humaine / prestation** — même dialog, onglet RH : `EmployeeSelector` → `usePhaseEmployees.add` ; ou `SimpleSupplierSelector` → `usePhaseStakeholders.add` (rôle = prestataire).

### Changements UI uniquement (aucun nouveau service)

1. **`src/components/project/phase/PhaseStepResourceDialog.tsx`** (nouveau)
   - Tabs internes : `Matériau` | `Main d'œuvre` | `Prestation`.
   - Matériau : `MaterialSelector` + `length/width/height/unit` → `calculateQuantity` → `useCreateQuantityTakeoff({ projectId, phaseId, materialId, … note:"step:<stepId>" })`.
   - Main d'œuvre : `EmployeeSelector` + dates + heures → `usePhaseEmployees.assign`.
   - Prestation : `SimpleSupplierSelector` + montant → `usePhaseStakeholders.create` avec `role=PRESTATAIRE`.
   - Pas de Supabase direct (mem://constraints/no-direct-supabase-in-react).

2. **`src/components/project/phase/DQEImportDialog.tsx`**
   - Ajout prop optionnelle `stepId?: string` propagée dans `note` des takeoffs créés (compat, pas de migration DB).

3. **`src/components/project/phase/PhaseStepsManager.tsx`**
   - Dans le panneau ouvert d'une étape (sous "Tâches"), ajouter une section **"Ressources"** avec 2 boutons :
     - `Importer DQE` → ouvre `DQEImportDialog` (`projectId`, `phaseId`, `stepId`).
     - `Ajouter ressource` → ouvre `PhaseStepResourceDialog`.
   - Récupération des ressources existantes via filtre `note.includes("step:<stepId>")` sur `usePhaseQuantityTakeoffs(phaseId)` + filtre similaire sur `usePhaseEmployees` / `usePhaseStakeholders` (clé note ou champ libre).
   - `PhaseStepsManager` reçoit déjà via props (à étendre légèrement) : `projectId`, `phaseId` — ajoutés en `props` puis passés depuis `PhaseDetailsPage` / `ConstructionPhaseManager`.

4. **`src/components/project/PhaseDetailsPage.tsx` & `src/components/project/workflow/StepDetailPanel.tsx`**
   - Passer `projectId` + `phaseId` à `PhaseStepsManager`.
   - Aucune autre modification métier.

### Hors scope
- Colonne `step_id` dédiée dans `quantity_takeoffs` / `phase_employees` (encodée provisoirement dans `note`) — migration possible dans un tour ultérieur.

## Partie D — Tests Vitest

`src/components/project/steps/__tests__/StakeholdersTeamStep.test.tsx`
- type=EMPLOYEE → `EmployeeSelector` affiché ; SUPPLIER+CONTRACTOR → `SimpleSupplierSelector` ("Fournisseur/Organisation").
- Bouton Ajouter désactivé sans (type+role+entity).
- Filtre segmenté "Contractants" liste l'entrée ajoutée ; "Équipe" non.
- Spy `onStepComplete` → payload camelCase (`stakeholderType`, `organizationId`, `isPrimary`).
- Bouton "Documents" ouvre le dialog `StakeholderDocumentUpload`.

`src/components/project/phase/__tests__/PhaseStepsManager.test.tsx`
- Présence boutons `Importer DQE` + `Ajouter ressource` quand `projectId`+`phaseId`+`step` fournis.
- Click `Ajouter ressource` ouvre `PhaseStepResourceDialog` ; onglets `Matériau`/`Main d'œuvre`/`Prestation` visibles.
- Soumission matériau : `useCreateQuantityTakeoff` appelé avec `note` contenant `step:<id>` (mock).

## Étapes d'exécution (build mode)

1. Refonte `StakeholdersTeamStep.tsx` (tabs → liste unique + filter + bouton Documents).
2. `rm src/components/project/steps/TeamContractorsStep.tsx`.
3. `DQEImportDialog` : prop `stepId`.
4. Nouveau `PhaseStepResourceDialog.tsx`.
5. `PhaseStepsManager.tsx` : props `projectId`/`phaseId`, section Ressources avec boutons.
6. Propager `projectId`/`phaseId` depuis `PhaseDetailsPage` et `StepDetailPanel`.
7. Tests Vitest (2 fichiers) → `bunx vitest run`.

## Risques
- `usePhaseQuantityTakeoffs` / hooks RH peuvent ne pas exposer de filtre `step:` ; on filtre côté UI.
- Si `step_id` doit devenir une vraie colonne, prévoir migration dans un tour dédié.
- Aucune migration DB dans ce plan.
