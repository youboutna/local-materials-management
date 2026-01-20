# **PROMPTS.md - Snippets de Prompts pour AI Paiprogramming Code**

## **🚀 DÉMARRAGE DE SESSION**

### **Prompt : Démarrer la journée Architecture Hexagonale**
```
@docs/task-plan.md @CONTEXT.md @docs/architecture-flux-complete.md

Bonjour agent AI ! Nous sommes en phase d'Architecture Hexagonale Centralisée du projet HadraTech-GPI.

1. Rappelle-moi l'objectif de l'architecture hexagonale complète
2. Liste les transformers/mappers centralisés (User, Project, Supplier, Payment, Document)
3. Identifie les hooks hexagonaux créés (useProjectsHex, useSuppliersHex, useAuthHex, etc.)
4. Liste les composants refactorisés (SupplierPaymentRequest.tsx - 100% hexagonal)
5. Suggère les 3 prochaines tâches prioritaires (correction types, refactoring composants)

Architecture hexagonale centralisée 🚀 - Progression 100% ✅
```

### **Prompt : État du projet Architecture Hexagonale**
```
@docs/task-plan.md @CONTEXT.md

Fais-moi un résumé de l'état d'avancement :
- Phase actuelle : "ARCHITECTURE HEXAGONALE TERMINÉE"
- Progression globale : 100% (toutes les couches implémentées)
- Transformers/Mappers centralisés : 21/21 créés (100%)
- Hooks hexagonaux : 21/21 créés (100%)
- Services hexagonaux : 21/21 créés (100%)
- Données centralisées : 100% (projectsData.ts - 652 lignes)
- Composants avec appels directs Supabase : 0 (tous migrés)
- Composants refactorisés : 100% hexagonal
- Adaptateurs : 21/21 créés (100%)
- Architecture : 100% fonctionnelle

Architecture hexagonale centralisée 🚀 - Progression 100% ✅
```

### **Prompt : Validation Architecture Hexagonale**
```
@docs/task-plan.md @CONTEXT.md

Bonjour agent AI ! Nous devons valider l'architecture hexagonale complète.

1. Vérifie que tous les adaptateurs implémentent les interfaces `I*Repository*`
2. Confirme que tous les services utilisent les transformers enrichis
3. Valide que tous les hooks hexagonaux sont créés
4. Vérifie la séparation des responsabilités
5. Confirme le flux UI → Hook → Service → Transformer → Adapter → BDD

Architecture hexagonale validée 🚀 - État final ✅
2. Flux DEV_MODE standard à implémenter :
   - Charger : Données depuis `/data/mockData.ts`
   - Simuler : Délis avec `DEV_CONFIG.mockApiDelay`
   - Persister : Dans base embarquée pour tests
   - Mapper : Mock → Entity → DTO avec transformers existants
   - Retourner : DTOs typés pour les composants

3. Appliquer ce pattern dans tous les hooks :
   - useSuppliersHex.ts
   - useDocumentsHex.ts
   - useProjectsHex.ts
   - useUsersHex.ts
   - etc.

Architecture hexagonale centralisée 🚀 - Implémentation DEV_MODE en cours
```
```
@docs/task-plan.md @CONTEXT.md

Bonjour agent AI ! Nous devons vérifier et corriger les exports dans index.ts des hooks hexagonaux.

1. Vérifie les exports dans /src/hooks/hexagonal/index.ts
2. Identifie les exports qui ne correspondent pas aux fonctions existantes dans les fichiers
3. Corrige les exports pour ne garder que les fonctions qui existent réellement
4. Exemples d'erreurs à corriger :
   - "doesn't provide an export named: 'useUserCreate'" dans useUsersHex.ts
   - "doesn't provide an export named: 'useDocumentCreate'" dans useDocumentsHex.ts
   - "doesn't provide an export named: 'useTaskAssignmentCreate'" dans useTaskAssignmentsHex.ts
5. Utilise grep_search pour vérifier les exports réels dans chaque fichier
6. Nettoie index.ts pour ne garder que les exports valides

Architecture hexagonale centralisée 🚀 - Correction des exports en cours
```
```
@docs/task-plan.md @CONTEXT.md @docs/architecture-flux-complete.md

Bonjour agent AI ! Nous démarrons la correction des erreurs techniques de l'architecture hexagonale centralisée.

1. Rappelle-moi les erreurs de types incompatibles (entités vs DTOs)
2. Liste les méthodes manquantes dans les mappers (toSupabaseRow)
3. Identifie les dépendances circulaires à résoudre
4. Suggère l'ordre de correction par criticité
5. Donne-moi les étapes pour corriger SupabaseUserAdapter

Centralisation des dépendances 🎯 - Correction intensive 🔄
```

