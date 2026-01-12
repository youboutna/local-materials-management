# **Task Plan: Architecture Hexagonale & Navigabilité Améliorée pour Construction Management**

## **Goal**

Migrer l'architecture vers un modèle hexagonal propre avec navigabilité améliorée et hiérarchie visuelle des pages projet.

---

## **Phases**

- [x] **Phase 1**: Audit de l'architecture existante et définition de la stratégie ✓
- [x] **Phase 2**: Migration progressive de la hiérarchie projet ✓
- [x] **Phase 3**: Refactoring navigation avec architecture hexagonale ✓
- [x] **Phase 4**: Migration workflows inspection/paiement ✓
- [x] **Phase 5.1**: Nettoyage routes dupliquées + Création hooks manquants ✓ (CURRENT)
- [ ] **Phase 5.2**: Migration pages CRUD (Materials, Projects)
- [ ] **Phase 5.3**: Migration pages RH (Employees, Users)
- [ ] **Phase 5.4**: Migration pages Inspections
- [ ] **Phase 6**: Système de design et hiérarchie visuelle
- [ ] **Phase 7**: Tests, validation et déploiement progressif

---

## **INVENTAIRE COMPLET DES PAGES (44 Routes Uniques)**

### **Routes Publiques (13 pages)** - Sans authentification

| Route | Page/Composant | Statut Migration | Hook Cible |
|-------|----------------|------------------|------------|
| `/` | `Index` | ✅ N/A | Landing |
| `/auth` | `Auth` | ✅ N/A | Auth |
| `/contact` | `Contact` | ✅ N/A | Static |
| `/terms` | `Terms` | ✅ N/A | Static |
| `/policy` | `Policy` | ✅ N/A | Static |
| `/reset-password` | `ResetPassword` | ✅ N/A | Auth |
| `/supplier-portal` | `UnifiedSupplierPortal` | ✅ Service | TenderSharingService |
| `/supplier-tender` | `EnhancedSupplierTenderPortal` | ✅ Service | TenderSharingService |
| `/supplier-submissions` | `SupplierSubmissionDashboard` | ✅ Service | User-specific |
| `/supplier-access` | `SupplierSecureAccessPortal` | ✅ Service | TenderSharingService |
| `/evaluation-access` | `EvaluationAccessPortal` | ✅ Service | SubmissionSecretService |
| `/supplier-password-reset` | `SupplierPasswordReset` | ✅ N/A | Auth |
| `/workflow-test` | `WorkflowTest` | ✅ N/A | Test/Dev |

### **Routes Protégées - Core Business (17 pages)**

| Route | Page | Rôles | Statut | Hook |
|-------|------|-------|--------|------|
| `/home` | `Home` | !supplier | ⏳ À analyser | `useDashboardHex()` |
| `/dashboard` | `Dashboard` | admin, director | ✅ Migré | `useDashboardHex()` |
| `/enhanced-dashboard` | `EnhancedDashboard` | admin, director | ⏳ À migrer | `useDashboardHex()` |
| `/projects` | `Projects` | admin, director, pm, manager | ✅ Migré | `useProjectsHex()` |
| `/projects/create` | `ProjectCreate` | admin, director, pm, manager | ⏳ À migrer | `useProjectsHex()` |
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

### **Routes Protégées - RH & Organisation (5 pages)**

| Route | Page | Rôles | Statut | Hook |
|-------|------|-------|--------|------|
| `/employees` | `Employees` | !supplier | ⏳ À migrer | `useEmployeesHex()` ✅ |
| `/users` | `Users` | admin, director | ⏳ À migrer | `useUsersHex()` |
| `/profile` | `Profile` | !supplier | ✅ N/A | Auth profile |
| `/user-profile` | `UserProfile` | !supplier | ✅ N/A | Auth profile |
| `/settings` | `Settings` | admin, director | ✅ N/A | Config |

### **Routes Protégées - Tâches (2 pages)**

| Route | Page | Rôles | Statut | Hook |
|-------|------|-------|--------|------|
| `/tasks` | `Tasks` | !supplier | ⏳ À migrer | `useTasksHex()` ✅ |
| `/tasks/:taskId` | `TaskDetail` | tous | ⏳ À migrer | `useTaskHex()` ✅ |

### **Routes Protégées - Inspections (3 pages)**

| Route | Page | Rôles | Statut | Hook |
|-------|------|-------|--------|------|
| `/inspections/create` | `InspectionCreate` | !supplier | ⏳ À migrer | `useInspectionsHex()` ✅ |
| `/inspections/:id` | `InspectionDetail` | !supplier | ⏳ À migrer | `useInspectionHex()` ✅ |
| `/inspections/:id/edit` | `InspectionEdit` | !supplier | ⏳ À migrer | `useInspectionHex()` ✅ |

### **Routes Protégées - Monitoring & Contrôle (5 pages)**

