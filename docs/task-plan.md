# **Task Plan: Architecture Hexagonale & Navigabilité Améliorée pour Construction Management**

## **Goal**

Migrer l'architecture vers un modèle hexagonal propre avec navigabilité améliorée et hiérarchie visuelle des pages projet.

---

## **Phases**

- [x] **Phase 1**: Audit de l'architecture existante et définition de la stratégie ✓
- [x] **Phase 2**: Migration progressive de la hiérarchie projet ✓
- [x] **Phase 3**: Refactoring navigation avec architecture hexagonale ✓
- [x] **Phase 4**: Migration workflows inspection/paiement ✓
- [ ] **Phase 5**: Migration pages restantes (Users, Employees, Tasks, Profile, Inspections)
- [ ] **Phase 6**: Système de design et hiérarchie visuelle
- [ ] **Phase 7**: Tests, validation et déploiement progressif

---

## **INVENTAIRE COMPLET DES PAGES (57 Routes)**

### **Routes Publiques (13 pages)** - Sans authentification

| Route | Page/Composant | Statut Migration | Hook Cible |
|-------|----------------|------------------|------------|
| `/` | `Index` | ⏳ À analyser | N/A (Landing) |
| `/auth` | `Auth` | ✅ Pas de migration | N/A (Auth) |
| `/contact` | `Contact` | ⏳ À analyser | N/A (Static) |
| `/terms` | `Terms` | ✅ Pas de migration | N/A (Static) |
| `/policy` | `Policy` | ✅ Pas de migration | N/A (Static) |
| `/reset-password` | `ResetPassword` | ✅ Pas de migration | N/A (Auth) |
| `/supplier-portal` | `UnifiedSupplierPortal` | ✅ TenderSharingService | N/A (Service) |
| `/supplier-tender` | `EnhancedSupplierTenderPortal` | ✅ TenderSharingService | N/A (Service) |
| `/supplier-submissions` | `SupplierSubmissionDashboard` | ✅ User-specific | N/A (Service) |
| `/supplier-access` | `SupplierSecureAccessPortal` | ✅ TenderSharingService | N/A (Service) |
| `/evaluation-access` | `EvaluationAccessPortal` | ✅ SubmissionSecretService | N/A (Service) |
| `/supplier-password-reset` | `SupplierPasswordReset` | ✅ Pas de migration | N/A (Auth) |
| `/workflow-test` | `WorkflowTest` | ✅ Test/Dev | N/A (Test) |

### **Routes Protégées - Core Business (20 pages)**

| Route | Page | Rôles Autorisés | Statut Migration | Hook Cible |
|-------|------|-----------------|------------------|------------|
| `/home` | `Home` | !supplier | ⏳ À analyser | `useDashboardHex()` ? |
| `/dashboard` | `Dashboard` | admin, director | ✅ Migré | `useDashboardHex()` |
| `/enhanced-dashboard` | `EnhancedDashboard` | admin, director | ⏳ À migrer | `useDashboardHex()` |
| `/projects` | `Projects` | admin, director, pm, manager | ✅ Migré | `useProjectsHex()` |
| `/projects/create` | `ProjectCreate` | !supplier | ⏳ À migrer | `useProjectsHex()` |
| `/projects/import` | `ProjectImport` | !supplier | ⏳ À analyser | `useProjectsHex()` |
| `/projects/:id` | `ProjectDetail` | admin, director, pm, manager | ✅ Migré | `useProjectHex()` |
| `/projects/:id/edit` | `ProjectEdit` | admin, director, pm, manager | ⏳ À migrer | `useProjectHex()` |
| `/projects/:id/edit/phases/detail` | `ProjectPhasesDetail` | !supplier | ⏳ À analyser | `usePhasesHex()` |
| `/projects/:projectId/phases/:phaseId` | `PhaseDetailsPage` | tous | ✅ Migré | `usePhaseHex()` |
| `/materials` | `Materials` | !supplier | ✅ Migré | `useMaterialsHex()` |
| `/materials/create` | `MaterialCreate` | !supplier | ⏳ À migrer | `useMaterialsHex()` |
| `/materials/:id` | `MaterialDetail` | !supplier | ⏳ À migrer | `useMaterialHex()` |
| `/materials/:id/edit` | `MaterialEdit` | !supplier | ⏳ À migrer | `useMaterialHex()` |
| `/documents` | `Documents` | !supplier | ✅ Migré | `useProjectsHex()` |
| `/suppliers` | `Suppliers` | !supplier | ✅ Migré | `useSuppliersHex()` |
| `/tender-management` | `TenderManagement` | !supplier | ⏳ À migrer | `useTendersHex()` |
| `/tender-import` | `TenderImport` | !supplier | ⏳ À analyser | `useTendersHex()` |

### **Routes Protégées - RH & Organisation (5 pages)**

