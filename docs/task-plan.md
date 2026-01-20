# **Plan d'Action: Système de Gestion Intégrée des Projets d'Infrastructure**

---

## Contexte et Vision

### **Objectif Global**

Développement d'un logiciel de **gestion intégrée des projets d'infrastructure** (électrique, habitat, routes, bâtiment, santé...) avec bailleurs de fonds et/ou État.

---

## 📊 **Migration Supabase - État Actuel**

### **🎯 Objectif Migration Hexagonale**
- **Éliminer** tous les appels directs `supabase.` des composants et hooks
- **Centraliser** la logique métier dans les services domain
- **Standardiser** l'accès aux données via RepositoryFactory

### **📈 Progression Actuelle**
- **Services hexagonaux créés**: 11/11 ✅
- **Hooks migrés**: 2/40 (5%) 🔄
- **Composants refactorisés**: 1/50 (2%) 🔄
- **Appels directs restants**: 108 occurrences
- **Architecture**: 90% hexagonale

### **📋 Étapes de Migration Complétées**
- ✅ **Jour 1**: Services centraux (AuthService, StorageService, NotificationService)
- ✅ **Jour 2**: Hooks prioritaires (useStorageHex, useMonitoringHex)
- ✅ **Jour 3**: Hooks actions (usePaymentActionsHex, useInspectionMonitoringHex)
- ✅ **Jour 4**: Composant critique (ProjectPhasesDetail.tsx)
- 🔄 **Jour 5**: Components restants (49 fichiers)
- ⏳ **Jour 6-7**: Validation finale

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
- **DTOs Centralisés** : `/src/types/` pour les interfaces de transfert
- **Transformers** : `/src/dtos/transforms/` pour les conversions enrichies
- **Mock Data** : `/src/data/mockData.ts` pour le développement
- **Repository Pattern** : `/src/infrastructure/supabase/adapters/` pour l'accès données

## 🚀 Mode DEV_MODE - Données de Test
### **Règle DEV_MODE dans les Hooks use***
```typescript
if (DEV_MODE) {
  // Utiliser les params DEV dans les services pour charger/persister les données
  // Charger depuis /data/mockData.ts
  // Persister dans base embarquée pour tester
  // Simuler les délais avec DEV_CONFIG.mockApiDelay
}
```

### **Flux DEV_MODE Standard**
1. **Charger** : Données depuis `/data/mockData.ts`
2. **Simuler** : Délis avec `DEV_CONFIG.mockApiDelay`
3. **Persister** : Dans base embarquée pour tests
4. **Mapper** : Mock → Entity → DTO avec transformers existants
5. **Retourner** : DTOs typés pour les composants

### Flux Architectural Correct
```
[UI] => Factory[Adapter Api => Services[Transformers, Mappers, validations, calculations] => entities => [Api Adapter/Factory => persistence system]
```

### Détails du Flux
1. **UI Layer**: Composants React, pages
2. **Hook Layer**: Hooks hexagonaux (useSuppliersHex, useDocumentsHex, etc.)
3. **Factory Layer**: RepositoryFactory
4. **Adapter Layer**: SupabaseSupplierAdapter, SupabaseDocumentAdapter
5. **Service Layer**: SupplierService, DocumentService (logique métier)
6. **Transformer Layer**: SupplierMapper, DocumentMapper (DTOs ↔ Entities)
7. **Persistence Layer**: PostgreSQL via Supabase

## 📁 Structure des Données

### Mock Data Centralisé
- **Emplacement**: `/data/mockData.ts`
- **Interface**: `MockSupplier` (et autres interfaces Mock*)
- **Utilisation**: Mode DEV_MODE pour testing
- **Pas de hardcode**: Toujours utiliser les données centralisées

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

### **État Actuel : 47 Appels Directs Supabase Identifiés**

#### **Répartition par Type**
- **Components TSX** : 24 fichiers avec 47 appels directs
- **Hooks Hexagonaux** : 19 hooks avec appels directs à corriger
- **Services/Adapters** : 71 fichiers (légitimes en couche infrastructure)

---

## **📋 DÉTAIL DES FICHIERS À MIGRER**

### **Phase 1 : Services Authentifiés (Critique - 1 jour)**

#### **Services à Créer**
1. **AuthService hexagonal complet**
   - Remplacer tous les `supabase.auth.getUser()`
   - Centraliser la logique d'authentification
   - Interface `IAuthService`

2. **StorageService hexagonal**
   - Remplacer tous les `supabase.storage.*`
   - Gérer uploads/downloads/documents
   - Interface `IStorageService`

