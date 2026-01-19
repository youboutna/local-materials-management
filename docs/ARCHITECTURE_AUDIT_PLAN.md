# **Audit d'Architecture Hexagonale - Plan de Correction Complet**

## 🎯 **Objectif**

Vérifier et corriger **tous les fichiers .tsx/.ts** pour qu'ils respectent l'architecture hexagonale définie dans **CONTEXT.md**, **task-plan.md** et **PROMPTS.md**.

## 📊 **État Actuel - Audit Complet**

### **🚨 Fichiers avec Données Mockées (À CORRIGER)**

#### **1. Données Statiques**
- ❌ **`src/data/projectsData.ts`** : 652 lignes de données mockées
  - Contient `allProjectsData` avec projets hardcodés
  - **Action** : Supprimer ou déplacer vers `/data/mock/`

#### **2. Scripts de Chargement**
- ❌ **`src/scripts/loadDataToSupabase.ts`** : Import direct de `allProjectsData`
  - **Action** : Supprimer le script ou utiliser pour développement uniquement

#### **3. Hooks avec Mock Direct**
- ❌ **`src/hooks/hexagonal/useDashboardHex.ts`** : `mockProjects` dans `fetchDashboardStats`
  - **Action** : Remplacer par service hexagonal
- ❌ **`src/hooks/hexagonal/useProjectsHex.ts`** : En cours de correction ✅
- ❌ **`src/hooks/hexagonal/useLoadDataButtonHex.ts`** : Utilise `ExecuteDataLoadingUseCase` (mock)

### **🔄 Fichiers Partiellement Corrigés**

#### **1. Architecture Hexagonale**
- ✅ **`useSuppliersHex.ts`** : Déjà conforme
- ✅ **`useTendersHex.ts`** : Déjà conforme  
- ✅ **`useDocumentsHex.ts`** : Déjà conforme
- ✅ **`usePhasesHex.ts`** : Déjà conforme

#### **2. Services et Transformers**
- ✅ **ProjectService** : Existant et fonctionnel
- ✅ **ProjectMapper** : Existant mais types incompatibles
- ✅ **Autres services** : Majoritalement conformes

### **🎨 Composants UI (À Vérifier)**

#### **Fichiers .tsx avec patterns suspects**
- `src/components/monitoring/PerformanceMetrics.tsx`
- `src/components/monitoring/SystemHealthOverview.tsx`
- `src/components/project/FinancialOverview.tsx`
- `src/components/project/PhaseList.tsx`
- `src/components/project/ProjectManagerProvider.tsx`
- `src/components/project/RiskOverview.tsx`
- `src/components/project/TaskList.tsx`
- `src/components/tenders/PublicProcurementWorkflow.tsx`

## 🏗️ **Architecture Cible**

### **Flux Correct**
```
[UI: FormData] → [Hook: use*Hex] → [*DTO] → [Service: *Service] → [*Entity] → 
[Interface: I*Repository] → [Adapter: Supabase*Adapter] → [*Transformer] → 
[Modèle DB: SupabaseRow] → [(BDD: PostgreSQL)]
```

### **Pattern Interdit**
```typescript
// ❌ DON'T USE DIRECT MOCK DATA
const mockData = [...]; // INTERDIT

// ✅ USE HEXAGONAL PATTERN
const repository = RepositoryFactory.getXXXRepository();
const service = new XXXService(repository, mapper);
const result = await service.getAll();
return mapper.toResponseDtoArray(result);
```

## 🔧 **Plan de Correction Complet**

### **Phase 1 : Nettoyage des Données Mockées** (Priorité HAUTE)

#### **1.1 Supprimer les fichiers de données mockées**
```bash
# Fichiers à supprimer
src/data/projectsData.ts
src/scripts/loadDataToSupabase.ts
```

#### **1.2 Remplacer les imports de données mockées**
```typescript
// ❌ À CORRIGER
import { allProjectsData } from '@/data/projectsData';

// ✅ CORRECTION
// Utiliser le service hexagonal
const { data } = useProjectsHex();
```

### **Phase 2 : Correction des Hooks Restants** (Priorité MOYENNE)

#### **2.1 useDashboardHex.ts**
```typescript
// ❌ Actuel
const mockProjects = [...];

// ✅ Correction
const projectRepository = RepositoryFactory.getProjectRepository();
const projectService = new ProjectService(projectRepository, mapper);
const projects = await projectService.getAllProjects();
```

