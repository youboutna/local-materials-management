## Objectif

Éliminer la dette résiduelle après la suppression de `src/services/*` et `src/types/*` : plus aucun fichier legacy (`@ts-nocheck`, casing camelCase, stubs vides, code mort), tout aligné sur PROMPTS.md (hexagonal, DTOs, adapters, Entities, pas de Supabase direct dans les hooks/UI).

## Inventaire de la dette

**7 fichiers avec `@ts-nocheck` :**
- `bankGuaranteeActionFunctions.ts`, `inspectionActionService.ts`, `insuranceActionService.ts` — style fonctionnel legacy, casing camelCase
- `communicationService.ts`, `organizationalHierarchyService.ts` — stubs vides que je viens de créer
- `enhancedReportingService.ts` — casing camelCase, doublon partiel
- `TenderSubmissionService.ts` — utilise Supabase directement au lieu du repository
- `tenderSubmissionNotificationService.ts` — casing camelCase

**Code mort :**
- `ArchitectureUpdateService.ts` (416 l.) — outil interne one-shot, aucun consommateur
- `WorkflowStepService.ts.backup` — fichier `.backup` traînant
- Stubs `getStepDocuments` / `createWorkflowStep` dans `WorkflowStepService` — jamais implémentés
- Commentaires « TODO / Placeholder / not yet implemented » dans `useTenderEvaluationHex`, `WorkflowStepsManager`, `StepDocumentsSection`

## Plan d'action

### Lot 1 — Suppression du code mort
1. Supprimer `ArchitectureUpdateService.ts` et `WorkflowStepService.ts.backup`.
2. Retirer les stubs `getStepDocuments` / `createWorkflowStep` du `WorkflowStepService` canonique.
3. Nettoyer les consommateurs (`TenderWorkflowSteps.tsx`, `WorkflowStepsManager.tsx`, `StepDocumentsSection.tsx`, `useWorkflowSteps.ts`) : soit désactiver proprement le bouton/section, soit implémenter via un adapter réel `WorkflowStepAdapter` (préférence : désactivation propre + issue en commentaire unique).

### Lot 2 — Unification Communication / Hierarchy
4. Supprimer les stubs `communicationService.ts` et `organizationalHierarchyService.ts`.
5. Router les 3 action services vers `NotificationService` déjà en place (assignTask → task creation via TaskService, sendEmail/SMS/Call → NotificationService avec canaux dédiés).
6. Pour la hiérarchie : utiliser le `ProjectStakeholderAdapter` + `EmployeeAdapter` existants pour résoudre les destinataires (supervisor/manager/director) au lieu du service factice.

### Lot 3 — Refonte des Action Services (casing + typage)
7. Renommer et convertir en classes hexagonales :
   - `bankGuaranteeActionFunctions.ts` → fusionner dans `BankGuaranteeActionService.ts` (classe déjà existante).
   - `inspectionActionService.ts` → `InspectionActionService.ts` (nouvelle classe).
   - `insuranceActionService.ts` → `InsuranceActionService.ts` (nouvelle classe).
8. Typer proprement (retirer `@ts-nocheck`), extraire les interfaces publiques dans `src/dtos/actions/`.
9. Mettre à jour `ActionsDropdown.tsx` (imports dynamiques → classes canoniques).

### Lot 4 — Reporting & Tender
10. Renommer `enhancedReportingService.ts` → `EnhancedReportingService.ts`, retirer `@ts-nocheck`, typer les retours via les DTOs `reportTypes`.
11. `TenderSubmissionService.ts` : retirer `@ts-nocheck`, remplacer les appels directs `supabase.from('tender_submissions')` par `RepositoryFactory.getTenderSubmissionRepository()` (créer l'adapter si manquant), suivre la règle « pas de Supabase direct dans les services applicatifs sauf via adapters ».
12. Renommer `tenderSubmissionNotificationService.ts` → `TenderSubmissionNotificationService.ts` + typage strict.

### Lot 5 — Vérification finale
13. Grep global : plus aucun `@ts-nocheck` dans `src/application/services/`, plus aucun fichier `*.backup`, plus aucun `TODO: not yet implemented`.
14. Typecheck + build : verts.
15. Mettre à jour `mem://index.md` (retirer la mention « stubs à remplacer », ajouter la règle « pas de `@ts-nocheck` dans `src/application/services/` »).

## Détails techniques

- Toutes les nouvelles classes suivent le pattern `getXxxService()` singleton conforme à `service-instance-transition-status`.
- Les adapters manquants (`TenderSubmissionAdapter`, éventuellement `WorkflowStepAdapter`) suivent `hexagonal-implementation-standard` : DB snake_case → Adapter → Transformer → DTO camelCase.
- Les hooks TanStack Query restent en v5 (pas de `onError/onSuccess`).
- Aucune modification de schéma DB attendue.

## Hors périmètre

- Pas de refonte fonctionnelle des workflows tender/inspection/insurance ; strictement du nettoyage et du recâblage sur les canaux existants.
- Pas de suppression de `WorkflowStepsManager` / `TenderWorkflowSteps` : ces UI restent, seuls les appels aux stubs sont nettoyés.