| Route | Page | Rôles Autorisés | Statut Migration | Hook Cible |
|-------|------|-----------------|------------------|------------|
| `/employees` | `Employees` | !supplier | ⏳ À migrer | `useEmployeesHex()` |
| `/users` | `Users` | admin, director | ⏳ À migrer | `useUsersHex()` |
| `/profile` | `Profile` | !supplier | ⏳ À analyser | N/A (Auth profile) |
| `/user-profile` | `UserProfile` | !supplier | ⏳ À analyser | N/A (Auth profile) |
| `/settings` | `Settings` | admin, director | ⏳ À analyser | N/A (Config) |

### **Routes Protégées - Tâches (2 pages)**

| Route | Page | Rôles Autorisés | Statut Migration | Hook Cible |
|-------|------|-----------------|------------------|------------|
| `/tasks` | `Tasks` | !supplier | ⏳ À migrer | `useTasksHex()` |
| `/tasks/:taskId` | `TaskDetail` | tous | ⏳ À migrer | `useTaskHex()` |

### **Routes Protégées - Inspections (3 pages)**

| Route | Page | Rôles Autorisés | Statut Migration | Hook Cible |
|-------|------|-----------------|------------------|------------|
| `/inspections/create` | `InspectionCreate` | !supplier | ⏳ À migrer | `useInspectionWorkflowHex()` |
| `/inspections/:id` | `InspectionDetail` | !supplier | ⏳ À migrer | `useInspectionHex()` |
| `/inspections/:id/edit` | `InspectionEdit` | !supplier | ⏳ À migrer | `useInspectionHex()` |

### **Routes Protégées - Monitoring & Contrôle (5 pages)**

| Route | Page | Rôles Autorisés | Statut Migration | Hook Cible |
|-------|------|-----------------|------------------|------------|
| `/bank-guarantee-monitor` | `BankGuaranteeMonitorPage` | admin, director, pm, eng | ✅ Migré | `useBankGuaranteesHex()` |
| `/inspection-monitoring` | `InspectionMonitoringPage` | admin, director, eng, pm | ✅ Encapsulé | RoleBasedComponent |
| `/notifications-center` | `NotificationsCenterPage` | admin, director, pm, eng | ✅ Migré | `useNotificationsHex()` |
| `/insurance-management` | `InsuranceManagementPage` | admin, director, pm, legal | ⏳ À migrer | `useInsurancesHex()` |
| `/payment-control` | `PaymentControlPage` | admin, director, finance, pm | ✅ Migré | `usePaymentBlocksHex()` |

### **Route 404**

| Route | Page | Statut |
|-------|------|--------|
| `*` | `NotFound` | ✅ N/A |

---

## **RÉSUMÉ MIGRATION**

| Catégorie | Total | Migrées ✅ | À Migrer ⏳ | N/A |
|-----------|-------|-----------|-------------|-----|
| Publiques | 13 | 0 | 2 | 11 |
| Core Business | 20 | 8 | 12 | 0 |
| RH & Organisation | 5 | 0 | 3 | 2 |
| Tâches | 2 | 0 | 2 | 0 |
| Inspections | 3 | 0 | 3 | 0 |
| Monitoring | 5 | 4 | 1 | 0 |
| **TOTAL** | **48** | **12** | **23** | **13** |

---

## **Phase 5: Migration Pages Restantes (CURRENT)**

### **Priorité 1 - Pages CRUD Simples**

| Page | Fichier | Hook à créer/utiliser |
|------|---------|----------------------|
| `MaterialCreate` | `src/pages/MaterialCreate.tsx` | `useMaterialsHex()` |
| `MaterialDetail` | `src/pages/MaterialDetail.tsx` | `useMaterialHex()` |
| `MaterialEdit` | `src/pages/MaterialEdit.tsx` | `useMaterialHex()` |
| `ProjectEdit` | `src/pages/ProjectEdit.tsx` | `useProjectHex()` |
| `ProjectCreate` | `src/pages/ProjectCreate.tsx` | `useProjectsHex()` |

### **Priorité 2 - Pages RH**

| Page | Fichier | Hook à créer |
|------|---------|-------------|
| `Employees` | `src/pages/Employees.tsx` | `useEmployeesHex()` |
| `Users` | `src/pages/Users.tsx` | `useUsersHex()` |

### **Priorité 3 - Pages Tâches**

| Page | Fichier | Hook à créer |
|------|---------|-------------|
| `Tasks` | `src/pages/Tasks.tsx` | `useTasksHex()` |
| `TaskDetail` | `src/pages/TaskDetail.tsx` | `useTaskHex()` |

### **Priorité 4 - Pages Inspections**

| Page | Fichier | Hook à utiliser |
|------|---------|----------------|
| `InspectionCreate` | `src/pages/InspectionCreate.tsx` | `useInspectionWorkflowHex()` |
| `InspectionDetail` | `src/pages/InspectionDetail.tsx` | `useInspectionHex()` |
| `InspectionEdit` | `src/pages/InspectionEdit.tsx` | `useInspectionHex()` |

### **Priorité 5 - Pages Tenders**

