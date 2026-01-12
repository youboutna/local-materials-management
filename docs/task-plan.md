# **Task Plan: Architecture Hexagonale & Navigabilité Améliorée pour Construction Management**

## **Goal**

Migrer l'architecture vers un modèle hexagonal propre avec navigabilité améliorée et hiérarchie visuelle des pages projet.

---

## **Phases**

- [x] **Phase 1**: Audit de l'architecture existante et définition de la stratégie ✓
- [x] **Phase 2**: Migration progressive de la hiérarchie projet ✓
- [ ] **Phase 3**: Refactoring navigation avec architecture hexagonale (CURRENT)
- [ ] **Phase 4**: Migration workflows inspection/paiement
- [ ] **Phase 5**: Système de design et hiérarchie visuelle
- [ ] **Phase 6**: Tests, validation et déploiement progressif

---

## **Phase 2: Migration Hexagonale - COMPLÉTÉE ✓**

### **Pages Migrées**
- ✅ `src/pages/Projects.tsx` → `useProjectsHex()`
- ✅ `src/pages/Materials.tsx` → `useMaterialsHex()`
- ✅ `src/pages/Dashboard.tsx` → `useDashboardHex()`

---

## **Phase 3: Navigation & Pages Restantes (CURRENT)**

### **Analyse des Pages à Migrer**

#### **Groupe 1: Pages Monitoring (Priorité Haute)**

| Page | Fichier | Dépendances Supabase Directes | Complexité |
|------|---------|------------------------------|------------|
| BankGuaranteeMonitor | `src/pages/BankGuaranteeMonitor.tsx` | projects, project_hierarchy RPC | Moyenne |
| InspectionMonitoring | `src/pages/InspectionMonitoring.tsx` | Via composant RoleBasedInspectionMonitoring | Faible |
| PaymentControl | `src/pages/PaymentControl.tsx` | payment_blocks, notifications, projects | Haute |
| NotificationsCenter | `src/pages/NotificationsCenter.tsx` | notifications | Moyenne |
| InsuranceManagement | `src/pages/InsuranceManagement.tsx` | insurance_certificates | Moyenne |

**Patterns identifiés:**
- `ProjectManagerProvider` utilisé pour contexte projet
- Appels RPC `get_project_hierarchy` pour hiérarchie
- Real-time subscriptions sur `notifications`
- Chargement projet par défaut (premier projet "en cours")

#### **Groupe 2: Portails Fournisseurs (Priorité Moyenne)**

| Page | Fichier | Dépendances Supabase Directes | Complexité |
|------|---------|------------------------------|------------|
| UnifiedSupplierPortal | `src/pages/UnifiedSupplierPortal.tsx` | suppliers, documents, notifications, parsed_invoices | Très Haute |
| EnhancedSupplierTenderPortal | `src/components/suppliers/EnhancedSupplierTenderPortal.tsx` | Via TenderService, TenderSubmissionService | Haute |
| SupplierSubmissionDashboard | `src/components/suppliers/SupplierSubmissionDashboard.tsx` | tender_submissions | Moyenne |

**Patterns identifiés:**
- Auth state management avec `supabase.auth.onAuthStateChange`
- Services existants: `TenderService`, `TenderSubmissionService`
- React Query pour fetching avec cache
- Documents uploads via `useDocumentStorage`

#### **Groupe 3: Pages Projets Détail (Priorité Haute)**

| Page | Fichier | Dépendances | Complexité |
|------|---------|-------------|------------|
| PhaseDetailsPage | `src/components/project/PhaseDetailsPage.tsx` | IPhaseRepository, GetPhaseDetailsUseCase | Moyenne |
| ProjectDetail | `src/pages/ProjectDetail.tsx` | projects, phases | Moyenne |
| ProjectPhasesDetail | `src/pages/ProjectPhasesDetail.tsx` | phases | Faible |

---

### **Stratégie de Migration Phase 3**

#### **Étape 3.1: Hooks Monitoring Hexagonaux** ✅
Hooks créés pour encapsuler les logiques monitoring:

```tsx
// src/hooks/hexagonal/useMonitoringHex.ts
export const useBankGuaranteesHex = () => { /* ✅ Créé */ };
export const usePaymentBlocksHex = () => { /* ✅ Créé */ };
export const useInsurancesHex = () => { /* ✅ Créé */ };
export const useNotificationsHex = () => { /* ✅ Créé */ };
```

#### **Étape 3.2: Hook Phases Hexagonal** ✅
Hook créé avec support phases:

```tsx
// src/hooks/hexagonal/usePhasesHex.ts
export const usePhaseHex = (phaseId?: string) => { /* ✅ Créé */ };
export const usePhasesHex = (projectId?: string) => { /* ✅ Créé */ };
```

#### **Étape 3.3: Pages Migrées** 
- ✅ `BankGuaranteeMonitorPage` → `useProjectsHex()` + `useBankGuaranteesHex()`
- ✅ `PaymentControlPage` → `useProjectsHex()` + `usePaymentBlocksHex()`

