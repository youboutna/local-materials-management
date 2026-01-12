# **Task Plan: Architecture Hexagonale & Navigabilité Améliorée pour Construction Management**

## **Goal**

Migrer l'architecture vers un modèle hexagonal propre avec navigabilité améliorée et hiérarchie visuelle des pages projet.

---

## **Phases**

- [x] **Phase 1**: Audit de l'architecture existante et définition de la stratégie ✓
- [x] **Phase 2**: Migration progressive de la hiérarchie projet ✓
- [x] **Phase 3**: Refactoring navigation avec architecture hexagonale ✓
- [x] **Phase 4**: Migration workflows inspection/paiement ✓ (CURRENT)
- [ ] **Phase 5**: Système de design et hiérarchie visuelle
- [ ] **Phase 6**: Tests, validation et déploiement progressif

---

## **Phase 2: Migration Hexagonale - COMPLÉTÉE ✓**

### **Pages Migrées**
- ✅ `src/pages/Projects.tsx` → `useProjectsHex()`
- ✅ `src/pages/Materials.tsx` → `useMaterialsHex()`
- ✅ `src/pages/Dashboard.tsx` → `useDashboardHex()`
- ✅ `src/pages/BankGuaranteeMonitor.tsx` → `useProjectsHex()` + `useBankGuaranteesHex()`
- ✅ `src/pages/PaymentControl.tsx` → `useProjectsHex()` + `usePaymentBlocksHex()`

---

## **Phase 3: Navigation & Pages Restantes (CURRENT)**

### **Analyse Complète des Pages**

#### **Groupe 1: Pages Monitoring/Admin (Priorité Haute)**

| Page | Fichier | Composants Clés | Migration |
|------|---------|-----------------|-----------|
| Suppliers | `src/pages/Suppliers.tsx` | useQuery direct, CRUD mutations | → `useSuppliersHex()` |
| Documents | `src/pages/Documents.tsx` | DocumentsList, TenderDocuments | → `useDocumentsHex()` |
| NotificationsCenter | `src/pages/NotificationsCenter.tsx` | Real-time, RoleBasedNotificationCenter | → `useNotificationsHex()` |
| InsuranceManagement | `src/pages/InsuranceManagement.tsx` | UnifiedInsuranceManager, ProjectManagerProvider | → `useInsurancesHex()` |
| InspectionMonitoring | `src/pages/InspectionMonitoring.tsx` | RoleBasedInspectionMonitoring | Déjà encapsulé ✅ |

#### **Groupe 2: Portails Fournisseurs (Publics - Pas de migration)**

| Page | Fichier | Statut |
|------|---------|--------|
| SupplierSecureAccessPortal | `src/components/tenders/SupplierSecureAccessPortal.tsx` | Public, TenderSharingService ✅ |
| EvaluationAccessPortal | `src/components/tenders/EvaluationAccessPortal.tsx` | Public, SubmissionSecretService ✅ |
| SupplierSubmissionDashboard | `src/components/suppliers/SupplierSubmissionDashboard.tsx` | User-specific, bien structuré ✅ |

#### **Groupe 3: Page PhaseDetailsPage (Navigation Hiérarchique)**

| Page | Fichier | Hooks Utilisés | Amélioration |
|------|---------|----------------|--------------|
| PhaseDetailsPage | `src/components/project/PhaseDetailsPage.tsx` | usePhaseDetails, usePhaseWorkflow | Navigation hiérarchique |

**Structure actuelle:**
```tsx
// Utilise déjà des hooks bien structurés
const { phase, isLoading, error, metrics, updatePhase } = usePhaseDetails(phaseId);
const { workflowMetrics, inspections, payments, latestApprovedInspection } = usePhaseWorkflow(projectId, phaseId, phase);
```

---

### **Tâches Phase 3 - Mise à Jour**

#### **3.1 Hooks Hexagonaux Monitoring** ✅ COMPLÉTÉ
- [x] `useBankGuaranteesHex` 
- [x] `usePaymentBlocksHex`
- [x] `useInsurancesHex`
- [x] `useNotificationsHex`
- [x] `usePhaseHex` / `usePhasesHex`

#### **3.2 Pages Monitoring Migration** ✅ COMPLÉTÉ
- [x] `BankGuaranteeMonitorPage` → `useProjectsHex()` + `useBankGuaranteesHex()`
- [x] `PaymentControlPage` → `useProjectsHex()` + `usePaymentBlocksHex()`

#### **3.3 Pages Restantes** ✅ COMPLÉTÉ
- [x] **Suppliers.tsx** → `useSuppliersHex()` 
  - Mutations CRUD refactorées via hook hexagonal
  - Suppression appels Supabase directs
  
- [x] **Documents.tsx** → `useProjectsHex()` ✅
  - Suppression useQuery direct pour projets
  - Intégration avec hook hexagonal
  
- [x] **NotificationsCenterPage** → `useNotificationsHex()` ✅
  - Real-time subscription conservée
  - 6 hooks par type de notification (inspection, projet, paiement, tâche, document, système)
  - Suppression fetchAllNotifications async

#### **3.4 Navigation Hiérarchique PhaseDetailsPage** ✅ COMPLÉTÉ
- [x] `PhaseBreadcrumb` amélioré avec titre projet dynamique via `useProjectHex()`
- [x] Navigation vers phases adjacentes ajoutée
- [x] Skeleton loading pour le titre projet

