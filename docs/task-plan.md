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

## **Phase 1: Audit & Stratégie - COMPLÉTÉE ✓**

### Réalisations:
- Analyse de l'architecture existante
- Identification des patterns à corriger
- Définition de la stratégie hexagonale

---

## **Phase 2: Migration Hexagonale - COMPLÉTÉE ✓**

### **Architecture Hexagonale Implémentée**

#### **1. Domain Entities (`src/domain/entities/`)**
- ✅ `Project.ts` - Entité projet avec logique métier
- ✅ `Material.ts` - Entité matériau avec propriétés étendues
- ✅ `Phase.ts` - Entité phase avec steps et tasks
- ✅ `Supplier.ts` - Entité fournisseur
- ✅ `Document.ts` - Entité document
- ✅ `Tender.ts` - Entité appel d'offres

#### **2. Repository Interfaces (`src/domain/repositories/`)**
- ✅ `IProjectRepository.ts`
- ✅ `IMaterialRepository.ts`
- ✅ `IPhaseRepository.ts`
- ✅ `ISupplierRepository.ts`
- ✅ `IDocumentRepository.ts`
- ✅ `ITenderRepository.ts`

#### **3. Use Cases (`src/application/use-cases/`)**
- ✅ **Project Use Cases:**
  - `GetProjectsListUseCase`
  - `GetProjectByIdUseCase`
  - `CreateProjectUseCase`
  - `UpdateProjectUseCase`
  - `DeleteProjectUseCase`
  - `GetPhaseDetailsUseCase`

- ✅ **Material Use Cases:**
  - `GetMaterialsListUseCase`
  - `GetMaterialByIdUseCase`
  - `CreateMaterialUseCase`
  - `UpdateMaterialUseCase`
  - `DeleteMaterialUseCase`

- ✅ **Supplier Use Cases:**
  - `GetSuppliersListUseCase`
  - `GetSupplierByIdUseCase`
  - `CreateSupplierUseCase`
  - `UpdateSupplierUseCase`
  - `DeleteSupplierUseCase`

#### **4. Infrastructure Adapters (`src/infrastructure/supabase/adapters/`)**
- ✅ `SupabaseProjectAdapter.ts`
- ✅ `SupabaseMaterialAdapter.ts`
- ✅ `SupabasePhaseAdapter.ts`
- ✅ `SupabaseSupplierAdapter.ts`

#### **5. Repository Factory (`src/infrastructure/`)**
- ✅ `RepositoryFactory.ts` - Factory centralisée

#### **6. Hexagonal Hooks (`src/hooks/hexagonal/`)**
- ✅ `useProjectsHex.ts` - CRUD projets + refetch
- ✅ `useMaterialsHex.ts` - CRUD matériaux + refetch
- ✅ `useSuppliersHex.ts` - CRUD fournisseurs
- ✅ `useDocumentsHex.ts` - Documents par projet
- ✅ `useTendersHex.ts` - Appels d'offres par projet
- ✅ `useDashboardHex.ts` - Statistiques dashboard

### **Pages Migrées vers Hexagonal**
- ✅ `src/pages/Projects.tsx` → `useProjectsHex()`
- ✅ `src/pages/Materials.tsx` → `useMaterialsHex()`
- ✅ `src/pages/Dashboard.tsx` → `useDashboardHex()`

### **Exemple Migration**
```tsx
// AVANT (accès direct Supabase)
const { data } = await supabase.from('projects').select('*');

// APRÈS (architecture hexagonale)
import { useProjectsHex } from '@/hooks/hexagonal';
const { projects, loading, createProject, deleteProject } = useProjectsHex();
```

---

## **Phase 3: Navigation & Hiérarchie Visuelle (CURRENT)**

### **Objectif**
Améliorer la navigation entre les niveaux hiérarchiques avec composants visuels.

### **Structure Hiérarchique 5 Niveaux**
1. 🌐 **PROJET** - Dashboard stratégique global
2. 🏗️ **PHASE** - Vue opérationnelle par phase  
3. 📋 **ÉTAPE** - Détails processus (optionnel)
4. 📍 **JALON** - Points de contrôle critiques
5. ⚡ **ACTION** - Interactions utilisateur

### **Composants Hiérarchiques (`src/components/project/hierarchy/`)**
- ✅ `KPICard.tsx` - Carte d'indicateurs clés
- ✅ `ProjectHeader.tsx` - Header avec breadcrumb et KPI
- ✅ `PhaseNode.tsx` - Nœud de phase interactif
- ✅ `ProjectHierarchyView.tsx` - Vue hiérarchique complète
- ✅ `ProjectMatrixView.tsx` - Tableau matriciel
- ✅ `StepNode.tsx` - Nœud d'étape
- ✅ `MilestoneNode.tsx` - Nœud de jalon

### **Tâches Restantes Phase 3**
- [ ] Migrer `PhaseDetailsPage` vers hooks hexagonaux
- [ ] Créer `PhaseBreadcrumb` avec navigation hiérarchique
- [ ] Implémenter `PhaseHeader` avec métriques
- [ ] Développer `PhaseWithStepsView` et `PhaseWithDirectMilestonesView`
- [ ] Ajouter `PhaseMetrics` et `PhaseActions`

---

## **Phase 4: Workflows Inspection/Paiement**

### **Objectif**
Migrer les workflows métier vers l'architecture hexagonale.

### **Use Cases à Créer**
- [ ] `CreateInspectionUseCase`
- [ ] `ApprovePaymentUseCase`
- [ ] `GenerateProgressInvoiceUseCase`

---

## **Phase 5: Système de Design**

### **Objectif**
Tokens design cohérents et thème unifié.

### **Tâches**
- [ ] Audit tokens CSS existants
- [ ] Standardiser couleurs HSL dans `index.css`
- [ ] Créer variantes de composants shadcn

---

## **Phase 6: Tests & Déploiement**

### **Objectif**
Validation complète et déploiement progressif.

### **Tâches**
- [ ] Tests unitaires use cases
- [ ] Tests d'intégration hooks
- [ ] Déploiement feature flags

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

---

**Statut actuel** : Phase 2 terminée ✅ - Phase 3 en cours 🚀  
**Prochaine milestone** : Migration `PhaseDetailsPage` vers hexagonal