#### **Hooks à Mettre à Jour**
- `useTenderEvaluationHex.ts` (1 appel auth)
- `useTaskAssignmentsHex.ts` (2 appels auth)
- `usePaymentActionsHex.ts` (4 appels auth/functions)
- `useSupplierSubmissionsHex.ts` (1 appel auth)
- `useSupplierDashboardHex.ts` (2 appels auth)
- `useUserManagementHex.ts` (1 appel auth)

---

### **Phase 2 : Hooks Hexagonaux (Haute Priorité - 2 jours)**

#### **Hooks Prioritaires par Nombre d'Appels**

**🔴 useStorageHex.ts (6 appels storage)**
```typescript
// À migrer vers StorageService
- supabase.storage.from(bucketName).upload()
- supabase.storage.from(bucketName).getPublicUrl()
- supabase.storage.from(bucketName).remove()
```

**🔴 useMonitoringHex.ts (4 appels directs)**
```typescript
// À migrer vers services dédiés
- supabase.from('bank_guarantees').select('*')
- supabase.from('payment_blocks').select('*')
- supabase.from('insurance_certificates').select('*')
- supabase.from('notifications').select('*')
```

**🔴 usePaymentActionsHex.ts (4 appels auth/functions)**
```typescript
// À migrer vers AuthService + NotificationService
- supabase.auth.getUser()
- supabase.functions.invoke('send-sms-notification')
- supabase.functions.invoke('schedule-call')
- supabase.functions.invoke('send-email-notification')
```

**🟡 useInspectionMonitoringHex.ts (3 appels auth/storage)**
```typescript
// À migrer vers AuthService + StorageService
- supabase.auth.getUser()
- supabase.storage.from('documents').upload()
- supabase.storage.from('documents').getPublicUrl()
```

**🟡 usePhaseInspectionsHex.ts (2 appels storage)**
```typescript
// À migrer vers StorageService
- supabase.storage.from('project-documents').upload()
- supabase.storage.from('project-documents').getPublicUrl()
```

**🟡 usePaymentCrudHex.ts (3 appels storage/channel)**
```typescript
// À migrer vers StorageService + NotificationService
- supabase.storage.from('documents').upload()
- supabase.storage.from('documents').getPublicUrl()
- supabase.removeChannel(channel)
```

---

### **Phase 3 : Components TSX (Moyenne Priorité - 3 jours)**

#### **Components par Groupe de Priorité**

**🔴 Components avec 3+ Appels (5 fichiers)**
```typescript
ConsultantValidationPanel.tsx (4 appels)
AlertsProcessorSettings.tsx (3 appels)
BusinessDocuments.tsx (3 appels)
DeploymentSettings.tsx (3 appels)
NotificationsCenter.tsx (3 appels)
```

**🟡 Components avec 2 Appels (7 fichiers)**
```typescript
PasswordResetHandler.tsx (2 appels)
UnifiedInsuranceManager.tsx (2 appels)
PaymentRequestsManagement.tsx (2 appels)
PhaseInspections.tsx (2 appels)
OAuthConfigGuide.tsx (2 appels)
EnhancedDocumentSharing.tsx (2 appels)
EnhancedSupplierTenderPortal.tsx (2 appels)
```

**🟢 Components avec 1 Appel (12 fichiers)**
```typescript
LoadDataButton.tsx
TenderDocumentUploadForm.tsx
PhaseTasks.tsx
InspectionReportGenerator.tsx
QuantitativeEstimateExporter.tsx
SupplierPaymentReportGenerator.tsx
TenderReportGenerator.tsx
SupplierSubmissionDashboard.tsx
TenderEvaluationPanel.tsx
TenderExcelImporter.tsx
ResetPasswordPage.tsx
// + autres components avec 1 appel
```

---

## **🎯 STRATÉGIE DE MIGRATION DÉTAILLÉE**

### **Étape 1 : Création des Services Centraux**

#### **1.1 AuthService Hexagonal**
```typescript
// src/application/services/AuthService.ts
interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  getUserSession(): Promise<Session | null>;
  signIn(credentials: SignInCredentials): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

class AuthService implements IAuthService {
  constructor(private authAdapter: IAuthAdapter) {}
  
  async getCurrentUser(): Promise<User | null> {
    return this.authAdapter.getCurrentUser();
  }
}
```

#### **1.2 StorageService Hexagonal**
```typescript
// src/application/services/StorageService.ts
interface IStorageService {
  uploadFile(bucket: string, path: string, file: File): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  deleteFile(bucket: string, path: string): Promise<void>;
  listFiles(bucket: string, prefix?: string): Promise<StorageFile[]>;
}

class StorageService implements IStorageService {
  constructor(private storageAdapter: IStorageAdapter) {}
  
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    return this.storageAdapter.upload(bucket, path, file);
  }
}
```

