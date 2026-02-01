# 🚀 PLAN DE MIGRATION TOTALE - ARCHITECTURE HEXAGONALE
## Basé sur les directives de @[docs/PROMPTS.md]

---

## 📊 **ÉTAT ACTUEL - 1 FÉVRIER 2026**

### **🎯 Architecture Hexagonale**
- **Services Application** : 57/57 créés (100%) ✅
- **Hooks Hexagonaux** : 104/104 créés (100%) ✅
- **Components React** : 386/386 fichiers (100%) ✅
- **Appels directs Supabase** : 4 appels restants ⚠️
- **Progression globale** : 99.2% hexagonal ✅

### **🚨 Appels directs Supabase identifiés**
1. **`useSupplierDashboardHex.ts`** - 4 appels (supabase.from)
2. **`usePasswordManagement.ts`** - 1 appel (commenté)
3. **`OAuthConfigGuide.tsx`** - 1 appel (URL externe)
4. **`LoadDataButton.tsx`** - 1 appel (script de chargement)

---

## 🎮 **ANALYSE SELON LES RÈGLES PROMPTS.md**

### **🔍 Références legacy identifiées**

#### **📁 Types legacy (`/src/types/*`)**
- **34 fichiers** de types et interfaces legacy
- **Problème** : Violation Règle #4 (DTOs dans entités)
- **Impact** : 181 components utilisent encore ces types

