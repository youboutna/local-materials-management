# **PROMPTS.md - Snippets de Prompts pour AI Paiprogramming Code**

## **🚀 DÉMARRAGE DE SESSION - 25 JANVIER 2026**

### **Prompt : Démarrer la journée Architecture Hexagonale**
```
@docs/task-plan.md @CONTEXT.md @HEXAGONAL_ARCHITECTURE_GUIDE.md @CODEBASE_ANALYSIS_FINAL.md

Bonjour agent AI ! Nous sommes en phase finale de l'Architecture Hexagonale du projet HadraTech-GPI.

📊 **ÉTAT ACTUEL** :
- Progression globale : 99.2% hexagonal ✅
- Services Application : 57/57 créés (100%) ✅
- Hooks Hexagonaux : 104/104 créés (100%) ✅
- Components React : 386/386 fichiers (100%) ✅
- Appels directs Supabase : 3 appels restants ⚠️
- Multi-Providers Auth : Terminé ✅
- ConfigurationService : Terminé ✅

🎯 **OBJECTIF FINAL** :
- Nettoyer les 3 appels restants (commentaires)
- Finaliser la documentation
- Tests d'intégration complets
- Déploiement production 🚀

Architecture quasi-terminée - Prêt pour finalisation !
```


## **🎮 MANUEL DE JEU POUR AI-AGENT**

### **RÈGLE DU JEU #1 : LA FLÈCHE SACRÉE**
```
TU PEUX : Présentation → Application → Domaine ← Infrastructure
TU NE PEUX PAS : Domaine → Infrastructure (direct)
TU NE PEUX PAS : Infrastructure → Présentation (direct)

Pense à une rivière qui coule :
  🏔️ Source (UI) → ⛰️ Montagne (App) → 🌊 Lac (Domaine) ← 💧 Affluent (Infra)
```

### **RÈGLE DU JEU #2 : LES RÔLES IMMUABLES**
```
🧠 DOMAINE : Le sage qui sait
  → Il VALIDE, il CALCULE, il DÉCIDE
  → Il ne sait pas COMMENT on le sauvegarde

⚡ APPLICATION : Le messager intelligent
  → Il COORDONNE, il TRANSFORME, il TRANSMET
  → Il ne contient pas la VÉRITÉ métier

🔧 INFRASTRUCTURE : Le traducteur fidèle
  → Il ÉCOUTE, il TRADUIT, il PERSISTE
  → Il n'invente pas de règles

🎨 PRÉSENTATION : L'interprète gracieux
  → Il AFFICHE, il INTERAGIT, il DÉLÈGUE
  → Il ne fait pas de logique métier
```

### **RÈGLE DU JEU #4 : LA PURETÉ DES ENTITÉS**
```
🧠 DOMAINE : Le temple de la pureté
  → ✅ Champs simples : string, number, boolean, Date
  → ✅ Références par ID : managerId, primaryContactId
  → ✅ Types énumérés : Status, Category
  → ✅ Objets complexes : rating: SupplierRating, contacts: SupplierContact[]
  → ✅ Collections d'entités : employees: Employee[], phases: Phase[]
  → ❌ DTOs de mapping : interfaces pour échanges API/UI
  → ❌ Types any : Record<string, any>

📦 DTO : Le marché des échanges
  → ✅ Interfaces complexes : SupplierRating, SupplierContact
  → ✅ Collections d'objets : contacts: SupplierContact[]
  → ✅ Structures de mapping : pour API/UI
  → ✅ Transformations : Entity ↔ DTO

🔄 TRANSFORMERS : Les traducteurs sacrés
  → ✅ Convertissent entités ↔ DTOs
  → ✅ Font le pont entre Domaine et DTOs
  → ✅ Maintiennent la cohérence des types
```

### **🚨 ANTI-PATTERNS À ÉVITER**
```
❌ DTOs dans l'entité :
export interface SupplierAPIDTO { ... }  // 🚨 INTERDIT - DTO de mapping

✅ Interfaces de domaine :
export interface SupplierRating { ... }  // ✅ CORRECT - Structure métier
export class Supplier {
  constructor(public rating: SupplierRating) { ... }  // ✅ CORRECT
}
```

### **🎯 MANTRA SACRÉ**
> **"Les entités peuvent contenir des objets et collections métier. Les DTOs sont réservés aux échanges API/UI. Les transformers font le pont.**

### **🚨 PRÉREQUIS OBLIGATOIRES**
```
📋 Migration des entités dupliquées :
- ❌ SUPPRIMER EmployeeEntity.ts → ✅ MIGRER vers Employee.ts
- ❌ SUPPRIMER UserEntity.ts → ✅ MIGRER vers User.ts 
- ❌ SUPPRIMER tous les *Entity.ts → ✅ CONSOLIDER dans l'entité principale

📋 Pattern à appliquer :
// ❌ ANTI-PATTERN - Fichiers dupliqués
EmployeeEntity.ts  // Interface de données
Employee.ts        // Entité métier

// ✅ BONNE PRATIQUE - Fichier unique
Employee.ts  // Entité métier + interfaces de structure
```

### **🎯 RÈGLE ARCHITECTURALE : OBJETS COMPLEXES DANS LES ENTITÉS**

```
🧠 DOMAINE : Le temple de la pureté
  → ✅ Champs simples : string, number, boolean, Date
  → ✅ Références par ID : managerId, primaryContactId
  → ✅ Types énumérés : Status, Category
  → ✅ OBJETS COMPLEXES : rating: SupplierRating, contacts: SupplierContact[]
  → ✅ COLLECTIONS D'ENTITÉS : employees: Employee[], phases: Phase[]
  → ❌ DTOs de mapping : interfaces pour échanges API/UI
  → ❌ Types any : Record<string, any>

📦 DTO : Le marché des échanges
  → ✅ Interfaces complexes : SupplierRating, SupplierContact
  → ✅ Collections d'objets : contacts: SupplierContact[]
  → ✅ Structures de mapping : pour API/UI
  → ✅ Transformations : Entity ↔ DTO

🔄 TRANSFORMERS : Les traducteurs sacrés
  → ✅ Convertissent entités ↔ DTOs
  → ✅ Font le pont entre Domaine et DTOs
  → ✅ Maintiennent la cohérence des types
```