| Route | Page | Rôles | Statut | Hook |
|-------|------|-------|--------|------|
| `/bank-guarantee-monitor` | `BankGuaranteeMonitorPage` | admin, director, pm, eng | ✅ Migré | `useBankGuaranteesHex()` |
| `/inspection-monitoring` | `InspectionMonitoringPage` | admin, director, eng, pm | ✅ Encapsulé | RoleBasedComponent |
| `/notifications-center` | `NotificationsCenterPage` | admin, director, pm, eng | ✅ Migré | `useNotificationsHex()` |
| `/insurance-management` | `InsuranceManagementPage` | admin, director, pm, legal | ⏳ À migrer | `useInsurancesHex()` |
| `/payment-control` | `PaymentControlPage` | admin, director, finance, pm | ✅ Migré | `usePaymentBlocksHex()` |

---

## **RÉSUMÉ MIGRATION**

| Catégorie | Total | Migrées ✅ | À Migrer ⏳ | N/A |
|-----------|-------|-----------|-------------|-----|
| Publiques | 13 | 0 | 0 | 13 |
| Core Business | 17 | 8 | 9 | 0 |
| RH & Organisation | 5 | 0 | 2 | 3 |
| Tâches | 2 | 0 | 2 | 0 |
| Inspections | 3 | 0 | 3 | 0 |
| Monitoring | 5 | 4 | 1 | 0 |
| **TOTAL** | **45** | **12** | **17** | **16** |

---

## **Phase 5.1: Nettoyage + Hooks - COMPLÉTÉ ✓**

### **Routes Dupliquées Nettoyées** ✅
- `/projects` - Unifié avec allowedRoles
- `/projects/create` - Unifié avec allowedRoles (utilise ProjectCreate)
- `/projects/:id` - Unifié avec allowedRoles
- `/projects/:id/edit` - Unifié avec allowedRoles

### **Hooks Hexagonaux Créés** ✅
| Hook | Fichier | Méthodes |
|------|---------|----------|
| `useEmployeesHex` | `useEmployeesHex.ts` | `employees`, `create`, `update`, `delete` |
| `useEmployeeHex` | `useEmployeesHex.ts` | `employee`, `isLoading` |
| `useTasksHex` | `useTasksHex.ts` | `tasks`, `create`, `update`, `delete`, `complete` |
| `useTaskHex` | `useTasksHex.ts` | `task`, `isLoading` |
| `useInspectionsHex` | `useInspectionsHex.ts` | `inspections`, `create`, `update`, `delete`, `approve`, `reject` |
| `useInspectionHex` | `useInspectionsHex.ts` | `inspection`, `isLoading` |

---

## **Hooks Hexagonaux - État Complet**

### **Existants et Fonctionnels** ✅

| Hook | Domaine | Fichier |
|------|---------|---------|
| `useProjectsHex` / `useProjectHex` | Projects | `useProjectsHex.ts` |
| `useMaterialsHex` / `useMaterialHex` | Materials | `useMaterialsHex.ts` |
| `useDashboardHex` | Dashboard | `useDashboardHex.ts` |
| `useSuppliersHex` / `useSupplierHex` | Suppliers | `useSuppliersHex.ts` |
| `usePhasesHex` / `usePhaseHex` | Phases | `usePhasesHex.ts` |
| `useBankGuaranteesHex` | Bank Guarantees | `useMonitoringHex.ts` |
| `usePaymentBlocksHex` | Payment Blocks | `useMonitoringHex.ts` |
| `useNotificationsHex` | Notifications | `useMonitoringHex.ts` |
| `useInsurancesHex` | Insurances | `useMonitoringHex.ts` |
| `useInspectionWorkflowHex` | Inspection Workflow | `useInspectionWorkflowHex.ts` |
| `usePaymentWorkflowHex` | Payment Workflow | `usePaymentWorkflowHex.ts` |
| `useDocumentsHex` | Documents | `useDocumentsHex.ts` |
| `useTendersHex` / `useTenderHex` | Tenders | `useTendersHex.ts` |
| `useEmployeesHex` / `useEmployeeHex` | Employees | `useEmployeesHex.ts` ✅ NEW |
| `useTasksHex` / `useTaskHex` | Tasks | `useTasksHex.ts` ✅ NEW |
| `useInspectionsHex` / `useInspectionHex` | Inspections | `useInspectionsHex.ts` ✅ NEW |

### **À Créer** ⏳

| Hook | Domaine | Priorité |
|------|---------|----------|
| `useUsersHex` | Users (RH) | P2 |

---

## **Prochaines Actions - Phase 5.2**

### **Action 1: Migrer Pages Materials**
- `MaterialCreate.tsx` → `useMaterialsHex().createMaterial()`
- `MaterialDetail.tsx` → `useMaterialHex(id)`
- `MaterialEdit.tsx` → `useMaterialHex(id)` + `useMaterialsHex().updateMaterial()`

### **Action 2: Migrer Pages Projects**
- `ProjectCreate.tsx` → `useProjectsHex().createProject()`
- `ProjectEdit.tsx` → `useProjectHex(id)` + `useProjectsHex().updateProject()`

### **Action 3: Migrer Pages Dashboards**
- `EnhancedDashboard.tsx` → `useDashboardHex()`
- `Home.tsx` → `useDashboardHex()` (si nécessaire)

---

**Statut actuel** : Phase 5.1 COMPLÉTÉE ✅ - Routes nettoyées, 3 nouveaux hooks créés  
**Prochaine étape** : Phase 5.2 - Migration pages CRUD (Materials, Projects)