#### **1.3 NotificationService Hexagonal**
```typescript
// src/application/services/NotificationService.ts
interface INotificationService {
  sendEmail(data: EmailData): Promise<void>;
  sendSMS(data: SMSData): Promise<void>;
  scheduleCall(data: CallData): Promise<void>;
  createNotification(notification: NotificationDTO): Promise<void>;
}
```

### **Étape 2 : Mise à Jour des Hooks**

#### **Pattern de Migration Standard**
```typescript
// ❌ AVANT (Appel direct Supabase)
const { data: { user } } = await supabase.auth.getUser();

// ✅ APRÈS (Service hexagonal)
const authService = new AuthService(RepositoryFactory.getAuthAdapter());
const user = await authService.getCurrentUser();
```

#### **2.1 Migration useStorageHex.ts**
```typescript
// src/hooks/hexagonal/useStorageHex.ts
export function useStorageHex() {
  const storageService = new StorageService(RepositoryFactory.getStorageAdapter());
  
  const uploadMutation = useMutation({
    mutationFn: ({ bucket, path, file }: UploadParams) => 
      storageService.uploadFile(bucket, path, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['storage-files']);
      toast.success('Fichier uploadé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur upload: ${error.message}`);
    }
  });
  
  return { uploadMutation, deleteMutation, getPublicUrl };
}
```

#### **2.2 Migration useMonitoringHex.ts**
```typescript
// src/hooks/hexagonal/useMonitoringHex.ts
export function useMonitoringHex() {
  const bankGuaranteeService = new BankGuaranteeService(
    RepositoryFactory.getBankGuaranteeRepository()
  );
  const paymentBlockService = new PaymentBlockService(
    RepositoryFactory.getPaymentBlockRepository()
  );
  const insuranceService = new InsuranceService(
    RepositoryFactory.getInsuranceRepository()
  );
  const notificationService = new NotificationService(
    RepositoryFactory.getNotificationRepository()
  );
  
  // Utiliser les services au lieu de supabase direct
}
```

### **Étape 3 : Refactoring Components**

#### **Pattern de Migration Component**
```typescript
// ❌ AVANT (Component avec appels directs)
const MyComponent = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
};

// ✅ APRÈS (Component avec hook hexagonal)
const MyComponent = () => {
  const { useCurrentUser } = useAuthHex();
  const { data: user, isLoading } = useCurrentUser();
};
```

---

## **📊 PLAN D'EXÉCUTION TEMPOREL**

### **Jour 1 : Services Centraux**
- ✅ Créer interfaces `IAuthService`, `IStorageService`, `INotificationService`
- ✅ Implémenter services hexagonaux
- ✅ Créer adapters Supabase correspondants
- ✅ Mettre à jour RepositoryFactory

### **Jour 2-3 : Hooks Prioritaires**
- ✅ Migrer `useStorageHex.ts` (6 appels)
- ✅ Migrer `useMonitoringHex.ts` (4 appels)
- ✅ Migrer `usePaymentActionsHex.ts` (4 appels)
- ✅ Migrer `useInspectionMonitoringHex.ts` (3 appels)

### **Jour 4-5 : Components Critiques**
- ✅ Migrer components avec 3+ appels (5 fichiers)
- ✅ Migrer components avec 2 appels (7 fichiers)

### **Jour 6 : Components Restants**
- ✅ Migrer components avec 1 appel (12 fichiers)
- ✅ Validation complète

### **Jour 7 : Tests et Documentation**
- ✅ Tests unitaires services créés
- ✅ Validation architecture hexagonale
- ✅ Mise à jour documentation

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

### **Reste à Faire 📋** (92 fichiers)

| Répertoire | Fichiers | Priorité | Hook Recommandé |
|------------|----------|----------|-----------------|
| **suppliers/** | SupplierSubmissionDashboard, +5 | 🔴 Haute | `useSuppliersHex` |
| **project/** | ProjectStakeholders, ProjectDocuments, +8 | 🔴 Haute | `useProjectDetailsHex` |
| **tenders/** | TenderDocumentUploadForm, TenderExcelImporter, +6 | 🟡 Moyenne | `useTenderHex` |
| **documents/** | DocumentUploader, DocumentList, +4 | 🟡 Moyenne | `useDocumentsHex` |
| **inspections/** | InspectionExecutionForm, InspectionForm, +3 | 🟡 Moyenne | `useInspectionHex` ✅ |
| **payments/** | PaymentRequestModal | 🟡 Moyenne | `usePaymentActionsHex` ✅ |
| **admin/** | EscalationThresholdsSettings | 🟢 Basse | Nouveau hook |
| **reports/** | InspectionReportGenerator | 🟢 Basse | Edge functions |

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
2. Phase A suppliers/ (5 fichiers restants)
3. Phase A project/ (8 fichiers)
4. Phase B tenders/ + documents/

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