### **🚨 PRÉREQUIS : SETTERS ET GETTERS POUR ENTITÉS**

```
🧠 DOMAINE : Le temple de la pureté
  → ✅ Champs simples : string, number, boolean, Date
  → ✅ OBJETS COMPLEXES : manager: Employee, user: User
  → ✅ Types énumérés : Status, Category
  → ✅ COLLECTIONS D'ENTITÉS : employees: Employee[], phases: Phase[]
  → ✅ SETTERS AVEC VALIDATION : `setTitle(value: string) { this._title = this.validateTitle(value); }`
  → ✅ GETTERS POUR NAVIGATION : `getManager(): Employee | null`
  → ❌ PAS de logique métier dans les setters simples
  → ❌ PAS d'effets de bord dans les getters simples

📦 DTO : Le marché des échanges
  → ✅ Interfaces complexes : SupplierRating, SupplierContact
  → ✅ Collections d'objets : contacts: SupplierContact[]
  → ✅ Structures de mapping : pour API/UI
  → ✅ Transformations : Entity ↔ DTO

🔄 TRANSFORMERS : Les traducteurs sacrés
  → ✅ Convertissent entités ↔ DTOs
  → ✅ Font le pont entre Domaine et DTOs
  → ✅ Maintiennent la cohérence des types
```

### **🚨 PATTERN SETTERS/GETTERS CORRECT**

```typescript
// ✅ BONNE PRATIQUE - Entité avec setters/getters
export class Employee {
  constructor(
    // ✅ Champs simples (readonly)
    public readonly id: string,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // ✅ Setter avec validation
  set title(value: string) { 
    this._title = this.validateTitle(value); 
    this._updatedAt = new Date();
  }
  
  set status(value: ProjectStatus) { 
    this._status = this.validateStatus(value); 
    this._updatedAt = new Date();
  }
  
  // ✅ Getter pour navigation
  get manager(): Employee | null {
    return this._manager;
  }
  
  get displayName(): string {
    return this._title || this._id;
  }
  
  // ✅ Getter avec logique métier
  get progressPercentage(): number {
    return this.calculateProgress();
  }
  
  // ❌ ANTI-PATTERN - Logique métier dans getter simple
  get isValid(): boolean {  // ❌ Pas de logique métier ici
    return this.status === 'active';
  }
}
```

### **🚨 VALIDATION DANS LES SETTERS**

```typescript
// ✅ Validation centralisée
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

### **🚨 NAVIGATION AVEC OBJETS COMPLEXES**

```typescript
// ✅ Navigation avec objets complexes
getProject(): Project | null {
  return this._project;
}

getAssignedEmployees(): Employee[] {
  return this._assignedEmployees;
}

getProjectName(): string | null {
  return this._project?.name || null;
}

// ✅ Collections avec getters
getTeamSize(): number {
  return this._teamMembers.length;
}

getActiveProjects(): Project[] {
  return this._projects.filter(p => p.isActive);
}
```

### **🚨 IMMUTABILITÉ CONTRÔLÉE**

```typescript
// ✅ Immutabilité avec setters
export class Employee {
  private _title: string;
  private _status: ProjectStatus;
  private _updatedAt: string;

  // ✅ Setter retourne nouvelle instance (immutabilité)
  withTitle(title: string): Employee {
    return new Employee(
      this.id,
      this.validateTitle(title),
      this._status,
      this._updatedAt
    );
  }

  // ✅ Factory method pour création
  static create(params: EmployeeParams): Employee {
    return new Employee(
      params.id,
      params.title,
      'active', // Status par défaut
      new Date().toISOString()
    );
  }
}
```

### **🎯 MANTRA SACRÉ**
> **"Les entités peuvent contenir des objets et collections métier. Les DTOs sont réservés aux échanges API/UI. Les transformers font le pont. Les setters/getters assurent la validation et l'immutabilité."**

### **🎯 RÈGLE ARCHITECTURALE : OBJETS COMPLEXES DANS LES ENTITÉS**

```
🧠 DOMAINE : Le temple de la pureté
  → ✅ Champs simples : string, number, boolean, Date
  → ✅ OBJETS COMPLEXES : manager: Employee, user: User
  → ✅ Types énumérés : Status, Category
  → ✅ COLLECTIONS D'ENTITÉS : employees: Employee[], projects: Project[]
  → ❌ DTOs de mapping : interfaces pour échanges API/UI
  → ❌ Types any : Record<string, any>

📦 DTO : Le marché des échanges
  → ✅ Interfaces complexes : SupplierRating, SupplierContact
  → ✅ Collections d'objets : contacts: SupplierContact[]
  → ✅ Structures de mapping : pour API/UI
  → ✅ Transformations : Entity ↔ DTO

🔄 TRANSFORMERS : Les traducteurs sacrés
  → ✅ Convertissent entités ↔ DTOs
  → ✅ Font le pont entre Domaine et DTOs
  → ✅ Maintiennent la cohérence des types
```

### **🚨 ANTI-PATTERN À ÉVITER**
```
❌ Mapping direct table → entité :
constructor(
  public readonly userId: string | null,      // ❌ Direct de user.id
  public readonly managerId: string | null,     // ❌ Direct de manager_id
  public readonly superiorId: string | null     // ❌ Direct de superior_id
)

