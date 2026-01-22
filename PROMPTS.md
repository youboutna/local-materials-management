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
- Phase actuelle : "ARCHITECTURE HEXAGONALE EN COURS"
- Progression globale : 85% (fondations établies, migration en cours)
- Services hexagonaux : 31/31 créés (100%)
- RepositoryFactory : 100% configuré avec tous les singletons
- Adapters critiques : InspectionScheduling, ParsedInvoice (100%)
- Hooks migrés : 10+/40 (25%+) 🔄
- Appels directs Supabase : 1028 appels identifiés dans 216 fichiers
- Architecture : 85% hexagonale, migration active
- DEV_MODE : Intégré avec localStorage adapter
- Types et DTOs : Centralisés et sans dépendances cycliques

Architecture hexagonale centralisée 🚀 - Progression 85% ✅
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

### **Prompt : Analyse Complète de l'État de Migration Hexagonale**
```
@docs/task-plan.md

Je veux analyser l'état complet de la migration hexagonale pour tous les fichiers listés par l'utilisateur.

**📋 Fichiers à analyser :**
- Services : AutomaticDecompteCalculator.ts, CheckpointActionContextService.ts, CheckpointVerificationEngine.ts, InspectionExecutionService.ts, MilestoneService.ts, PVGeneratorService.ts, TenderServiceLegacy.ts, WorkflowOrchestrator.ts
- Components : Tous les fichiers TSX listés (admin, alerts, auth, documents, insurance, materials, notifications, payment, project, reports, suppliers, tenders, users, workflow, workspace)
- Hooks : Tous les fichiers TS listés (use*, y compris hexagonal)

**🎯 Actions requises :**
1. **Analyser chaque fichier** pour les appels directs `supabase.`
2. **Compter les appels** par fichier et par catégorie (services, components, hooks)
3. **Identifier les services** à utiliser pour chaque migration
4. **Classer par priorité** (nombre d'appels)
5. **Mettre à jour docs/task-plan.md** avec les résultats complets

**📊 Format de sortie attendu :**
- Tableau récapitulatif par type de fichier
- Nombre total d'appels directs
- Pourcentage de migration
- Plan d'action priorisé
- Services cibles pour chaque fichier

**🚨 CONTRAINTES :**
- Analyser TOUS les fichiers listés
- Compter précisément les appels directs
- Proposer des services hexagonaux existants
- Respecter l'architecture hexagonale
```
```
@docs/task-plan.md @CONTEXT.md

Je veux migrer les DTOs critiques depuis `/types/*-dto` vers `dtos/entities/` pour débloquer la migration des services legacy.

**📋 Fichiers à migrer (Priorité ABSOLUE) :**
1. **`checkpoint-dto.ts`** - 357 lignes (AutomaticDecompteDTO, DecompteLineDTO, CheckpointDTO, VerificationItemDTO)
2. **`milestone-dto.ts`** - Types pour jalons (MilestoneDTO)
3. **`phase-dto.ts`** - Types pour phases

**🎯 Actions requises :**
1. **Créer les DTOs** dans `src/dtos/entities/`
   - AutomaticDecompteDTO.ts
   - DecompteLineDTO.ts  
   - CheckpointDTO.ts
   - VerificationItemDTO.ts
   - CheckpointVerificationResultDTO.ts
   - MilestoneDTO.ts

2. **Créer les transformers** dans `src/dtos/transforms/`
   - DecompteDomainTransformer.ts
   - CheckpointDomainTransformer.ts
   - MilestoneDomainTransformer.ts

3. **Mettre à jour les imports**
   - IDecompteRepository : utiliser `@/dtos/entities`
   - SupabaseDecompteAdapter : corriger les types

4. **Ajouter aux exports**
   - src/dtos/entities/index.ts

**🚨 CONTRAINTES :**
- PAS de dépendances cycliques entre les DTOs
- Types forts pour toutes les propriétés
- Respecter l'architecture hexagonale
- Utiliser les transformers pour les conversions

**📊 Validation :**
- Tous les DTOs migrés vers `dtos/entities/`
- Imports fonctionnels dans IDecompteRepository
- Services legacy prêts à être refactorisés
```

### **Prompt : Analyse Complète de l'État de Migration Hexagonale**
```
@docs/task-plan.md

Je veux analyser l'état complet de la migration hexagonale pour tous les fichiers listés par l'utilisateur.

**📋 Fichiers à analyser :**
- Services : AutomaticDecompteCalculator.ts, CheckpointActionContextService.ts, CheckpointVerificationEngine.ts, InspectionExecutionService.ts, MilestoneService.ts, PVGeneratorService.ts, TenderServiceLegacy.ts, WorkflowOrchestrator.ts
- Components : Tous les fichiers TSX listés (admin, alerts, auth, documents, insurance, materials, notifications, payment, project, reports, suppliers, tenders, users, workflow, workspace)
- Hooks : Tous les fichiers TS listés (use*, y compris hexagonal)

**🎯 Actions requises :**
1. **Analyser chaque fichier** pour les appels directs `supabase.`
2. **Compter les appels** par fichier et par catégorie (services, components, hooks)
3. **Identifier les services** à utiliser pour chaque migration
4. **Classer par priorité** (nombre d'appels)
5. **Mettre à jour docs/task-plan.md** avec les résultats complets

**📊 Format de sortie attendu :**
- Tableau récapitulatif par type de fichier
- Nombre total d'appels directs
- Pourcentage de migration
- Plan d'action priorisé
- Services cibles pour chaque fichier

**🚨 CONTRAINTES :**
- Analyser TOUS les fichiers listés
- Compter précisément les appels directs
- Proposer des services hexagonaux existants
- Respecter l'architecture hexagonale
```

### **Prompt : Migration Components Critiques (Phase 3)**
```
@docs/task-plan.md

Je veux migrer les components React critiques qui ont des appels directs Supabase.

**📋 Components Critiques à migrer (Priorité HAUTE) :**
1. **DeploymentSettings.tsx** - 3 appels directs
2. **BusinessDocuments.tsx** - 3 appels directs
3. **EnhancedDocumentSharing.tsx** - 2 appels directs
4. **UnifiedInsuranceManager.tsx** - 2 appels directs
5. **EnhancedSupplierTenderPortal.tsx** - 2 appels directs
6. **OAuthConfigGuide.tsx** - 2 appels directs
7. **PasswordResetHandler.tsx** - 2 appels directs
8. **PhaseInspections.tsx** - 2 appels directs

**🎯 Actions requises :**
1. **Analyser chaque component** pour identifier les appels `supabase.`
2. **Remplacer par les services hexagonaux** appropriés :
   - AuthService pour authentification
   - StorageService pour stockage
   - DocumentService pour documents
   - InspectionService pour inspections
   - SettingsService pour configuration
3. **Créer les hooks personnalisés** si nécessaire
4. **Maintenir l'UI/UX** existante
5. **Ajouter au RepositoryFactory** si besoin

**📊 Validation :**
- Plus aucun appel direct `supabase.` dans les components
- Components utilisent les services hexagonaux
- Tests passent avec les nouveaux services
- UI/UX préservée

**🚨 CONTRAINTES :**
- PAS d'appels directs Supabase dans les components
- Utiliser les services existants (AuthService, StorageService, etc.)
- Créer seulement si service inexistant
- Respecter les patterns hexagonaux
```

### **Prompt : Migration Hooks Critiques (Phase 4)**
```
@docs/task-plan.md

Je veux migrer les hooks hexagonaux critiques qui ont des appels directs Supabase.

**📋 Hooks Critiques à migrer (Priorité HAUTE) :**
1. **usePhaseDetails.ts** - 6 appels directs
2. **useSupplierPortalCompleteHex.ts** - 6 appels directs
3. **usePaymentCrudHex.ts** - 5 appels directs
4. **useUserManagementHex.ts** - 5 appels directs

**🎯 Actions requises :**
1. **Analyser chaque hook** pour identifier les appels `supabase.`
2. **Remplacer par les services hexagonaux** :
   - PhaseService pour les données de phases
   - MaterialService pour les matériaux
   - InspectionService pour les inspections
   - PaymentService pour les paiements
   - AuthService pour l'authentification
3. **Utiliser RepositoryFactory** pour obtenir les services
4. **Maintenir les signatures** des hooks existants
5. **Transformer les données** avec les DTOs appropriés

**📊 Validation :**
- Plus aucun appel direct `supabase.` dans les hooks
- Hooks utilisent les services hexagonaux
- Les transformations DTO sont correctes
- Les hooks retournent les mêmes types

**🚨 CONTRAINTES :**
- PAS d'appels directs Supabase dans les hooks
- Utiliser les services existants du RepositoryFactory
- Respecter les patterns hexagonaux
- Maintenir la compatibilité avec React Query
```
```
@CONTEXT.md @docs/task-plan.md

Fais-moi un bilan complet de la migration hexagonale avec les 130 fichiers identifiés :

**📊 STATISTIQUES GLOBALES**
- Services Legacy : 8 fichiers à migrer
- Composants React : 61 fichiers à migrer  
- Hooks Legacy : 15 fichiers à migrer
- Hooks Hexagonaux : 43 fichiers à finaliser
- Document Repositories : 3 fichiers à migrer
- TOTAL : 130 fichiers à migrer

**🎯 ÉTAT ACTUEL**
- Services créés : 31/31 (100%)
- Hooks hexagonaux : 32/43 (74% propres)
- Composants refactorisés : ~5/61 (8%)
- Architecture globale : ~65% hexagonale

**📋 FICHIERS PAR PRIORITÉ**
1. **Phase 1** : Services Legacy (8 fichiers)
2. **Phase 2** : Composants React (61 fichiers) 
3. **Phase 3** : Hooks Legacy (15 fichiers)
4. **Phase 4** : Hooks Hexagonaux (43 fichiers)
5. **Phase 5** : Document Repositories (3 fichiers)

**🚀 PROCHAINES ÉTAPES**
- Identifier les repositories à créer (IDecompteRepository, etc.)
- Finaliser les 43 hooks hexagonaux avec appels directs
- Migrer les 61 composants React vers hooks hexagonaux
- Convertir les 15 hooks legacy vers architecture hexagonale
- Migrer les 3 repositories document vers architecture hexagonale

Donne-moi le plan d'action priorisé pour les 7 prochains jours.
```

### **Prompt : Analyse Complète des Fichiers à Migrer**
```
@docs/task-plan.md @CONTEXT.md

Analyse en détail les fichiers suivants et donne-moi leur état de migration :

**🔧 SERVICES LEGACY (8 fichiers)**
- src\application\services\AutomaticDecompteCalculator.ts
- src\application\services\CheckpointActionContextService.ts
- src\application\services\CheckpointVerificationEngine.ts
- src\application\services\InspectionExecutionService.ts
- src\application\services\MilestoneService.ts
- src\application\services\PVGeneratorService.ts
- src\application\services\TenderServiceLegacy.ts
- src\application\services\WorkflowOrchestrator.ts

**📋 COMPOSANTS REACT (61 fichiers)**
- src\components\admin\AlertsProcessorSettings.tsx
- src\components\admin\EscalationThresholdsSettings.tsx
- [Tous les autres composants listés...]

**🪝 HOOKS LEGACY (15 fichiers)**
- src\hooks\useCheckpointVerification.ts
- src\hooks\useEnhancedTaskAssignment.ts
- [Tous les autres hooks listés...]

**📁 DOCUMENT REPOSITORIES (3 fichiers)**
- src\document\repositories\MaterialRepository.ts
- src\document\repositories\SupplierPaymentRepository.ts
- src\document\repositories\TenderRepository.ts

Pour chaque fichier, indique :
- Nombre d'appels directs Supabase
- Tables utilisées
- Service/Repository cible
- Priorité de migration (HAUTE/MOYENNE/BASSE)
- Actions requises

**🎯 OBJECTIF**
Identifier les 10 fichiers les plus critiques à migrer en priorité absolue.
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

🚨 PRÉREQUIS IMPORTANTS :
- PAS DE MOCK OU DONNÉES FAKE : Utiliser uniquement les vrais adapters Supabase
- IMPLÉMENTATION COMPLÈTE : Créer tous les adapters/services avant de supprimer les références Supabase
- VÉRIFICATION TABLES : Confirmer l'existence des tables Supabase dans types.ts avant utilisation
- DONNÉES RÉELLES : Toujours utiliser les vraies données de la base de données
- MODÈLES DE DONNÉES : Les .from('*') sont basés sur les modèles de src/domain/entities/* et src/integrations/supabase/types.ts
- VALIDATION TYPES : Respecter les types définis dans les entités de domaine et les types Supabase

Flux architectural prêt ✅ - Refactoring à démarrer 🚀
```

### **Prompt : Plan d'Action Migration Hexagonale**
```
@docs/task-plan.md @CONTEXT.md

Bonjour agent AI ! Nous avons un plan d'action complet pour la migration hexagonale.

1. Rappelle-moi l'ordre de migration : Repository → Service → Adapter → Hook → UI
2. Liste les 8 services legacy critiques à migrer :
   - AutomaticDecompteCalculator.ts (15+ appels)
   - CheckpointVerificationEngine.ts (8+ appels)
   - InspectionExecutionService.ts (3 appels)
   - WorkflowOrchestrator.ts (4 appels)
   - MilestoneService.ts, PVGeneratorService.ts, TenderServiceLegacy.ts, CheckpointActionContextService.ts
3. Identifie les repositories à créer pour ces services
4. Liste les 15 composants React critiques (3+ appels directs)
5. Donne-moi la timeline de migration sur 14 jours

🚨 PRÉREQUIS IMPORTANTS :
- ORDRE OBLIGATOIRE : Repository → Service → Adapter → Hook → UI
- TABLES RÉFÉRENCE : `@src/integrations/supabase/types.ts` - SEULE source de vérité
- MODÈLES DOMAIN : `@src/domain/entities` - Entités métier pures
- RÈGLE REPOSITORY : PAS de repository SSI domaine correspondant dans `/domain/entities`
- EXCEPTION SERVICES : Services de compute/util peuvent utiliser des repositories d'autres domaines
- VÉRIFICATION OBLIGATOIRE : Toujours vérifier `/domain/entities` avant de créer un repository

Architecture hexagonale centralisée 🚀 - Plan d'action 14 jours 🔄
```

### **Prompt : Créer Repository pour Service Legacy**
```
@docs/task-plan.md @CONTEXT.md

Je veux créer le repository pour le service [SERVICE_NAME].

1. Analyse les appels directs Supabase dans le service
2. Identifie toutes les tables utilisées dans `@src/integrations/supabase/types.ts`
3. Vérifie si l'entité correspondante existe dans `@src/domain/entities`
4. SI entité existe : Crée l'interface repository (I[Domain]Repository)
5. SI PAS d'entité : Service de compute/util (utiliser repositories existants)
6. Ajoute le repository au RepositoryFactory SI nécessaire
7. Refactorise le service pour utiliser le(s) repository(s)

🚨 PRÉREQUIS IMPORTANTS :
- ORDRE OBLIGATOIRE : Repository → Service → Adapter → Hook → UI
- INTERFACE COMPLÈTE : Toutes les méthodes utilisées par le service
- TYPES FORTS : Utiliser les entités de domaine
- FACTORY PATTERN : Ajouter au RepositoryFactory
- PAS DE MOCK : Utiliser l'adapter Supabase existant

Exemple : IDecompteRepository pour AutomaticDecompteCalculator
```

### **Prompt : Migrer Composant React Critique**
```
@docs/task-plan.md @CONTEXT.md

Je veux migrer le composant [COMPONENT_NAME] vers l'architecture hexagonale.

1. Analyse tous les appels directs Supabase dans le composant
2. Identifie le hook hexagonal cible à utiliser/créer
3. Vérifie que le service hexagonal correspondant existe
4. Refactorise le composant pour utiliser le hook
5. Valide qu'il n'y a plus d'appels directs Supabase

🚨 PRÉREQUIS IMPORTANTS :
- ORDRE OBLIGATOIRE : Repository → Service → Adapter → Hook → UI
- TABLES RÉFÉRENCE : `@src/integrations/supabase/types.ts` - SEULE source de vérité
- MODÈLES DOMAIN : `@src/domain/entities` - Entités métier pures
- RÈGLE REPOSITORY : PAS de repository SSI domaine correspondant dans `/domain/entities`
- HOOK HEXAGONAL : Utiliser ou créer le hook correspondant
- SERVICE DISPONIBLE : Vérifier que le service hexagonal existe
- PAS DE COUPLAGE : Le composant ne doit pas importer supabase
- TYPES FORTS : Utiliser les DTOs du hook

Pattern : Composant → Hook Hexagonal → Service → Repository → Adapter → BDD
```

### **Prompt : Finaliser Hook Hexagonal**
```
@docs/task-plan.md @CONTEXT.md

Je veux finaliser le hook [HOOK_NAME] qui contient encore des appels directs Supabase.

1. Analyse les appels directs Supabase dans le hook
2. Identifie le service hexagonal à utiliser
3. Refactorise toutes les mutations/queries pour utiliser le service
4. Utilise les DTOs retournés par le service
5. Valide qu'il n'y a plus d'appels directs Supabase

🚨 PRÉREQUIS IMPORTANTS :
- ORDRE OBLIGATOIRE : Repository → Service → Adapter → Hook → UI
- TABLES RÉFÉRENCE : `@src/integrations/supabase/types.ts` - SEULE source de vérité
- MODÈLES DOMAIN : `@src/domain/entities` - Entités métier pures
- RÈGLE REPOSITORY : PAS de repository SSI domaine correspondant dans `/domain/entities`
- SERVICE HEXAGONAL : Utiliser le service déjà créé
- DTOs SEULEMENT : Le hook ne doit manipuler que des DTOs
- REACT QUERY : Maintenir les mutations/queries React Query
- GESTION ERREURS : Conserver la gestion d'erreurs existante

Pattern : Hook → Service → Repository → Adapter → BDD
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

🚨 PRÉREQUIS IMPORTANTS :
- PAS DE MOCK OU DONNÉES FAKE : Utiliser uniquement les vrais adapters Supabase
- IMPLÉMENTATION COMPLÈTE : Créer tous les adapters/services avant de supprimer les références Supabase
- VÉRIFICATION TABLES : Confirmer l'existence des tables Supabase dans types.ts avant utilisation
- DONNÉES RÉELLES : Toujours utiliser les vraies données de la base de données
- MODÈLES DE DONNÉES : Les .from('*') sont basés sur les modèles de src/domain/entities/* et src/integrations/supabase/types.ts
- VALIDATION TYPES : Respecter les types définis dans les entités de domaine et les types Supabase

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

### **Règles de Migration (IMPORTANT)**
- `src/services/*` est **déprécié** : éviter d'ajouter/modifier de la logique dans ce dossier.
- Toujours chercher le même service dans `src/application/services/*` (même nom ou équivalent).
- Toute correction/évolution fonctionnelle doit être faite dans `src/application/services/*` et consommée via `RepositoryFactory`.
- **Types UI + transformations** : les types/DTO nécessaires à l'UI et aux transformations sont dans `src/dtos/*`.
- **Types legacy (migration uniquement)** : `src/types/*` est **déprécié**, à utiliser seulement pour récupérer des types résiduels pendant la migration.
- **Référence schéma Supabase** : `src/integrations/supabase/types.ts` est côté infrastructure (Supabase). À lire comme source de vérité DB pour enrichir/aligner `src/domain/*` et `src/dtos/*`.
- **Use-cases (DEPRECATED)** : `src/application/use-cases/**` est **déprécié**. Les hooks hexagonaux doivent utiliser directement les services hexagonaux dans `src/application/services/*` via `RepositoryFactory`. PAS de création de nouveaux use-cases.

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

**Dernière mise à jour** : 21/01/2026
**Version** : 3.5 - État des lieux 42 appels directs Supabase restants
**Statut Migration** : 
- ✅ Jour 1: Services centraux (AuthService, StorageService, NotificationService) - 100% implémentés
- ✅ Jour 2-3: Hooks prioritaires (9/40 migrés)
- ✅ Jour 4: Composant critique (ProjectPhasesDetail.tsx)
- 🔄 Jour 5-6: 42 appels directs restants dans hooks hexagonaux
- ⏳ Jour 7: Validation finale et documentation

## 📊 **ÉTAT ACTUEL DE LA MIGRATION**

### **📈 Progression Détaillée au 21/01/2026**
- **Services hexagonaux**: 31/31 ✅ (100% - Tous disponibles et testés)
- **Hooks migrés**: 9/40 (22.5%) 🔄 avec patterns validés
- **Composants refactorisés**: 1/50 (2%) 🔄
- **Appels directs restants**: 42 occurrences dans 35 hooks hexagonaux
- **Architecture**: 95% hexagonale
- **Components TSX**: 0 appels directs ✅ (tous migrés)

### **🎯 Services Domain Confirmés et Disponibles**
- ✅ **Services Centraux** : AuthService, StorageService, NotificationService (100% implémentés)
- ✅ **Services Métier** : SupplierService, TenderService, TenderEstimateService
- ✅ **Services Projets** : InspectionService, TaskService, PaymentRequestService
- ✅ **Services Données** : ProjectService, MaterialService, BankGuaranteeService
- ✅ **Services Spécialisés** : DocumentService, EmployeeService, InsuranceService
- ✅ **Services Actions** : BankGuaranteeActionService, PaymentBlockingService
- ✅ **Services Avancés** : PhaseService, MilestoneService, ReportDataTransformerService
- ✅ **Total** : 31 services hexagonaux 100% opérationnels

### **📋 Hooks Migrés avec Succès (Patterns Validés)**
- ✅ `useActiveSuppliersHex.ts` - Pattern hexagonal validé
- ✅ `useTenderEstimateHex.ts` - Import et services intégrés
- ✅ `usePaymentActionsHex.ts` - Services hexagonaux intégrés
- ✅ `useInspectionMonitoringHex.ts` - Architecture complète
- ✅ `useTenderCrudHex.ts` - RepositoryFactory intégré
- ✅ `usePhaseInspectionsHex.ts` - InspectionDomainTransformer intégré
- ✅ `usePhasePaymentsHex.ts` - PaymentRequestService intégré
- ✅ `useTaskListHex.ts` - TaskService intégré
- ✅ `useTaskAssignmentsHex.ts` - TaskService + AuthService

**Progression Hooks** : 9/40 (22.5%) avec architecture 100% hexagonale

### **📋 Composants Migrés avec Succès**
- ✅ `ProjectPhasesDetail.tsx` - PhaseService hexagonal intégré

### **🔄 Fichiers en Cours**
- 🔄 `usePhaseMaterialsHex.ts` - Corrompu, nécessite réparation
- 🔄 `PaymentRequestsManagement.tsx` - Placeholders services

### **🚨 Fichiers avec Appels Supabase Restants (35 hooks)**
#### **Hooks Critiques par Nombre d'Appels**
- `useUserManagementHex.ts` - 5 appels (auth + rpc)
- `useSupplierPortalCompleteHex.ts` - 6 appels (auth + storage)
- `useUnifiedSupplierPortalHex.ts` - 8 appels (auth + storage + database)
- `usePaymentControlActionsHex.ts` - 4 appels (auth + functions)
- `useInsuranceCertificatesHex.ts` - 4 appels (auth + storage)

#### **Hooks avec Appels Simples (1-2 appels)**
- `useUsersAdminHex.ts`, `useSupplierPortalHex.ts`
- `useProgressInvoiceHex.ts`, `useProgressInvoiceFormHex.ts`
- `useTenderDocumentUploadHex.ts`, `useUserManagementDialogHex.ts`
- `useDocumentShareHex.ts`, `useAlertsProcessorHex.ts`
- `useBankGuaranteesHex.ts`, `usePaymentRequestsHex.ts`
- `useProjectPhasesHex.ts`, `useContactFormHex.ts`
- `useEnhancedRiskManagerHex.ts`, `useInspectionsListHex.ts`
- `useActiveEmployeesHex.ts`, `useAssigneeDetailsHex.ts`
- `useInspectionCrudHex.ts`, `usePaymentValidationHex.ts`
- `useProjectImporterHex.ts`

## 📋 **PLAN D'ACTION COMPLÉMENTAIRE**

### **Phase 5-6: Migration Prioritaire Finale**
**🎯 Objectif: Éliminer les 42 appels directs restants**

#### **🚨 Priorité HAUTE - Hooks Critiques (5 fichiers)**
1. `useUnifiedSupplierPortalHex.ts` - 8 appels (auth + storage + database)
2. `useSupplierPortalCompleteHex.ts` - 6 appels (auth + storage)
3. `useUserManagementHex.ts` - 5 appels (auth + rpc)
4. `usePaymentControlActionsHex.ts` - 4 appels (auth + functions)
5. `useInsuranceCertificatesHex.ts` - 4 appels (auth + storage)

#### **🔄 Priorité MOYENNE - Hooks Moyens (5 fichiers)**
- `useUsersAdminHex.ts` - 2 appels (auth admin)
- `useSupplierPortalHex.ts` - 2 appels (auth)
- `useProgressInvoiceHex.ts` - 2 appels (storage)
- `useProgressInvoiceFormHex.ts` - 2 appels (storage)
- `useTenderDocumentUploadHex.ts` - 1 appel (storage)

#### **📝 Priorité BASSE - Hooks Simples (25 fichiers)**
- `useUserManagementDialogHex.ts`, `useDocumentShareHex.ts`, `useAlertsProcessorHex.ts`
- `useBankGuaranteesHex.ts`, `usePaymentRequestsHex.ts`, `useProjectPhasesHex.ts`
- `useContactFormHex.ts`, `useEnhancedRiskManagerHex.ts`, `useInspectionsListHex.ts`
- `useActiveEmployeesHex.ts`, `useAssigneeDetailsHex.ts`, `useInspectionCrudHex.ts`
- `usePaymentValidationHex.ts`, `useProjectImporterHex.ts` + 14 autres hooks

### **📊 Validation Continue**
```bash
# Commande de validation finale
Get-ChildItem -Path "./src/hooks/hexagonal" -Recurse -Include "*.ts" | Select-String -Pattern "supabase\." | Measure-Object
# Objectif : 0 résultats
```

### **🎯 Patterns Hexagonaux à Appliquer**
1. **AuthService** : Remplacer `supabase.auth.*` par `authService.*`
2. **StorageService** : Remplacer `supabase.storage.*` par `storageService.*`
3. **NotificationService** : Remplacer `supabase.functions.invoke` par `notificationService.*`
4. **RepositoryFactory** : Remplacer `supabase.from.*` par `RepositoryFactory.get*Repository()`

### **📈 Métriques de Succès**
- **0 appels directs** Supabase dans les hooks hexagonaux ✅
- **100% des hooks** utilisent les services hexagonaux ✅
- **Architecture hexagonale** : 100% fonctionnelle ✅
- **Performance** : Pas de régression ✅
- **Type Safety** : Tous les types respectés ✅

### **🔧 Commandes de Validation Finale**
```bash
# Validation complète
npm run build
npm run lint
npm run test

# Vérification des appels directs
grep -r "supabase\." src/hooks/hexagonal/ --exclude-dir=node-modules
# Doit retourner 0 résultats
```
