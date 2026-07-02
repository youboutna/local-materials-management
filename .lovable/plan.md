# Plan — Suppression du code legacy

Cible : retirer les wrappers, alias et champs snake_case laissés « pour compatibilité » quand la logique cible est déjà implémentée ailleurs (règle PROMPTS.md §Zéro imports `@/services/*` legacy + Core memory : `src/services` & `src/types` = legacy readonly, ne doivent plus être importés).

## Périmètre — à supprimer

### 1. Wrappers / alias devenus inutiles
- `src/infrastructure/transformers/SupplierMapper.ts` (délègue 1-pour-1 à `SupplierTransformer`) → supprimer, migrer les 2 imports vers `@/dtos/transforms/SupplierTransformer`.
- `src/components/location/LocationSelector.tsx` (ré-export nu de `UnifiedLocationSelector`) → supprimer, remplacer imports par `UnifiedLocationSelector`.
- `src/components/location/EnhancedLocationSelector.tsx` (même alias) → supprimer, migrer imports.
- `src/application/services/TenderServiceSimple.ts` (duplique `TenderService.getProjectTenders`) → supprimer si aucun consommateur ; sinon fusionner dans `TenderService`.

### 2. Champs snake_case « backward compatibility » dans les DTO/entités camelCase
- `src/types/tender.entity.ts` : blocs `Legacy snake_case for backward compatibility` (Tender + TenderSubmission) → supprimer, adapter les rares lecteurs restants à camelCase.
- `src/components/documents/DocumentDetails.tsx` : interface locale avec doublons snake_case → garder uniquement camelCase (le transformer fournit déjà les deux).

### 3. Méthodes « Legacy Compatibility » dans services applicatifs
- `SupplierService` (`getAllSuppliersAsDTO`, `getSupplierByIdAsDTO`, `searchSuppliersAsDTO`, `getActiveSuppliersAsDTO`, `createSupplierFromDTO`, `updateSupplierFromDTO`) : ces méthodes dupliquent les méthodes standard + `SupplierTransformer.toDTO`. Supprimer et pointer les appelants vers l'API canonique.
- `DashboardService` méthodes marquées « Legacy compatibility method from MonitoringService » → supprimer si non appelées, sinon renommer proprement.
- `TenderService` : 7 méthodes marquées « Legacy compatibility method from TenderSharingService » → audit d'usage, supprimer les orphelines.
- `DocumentService.getProjectDocuments` static wrapper → supprimer, appelants utilisent l'instance.
- `BankGuaranteeActionService.create` static → supprimer si non consommé.

### 4. Imports résiduels vers `@/services/*` (hors fichier legacy lui-même)
Fichiers à nettoyer :
- `src/utils/httpMetricsCollector.ts`
- `src/hooks/useProjectManager.ts`
- `src/hooks/useHttpHandler.ts`
- `src/hooks/useDocumentStorage.ts`
- `src/application/services/TenderSubmissionService.ts`
- `src/config/referentials/index.ts` (aliases DTO backward compat)

Remplacement : équivalent hexagonal dans `src/application/services` + `src/dtos`. Si l'équivalent n'existe pas encore, on ne supprime pas dans ce lot (hors périmètre « logique déjà implémentée »).

### 5. Divers
- `src/domain/repositories/IBankGuaranteeRepository.ts` : méthode `@deprecated` `getByProject(id)` → supprimer si toutes les implémentations utilisent la variante `getByProject(id, options)`.
- `src/domain/repositories/IHierarchyRepository.ts` : bloc « Legacy Operations » → supprimer les méthodes non utilisées.
- `src/hooks/useUserRoles.ts`, `src/hooks/useEnhancedTaskAssignment.ts`, `src/hooks/useAuditEntries.ts` : commentaires « legacy interface » — vérifier consommateurs, aligner types sur DTO canonique.
- `src/types/entities.ts` : structures « Legacy custom stage/task from ConstructionPhaseManager » → supprimer si `ConstructionPhaseManager` a bien migré vers le workflow unifié.
- `src/types/supplier.ts` : interface `SupplierLegacy` → supprimer.

## Hors périmètre (on ne touche pas)
- Fichiers protégés `src/services/*` et `src/types/*` : lecture seule (Core memory). On ne modifie pas, on retire seulement les **imports** depuis le code hexagonal.
- Références snake_case reflétant la DB dans adapters/transformers : légitimes, à conserver.
- `enhancedActionService` : namespace static utilisé activement — conserver après vérification d'usage.

## Méthode d'exécution (par lot, typecheck entre chaque)

1. **Lot A — Alias inertes** : supprimer `SupplierMapper`, `LocationSelector`, `EnhancedLocationSelector`, `TenderServiceSimple` ; migrer imports.
2. **Lot B — Champs snake_case DTO** : nettoyer `tender.entity.ts`, `DocumentDetails.tsx`, aligner consommateurs.
3. **Lot C — Méthodes Legacy Compatibility** : audit d'usage (`rg`), suppression des orphelines dans `SupplierService`, `DashboardService`, `TenderService`, `DocumentService`, `BankGuaranteeActionService`.
4. **Lot D — Imports `@/services/*`** : remplacement par équivalents hexagonaux là où ils existent ; consigner les manquants dans `.lovable/plan.md`.
5. **Lot E — Interfaces & repositories** : suppression des blocs `@deprecated` / `Legacy Operations` sans consommateur.

## Validation
- `tsgo` vert après chaque lot.
- `rg "backward compat|Legacy|@deprecated"` doit décroître significativement.
- Aucun import `from '@/services/'` restant hors des fichiers legacy eux-mêmes.
- Smoke test manuel : liste projets, détail projet, tenders, matériaux.

## Livrable
Rapport final listant : fichiers supprimés, imports migrés, méthodes retirées, résidus assumés (avec justification).
