## Objectif

Finaliser le round-trip **UI ⇄ DTO ⇄ Service ⇄ Adapter ⇄ DB** sur toutes les pages listées dans `src/App.tsx`, en supprimant les `@ts-nocheck`, les mappings `snake_case` résiduels côté UI, les `TODO` mock, et en hydratant les vues qui affichent encore des valeurs "Indéfinie / 0 / —" alors que les données existent. Pas de nouvelle table, pas de migration.

## Avancement (lots)
- Lot 1 — `ProjectImport.tsx` : `@ts-nocheck` retiré, typé via `ProjectReportDTO.ImportResult`.
- Lot 2 — `ProjectPhasesDetail.tsx` : `@ts-nocheck` retiré, `PhaseRow` typé via `Phase` (camelCase). `PhaseDetailsPage.tsx` : actions validate/view branchées.
- Lot 3 — `Dashboard.tsx`, `PhaseDetail.tsx`, `Documents.tsx`, `Auth.tsx`, `ResetPasswordPage.tsx`, `MaterialCreate.tsx`, `MaterialDetail.tsx` : `@ts-nocheck` retiré, typage strict (filtre statut multi-valeurs, `isLoading`, casts ciblés sur DTO auth/material). Build sans erreur TS.
- Lot 4 — `InsuranceManagement.tsx` : `@ts-nocheck` retiré ; imports `EscalationRoles`/`ProjectData` corrigés (`@/dtos/entities/ProjectAggregateDTO`) ; câblage `ProjectService.getProjectsForInsurance()`.
- Lot 6 — `ProjectMaterials.tsx` : TODO `removeMaterialFromProject` résolu via `MaterialService.removeMaterialFromProject()`. `ProjectFormWithMap.tsx`, `ProjectCreateByDTO.tsx`, `ProjectDetailByDTO.tsx` : TODO/mock supprimés.
- Restant — `EnhancedDashboard.tsx`, `BankGuaranteeMonitor.tsx`, `NotificationsCenter.tsx`, `PaymentControl.tsx`, `TenderManagement.tsx`, `MaterialEdit.tsx`, `InspectionDetail/Edit.tsx`, `UnifiedSupplierPortal.tsx`, `Suppliers.tsx`, `SupplierPasswordReset.tsx`, `EnhancedSupplierTenderPortal.tsx` : `@ts-nocheck` conservé tant que les DTOs/hooks `Supplier*`/`Notification*` ne sont pas réalignés (multiples props snake_case sur `never`, signatures hexagonales incomplètes). À traiter par batch dédié DTO-first.

---



## Périmètre exact (issu de `src/App.tsx`)

```text
/projects                              Projects.tsx
/projects/create                       ProjectCreate.tsx
/projects/import                       ProjectImport.tsx          ← @ts-nocheck
/projects/:id                          ProjectDetail.tsx → ProjectDetailByDTO
/projects/:id/edit                     ProjectEdit.tsx
/projects/:projectId/phases/:phaseId   PhaseDetail.tsx
/projects/:projectId/milestones/:mId   MilestoneDetail.tsx
(legacy)                               ProjectPhasesDetail.tsx    ← @ts-nocheck
/dashboard                             Dashboard.tsx              ← @ts-nocheck
/enhanced-dashboard                    EnhancedDashboard.tsx      ← @ts-nocheck
/monitoring                            ComprehensiveMonitoring.tsx
/inspection-monitoring                 InspectionMonitoring.tsx
/bank-guarantee-monitor                BankGuaranteeMonitor.tsx   ← @ts-nocheck
/payment-control                       PaymentControl.tsx         ← @ts-nocheck
/payments/:id                          PaymentDetail.tsx
/insurance-management                  InsuranceManagement.tsx    ← @ts-nocheck
/notifications-center                  NotificationsCenter.tsx    ← @ts-nocheck
/materials, /materials/*               Materials*.tsx             ← @ts-nocheck (3 fichiers)
/documents                             Documents.tsx              ← @ts-nocheck
/suppliers, /tender-*                  Suppliers / TenderMgmt     ← @ts-nocheck
/inspections/*                         Inspection*.tsx            ← @ts-nocheck (2 fichiers)
```

---

## Plan d'exécution (par lots parallélisables)

### Lot 1 — Projets (round-trip complet)
- `src/pages/Projects.tsx` : remplacer le commentaire « no hardcoded enums » par usage du référentiel `project-status` (`src/config/referentials`). Toolbar accessible déjà présente, vérifier `aria-label` sur recherche/filtres.
- `src/pages/ProjectDetail.tsx` + `ProjectDetailByDTO.tsx` : retirer le bloc "Use real resources… mock" (ligne 366), brancher sur `useProjectDetail` (déjà hexagonal). Vérifier `currentPhaseInfo.phaseName` (mémoire : fix "Indéfinie").
- `src/pages/ProjectEdit.tsx` / `ProjectCreate.tsx` : confirmer transformation form → `ProjectFormDTO` (camelCase) via transformer dédié, retirer tout accès `snake_case`.
- `src/pages/ProjectImport.tsx` : retirer `@ts-nocheck`, typer payload via `ImportProjectDTO`.

### Lot 2 — Phases & Jalons
- `src/pages/PhaseDetail.tsx` : déjà sans `@ts-nocheck`. Vérifier hooks `usePhaseDetails` / `useTasksHex` / `useMilestonesHex` exposent bien `create/update/delete`. Brancher les `TODO` restants de `PhaseDetailsPage.tsx` (lignes 184/187).
- `src/pages/ProjectPhasesDetail.tsx` : retirer `@ts-nocheck`, typer `PhaseRow` à partir du DTO `PhaseDTO` (camelCase). Remplacer les `p.phase_name || p.name` par lecture DTO (`phaseName`). Le service doit retourner du DTO, pas du raw row.
- `src/pages/MilestoneDetail.tsx` : compléter modal édition (RHF + Zod) + suppression `AlertDialog` si manquants.

