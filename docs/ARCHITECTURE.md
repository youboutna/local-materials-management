
## 📚 **Principes Fondamentaux**

### **1. Architecture Hexagonale (Ports & Adapters)   -- **
```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Components  │  │   Pages     │  │   Hooks     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Services   │  │ Transformers│  │ DTOs        │  │
│  │             │  │/calculations│  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                 Domain Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Entities   │  │ Repositories│  │  Events     │  │
│  │  (Business) │  │ (Interfaces)│  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure Layer                           
                           │
│                        Adapters                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Database   │  │   External  │  │LocalStorage │          │
│  │ (Supabase)  │  │   APIs      │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### **2. Principes SOLID**
- **S**ingle Responsibility : Une classe = une responsabilité
- **O**pen/Closed : Ouvert à l'extension, fermé à la modification
- **L**iskov Substitution : Les sous-classes peuvent remplacer leurs parents
- **I**nterface Segregation : Interfaces spécifiques et petites
- **D**ependency Inversion : Dépendre des abstractions, pas des implémentations

## 📁 **Structure des Répertoires**

### **src/application/** ⚡ **Logique Métier**
```
src/application/
├── services/              # ✅ Services métier 
│   ├── MaterialService.ts
│   ├── ProjectService.ts
│   └── InspectionService.ts
└── dto/                  # ❌ À éviter (utiliser src/dtos/)
    └── (déplacé vers src/dtos/entities/)
```

### **src/infrastructure/** 🔧 **Implémentations Techniques**
```
src/infrastructure/
├── supabase/            # ✅ Adapters Supabase
│   ├── adapters/
│   │   ├── SupabaseMaterialAdapter.ts
│   │   ├── SupabaseProjectAdapter.ts
│   │   └── SupabaseInspectionAdapter.ts
│   ├── RepositoryFactory.ts    # ✅ Factory avec injection
│   └── client.ts            # ✅ Client Supabase
├── external/             # ✅ APIs externes
│   ├── weather/
│   └── geolocation/
└── storage/              # ✅ Stockage fichiers
    └── fileStorage.ts
```

### **src/domain/** 🧠 **Cœur Métier Pur**
```
src/domain/
├── entities/            # ✅ Entités métier pures
│   ├── Material.ts
│   ├── Project.ts
│   └── Inspection.ts
├── repositories/         # ✅ Interfaces (Ports)
│   ├── IMaterialRepository.ts
│   ├── IProjectRepository.ts
│   └── IInspectionRepository.ts
├── events/             # ✅ Événements métier
│   ├── MaterialCreated.ts
│   └── ProjectUpdated.ts
└── value-objects/      # ✅ Objets de valeur
    ├── Money.ts
    └── Address.ts
```

### **src/dtos/** 📦 **Data Transfer Objects**
```
src/dtos/
├── entities/            # ✅ DTOs centralisés par domaine
│   ├── MaterialDTO.ts
│   ├── ProjectDTO.ts
│   └── InspectionDTO.ts
├── transforms/          # ✅ Transformers (mappers)
│   ├── materialTransform.ts
│   ├── projectTransform.ts
│   └── inspectionTransform.ts
└── shared/             # ✅ DTOs partagés
    ├── BaseEntityDTO.ts
    └── LocationDTO.ts
```

### **src/hooks/** 🎣 **Hooks React**
```
src/hooks/
├── hexagonal/          # ✅ Hooks avec architecture
│   ├── useMaterialsHex.ts
│   ├── useProjectsHex.ts
│   └── useInspectionsHex.ts
└── ui/                # ✅ Hooks UI simples
    ├── useModal.ts
    └── useToast.ts
```

## 🔗 **Flux de Données**

### **1. Lecture (Query)**
```
UI Component → useMaterialsHex() → MaterialService → IMaterialRepository → SupabaseMaterialAdapter → Supabase
     ↓                    ↓                    ↓                      ↓                    ↓
  React Query        Business Logic      Interface           Implementation     Database