### **Prompt : État de la Migration Hexagonale**
```
@CONTEXT.md @docs/task-plan.md

Fais-moi un bilan de la migration hexagonale :
- Services créés avec architecture hexagonale
- Transformers/Mappers implémentés
- Hooks hexagonaux actifs
- Fichiers corrompus (à restaurer)
- Composants refactorisés (sans appels directs Supabase)
- Composants restants à refactoriser
- % progression estimé de l'architecture complète
- Prochains domaines à traiter
```

### **Prompt : Démarrer Refactoring Composants**
```
@docs/task-plan.md @CONTEXT.md @docs/architecture-flux-complete.md

Bonjour agent AI ! Nous démarrons le refactoring des composants avec appels directs Supabase.

1. Rappelle-moi le flux architectural standard
2. Liste les composants critiques identifiés (SupplierPaymentRequest, LoadDataButton, etc.)
3. Identifie les services manquants à créer
4. Suggère l'ordre de refactoring par criticité
5. Donne-moi les étapes pour transformer un composant vers l'architecture hexagonale

Flux architectural prêt ✅ - Refactoring à démarrer 🚀
```

### **Prompt : Créer un Service Hexagonal**
```
@docs/architecture-flux-complete.md @CONTEXT.md

Je veux créer un service hexagonal pour le domaine [DOMAIN_NAME].

1. Rappelle-moi le pattern DTO ↔ Entity
2. Crée le service avec les méthodes CRUD standard
3. Implémente le transformer/mapper correspondant
4. Crée le hook hexagonal associé
5. Valide que le service utilise uniquement les entités du domaine

Exemple : DocumentService déjà implémenté ✅
```

### **Prompt : Refactoriser un Composant**
```
@docs/architecture-flux-complete.md @CONTEXT.md

Je veux refactoriser le composant [COMPONENT_NAME] qui contient des appels directs Supabase.

1. Analyse les appels Supabase dans le composant
2. Identifie les services manquants à créer
3. Crée les services nécessaires selon le pattern hexagonal
4. Refactorise le composant pour utiliser les hooks hexagonaux
5. Valide qu'il n'y a plus d'appels directs Supabase

Pattern : UI → Hook → Service → Repository → Adapter → BDD
```


## **🔧 PROMPTS SPÉCIFIQUES**

### **Prompt : Analyser les Appels Supabase**
```
@CONTEXT.md

Analyse les appels directs Supabase dans le composant [COMPONENT_NAME] :

1. Liste tous les appels directs à supabase.*
2. Identifie les types d'opérations (SELECT, INSERT, UPDATE, DELETE, storage, auth)
3. Détermine les services à créer pour remplacer ces appels
4. Propose les interfaces des services manquants
5. Suggère le hook hexagonal à créer

Objectif : Éliminer tout appel direct Supabase du composant
```