#### **2.2 useLoadDataButtonHex.ts**
```typescript
// ❌ Actuel : Use case mock
const executeDataLoadingUseCase = new ExecuteDataLoadingUseCase();

// ✅ Correction
const loadDataRepository = RepositoryFactory.getLoadDataRepository();
const loadDataService = new LoadDataService(loadDataRepository);
```

### **Phase 3 : Vérification des Composants UI** (Priorité BASSE)

#### **3.1 Audit des composants .tsx**
- Vérifier les imports directs de données mockées
- Vérifier l'utilisation des services hexagonaux
- Corriger les signatures logiques

#### **3.2 Patterns à vérifier**
```typescript
// ❌ Patterns à trouver
import { mockData } from '@/data/xxxData';
const data = mockData.filter(...);

// ✅ Patterns corrects
const { data, loading } = useXXXHex();
```

### **Phase 4 : Validation des Services** (Priorité BASSE)

#### **4.1 Vérifier les services**
- `ProjectService` : ✅ Conforme
- `SupplierService` : ✅ Conforme
- `DocumentService` : ✅ Conforme
- Autres services : À vérifier

#### **4.2 Vérifier les transformers**
- `ProjectMapper` : Corriger les types incompatibles
- `SupplierMapper` : ✅ Conforme
- Autres mappers : À vérifier

## 📋 **Checklist de Validation**

### **Pour chaque fichier .tsx/.ts**

#### **✅ Critères de Conformité**
- [ ] Pas d'imports directs de `/data/*`
- [ ] Utilisation des hooks `use*Hex()`
- [ ] Pas de données mockées hardcodées
- [ ] Utilisation des services via RepositoryFactory
- [ ] Utilisation des DTOs via transformers
- [ ] Gestion des erreurs avec try/catch
- [ ] Mode développement conditionnel (`DEV_MODE`)

#### **🔄 Fichiers à Auditer**
1. `src/hooks/hexagonal/useDashboardHex.ts` - Mock direct ❌
2. `src/hooks/hexagonal/useLoadDataButtonHex.ts` - Use case mock ❌
3. `src/components/project/*.tsx` - À vérifier (5 fichiers)
4. `src/components/monitoring/*.tsx` - À vérifier (2 fichiers)
5. `src/components/tenders/*.tsx` - À vérifier (1 fichier)

## 🚀 **Actions Immédiates**

### **1. Supprimer les données mockées**
```bash
rm src/data/projectsData.ts
rm src/scripts/loadDataToSupabase.ts
```

### **2. Corriger useDashboardHex.ts**
```typescript
// Remplacer la fonction fetchDashboardStats
const projectRepository = RepositoryFactory.getProjectRepository();
const projectService = new ProjectService(projectRepository, mapper);
```

### **3. Corriger useLoadDataButtonHex.ts**
```typescript
// Remplacer par vraie architecture hexagonale
const loadDataRepository = RepositoryFactory.getLoadDataRepository();
```

### **4. Auditer les composants UI**
- Vérifier chaque composant pour les patterns interdits
- Corriger les imports de données mockées
- Assurer l'utilisation des hooks hexagonaux

## 📊 **Métriques de Correction**

| Catégorie | Fichiers | État Actuel | Objectif | Impact |
|------------|---------|---------------|---------|--------|
| **Données Mock** | 2 fichiers | ❌ 100% mock | ✅ 0% mock | Élimination |
| **Hooks** | 2 hooks | 🔄 50% corrects | ✅ 100% hexagonaux | Alignement |
| **Composants** | 8 fichiers | ❌ À vérifier | ✅ 100% services | Audit |
| **Services** | 5+ services | 🔄 80% conformes | ✅ 100% conformes | Validation |

## 🎯 **Résultat Attendu**

Une fois les corrections appliquées :
- ✅ **Architecture hexagonale** 100% respectée
- ✅ **Zéro données mockées** dans les hooks
- ✅ **Services centralisés** correctement utilisés
- ✅ **Transformers** intégrés dans tous les flux
- ✅ **Composants UI** utilisant les hooks hexagonaux
- ✅ **Mode développement** conditionnel et propre

L'application suivra **parfaitement les guides architecturaux** établis ! 🏗️
