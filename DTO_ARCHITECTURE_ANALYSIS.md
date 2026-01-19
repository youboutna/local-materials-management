# 🏗️ **Analyse de l'Architecture DTO**

## ❌ **Problème Identifié**

Vous avez absolument raison ! Il y a **duplication des DTOs Material** :

```
src/
├── application/dtos/MaterialDTO.ts     # ❌ Ancienne version
└── dtos/entities/MaterialDTO.ts         # ✅ Nouvelle version centralisée
```

## 📊 **Comparaison des DTOs**

### **Ancienne Version (`application/dtos/MaterialDTO.ts`)**
```typescript
export interface MaterialDTO {
  id: string;
  name: string;
  description: string;
  category: string;           // ❌ string simple
  unit: string;
  pricePerUnit: number;         // ❌ camelCase
  availableQuantity: number;    // ❌ camelCase
  image?: string;
  originLocation?: string;
  coordinatesLatitude?: number;   // ❌ camelCase
  coordinatesLongitude?: number;  // ❌ camelCase
  adresse?: string;             // ❌ français
  forme?: string;               // ❌ français
  createdAt: string;
  updatedAt: string;
}
```

### **Nouvelle Version (`dtos/entities/MaterialDTO.ts`)**
```typescript
export interface MaterialDTO extends BaseEntityDTO {
  name: string;
  description: string;
  category: string;           // ✅ string simple
  unit: string;
  pricePerUnit: number;         // ✅ camelCase
  availableQuantity: number;    // ✅ camelCase
  sku?: string;                // ✅ SKU ajouté
  coordinatesLatitude?: number;   // ✅ camelCase
  coordinatesLongitude?: number;  // ✅ camelCase
  workspaceId?: string;        // ✅ workspace ajouté
  image?: string;
  originLocation?: string;
  adresse?: string;             // ✅ français (compatibilité)
  forme?: string;               // ✅ français (compatibilité)
}

// ✅ DTOs spécialisés
export interface MaterialDetailsDTO extends MaterialDTO {
  location?: LocationDTO;
  workspaceDetails?: { ... };
  supplierInfo?: { ... };
  stockHistory?: Array<...>;
  usageHistory?: Array<...>;
  qualityMetrics?: { ... };
}

export interface MaterialSummaryDTO {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  totalValue: number;           // ✅ valeur calculée
  isLowStock: boolean;          // ✅ état stock
  lastUpdated: string;
}
```

## 🎯 **Architecture Recommandée (selon task-plan.md)**

### **Centralisation des DTOs par Domaine**
```
src/dtos/entities/              # ✅ Centralisation
├── MaterialDTO.ts             # ✅ DTOs complets
├── ProjectDTO.ts              # ✅ DTOs complets
├── InspectionDTO.ts           # ✅ DTOs complets
├── DocumentDTO.ts             # ✅ DTOs complets
└── index.ts                  # ✅ Export centralisé
```

### **Transformers pour les Cas d'Usage**
```
src/dtos/transforms/           # ✅ Transformations spécialisées
├── materialTransform.ts        # ✅ UI ↔ Database ↔ API
├── projectTransform.ts         # ✅ UI ↔ Database ↔ API
└── index.ts                  # ✅ Export centralisé
```

### **Use Cases pour les Besoins Spécifiques**
```
src/application/use-cases/      # ✅ Cas d'usage métier
├── material/                 # ✅ Cas d'usage matériaux
│   ├── CreateMaterialUseCase.ts
│   ├── UpdateStockUseCase.ts
│   └── GetLowStockMaterialsUseCase.ts
└── project/                  # ✅ Cas d'usage projets
    ├── CreateProjectUseCase.ts
    └── GetProjectSummaryUseCase.ts
```

## 🔧 **Actions Immédiates**

### **1. Supprimer l'Ancien DTO**
```bash
# Déplacer l'ancien fichier
mv src/application/dtos/MaterialDTO.ts src/application/dtos/MaterialDTO_OLD.ts
```

### **2. Mettre à jour les Imports**
```typescript
// ❌ Ancien import
import { MaterialDTO } from '@/application/dtos/MaterialDTO';

// ✅ Nouvel import centralisé
import { MaterialDTO, MaterialDetailsDTO, MaterialSummaryDTO } from '@/dtos/entities';
```

### **3. Utiliser les DTOs Spécialisés**
```typescript
// ✅ Pour les listes
import { MaterialSummaryDTO } from '@/dtos/entities/MaterialDTO';

// ✅ Pour les détails
import { MaterialDetailsDTO } from '@/dtos/entities/MaterialDTO';

// ✅ Pour les formulaires
import { CreateMaterialDTO, UpdateMaterialDTO } from '@/dtos/entities/MaterialDTO';
```

### **4. Corriger le MaterialTransformer**
```typescript
// ✅ Utiliser les bons noms de propriétés
const tempDTO: MaterialDTO = {
  id: data.id,
  name: data.name,
  description: data.description,
  category: data.category,
  unit: data.unit,
  pricePerUnit: data.price_per_unit,        // ✅ snake_case → camelCase
  availableQuantity: data.available_quantity, // ✅ snake_case → camelCase
  sku: data.sku,                           // ✅ SKU si disponible
  coordinatesLatitude: data.coordinates_latitude,
  coordinatesLongitude: data.coordinates_longitude,
  workspaceId: data.workspace_id,
  createdAt: data.created_at,
  updatedAt: data.updated_at
};
```

## 📋 **Plan de Migration**

### **Phase 1: Nettoyage**
1. **Supprimer** `src/application/dtos/MaterialDTO.ts`
2. **Mettre à jour** tous les imports vers `@/dtos/entities`
3. **Vérifier** que tous les composants utilisent les bons DTOs

### **Phase 2: Transformers**
1. **Corriger** `materialTransform.ts` avec les bons mappings
2. **Ajouter** les validations pour les nouveaux champs
3. **Tester** les transformations SQL ↔ DTO ↔ Entity

### **Phase 3: Services**
1. **Mettre à jour** `MaterialService_UPDATED.ts`
2. **Utiliser** les DTOs spécialisés (Summary, Details)
3. **Implémenter** les use cases métier

### **Phase 4: Hooks**
1. **Mettre à jour** `useMaterialsHex_UPDATED.ts`
2. **Utiliser** les services avec transformers
3. **Ajouter** les hooks pour les cas d'usage spécifiques

## 🎯 **Bénéfices Attendus**

### **Centralisation**
- ✅ **Un seul DTO Material** : Pas de duplication
- ✅ **Types spécialisés** : Summary, Details, Filter
- ✅ **Export centralisé** : Un seul point d'import

### **Flexibilité**
- ✅ **Use cases** : Cas d'usage métier spécifiques
- ✅ **Transformers** : Mapping pour différentes sources
- ✅ **Validation** : Cohérente à tous les niveaux

### **Maintenabilité**
- ✅ **Single source of truth** : Un seul fichier par domaine
- ✅ **Type safety** : TypeScript strict
- ✅ **Documentation** : Types auto-documentés

## 🚀 **Conclusion**

L'architecture DTO doit suivre le principe de **centralisation par domaine** avec des **transformers spécialisés** pour les différents cas d'usage (UI, Database, API REST).

Le DTO Material dans `src/dtos/entities/MaterialDTO.ts` est la **version correcte et complète** à utiliser ! 🎯