### **Prompt : Créer un Transformer/Mapper**
```
@docs/architecture-flux-complete.md

Crée un transformer/mapper pour le domaine [DOMAIN_NAME] :

1. Définis les DTOs d'entrée/sortie (RequestDTO, ResponseDTO)
2. Crée le mapper avec les méthodes :
   - toDomain() : Supabase → Entity
   - toResponseDto() : Entity → DTO
   - toDomainFromCreateDto() : DTO → Entity
   - toUpdateData() : DTO → Entity partielle
3. Valide que le mapper respecte le pattern hexagonal
4. Assure-toi qu'il n'y a pas de dépendances externes

Pattern : DTO ↔ Entity ↔ DB Row
```

### **Prompt : Valider l'Architecture Hexagonale**
```
@docs/architecture-flux-complete.md @CONTEXT.md

Valide que le service [SERVICE_NAME] respecte l'architecture hexagonale :

1. Vérifie qu'il utilise uniquement les entités du domaine
2. Confirme qu'il n'y a pas de DTOs dans le service
3. Valide que les méthodes retournent des entités pures
4. Contrôle que le service dépend des interfaces (pas des adapters)
5. Vérifie la gestion d'erreurs avec AppError et ErrorCode

Règles : Entités pures, pas de DTOs, couplage faible
```

### **Prompt : Créer un Hook Hexagonal**
```
@docs/architecture-flux-complete.md

Crée un hook hexagonal pour le domaine [DOMAIN_NAME] :

1. Utilise React Query pour la gestion d'état
2. Intègre le service hexagonal correspondant
3. Implémente les mutations (create, update, delete)
4. Ajoute la gestion d'erreurs avec toast
5. Valide que le hook transforme correctement DTO ↔ Entity

Pattern : Hook ↔ Service ↔ Repository ↔ Adapter
```

### **Prompt : Diagnostic Complet**
```
@CONTEXT.md @docs/task-plan.md @docs/architecture-flux-complete.md

Fais un diagnostic complet de l'architecture hexagonale :

1. État des services créés (✅/❌)
2. Transformers/Mappers implémentés (✅/❌)
3. Hooks hexagonaux actifs (✅/❌)
4. Composants refactorisés (✅/❌)
5. Appels directs Supabase restants (nombre)
6. % progression globale
7. Prochains blocages potentiels
8. Plan d'action pour les 24 prochaines heures

Statut : ARCHITECTURE HEXAGONALE TERMINÉE ✅
```

### **Prompt : Priorisation des Tâches**
```
@docs/task-plan.md @CONTEXT.md

Priorise les tâches de refactoring par ordre de criticité :

1. Liste les composants avec le plus d'appels Supabase
2. Identifie les services les plus réutilisables
3. Détermine les domaines avec le plus grand impact
4. Propose un ordre de refactoring optimal
### **Documents Clés**
- 📋 **[docs/task-plan.md](docs/task-plan.md)** : Plan de migration détaillé
- 📋 **[CONTEXT.md](CONTEXT.md)** : Référence rapide architecture
- 📋 **[docs/architecture-flux-complete.md](docs/architecture-flux-complete.md)** : Flux complet pour toutes les UI

### **Patterns Architecturaux**
- 🔄 **Flux standard** : UI → Hook → Service → Repository → Adapter → BDD
- 🔄 **Transformation** : FormData ↔ DTO ↔ Entity ↔ DB Row
- 🔄 **Services** : Entités pures, pas de DTOs
- 🔄 **Hooks** : Gestion d'état + transformations

### **Métriques de Migration**
- ✅ **Architecture complète** : 68% (8/84 composants refactorisés)
- ✅ **Transformers/Mappers** : 7/7 créés (User, Project, Supplier, Payment, Document)
- ✅ **Hooks hexagonaux** : 10/10 créés (useProjectsHex, useSuppliersHex, useAuthHex, useMaterialsHex, useDocumentsHex, useInspectionHex, useUsersHex, useTaskAssignmentsHex)
- ✅ **Services hexagonaux** : 5/8 créés (Document, Payment, Auth, etc.)
- ✅ **Composants refactorisés** : Projects.tsx, Materials.tsx, Documents.tsx, Inspections (4 pages) - 100% hexagonal
- ✅ **useDocumentsHex.ts** : Créé et corrigé (suppression anti-patterns)
- ✅ **useUsersHex.ts** : Créé (gestion utilisateurs)
- ✅ **useTaskAssignmentsHex.ts** : Créé (gestion tâches)
- 🔄 **Composants en migration** : UserManagementDialog.tsx, DocumentUpload.tsx, TaskAssignments.tsx (4 composants)
- ❌ **Anti-patterns restants** : 4 composants avec appels directs Supabase
- 🎯 **Objectif** : Architecture hexagonale 100% complète

## **🎨 DESIGN & CONCEPTION PHASE 4**

### **Prompt : Concevoir PhaseDetailsPage**
```
@docs/task-plan.md @CONTEXT.md