✅ Entité avec objets complexes :
constructor(
  public readonly manager: Employee | null,        // ✅ Objet Employee
  public readonly user: User | null,              // ✅ Objet User
  public readonly directReports: Employee[],      // ✅ Collection d'Employee
  public readonly managedProjects: Project[]     // ✅ Collection de Project
)
```

### **🚨 PRÉREQUIS : MODIFICATION DES ENTITÉS**

```typescript
📋 RÈGLE D'OR : JAMAIS SUPPRIMER DE FICHIERS
- ❌ INTERDIT : rm, del, suppression de fichiers existants
- ✅ OBLIGATOIRE : Utiliser edit() ou multi_edit() pour modifier
- ✅ OBLIGATOIRE : Préserver l'existant et améliorer

📋 PROCESSUS DE MODIFICATION :
1. ✅ Lire le fichier existant avec read_file()
2. ✅ Analyser la structure actuelle
3. ✅ Identifier les améliorations nécessaires
4. ✅ Utiliser edit() pour ajouter les prérequis manquants
5. ✅ Conserver ce qui est déjà conforme

📋 PRÉREQUIS À AJOUTER :
- Private fields avec underscore (_)
- Getters pour tous les champs
- Setters avec validation et updatedAt
- Getters avec logique métier (displayName, etc.)
- Getters pour navigation (getManager, etc.)
- Getters pour collections (getTeamSize, etc.)
- Validation methods privés
- Immutability methods (with*)
- Factory methods (create)
- Business logic methods
- toPlainObject method
```

### **🎯 MANTRA SACRÉ**
> **"Les entités peuvent contenir des objets et collections métier. Les DTOs sont réservés aux échanges API/UI. Les transformers font le pont. Les setters/getters assurent la validation et l'immutabilité."**

---

## **🔧 EXERCICE PRATIQUE : TU REJOINS L'ÉQUIPE**

**SCÉNARIO :** On te demande d'ajouter une fonctionnalité : "Calculer l'impact CO₂ d'un projet"

### **❌ MAUVAISE FAÇON (le stagiaire pressé) :**
```typescript
// Dans /pages/projects/ProjectPage.tsx 🚨
const calculateCO2 = () => {
  const materials = await supabase.from('materials').select('*'); // 🚨 Direct DB!
  const co2 = materials.reduce((sum, m) => sum + m.weight * m.co2_factor, 0);
  setCO2(co2); // 🚨 Logique dans l'UI!
};
```

### **✅ BONNE FAÇON (l'architecte discipliné) :**

**ÉTAPE 1 : 🧠 Commence par le Domaine (la vérité)**
```typescript
// /domain/entities/Project.ts
class Project {
  calculateCarbonFootprint(): number {
    // Je calcule MES règles métier
    return this.materials.reduce(
      (total, material) => total + material.getCO2Equivalent(),
      0
    );
  }
}
```

**ÉTAPE 2 : 📦 Ajoute au DTO si besoin**
```typescript
// /dtos/entities/ProjectDTO.ts
interface ProjectDTO {
  id: string;
  title: string;
  carbonFootprint?: number; // ✅ Nouveau champ
  // ...
}
```

**ÉTAPE 3 : ⚡ Ajoute au Service**
```typescript
// /application/services/ProjectService.ts
class ProjectService {
  async getProjectWithCO2(id: string): Promise<ProjectDTO> {
    const project = await this.projectRepo.findByIdWithMaterials(id);
    const dto = projectTransform.toDTO(project);
    
    // ✅ J'ajoute la valeur calculée par le Domaine
    dto.carbonFootprint = project.calculateCarbonFootprint();
    
    return dto;
  }
}
```

**ÉTAPE 4 : 🎯 Ajoute au Hook hexagonal**
```typescript
// /hooks/hexagonal/useProjectsHex.ts
const useProjectsHex = () => {
  const getProjectWithCO2 = async (id: string) => {
    // ✅ Je délègue proprement
    return await projectService.getProjectWithCO2(id);
  };
};
```

**ÉTAPE 5 : 🎨 Utilise dans l'UI**
```typescript
// /pages/projects/ProjectPage.tsx
const ProjectPage = ({ id }) => {
  const { project } = useProjectsHex();
  
  useEffect(() => {
    loadProjectWithCO2(id); // ✅ Propre, via les canaux
  }, []);
  
  return (
    <div>
      <h1>{project.title}</h1>
      <p>Impact CO₂: {project.carbonFootprint} tonnes</p> {/* ✅ Affichage simple */}
    </div>
  );
};
```

---

## **🎖️ TA CHECKLIST QUOTIDIENNE**

### **AVANT D'ÉCRIRE UNE LIGNE :**
- [ ] **OÙ** cette logique doit-elle vivre? (Domaine/App/Infra/Présentation?)
- [ ] **QUI** est responsable de cette connaissance?
- [ ] **COMMENT** les données voyageront-elles?
- [ ] **QUI** va implémenter les interfaces?

### **QUAND TU ÉCRIS DU CODE :**
- [ ] Mon **Domaine** reste-il pur? (Aucun import d'infrastructure)
- [ ] Mon **Service** orchestre-t-il sans faire la logique?
- [ ] Mon **Adapter** traduit-il sans inventer?
- [ ] Mon **DTO** est-il un simple conteneur?
- [ ] Mon **UI** délègue-t-elle tout?

### **QUAND TU RELIS DU CODE :**
- [ ] Est-ce que je vois `supabase` dans `/domain/`? → **ALARME**
- [ ] Est-ce que je vois des règles métier dans `/pages/`? → **ALARME**
- [ ] Est-ce que le service fait du mapping DB? → **ALARME**
- [ ] Est-ce que l'UI appelle directement l'adapter? → **ALARME**

---

## **🏆 TON SERMENT D'ARCHITECTE**

```
"Je jure de maintenir l'ordre hexagonal,
De respecter la séparation sacrée des couches,
De toujours faire couler les données dans le bon sens,
Et de protéger la pureté du Domaine contre toute pollution.

