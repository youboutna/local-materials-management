## Objectif

Aligner les pages de création/édition de projet (`/projects/new`, `/projects/:id/edit`) et toutes les CRUD pages liées sur les règles PROMPTS.md + ARCHITECTURE_REFERENTIELS.md : un seul workflow piloté par référentiel, mêmes étapes en create et edit, validation/labels centralisés, round-trip UI↔DTO↔DB sans fuite snake_case ni `@ts-nocheck`.

## Constat (incohérences à corriger)

1. **Doublon d'étape "Parties Prenantes"** :
   - `src/components/project/steps/StakeholdersStep.tsx` (legacy, snake_case `project_responsable_id`, pas d'usage du référentiel `stakeholderRoles`, écrit hors DTO).
   - `src/components/project/steps/StakeholdersTeamStep.tsx` (hex, utilisé par `ProjectCreationWorkflow`).
   - Validation step 2 de `ProjectCreationWorkflow` teste `projectData.projectManagerId` alors que l'étape n'écrit que dans `relatedData.stakeholders` → impossible d'avancer.

2. **Create ≠ Edit** :
   - `ProjectCreate.tsx` → `ProjectCreationWorkflow` (8 étapes hex).
   - `ProjectEdit.tsx` → `EnhancedProjectEditForm` (formulaire monolithique, snake_case, `// @ts-nocheck`).
   - Deux chemins de persistance → divergences sur stakeholders, phases, localisation.

3. **Double persistance en création** :
   - `ProjectCreationWorkflow.handleSubmit` appelle `saveCurrentStep` (workflow service) ; en parallèle `ProjectCreate.handleFormSubmit` appelle `createProject` + boucle phases + `ProjectStakeholderService`. → Conflits FK, doublons.

4. **Casing leaks UI** : `project_responsable_id`, `start_date`, `team_size`, `main_contractor`, `engineering_consultant`, `current_phase`… dans `ProjectCreate`/`ProjectEdit` malgré DTO camelCase (RÈGLE #2 PROMPTS.md violée).

5. **`@ts-nocheck`** dans `ProjectCreate.tsx`, `ProjectEdit.tsx`, `EnhancedProjectEditForm.tsx` → masque les erreurs de mapping.

6. **Steps non-référentiels** : liste des 8 étapes recodée en dur dans `ProjectCreationWorkflow` (titre, icône, validation) au lieu de venir d'un référentiel `project-workflow-steps.referential.ts` (viole ARCHITECTURE_REFERENTIELS — "tout seuil/règle/poids/indicateur passe par référentiels").

7. **Tabs dupliquées sur les CRUD pages** :
   - `ProjectDetail.tsx` : tab "Parties Prenantes" + sous-tab dans `PhaseDetailsPage` redondante.
   - `PhaseDetail.tsx` + `ProjectPhasesDetail.tsx` : deux écrans phase parallèles avec mêmes onglets (Documents/Tasks/Materials/Inspections/Payments).
   - `Materials.tsx` + `ProjectMaterials.tsx` : tab matériaux dupliquée projet/global.
   - `Tasks.tsx` + `PhaseTasks.tsx` + `EnhancedTaskList.tsx`.

## Plan d'exécution (refactoring only, 0 nouvelle page)

### 1. Référentiel workflow étapes (nouveau fichier de config, pas de page)
Créer `src/config/referentials/projects/project-workflow-steps.referential.ts` :
- `PROJECT_WORKFLOW_STEPS: WorkflowStepConfig[]` (id, code, label i18n, icône-string, requiredFields, validator pur sur `ProjectWorkflowData`).
- 8 étapes alignées sur l'existant (Infos, Parties prenantes, Localisation, WBS, Risques, Conformité, Liaisons, Validation).
- Exposer `getStepValidator(code)` + `validateWorkflow(data)`.

### 2. Unifier le composant workflow (Create ET Edit)
- `ProjectCreationWorkflow.tsx` → renommer logiquement en `ProjectWorkflow` (props `mode: 'create' | 'edit'`, `projectId?`).
- Charger `steps` depuis `PROJECT_WORKFLOW_STEPS` (suppression du tableau hardcodé).
- `isCompleted()` de chaque étape = `getStepValidator(step.code)(workflowData)`. Corrige notamment step 2 (utilise `relatedData.stakeholders.length > 0 || projectData.projectManagerId`).
- Réutiliser `useUnifiedProjectWorkflow(mode)` côté edit aussi → mêmes hooks d'hydratation.

### 3. Refonte `ProjectEdit.tsx`
- Supprimer `EnhancedProjectEditForm` du flux (devient legacy non importé ; on garde le fichier mais on l'enlève du routing).
- Charger via `ProjectWorkflowService.loadProjectData(id)` → injecter en `initialData` dans `ProjectWorkflow mode="edit"`.
- Retirer `@ts-nocheck`, le mapping snake_case manuel, et le `handleFormSubmit` dupliqué.

### 4. Refonte `ProjectCreate.tsx`
- Supprimer le `handleFormSubmit` legacy (createProject + phases + stakeholders) — toute la persistance passe par `ProjectWorkflowService.saveStep` (déjà appelé par `saveCurrentStep`).
- Retirer `@ts-nocheck`.
- Page = uniquement layout + `<ProjectWorkflow mode="create" onComplete={…navigate(/projects/:id)} />`.

### 5. Étape "Parties prenantes" — déduplication
- **Supprimer** `src/components/project/steps/StakeholdersStep.tsx` (legacy).
- Dans `StakeholdersTeamStep.tsx` :
  - Lire `internalStakeholderRoles / externalStakeholderRoles / teamPositions` exclusivement via `getRoleOptions` (déjà importé) — retirer les listes locales restantes.
  - Écrire dans `relatedData.stakeholders` (camelCase, DTO `StakeholderDTO`) ET dans `projectData.projectManagerId` quand un membre est marqué "Chef de projet" → validation step 2 cohérente.
  - Tabs internes ("Internes / Externes / Équipe") alimentées par `stakeholderType` du DTO, pas de duplication.

### 6. Casing & DTO round-trip (RÈGLE #2)
Auditer et corriger : `ProjectCreate.tsx`, `ProjectEdit.tsx`, `ProjectCreationWorkflow.tsx`, `EnhancedProjectEditForm.tsx` :
- Tous les champs snake_case du formulaire → mapper via `ProjectTransformer.formToCreateRequest` / `formToUpdateRequest` (étendre si besoin).
- Suppression des accès `data.start_date`, `data.team_size`, etc. dans les pages.

### 7. CRUD pages — tabs dupliquées / cohérence
- **`ProjectDetail.tsx`** : conserver un seul jeu de tabs (Overview, Phases, Stakeholders, Documents, Inspections, Payments, Reports). Retirer la sous-section "Parties prenantes" qui réapparaît dans `PhaseDetailsPage` (la phase ne ré-affiche QUE l'équipe phase).
- **`PhaseDetail.tsx` vs `ProjectPhasesDetail.tsx`** : garder `PhaseDetail` (déjà refait avec `toPhaseViewModel`), faire de `ProjectPhasesDetail` un simple redirect vers `PhaseDetail`.
- **`Materials.tsx` / `ProjectMaterials.tsx`** : la page projet n'affiche QUE les matériaux liés au projet (filtre `useProjectMaterialsHex(projectId)`), retire la grille globale.
- **`Tasks.tsx` / `PhaseTasks.tsx` / `EnhancedTaskList.tsx`** : un seul composant `TasksTable` (déjà existant comme `TaskList`), réutilisé avec props de filtre (`projectId`, `phaseId`).

### 8. Conformité PROMPTS.md (gardes-fous appliqués partout)
- ✅ Aucun `supabase.from()` ajouté dans `components/`/`pages/`/`hooks/` (hors `hooks/hexagonal`).
- ✅ Aucun import `@/services/*` legacy dans les fichiers touchés (sauf `ProjectStakeholderService` qui est `application/services`).
- ✅ Aucun `@ts-nocheck` ajouté ; on en retire dans `ProjectCreate`/`ProjectEdit`.
- ✅ DTO camelCase exclusivement côté UI.
- ✅ TanStack v5 — pas de `onError/onSuccess` sur `useMutation/useQuery`.

## Détails techniques

### Fichiers modifiés
- `src/pages/ProjectCreate.tsx` (allègement, suppression `@ts-nocheck`, suppression double-persistance)
- `src/pages/ProjectEdit.tsx` (bascule sur `ProjectWorkflow mode="edit"`)
- `src/components/project/ProjectCreationWorkflow.tsx` (steps depuis référentiel, mode create/edit, validation step 2 corrigée)
- `src/components/project/steps/StakeholdersTeamStep.tsx` (référentiel rôles, écrit `projectManagerId`, tabs uniques)
- `src/components/project/EnhancedProjectEditForm.tsx` (retiré du routing, marqué deprecated en tête)
- `src/components/project/ProjectDetailByDTO.tsx` (tabs nettoyées)
- `src/components/project/PhaseDetailsPage.tsx` (retire le bloc "Parties prenantes" doublon)
- `src/pages/ProjectPhasesDetail.tsx` (redirect)
- `src/pages/Materials.tsx` (filtre projet uniquement quand mounted via tab projet)
- `src/components/project/EnhancedTaskList.tsx` (réutilise `TaskList` au lieu de redéfinir colonnes)

### Fichiers créés (1 seul, référentiel — autorisé par ARCHITECTURE_REFERENTIELS)
- `src/config/referentials/projects/project-workflow-steps.referential.ts`
- Export ajouté à `src/config/referentials/index.ts`

### Fichiers supprimés
- `src/components/project/steps/StakeholdersStep.tsx` (legacy doublon)

### Tests de non-régression manuels
1. `/projects/new` : parcours des 8 étapes, validation step 2 passe avec un Chef de projet sélectionné.
2. `/projects/:id/edit` : pré-remplissage 8 étapes (mêmes labels), sauvegarde par étape via `ProjectWorkflowService`.
3. `/projects/:id` : un seul onglet "Parties prenantes" ; phase n'expose pas le doublon.
4. `/projects/:id/phases/:phaseId` : un seul écran (PhaseDetail), tabs Documents/Tasks/Materials/Inspections/Payments uniques.

## Hors scope
- Pas de nouveau composant page, pas de migration de schéma DB.
- Pas de refonte visuelle des étapes existantes.
- `NotificationService.recipient_id='system'` (déjà tracé dans `.lovable/plan.md`).