| Page | Fichier | Hook à créer |
|------|---------|-------------|
| `TenderManagement` | `src/pages/TenderManagement.tsx` | `useTendersHex()` |
| `TenderImport` | `src/pages/TenderImport.tsx` | `useTendersHex()` |

### **Priorité 6 - Pages Diverses**

| Page | Fichier | Hook à utiliser |
|------|---------|----------------|
| `InsuranceManagement` | `src/pages/InsuranceManagement.tsx` | `useInsurancesHex()` |
| `EnhancedDashboard` | `src/pages/EnhancedDashboard.tsx` | `useDashboardHex()` |
| `Home` | `src/pages/Home.tsx` | `useDashboardHex()` |

---

## **Hooks Hexagonaux - État Actuel**

### **Existants et Fonctionnels** ✅

| Hook | Domaine | Méthodes |
|------|---------|----------|
| `useProjectsHex` | Projects | `projects`, `isLoading`, `create`, `update`, `delete` |
| `useProjectHex` | Project | `project`, `isLoading` |
| `useMaterialsHex` | Materials | `materials`, `isLoading`, `create`, `update`, `delete` |
| `useDashboardHex` | Dashboard | `stats`, `trends`, `isLoading` |
| `useSuppliersHex` | Suppliers | `suppliers`, `isLoading`, `create`, `update`, `delete` |
| `usePhasesHex` | Phases | `phases`, `isLoading`, `create`, `update` |
| `usePhaseHex` | Phase | `phase`, `isLoading` |
| `useBankGuaranteesHex` | Bank Guarantees | `guarantees`, `isLoading` |
| `usePaymentBlocksHex` | Payment Blocks | `blocks`, `isLoading` |
| `useNotificationsHex` | Notifications | `notifications`, `isLoading`, `markAsRead` |
| `useInspectionWorkflowHex` | Inspections | `createRequest`, `schedule`, `execute` |
| `usePaymentWorkflowHex` | Payments | `createRequest`, `validate` |

### **À Créer** ⏳

| Hook | Domaine | Priorité |
|------|---------|----------|
| `useEmployeesHex` | Employees | P2 |
| `useUsersHex` | Users | P2 |
| `useTasksHex` | Tasks | P3 |
| `useTaskHex` | Task | P3 |
| `useInspectionHex` | Inspection | P4 |
| `useTendersHex` | Tenders | P5 |
| `useInsurancesHex` | Insurances | P6 |

---

## **Métriques de Progression**

| Domaine | Entités | Repositories | Use Cases | Hooks | Pages Migrées |
|---------|---------|--------------|-----------|-------|---------------|
| Projects | ✅ | ✅ | ✅ 5/5 | ✅ | 4/7 |
| Materials | ✅ | ✅ | ✅ 5/5 | ✅ | 1/4 |
| Phases | ✅ | ✅ | ✅ 1/3 | ✅ | 1/2 |
| Suppliers | ✅ | ✅ | ✅ 5/5 | ✅ | 1/1 |
| Documents | ✅ | ✅ | ✅ 2/2 | ✅ | 1/1 |
| Tenders | ✅ | ⏳ | ⏳ 2/2 | ⏳ | 0/2 |
| Monitoring | ✅ | ✅ | ⏳ | ✅ | 4/5 |
| Notifications | ✅ | ⏳ | ⏳ | ✅ | 1/1 |
| Inspections | ✅ | ✅ | ✅ 4/4 | ✅ | 0/3 |
| Payments | ✅ | ✅ | ✅ 3/3 | ✅ | 1/1 |
| Employees | ⏳ | ⏳ | ⏳ | ⏳ | 0/1 |
| Users | ⏳ | ⏳ | ⏳ | ⏳ | 0/1 |
| Tasks | ⏳ | ⏳ | ⏳ | ⏳ | 0/2 |

---

## **Détection Routes Dupliquées ⚠️**

Les routes suivantes sont définies DEUX fois avec des règles de rôles différentes:

```
/projects           → allowedRoles + disallowedRoles (conflit)
/projects/create    → allowedRoles + disallowedRoles (conflit)  
/projects/:id       → allowedRoles + disallowedRoles (conflit)
/projects/:id/edit  → allowedRoles + disallowedRoles (conflit)
```

**Action requise**: Nettoyer les routes dupliquées dans `App.tsx`

---

## **Prochaines Actions**

### **Action Immédiate 1: Nettoyer Routes Dupliquées**
Supprimer les routes `/projects*` dupliquées dans App.tsx

### **Action 2: Créer Hooks Manquants**
1. `useEmployeesHex()`
2. `useTasksHex()` / `useTaskHex()`
3. `useInspectionHex()`

### **Action 3: Migrer Pages P1**
- `MaterialCreate`, `MaterialDetail`, `MaterialEdit`
- `ProjectEdit`, `ProjectCreate`

---

**Statut actuel** : Phase 5 EN COURS - 12/48 pages migrées (25%)  
**Prochaine étape** : Nettoyer routes dupliquées, puis migrer pages CRUD