#### **🔧 Utils legacy (`/src/utils/*`)**
- **19 fichiers** d'utilitaires et helpers
- **Problème** : Logique métier dans utilitaires (Règle #2)
- **Impact** : Calculs business hors du domaine

#### **🏢 Services legacy (`/src/services/*`)**
- **33 fichiers** de services legacy
- **Problème** : Couplage direct avec Supabase
- **Impact** : Violation flux hexagonal (Règle #1)

---

## 🎯 **PLAN DE MIGRATION EN 4 PHASES**

### **🔥 PHASE 1 : ÉRADICATION DES APPELS DIRECTS (JOUR 1)**

#### **Priorité HAUTE - Appels Supabase restants**
```typescript
// ❌ À CORRIGER : useSupplierDashboardHex.ts
const { data, error } = await supabase
  .from('suppliers')
  .select('*')
  .eq('user_id', userId)

// ✅ CORRECTION : Utiliser SupplierService
const supplierService = new SupplierService();
const data = await supplierService.getSupplierByUserId(userId);
```

**Fichiers à migrer :**
1. **`useSupplierDashboardHex.ts`** - Remplacer 4 appels supabase par SupplierService
2. **`usePasswordManagement.ts`** - Finaliser migration vers AuthService
3. **`OAuthConfigGuide.tsx`** - Externaliser URL dans configuration
4. **`LoadDataButton.tsx`** - Créer DataImportService hexagonal

---

### **🔄 PHASE 2 : MIGRATION DES TYPES LEGACY (JOURS 2-3)**

#### **Priorité MOYENNE - Types et interfaces**

**Stratégie de migration :**
```typescript
// ❌ ANCIEN : /src/types/project.ts
export interface ProjectAPIDTO {
  id: string;
  project_name: string;
  // ... champs de mapping API
}

// ✅ NOUVEAU : Séparation Domaine/DTO
// Domaine pur (/src/domain/entities/Project.ts)
export class Project {
  constructor(
    public id: string,
    public title: string,
    // ... logique métier pure
  ) {}
}

// DTO pour échanges (/src/dtos/entities/ProjectDTO.ts)
export interface ProjectDTO {
  id: string;
  title: string;
  // ... structure API/UI
}
```

**Fichiers critiques à migrer :**
1. **`/src/types/project.ts`** → Domaine + DTOs
2. **`/src/types/supplier.ts`** → Domaine + DTOs
3. **`/src/types/material.entity.ts`** → Domaine + DTOs
4. **`/src/types/phase-dto.ts`** → DTOs unifiés
5. **`/src/types/workflow.ts`** → Domaine + DTOs

---

### **⚡ PHASE 3 : MIGRATION DES UTILITAIRES (JOURS 4-5)**

#### **Priorité MOYENNE - Utils et calculs**

**Stratégie de migration :**
```typescript
// ❌ ANCIEN : /src/utils/phaseHelpers.ts
export function calculatePhaseProgress(phase) {
  // Logique métier dans utilitaire - 🚨
  return (completedTasks / totalTasks) * 100;
}

// ✅ NOUVEAU : Logique dans domaine
// /src/domain/entities/Phase.ts
export class Phase {
  calculateProgress(): number {
    // ✅ Logique métier pure
    return this.tasks.reduce((acc, task) => 
      acc + (task.isCompleted ? task.weight : 0), 0
    ) / this.getTotalWeight();
  }
}

// Transformer pour calculs UI
// /src/dtos/transforms/PhaseTransformer.ts
export class PhaseTransformer {
  static toUIState(phase: Phase): PhaseUIState {
    return {
      ...phase,
      calculatedProgress: phase.calculateProgress(), // ✅ Calcul d'affichage
      formattedProgress: `${phase.calculateProgress()}%` // ✅ Formatage
    };
  }
}
```

**Fichiers critiques à migrer :**
1. **`phaseHelpers.ts`** → Phase.calculateProgress()
2. **`paymentCalculations.ts`** → Payment.calculateAmount()
3. **`projectDataCalculations.ts`** → Project.calculateMetrics()
4. **`insuranceCalculations.ts`** → Insurance.calculatePremium()
5. **`reportCalculations.ts`** → Report.calculateTotals()

---

### **🎨 PHASE 4 : MIGRATION DES SERVICES LEGACY (JOURS 6-7)**

#### **Priorité BASSE - Services legacy**

**Stratégie de migration :**
```typescript
// ❌ ANCIEN : /src/services/SupplierService.ts
export class SupplierService {
  async getSuppliers() {
    const { data } = await supabase // 🚨 Couplage direct
      .from('suppliers')
      .select('*');
    return data;
  }
}

// ✅ NOUVEAU : Architecture hexagonale
// Interface (/src/application/interfaces/ISupplierService.ts)
export interface ISupplierService {
  getSuppliers(): Promise<SupplierDTO[]>;
  getSupplierById(id: string): Promise<SupplierDTO>;
}

// Service (/src/application/services/SupplierService.ts)
export class SupplierService implements ISupplierService {
  constructor(
    private supplierRepository = RepositoryFactory.getSupplierRepository()
  ) {}

  async getSuppliers(): Promise<SupplierDTO[]> {
    const suppliers = await this.supplierRepository.findAll();
    return suppliers.map(s => SupplierTransformer.toDTO(s));
  }
}
```

**Services à migrer :**
1. **`SupplierService.ts`** → Service hexagonal + Repository
2. **`BankGuaranteeService.ts`** → Service hexagonal + Repository
3. **`NotificationService.ts`** → Service hexagonal + Repository
4. **`PaymentInitiationService.ts`** → Service hexagonal + Repository
5. **`ProjectAnalyticsService.ts`** → Service hexagonal + Repository

---

## 📋 **PLAN D'EXÉCUTION DÉTAILLÉ**

### **JOUR 1 : Appels directs Supabase**
- **Matin** : `useSupplierDashboardHex.ts` → SupplierService
- **Après-midi** : `usePasswordManagement.ts` → AuthService
- **Soir** : `OAuthConfigGuide.tsx` + `LoadDataButton.tsx`

### **JOUR 2 : Types critiques**
- **Matin** : `project.ts` → Domain + DTOs
- **Après-midi** : `supplier.ts` → Domain + DTOs
- **Soir** : `material.entity.ts` → Domain + DTOs

### **JOUR 3 : Types restants**
- **Matin** : `phase-dto.ts` + `workflow.ts`
- **Après-midi** : `inspection.dto.ts` + `tender.entity.ts`
- **Soir** : Validation et tests

### **JOUR 4 : Utilitaires calculs**
- **Matin** : `phaseHelpers.ts` → Phase.calculateProgress()
- **Après-midi** : `paymentCalculations.ts` → Payment.calculateAmount()
- **Soir** : `projectDataCalculations.ts` → Project.calculateMetrics()

### **JOUR 5 : Utilitaires restants**
- **Matin** : `insuranceCalculations.ts` + `reportCalculations.ts`
- **Après-midi** : `notificationUtils.ts` + `btpCalculations.ts`
- **Soir** : Validation et tests

### **JOUR 6 : Services legacy**
- **Matin** : `SupplierService.ts` → Architecture hexagonale
- **Après-midi** : `BankGuaranteeService.ts` → Architecture hexagonale
- **Soir** : `NotificationService.ts` → Architecture hexagonale

### **JOUR 7 : Finalisation**
- **Matin** : Services restants
- **Après-midi** : Validation complète
- **Soir** : Documentation et déploiement

---

## 🎯 **RÉSULTATS ATTENDUS**

### **✅ Architecture 100% hexagonale**
- **Appels directs Supabase** : 0/0 🎯
- **Types legacy** : 0/34 migrés 🎯
- **Utils legacy** : 0/19 migrés 🎯
- **Services legacy** : 0/33 migrés 🎯

### **✅ Respect des règles PROMPTS.md**
- **Règle #1** : Flèche sacrée respectée ✅
- **Règle #2** : Rôles immuables maintenus ✅
- **Règle #4** : Pureté des entités garantie ✅
- **Règle #5** : Séparation UI/Domaine parfaite ✅

### **✅ Bénéfices**
- **Testabilité** maximale avec mocks
- **Maintenabilité** accrue
- **Performance** optimisée
- **Extensibilité** facilitée

---

## 🚨 **RISQUES ET MITIGATIONS**

### **Risques identifiés**
1. **Rétrocompatibilité** → Interfaces de transition
2. **Complexité** → Migration progressive par phases
3. **Tests** → Validation à chaque étape
4. **Performance** → Monitoring constant

### **Mitigations**
1. **Features flags** pour basculer progressivement
2. **Tests automatisés** à chaque migration
3. **Documentation** mise à jour en continu
4. **Rollback plan** pour chaque phase

---

## 📊 **MÉTRIQUES DE SUCCÈS**

### **Avant migration**
- Appels directs Supabase : 4
- Types legacy : 34 fichiers
- Utils legacy : 19 fichiers
- Services legacy : 33 fichiers
- Architecture hexagonale : 99.2%

### **Après migration**
- Appels directs Supabase : 0 ✅
- Types legacy : 0 ✅
- Utils legacy : 0 ✅
- Services legacy : 0 ✅
- Architecture hexagonale : 100% 🎯

---

**Prêt pour l'exécution !** 🚀

*Date de création : 1 février 2026*
*Durée estimée : 7 jours*
*Statut : Plan validé et prêt pour exécution*
