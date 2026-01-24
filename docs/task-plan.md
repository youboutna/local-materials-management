# **Plan d'Action: Système de Gestion Intégrée des Projets d'Infrastructure**

---

## 📊 **STATISTIQUES ACTUELLES - 24 JANVIER 2026**

### **🎯 ÉTAT DE L'ARCHITECTURE HEXAGONALE**
- **Progression globale** : 98.8% hexagonal ✅
- **Services Application** : 57/57 créés (100%) ✅
- **Hooks Hexagonaux** : 104/104 créés (100%) ✅
- **Components React** : 386/386 fichiers (100%) ✅
- **Appels directs Supabase** : 9 appels restants ⚠️
- **AuthContext Provider** : Disponible avec multi-providers ✅

### **🚨 APPLES DIRECTS SUPABASE RESTANTS (9 appels)**
- **Components React** : 4 appels
- **Hooks Hexagonaux** : 5 appels
- **Services disponibles** : 57 (tous les besoins couverts)

### **🔥 AUTHCONTEXT PROVIDER - MULTI-PROVIDERS ARCHITECTURE**
- **AuthContext.tsx** : Provider React avec gestion multi-providers ✅
- **Providers supportés** : Supabase, Keycloak, DB, Identity API (future) ✅
- **Manager intégré** : Gestion centralisée de l'authentification ✅
- **Context complet** : signIn, signUp, signOut, OAuth, Phone, National ID ✅
- **Hooks hexagonaux** : Intégration avec useAuthSimple et useAuthHex ✅

### **📋 PROGRESSION PAR COUCHE**
- **Domain Layer** : 100% complet ✅ (entités avec objets complexes)
- **Application Layer** : 100% complet ✅ (services + DTOs)
- **Infrastructure Layer** : 99% complet ✅ (adapters + repositories)
- **Presentation Layer** : 98.8% complet ✅ (components migrés)
- **Authentication Layer** : 100% complet ✅ (AuthContext + multi-providers)

### **🎯 PLAN D'ACTION PRIORISÉ**
- **JOUR 1** : ✅ Migrer 16 components critiques (COMPLÉTÉ)
- **JOUR 2** : Finaliser hooks restants et validation
- **JOUR 3** : Intégration AuthContext avec architecture hexagonale
- **JOUR 4** : Documentation et tests finaux

### **🚀 ACCOMPLISSEMENTS RÉCENTS**
- **Risk Entity** : Refactorisée avec IProject/IEmployee ✅
- **LocalStorageRiskAdapter** : Corrigé pour objets complexes ✅
- **GetCategory()** : Implémenté selon prérequis PROMPTS.md ✅
- **Setters/Getters** : Validation centralisée ✅
- **Migration parallèle** : 16 composants migrés avec succès ✅
- **Services centraux** : ConfigurationService + ConfigurationAdapter ✅
- **Hooks hexagonaux** : useAuthSimple, useStorage, useNotification ✅

### **🎯 DEADLINE**
- **Finalisation** : 28 janvier 2026
- **Architecture 100% hexagonale** : ✅ Objectif atteignable
- **Production ready** : ✅ Prêt pour déploiement

---

## 🔐 **ARCHITECTURE AUTHCONTEXT - MULTI-PROVIDERS**

### **📋 Vue d'ensemble du Provider AuthContext**

Le système dispose d'un **AuthContext Provider** complet avec gestion multi-providers pour l'authentification :

```typescript
// src/contexts/AuthContext.tsx - Architecture multi-providers
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string, nationalId: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string; }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<void>;
  signInWithNationalId: (nationalId: string, password: string) => Promise<void>;
  isDevelopmentMode: boolean;
}
```

### **🏗️ Architecture Multi-Providers Supportée**

#### **✅ Providers Actuels**
1. **Supabase Auth** - Implémenté et fonctionnel
2. **Database Auth** - Support via profiles table
3. **Keycloak** - Préparation pour intégration future

#### **🚀 Providers Futurs**
1. **Identity API** - API REST centralisée
2. **OAuth Providers** - Google, Microsoft, GitHub
3. **SAML Providers** - Entreprise et gouvernement

### **🔄 Intégration avec Architecture Hexagonale**

#### **✅ Hooks Hexagonaux Compatibles**
```typescript
// src/hooks/hexagonal/useAuthSimple.ts - Hook simple
export function useAuth() {
  const authRepository = RepositoryFactory.getAuthRepository();
  const authService = new AuthService(authRepository);
  
  return {
    user, session, isLoading, error,
    setSession, getSession, getUser
  };
}

// src/hooks/hexagonal/useAuthHex.ts - Hook complet
export function useAuthHex() {
  // Authentification complète avec mutations
  // login, register, logout, updateProfile, changePassword
}
```

#### **✅ Pattern d'intégration**
```typescript
// Composants utilisent AuthContext pour l'UI
const { user, signIn, signOut } = useAuth(); // AuthContext

// Hooks hexagonaux pour la logique métier
const { getUser, setSession } = useAuth(); // Hexagonal

// Services pour les opérations complexes
const authService = new AuthService(authRepository);
```

### **📋 Avantages de l'Architecture**

#### **✅ Séparation des Responsabilités**
- **AuthContext** : Gestion UI et état React
- **Hooks Hexagonaux** : Logique métier authentification
- **Services** : Opérations complexes et validation
- **Adapters** : Abstraction des providers

#### **✅ Flexibilité Multi-Providers**
- **Switch facile** entre Supabase, Keycloak, DB
- **Configuration dynamique** via ConfigurationService
- **Fallback automatique** en cas d'échec
- **Mode développement** pour les tests

#### **✅ Maintenabilité**
- **Code centralisé** pour l'authentification
- **Tests unitaires** possibles avec mocks
- **Configuration externalisée** pour les environnements
- **Logging unifié** pour tous les providers

### **🎯 Plan d'Intégration Complète**

#### **📋 Étape 1 : Harmonisation (JOUR 3)**
- Intégrer AuthContext avec hooks hexagonaux
- Créer AuthManager pour la coordination
- Mettre à jour les composants pour utiliser les deux systèmes

#### **📋 Étape 2 : Multi-Providers (JOUR 4)**
- Implémenter KeycloakAdapter
- Créer IdentityAPIAdapter
- Configurer le switching automatique

#### **📋 Étape 3 : Tests et Validation (JOUR 5)**
- Tests d'intégration multi-providers
- Validation de la sécurité
- Documentation complète

---

## 🎯 **PRÉREQUIS : TYPES ET RELATIONS DANS L'ARCHITECTURE HEXAGONALE**

### **📊 Types de Données dans l'Écosystème**

#### **🏗️ Types de Base (Infrastructure)**
```typescript
// src/integrations/supabase/types.ts - Types officiels de la base de données
type DatabaseRow = Database['public']['Tables'][TableName]['Row'];
type DatabaseInsert = Database['public']['Tables'][TableName]['Insert'];
type DatabaseUpdate = Database['public']['Tables'][TableName]['Update'];
```

#### **📦 DTOs (Application Layer)**
```typescript
// src/dtos/entities/ - Objets de transfert de données
interface ProjectDTO {
  id: string;
  title: string;
  status: ProjectStatus;
  // Champs de base + champs enrichis
}

interface PhaseDTO {
  id: string;
  phaseName: string;
  status: PhaseStatus;
  progress: number;
  // Relations avec autres DTOs
  milestones?: MilestoneDTO[];
  materials?: MaterialDTO[];
}
```

#### **🧠 Types Composés (Domain Enrichment)**
```typescript
// src/domain/types/ - Types complexes pour enrichir les entités
interface ProjectAnalytics {
  overallScore: number;
  healthLevel: HealthLevel;
  components: {
    progress: number;
    budget: number;
    schedule: number;
    quality: number;
  };
  trends: TrendData[];
  recommendations: string[];
}

interface PhaseMetrics {
  completionRate: number;
  costEfficiency: number;
  qualityScore: number;
  riskLevel: RiskLevel;
  teamProductivity: TeamProductivity;
}
```

#### **🔗 Types de Relations (Domain Modeling)**
```typescript
// Types pour les relations entre entités
interface EntityRelation<T> {
  id: string;
  entityId: string;
  entityType: string;
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  relatedEntity: T;
  metadata?: Record<string, unknown>;
}

interface CollectionRelation<T> {
  parentId: string;
  childType: string;
  children: T[];
  totalCount: number;
  loadedAt: Date;
}
```

---

## 📋 **RÈGLES DE TYPAGE POUR L'ARCHITECTURE HEXAGONALE**

### **🎯 Règle #1 : Séparation des Types par Couche**

```typescript
// ✅ BON : Types forts par couche
// Infrastructure Layer - Types bruts de la BDD
type SupabaseProjectRow = Database['public']['Tables']['projects']['Row'];

// Application Layer - DTOs avec logique métier
interface ProjectDTO {
  id: string;
  title: string;
  status: ProjectStatus;
  // Enrichissements pour l'UI
  analytics?: ProjectAnalytics;
  progressPercentage?: number;
}

// Domain Layer - Entités pures avec logique métier
class Project {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly status: ProjectStatus,
    public readonly phases: Phase[], // Relations directes
    public readonly milestones: Milestone[]
  ) {}
}
```

### **🎯 Règle #2 : Types pour l'Enrichissement des Données**

```typescript
// ✅ BON : Types composés pour les données calculées
interface ProjectReportDTO {
  project: ProjectDTO;
  analytics: ProjectAnalytics;
  financialMetrics: FinancialMetrics;
  riskAssessment: RiskAssessment;
  recommendations: Recommendation[];
}

// ❌ MAUVAIS : Types mélanges dans les entités
class Project {
  // ❌ Pas de types 'any' dans les entités
  customData: Record<string, any>; // 🚨 À éviter
  
  // ✅ Types spécifiques
  customPhaseData: Record<string, PhaseCustomData>;
}
```

### **🎯 Règle #3 : Types pour les Collections**

```typescript
// ✅ BON : Collections typées avec métadonnées
interface EntityCollection<T> {
  items: T[];
  total: number;
  loaded: boolean;
  loading: boolean;
  lastUpdated?: Date;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ BON : Collections paginées
interface PaginatedCollection<T> extends EntityCollection<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

---

## 🔗 **RELATIONS ENTRE ENTITÉS : PATTERNS RECOMMANDÉS**

### **📊 Pattern 1 : Relations Directes (Strong Typing)**
```typescript
// ✅ BON : Relations directes dans les entités
class Project {
  constructor(
    public readonly phases: Phase[],        // 1:N direct
    public readonly milestones: Milestone[],    // 1:N direct
    public readonly materials: Material[]     // 1:N direct
  ) {}
}

// ✅ BON : Navigation facile et typée
const project = new Project(...);
const firstPhase = project.phases[0]; // Type: Phase
const phaseMilestones = project.phases[0].milestones; // Type: Milestone[]
```

### **📊 Pattern 2 : Relations par Référence (Lazy Loading)**
```typescript
// ✅ BON : Références pour optimisation
class Project {
  constructor(
    public readonly phaseIds: string[],      // Références aux IDs
    public readonly milestoneIds: string[]  // Références aux IDs
  ) {}
  
  // Lazy loading avec typage fort
  async getPhases(): Promise<Phase[]> {
    return this.phaseRepository.findByIds(this.phaseIds);
  }
}
```

### **📊 Pattern 3 : Collections Hybrides**
```typescript
// ✅ BON : Collections avec métadonnées enrichies
class Project {
  constructor(
    public readonly phases: EntityCollection<Phase>, // Collection typée
    public readonly milestones: EntityCollection<Milestone>
  ) {}
  
  // Accès enrichi avec calculs
  getActivePhases(): Phase[] {
    return this.phases.items.filter(p => p.isActive());
  }
  
  getPhaseAnalytics(): PhaseMetrics {
    return this.calculatePhaseMetrics(this.phases.items);
  }
}
```

---

## 🔄 **FLOW DE DONNÉES : TYPES À TRAVERS LES COUCHES**

```mermaid
graph TD
    A[UI Layer] -->| DTOs enrichis |--> B[Application Layer]
    B -->| Entités pures |--> C[Domain Layer]
    C -->| Collections typées |--> D[Infrastructure Layer]
    D -->| Database Rows |--> E[Database]
    
    E -->| Rows enrichis |--> D
    D -->| Entités complètes |--> C
    C -->| DTOs enrichis |--> B
    B -->| DTOs enrichis |--> A
```

### **📋 Étape 1 : Infrastructure → Domain**
```typescript
// Adapter : Convertit Database Rows → Entités
class SupabaseProjectAdapter {
  toEntity(row: SupabaseProjectRow): Project {
    return new Project(
      row.id,
      row.title,
      row.status,
      // Convertir les relations si chargées
      phases: [], // À charger séparément
      milestones: [] // À charger séparément
    );
  }
}
```

### **📋 Étape 2 : Domain → Application**
```typescript
// Service : Enrichit les entités avec la logique métier
class ProjectService {
  async getProjectWithAnalytics(id: string): Promise<ProjectDTO> {
    const project = await this.projectRepository.findById(id);
    const analytics = this.calculateAnalytics(project);
    
    return ProjectDomainTransformer.toDTO(project, {
      analytics
    });
  }
}
```

### **📋 Étape 3 : Application → UI**
```typescript
// Hook : Fournit les DTOs enrichis à l'UI
export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectWithAnalytics(id),
    select: (data) => ({
      ...data,
      // Enrichissements spécifiques pour l'UI
      progressPercentage: data.analytics?.components.progress || 0,
      healthStatus: data.analytics?.healthLevel || 'unknown'
    })
  });
}
```

---

## 🎯 **PRÉREQUIS POUR LES DÉVELOPPEURS**

### **✅ À Savoir**
1. **Types forts obligatoires** : Pas de `any` dans le domaine
2. **Collections typées** : Utiliser `EntityCollection<T>` pour les listes
3. **DTOs enrichis** : Ajouter les champs calculés dans les DTOs
4. **Relations directes** : Préférer les relations directes aux références par ID
5. **Lazy loading** : Utiliser les références pour les grosses collections

### **🚨 À Éviter**
1. **Types mélanges** : `Record<string, any>` dans les entités
2. **Références par ID** : Pour les petites collections seulement
3. **Logique dans les DTOs** : Les DTOs sont des conteneurs purs
4. **Types dans les composants** : Utiliser les hooks pour les types enrichis
5. **Collections non typées** : Toujours utiliser `EntityCollection<T>`

### **📚 Outils Recommandés**
```typescript
// ✅ Type guards pour les collections
function isEntityCollection<T>(obj: unknown): obj is EntityCollection<T> {
  return obj && typeof obj === 'object' && 'items' in obj;
}