```

### **2. Écriture (Command)**
```
UI Form → useMaterialsHex() → MaterialService → IMaterialRepository → SupabaseMaterialAdapter → Supabase
   ↓         ↓                    ↓                    ↓                      ↓                    ↓
  DTO    Validation + Use Case   Interface           Implementation     Database
```

## 🎯 **Séparation des Responsabilités**

### **UI Layer (src/components/, src/pages/)**
- ✅ **Responsabilité** : Affichage et interaction utilisateur
- ✅ **Dépendances** : Hooks React, composants UI
- ❌ **Interdits** : Logique métier, appels directs API

### **Application Layer (src/application/)**
- ✅ **Responsabilité** : Cas d'usage métier, orchestration
- ✅ **Dépendances** : Domain entities, repositories interfaces
- ❌ **Interdits** : Logique UI, implémentations techniques

### **Domain Layer (src/domain/)**
- ✅ **Responsabilité** : Règles métier, entités pures
- ✅ **Dépendances** : Aucune (ou interfaces uniquement)
- ❌ **Interdits** : Frameworks, bases de données, UI

### **Infrastructure Layer (src/infrastructure/)**
- ✅ **Responsabilité** : Implémentations techniques
- ✅ **Dépendances** : Frameworks, bases de données, APIs
- ❌ **Interdits** : Logique métier, UI

## 🔄 **Couplage Faible avec Supabase**

### **1. Interface Repository (Domain)**
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

### **2. Adapter Supabase (Infrastructure)**
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

### **3. Factory avec Injection**
```typescript
// src/infrastructure/supabase/RepositoryFactory.ts
export class RepositoryFactory {
  static getMaterialRepository(): IMaterialRepository {
    return new SupabaseMaterialAdapter(materialTransformers);
  }
}
```

### **4. Service Application**
```typescript
// src/application/services/MaterialService.ts
export class MaterialService {
  constructor(
    private materialRepository: IMaterialRepository, // Interface, pas implémentation
    private transformer: MaterialTransformer
  ) {}
}
```

## 🎨 **UI Propre et Navigabilité**

### **1. Composants React Standards**
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

### **2. Hooks avec React Query**
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

### **3. Navigation Structurée**
```
src/pages/
├── materials/
│   ├── MaterialsPage.tsx      # Liste des matériaux
│   ├── MaterialDetailPage.tsx # Détail d'un matériau
│   └── MaterialCreatePage.tsx # Création matériau
├── projects/
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx
│   └── ProjectCreatePage.tsx
└── inspections/
    ├── InspectionsPage.tsx
    ├── InspectionDetailPage.tsx
  # 🏗️ **Analyse des Composants Critiques - 39 Composants Principaux**

## 📊 **Analyse des Composants Critiques**

### **1. Composants Critiques par Priorité**


##### **Priorité MAXIMALE 🚨**
1. **ProjectCreationWorkflow.tsx** : 16 types `any` (831 lignes)
   - Problèmes : Logique métier dans composant, couplage services legacy
   - Statut : Non hexagonal
   - Plan : Migration complète vers architecture hexagonale
   - DTOs requis : ProjectCreationDTO, StakeholderDTO, PhaseDTO, RiskDTO, ComplianceDTO
   - Service requis : ProjectCreationService (remplace ProgressCalculationService)
   - Hook requis : useProjectCreationHex

##### **Priorité HAUTE ⚠️**
2. **EnhancedProjectEditForm.tsx** : 10 types `any` (765 lignes)
   - Problèmes : Couplage services legacy, logique métier dans composant
   - Statut : Partiellement hexagonal (useProjectMaterialsHex ✅)
   - Plan : Migration partielle vers architecture hexagonale
   - DTOs requis : ProjectEditDTO, ProjectDelegationDTO, ProjectStakeholderDTO
   - Service requis : ProjectEditService (remplace ProgressCalculationService)
   - Hook requis : useProjectEditHex