### Lot 3 — Dashboard & Monitoring
- `src/pages/Dashboard.tsx` : retirer `@ts-nocheck`. Typer `projects` via `ProjectDTO`, supprimer le cast `as 'en cours' | ...'` au profit de l'enum issu du référentiel statuts. Vérifier `useDashboardHex` renvoie des stats hydratées (sinon corriger l'adapter qui agrège).
- `src/pages/EnhancedDashboard.tsx` : idem, retirer `@ts-nocheck`.
- `src/pages/ComprehensiveMonitoring.tsx` : déjà propre, vérifier que chaque sous-composant (`SystemHealthOverview`, `PerformanceMetrics`, `BankGuaranteeMonitor`, `RoleBasedInspectionMonitoring`, `UnifiedInsuranceManager`, `EnhancedPaymentBlockingInterface`) consomme des services hexagonaux et non `supabase` direct.
- `src/pages/InspectionMonitoring.tsx`, `BankGuaranteeMonitor.tsx` : retirer `@ts-nocheck`, typer via DTO.

### Lot 4 — Paiements, Assurances, Notifications
- `PaymentControl.tsx`, `PaymentDetail.tsx`, `InsuranceManagement.tsx`, `NotificationsCenter.tsx` : retirer `@ts-nocheck`, brancher sur services existants. Le `TODO: Move this to ProjectService` (InsuranceManagement L115) → exposer une méthode `getProjectsForInsurance()` dans `ProjectService`.

### Lot 5 — Catalogues annexes (round-trip light)
- `Materials*.tsx`, `Documents.tsx`, `Suppliers.tsx`, `TenderManagement.tsx`, `Inspection*.tsx`, `ResetPasswordPage.tsx`, `SupplierPasswordReset.tsx`, `UnifiedSupplierPortal.tsx`, `Auth.tsx` : retirer `@ts-nocheck`, typer les états locaux via les DTOs existants (`MaterialDTO`, `DocumentDTO`, `SupplierDTO`, `TenderDTO`, `InspectionDTO`, `AuthDTO`).

### Lot 6 — Composants partagés cités par les pages ci-dessus
- `ProjectFormWithMap.tsx` L131 : remplacer le `TODO contact` par lecture `supplier.contactName` du DTO.
- `ProjectMaterials.tsx` L153 : implémenter `removeMaterialFromProject` via `ProjectMaterialsService` (méthode existante ou à ajouter dans le service applicatif uniquement, sans nouveau repo).
- `ProjectCreateByDTO.tsx` L207 : déclencher `phaseService.savePhases()` + `milestoneService.saveMilestones()` après création projet.
- `PhaseDetailsPage.tsx` L184/187 : brancher modal validation jalon + page détail jalon (`/projects/:projectId/milestones/:milestoneId`).

---

## Garde-fous techniques (mémoires projet)

- **Pas de Supabase direct dans React** : seules exceptions tolérées (`useAuth`, URL Storage publique).
- **Pas de React dans `application/services/*`** : si une page importe un service, le service doit rester pur TS.
- **TanStack Query v5** : aucun `onError/onSuccess` ajouté sur `useQuery/useMutation` ; utiliser `isError/isSuccess`.
- **DTO camelCase obligatoire en UI** : tout accès `p.phase_name`, `p.start_date`, `p.snake_case` côté composant est interdit ; corrigé via transformer dans l'adapter.
- **Entités immutables** : update via méthode dédiée, jamais mutation de champ readonly.
- **Référentiels** : aucun enum métier codé en dur (statuts, phases, types) ; toujours lire depuis `src/config/referentials/`.

## Stratégie d'exécution

L'agent traite les **6 lots en parallèle** quand les fichiers ne se chevauchent pas, en lançant des sous-agents `acp_subagent--explore` au besoin pour identifier la chaîne snake→camel restante par fichier. Après chaque lot, lecture du build output pour valider qu'aucune régression de type n'apparaît avant de passer au lot suivant.

## Livrables

```text
src/App.tsx                                 (inchangé sauf si un import devient invalide)
src/pages/Projects.tsx, ProjectCreate.tsx, ProjectDetail.tsx, ProjectEdit.tsx,
                ProjectImport.tsx, ProjectPhasesDetail.tsx, PhaseDetail.tsx,
                MilestoneDetail.tsx, Dashboard.tsx, EnhancedDashboard.tsx,
                ComprehensiveMonitoring.tsx, InspectionMonitoring.tsx,
                BankGuaranteeMonitor.tsx, PaymentControl.tsx, PaymentDetail.tsx,
                InsuranceManagement.tsx, NotificationsCenter.tsx,
                Materials*.tsx, Documents.tsx, Suppliers.tsx,
                TenderManagement.tsx, Inspection*.tsx, Auth.tsx,
                ResetPasswordPage.tsx, SupplierPasswordReset.tsx,
                UnifiedSupplierPortal.tsx                   (retrait @ts-nocheck + typage DTO)
src/components/project/ProjectDetailByDTO.tsx, ProjectCreateByDTO.tsx,
                ProjectFormWithMap.tsx, ProjectMaterials.tsx,
                PhaseDetailsPage.tsx                         (résolution TODO + hydratation)
src/application/services/ProjectService.ts                  (ajout getProjectsForInsurance + savePhases/Milestones helpers si manquants)
```

Aucune migration DB, aucun nouveau repo. Toute logique manquante est ajoutée dans les services applicatifs existants.