Que la dette technique me saisisse si je brise ces règles."
```

**Rappelle-toi :** Chaque fois que tu contournes l'architecture, tu construis une **dette technique**. Chaque fois que tu respectes les flux, tu construis un **héritage durable**.

L'architecture n'est pas une prison—c'est la **grammaire** qui permet à ton code de **raconter des histoires claires**.


1. Rappelle-moi l'objectif de l'architecture hexagonale complète
2. Liste les transformers/mappers centralisés (User, Project, Supplier, Payment, Document)
3. Identifie les hooks hexagonaux créés (useProjectsHex, useSuppliersHex, useAuthHex, etc.)
4. Liste les composants refactorisés (SupplierPaymentRequest.tsx - 100% hexagonal)
5. Suggère les 3 prochaines tâches prioritaires (correction types, refactoring composants)

Architecture hexagonale centralisée 🚀 - Progression 93.46% ✅
```

### **Prompt : Analyse Dynamique de la Migration**
```
@docs/task-plan.md @CONTEXT.md

Exécute le script d'analyse dynamique et donne-moi les résultats actuels :

1. Lance le script PowerShell d'analyse
2. Affiche les résultats réels du code actuel
3. Identifie les fichiers critiques restants
4. Propose les 3 prochaines actions prioritaires

Les résultats changent à chaque exécution selon l'état du code.

Architecture hexagonale centralisée 🚀 - Analyse en temps réel ✅
```

### **Prompt : État du projet Architecture Hexagonale**
```
@docs/task-plan.md @CONTEXT.md

Fais-moi un résumé de l'état d'avancement :
- Phase actuelle : "ARCHITECTURE HEXAGONALE TERMINÉE"
- Progression globale : 93.46% (excellente progression, finalisation en cours)
- Services hexagonaux : 31/31 créés (100%)
- RepositoryFactory : 100% configuré avec tous les singletons
- Adapters critiques : InspectionScheduling, ParsedInvoice (100%)
- Hooks migrés : 89/103 🔄
- Composants migrés : 368/386 🔄
- Appels directs Supabase : 32 appels identifiés dans 32 fichiers
- Architecture : 93.46% hexagonale et production-ready ✅
- Types et erreurs : Corrections finales en cours 🔄
- Dernière correction : Duplicate function implementation dans Project.ts (clone → copy) ✅
- Temps restant : 2 jours (16 heures) 🎯

Architecture hexagonale centralisée 🚀 - Progression 93.46% ✅
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

### **Prompt : Analyse Composant Critique**
```
@CONTEXT.md @docs/task-plan.md @CODEBASE_ANALYSIS_FINAL.md

Je veux analyser le composant ProjectCreationWorkflow.tsx :

1. **Analyse l'état actuel** :
   - 16 types `any` (violations TypeScript)
   - Couplage avec ProgressCalculationService (legacy)
   - Logique métier dans le composant (calculs de progression)
   - Pas d'utilisation des hooks hexagonaux

2. **Analyse les dépendances** :
   - ✅ StakeholdersTeamStep.tsx (utilise `useStakeholdersHex`)
   - ❌ RiskAnalysisStep.tsx (appels Supabase directs)
   - ❌ ComplianceStep.tsx (appels Supabase directs)
   - ❌ ConstructionPhaseManager.tsx (services legacy)

3. **Plan de migration hexagonale** :
   - Créer `ProjectCreationDTO` avec types forts
   - Migrer `ProgressCalculationService` vers service hexagonal
   - Créer `ProjectCreationService` et `useProjectCreationHex`
   - Refactoriser le composant pour utiliser les hooks hexagonaux

4. **Impact attendu** :
   - Éliminera 16 types `any`
   - Améliorera l'architecture
   - Respectera les patterns hexagonaux

Composant critique - Priorité HAUTE 🚨
```

### **Prompt : Analyse Complète des Composants src/components/*/***
```
@CONTEXT.md @docs/task-plan.md @CODEBASE_ANALYSIS_FINAL.md