3. **ProjectFileImporter.tsx** : 9 types `any` (949 lignes)
   - Problèmes : Logique métier dans composant, types `any` pour import
   - Statut : Non hexagonal
   - Plan : Migration complète vers architecture hexagonale
   - DTOs requis : ProjectImportDTO, ProjectFileDTO
   - Service requis : ProjectImportService
   - Hook requis : useProjectImportHex

4. **ProjectExporter.tsx** : 9 types `any` (753 lignes)
   - Problèmes : Logique métier dans composant, types `any` pour export
   - Statut : Non hexagonal
   - Plan : Migration complète vers architecture hexagonale
   - DTOs requis : ProjectExportDTO, ProjectReportDTO
   - Service requis : ProjectExportService
   - Hook requis : useProjectExportHex

5. **AdvancedProjectImporter.tsx** : 9 types `any` (import avancé)
   - Problèmes : Logique métier dans composant, types `any` pour import
   - Statut : Non hexagonal
   - Plan : Migration complète vers architecture hexagonale
   - DTOs requis : AdvancedProjectImportDTO
   - Service requis : ProjectImportService (réutiliser)
   - Hook requis : useAdvancedProjectImportHex

##### **Priorité MOYENNE 🔄**
6. **ProjectCreate.tsx** : 1 type `any` (307 lignes)
   - Problèmes : Couplage services legacy, appels Supabase directs
   - Statut : Partiellement hexagonal (useProjectsHex ✅, PhaseService ✅)
   - Plan : Migration partielle vers architecture hexagonale
   - DTOs requis : ProjectCreateDTO, ProjectMaterialDTO
   - Services requis : ProjectStakeholderService hexagonal, MaterialService
   - Hook requis : useProjectCreateHex

#### **📊 Statistiques Globales des Composants**
- **Total composants analysés** : 386 fichiers TSX
- **Types `any` identifiés** : 74 occurrences dans 39 composants
- **Appels Supabase directs** : 9 appels dans 9 composants
- **Services legacy identifiés** : ProgressCalculationService (7 composants), ProjectStakeholderService (6 composants)
- **Services hexagonaux utilisés** : 35 composants utilisent déjà les services hexagonaux
- **Composants 100% hexagonaux** : 347/386 (89.9%)

#### **📋 Services Legacy à Migrer**
- **ProgressCalculationService** : Utilisé dans 7 composants
  - Composants affectés : ProjectCreationWorkflow.tsx, EnhancedProjectEditForm.tsx, etc.
  - Plan : Créer ProjectCalculationService hexagonal
- **ProjectStakeholderService** : Utilisé dans 6 composants
  - Composants affectés : EnhancedProjectEditForm.tsx, ProjectCreate.tsx, etc.
  - Plan : Créer ProjectStakeholderService hexagonal

#### **Total Types `any` à Corriger**
- **ProjectCreationWorkflow.tsx** : 16 types `any`
- **EnhancedProjectEditForm.tsx** : 10 types `any`
- **ProjectFileImporter.tsx** : 9 types `any`
- **ProjectExporter.tsx** : 9 types `any`
- **AdvancedProjectImporter.tsx** : 9 types `any`
- **ProjectCreate.tsx** : 1 type `any`
- **Autres composants** : 20 types `any` (29 composants)
- **Total** : 74 types `any` à corriger

### **🎯 Accomplissements Majeurs**
- **Multi-Providers Authentication** : Terminé ✅
  - AuthManager service centralisé
  - Keycloak, Auth0, Database adapters
  - useAuthSimple hook amélioré
  - MultiProviderAuthContext contexte
- **Configuration Centralisée** : Terminé ✅
  - ConfigurationService avec templates
  - useConfigurationHex hook principal
  - useOAuthConfigHex hook spécialisé
  - OAuthConfigGuide + DeploymentSettings refactorisés
- **Migration Massive** : 90% des appels éliminés ✅
  - 29 → 3 appels directs restants
  - 16 composants critiques migrés
  - Services centraux opérationnels
- **Analyse Composants Critiques** : Terminé ✅
  - ProjectCreationWorkflow.tsx analysé (16 types `any`)
  - EnhancedProjectEditForm.tsx analysé (10 types `any`)
  - Plans de migration détaillés créés