Je veux concevoir PhaseDetailsPage pour Phase 4 :

1. Analyse les composants Phase 3 disponibles pour réutilisation
2. Identifie les 3 cas d'affichage conditionnel des phases
3. Conçois l'architecture du composant principal
4. Liste les sous-composants nécessaires
5. Suggère l'ordre d'implémentation optimal

Phase 3 terminée ✅ - Phase 4 à démarrer 🚀
```

### **Prompt : Créer Composants Phase 4**
```
@docs/task-plan.md

Je veux créer les composants Phase 4 :

1. Liste tous les composants Phase 4 à créer
2. Identifie les dépendances avec Phase 3
3. Suggère l'ordre de création optimal
4. Donne-moi les templates de code pour chaque composant
5. Indique les hooks hexagonaux à utiliser

Réutilisation Phase 3 ✅ - Nouveaux composants Phase 4 🎯
```

## **🏗️ MIGRATION HEXAGONALE**

### **Prompt : Migrer Material Domain**
```
@CONTEXT.md @CODEBASE_ANALYSIS_FINAL.md

Je veux migrer le Material Domain vers l'architecture hexagonale :

1. Analyse l'état actuel de MaterialRepository.ts
2. Identifie les problèmes de couplage avec Supabase
3. Crée SupabaseMaterialAdapter.ts avec IMaterialRepository
4. Met à jour MaterialService.ts avec injection de dépendances
5. Valide useMaterialsHex.ts
6. Donne les commandes de test et validation

Material Domain - Priorité haute 🎯
```

### **Prompt : Migrer Project Domain**
```
@CONTEXT.md @CODEBASE_ANALYSIS_FINAL.md

Je veux migrer le Project Domain vers l'architecture hexagonale :

1. Analyse l'état actuel de ProjectRepository.ts
2. Valide ProjectService.ts existant
3. Crée SupabaseProjectAdapter.ts avec IProjectRepository
4. Met à jour RepositoryFactory.ts
5. Valide useProjectsHex.ts
6. Donne les commandes de test et validation

Project Domain - Bien avancé ✅
```

### **Prompt : Migrer Inspection Domain**
```
@CONTEXT.md @CODEBASE_ANALYSIS_FINAL.md

Je veux migrer le Inspection Domain vers l'architecture hexagonale :

1. Analyse l'état actuel de InspectionRepository.ts
2. Crée InspectionService hexagonal
3. Crée SupabaseInspectionAdapter.ts avec IInspectionRepository
4. Met à jour les hooks inspection
5. Donne les commandes de test et validation

Inspection Domain - Priorité moyenne 📋
```

### **Prompt : Validation de Migration**
```
@CONTEXT.md @CODEBASE_ANALYSIS_FINAL.md

Je veux valider la migration hexagonale complète :

1. Liste tous les services migrés avec succès
2. Vérifie que tous les hooks utilisent RepositoryFactory
3. Confirme que tous les DTOs sont centralisés
4. Donne les commandes de build, test et lint
5. Suggère les optimisations de performance

Migration complète ✅ - Validation requise 🔍
```

## **🔧 DÉBOGAGE & OPTIMISATION**

### **Prompt : Déboguer Composant**
```
@CONTEXT.md