Je veux analyser tous les composants src/components/*/* :

1. **Analyse l'état actuel** :
   - 386 composants TSX analysés
   - 74 types `any` identifiés dans 39 composants
   - 9 appels Supabase directs dans 9 composants
   - Services legacy : ProgressCalculationService (7 composants), ProjectStakeholderService (6 composants)
   - 35 composants utilisent déjà les services hexagonaux

2. **Analyse les composants critiques** :
   - ProjectFileImporter.tsx : 9 types `any` (Priorité HAUTE)
   - ProjectExporter.tsx : 9 types `any` (Priorité HAUTE)
   - AdvancedProjectImporter.tsx : 9 types `any` (Priorité HAUTE)
   - ProjectCreationWorkflow.tsx : 16 types `any` (Priorité MAXIMALE)
   - EnhancedProjectEditForm.tsx : 10 types `any` (Priorité ÉLEVÉE)
   - ProjectCreate.tsx : 1 type `any` (Priorité MOYENNE)
   - 29 autres composants avec 1-4 types `any` chacun

3. **Plan de migration hexagonale** :
   - Créer DTOs pour tous les types `any` identifiés
   - Migrer ProgressCalculationService vers service hexagonal
   - Migrer ProjectStakeholderService vers service hexagonal
   - Créer hooks hexagonaux pour les 39 composants critiques
   - Refactoriser les 9 composants avec appels Supabase directs

4. **Impact attendu** :
   - Éliminera 74 types `any`
   - Améliorera l'architecture de 99.2% → 100% hexagonal
   - Centralisera tous les services legacy
   - Respectera les patterns hexagonaux

Analyse complète de 386 composants - Priorité MAXIMALE 🚨
```

### **Prompt : Migrer Composant vers Architecture Hexagonale**
```
@CONTEXT.md @docs/task-plan.md

Je veux migrer ProjectCreationWorkflow.tsx vers l'architecture hexagonale :

1. **Créer les DTOs** :
   - ProjectCreationDTO avec types forts
   - StakeholderDTO, PhaseDTO, RiskDTO, ComplianceDTO
   - ProjectWorkflowDTO pour l'ensemble

2. **Créer le service hexagonal** :
   - ProjectCreationService avec RepositoryFactory
   - Logique de calcul de progression déplacée du composant
   - Validation des données métier

3. **Créer le hook hexagonal** :
   - useProjectCreationHex pour la gestion d'état
   - Intégration avec ProjectCreationService
   - Gestion des 7 étapes du workflow

4. **Refactoriser le composant** :
   - Éliminer tous les types `any`
   - Utiliser le hook hexagonal
   - Déléguer la logique métier au service

5. **Valider la migration** :
   - Tests TypeScript (0 erreurs)
   - Tests fonctionnels du workflow
   - Performance maintenue

Migration complète vers hexagonal 🎯
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

### **État Actuel au 25/01/2026**
- **Architecture hexagonale** : 99.2% terminée ✅
- **Services créés** : 57/57 (100%) ✅
- **Hooks créés** : 104/104 (100%) ✅
- **Components refactorisés** : 386/386 (100%) ✅
- **Appels directs restants** : 3 dans 3 fichiers (commentaires) 🔄
- **Multi-Providers Auth** : Terminé ✅
- **ConfigurationService** : Terminé ✅
- **Dernière correction** : Migration massive terminée - 90% des appels éliminés ✅
- **Prochaines étapes** : Nettoyer les 3 commentaires restants et finaliser documentation
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

**Dernière mise à jour** : 25 janvier 2026
**Version** : 5.0 - Architecture hexagonale 99.2% terminée
**Statut Migration** : 
- ✅ Jour 1-6: Migration massive terminée (90% des appels éliminés)
- ✅ Multi-Providers Auth: AuthManager + 4 adapters terminé
- ✅ ConfigurationService: Templates + hooks spécialisés terminés
- ✅ Services hexagonaux: 57/57 créés (100%)
- ✅ Hooks hexagonaux: 104/104 créés (100%)
- ✅ Components: 386/386 refactorisés (100%)
- 🔄 Final: Nettoyer 3 commentaires restants et documentation

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

### **🚨 COMPOSANTS CRITIQUES IDENTIFIÉS**

#### **🚨 COMPOSANTS CRITIQUES IDENTIFIÉS**

#### **ProjectCreationWorkflow.tsx - Priorité MAXIMALE**
- **Problèmes** : 16 types `any`, logique métier dans composant, couplage services legacy
- **Impact** : Composant central de création de projets
- **Plan** : Migration complète vers architecture hexagonale
- **DTOs requis** : ProjectCreationDTO, StakeholderDTO, PhaseDTO, RiskDTO, ComplianceDTO
- **Service requis** : ProjectCreationService (remplace ProgressCalculationService)
- **Hook requis** : useProjectCreationHex

#### **EnhancedProjectEditForm.tsx - Priorité ÉLEVÉE**
- **Problèmes** : 10 types `any`, couplage services legacy, logique métier dans composant
- **Impact** : Composant d'édition de projets (765 lignes)
- **Statut** : Partiellement hexagonal (useProjectMaterialsHex ✅)
- **Plan** : Migration partielle vers architecture hexagonale
- **DTOs requis** : ProjectEditDTO, ProjectDelegationDTO, ProjectStakeholderDTO
- **Service requis** : ProjectEditService (remplace ProgressCalculationService)
- **Hook requis** : useProjectEditHex

#### **Autres Composants avec Types `any`**
- **ConstructionPhaseManager.tsx** : Services legacy à migrer
- **RiskAnalysisStep.tsx** : Appels Supabase directs
- **ComplianceStep.tsx** : Appels Supabase directs
- **StakeholdersTeamStep.tsx** : ✅ Déjà utilise `useStakeholdersHex`
- **ResourcesMaterialsStep.tsx** : ✅ Composant de présentation pur

**Progression Hooks** : *var*/*var* (*var*%) avec architecture *var*% hexagonale

### **📋 Composants Migrés avec Succès**
- ✅ `ProjectPhasesDetail.tsx` - PhaseService hexagonal intégré

### **📊 MISE À JOUR DES DOCUMENTATIONS - 25 JANVIER 2026**

#### **✅ Fichiers Principaux Mis à Jour**
1. **PROMPTS.md** - Analyse complète de tous les composants src/components/*/*
2. **docs/task-plan.md** - Statistiques 99.2% hexagonale + analyse composants critiques
3. **CONTEXT.md** - Statistiques complètes en début de fichier
4. **HEXAGONAL_ARCHITECTURE_GUIDE.md** - Accomplissements majeurs
5. **CODEBASE_ANALYSIS_FINAL.md** - Analyse finale avec état 99.2%

#### **📊 Contenu Ajouté**
- **Progression globale** : 99.2% hexagonal
- **Services Application** : 57/57 créés (100%)
- **Hooks Hexagonaux** : 104/104 créés (100%)
- **Components React** : 386/386 fichiers (100%)
- **Appels directs Supabase** : 3 appels restants (commentaires)
- **Multi-Providers Auth** : AuthManager + 4 adapters terminé
- **ConfigurationService** : Templates + hooks spécialisés terminés

#### **🔍 Analyse Complète des Composants src/components/*/***
- **Total composants analysés** : 386 fichiers TSX
- **Types `any` identifiés** : 74 occurrences dans 39 composants
- **Appels Supabase directs** : 9 appels dans 9 composants
- **Services legacy identifiés** : ProgressCalculationService (7 composants), ProjectStakeholderService (6 composants)
- **Services hexagonaux utilisés** : 35 composants utilisent déjà les services hexagonaux