---

### **Tâches Phase 3**

#### **3.1 Hooks Hexagonaux Monitoring** ✅
- [x] Créer `src/hooks/hexagonal/usePhasesHex.ts`
- [x] Créer `src/hooks/hexagonal/useMonitoringHex.ts`
  - [x] `useBankGuaranteesHex`
  - [x] `usePaymentBlocksHex`
  - [x] `useInsurancesHex`
  - [x] `useNotificationsHex`

#### **3.2 Pages Monitoring Migration** ✅
- [x] Migrer `BankGuaranteeMonitorPage` → `useProjectsHex()` + `useBankGuaranteesHex()`
- [x] Migrer `PaymentControlPage` → `useProjectsHex()` + `usePaymentBlocksHex()`

#### **3.3 Pages Restantes** (À faire)
- [ ] Migrer `InspectionMonitoringPage` → hooks existants
- [ ] Migrer `NotificationsCenterPage` → `useNotificationsHex()`
- [ ] Migrer `InsuranceManagementPage` → `useInsurancesHex()`
- [ ] Migrer `Suppliers.tsx` → `useSuppliersHex()`
- [ ] Migrer `Documents.tsx` → `useDocumentsHex()`

#### **3.4 Navigation Hiérarchique** (À faire)
- [ ] Améliorer `PhaseDetailsPage` avec breadcrumb dynamique
- [ ] Intégrer `usePhaseHex` dans les composants de workflow

#### **3.5 Navigation Hiérarchique**
- [ ] Créer `PhaseBreadcrumb` avec navigation projet → phase
- [ ] Créer `PhaseHeader` avec métriques
- [ ] Implémenter `PhaseWithStepsView` / `PhaseWithDirectMilestonesView`

---

### **Use Cases à Créer (Phase 3)**

```
src/application/use-cases/
├── monitoring/
│   ├── GetBankGuaranteesUseCase.ts
│   ├── GetPaymentBlocksUseCase.ts
│   └── GetInsurancesUseCase.ts
├── notification/
│   ├── GetNotificationsUseCase.ts
│   └── MarkNotificationReadUseCase.ts
└── phase/
    ├── GetPhaseByIdUseCase.ts
    └── UpdatePhaseProgressUseCase.ts
```

---

### **Repositories à Créer (Phase 3)**

```
src/domain/repositories/
├── IBankGuaranteeRepository.ts
├── IPaymentBlockRepository.ts
├── IInsuranceRepository.ts
└── INotificationRepository.ts
```

---

## **Phase 4: Workflows Inspection/Paiement**

### **Objectif**
Migrer les workflows métier vers l'architecture hexagonale.

### **Use Cases Prévus**
- [ ] `CreateInspectionUseCase`
- [ ] `ApprovePaymentUseCase`
- [ ] `GenerateProgressInvoiceUseCase`
- [ ] `BlockPaymentUseCase`

---

## **Métriques de Progression**

| Domaine | Entités | Repositories | Use Cases | Hooks | Pages |
|---------|---------|--------------|-----------|-------|-------|
| Projects | ✅ | ✅ | ✅ 5/5 | ✅ | ✅ |
| Materials | ✅ | ✅ | ✅ 5/5 | ✅ | ✅ |
| Phases | ✅ | ✅ | ⏳ 1/3 | ⏳ | ⏳ |
| Suppliers | ✅ | ✅ | ✅ 5/5 | ✅ | ⏳ |
| Documents | ✅ | ⏳ | ⏳ | ✅ | ⏳ |
| Tenders | ✅ | ⏳ | ⏳ | ✅ | ⏳ |
| Monitoring | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Notifications | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## **Routes à Migrer (Référence)**

### **Routes Publiques** (pas de migration nécessaire)
- `/` - Index
- `/auth` - Auth
- `/contact`, `/terms`, `/policy`
- `/supplier-portal`, `/supplier-tender`, `/supplier-access`

### **Routes Protégées - Priorité Haute**
- `/projects/:projectId/phases/:phaseId` - PhaseDetailsPage ⏳
- `/bank-guarantee-monitor` - BankGuaranteeMonitorPage ⏳
- `/payment-control` - PaymentControlPage ⏳
- `/inspection-monitoring` - InspectionMonitoringPage ⏳

### **Routes Protégées - Priorité Moyenne**
- `/notifications-center` - NotificationsCenterPage ⏳
- `/insurance-management` - InsuranceManagementPage ⏳
- `/suppliers` - Suppliers ⏳
- `/documents` - Documents ⏳

### **Routes Protégées - Déjà Migrées**
- `/projects` - Projects ✅
- `/materials` - Materials ✅
- `/dashboard` - Dashboard ✅

---

**Statut actuel** : Phase 2 terminée ✅ - Phase 3 planifiée 📋  
**Prochaine action** : Créer hooks hexagonaux pour monitoring et phases