---

### **Portails Fournisseurs - Pas de Migration Nécessaire**

Ces composants sont bien structurés avec des services dédiés:

1. **SupplierSecureAccessPortal** - Utilise `TenderSharingService`
2. **EvaluationAccessPortal** - Utilise `SubmissionSecretService`
3. **SupplierSubmissionDashboard** - Queries autonomes user-specific

**Raison:** Portails publics avec logique d'authentification spéciale (codes secrets), ne nécessitent pas l'architecture hexagonale.

---

### **InspectionMonitoringPage - Pas de Changement**

```tsx
// Déjà bien encapsulé via composant
<RoleBasedInspectionMonitoring />
```

Le composant gère sa propre logique, pas besoin de migration supplémentaire.

---

## **Prochaines Actions Immédiates**

### **Action 1: Migrer Suppliers.tsx**
```tsx
// Avant (appels Supabase directs)
const { data: suppliers } = useQuery({
  queryFn: async () => {
    const { data } = await supabase.from('suppliers').select('*');
    return data;
  }
});

// Après (hook hexagonal)
const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier } = useSuppliersHex();
```

### **Action 2: Migrer Documents.tsx**
```tsx
// Utiliser useDocumentsHex() pour charger projets et documents
const { documents, isLoading } = useDocumentsHex();
const { projects } = useProjectsHex();
```

### **Action 3: Améliorer PhaseDetailsPage Navigation**
```tsx
// Améliorer PhaseBreadcrumb avec titre projet dynamique
<PhaseBreadcrumb
  project={{ id: projectId, title: projectTitle }} // ← Charger depuis useProjectsHex
  phase={phase}
  adjacentPhases={adjacentPhases} // ← Permettre navigation
/>
```

---

## **Phase 4: Workflows Inspection/Paiement - COMPLÉTÉE ✓**

### **Hooks Workflow Créés**
- ✅ `useInspectionWorkflowHex` - Workflow complet d'inspection
  - `createRequest()` - Créer une demande d'inspection
  - `scheduleInspection()` - Programmer une inspection
  - `executeInspection()` - Exécuter et valider/rejeter
  
- ✅ `usePaymentWorkflowHex` - Workflow complet de paiement
  - `createRequest()` - Créer une demande de paiement
  - `validatePayment()` - Valider/approuver/rejeter par rôle

### **Use Cases Existants Utilisés**
- `CreateInspectionRequestUseCase`
- `ScheduleInspectionUseCase`
- `ExecuteInspectionUseCase`
- `CreatePaymentRequestUseCase`
- `ValidatePaymentUseCase`

---

## **Métriques de Progression**

| Domaine | Entités | Repositories | Use Cases | Hooks | Pages |
|---------|---------|--------------|-----------|-------|-------|
| Projects | ✅ | ✅ | ✅ 5/5 | ✅ | ✅ |
| Materials | ✅ | ✅ | ✅ 5/5 | ✅ | ✅ |
| Phases | ✅ | ✅ | ✅ 1/3 | ✅ | ✅ |
| Suppliers | ✅ | ✅ | ✅ 5/5 | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ 2/2 | ✅ | ✅ |
| Tenders | ✅ | ⏳ | ⏳ 2/2 | ✅ | N/A |
| Monitoring | ✅ | ✅ | ⏳ | ✅ | ✅ |
| Notifications | ✅ | ⏳ | ⏳ | ✅ | ✅ |
| Inspections | ✅ | ✅ | ✅ 4/4 | ✅ | N/A |
| Payments | ✅ | ✅ | ✅ 3/3 | ✅ | N/A |

---

## **Routes - État Actuel**

### **Routes Publiques** (pas de migration)
- `/supplier-portal`, `/supplier-tender`, `/supplier-access`
- `/supplier-submissions`, `/evaluation-access`
- Ces portails utilisent des services dédiés ✅

### **Routes Protégées - Migrées** ✅
- `/projects` - `useProjectsHex()`
- `/materials` - `useMaterialsHex()`
- `/dashboard` - `useDashboardHex()`
- `/bank-guarantee-monitor` - `useBankGuaranteesHex()`
- `/payment-control` - `usePaymentBlocksHex()`
- `/suppliers` - `useSuppliersHex()`
- `/documents` - `useProjectsHex()`
- `/notifications-center` - `useNotificationsHex()`

### **Routes Protégées - Navigation Hiérarchique** ✅
- `/projects/:projectId/phases/:phaseId` - PhaseDetailsPage avec PhaseBreadcrumb amélioré

### **Workflows Hexagonaux** ✅
- Inspection: `useInspectionWorkflowHex()`
- Payment: `usePaymentWorkflowHex()`

---

## **Phase 5: Système de Design (À VENIR)**

### **Objectifs**
1. Standardiser les tokens de design (couleurs, espacements, typographie)
2. Créer des variantes de composants cohérentes
3. Améliorer la hiérarchie visuelle des pages projet
4. Documentation des patterns UI

---

**Statut actuel** : Phase 4 COMPLÉTÉE ✅ - Workflows hexagonaux créés  
**Prochaine phase** : Phase 5 - Système de design et hiérarchie visuelle
