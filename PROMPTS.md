# **PROMPTS.md - Snippets de Prompts pour AI Paiprogramming Code**

## **🚀 DÉMARRAGE DE SESSION**

### **Prompt : Démarrer la journée Architecture Hexagonale**
```
@docs/task-plan.md @CONTEXT.md @docs/architecture-flux-complete.md

Bonjour agent AI ! Nous sommes en phase d'Architecture Hexagonale Centralisée du projet HadraTech-GPI.


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

### **Prompt : Validation Architecture Hexagonale**
```
@docs/task-plan.md @CONTEXT.md

Bonjour agent AI ! Nous devons valider l'architecture hexagonale complète.

1. Vérifie que tous les adaptateurs implémentent les interfaces `I*Repository*`
2. Confirme que tous les services utilisent les transformers enrichis
3. Valide que tous les hooks hexagonaux sont créés
4. Vérifie la séparation des responsabilités
5. Confirme le flux UI → Hook → Service → Transformer → Adapter → BDD

Architecture hexagonale centralisée 🚀 - Validation complète ✅
```

### **Prompt : Migration Composant Spécifique**
```
@docs/task-plan.md @CONTEXT.md

Aide-moi à migrer ce composant vers l'architecture hexagonale :

1. Analyse le composant actuel et identifie les appels directs Supabase
2. Crée le hook hexagonal correspondant si nécessaire
3. Utilise les services hexagonaux existants
4. Applique le pattern UI → Hook → Service → Transformer → Adapter → BDD
5. Valide que le composant est 100% hexagonal

Composant à migrer : [NOM_DU_COMPOSANT]

Architecture hexagonale centralisée 🚀 - Migration composant ✅
```

### **Prompt : Création Hook Hexagonal**
```
@docs/task-plan.md @CONTEXT.md

Aide-moi à créer un hook hexagonal pour cette fonctionnalité :

1. Analyse le besoin et identifie le service hexagonal à utiliser
2. Crée le hook avec React Query pour la gestion d'état
3. Applique le pattern Hook → Service → Transformer → Adapter → BDD
4. Utilise les DTOs appropriés pour les types
5. Ajoute les mutations et queries nécessaires

Fonctionnalité : [DESCRIPTION]
Service à utiliser : [NOM_SERVICE]

Architecture hexagonale centralisée 🚀 - Création hook ✅
```

### **Prompt : Correction Exports Hooks**
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

Architecture hexagonale centralisée 🚀 - Exports corrigés ✅
```

### **Prompt : Correction Erreurs Techniques**
```
@docs/task-plan.md @CONTEXT.md @docs/architecture-flux-complete.md

Bonjour agent AI ! Nous démarrons la correction des erreurs techniques de l'architecture hexagonale centralisée.

1. Analyse les erreurs TypeScript dans les composants
2. Corrige les imports et exports manquants
3. Vérifie la cohérence des types DTO
4. Applique les corrections nécessaires
5. Valide que tout compile correctement

Architecture hexagonale centralisée 🚀 - Correction technique ✅
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
@CONTEXT.md @docs/task-plan.md

Fais-moi un bilan complet de la migration hexagonale avec les 130 fichiers identifiés :

### **📈 STATISTIQUES GLOBALES DE MIGRATION**
- **Services Legacy** : 8 fichiers à migrer
- **Composants React** : 18 fichiers à migrer  
- **Hooks Legacy** : 15 fichiers à migrer
- **Hooks Hexagonaux** : 103 fichiers à finaliser
- **Document Repositories** : 3 fichiers à migrer
- **TOTAL** : 515 fichiers à migrer

#### **🎯 ÉTAT ACTUEL**
- **Services créés** : 31/31 (100%)
- **Hooks hexagonaux** : 89/103 (86.41% propres)
- **Composants refactorisés** : 368/386 (95.34%)
- **Architecture globale** : 93.46% hexagonale

#### **📋 FICHIERS PAR PRIORITÉ**
1. **Phase 1** : Hooks critiques (6+ appels) - 3 fichiers
2. **Phase 2** : Components critiques (3+ appels) - 2 fichiers  
3. **Phase 3** : Hooks moyens (2-5 appels) - 9 fichiers
4. **Phase 4** : Fichiers simples (1-2 appels) - 18 fichiers
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
- ✅ **Hooks hexagonaux** : 21/40 créés (useProjectsHex, useSuppliersHex, useAuthHex, useMaterialsHex, useDocumentsHex, useInspectionHex, useUsersHex, useTaskAssignmentsHex)
- ✅ **Services hexagonaux** : 31/31 créés (Document, Payment, Auth, etc.)
- ✅ **Composants refactorisés** : ProjectPhasesDetail.tsx - 100% hexagonal
- ✅ **useDocumentsHex.ts** : Créé et corrigé (suppression anti-patterns)
- ✅ **useUsersHex.ts** : Créé (gestion utilisateurs)
- ✅ **useTaskAssignmentsHex.ts** : Créé (gestion tâches)
- 🔄 **Appels directs restants** : 39 appels dans 39 fichiers (components + hooks)
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

### **État Actuel au 23/01/2026**
- **Architecture hexagonale** : 95% terminée ✅
- **Services créés** : 31/31 (100%) ✅
- **Hooks migrés** : 21/40 (52%) 🔄
- **Appels directs restants** : 39 dans 39 fichiers 🔄
- **Dernière correction** : Duplicate function implementation dans Project.ts (clone → copy) ✅
- **Prochaines étapes** : Finaliser migration des 39 appels directs restants
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

**Progression Hooks** : *var*/*var* (*var*%) avec architecture *var*% hexagonale

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