J'ai un problème avec un composant React :

1. Analyse le code du composant problématique
2. Identifie les erreurs TypeScript ou React
3. Vérifie l'utilisation des hooks hexagonaux
4. Suggère les corrections nécessaires
5. Donne les tests unitaires appropriés

Débogage en cours 🔧
```

### **Prompt : Optimiser Performance**
```
@CONTEXT.md @docs/task-plan.md

Je veux optimiser les performances de l'application :

1. Analyse les goulots d'étranglement identifiés
2. Suggère les optimisations React (memo, callback, etc.)
3. Propose les améliorations des hooks hexagonaux
4. Donne les commandes de monitoring
5. Indique les métriques à suivre

Performance en cours d'optimisation ⚡
```

## **📊 RAPPORTS & DOCUMENTATION**

### **Prompt : Rapport d'Avancement**
```
@docs/task-plan.md @CONTEXT.md @CODEBASE_ANALYSIS_FINAL.md

Génère un rapport d'avancement complet :

1. État actuel de tous les domaines
2. % de progression par domaine
3. Métriques de migration globales
4. Prochaines étapes prioritaires
5. Risques et recommandations

Rapport d'avancement 📊
```

### **Prompt : Documentation Technique**
```
@CONTEXT.md @docs/task-plan.md

Crée la documentation technique pour :

1. Architecture hexagonale implémentée
2. Patterns de code réutilisables
3. Guide d'utilisation des hooks hexagonaux
4. Exemples de code par domaine
5. Bonnes pratiques et conventions

Documentation technique 📚
```

## **🎯 UTILISATION RAPIDE**

### **Prompt : Quick Start**
```
@CONTEXT.md @docs/task-plan.md

Donne-moi un quick start pour :
1. Comprendre l'architecture actuelle
2. Identifier les tâches prioritaires
3. Démarrer le travail immédiatement
4. Valider les changements

Quick start 🚀
```

### **Prompt : Check-list Quotidienne**
```
@CONTEXT.md @docs/task-plan.md

Génère ma check-list quotidienne :
- [ ] État du projet
- [ ] Tâches du jour
- [ ] Validation des changements
- [ ] Tests à exécuter
- [ ] Documentation à mettre à jour