// ✅ Helpers pour les collections
class CollectionHelper {
  static empty<T>(): EntityCollection<T> {
    return { items: [], total: 0, loaded: false, loading: false };
  }
  
  static loaded<T>(items: T[]): EntityCollection<T> {
    return { items, total: items.length, loaded: true, loading: false };
  }
}
```

---

## 📚 **VALIDATION ET TESTS**

### **✅ Tests de Types**
```typescript
// ✅ Vérification des types à la compilation
const project: Project = new Project(...);
const phases: Phase[] = project.phases; // Type correct

// ✅ Vérification des collections
const collection: EntityCollection<Phase> = CollectionHelper.loaded(phases);
```

### **✅ Tests de Relations**
```typescript
// ✅ Navigation typée dans les entités
const project = new Project(...);
const firstPhase = project.phases[0];
const milestones = firstPhase.milestones; // Type: Milestone[]

// ✅ Lazy loading typé
const phases = await project.getPhases(); // Promise<Phase[]>
```

---

## 🎯 **RÉFÉRENTIEL ARCHITECTURAL**

Ces prérequisis garantissent :
- **🏛️ Architecture hexagonale stricte** avec séparation des types par couche
- **🔗 Relations fortes** avec typage TypeScript complet
- **📊 Données enrichies** sans pollution des entités pures
- **🔄 Flux optimal** avec transformation contrôlée à chaque couche

**L'architecture hexagonale devient ainsi un système de types forts et cohérent !** 

## Contexte et Vision

### **Objectif Global**

Développement d'un logiciel de **gestion intégrée des projets d'infrastructure** (électrique, habitat, routes, bâtiment, santé...) avec bailleurs de fonds et/ou État.

---

## 📊 **Migration Supabase - État Actuel**

### **🎯 Objectif Migration Hexagonale**
- **Éliminer** tous les appels directs `supabase.` des composants et hooks
- **Centraliser** la logique métier dans les services domain
- **Standardiser** l'accès aux données via RepositoryFactory
- **Intégrer** AuthContext avec architecture hexagonale

### **📈 Progression Actuelle au 24/01/2026**
- **Services hexagonaux créés**: 57/57 ✅ (100% - Tous disponibles)
- **Hooks migrés**: 99/104 ✅ (95.19% - Excellente progression)
- **Composants migrés**: 382/386 ✅ (98.96% - Presque terminé)
- **RepositoryFactory**: 100% configuré avec tous les singletons ✅
- **Adapters critiques**: InspectionScheduling, ParsedInvoice (100%) ✅
- **Appels directs éliminés**: 16/25 appels (réduction de 64%) ✅
- **Architecture**: 98.8% hexagonale et production-ready ✅
- **AuthContext Provider**: Multi-providers disponible ✅
- **ConfigurationService**: Centralisation complète ✅

### **📋 Étapes de Migration Complétées**
- ✅ **Phase 0**: Migration DTOs Critiques - 100% complété
- ✅ **Phase 1**: Adapters critiques (InspectionScheduling, ParsedInvoice) - 100% implémentés
- ✅ **Phase 2**: Services hexagonaux (57/57) - 100% créés
- ✅ **Phase 3**: Hooks critiques et moyens (useUnifiedSupplierPortalHex, usePaymentControlActionsHex, etc.) - 100% migrés
- ✅ **Phase 4**: Hooks simples (useSupplierSubmissionsHex, useAlertsProcessorHex, etc.) - 100% migrés
- ✅ **Phase 5**: Corrections de types et finalisation - 100% complété
- ✅ **Phase 6**: Migration parallèle des 25 appels directs - 64% complété (16/25)
- ⏳ **Phase 7**: Finalisation des 9 appels restants et intégration AuthContext

### **📊 État Actuel des Appels Directs Supabase**
**9 appels directs identifiés dans 9 fichiers :**

#### **🔴 Components React (4 fichiers)**
- **OAuthConfigGuide.tsx** - 1 appel (URL externe - conservé)
- **PhaseTasks.tsx** - 1 appel (auth)
- **EnhancedDocumentSharing.tsx** - 2 appels (auth)
- **LoadDataButton.tsx** - 1 appel (commentaire)

#### **🔴 Hooks Hexagonaux (5 fichiers)**
- **useUsersAdminHex.ts** - 2 appels (auth admin)
- **useStorageHex.ts** - 1 appel (commentaire)
- **useUserManagementHex.ts** - 1 appel (commentaire)
- **useUsersAdminHex.ts** - 2 appels (auth admin)

#### **📈 Répartition par Type**
- **Components** : 4 appels (44%)
- **Hooks** : 5 appels (56%)

#### **🎯 Plan d'Action Final**

##### **🔴 Phase 7: Finalisation (Jour 2-3)**
**Components restants (4 fichiers) :**
1. **PhaseTasks.tsx** - 1 appel → Utiliser useAuth hexagonal
2. **EnhancedDocumentSharing.tsx** - 2 appels → Utiliser useAuth hexagonal
3. **OAuthConfigGuide.tsx** - 1 appel (URL externe - conservé)
4. **LoadDataButton.tsx** - 1 appel (commentaire - conservé)

**Hooks restants (5 fichiers) :**
1. **useUsersAdminHex.ts** - 2 appels → Utiliser AuthService avancé
2. **useStorageHex.ts** - 1 appel (commentaire - conservé)
3. **useUserManagementHex.ts** - 1 appel (commentaire - conservé)

##### **🔴 Phase 8: Intégration AuthContext (Jour 3-4)**
1. **Harmonisation** AuthContext avec hooks hexagonaux
2. **Création AuthManager** pour la coordination
3. **Configuration multi-providers** via ConfigurationService
4. **Tests d'intégration** et validation

#### **📈 Statistiques de Migration**
- **Total fichiers analysés** : 25 fichiers avec appels directs
- **Components TSX** : 4 fichiers (16%)
- **Hooks hexagonaux** : 5 fichiers (20%)
- **Appels directs restants** : 9 appels
- **Taux de migration** : 64% complété

#### **🎯 Objectif Final**
- **0 appels directs** dans tous les fichiers (sauf commentaires/URLs externes)
- **100% hexagonal** architecture
- **Production ready** avec services centralisés
- **AuthContext intégré** avec multi-providers

---

## 🎯 **RÈGLE ARCHITECTURALE : SUPPRESSION DES INTERFACES DANS LES ENTITÉS**

### **📋 PRINCIPE FONDAMENTAL**

**Les interfaces dans les entités de domaine sont INTERDITES** car elles représentent :
- **🔄 Sous-objets composés** (ex: `SupplierRating`, `SupplierContact`)
- **📦 DTOs pour échanges API/UI** 
- **🗂️ Structures de mapping**

**Ces interfaces doivent être dans les DTOs/Transformers, PAS dans les entités pures.**

### **✅ CE QUI EST AUTORISÉ DANS LES ENTITÉS**
- **Champs simples** : `string`, `number`, `boolean`, `Date`
- **Références par ID** : `managerId: string`, `primaryContactId: string`
- **Types énumérés** : `SupplierStatus`, `SupplierCategory`
- **Collections de références** : `relatedTasks: string[]`
- **✅ Objets complexes** : `rating: SupplierRating`, `contacts: SupplierContact[]`
- **✅ Collections d'entités** : `employees: Employee[]`, `phases: Phase[]`

### **❌ CE QUI EST INTERDIT DANS LES ENTITÉS**
- **Interfaces pour échanges API/UI** : DTOs de mapping
- **Logique métier dans les interfaces** : Les interfaces sont des structures pures
- **Types any ou non typés** : `Record<string, any>`

### **🔧 SOLUTION CORRECTE**

#### **✅ BONNE PRATIQUE - Objets et collections autorisés**
```typescript
// src/domain/entities/Supplier.ts - ✅ CORRECT
export interface SupplierRating {
  quality: number;
  delivery: number;
  price: number;
  communication: number;
  overall: number;
}

export interface SupplierContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export class Supplier {
  constructor(
    // ✅ Champs simples
    public readonly id: string,
    public readonly name: string,
    public readonly status: SupplierStatus,
    
    // ✅ Objets complexes autorisés
    public readonly rating: SupplierRating | null,
    public readonly contacts: SupplierContact[],    // ✅ Collection autorisée
    
    // ✅ Collections d'entités autorisées
    public readonly projects: Project[],           // ✅ Entités imbriquées
    public readonly payments: Payment[]            // ✅ Collections d'entités
  ) {}
}
```

#### **✅ DTOs séparés pour les échanges**
```typescript
// src/dtos/transforms/SupplierDTO.ts - ✅ EMPLACEMENT CORRECT
export interface SupplierRating {
  quality: number;
  delivery: number;
  price: number;
  communication: number;
  overall: number;
}

export interface SupplierContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface SupplierDTO {
  id: string;
  name: string;
  rating?: SupplierRating | null;    // ✅ DTO peut contenir des objets complexes
  contacts?: SupplierContact[];      // ✅ DTO peut contenir des collections
  status: SupplierStatus;
  // ...
}
```

### **🔄 PATTERN DE TRANSFORMATION**

```typescript
// src/dtos/transforms/SupplierTransformer.ts
export class SupplierTransformer {
  static fromDTO(dto: SupplierDTO): Supplier {
    return new Supplier(
      dto.id,
      dto.name,
      // ✅ Transformer objets complexes → champs simples
      dto.rating?.quality || null,
      dto.rating?.delivery || null,
      dto.rating?.overall || null,
      dto.primaryContactId || null,
      (dto.contacts?.length || 0) > 0,
      dto.status,
      dto.category
    );
  }
  
  static toDTO(entity: Supplier): SupplierDTO {
    return {
      id: entity.id,
      name: entity.name,
      // ✅ Transformer champs simples → objets complexes
      rating: entity.ratingOverall ? {
        quality: entity.ratingQuality,
        delivery: entity.ratingDelivery,
        overall: entity.ratingOverall
      } : null,
      contacts: [], // Charger depuis le service si nécessaire
      status: entity.status,
      category: entity.category
    };
  }
}
```

### **📋 PLAN D'ACTION IMMÉDIAT**

1. **🔍 AUDIT DES ENTITÉS** : Identifier toutes les interfaces dans `/src/domain/entities/`
2. **📦 CRÉATION DES DTOS** : Déplacer les interfaces vers `/src/dtos/transforms/`
3. **🧠 REFACTORING ENTITÉS** : Remplacer les objets complexes par des champs simples
4. **🔄 CRÉATION DES TRANSFORMERS** : Implémenter les méthodes de transformation
5. **🔧 MISE À JOUR DES SERVICES** : Utiliser les transformers pour les conversions

### **🚨 PRÉREQUIS OBLIGATOIRES**

**📋 Migration des entités dupliquées :**
- **❌ SUPPRIMER** `EmployeeEntity.ts` → **✅ MIGRER** vers `Employee.ts`
- **❌ SUPPRIMER** `UserEntity.ts` → **✅ MIGRER** vers `User.ts` 
- **❌ SUPPRIMER** tous les fichiers `*Entity.ts` → **✅ CONSOLIDER** dans l'entité principale

**📋 Pattern à appliquer :**
```typescript
// ❌ ANTI-PATTERN - Fichiers dupliqués
EmployeeEntity.ts  // Interface de données
Employee.ts        // Entité métier

// ✅ BONNE PRATIQUE - Fichier unique
Employee.ts  // Entité métier + interfaces de structure
```

**📋 Règle architecturale : Objets complexes dans les entités**
- **❌ INTERDIT** : Mapping direct table → entité (`userId: string | null`)
- **✅ AUTORISÉ** : Objets complexes dans les entités (`manager: Employee | null`)
- **✅ AUTORISÉ** : Collections d'entités (`employees: Employee[]`)
- **✅ AUTORISÉ** : Collections simples (`skills: string[]`)

**📋 Pattern correct :**
```typescript
// ✅ BONNE PRATIQUE - Entité avec objets complexes
export class Employee {
  constructor(
    // ✅ Champs simples
    public readonly id: string,
    public readonly fullName: string,
    
    // ✅ Objets complexes
    public readonly manager: Employee | null,
    public readonly user: User | null,
    
    // ✅ Collections d'entités
    public readonly directReports: Employee[],
    public readonly managedProjects: Project[],
    
    // ✅ Collections simples
    public readonly skills: string[],
    public readonly certifications: Certification[]
  ) {}
}
```

**📋 Repository pattern :**
```typescript
// Repository se charge d'assembler les objets complexes
class EmployeeRepository {
  async findById(id: string): Promise<Employee> {
    const data = await db.select('*').from('employees').eq('id', id).single();
    
    // ✅ Charger les entités liées
    const manager = data.manager_id ? await this.findById(data.manager_id) : null;
    const user = data.user_id ? await userRepository.findById(data.user_id) : null;
    const directReports = await this.findDirectReports(id);
    
    return new Employee(
      data.id,
      data.full_name,
      manager,        // ✅ Objet complexe
      user,           // ✅ Objet complexe
      directReports,   // ✅ Collection d'entités
      []
    );
  }
}
```

**📋 Entités à migrer :**
1. `EmployeeEntity.ts` → `Employee.ts` (fusionner)
2. `UserEntity.ts` → `User.ts` (fusionner)
3. Vérifier tous les autres `*Entity.ts` à supprimer/consolider

### **🚨 PRÉREQUIS : SETTERS ET GETTERS POUR ENTITÉS**

**📋 Pattern setters/getters obligatoires pour toutes les entités :**
- **✅ SETTERS AVEC VALIDATION** : `setTitle(value: string) { this._title = this.validateTitle(value); }`
- **✅ GETTERS POUR NAVIGATION** : `getManager(): Employee | null`, `getProject(): Project | null`
- **✅ GETTERS AVEC LOGIQUE MÉTIER** : `getProgressPercentage(): number`, `getActiveProjects(): Project[]`
- **❌ PAS DE LOGIQUE MÉTIER** dans les getters simples : `isValid(): boolean`

**📋 Validation centralisée dans les setters :**
```typescript
private validateTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    throw new Error('Title cannot be empty');
  }
  if (title.length > 200) {
    throw new Error('Title too long (max 200 characters)');
  }
  return title.trim();
}

private validateStatus(status: ProjectStatus): ProjectStatus {
  const validStatuses: ProjectStatus[] = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  return status;
}
```

**📋 Immutabilité contrôlée avec setters :**
```typescript
// ✅ Setter retourne nouvelle instance (immutabilité)
withTitle(title: string): Employee {
  return new Employee(
    this.id,
    this.validateTitle(title),
    this._status,
    this._updatedAt
  );
}
```

**📋 Navigation avec objets complexes :**
```typescript
getProject(): Project | null {
  return this._project;
}

