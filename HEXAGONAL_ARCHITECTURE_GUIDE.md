# 🏗️ **Architecture Hexagonale Complète**

## 📚 **Principes Fondamentaux**

### **1. Architecture Hexagonale (Ports & Adapters)**
```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Components  │  │   Pages     │  │   Hooks     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Services   │  │  Use Cases  │  │  DTOs       │  │
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
│              Infrastructure Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Database   │  │   External  │  │   Adapters  │  │
│  │ (Supabase)  │  │   APIs      │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
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
├── services/              # ✅ Services métier (Use Cases)
│   ├── MaterialService.ts
│   ├── ProjectService.ts
│   └── InspectionService.ts
├── use-cases/            # ✅ Cas d'usage spécifiques
│   ├── material/
│   │   ├── CreateMaterialUseCase.ts
│   │   ├── UpdateStockUseCase.ts
│   │   └── GetLowStockMaterialsUseCase.ts
│   └── project/
│       ├── CreateProjectUseCase.ts
│       └── GetProjectSummaryUseCase.ts
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
    └── InspectionCreatePage.tsx
```

## 🔄 **Migration Réussie et Réversible**

### **1. Stratégie de Migration**
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

### **2. Réversibilité Garantie**
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

### **3. Points de Contrôle**
```typescript
// Après chaque domaine migré :
✅ Build réussi
✅ Tests passants
✅ Types corrects
✅ Performance OK
✅ UI fonctionnelle
```

## 🎯 **Standards React Respectés**

### **1. Composants Fonctionnels**
```typescript
// ✅ Composant fonctionnel pur
export function MaterialCard({ material }: { material: MaterialDTO }) {
  return (
    <Card className="p-4">
      <h3>{material.name}</h3>
      <p>{material.description}</p>
    </Card>
  );
}
```

### **2. Hooks Personnalisés**
```typescript
// ✅ Hook personnalisé réutilisable
export function useMaterialForm(initialData?: Partial<MaterialDTO>) {
  const [formData, setFormData] = useState<Partial<MaterialDTO>>(initialData || {});
  
  const updateField = (field: keyof MaterialDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return { formData, updateField, setFormData };
}
```

### **3. Gestion d'État**
```typescript
// ✅ React Query pour serveur state
// ✅ useState pour UI state
// ✅ useContext pour état global
// ✅ useReducer pour logique complexe
```

## 🚀 **Checklist de Migration**

### **Pré-Migration**
- [ ] Backup du code existant
- [ ] Analyse des dépendances
- [ ] Création des interfaces
- [ ] Préparation des DTOs

### **Migration**
- [ ] Créer les adapters
- [ ] Créer les services
- [ ] Créer les hooks
- [ ] Mettre à jour les composants

### **Post-Migration**
- [ ] Tests complets
- [ ] Performance check
- [ ] Documentation
- [ ] Nettoyage

Cette architecture garantit une **migration réussie, réversible et maintenable** ! 🎯
