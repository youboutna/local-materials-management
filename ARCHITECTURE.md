# Architecture du Projet

## Vue d'ensemble

Ce projet suit une architecture en couches avec séparation des responsabilités pour garantir la maintenabilité, la testabilité et la scalabilité.

## Structure des Couches

```
┌─────────────────────────────────────────┐
│         Components (UI Layer)           │
│  - Présentation visuelle                │
│  - Gestion des événements utilisateur   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Services (Business Layer)      │
│  - Logique métier                       │
│  - Orchestration des opérations         │
│  - Transformations complexes            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Repositories (Data Layer)        │
│  - Accès aux données (Supabase)         │
│  - CRUD operations                      │
│  - Gestion des erreurs de base          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Mappers (Transformation)        │
│  - Entity → DTO                         │
│  - DTO → Entity                         │
│  - Normalisation des données            │
└─────────────────────────────────────────┘
```

## Modules Refactorisés

### 1. Projects
- **Entity**: `src/types/project.entity.ts`
- **Repository**: `src/services/ProjectRepository.ts`
- **Service**: `src/services/ProjectService.ts`
- **Mapper**: `src/services/EntityToDTOMapper.ts`

### 2. Inspections
- **Entity**: Types définis dans entities
- **Repository**: `src/services/InspectionRepository.ts`
- **Service**: `src/services/InspectionService.ts`
- **Mapper**: `src/services/EntityToDTOMapper.ts`

### 3. Tenders
- **Entity**: `src/types/tender.entity.ts`
- **Repository**: `src/services/TenderRepository.ts`
- **Service**: `src/services/TenderService.ts`
- **Mapper**: `src/services/EntityToDTOMapper.ts`

### 4. Bank Guarantees
- **Entity**: `src/types/bankGuarantee.entity.ts`
- **Repository**: `src/services/BankGuaranteeRepository.ts`
- **Service**: `src/services/bankGuaranteeService.ts`

### 5. Insurance
- **Entity**: `src/types/insurance.entity.ts`
- **Repository**: `src/services/InsuranceRepository.ts`
- **Service**: `src/services/insuranceCertificateService.ts`

### 6. Materials
- **Entity**: `src/types/material.entity.ts`
- **Repository**: `src/services/MaterialRepository.ts`

## Conventions de Nommage

### Entities
- Suffixe: `Entity`
- Exemple: `ProjectEntity`, `InspectionEntity`
- Représentent les structures de données brutes de la base de données

### DTOs (Data Transfer Objects)
- Pas de suffixe spécifique
- Exemple: `Project`, `Inspection`
- Représentent les données formatées pour l'UI

### Repositories
- Suffixe: `Repository`
- Pattern: Class statique avec méthodes CRUD
- Exemple: `ProjectRepository.getById()`

### Services
- Suffixe: `Service`
- Contiennent la logique métier
- Exemple: `ProjectService.createProject()`

## Gestion des Erreurs

### AppError
Classe centralisée pour toutes les erreurs applicatives :

```typescript
import { AppError, ErrorCode } from '@/utils/errorHandling';

throw new AppError(
  ErrorCode.DATABASE_ERROR,
  'Failed to fetch project',
  originalError,
  { projectId: '123' }
);
```

### Codes d'Erreur
- `VALIDATION_ERROR`: Données invalides
- `NOT_FOUND`: Ressource introuvable
- `UNAUTHORIZED`: Authentification requise
- `FORBIDDEN`: Accès interdit
- `DATABASE_ERROR`: Erreur de base de données
- `NETWORK_ERROR`: Erreur de connexion
- `INTERNAL_ERROR`: Erreur interne
- `BUSINESS_RULE_VIOLATION`: Règle métier violée
- `INSUFFICIENT_PERMISSIONS`: Permissions insuffisantes

### Utilitaires
- `ErrorLogger.log()`: Logging structuré
- `handleAsync()`: Wrapper pour gestion async
- `validateRequired()`: Validation de champs requis
- `retryOnError()`: Retry avec backoff exponentiel

## Stratégies de Test

### Tests Unitaires
Location: `src/**/__tests__/*.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('RepositoryName', () => {
  it('should perform operation', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await Repository.method(input);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Couverture de Tests
- Repositories: CRUD operations + error handling
- Services: Logique métier + transformations
- Utilities: Fonctions pures + edge cases

### Commandes
```bash
# Lancer les tests
npm run test

# Avec couverture
npm run test:coverage

# Mode watch
npm run test:watch
```

## Best Practices

### 1. Séparation des Responsabilités
- **Components**: Ne doivent jamais appeler Supabase directement
- **Services**: Logique métier uniquement, pas de SQL brut
- **Repositories**: Accès données uniquement, pas de logique métier

### 2. Gestion d'Erreurs
- Toujours utiliser `AppError` pour les erreurs métier
- Logger les erreurs avec contexte
- Fournir des messages utilisateur clairs

### 3. Type Safety
- Utiliser des types stricts (Entity vs DTO)
- Éviter `any`, préférer `unknown` si nécessaire
- Interfaces pour tous les objets complexes

### 4. Async/Await
- Toujours gérer les erreurs dans try/catch
- Utiliser `handleAsync()` pour pattern cohérent
- Éviter les promesses non gérées

### 5. Réutilisabilité
- Mapper centralisé pour transformations
- Utilitaires partagés dans `/utils`
- Hooks React pour logique UI partagée

## Prochaines Étapes

1. Continuer la migration des modules restants vers le pattern Repository
2. Augmenter la couverture de tests (objectif: >80%)
3. Implémenter des tests d'intégration pour flux critiques
4. Ajouter monitoring et logging structuré
5. Optimiser les performances avec caching stratégique