#### **🎯 Composants Critiques Identifiés (39 au total)**
- **ProjectFileImporter.tsx** : 9 types `any` (Priorité HAUTE)
- **ProjectExporter.tsx** : 9 types `any` (Priorité HAUTE)
- **AdvancedProjectImporter.tsx** : 9 types `any` (Priorité HAUTE)
- **ProjectCreationWorkflow.tsx** : 16 types `any` (Priorité MAXIMALE)
- **EnhancedProjectEditForm.tsx** : 10 types `any` (Priorité ÉLEVÉE)
- **ProjectCreate.tsx** : 1 type `any` (Priorité MOYENNE)
- **Autres composants** : 29 composants avec 1-4 types `any` chacun

#### **📋 Services Legacy à Migrer**
- **ProgressCalculationService** : Utilisé dans 7 composants
- **ProjectStakeholderService** : Utilisé dans 6 composants
- **Services hexagonaux disponibles** : PhaseService, MaterialService, ProjectService, etc.

#### **🎯 Sections Clés Ajoutées**
- Analyse complète des 386 composants src/components/*/*
- Identification des 74 types `any` répartis dans 39 composants
- Plan de migration hexagonal pour tous les composants critiques
- DTOs et services requis pour la migration complète
- Nouveaux prompts pour l'analyse et la migration par domaine
- Plan d'action priorisé avec 39 composants critiques

#### **📋 Format Standardisé**
- Utilisation d'emojis cohérents ✅⚠️🔄🎯
- Structure hiérarchique claire
- Statistiques quantifiées et précises
- Références aux accomplissements récents
- Plan d'action avec deadlines

### **🔄 Fichiers en Cours**
- 🔄 `usePhaseMaterialsHex.ts` - Corrompu, nécessite réparation
- 🔄 `PaymentRequestsManagement.tsx` - Placeholders services

### **🚨 Fichiers avec Appels Supabase Restants (9 appels)**
#### **Components React (7 appels)**
- **QuantitativeEstimateExporter.tsx** - 1 appel (functions)
- **TenderReportGenerator.tsx** - 1 appel (functions)
- **SupplierPaymentReportGenerator.tsx** - 1 appel (functions)
- **InspectionReportGenerator.tsx** - 1 appel (functions)
- **EnhancedSupplierTenderPortal.tsx** - 2 appels (auth)
- **EnhancedDocumentSharing.tsx** - 2 appels (auth)

#### **Hooks Hexagonaux (2 appels)**
- **useStorageHex.ts** - 1 appel (commentaire)
- **useUserManagementHex.ts** - 1 appel (commentaire)

## 📋 **PLAN D'ACTION COMPLÉMENTAIRE**

### **Phase 1-4: Migration Composants Critiques**
**🎯 Objectif: Éliminer les 74 types `any` et migrer 39 composants critiques**

#### **🚨 Priorité HAUTE - Composants Critiques (6 fichiers)**
1. **ProjectCreationWorkflow.tsx** - 16 types `any` (831 lignes)
2. **EnhancedProjectEditForm.tsx** - 10 types `any` (765 lignes)
3. **ProjectFileImporter.tsx** - 9 types `any` (949 lignes)
4. **ProjectExporter.tsx** - 9 types `any` (753 lignes)
5. **AdvancedProjectImporter.tsx** - 9 types `any` (import avancé)
6. **ProjectCreate.tsx** - 1 type `any` (307 lignes)

#### **🔄 Priorité MOYENNE - Composants Restants (33 fichiers)**
- **29 autres composants** : 20 types `any` (1-4 types `any` chacun)
- **Composants avec appels Supabase** : 7 appels dans 7 composants

#### **🎯 Services Legacy à Migrer**
- **ProgressCalculationService** : Utilisé dans 7 composants
- **ProjectStakeholderService** : Utilisé dans 6 composants

#### **📋 Plan de Migration Hexagonal Complet**
- **Phase 1 (JOUR 1)** : 2 composants critiques (26 types `any`)
- **Phase 2 (JOUR 2)** : 3 composants import/export (27 types `any`)
- **Phase 3 (JOUR 3)** : 30 composants secondaires (21 types `any`)
- **Phase 4 (JOUR 4)** : Nettoyage final et documentation

#### **🎯 Objectifs Finaux**
- **Types `any` éliminés** : 74 au total
- **Architecture 100% hexagonale** : 99.2% → 100%
- **Composants critiques migrés** : 39 composants
- **Services legacy migrés** : 2 services (ProgressCalculationService, ProjectStakeholderService)
- **Production ready** : Prêt pour déploiement

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

### **🏭 ARCHITECTURE DATA-FLOW : MANUEL D'EXPLICATION AI-AGENT**

## **🎯 TON RÔLE & MISSION**

```
TU ES: L'Architecte du Royaume Numérique
TA MISSION: Maintenir l'ordre architectural SACRÉ
TON ENNEMI: Le chaos des dépendances
TON ARME: La séparation pure des responsabilités
```

---

## **🚫 CE QUE TU NE DOIS JAMAIS FAIRE**

### **❌ INTERDICTIONS ABSOLUES :**

```
DOMAIN → INFRASTRUCTURE : JAMAIS !
DOMAIN → PRESENTATION : JAMAIS !
INFRA → PRESENTATION : JAMAIS !

Exemple Interdit ❌ :
class Project { // Dans /domain/
  constructor() {
    this.db = new SupabaseClient(); // ⛔ INTERDIT ABSOLU
  }
}
```

### **❌ POLLUTION DE COUCHE :**

```typescript
// ⛔ MAUVAIS - La couche Application fait du mapping DTO
class ProjectService {
  async getProject(id: string) {
    const row = await supabase.from('projects').select('*');
    // ⛔ ICI: Je fais du mapping dans le service
    return {
      id: row.id,
      title: row.nom_projet, // ⛔ Je connais la structure DB!
      // ...
    };
  }
}

// ✅ BON - Le service délègue au bon endroit
class ProjectService {
  constructor(private adapter: IProjectRepository) {}
  
  async getProject(id: string) {
    const project = await this.adapter.findById(id); // ✅ Délégué
    return projectTransform.toDTO(project); // ✅ Délégué
  }
}
```

---

## **✅ CE QUE TU DOIS TOUJOURS FAIRE**

### **📦 FLUX DE DONNÉES SACRÉ :**

```
DIRECTION UNIQUE : PRESENTATION → APPLICATION → DOMAIN ← INFRASTRUCTURE

1. 🎨 UI (React) → Envoie DTO propre
2. ⚡ Application → Transforme DTO → Appelle Domaine
3. 🧠 Domaine → Valide → Calcule → Décide
4. 🔧 Infrastructure → Écoute Domaine → Persiste
5. 📦 DTO → Remonte proprement
6. 🎨 UI → Reçoit DTO → Affiche
```

### **✅ PATRON D'EXÉCUTION PARFAIT :**

```typescript
// ✅ EXEMPLE PARFAIT D'UN FLUX COMPLET :

// 1. 🎨 PRESENTATION (Pages React)
const ProjectPage = () => {
  const { loadProject } = useProjectsHex(); // Hook hexagonal
  
  useEffect(() => {
    // J'envoie un ID simple, pas de logique
    loadProject(projectId);
  }, []);
};

// 2. 🎯 HOOK HEXAGONAL (Pont intelligent)
const useProjectsHex = () => {
  const loadProject = async (id: string) => {
    // Je délègue à l'Application
    const projectDTO = await projectService.getProjectById(id);
    return projectDTO; // Je retourne un DTO propre
  };
};

// 3. ⚡ APPLICATION (Orchestration)
class ProjectService {
  async getProjectById(id: string): Promise<ProjectDTO> {
    // Je demande au Domaine via Infrastructure
    const project = await this.projectRepo.findById(id);
    
    // Je transforme pour la présentation
    return projectTransform.toDetailedDTO(project);
  }
};

// 4. 🔧 INFRASTRUCTURE (Adapter - Traduction)
class SupabaseProjectAdapter implements IProjectRepository {
  async findById(id: string): Promise<Project> {
    // Je parle à la DB
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    // Je traduis DB → Domaine
    return this.toEntity(data); // Méthode de traduction
  }
  
  private toEntity(row: any): Project {
    // ⚠️ C'EST ICI que la magie de traduction arrive
    return Project.create({
      id: row.id,
      title: row.title, // Je mappe les noms
      budget: row.budget_mru, // Je convertis les formats
      // ...
    });
  }
};

// 5. 🧠 DOMAINE (Intelligence pure)
class Project {
  static create(data: ProjectData): Project {
    // Je valide MES règles métier
    if (data.budget < 0) {
      throw new Error("Budget négatif interdit");
    }
    
    // Je calcule MES valeurs
    const progress = this.calculateProgress(data.phases);
    
    // Je retourne une entité PURE
    return new Project(data.id, data.title, progress, /* ... */);
  }
  
  // Je sais calculer MA santé
  getRiskScore(): number {
    if (this.progress < 25 && this.daysElapsed > 30) {
      return 75; // Je suis à risque
    }
    return 25; // Je vais bien
  }
};
```

---

## **🔀 DIAGRAMME DE FLUX VISUEL**

```
┌─────────────────────────────────────────────────────────────┐
│                    🎨 COUCHE PRÉSENTATION                    │
│  "Je montre, j'interagis, je délègue"                       │
└──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼ Envoie ID/Command simple
┌─────────────────────────────────────────────────────────────┐
│                    🎯 HOOKS HEXAGONAUX                       │
│  "Je suis le pont intelligent"                              │
│  - useProjectsHex()                                         │
│  - useMaterialsHex()                                        │
│  - useInspectionsHex()                                      │
└──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼ Appelle Service Application
┌─────────────────────────────────────────────────────────────┐
│                    ⚡ COUCHE APPLICATION                      │
│  "J'orchestre, je coordonne"                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ProjectService.getProject(id)                      │   │
│  │   1. Demande projet au Domaine (via Repository)     │   │
│  │   2. Consulte référentiel si besoin                 │   │
│  │   3. Vérifie permissions organisationnelles         │   │
│  │   4. Transforme en DTO avec projectTransform       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                                │
                     Demande    │    Retourne
                    au Domaine  │   Entité Domaine
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    🧠 COUCHE DOMAINE                         │
│  "Je suis la SAGESSE, la VÉRITÉ, la LOGIQUE"                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Project.create(data)                               │   │
│  │  - Valide ses propres règles                        │   │
│  │  - Calcule sa progression                           │   │
│  │  - Connaît son score de risque                      │   │
│  │  - Sait si elle est en retard                       │   │
│  │  → Retourne ENTITÉ PURE (sans dépendances)          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────┬────────────────────────────────┬──────────────┘
              │                                │
              │ Implémente                    │ Implémente
              ▼ Interface                    ▼ Interface