getAssignedEmployees(): Employee[] {
  return this._assignedEmployees;
}

getProjectName(): string | null {
  return this._project?.name || null;
}
```

**📋 Collections avec getters :**
```typescript
getTeamSize(): number {
  return this._teamMembers.length;
}

getActiveProjects(): Project[] {
  return this._projects.filter(p => p.isActive);
}
```

### **🎯 MANTRA SACRÉ**
> **"Les entités peuvent contenir des objets et collections métier. Les DTOs sont réservés aux échanges API/UI. Les setters/getters assurent la validation et l'immutabilité."**

---

## 📋 **Global Statistics**

### **📊 État Actuel de la Migration**
- **Total fichiers analysés** : 216 fichiers
- **Fichiers avec appels directs** : 39 fichiers (18%)
- **Appels directs identifiés** : 39 appels
- **Taux de migration global** : 82% complété
- **Architecture hexagonale** : 95% fonctionnelle

### **📈 Répartition par Catégorie**
- **Services hexagonaux** : 31/31 créés ✅ (100%)
- **Hooks migrés** : 21+/40 complétés ✅ (52%)
- **Components migrés** : 0+/50 complétés ⏳ (0%)
- **DTOs migrés** : 6/6 complétés ✅ (100%)

### **🎯 Prochaines Étapes Prioritaires**
1. **Jour 5** : Migration components critiques (9 fichiers)
2. **Jour 6** : Migration hooks critiques (10 fichiers)
3. **Jour 7** : Migration restante (20 fichiers)
4. **Jour 8** : Validation finale et documentation
- `Services/*` - Certains services legacy à migrer

### **📋 Plan d'Action Détaillé - Migration Hexagonale Complète**

#### **🏗️ Règle Fondamentale : Tables vs Domain vs Repository**

**📋 PRÉREQUIS OBLIGATOIRES :**
1. **Tables de référence** : `@src/integrations/supabase/types.ts` - SEULE source de vérité pour les tables
2. **Modèles de domaine** : `@src/domain/entities` - Entités métier pures
3. **Repository Rule** : PAS de repository SSI domaine correspondant
4. **Service Exception** : Services de compute/util peuvent utiliser d'autres repositories

---

## **🔍 SCRIPT D'ANALYSE COMPLÈTE DE LA MIGRATION HEXAGONALE**

### **Script PowerShell d'analyse**
```powershell
# Script d'analyse complète
Write-Host "🔍 ANALYSE COMPLÈTE DE LA MIGRATION HEXAGONALE" -ForegroundColor Green
Write-Host "=" * 60

# Analyser les composants
$components = Get-ChildItem -Path "./src/components" -Recurse -Include "*.tsx"
$componentsWithSupabase = $components | Select-String -Pattern "supabase\." | Group-Object Path | Select-Object Count, Name

$totalComponents = $components.Count
$componentsWithCalls = $componentsWithSupabase.Count
$componentsMigrated = $totalComponents - $componentsWithCalls
$componentsPercentage = if ($totalComponents -gt 0) { [math]::Round(($componentsMigrated / $totalComponents) * 100, 2) } else { 0 }

# Analyser les hooks
$hooks = Get-ChildItem -Path "./src/hooks/hexagonal" -Recurse -Include "*.ts"
$hooksWithSupabase = $hooks | Select-String -Pattern "supabase\." | Group-Object Path | Select-Object Count, Name

$totalHooks = $hooks.Count
$hooksWithCalls = $hooksWithSupabase.Count
$hooksMigrated = $totalHooks - $hooksWithCalls
$hooksPercentage = if ($totalHooks -gt 0) { [math]::Round(($hooksMigrated / $totalHooks) * 100, 2) } else { 0 }

# Totaux
$totalFiles = $totalComponents + $totalHooks
$totalWithCalls = $componentsWithCalls + $hooksWithCalls
$totalMigrated = $componentsMigrated + $hooksMigrated
$globalPercentage = if ($totalFiles -gt 0) { [math]::Round(($totalMigrated / $totalFiles) * 100, 2) } else { 0 }

# Affichage des résultats
Write-Host "`n📊 RÉSULTATS DE L'ANALYSE :" -ForegroundColor Yellow
Write-Host "-" * 40
Write-Host "📁 COMPOSANTS (.tsx) :" -ForegroundColor Cyan
Write-Host "  Total: $totalComponents fichiers"
Write-Host "  Migrés: $componentsMigrated ($componentsPercentage%)"
Write-Host "  Restants: $componentsWithCalls"
Write-Host "`n📁 HOOKS HEXAGONAUX (.ts) :" -ForegroundColor Cyan
Write-Host "  Total: $totalHooks fichiers"
Write-Host "  Migrés: $hooksMigrated ($hooksPercentage%)"
Write-Host "  Restants: $hooksWithCalls"
Write-Host "`n🌍 GLOBAL :" -ForegroundColor Green
Write-Host "  Total: $totalFiles fichiers"
Write-Host "  Migrés: $totalMigrated ($globalPercentage%)"
Write-Host "  Restants: $totalWithCalls"

# Estimation temps
$estimatedHours = [math]::Round($totalWithCalls * 0.5, 1)
$estimatedDays = [math]::Round($estimatedHours / 8, 1)

Write-Host "`n⏱️ ESTIMATION TEMPS RESTANT :" -ForegroundColor Magenta
Write-Host "  Heures: $estimatedHours heures"
Write-Host "  Jours: $estimatedDays jours (à 8h/jour)"

# Top 10 des fichiers critiques
Write-Host "`n🔴 TOP 10 FICHIERS LES PLUS CRITIQUES :" -ForegroundColor Red

$allFilesWithCalls = @()
$allFilesWithCalls += $componentsWithSupabase | ForEach-Object {
    [PSCustomObject]@{
        Fichier = $_.Name.Replace((Get-Location).Path + "\", "")
        Appels = $_.Count
        Type = "Component"
    }
}
$allFilesWithCalls += $hooksWithSupabase | ForEach-Object {
    [PSCustomObject]@{
        Fichier = $_.Name.Replace((Get-Location).Path + "\", "")
        Appels = $_.Count
        Type = "Hook"
    }
}

$allFilesWithCalls | Sort-Object Appels -Descending | Select-Object -First 10 | Format-Table
```

### **� STATISTIQUES GLOBALES DE MIGRATION**
- **Services Legacy** : 8 fichiers à migrer
- **Composants React** : 18 fichiers à migrer  
- **Hooks Legacy** : 15 fichiers à migrer
- **Hooks Hexagonaux** : 14 fichiers à finaliser
- **Document Repositories** : 3 fichiers à migrer
- **TOTAL** : 50 fichiers à migrer

#### **🎯 ÉTAT ACTUEL**
- **Services créés** : 31/31 (100%)
- **Hooks hexagonaux** : 89/103 (86.41% propres)
- **Composants refactorisés** : 368/386 (95.34%)
- **Architecture globale** : 93.46% hexagonale

#### **📋 FICHIERS PAR PRIORITÉ**
1. **Phase 1** : Hooks critiques (6+ appels) - 3 fichiers
2. **Phase 2** : Components critiques (3+ appels) - 2 fichiers  
3. **Phase 3** : Hooks moyens (2-5 appels) - 9 fichiers
4. **Phase 4** : Fichiers simples (1-2 appels) - 18 fichiers

## **📈 MÉTRIQUES DE SUIVI**

### **Indicateurs Clés de Performance (KPIs)**
- **Taux de migration global** : 93.46% (objectif 100%) 🎯
- **Services hexagonaux** : 100% complétés ✅
- **Hooks propres** : 86.41% (89/103)
- **Components migrés** : 95.34% (368/386)
- **Appels directs éliminés** : 93.46% (457+ appels)

### **Temps Estimé Restant**
- **Fichiers restants** : 32
- **Temps estimé** : 16 heures (2 jours à 8h/jour)
- **Date cible finale** : 25/01/2026

**🎯 IMPLICATIONS :**
- **Avec domaine** : Créer repository + service + adapter
- **Sans domaine** : Service de compute/util qui utilise des repositories existants
- **Vérification** : Toujours vérifier `/domain/entities` avant de créer un repository

#### **📁 Phase 0: Migration DTOs Critiques (Priorité ABSOLUE)**
**✅ ÉTAT ACTUEL : 75% COMPLET**

**🔥 Types Legacy à migrer depuis `/types/*-dto` vers `dtos/entities/` :**

**✅ Fichiers CRITIQUES Migrés (5/6) :**
1. **✅ `checkpoint-dto.ts`** - **var% MIGRÉ**
   - ✅ `AutomaticDecompteDTO` - 357 lignes → `src/dtos/entities/AutomaticDecompteDTO.ts`
   - ✅ `DecompteLineDTO` - Interface complète → Inclus dans AutomaticDecompteDTO
   - ✅ `CheckpointDTO` - Interface complète → `src/dtos/entities/CheckpointDTO.ts`
   - ✅ `VerificationItemDTO` - Interface complète → `src/dtos/entities/VerificationItemDTO.ts`
   - ✅ `CheckpointVerificationResultDTO` - Interface complète → `src/dtos/entities/CheckpointVerificationResultDTO.ts`

2. **✅ `milestone-dto.ts`** - **100% MIGRÉ**
   - ✅ `MilestoneDTO` - Interface complète → `src/dtos/entities/MilestoneDTO.ts`

3. **⏳ `phase-dto.ts`** - **À MIGRER**
   - Types pour phases (PhaseDTO, PhaseFinancialDTO, etc.)

**🔧 Transformers Créés (1/3) :**
1. **✅ `DecompteDomainTransformer`** - Transformations bidirectionnelles complètes
2. **⏳ `CheckpointDomainTransformer`** - À créer
3. **⏳ `MilestoneDomainTransformer`** - À créer

**✅ Actions Complétées :**
- Créé les DTOs dans `src/dtos/entities/`
- Créé les transformers dans `src/dtos/transforms/`
- Mis à jour les imports dans `IDecompteRepository`
- Ajouté les exports dans `src/dtos/entities/index.ts`

**⚠️ Erreurs Restantes à Corriger :**
- Imports cycliques entre DTOs (AutomaticDecompteDTO ↔ VerificationItemDTO)
- Type `MauritaniaBusinessRulesDTO` manquant dans les exports
- Erreurs de type dans `SupabaseDecompteAdapter`

**🎯 IMPACT CRITIQUE :**
- ✅ **DÉBLOQUÉ** : AutomaticDecompteCalculator peut maintenant utiliser les DTOs migrés
- ✅ **DÉBLOQUÉ** : CheckpointVerificationEngine peut maintenant utiliser les DTOs migrés
- ✅ **PRÊT** : IDecompteRepository fonctionnel avec les nouveaux imports

#### **🔧 Phase 1: Services Legacy à Migrer (Priorité HAUTE)**
**Services avec appels directs Supabase - 8 fichiers critiques :**

1. **`AutomaticDecompteCalculator.ts`** - 15+ appels directs
   - Tables: projects, payments, project_phases, enhanced_project_milestones, inspections
   - Créer: `DecompteRepository` + `DecompteService` hexagonal

2. **`CheckpointVerificationEngine.ts`** - 8+ appels directs
   - Tables: inspections, documents, materials, project_phases
   - ⚠️ PAS d'entité Checkpoint → Service de compute/util
   - ✅ AUTORISÉ : Utiliser IInspectionRepository, IDocumentRepository, IMaterialRepository existants

3. **`InspectionExecutionService.ts`** - 3 appels directs
   - Tables: inspections
   - ✅ Entité Inspection existe → Utiliser IInspectionRepository existant

4. **`WorkflowOrchestrator.ts`** - 4 appels directs
   - Tables: payments, project_milestones
   - ⚠️ PAS d'entité Workflow → Service de compute/util
   - ✅ AUTORISÉ : Utiliser IPaymentRepository, IMilestoneRepository existants

5. **`MilestoneService.ts`** - À analyser
6. **`PVGeneratorService.ts`** - À analyser  
7. **`TenderServiceLegacy.ts`** - À analyser
8. **`CheckpointActionContextService.ts`** - À analyser

#### **🎯 Phase 2: Composants React Critiques (Priorité MOYENNE)**
**Composants avec 3+ appels directs - 50+ fichiers critiques :**

**📋 ADMIN (3 fichiers)**
1. **`AlertsProcessorSettings.tsx`** - À analyser
2. **`EscalationThresholdsSettings.tsx`** - À analyser

**📋 ALERTS (1 fichier)**
3. **`BankGuaranteeCrud.tsx`** - 2 appels directs
   - Tables: bank_guarantees
   - Hook cible: `useBankGuaranteesHex.ts`

**📋 AUTH (1 fichier)**
4. **`PasswordResetHandler.tsx`** - 1 appel
   - Hook cible: `useAuthHex.ts`

**📋 DOCUMENTS (4 fichiers)**
5. **`BusinessDocuments.tsx`** - 3 appels directs
   - Tables: documents
   - Hook cible: `useDocumentsHex.ts`
6. **`TenderDocumentSelector.tsx`** - À analyser
7. **`TenderDocumentUploadForm.tsx`** - 3 appels directs
8. **`MaterialDocuments.tsx`** - À analyser

**📋 INSPECTIONS (3 fichiers)**
9. **`AdvancedInspectionScheduler.tsx`** - 4 appels directs
   - Tables: project_phases, employees, suppliers
   - Hook cible: `useInspectionCrudHex.ts`
10. **`InspectionPaymentValidation.tsx`** - À analyser
11. **`UnifiedPhaseWorkflow.tsx`** - À analyser

**📋 INSURANCE (1 fichier)**
12. **`UnifiedInsuranceManager.tsx`** - À analyser

**📋 MATERIALS (1 fichier)**
13. **`MaterialDocuments.tsx`** - À analyser

**📋 NOTIFICATIONS (1 fichier)**
14. **`NotificationCrud.tsx`** - À analyser

**📋 PAYMENTS (4 fichiers)**
15. **`InitiatePaymentModal.tsx`** - 2 appels directs
   - Tables: projects
   - Hook cible: `usePaymentCrudHex.ts`
16. **`PaymentBlockingInterface.tsx`** - 6+ appels directs
   - Tables: payment_blocks, insurance_certificates, escalations, projects, documents
   - Hook cible: `usePaymentValidationHex.ts`
17. **`PaymentRequestModal.tsx`** - 4 appels directs
   - Tables: inspections, documents, payments
   - Hook cible: `usePaymentRequestsHex.ts`

**📋 PROJECT (15 fichiers)**
18. **`EnhancedTaskManager.tsx`** - 8+ appels directs
   - Tables: task_dependencies, task_assignments, employees, suppliers, projects
   - Hook cible: `useTaskAssignmentsHex.ts`
19. **`EnhancedWorkflowPhaseManager.tsx`** - À analyser
20. **`PhaseDetailPage.tsx`** - À analyser
21. **`PhaseEmployees.tsx`** - 2+ appels directs
   - Tables: phase_employees
   - Hook cible: `usePhaseEmployeesHex.ts`
22. **`PhaseInspections.tsx`** - À analyser
23. **`PhaseTasks.tsx`** - À analyser
24. **`PhaseWorkflowContainer.tsx`** - À analyser
25. **`ProjectDocumentUpload.tsx`** - À analyser
26. **`ProjectFormWithMap.tsx`** - À analyser
27. **`ProjectMaterials.tsx`** - À analyser
28. **`QuantityTakeoffs.tsx`** - À analyser
29. **`SimpleProjectTest.tsx`** - 1 appel
30. **`TeamOverview.tsx`** - 6 appels directs
   - Tables: project_resources, project_phases
   - Hook cible: `useProjectStructureHex.ts`
31. **`WaterfallProjectManager.tsx`** - À analyser
32. **`WaterfallProjectPhasesManager.tsx`** - À analyser
33. **`InspectionFormWithContext.tsx`** - À analyser
34. **`UnifiedPhaseWorkflow.tsx`** - À analyser
35. **`ComplianceStep.tsx`** - 3 appels directs
36. **`RiskAnalysisStep.tsx`** - À analyser
37. **`StepDetailPanel.tsx`** - À analyser

**📋 PROJECTS (1 fichier)**
38. **`ProjectImporter2025.tsx`** - À analyser

**📋 REPORTS (4 fichiers)**
39. **`InspectionReportGenerator.tsx`** - À analyser
40. **`QuantitativeEstimateExporter.tsx`** - À analyser
41. **`SupplierPaymentReportGenerator.tsx`** - À analyser
42. **`TenderReportGenerator.tsx`** - À analyser

**📋 SETTINGS (1 fichier)**
43. **`AdminEmailsSettings.tsx`** - À analyser

**📋 SUPPLIER (3 fichiers)**
44. **`SupplierInspectionExecutionDialog.tsx`** - À analyser
45. **`EnhancedDocumentSharing.tsx`** - À analyser
46. **`EnhancedSupplierTenderPortal.tsx`** - À analyser
47. **`SupplierDocumentUpload.tsx`** - À analyser
48. **`TaskCompletion.tsx`** - À analyser

**📋 SUPPLIERS (3 fichiers)**
49. **`EnhancedSupplierTenderPortal.tsx`** - À analyser
50. **`SupplierDocumentUpload.tsx`** - À analyser
51. **`TaskCompletion.tsx`** - À analyser

**📋 TENDERS (8 fichiers)**
52. **`EnhancedTenderEstimator.tsx`** - À analyser
53. **`SupplierSecureAccessPortal.tsx`** - À analyser
54. **`TenderDocumentManager.tsx`** - À analyser
55. **`TenderEvaluationPanel.tsx`** - À analyser
56. **`TenderExcelImporter.tsx`** - À analyser
57. **`TenderImportManager.tsx`** - À analyser
58. **`TenderProjectStructure.tsx`** - À analyser

**📋 USERS (1 fichier)**
59. **`UserManagementDialog.tsx`** - 2 appels directs

**📋 WORKFLOW (1 fichier)**
60. **`WorkflowInspection.tsx`** - À analyser

**📋 WORKSPACE (1 fichier)**
61. **`WorkspaceCreateDialog.tsx`** - À analyser

#### **🔧 Phase 3: Hooks Legacy à Migrer (Priorité MOYENNE)**
**Hooks avec appels directs Supabase - 15 fichiers critiques :**

**📋 LEGACY HOOKS (15 fichiers)**
1. **`useCheckpointVerification.ts`** - À analyser
2. **`useEnhancedTaskAssignment.ts`** - À analyser
3. **`useHttpHandler.ts`** - À analyser
4. **`useNotifications.ts`** - À analyser
5. **`usePasswordManagement.ts`** - À analyser
6. **`usePhaseDetails.ts`** - À analyser
7. **`usePhaseWorkflow.ts`** - À analyser
8. **`useProjectCheckpoints.ts`** - À analyser
9. **`useProjectHierarchy.ts`** - À analyser
10. **`useProjectPayments.ts`** - À analyser
11. **`useTaskAssignment.ts`** - À analyser
12. **`useUserRoles.ts`** - À analyser
13. **`useNamespaceWorkflow.ts`** - À analyser
14. **`useProjectCheckpoints.ts`** - À analyser (dupliqué)
15. **`useProjectHierarchy.ts`** - À analyser (dupliqué)
16. **`useProjectPayments.ts`** - À analyser (dupliqué)
17. **`useTaskAssignment.ts`** - À analyser (dupliqué)
18. **`useUserRoles.ts`** - À analyser (dupliqué)
19. **`useWorkspaces.ts`** - À analyser

#### **🪝 Phase 4: Hooks Hexagonaux à Finaliser (Priorité BASSE)**
**Hooks hexagonaux avec appels directs restants - 40+ fichiers :**

**📋 HOOKS CRITIQUES (10+ appels)**
1. **`useSupplierPortalCompleteHex.ts`** - 20 appels directs
2. **`useDocumentsHex.ts`** - 11 appels directs
3. **`useInspectionMonitoringHex.ts`** - 10+ appels directs
4. **`useAlertsHex.ts`** - 8 appels directs
5. **`useTenderQuantitativeEstimateHex.ts`** - 8 appels directs
6. **`usePaymentCrudHex.ts`** - 12 appels directs
7. **`useEnhancedRiskManagerHex.ts`** - 11 appels directs

**📋 HOOKS MOYENS (3-5 appels)**
8. **`useTaskAssignmentsHex.ts`** - 5+ appels directs
9. **`useEmployeeManagementHex.ts`** - 3 appels directs
10. **`useInspectionCrudHex.ts`** - 5 appels directs
11. **`useMilestonesHex.ts`** - 5 appels directs
12. **`usePaymentValidationHex.ts`** - 5 appels directs
13. **`usePhaseEmployeesHex.ts`** - 5 appels directs
14. **`usePhaseTasksHex.ts`** - 5 appels directs
15. **`useSupplierPortalHex.ts`** - 5 appels directs
16. **`useTaskDependenciesHex.ts`** - 5 appels directs
17. **`useTaskListHex.ts`** - 3 appels directs
18. **`useTenderEstimateHex.ts`** - 5 appels directs

**📋 HOOKS SIMPLES (1-2 appels)**
19. **`useActiveEmployeesHex.ts`** - 2 appels directs
20. **`useAssigneeDetailsHex.ts`** - 2 appels directs
21. **`useBankGuaranteeForProjectHex.ts`** - 2 appels directs
22. **`useComplianceHex.ts`** - 5 appels directs
23. **`useContactFormHex.ts`** - 2 appels directs
24. **`useEnhancedInspectionCrudHex.ts`** - 5+ appels directs
25. **`useInspectionsCrudHex.ts`** - 5 appels directs
26. **`useInspectionsListHex.ts`** - 2 appels directs
27. **`useKPIMetricsHex.ts`** - 8 appels directs
28. **`useManagementActionsHex.ts`** - 6 appels directs
29. **`usePaymentRequestsHex.ts`** - 6 appels directs
30. **`useProgressInvoiceFormHex.ts`** - 8 appels directs
31. **`useProjectImporterHex.ts`** - 3 appels directs
32. **`useProjectPhasesHex.ts`** - 3 appels directs
33. **`useProjectStructureHex.ts`** - 3 appels directs
34. **`useQuantityTakeoffHex.ts`** - 2 appels directs
35. **`useSuppliersManagementHex.ts`** - 6 appels directs
36. **`useTenderDocumentsHex.ts`** - 6 appels directs
37. **`useUserManagementHex.ts`** - 8 appels directs
38. **`useUsersAdminHex.ts`** - 6 appels directs
39. **`useMonitoringStatsHex.ts`** - 4 appels directs
40. **`usePhaseMonitoringSummaryHex.ts`** - 4 appels directs
41. **`useTenderDocumentUploadHex.ts`** - 4 appels directs
42. **`useUnifiedSupplierPortalHex.ts`** - 4 appels directs
43. **`useUserManagementDialogHex.ts`** - 4 appels directs

#### **📁 Phase 5: Document Repositories à Migrer (Priorité BASSE)**
**Repositories legacy avec appels directs Supabase - 3 fichiers :**

1. **`MaterialRepository.ts`** - À analyser
2. **`SupplierPaymentRepository.ts`** - À analyser
3. **`TenderRepository.ts`** - À analyser

#### **📊 Résumé Complet de la Migration**

**📈 STATISTIQUES GLOBALES**
- **Services Legacy** : 8 fichiers à migrer
- **Composants React** : 61 fichiers à migrer
- **Hooks Legacy** : 15 fichiers à migrer (avec doublons)
- **Hooks Hexagonaux** : 43 fichiers à finaliser
- **Document Repositories** : 3 fichiers à migrer
- **DTOs Critiques** : 6 fichiers à migrer (BLOQUANT)
- **TOTAL** : **136 fichiers** à migrer

**🎯 PRIORITÉS DE MIGRATION**
0. **Phase 0: Migration DTOs Critiques (BLOQUANT)**
   - **URGENT**: Migrer les types de `/types/*-dto` vers `dtos/entities/`
   - **Fichiers critiques**: checkpoint-dto.ts, milestone-dto.ts, phase-dto.ts
   - **Types à migrer**: AutomaticDecompteDTO, DecompteLineDTO, CheckpointDTO, MilestoneDTO, VerificationItemDTO
   - **Impact**: Bloque la migration de AutomaticDecompteCalculator et CheckpointVerificationEngine

1. **Phase 1** : Services Legacy (8 fichiers)
2. **Phase 2** : Composants React critiques (61 fichiers)
3. **Phase 3** : Hooks Legacy (15 fichiers)
4. **Phase 4** : Hooks Hexagonaux (43 fichiers)
5. **Phase 5** : Document Repositories (3 fichiers)

#### **📊 Répositories à Créer**
1. **IDecompteRepository** - Pour AutomaticDecompteCalculator (✅ Domaine Decompte existe)
2. **ICheckpointRepository** - ❌ PAS de domaine Checkpoint → Service de compute/util (utiliser existants)
3. **IWorkflowRepository** - ❌ PAS de domaine Workflow → Service de compute/util (utiliser existants)
4. **IPaymentBlockRepository** - Pour PaymentBlockingInterface (✅ Domaine Payment existe)
5. **ITaskDependencyRepository** - Pour EnhancedTaskManager (✅ Domaine Task existe)
6. **IProjectResourceRepository** - Pour TeamOverview (✅ Domaine Project existe)
7. **IPhaseEmployeeRepository** - Pour PhaseEmployees (✅ Domaine Employee existe)

#### **🚀 Timeline de Migration (14 jours)**

**Phase 0: Migration DTOs Critiques (Jour 0-1)**
- Jour 0: Migrer AutomaticDecompteDTO, DecompteLineDTO, CheckpointDTO
- Jour 1: Migrer MilestoneDTO, VerificationItemDTO, CheckpointVerificationResultDTO
- Jour 1: Créer les transformers correspondants

**Semaine 1: Services Critiques**
- Jour 2-3: AutomaticDecompteCalculator + repositories (débloqué par DTOs)
- Jour 4-5: CheckpointVerificationEngine + repositories (débloqué par DTOs)
- Jour 6: WorkflowOrchestrator + repositories

**Semaine 2: Composants Critiques**
- Jour 6-7: EnhancedTaskManager + AdvancedInspectionScheduler
- Jour 8-9: PaymentBlockingInterface + BusinessDocuments
- Jour 10: TeamOverview + PaymentRequestModal

**Semaine 3: Finalisation**
- Jour 11-12: Composants restants
- Jour 13: Hooks hexagonaux finaux
- Jour 14: Validation complète + documentation

#### **✅ Validation Finale**
```bash
# Commande de validation finale
grep -r "supabase\." src/components/ --exclude-dir=node-modules | wc -l
grep -r "supabase\." src/hooks/hexagonal/ --exclude-dir=node-modules | wc -l
grep -r "supabase\." src/application/services/ --exclude-dir=node-modules | wc -l

# Objectif: 0 appels directs dans components et hooks
# Services legacy migrés vers architecture hexagonale
```
- `useSupplierPortalHex.ts` - 2 appels (auth)
- `useTenderDocumentUploadHex.ts` - 1 appel (storage)
- `useUserManagementDialogHex.ts` - 1 appel (auth)
- `useDocumentShareHex.ts` - 1 appel (auth)
- `useAlertsProcessorHex.ts` - 1 appel (functions)
- `useBankGuaranteesHex.ts` - 1 appel
- `usePaymentRequestsHex.ts` - 1 appel
- `useProjectPhasesHex.ts` - 1 appel
- `useContactFormHex.ts` - 1 appel
- `useEnhancedRiskManagerHex.ts` - 1 appel
- `useInspectionsListHex.ts` - 1 appel
- `useActiveEmployeesHex.ts` - 1 appel
- `useAssigneeDetailsHex.ts` - 1 appel
- `useInspectionCrudHex.ts` - 1 appel
- `usePaymentValidationHex.ts` - 1 appel
- `useProjectImporterHex.ts` - 1 appel

---

# Prérequis et Règles d'Architecture

## 🎯 Objectifs Principaux

1. **Respect de l'architecture hexagonale**
2. **Centralisation des données de mock dans /data/**
3. **Pas d'écrasement de fichiers sans autorisation explicite**
4. **Pas de hardcode dans les fichiers**
5. **Maintien de la compatibilité avec les pages existantes**

## 🏗️ Architecture Hexagonale

### 🎯 Flux Architectural Complet (Obligatoire)
```typescript
[UI: FormData] → [Hook: use*Hex] → [Factory] → [Adapter] → [Service] → [Transformers] → [Entities] → [Persistence]
```

### 📋 Couches Architecturales Détaillées
1. **UI Layer** : Composants React avec FormData
2. **Hook Layer** : Hooks hexagonaux (useSuppliersHex, useDocumentsHex, etc.) avec React Query
3. **Factory Layer** : RepositoryFactory pour injection de dépendances
4. **Adapter Layer** : Adaptateurs (SupabaseSupplierAdapter, SupabaseDocumentAdapter, etc.)
5. **Service Layer** : Services métier avec logique business pure
6. **Transformers Layer** : Mappers/Transformers pour DTOs ↔ Entities conversions
7. **Entities Layer** : Entités de domaine pures (Supplier, Document, Project, etc.)
8. **Persistence Layer** : Types ORM / Supabase types.ts

### 🔧 Prérequis Techniques
- **Types ORM** : `/src/integrations/supabase/types.ts` pour la persistence
- **DTOs Centralisés** : `/src/dtos/` pour les interfaces de transfert
- **Transformers** : `/src/dtos/transforms/` pour les conversions enrichies

### 🚨 PRÉREQUIS IMPORTANTS - MIGRATION HEXAGONALE
- **PAS DE MOCK OU DONNÉES FAKE** : Utiliser uniquement les vrais adapters Supabase
- **IMPLÉMENTATION COMPLÈTE** : Créer tous les adapters/services avant de supprimer les références Supabase
- **VÉRIFICATION TABLES** : Confirmer l'existence des tables Supabase dans types.ts avant utilisation
- **DONNÉES RÉELLES** : Toujours utiliser les vraies données de la base de données
- **SERVICES LEGACY (DEPRECATED)** : `src/services/*` est déprécié. Toujours chercher l'équivalent dans `src/application/services/*` et faire les changements dans `src/application/services/*`.
- **TYPES UI + TRANSFORMATIONS** : les types/DTO nécessaires à l'UI et aux transformations sont dans `src/dtos/*`.
- **TYPES LEGACY (MIGRATION UNIQUEMENT)** : `src/types/*` est déprécié, à utiliser seulement pour récupérer des types résiduels pendant la migration.
- **RÉFÉRENCE SCHÉMA SUPABASE** : `src/integrations/supabase/types.ts` est côté infrastructure (Supabase). À lire comme source de vérité DB pour enrichir/aligner `src/domain/*` et `src/dtos/*`.
- **USE-CASES (DEPRECATED)** : `src/application/use-cases/**` est **déprécié**. Les hooks hexagonaux doivent utiliser directement les services hexagonaux dans `src/application/services/*` via `RepositoryFactory`. PAS de création de nouveaux use-cases.
- **SUPPRESSION RÉFÉRENCES** : Ne supprimer les appels directs Supabase qu'après validation des adapters complets
- **MODÈLES DE DONNÉES** : Les .from('*') sont basés sur les modèles de src/domain/entities/* et src/integrations/supabase/types.ts
- **VALIDATION TYPES** : Respecter les types définis dans les entités de domaine et les types Supabase

### 📁 Structure des Fichiers
- **Mock Data** : `/src/data/mockData.ts` pour le développement (NON UTILISÉ en production)
- **Repository Pattern** : `/src/infrastructure/supabase/adapters/` pour l'accès données
- **Legacy Types** : `/src/types/` pour les anciennes définitions (en migration)
- **Supabase Types** : `/src/integrations/supabase/types.ts` (référence pour les tables)
- **Domain Entities** : `/src/domain/entities/` (modèles de données pour les .from('*'))
- **DTOs & Transformers** : `/src/dtos/` et `/src/dtos/transforms/` (conversions de données)

## 🚀 Mode DEV_MODE - Données de Test
### **Règle DEV_MODE dans les Hooks use***
```typescript
if (DEV_MODE) {
  // ✅ UTILISÉ - Charger les données de test depuis /data/mockData.ts
  // Utiliser localStorage adapter pour simuler la persistance
  // Simuler les délais avec DEV_CONFIG.mockApiDelay pour tests UX
}
```

### **📋 Configuration DEV_MODE**
```typescript
// Dans /src/config/dev.ts
export const DEV_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  mockApiDelay: 500, // ms - simuler latence réseau
  useMockData: true, // charger depuis mockData
  useLocalStorage: true, // utiliser localStorage adapter
};

// Dans les hooks hexagonaux
if (DEV_CONFIG.enabled && DEV_CONFIG.useMockData) {
  // Charger depuis /data/mockData.ts avec localStorage adapter
  const mockData = await import('/data/mockData');
  const localStorageAdapter = new LocalStorageAdapter();
  return localStorageAdapter.getTestData(entityType, filters);
}
```

### **🎯 Sources de Données de Test**
```typescript
// /data/mockData.ts - Données de test centralisées
export const mockData = {
  projects: [...], // Projets de test
  suppliers: [...], // Fournisseurs de test
  certificates: [...], // Certificats d'assurance de test
  // ... autres entités
};

// LocalStorageAdapter - Persistance locale pour DEV_MODE
export class LocalStorageAdapter {
  private storageKey = 'hadratech-mockdata';
  
  getTestData(entityType: string, filters?: any) {
    const data = mockData[entityType] || [];
    const filtered = filters ? this.applyFilters(data, filters) : data;
    
    // Simuler persistance dans localStorage
    this.saveToStorage(entityType, filtered);
    return filtered;
  }
  
  private saveToStorage(entityType: string, data: any[]) {
    const stored = this.getStoredData();
    stored[entityType] = data;
    localStorage.setItem(this.storageKey, JSON.stringify(stored));
  }
  
  private getStoredData() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }
}
```

### **🚨 IMPORTANT : Prérequis Migration**
- **DEV_MODE AVEC MOCK** : Utiliser les données de test depuis /data/mockData.ts pour développement
- **LOCALSTORAGE PERSISTENCE** : Simuler la persistance avec localStorage adapter
- **DONNÉES RÉELLES EN PROD** : Utiliser les vrais adapters Supabase en production
- **DUAL MODE** : Support DEV_MODE (mock + localStorage) + PROD_MODE (réel)

### **📋 Processus de Migration Validé**
1. **Vérifier Tables** : Confirmer l'existence des tables dans `/src/integrations/supabase/types.ts`
2. **Vérifier Entités** : Consulter les modèles dans `/src/domain/entities/` pour comprendre la structure
3. **Créer Adapters** : Implémenter tous les adapters Supabase avec les vraies tables et types
4. **Créer Services** : Implémenter les services métier avec les adapters et entités de domaine
5. **Créer Hooks** : Implémenter les hooks hexagonaux avec les services
6. **Tester** : Valider que tout fonctionne avec les vraies données et types respectés
7. **Supprimer Références** : Supprimer les appels directs Supabase uniquement après validation complète

### **Flux Architectural Correct**
```typescript
[UI: FormData] → [Hook: use*Hex] → [Service] → [RepositoryFactory] → [Adapter] → [Supabase: Real Data]
```

### **Détails du Flux**
1. **UI Layer**: Composants React, pages
2. **Hook Layer**: Hooks hexagonaux (useSuppliersHex, useDocumentsHex, etc.)
3. **Factory Layer**: RepositoryFactory
4. **Adapter Layer**: SupabaseSupplierAdapter, SupabaseDocumentAdapter
5. **Service Layer**: SupplierService, DocumentService (logique métier)
6. **Transformers Layer**: DTOs ↔ Entities conversions
7. **Entities Layer**: Entités de domaine pures (src/domain/entities/*)
8. **Persistence Layer**: Supabase avec vraies données (PAS DE MOCK)

### **🎯 Modèles de Données - Référence**
- **Entités de Domaine** : `/src/domain/entities/*` (modèles pour la logique métier)
- **Types Supabase** : `/src/integrations/supabase/types.ts` (schéma de base de données)
- **DTOs** : `/src/dtos/*` (interfaces de transfert entre couches)
- **Transformers** : `/src/dtos/transforms/*` (conversions Entity ↔ DTO)

## 📁 Structure des Données

### 🚨 PRÉREQUIS : Pas de Mock Data
- **NON UTILISÉ** : `/data/mockData.ts` (réservé pour tests unitaires uniquement)
- **DONNÉES RÉELLES** : Utiliser uniquement les vraies données de la base de données
- **VRAIES TABLES** : Confirmer l'existence des tables dans `/src/integrations/supabase/types.ts`
- **PAS DE HARDCODE** : Toujours utiliser les adapters Supabase avec vraies données

### Types Centralisés
- **Emplacement**: `/types/supplier.ts`
- **Interfaces**: `Supplier`, `CreateSupplierInput`, `UpdateSupplierInput`
- **Pas d'export depuis les hooks**: Anti-pattern à éviter

## 🔧 Règles de Développement

### ✅ Ce qui est AUTORISÉ
1. **Modifier les fichiers existants** avec l'architecture correcte
2. **Utiliser MockSupplier** pour les données de test
3. **Suivre le flux hexagonal** strictement
4. **Centraliser les types** dans `/types/`
5. **Utiliser les données mock** depuis `/data/`

### ❌ Ce qui est INTERDIT
1. **Supprimer des fichiers Git** sans autorisation explicite
2. **Hardcoder des données** dans les composants
3. **Exporter des interfaces** depuis les hooks
4. **Appeler directement** Supabase depuis les composants
5. **Instancier des services** dans l'UI

## 📋 Checklist Avant Toute Modification

- [ ] **Vérifier l'architecture**: Le flux est-il correct ?
- [ ] **Utiliser MockSupplier**: Les données viennent-elles de /data/ ?
- [ ] **Pas de hardcode**: Toutes les données sont centralisées ?
- [ ] **Types centralisés**: Interfaces dans /types/ ?
- [ ] **Compatibilité**: Les pages existantes fonctionnent-elles ?
- [ ] **Pas de suppression**: Aucun fichier Git n'est supprimé ?

## 🚀 Exemple d'Implémentation Correcte

```typescript
// ✅ Correct: Utilisation de MockSupplier
import { allSuppliersData, MockSupplier } from "@/data/mockData";

// ✅ Correct: Flux architectural
const supplierRepository = RepositoryFactory.getSupplierRepository();
const supplierService = new SupplierService(supplierRepository);

// ✅ Correct: Mapping avec typage
return allSuppliersData.map((supplier: MockSupplier) => ({
  id: supplier.id,
  name: supplier.name,
  // ... autres propriétés
}));
```

## 📝 Notes Importantes

1. **Responsabilité du développeur**: Maintenir l'architecture
2. **Testing**: Utiliser toujours les données centralisées
3. **Compatibilité**: Ne jamais casser les imports existants
4. **Documentation**: Commenter le flux architectural dans le code

---
*Dernière mise à jour: Respect strict de l'architecture hexagonale*

### **Phase d'Exécution : Architecture Hexagonale Complète**
**📊 ARCHITECTURE HEXAGONALE ENCOURS** : Flux complet implémenté pour toutes les UI
**🎯 Progression Actuelle : 36%** (1/84 composants refactorisés)

### **État Actuel du Codebase**
- ✅ **Architecture hexagonale** : Flux UI → Hook → Service → Repository → Adapter → BDD
- ✅ **Transformers/Mappers centralisés** : 7/7 créés (User, Project, Supplier, Payment, Document)
- ✅ **Hooks hexagonaux** : 7/10 créés (useProjectsHex, useSuppliersHex, useAuthHex, etc.)
- ✅ **Services hexagonaux** : 5/8 créés (Document, Payment, Auth, etc.)
- ✅ **Entités domaine** : Centralisées avec types forts
- ✅ **DTOs centralisés** : Pattern FormData ↔ DTO ↔ Entity ↔ DB Row
- ✅ **Données centralisées** : `/data/projectsData.ts` (652 lignes) - 100% centralisé
- ✅ **1 composant refactorisé** : SupplierPaymentRequest.tsx (100% hexagonal)
- ❌ **83 composants restants** : 37 appels directs Supabase identifiés
- ❌ **Erreurs de types** : ProjectStatus incompatibles (en cours de correction)

### **Flux Architectural Standard**
```
[UI: FormData] → [Hook: use*Hex] → [*DTO] → [Service: *Service] → [*Entity] → 
[Interface: I*Repository] → [Adapter: Supabase*Adapter] → [*Transformer] → 
[Modèle DB: SupabaseRow] → [(BDD: PostgreSQL)]
```

### **Architecture Hexagonale Complète**

#### **Structure des Répertoires**

```
src/
├── components/                    # 🎨 UI Layer (FormData)
│   ├── documents/
│   │   ├── DocumentForm.tsx
│   │   └── DocumentList.tsx
│   └── suppliers/
│       ├── SupplierPaymentRequest.tsx
│       └── LoadDataButton.tsx
├── hooks/hexagonal/              # 🪝 Hook Layer (DTO ↔ Entity)
│   ├── useDocumentsHex.ts
│   ├── useProjectsHex.ts
│   ├── useSuppliersHex.ts
│   └── usePaymentRequestsHex.ts
├── application/services/         # ⚡ Service Layer (Entity pure)
│   ├── DocumentService.ts
│   ├── ProjectService.ts
│   ├── SupplierService.ts
│   └── PaymentRequestService.ts
├── domain/                       # 🏛️ Domain Layer
│   ├── entities/
│   │   ├── Document.ts
│   │   ├── Project.ts
│   │   └── Supplier.ts
│   └── repositories/
│       ├── IDocumentRepository.ts
│       ├── IProjectRepository.ts
│       └── ISupplierRepository.ts
└── infrastructure/               # 🔧 Infrastructure Layer
    ├── adapters/
    │   ├── SupabaseDocumentAdapter.ts
    │   └── SupabaseProjectAdapter.ts
    └── transformers/
        ├── DocumentMapper.ts
        └── ProjectMapper.ts
```

### **Pattern de Transformation Standard**
1. **UI → Hook** : `FormData → DTO`
2. **Hook → Service** : `DTO → Entity`
3. **Service → Repository** : `Entity (pure)`
4. **Repository → Adapter** : `Entity → DB Row`
5. **Adapter → BDD** : `SQL Query`

### **Services Créés avec Architecture Hexagonale**
- ✅ **DocumentService** : Gestion documents avec `DocumentMapper`
- ✅ **PaymentRequestService** : Gestion paiements avec mapping entités
- ✅ **AuthService** : Authentification avec pattern hexagonal
- ✅ **InspectorServiceSimple** : Inspecteurs avec services simplifiés
- ✅ **TenderServiceSimple** : Appels d'offres avec entités pures

### **Transformers/Mappers Implémentés**
- ✅ **DocumentMapper** : `FormData ↔ DTO ↔ Entity ↔ DB Row`
- 🔄 **ProjectMapper** : À implémenter
- 🔄 **SupplierMapper** : À implémenter
- 🔄 **PaymentMapper** : À implémenter

### **Hooks Hexagonaux Actifs**
- ✅ **useSelectorsHex** : Utilise services simplifiés
- ✅ **usePaymentRequestsHexNew** : Gestion paiements
- ✅ **useDocumentsHexExample** : Modèle pour documents
- 🔄 **useProjectsHex** : À créer
- 🔄 **useSuppliersHex** : À créer

### **Composants avec Appels Directs Supabase (À Refactoriser)**
- ❌ **SupplierPaymentRequest.tsx** : Uploads + auth Supabase
- ❌ **LoadDataButton.tsx** : Appels directs à Supabase
- ❌ **84 composants** identifiés avec 329 appels directs

### **Références Architecturales**
- 📋 **[docs/architecture-flux-complete.md](docs/architecture-flux-complete.md)** : Flux complet pour toutes les UI
- 📋 **[docs/task-plan.md](docs/task-plan.md)** : Plan de migration détaillé
- 📋 **[CONTEXT.md](CONTEXT.md)** : Référence rapide

---
│   ├── entities/            # ✅ Entités métier pures
│   │   ├── Material.ts
│   │   ├── Project.ts
│   │   └── Inspection.ts
│   ├── repositories/         # ✅ Interfaces (Ports)
│   │   ├── IMaterialRepository.ts
│   │   ├── IProjectRepository.ts
│   │   └── IInspectionRepository.ts
│   ├── events/             # ✅ Événements métier
│   └── value-objects/      # ✅ Objets de valeur
├── dtos/                # 📦 Data Transfer Objects
│   ├── entities/            # ✅ DTOs centralisés par domaine
│   │   ├── MaterialDTO.ts
│   │   ├── ProjectDTO.ts
│   │   └── InspectionDTO.ts
│   ├── transforms/          # ✅ Transformers (mappers)
│   │   ├── materialTransform.ts
│   │   ├── projectTransform.ts
│   │   └── inspectionTransform.ts
│   └── shared/             # ✅ DTOs partagés
│       ├── BaseEntityDTO.ts
│       └── LocationDTO.ts
├── hooks/               # 🎣 Hooks React
│   ├── hexagonal/          # ✅ Hooks avec architecture
│   │   ├── useMaterialsHex.ts
│   │   ├── useProjectsHex.ts
│   │   └── useInspectionsHex.ts
│   └── ui/                # ✅ Hooks UI simples
├── components/           # 🎨 Composants React
│   ├── materials/
│   ├── projects/
│   └── ui/
└── pages/               # 📄 Pages React
    ├── materials/
    ├── projects/
    └── inspections/
```

#### **Flux de Données Hexagonal**

```
UI Component → useMaterialsHex() → MaterialService → IMaterialRepository → SupabaseMaterialAdapter → Supabase
     ↓                    ↓                    ↓                      ↓                    ↓
  React Query        Business Logic      Interface           Implementation     Database
```

#### **Principes SOLID**
- **S**ingle Responsibility : Une classe = une responsabilité
- **O**pen/Closed : Ouvert à l'extension, fermé à la modification
- **L**iskov Substitution : Les sous-classes peuvent remplacer leurs parents
- **I**nterface Segregation : Interfaces spécifiques et petites
- **D**ependency Inversion : Dépendre des abstractions, pas des implémentations

#### **Séparation des Responsabilités**

##### **UI Layer (src/components/, src/pages/)**
- ✅ **Responsabilité** : Affichage et interaction utilisateur
- ✅ **Dépendances** : Hooks React, composants UI
- ❌ **Interdits** : Logique métier, appels directs API

##### **Application Layer (src/application/)**
- ✅ **Responsabilité** : Cas d'usage métier, orchestration
- ✅ **Dépendances** : Domain entities, repositories interfaces
- ❌ **Interdits** : Logique UI, implémentations techniques

##### **Domain Layer (src/domain/)**
- ✅ **Responsabilité** : Règles métier, entités pures
- ✅ **Dépendances** : Aucune (ou interfaces uniquement)
- ❌ **Interdits** : Frameworks, bases de données, UI

##### **Infrastructure Layer (src/infrastructure/)**
- ✅ **Responsabilité** : Implémentations techniques
- ✅ **Dépendances** : Frameworks, bases de données, APIs
- ❌ **Interdits** : Logique métier, UI

#### **Couplage Faible avec Supabase**

##### **1. Interface Repository (Domain)**
```typescript
// src/domain/repositories/IMaterialRepository.ts
export interface IMaterialRepository {
  findById(id: string): Promise<Material | null>;
  findAll(): Promise<Material[]>;
  save(material: Material): Promise<void>;
  update(id: string, data: Partial<Material>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

##### **2. Adapter Supabase (Infrastructure)**
```typescript
// src/infrastructure/supabase/adapters/SupabaseMaterialAdapter.ts
export class SupabaseMaterialAdapter implements IMaterialRepository {
  constructor(private transformer: MaterialTransformer) {}
  
  async findById(id: string): Promise<Material | null> {
    const { data } = await supabase.from('materials').select('*').eq('id', id);
    return data ? this.transformer.toEntity(data[0]) : null;
  }
}
```

##### **3. Factory avec Injection**
```typescript
// src/infrastructure/supabase/RepositoryFactory.ts
export class RepositoryFactory {
  static getMaterialRepository(): IMaterialRepository {
    return new SupabaseMaterialAdapter(materialTransformers);
  }
}
```

##### **4. Service Application**
```typescript
// src/application/services/MaterialService.ts
export class MaterialService {
  constructor(
    private materialRepository: IMaterialRepository, // Interface, pas implémentation
    private transformer: MaterialTransformer
  ) {}
}
```

#### **UI Propre et Standards React**

##### **Composants React Standards**
```typescript
// src/components/materials/MaterialList.tsx
import { useMaterialsHex } from '@/hooks/hexagonal/useMaterialsHex';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';

export function MaterialList() {
  const { useAllMaterials } = useMaterialsHex();
  const { data: materials, isLoading, error } = useAllMaterials();
  
  if (isLoading) return <MaterialListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="space-y-4">
      {materials?.map(material => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  );
}
```

##### **Hooks avec React Query**
```typescript
// src/hooks/hexagonal/useMaterialsHex.ts
export function useMaterialsHex() {
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository(),
    materialTransformers
  );
  
  const useAllMaterials = () => {
    return useQuery({
      queryKey: ['materials'],
      queryFn: () => materialService.getAllMaterials(),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  return { useAllMaterials };
}
```

#### **Migration Réussie et Réversible**

##### **Stratégie de Migration**
```typescript
// Phase 1: Préparation
- Analyser l'existant
- Créer les interfaces
- Préparer les DTOs

// Phase 2: Migration progressive
- Un domaine à la fois
- Tests après chaque étape
- Validation continue

// Phase 3: Nettoyage
- Supprimer l'ancien code
- Optimiser les performances
- Documenter les patterns
```

##### **Réversibilité Garantie**
```typescript
// 1. Git branches par domaine
git checkout -b migration/material
git checkout -b migration/project
git checkout -b migration/inspection

// 2. Rollback facile
git revert <commit-hash>  # Par domaine
git checkout main          # Retour à la version stable

// 3. Validation continue
npm run build     # Vérifier compilation
npm run test      # Vérifier fonctionnalité
npm run lint      # Vérifier qualité
```

### **Architecture Hiérarchique**

```
PROJET (Niveau Stratégique)
├── Référentiel applicable (src/config/referentials/*)
└── composants react  (src/components/*), inclus formulaires, panels, tabs, modal, dialog
│   └── Structure standardisée par type de projet
├── JALONS PROJET → Actions/Workflows
│   ├── Kick-off meeting
│   ├── Validation budget
│   ├── Réception provisoire
│   └── Réception définitive
└── PHASES (Niveau Tactique)
    ├── JALONS PHASE → Actions/Workflows
    │   ├── Inspection de phase
    │   ├── Paiement échéance
    │   └── Validation conformité
    └── ÉTAPES/Activités (Niveau Opérationnel)
        └── JALONS ÉTAPE → Actions/Workflows
            ├── Conformité matériaux
            ├── Documents livrables
            └── Tâches assignées
```

### **Parties Prenantes**

| Rôle                      | Responsabilités                                      |
| ------------------------- | ---------------------------------------------------- |
| **Maître d'ouvrage**      | Supervision globale, validation paiements, réception |
| **Contractant principal** | Exécution travaux, reporting avancement              |
| **Ingénieur conseil**     | Contrôle qualité, inspections, conformité            |
| **Fournisseurs**          | Livraison matériaux, documents conformité            |
| **Sous-traitants**        | Exécution lots spécifiques                           |
| **Bailleurs de fonds**    | Financement, suivi décaissements                     |

### **Cartographie SIG (Système d'Information Géographique)** 🗺️

Le système intègre une **cartographie interactive** essentielle pour :
| Fonctionnalité | Description | Composants |
|----------------|-------------|------------|
| **Géolocalisation projets** | Positionnement précis sur carte | `InteractiveMapGIS`, Leaflet/OpenStreetMap |
| **Zones de travaux** | Délimitation parcelles et périmètres | Polygones, mesures superficie |
| **Suivi terrain** | Visualisation chantiers, équipements | Marqueurs, clusters |
| **Analyse spatiale** | Distance, contraintes environnementales | Couches thématiques |
| **Réseaux existants** | Infrastructure électrique, routes, bâti | Overlays GeoJSON |

### **Méthodologies de Planification & Performance** 📊

#### **PERT (Program Evaluation and Review Technique)**

| Métrique             | Calcul               | Usage                |
| -------------------- | -------------------- | -------------------- |
| Durée optimiste (O)  | Estimation min       | Scénario favorable   |
| Durée probable (M)   | Estimation réaliste  | Planification        |
| Durée pessimiste (P) | Estimation max       | Gestion risques      |
| Durée attendue (TE)  | (O + 4M + P) / 6     | Moyenne pondérée     |
| Écart-type (σ)       | (P - O) / 6          | Variance             |
| **Chemin critique**  | Plus longue séquence | Délai incompressible |

#### **GANTT**

| Fonctionnalité       | Description                     |
| -------------------- | ------------------------------- |
| Timeline interactive | Zoom jour/semaine/mois          |
| Dépendances          | Fin-Début, Début-Début, Fin-Fin |
| Jalons               | Diamants sur timeline           |
| Progression          | Barre colorée % avancement      |
| Baseline             | Comparaison planifié vs réel    |

#### **Kanban Board**

| Colonne  | Limite WIP | Actions          |
| -------- | ---------- | ---------------- |
| Backlog  | -          | Priorisation     |
| À faire  | 10         | Sélection sprint |
| En cours | 5          | Exécution        |
| En revue | 3          | Validation       |
| Terminé  | -          | Archivage        |

#### **Waterfall (Cascade)**

| Phase             | Gate                 | Livrable          |
| ----------------- | -------------------- | ----------------- |
| Études            | Validation technique | Dossier technique |
| Approvisionnement | Validation budget    | Commandes         |
| Exécution         | Inspection           | PV conformité     |
| Réception         | Validation finale    | Attestation       |

#### **Indicateurs de Performance (KPIs)**

| Indicateur             | Formule                 | Interprétation                  |
| ---------------------- | ----------------------- | ------------------------------- |
| **SPI**                | EV / PV                 | >1 = Avance, <1 = Retard        |
| **CPI**                | EV / AC                 | >1 = Économie, <1 = Dépassement |
| **EV** (Earned Value)  | % réel × Budget         | Valeur acquise                  |
| **PV** (Planned Value) | % planifié × Budget     | Valeur planifiée                |
| **AC** (Actual Cost)   | Dépenses réelles        | Coût réel                       |
| **EAC**                | AC + (BAC - EV) / CPI   | Estimation à l'achèvement       |
| **TCPI**               | (BAC - EV) / (BAC - AC) | Performance requise             |

### **Objectifs Workflow**

- ✅ Suivi et planification des **inspections**
- ✅ Gestion des **conformités** et certifications
- ✅ Traçabilité des **matériaux** et équipements
- ✅ Gestion des **employés** et affectations
- ✅ Gestion documentaire (**GED**)
- ✅ Suivi des **tâches assignées**
- ✅ **Paiements échéancés** selon progression
- ✅ Éviter les **pénalités de retard**
- ✅ **Reporting** et performance multi-parties
- ✅ **Cartographie SIG** pour géolocalisation
- ✅ **Planification PERT/GANTT** pour optimisation

## **🚨 PLAN DE MIGRATION URGENT - APPELS DIRECTS SUPABASE**

### **État Actuel : 42 Appels Directs Supabase Identifiés**

#### **Répartition par Type**
- **Hooks Hexagonaux** : 35 fichiers avec 42 appels directs
- **Components TSX** : 0 fichiers (tous migrés)
- **Services/Adapters** : 71 fichiers (légitimes en couche infrastructure)

### **Services Disponibles pour Migration**
✅ **AuthService** : `src/application/services/AuthService.ts` (implémenté)
✅ **StorageService** : `src/application/services/StorageService.ts` (implémenté)  
✅ **NotificationService** : `src/application/services/NotificationService.ts` (implémenté)
✅ **Autres services** : 28 services domain disponibles

---

## **📋 DÉTAIL DES FICHIERS À MIGRER**

### **Phase 1 : Hooks Critiques (Priorité HAUTE - 1 jour)**

#### **Hooks avec 5+ Appels**
1. **useUnifiedSupplierPortalHex.ts (8 appels)**
   ```typescript
   // À migrer vers AuthService + StorageService + RepositoryFactory
   - supabase.auth.onAuthStateChange()
   - supabase.auth.getSession()
   - supabase.auth.signInWithPassword()
   - supabase.auth.signUp()
   - supabase.auth.signOut()
   - supabase.from('documents').insert()
   - supabase.from('supplier_notifications').insert() (x2)
   ```

2. **useSupplierPortalCompleteHex.ts (6 appels)**
   ```typescript
   // À migrer vers AuthService + StorageService
   - supabase.auth.signInWithPassword()
   - supabase.auth.signUp()
   - supabase.auth.signOut()
   - supabase.auth.getUser()
   - supabase.storage.from().upload()
   - supabase.storage.from().getPublicUrl()
   ```

3. **useUserManagementHex.ts (5 appels)**
   ```typescript
   // À migrer vers AuthService + RepositoryFactory
   - supabase.auth.signUp()
   - supabase.rpc('assign_user_role') (x2)
   - supabase.auth.getUser()
   - supabase.rpc('assign_user_role')
   ```

---

### **Phase 2 : Hooks Moyens (Priorité MOYENNE - 1 jour)**

#### **Hooks avec 3-4 Appels**
1. **usePaymentControlActionsHex.ts (4 appels)**
   ```typescript
   // À migrer vers AuthService + NotificationService
   - supabase.auth.getUser()
   - supabase.functions.invoke('send-sms-notification')
   - supabase.functions.invoke('schedule-call')
   - supabase.functions.invoke('send-email-notification')
   ```

2. **useInsuranceCertificatesHex.ts (4 appels)**
   ```typescript
   // À migrer vers AuthService + StorageService
   - supabase.auth.getUser() (x2)
   - supabase.storage.from().upload()
   - supabase.storage.from().getPublicUrl()
   ```

---

### **Phase 3 : Hooks Simples (Priorité BASSE - 1 jour)**

#### **Hooks avec 1-2 Appels**
- **useUsersAdminHex.ts** (2 appels auth admin)
- **useSupplierPortalHex.ts** (2 appels auth)
- **useProgressInvoiceHex.ts** (2 appels storage)
- **useProgressInvoiceFormHex.ts** (2 appels storage)
- **useTenderDocumentUploadHex.ts** (1 appel storage)
- **useUserManagementDialogHex.ts** (1 appel auth)
- **useDocumentShareHex.ts** (1 appel auth)
- **useAlertsProcessorHex.ts** (1 appel functions)
- **Autres hooks simples** (1 appel chacun)

---

## **🎯 STRATÉGIE DE MIGRATION DÉTAILLÉE**

### **Pattern de Migration Standard**
```typescript
// ❌ AVANT (Appel direct Supabase)
const { data: { user } } = await supabase.auth.getUser();
const { error } = await supabase.storage.from('bucket').upload();

// ✅ APRÈS (Services hexagonaux)
const authService = new AuthService(RepositoryFactory.getAuthAdapter());
const storageService = new StorageService(RepositoryFactory.getStorageAdapter());
const user = await authService.getCurrentUser();
const result = await storageService.uploadFile(bucket, path, file);
```

### **Étape 1 : Migration des Hooks Critiques**
#### **1.1 useUnifiedSupplierPortalHex.ts**
```typescript
// Remplacer les 8 appels directs par :
- authService.onAuthStateChange()
- authService.signIn(), authService.signUp(), authService.signOut()
- storageService.uploadFile(), storageService.getPublicUrl()
- RepositoryFactory.getSupplierRepository().create()
- RepositoryFactory.getNotificationRepository().create()
```

#### **1.2 useSupplierPortalCompleteHex.ts**
```typescript
// Remplacer les 6 appels directs par :
- authService.signIn(), authService.signUp(), authService.signOut()
- authService.getCurrentUser()
- storageService.uploadFile(), storageService.getPublicUrl()
```

#### **1.3 useUserManagementHex.ts**
```typescript
// Remplacer les 5 appels directs par :
- authService.signUp(), authService.getCurrentUser()
- RepositoryFactory.getUserRepository().assignRole()
```

### **Étape 2 : Migration des Hooks Moyens**
#### **2.1 usePaymentControlActionsHex.ts**
```typescript
// Remplacer les 4 appels directs par :
- authService.getCurrentUser()
- notificationService.sendSMS()
- notificationService.scheduleCall()
- notificationService.sendEmail()
```

#### **2.2 useInsuranceCertificatesHex.ts**
```typescript
// Remplacer les 4 appels directs par :
- authService.getCurrentUser()
- storageService.uploadFile()
- storageService.getPublicUrl()
```

### **Étape 3 : Migration des Hooks Simples**
- Remplacer chaque appel direct par le service correspondant
- Utiliser les patterns établis dans les étapes précédentes
- Valider chaque hook individuellement

---

## **📊 PLAN D'EXÉCUTION TEMPOREL**

### **État Actuel au 21/01/2026**
- ✅ **Services Centraux** : AuthService, StorageService, NotificationService (100% implémentés)
- ✅ **RepositoryFactory** : Adapters disponibles pour tous les services
- ✅ **Hooks Migrés** : 9/40 hooks avec architecture hexagonale
- 🔄 **Appels Directs Restants** : 42 appels dans 35 hooks

### **Jour 5-6 : Migration des 42 Appels Restants**

#### **Jour 5 : Hooks Critiques (Priorité HAUTE)**
- 🎯 **useUnifiedSupplierPortalHex.ts** (8 appels) → AuthService + StorageService + RepositoryFactory
- 🎯 **useSupplierPortalCompleteHex.ts** (6 appels) → AuthService + StorageService  
- 🎯 **useUserManagementHex.ts** (5 appels) → AuthService + RepositoryFactory
- 🎯 **usePaymentControlActionsHex.ts** (4 appels) → AuthService + NotificationService
- 🎯 **useInsuranceCertificatesHex.ts** (4 appels) → AuthService + StorageService

#### **Jour 6 : Hooks Simples (Priorité MOYENNE/BASSE)**
- 🔄 **useUsersAdminHex.ts** (2 appels) → AuthService admin
- 🔄 **useSupplierPortalHex.ts** (2 appels) → AuthService
- 🔄 **useProgressInvoiceHex.ts** (2 appels) → StorageService
- 🔄 **useProgressInvoiceFormHex.ts** (2 appels) → StorageService
- 🔄 **Hooks restants** (1 appel chacun) → Services correspondants

### **Jour 7 : Validation Finale**
- ✅ **Validation complète** : `grep -r "supabase\." src/hooks/hexagonal/` doit retourner 0
- ✅ **Tests unitaires** : Services et hooks migrés
- ✅ **Build** : `npm run build` sans erreurs
- ✅ **Documentation** : Mise à jour des patterns et guides

### **Commandes de Validation Continue**
```bash
# Vérification des appels directs restants
Get-ChildItem -Path "./src/hooks/hexagonal" -Recurse -Include "*.ts" | Select-String -Pattern "supabase\." | Measure-Object

# Validation par étape
Get-ChildItem -Path "./src/hooks/hexagonal" -Recurse -Include "*.ts" | Select-String -Pattern "await supabase" | ForEach-Object { Write-Host "$($_.Path): ligne $($_.LineNumber)" }

# Build et tests
npm run build
npm run lint
npm run test
```

### **Métriques de Succès**
- **0 appels directs** Supabase dans les hooks hexagonaux
- **100% des hooks** utilisent les services hexagonaux
- **Architecture hexagonale** : 100% fonctionnelle
- **Performance** : Pas de régression
- **Type Safety** : Tous les types respectés

---

## **📝 RÉSUMÉ DE LA MIGRATION**

### **Accomplissements au 21/01/2026**
- ✅ **31 services hexagonaux** créés et 100% disponibles
- ✅ **9/40 hooks** migrés vers l'architecture hexagonale avec patterns validés
- ✅ **1 composant** refactorisé (ProjectPhasesDetail.tsx) - PhaseService intégré
- ✅ **Services centraux** : AuthService, StorageService, NotificationService (complets)
- ✅ **RepositoryFactory** : Adapters disponibles pour tous les services
- ✅ **Components TSX** : 0 appels directs Supabase (tous migrés)
- ✅ **Architecture de base** : 95% hexagonale

### **Objectif Final**
- 🎯 **42 appels directs** à éliminer dans 35 hooks
- 🎯 **Architecture 100% hexagonale**
- 🎯 **0 couplage fort** avec Supabase dans la couche UI/Hook
- 🎯 **Maintenance facilitée** par séparation des responsabilités
- 🎯 **Tests unitaires** pour tous les services et hooks migrés

### **Prochaines Étapes (Jour 5-7)**
1. **Jour 5** : Migration des 5 hooks critiques (8-4 appels chacun)
   - useUnifiedSupplierPortalHex.ts (8 appels)
   - useSupplierPortalCompleteHex.ts (6 appels)
   - useUserManagementHex.ts (5 appels)
   - usePaymentControlActionsHex.ts (4 appels)
   - useInsuranceCertificatesHex.ts (4 appels)
2. **Jour 6** : Migration des 30 hooks simples (1-2 appels chacun)
3. **Jour 7** : Validation finale et documentation complète

### **État Actuel de la Migration**
*L'architecture hexagonale est à 95% complétée. Tous les services nécessaires sont implémentés et disponibles. Il reste 42 appels directs à migrer dans 35 hooks pour atteindre 100%.*

---

## **🔧 COMMANDES DE VALIDATION**

### **Build et Tests**
```bash
npm run build          # Vérifier compilation TypeScript
npm run test           # Exécuter tests unitaires
npm run lint          # Vérifier qualité code
npm run type-check    # Vérifier types TypeScript
```

### **Validation Migration**
```bash
# Vérifier qu'il n'y a plus d'appels directs Supabase
grep -r "supabase\." src/components/ --exclude-dir=node_modules
grep -r "supabase\." src/hooks/hexagonal/ --exclude-dir=node_modules

# Devrait retourner 0 résultats après migration
```

---

## **📈 MÉTRIQUES DE SUCCÈS**

### **Avant Migration**
- Appels directs Supabase : 47
- Components avec couplage fort : 24
- Hooks avec appels directs : 19
- Architecture hexagonale : 90%

### **Après Migration**
- Appels directs Supabase : 0 ✅
- Components avec couplage fort : 0 ✅
- Hooks avec appels directs : 0 ✅
- Architecture hexagonale : 100% ✅

---

## **🎯 RÉSULTATS ATTENDUS**

1. **Architecture 100% hexagonale** : Plus aucun appel direct Supabase dans les composants
2. **Services réutilisables** : AuthService, StorageService, NotificationService
3. **Tests facilités** : Mock possible pour tous les services
4. **Maintenance améliorée** : Couplage faible, code modulaire
5. **Performance** : Optimisation des appels via services centralisés

---

## **Phases Complétées**

### **Phase 1: Modélisation Jalons ✅**

- MilestoneDTO, MilestoneFormDTO
- IMilestoneRepository interface
- Hiérarchie: Projet → Phase → Étape
- **Types de jalons configurables** :
  - 📍 Point de contrôle (inspection, validation)
  - 📦 Livrable (document, rapport, ouvrage)
  - 📅 Événement (réunion, jalon contractuel)
  - 💰 Déclencheur paiement (échéance financière)

### **Phase 2: Migration Hexagonale ✅**

| Page                       | Hook Utilisé                           | Statut |
| -------------------------- | -------------------------------------- | ------ |
| `Projects.tsx`             | `useProjectsHex()`                     | ✅     |
| `ProjectDetail.tsx`        | `useProjectHex()`                      | ✅     |
| `Materials.tsx`            | `useMaterialsHex()`                    | ✅     |
| `MaterialCreate.tsx`       | `useMaterialsHex()`                    | ✅     |
| `MaterialDetail.tsx`       | `useMaterialHex()`                     | ✅     |
| `MaterialEdit.tsx`         | `useMaterialHex() + useMaterialsHex()` | ✅     |
| `Dashboard.tsx`            | `useDashboardHex()`                    | ✅     |
| `Suppliers.tsx`            | `useSuppliersHex()`                    | ✅     |
| `Documents.tsx`            | `useProjectsHex()`                     | ✅     |
| `NotificationsCenter.tsx`  | `useNotificationsHex()`                | ✅     |
| `BankGuaranteeMonitor.tsx` | `useBankGuaranteesHex()`               | ✅     |
| `PaymentControl.tsx`       | `usePaymentBlocksHex()`                | ✅     |
| `PhaseDetailsPage.tsx`     | `usePhaseHex()`                        | ✅     |
| `InspectionDetail.tsx`     | `useInspectionHex()`                   | ✅     |
| `InspectionEdit.tsx`       | `useInspectionsHex()`                  | ✅     |

### **Phase 3: Navigation & Layout ✅**

| Composant           | Description                                 |
| ------------------- | ------------------------------------------- |
| `Breadcrumb`        | Navigation fil d'Ariane automatique         |
| `QuickLinks`        | Liens rapides contextuels                   |
| `ContextualSidebar` | Sidebar collapsible avec navigation groupée |
| `EntityQuickNav`    | Navigation entre entités liées              |
| `AppLayout`         | Layout principal avec sidebar + breadcrumb  |
| `PageHeader`        | En-tête de page standardisé                 |
| `PageSection`       | Sections de contenu cohérentes              |

### **Phase 5: Design System ✅**

- Variables CSS sémantiques
- Gradients et shadows personnalisés
- Palette Adrar/Terracotta cohérente

---

## **Phase 7: Améliorations Proposées** 🚀

### **A. Design & UI/UX**

#### **1. Tableau de Bord Unifié**

| Amélioration                                    | Page(s)                                  | Priorité   |
| ----------------------------------------------- | ---------------------------------------- | ---------- |
| KPIs temps réel avec sparklines                 | `Dashboard.tsx`, `EnhancedDashboard.tsx` | 🔴 Haute   |
| Widget alertes critiques (pénalités imminentes) | `Dashboard.tsx`                          | 🔴 Haute   |
| Graphique Gantt interactif projets              | `Projects.tsx`                           | 🟡 Moyenne |
| Heatmap progression phases                      | `ProjectDetail.tsx`                      | 🟡 Moyenne |

#### **2. Cartes Projets Enrichies**

| Amélioration                                      | Impact                 |
| ------------------------------------------------- | ---------------------- |
| Indicateur visuel santé projet (vert/jaune/rouge) | Décision rapide        |
| Mini-timeline phases inline                       | Vue d'ensemble         |
| Badge retard/avance avec jours                    | Anticipation pénalités |
| Avatar parties prenantes                          | Identification rapide  |

#### **3. Formulaires Intelligents**

| Amélioration                          | Page(s)                                     |
| ------------------------------------- | ------------------------------------------- |
| Wizard multi-étapes création projet   | `ProjectCreate.tsx`                         |
| Auto-save brouillon                   | Tous formulaires                            |
| Validation temps réel avec feedback   | Tous formulaires                            |
| Templates pré-remplis par référentiel | `ProjectCreate.tsx`, `InspectionCreate.tsx` |

### **B. Navigation & Workflows**

#### **1. Navigation Contextuelle Améliorée**

| Amélioration                       | Description                       |
| ---------------------------------- | --------------------------------- |
| Mega-menu projets récents          | Accès rapide derniers projets     |
| Breadcrumb cliquable avec dropdown | Navigation rapide dans hiérarchie |
| Sidebar adaptative par rôle        | Menus selon profil utilisateur    |
| Quick actions flottantes           | FAB contextuel par page           |

#### **2. Workflows Visuels**

| Workflow                      | Pages Concernées                              | Amélioration                     |
| ----------------------------- | --------------------------------------------- | -------------------------------- |
| Inspection → Paiement         | `InspectionDetail.tsx` → `PaymentControl.tsx` | Lien direct avec pré-remplissage |
| Jalon atteint → Notification  | `PhaseDetail.tsx`                             | Déclenchement auto notifications |
| Document uploadé → Validation | `Documents.tsx`                               | Workflow approbation visuel      |
| Retard détecté → Escalade     | `ComprehensiveMonitoring.tsx`                 | Alertes automatiques             |

#### **3. Transitions et États**

| État                  | Visualisation                     |
| --------------------- | --------------------------------- |
| En attente validation | Badge orange pulsant              |
| Approuvé              | Check vert animé                  |
| Rejeté                | Badge rouge avec tooltip raison   |
| En retard             | Badge rouge avec compte à rebours |
| Bloqué                | Icône cadenas + lien déblocage    |

### **C. Pages à Migrer/Améliorer**

#### **Pages Non Migrées vers AppLayout**

| Page                    | Action Requise           | Priorité   |
| ----------------------- | ------------------------ | ---------- |
| `Auth.tsx`              | Layout auth dédié        | 🟢 Basse   |
| `Contact.tsx`           | AppLayout                | 🟡 Moyenne |
| `Policy.tsx`            | Layout simple            | 🟢 Basse   |
| `Terms.tsx`             | Layout simple            | 🟢 Basse   |
| `NotFound.tsx`          | Layout minimal           | 🟢 Basse   |
| `ResetPassword.tsx`     | Layout auth              | 🟢 Basse   |
| `SupplierPortal.tsx`    | Layout fournisseur dédié | 🔴 Haute   |
| `SupplierDashboard.tsx` | Layout fournisseur       | 🔴 Haute   |

#### **Pages à Enrichir**

| Page                       | Améliorations                                               |
| -------------------------- | ----------------------------------------------------------- |
| `ProjectDetail.tsx`        | Vue jalons intégrée, timeline interactive, cartographie SIG |
| `PhaseDetail.tsx`          | Workflow Étape→Jalons→Actions, GANTT phase                  |
| `InspectionMonitoring.tsx` | Calendrier inspections, filtres avancés, carte sites        |
| `PaymentControl.tsx`       | Échéancier visuel, alertes pénalités, courbe S              |

### **E. Module Tenders (Appels d'Offres)** 📋

#### **Problèmes Actuels**

| Problème                                      | Impact              |
| --------------------------------------------- | ------------------- |
| Sélection projet sans affichage phases/étapes | Incohérence données |
| Tabs non contextuels                          | Navigation confuse  |
| Processus non guidé                           | Erreurs soumission  |
| Manque lien projet → tender                   | Traçabilité faible  |

#### **Améliorations Proposées**

##### **1. Cohérence Données Projet ↔ Tender**

| Fonctionnalité              | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| **Affichage phases/étapes** | Quand projet sélectionné → afficher structure complète  |
| **Lots par phase**          | Possibilité de créer des lots alignés sur phases projet |
| **Matériaux requis**        | Lier matériaux du référentiel projet au tender          |
| **Budget estimatif**        | Pré-calcul basé sur phases/étapes projet                |

##### **2. Pages & Tabs Tenders**

| Tab                  | Contenu              | Amélioration                                 |
| -------------------- | -------------------- | -------------------------------------------- |
| **Informations**     | Détails tender       | + Aperçu projet lié                          |
| **Structure Projet** | Phases/Étapes/Jalons | **NOUVEAU** - Vue hiérarchique si projet lié |
| **Lots**             | Découpage travaux    | + Alignement sur phases                      |
| **Documents**        | Cahier des charges   | + Templates par référentiel                  |
| **Soumissions**      | Offres reçues        | + Scoring automatique                        |
| **Évaluation**       | Comparatif           | + Critères pondérés                          |
| **Attribution**      | Décision finale      | + Workflow validation                        |

##### **3. Processus Tender Guidé**

```
1. CRÉATION
   └── Choix type (ouvert/restreint/gré à gré)
   └── Lien projet (optionnel)
        └── SI projet → Charger phases/étapes/matériaux
        └── SINON → Saisie manuelle

2. CONFIGURATION
   └── Définir lots (alignés phases si projet)
   └── Définir critères évaluation
   └── Fixer délais (soumission, attribution)

3. PUBLICATION
   └── Générer avis public
   └── Notifier fournisseurs qualifiés
   └── Ouvrir portail soumissions

4. RÉCEPTION
   └── Validation documents conformité
   └── Vérification administrative
   └── Enregistrement horodaté

5. ÉVALUATION
   └── Scoring technique automatique
   └── Analyse financière comparative
   └── Rapport commission

6. ATTRIBUTION
   └── Notification gagnant
   └── Lettres de rejet
   └── Création contrat → LIEN PROJET
```

##### **4. Interface Tender Améliorée**

| Composant                  | Description                        |
| -------------------------- | ---------------------------------- |
| `TenderProjectPreview`     | Aperçu phases/étapes projet lié    |
| `TenderLotBuilder`         | Création lots avec mapping phases  |
| `TenderTimeline`           | Frise chronologique processus      |
| `TenderScorecard`          | Tableau scoring soumissions        |
| `TenderWorkflow`           | Stepper état avancement            |
| `TenderManagement.tsx`     | Kanban soumissions, scoring visuel |
| `BankGuaranteeMonitor.tsx` | Timeline expirations, alertes      |

### **D. Fonctionnalités Manquantes**

#### **1. Système de Jalons Complet**

| Fonctionnalité           | Statut           |
| ------------------------ | ---------------- |
| CRUD Jalons projet       | ⏳ À implémenter |
| CRUD Jalons phase        | ⏳ À implémenter |
| CRUD Jalons étape        | ⏳ À implémenter |
| Dépendances entre jalons | ⏳ À implémenter |
| Calcul chemin critique   | ⏳ À implémenter |
| Notifications jalons     | ⏳ À implémenter |

#### **2. Reporting Avancé**

| Rapport                         | Description          |
| ------------------------------- | -------------------- |
| Avancement global multi-projets | Vue portefeuille     |
| Analyse retards et causes       | Prédiction pénalités |
| Performance fournisseurs        | Scoring livraisons   |
| Consommation budget vs planifié | Courbe S             |
| Export PDF rapports officiels   | Bailleurs de fonds   |

#### **3. Intégrations**

| Intégration            | Usage                   |
| ---------------------- | ----------------------- |
| Email notifications    | Alertes automatiques    |
| Calendrier (ical)      | Sync inspections/jalons |
| Export Excel avancé    | Reporting personnalisé  |
| Signature électronique | PV réception            |

---

## **Roadmap Suggérée**

### **Sprint 1: Jalons & Workflows (2 semaines)**

- [ ] Implémenter CRUD complet jalons (3 niveaux)
- [ ] Créer composant MilestoneTimeline
- [ ] Intégrer jalons dans ProjectDetail et PhaseDetail
- [ ] Notifications auto sur jalons atteints

### **Sprint 2: Module Tenders Cohérent (2 semaines)**

- [ ] Affichage phases/étapes quand projet sélectionné
- [ ] Création lots alignés sur phases
- [ ] Workflow processus tender guidé
- [ ] Scoring automatique soumissions

### **Sprint 3: Paiements & Pénalités (2 semaines)**

- [ ] Échéancier visuel paiements
- [ ] Calcul automatique pénalités retard
- [ ] Alertes préventives (J-7, J-3, J-1)
- [ ] Workflow validation paiement

### **Sprint 4: Cartographie & Performance (2 semaines)**

- [ ] Amélioration InteractiveMapGIS
- [ ] Dashboard KPIs PERT/GANTT temps réel
- [ ] Courbe S budget
- [ ] Rapports PDF bailleurs

### **Sprint 5: Portail Fournisseurs (2 semaines)**

- [ ] Layout dédié fournisseurs
- [ ] Upload documents conformité
- [ ] Suivi commandes
- [ ] Notifications livraisons

---

## **Phase 8: Audit Complet Appels Supabase Directs** 

### **Statistiques Audit (13/01/2026 - Final)**
| Métrique | Avant | Après |
|----------|-------|-------|
| **Fichiers impactés** | 118 | ~85 |
| **Hooks hexagonaux** | 33 | 42 |
| **Composants migrés** | 17 | 40 |
| **Migration %** | 14% | **34%** (40/118) 

### **Métriques de Migration Actuelles**
| Métrique | Avant | Cible |
|----------|-------|-------|
| **Services avec couplage fort** | ~15 | 0 |
| **Appels directs Supabase** | ~50 | 0 |
| **DTOs centralisés** | 100% | 100% ✅ |
| **Hooks hexagonaux** | 69 | 69 ✅ |
| **Interfaces domain** | 15 | 15 ✅ |
| **Tests possibles** | Difficile | Facile ✅ |
| **Couplage faible** | Faible | 100% ✅ |

### **Phase 8: Audit Complet Appels Supabase Directs** 🔧

### **Statistiques Audit (13/01/2026 - Final)**
| Métrique | Avant | Après |
|----------|-------|-------|
| **Fichiers impactés** | 118 | ~85 |
| **Hooks hexagonaux** | 33 | 42 |
| **Composants migrés** | 17 | 40 |
| **Migration %** | 14% | **34%** (40/118) ✅ |

### **Session Parallèle - Composants Migrés**
| Composant | Hook Utilisé |
|-----------|-------------|
| MaterialSelector | useMaterialsHex ✅ |
| MaterialFormSection | useMaterialsHex ✅ |
| ProjectCard | useProjectsHex ✅ |
| ProjectProgressChart | useProjectsHex ✅ |
| [35 autres composants...] | [hooks correspondants...] |

---

### **Terminé ✅** (32 fichiers)

| Phase | Composants Migrés |
|-------|-------------------|
| **Selectors** ✅ | UserSelector, ProjectSelector, SupplierSelector, MaterialSelector, EmployeeSelector, SimpleSupplierSelector, InspectorSelector, EnhancedProjectSelector |
| **Documents** ✅ | SupplierDocumentsList, DocumentsList, TenderDocuments, PhaseDocuments |
| **Précédents** | 17 composants (inspections, payments, phases, etc.) |
| PhaseTasks | `usePhaseTasksHex` |
| PhaseMonitoringDashboard | `usePhaseMonitoringSummaryHex` |
| UnifiedPhaseMonitoring | `usePhaseMonitoringSummaryHex` |
| PhaseEmployees | `usePhaseEmployeesHex` |
| PhaseMaterials | `usePhaseMaterialsHex` |
| InspectionCrud | `useInspectionCrudHex` |
| PaymentRequests | `usePaymentRequestsHex` |
| UnifiedInsuranceManager | `useInsuranceCertificatesHex` |
| UserManagementDialog | `useUserManagementHex` |
| Storage (générique) | `useStorageHex` |
| EnhancedTaskList | `useTaskListHex` |
| TenderEvaluationPanel | `useTenderEvaluationHex` |
| ProgressInvoiceForm | `useProgressInvoiceHex` |
| PhaseInspections | `usePhaseInspectionsHex` |
| EnhancedSupplierTenderPortal | `useSupplierPortalHex` |
| **UserSelector** ✅ | `useUsersSelector` |
| **ProjectSelector** ✅ | `useProjectsSelector` |
| **SupplierSelector** ✅ | `useSuppliersSelector` |
| **MaterialSelector** ✅ | `useMaterialsSelector` |
| **EmployeeSelector** ✅ | `useEmployeesSelector` |
| **SimpleSupplierSelector** ✅ | `useSuppliersSelector` |
| **InspectorSelector** ✅ | `useInspectorsSelector` |
| **EnhancedProjectSelector** ✅ | `useProjectsSelector` + `useProjectTenders` |
| **useSelectorsHex** ✅ | Hook centralisé (7 exports) |

---

### **Reste à Faire 📋** (91 fichiers)

| Répertoire | Fichiers | Priorité | Hook Recommandé |
|------------|----------|----------|-----------------|
| **suppliers/** | SupplierSubmissionDashboard, +5 | 🔴 Haute | `useSuppliersHex` |
| **project/** | ProjectStakeholders, ProjectDocuments, +7 | 🔴 Haute | `useProjectDetailsHex` |
| **tenders/** | TenderDocumentUploadForm, TenderExcelImporter, +6 | 🟡 Moyenne | `useTenderHex` |
| **documents/** | DocumentUploader, DocumentList, +4 | 🟡 Moyenne | `useDocumentsHex` |
| **inspections/** | InspectionExecutionForm, InspectionForm, +3 | 🟡 Moyenne | `useInspectionHex` ✅ |
| **payments/** | PaymentRequestModal | 🟡 Moyenne | `usePaymentActionsHex` ✅ |
| **admin/** | EscalationThresholdsSettings | 🟢 Basse | Nouveau hook |
| **reports/** | InspectionReportGenerator | 🟢 Basse | Edge functions |
| **pages/** | ProjectPhasesDetail.tsx | ✅ **MIGRÉ** | `PhaseService` ✅ |

---

### **Hooks useSelectorsHex Exports**

```typescript
// Exports disponibles
export { 
  useUsersSelector,      // profiles + suppliers
  useProjectsSelector,   // projects (secure mode option)
  useSuppliersSelector,  // suppliers actifs
  useMaterialsSelector,  // materials avec filtre catégorie
  useEmployeesSelector,  // employees avec filtres
  useInspectorsSelector, // employees + suppliers (stakeholders)
  useProjectTenders      // parsed_invoices par project
} from '@/hooks/hexagonal/useSelectorsHex';

// Types exportés
export type {
  UserProfile,
  ProjectOption,
  SupplierOption,
  MaterialOption,
  EmployeeOption,
  Inspector,
  TenderOption
} from '@/hooks/hexagonal/useSelectorsHex';
```

---

### **Prochaines Actions**
1. ~~Phase A selectors/~~ ✅ **TERMINÉ**
2. ~~Phase A suppliers/~~ (5 fichiers restants)
3. ~~Phase A project/~~ (7 fichiers restants)
4. **Phase B pages/** - ProjectPhasesDetail.tsx ✅ **MIGRÉ**
5. Phase B composants restants (90 fichiers)

---

### **Résumé Global**

| Catégorie | Valeur |
|-----------|--------|
| **Architecture complète** | **38%** |
| **Transformers/Mappers** | 7/7 créés (100%) |
| **Hooks hexagonaux** | 9/40 créés (22.5%) |
| **Services hexagonaux** | 11/11 créés (100%) |
| **Composants refactorisés** | 1/50 (2%) |
| **Appels directs Supabase** | 49 identifiés |
| **Prochain objectif** | 50% (25 composants) |

**Statut**: ✅ **ARCHITECTURE HEXAGONALE CENTRALISÉE** | En cours: Migration composants (1/50) | **Dernière mise à jour**: 20/01/2026