### **📋 Prochaines Étapes (Final)**
#### **Phase 1 : Composants Critiques (JOUR 1)**
- **ProjectCreationWorkflow.tsx** - Priorité MAXIMALE 🚨
  - 16 types `any` à corriger
  - Migration complète vers hexagonal
  - Création de ProjectCreationService et useProjectCreationHex
- **EnhancedProjectEditForm.tsx** - Priorité ÉLEVÉE ⚠️
  - 10 types `any` à corriger
  - Migration partielle vers hexagonal
  - Création de ProjectEditService et useProjectEditHex

#### **Phase 2 : Composants Import/Export (JOUR 2)**
- **ProjectFileImporter.tsx** - Priorité HAUTE 🚨
  - 9 types `any` à corriger
  - Migration complète vers hexagonal
  - Création de ProjectImportService et useProjectImportHex
- **ProjectExporter.tsx** - Priorité HAUTE 🚨
  - 9 types `any` à corriger
  - Migration complète vers hexagonal
  - Création de ProjectExportService et useProjectExportHex
- **AdvancedProjectImporter.tsx** - Priorité HAUTE 🚨
  - 9 types `any` à corriger
  - Migration complète vers hexagonal
  - Utilisation de ProjectImportService

#### **Phase 3 : Composants Secondaires (JOUR 3)**
- **ProjectCreate.tsx** - Priorité MOYENNE ⚠️
  - 1 type `any` à corriger
  - Migration partielle vers hexagonal
  - Création de ProjectCreateService et useProjectCreateHex
- **29 autres composants** : 20 types `any` à corriger
- **RiskAnalysisStep.tsx** - Appels Supabase directs
- **ComplianceStep.tsx** - Appels Supabase directs
- **ConstructionPhaseManager.tsx** - Services legacy

#### **Phase 4 : Finalisation (JOUR 4)**
1. **Nettoyer les 9 appels Supabase restants**
2. **Migrer les services legacy restants**
3. **Documentation finale** de l'architecture
4. **Tests d'intégration** complets
5. **Déploiement production** 🚀

#### **🎯 Objectifs Finaux**
- **Types `any` éliminés** : 74 au total (16 + 10 + 9 + 9 + 9 + 1 + 20)
- **Architecture 100% hexagonale** : Respect des patterns
- **Composants critiques migrés** : 39 composants principaux
- **Services legacy migrés** : 2 services (ProgressCalculationService, ProjectStakeholderService)
- **Production ready** : Prêt pour déploiement

---

## 🛠️ Stack technique HadraTech-GPI

| Couche | Technologies |
|---|---|
| Frontend | React 18 + TypeScript 5 + Vite 5 |
| UI | Tailwind CSS v3 + shadcn-ui (Radix) + Framer Motion |
| État & données | TanStack Query v5, Context API, React Hook Form + Zod |
| Cartographie | Leaflet / React-Leaflet + Google Maps API |
| Backend & DB | PostgreSQL (Supabase) — schémas multi (`public`, `btp`) via vues proxy |
| Auth | Supabase Auth (par défaut) ; Keycloak (SAML 2.0 / SSO) en option |
| Stockage | Supabase Storage (buckets publics + privés) |
| Edge | Supabase Edge Functions (Deno) |

## 🔌 Intégrations externes

| Système | Protocole / API | Usage |
|---|---|---|
| ERP financier (SAGE, COBOL legacy) | REST / GraphQL | Export PED, rapprochement engagements |
| SIG (ArcGIS, GeoServer) | WMS / WMTS / WFS | Couches cartographiques, fonds géoréférencés |
| SCADA industriel | OPC UA | Capteurs terrain, télémétrie chantier |
| Annuaire (AD / LDAP) | LDAP / SAML | SSO entreprise, synchronisation utilisateurs |
| QField | GeoJSON / `.qgs` | Relevés terrain mobiles |

> Toutes les intégrations passent par un **adapter** (`src/infrastructure/`) — jamais d'appel direct depuis l'UI.