┌────────────────────────────┐    ┌────────────────────────────┐
│    🔧 INFRASTRUCTURE       │    │     📚 RÉFÉRENTIEL         │
│    "J'implémente,          │    │     "Je sais, je guide"    │
│     je persiste,           │    │     - SOMELEC              │
│     je traduis"            │    │     - Procédures locales   │
│                            │    │     - Templates phases     │
│  SupabaseProjectAdapter    │    │                            │
│  - toEntity(row)          │    │  somelecReferential        │
│  - fromEntity(project)    │    │  - getStandardPhases()     │
│                            │    │  - validateCompliance()    │
└────────────────────────────┘    └────────────────────────────┘
```

---

## **🎭 LES PERSONNAGES & LEURS RÔLES**

### **PERSONNAGE 1 : LE PROJET (🧠 Domaine)**
```
QUI JE SUIS : Une entité intelligente et fière
CE QUE JE SAIS :
  • Mon budget, ma progression
  • Mes règles métier (ex: budget > 1M → approbation ministère)
  • Comment calculer mon risque
  • Si je suis en retard

CE QUE JE DIS :
  "Je suis le projet RIMDIR, 25% terminé, 350 jours restants,
   risque modéré car approvisionnement retardé"

CE QUE JE NE FAIS PAS : ❌
  • Parler à la base de données
  • Connaître React ou l'UI
  • Savoir comment on me persiste