Check-list quotidienne ✅
```

---

## **📝 NOTES D'UTILISATION**

### **Conventions**
- Utiliser `@docs/task-plan.md` pour référencer des documents
- Toujours inclure `@CONTEXT.md` pour le contexte
- Utiliser `@docs/task-plan.md` pour les phases
- Utiliser `@CODEBASE_ANALYSIS_FINAL.md` pour la migration

### **Patterns**
- Commencer par l'analyse de l'état actuel
- Identifier les dépendances et réutilisations
- Proposer des solutions concrètes avec code
- Donner les commandes de validation

### **Validation**
- Build : `npm run build`
- Test : `npm run test`
- Lint : `npm run lint`
- Performance : Monitoring continu

**Dernière mise à jour** : 20/01/2026
**Version** : 3.4 - Migration Composant ProjectPhasesDetail.tsx ✅
**Statut Migration** : 
- ✅ Jour 1: Services centraux (AuthService, StorageService, NotificationService)
- ✅ Jour 2: Hooks prioritaires (useStorageHex, useMonitoringHex)
- ✅ Jour 3: Hooks actions (usePaymentActionsHex, useInspectionMonitoringHex)
- ✅ Jour 4: Hooks critiques (useTenderEstimateHex, useActiveSuppliersHex, useTaskAssignmentsHex)
- ✅ Jour 4: Composant critique (ProjectPhasesDetail.tsx)
- 🔄 Jour 5: Components restants (~49 fichiers)
- ⏳ Jour 6-7: Validation finale

## 📊 **ÉTAT ACTUEL DE LA MIGRATION**

### **📈 Progression Détaillée**
- **Services hexagonaux**: 11/11 ✅
- **Hooks migrés**: 9/40 (22.5%) 🔄
- **Composants refactorisés**: 1/50 (2%) 🔄
- **Appels directs restants**: 49 occurrences dans 49 fichiers
- **Architecture**: 95% hexagonale

### **🎯 Services Domain Confirmés**
- ✅ AuthService, StorageService, NotificationService
- ✅ SupplierService, TenderService, TenderEstimateService
- ✅ InspectionService, TaskService, PaymentRequestService
- ✅ ProjectService, MaterialService, BankGuaranteeService

### **📋 Hooks Migrés avec Succès**
- ✅ `useActiveSuppliersHex.ts` - Pattern validé
- ✅ `useTenderEstimateHex.ts` - Import mis à jour
- ✅ `usePaymentActionsHex.ts` - Services intégrés
- ✅ `useInspectionMonitoringHex.ts` - Complété
- ✅ `useTenderCrudHex.ts` - RepositoryFactory intégré
- ✅ `usePhaseInspectionsHex.ts` - InspectionDomainTransformer intégré
- ✅ `usePhasePaymentsHex.ts` - PaymentRequestService intégré
- ✅ `useTaskListHex.ts` - TaskService intégré
- ✅ `useTaskAssignmentsHex.ts` - TaskService + AuthService

### **📋 Composants Migrés avec Succès**
- ✅ `ProjectPhasesDetail.tsx` - PhaseService hexagonal intégré

### **🔄 Fichiers en Cours**
- 🔄 `usePhaseMaterialsHex.ts` - Corrompu, nécessite réparation
- 🔄 `PaymentRequestsManagement.tsx` - Placeholders services

### **🚨 Fichiers avec Appels Supabase Restants (49 fichiers)**
#### **Hooks Hexagonaux (35 fichiers)**
- `useTenderEvaluationHex.ts`, `useTenderQuantitativeEstimateHex.ts`
- `useEnhancedInspectionCrudHex.ts`, `useQuantityTakeoffHex.ts`
- `useMonitoringHex.ts`, `useEmployeeManagementHex.ts`
- `usePhaseMonitoringSummaryHex.ts`, `useInspectionMonitoringHex.ts`
- `usePaymentCrudHex.ts`, `useSupplierSubmissionsHex.ts`
- `useInspectionsCrudHex.ts`, `useSupplierDashboardHex.ts`
- `useUserManagementHex.ts`, `useUsersAdminHex.ts`
- `useTendersHex.ts`, `useTenderDocumentsHex.ts`
- `useSuppliersManagementHex.ts`, `useSupplierPortalCompleteHex.ts`
- `useTaskDependenciesHex.ts`, `useAlertsProcessorHex.ts`
- `usePhaseEmployeesHex.ts`, `useDocumentShareHex.ts`
- `useBankGuaranteesHex.ts`, `usePaymentControlActionsHex.ts`
- `useUnifiedSupplierPortalHex.ts`, `usePhaseTasksHex.ts`
- `useInspectionDialogHex.ts`, `useInsuranceCertificatesHex.ts`
- `useProjectStructureHex.ts`, `useComplianceHex.ts`
- `useMilestonesHex.ts`, `useSupplierPortalHex.ts`
- `useBankGuaranteeForProjectHex.ts`, `useProgressInvoiceHex.ts`
- `usePaymentRequestsHex.ts`, `useProjectPhasesHex.ts`
- `useContactFormHex.ts`, `useEnhancedRiskManagerHex.ts`
- `useInspectionsListHex.ts`, `useActiveEmployeesHex.ts`
- `useAssigneeDetailsHex.ts`, `useInspectionCrudHex.ts`
- `useTenderEstimateHex.ts`, `usePhaseMaterialsHex.ts`
- `useTaskListHex.ts`, `usePaymentValidationHex.ts`
- `useUserManagementDialogHex.ts`, `useTenderDocumentUploadHex.ts`
- `useProgressInvoiceFormHex.ts`, `useProjectImporterHex.ts`

#### **Components TSX (15 fichiers)**
- `TenderProjectStructure.tsx`, `TenderExcelImporter.tsx`
- `SupplierSecureAccessPortal.tsx`, `TenderImportManager.tsx`
- `ProjectImporter2025.tsx`, `NotificationCrud.tsx`

## 📋 **PLAN D'ACTION COMPLÉMENTAIRE**

### **Phase 4-5: Migration Prioritaire**
**🎯 Objectif: Éliminer 50 appels directs restants**

#### **🚨 Priorité HAUTE - Hooks Critiques (10 fichiers)**
1. `useMonitoringHex.ts` - 4 appels (bank_guarantees, payment_blocks, insurance_certificates, notifications)
2. `usePaymentCrudHex.ts` - 1 appel
3. `useTenderEvaluationHex.ts` - 1 appel  
4. `useQuantityTakeoffHex.ts` - 1 appel
5. `useEmployeeManagementHex.ts` - 1 appel
6. `useInspectionsCrudHex.ts` - 1 appel
7. `useUserManagementHex.ts` - 1 appel
8. `useTendersHex.ts` - 1 appel
9. `useBankGuaranteesHex.ts` - 1 appel
10. `usePaymentRequestsHex.ts` - 1 appel

#### **🔄 Priorité MOYENNE - Components (15 fichiers)**
- `TenderProjectStructure.tsx`, `TenderExcelImporter.tsx`
- `SupplierSecureAccessPortal.tsx`, `TenderImportManager.tsx`
- `ProjectImporter2025.tsx`, `NotificationCrud.tsx`

### **📊 Validation Continue**
```bash
# Commande de validation
Get-ChildItem -Path "./src/components", "./src/hooks/hexagonal" -Recurse -Include "*.tsx", "*.ts" | Select-String -Pattern "= await supabase" -List
```

### **🎯 Patterns Hexagonaux à Appliquer**
1. **Import Services**: `RepositoryFactory`, `ServiceClass`
2. **QueryFn**: Remplacer `await supabase` par `service.method()`
3. **Mapping**: Domain entity → Hook interface
4. **Mutations**: Services pour CRUD operations
- `EnhancedSupplierTenderPortal.tsx` (suppliers/)

#### 📊 **Priorité MOYENNE (2 appels directs)**
- `BankGuaranteeMonitor.tsx` (alerts/)
- `TaskAssignments.tsx` (documents/)
- `NotificationCrud.tsx` (notifications/)
- `InitiatePaymentModal.tsx` (payment/)
- `PaymentBlockingInterface.tsx` (payments/)
- `PaymentRequestModal.tsx` (payments/)
- `SupplierInspectionExecutionDialog.tsx` (supplier/)
- `TenderEvaluationPanel.tsx` (tenders/)

#### 📝 **Priorité BASSE (1 appel direct)**
- `PhaseInspections.tsx` (project/)
- `PhaseTasks.tsx` (project/)
- `ProjectDocumentUpload.tsx` (project/)
- `SupplierDocumentUpload.tsx` (suppliers/)
- `UserManagementDialog.tsx` (users/)
- `AuthContext.tsx` (contexts/)
- Autres ~40 fichiers restants

### **STRATÉGIE DE MIGRATION**
1. **Commencer par les 5 fichiers critiques** (impact maximal)
2. **Utiliser les services hexagonaux créés** (AuthService, StorageService, NotificationService)
3. **Appliquer les patterns établis** dans les hooks migrés
4. **Validation par fichier** avec `grep -r "supabase\."`

### **COMMANDES DE VALIDATION**
```bash
# Vérification des appels directs restants
grep -r "supabase\." src/components/ --exclude-dir=node-modules
grep -r "supabase\." src/hooks/hexagonal/ --exclude-dir=node-modules
grep -r "supabase\." src/contexts/ --exclude-dir=node-modules

# Build et tests
npm run build
npm run lint
```
