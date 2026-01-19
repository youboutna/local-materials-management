# DTOs Architecture Guide

## 📁 Structure Actuelle

```
src/dtos/
├── index.ts          # Point d'entrée centralisé
├── shared.ts         # DTOs réutilisables et utilitaires
└── README.md         # Documentation

src/types/
├── dto.ts            # DTOs existants (projects, tasks, etc.)
└── inspection.dto.ts # DTOs spécifiques aux inspections

src/application/dtos/
├── index.ts          # Export des DTOs application
├── MaterialDTO.ts    # DTOs matériaux
├── SupplierDTO.ts    # DTOs fournisseurs
├── DocumentDTO.ts    # DTOs documents
├── ProjectDTO.ts     # DTOs projets (application)
└── TenderDTO.ts      # DTOs appels d'offres

src/services/dto/
├── paymentDTO.ts     # DTOs paiements avec transformers
└── insuranceDTO.ts   # DTOs assurances avec transformers
```

## 🎯 Problème Actuel

### ❌ **Duplication et Conflits**
- **`InspectionDTO`** existe dans `types/dto.ts` ET `types/inspection.dto.ts`
- **`ProjectDTO`** existe dans `types/dto.ts` ET `application/dtos/ProjectDTO.ts`
- **`PaymentDTO`** existe dans `types/dto.ts` ET `services/dto/paymentDTO.ts`
- **`MaterialDTO`** existe dans `application/dtos/MaterialDTO.ts` ET hooks

### ❌ **Couplage Fort**
- Hooks importent depuis multiple sources
- Pas de centralisation
- Risque d'incohérence

## ✅ **Solution Recommandée**

### 1. **Centralisation Complète**
```typescript
// src/dtos/index.ts - Point d'entrée unique
export * from './shared';
export * from './entities';
export * from './transforms';
```

### 2. **Structure Unifiée**
```
src/dtos/
├── index.ts              # Point d'entrée central
├── shared.ts             # DTOs communs
├── entities/             # DTOs par entité
│   ├── index.ts
│   ├── ProjectDTO.ts
│   ├── InspectionDTO.ts
│   ├── MaterialDTO.ts
│   ├── SupplierDTO.ts
│   ├── PaymentDTO.ts
│   ├── TaskDTO.ts
│   └── EmployeeDTO.ts
├── transforms/           # Transformers et validation
│   ├── index.ts
│   ├── materialTransform.ts
│   ├── paymentTransform.ts
│   └── inspectionTransform.ts
└── utils/               # Utilitaires DTO
    ├── validation.ts
    ├── pagination.ts
    └── api.ts
```

### 3. **Pattern de Réutilisation**
```typescript
// Base DTO réutilisable
export interface BaseEntityDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Extension avec héritage
export interface ProjectDTO extends BaseEntityDTO {
  title: string;
  description: string;
  // ... autres champs
}

// DTOs de création/mise à jour
export interface CreateProjectDTO extends Omit<ProjectDTO, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {}
```

### 4. **Transformers Centralisés**
```typescript
// src/dtos/transforms/materialTransform.ts
export const materialTransformers: Transformer<MaterialEntity, MaterialDTO> = {
  toDTO: (entity) => ({ ... }),
  fromDTO: (dto) => ({ ... }),
  validate: (dto) => ({ ... })
};
```

## 🚀 **Migration Plan**

### Phase 1: **Consolidation**
1. Créer `src/dtos/entities/`
2. Déplacer tous les DTOs existants
3. Résoudre les conflits de nommage

### Phase 2: **Standardisation**
1. Appliquer le pattern BaseEntityDTO
2. Créer les transformers unifiés
3. Ajouter les validations centralisées

### Phase 3: **Nettoyage**
1. Supprimer les anciens fichiers
2. Mettre à jour tous les imports
3. Valider l'architecture

## 📋 **Règles d'Or**

### ✅ **À Faire**
- **Un seul DTO par entité**
- **Centraliser dans `src/dtos/`**
- **Utiliser les transformers**
- **Hériter de BaseEntityDTO**
- **Valider au niveau DTO**

### ❌ **À Éviter**
- **Dupliquer les DTOs**
- **Importer depuis multiple sources**
- **Couplage direct avec Supabase**
- **Logique métier dans les DTOs**

## 🎯 **Avantages**

### ✅ **Maintenabilité**
- **Single Source of Truth**
- **Réutilisation maximale**
- **Consistance garantie**

### ✅ **Performance**
- **Tree-shaking optimisé**
- **Imports centralisés**
- **Moins de duplications**

### ✅ **Type Safety**
- **Interfaces unifiées**
- **Validation intégrée**
- **Transformers typés**

Cette approche garantit une **architecture hexagonale propre** avec **0 appels directs à Supabase** et une **réutilisation maximale** des DTOs !