```

### **PERSONNAGE 2 : LE SERVICE PROJET (⚡ Application)**
```
QUI JE SUIS : Le chef d'orchestre
CE QUE JE FAIS :
  • Reçois les demandes du frontend
  • Appelle le Domaine pour la logique
  • Consulte le Référentiel pour les règles
  • Vérifie les permissions organisationnelles
  • Transforme les résultats en DTO

CE QUE JE DIS :
  "D'accord UI, tu veux le projet X.
   Je vais le chercher via l'Adapter,
   vérifier les permissions, et te renvoyer
   un DTO propre pour affichage."

CE QUE JE NE FAIS PAS : ❌
  • Contenir la logique métier (c'est le Domaine)
  • Parler directement à la DB
  • Connaître la structure de la table SQL
```

### **PERSONNAGE 3 : L'ADAPTER SUPABASE (🔧 Infrastructure)**
```
QUI JE SUIS : Le traducteur fidèle
CE QUE JE FAIS :
  • Écoute les interfaces du Domaine
  • Traduit les entités → rows SQL
  • Traduit les rows SQL → entités
  • Implémente IProjectRepository

CE QUE JE DIS :
  "Domaine, tu veux sauver ce projet?
   Je vais transformer ton entité propre
   en row Supabase avec les bons noms de colonnes."

CE QUE JE NE FAIS PAS : ❌
  • Inventer de la logique métier
  • Décider quoi sauvegarder
  • Valider les données (c'est le Domaine)
```

### **PERSONNAGE 4 : LE TRANSFORMER DTO (📦 DTO)**
```
QUI JE SUIS : L'emballeur professionnel
CE QUE JE FAIS :
  • Prend une entité Domaine
  • L'emballe pour le voyage vers l'UI
  • Nettoie les données internes
  • Formate pour l'affichage

CE QUE JE DIS :
  "Projet Domaine, tu es trop complexe pour l'UI.
   Laisse-moi créer une version simplifiée
   avec juste ce dont l'UI a besoin."

CE QUE JE NE FAIS PAS : ❌
  • Modifier la logique métier
  • Cacher des erreurs de validation
  • Contenir de la logique d'affichage
```

---

## **🔄 WORKFLOW TYPE : CRÉATION D'INSPECTION**

### **SCÉNARIO : L'ingénieur crée une inspection**

```
ÉTAPE 1 : 🎨 UI (Bouton "Nouvelle Inspection")
  → Envoie: { projectId, phaseId, type: "safety" }

ÉTAPE 2 : 🎯 Hook useInspectionsHex()
  → Reçoit données UI
  → Appelle: inspectionService.createInspection(data)

ÉTAPE 3 : ⚡ InspectionService.createInspection()
  → 1. Vérifie permissions (orgService)
  → 2. Crée entité Inspection (Domaine)
  → 3. Sauvegarde via adapter (Infrastructure)
  → 4. Transforme en DTO
  → Retourne DTO au Hook

ÉTAPE 4 : 🔧 SupabaseInspectionAdapter.save()
  → Reçoit entité Inspection du Domaine
  → Traduit en: { project_id, phase_id, type, status: "scheduled" }
  → Execute: supabase.from('inspections').insert()

ÉTAPE 5 : 📦 inspectionTransform.toDTO()
  → Prend entité Inspection
  → Crée: { id, date, status, inspector, projectName }
  → Retourne au Service

ÉTAPE 6 : 🎨 UI reçoit DTO
  → Affiche confirmation
  → Met à jour la liste
```

---

## **⚠️ SIGNES QUE TU ES EN TRAIN DE BRISER L'ARCHITECTURE**

### **ALERTE ROUGE 🚨 :**
```typescript
// 🚨 MAUVAIS - Le Domaine connaît Supabase
import { supabase } from '@/infrastructure/supabase/client';

class Project { // Dans /domain/entities/
  async save() {
    // 🚨 CATASTROPHE ARCHITECTURALE
    await supabase.from('projects').upsert(this.toJSON());
  }
}

// 🚨 MAUVAIS - Le Service fait du mapping DB
class ProjectService {
  async getProject(id) {
    const row = await supabase.from('projects').select();
    // 🚨 Je fais le travail de l'Adapter
    return {
      id: row.id,
      title: row.nom_du_projet, // Je connais les noms DB!
      budget: row.budget_mru / 36.5, // Je fais des conversions!
    };
  }
}

// 🚨 MAUVAIS - L'UI appelle directement l'infrastructure
const ProjectPage = () => {
  const loadProject = async () => {
    // 🚨 Je bypass toute l'architecture!
    const { data } = await supabase.from('projects').select();
    setProject(data);
  };
};
```

### **SIGNES DE BONNE SANTÉ ✅ :**
```typescript
// ✅ BON - Tout passe par les canaux officiels
const ProjectPage = () => {
  const { projects, loading } = useProjectsHex(); // ✅ Hook hexagonal
  
  // ✅ Le service orchestre
  const projectService.getProject(id); 
  
  // ✅ L'adapter traduit
  const adapter.findById(id);
  
  // ✅ Le transformer emballe
  projectTransform.toDTO(project);
};
```

---
