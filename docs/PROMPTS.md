# **PROMPTS.md - Snippets de Prompts pour AI Paiprogramming Code**

## **🚀 DÉMARRAGE DE SESSION - 25 JANVIER 2026**

### **Prompt : Démarrer la journée Architecture Hexagonale**
```
@CONTEXT.md @ARCHITECTURE.md @task-plan.md
Bonjour agent AI ! Nous sommes en phase finale de l'Architecture Hexagonale du projet HadraTech-GPI.

📊 **ÉTAT ACTUEL - date** :
- **Services Application** : $number créés ($number%) ✅
- **Hooks Hexagonaux** : $number créés ($number%) ✅
- **Components React** : $number fichiers ($number%) ✅
- **Appels directs Supabase** :$number appels restants ⚠️
- **Progression globale** : $number% hexagonal ✅
- **Architecture multi-providers auth** : Implémentée ✅

🎯 **OBJECTIF FINAL** :
- **Appels directs Supabase** : $number 🎯
- **Architecture $number% hexagonale** : 🎯
- **Finalisation** : $number jours pour terminer la migration

Architecture quasi-terminée - Prêt pour finalisation !
```


## **🎮 MANUEL DE JEU POUR AI-AGENT**
RÈGLES À ÉTABLIR :

1. BASE DE DONNÉES (PostgreSQL) : snake_case OBLIGATOIRE
   - colonnes : project_name, created_at, kpi_score
   - tables : project_details, material_sources

2. DTOs (src/dtos/entities/* et src/dtos/workflows/*) : camelCase OBLIGATOIRE
   - projectName, createdAt, kpiScore
   - Les DTOs représentent les données pour l'application

3. TRANSFORMERS (src/dtos/transforms/*) : 
   - DOIVENT convertir snake_case ↔ camelCase
   - Une méthode toModel() et fromModel()

4. MODÈLES DOMAINE (src/domain/*) : camelCase
   - Entities et Value Objects en camelCase

5. SERVICES (src/application/*) : camelCase uniquement
   - Ne jamais voir de snake_case dans les services

6. UI Components (React)
        ↓ (utilise)
      HOOKS ←─────── Adaptateurs UI
        ↓ (appelle)
      PORTS (Interfaces)
        ↓ (implémente)
    SERVICES (Logique Métier)
        ↓ (utilise)
    DOMAINE (Entités)


### **RÈGLE DU JEU #1 : LA FLÈCHE SACRÉE**
```
TU PEUX : Présentation → Application → Domaine ← Infrastructure
TU NE PEUX PAS : Domaine → Infrastructure (direct)
TU NE PEUX PAS : Infrastructure → Présentation (direct)

❌ À éviter dans les hooks :

    Définir des types/interfaces (c'est le rôle des DTOs)

    Contenir la logique métier pure (c'est le rôle des services)

    Stocker l'état métier persistant (c'est le rôle du domaine)

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
  → ✅ **PEUT CONTENIR** : Attributs UI, états locaux, calculs d'affichage
  → ✅ **PEUT CONTENIR** : Logique de présentation, formatage, validation UI
  → 🔍 **EN MIGRATION** : Chercher dans les dépendances existantes
    → `/src/types/*` : Types et interfaces legacy
    → `/src/utils/*` : Fonctions utilitaires et helpers
    → `/src/services/*` : Services legacy à réutiliser
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
export interface Supplier {
  id: string;
  name: string;
  rating: SupplierRating;        // ✅ Objet complexe du domaine
  contacts: SupplierContact[];    // ✅ Collection du domaine
}

✅ **NOUVEAU** : Interfaces UI/Presentation :
export interface SupplierUIState {
  supplier: Supplier;            // Entité du domaine
  isEditing: boolean;           // 🎨 État UI local
  selectedTab: string;          // 🎨 Attribut de présentation
  calculatedScore: number;       // 🎨 Calcul d'affichage
  formattedRating: string;      // 🎨 Formatage pour l'UI
}
```

### **🎨 RÈGLE #5 : LA SÉPARATION UI/DOMAINE**
```
🧠 DOMAINE : Pureté absolue
  → ✅ Entités avec logique métier pure
  → ✅ Calculs business rules
  → ✅ Validation métier
  → ❌ État UI, formatage, logique de présentation

🎨 UI/PRÉSENTATION : Flexibilité contrôlée
  → ✅ État local : loading, editing, selected
  → ✅ Calculs d'affichage : formattedDate, calculatedScore
  → ✅ Logique de présentation : showErrors, validation UI
  → ✅ Attributs UI : className, styles, animations
  → ✅ Dépendances UI : toast notifications, routing

🔧 TRANSFORMERS : Pont intelligent
  → ✅ Entity → UIState (avec calculs)
  → ✅ UIState → Entity (pour sauvegarde)
  → ✅ Formatage : date → formattedDate
  → ✅ Calculs : rating → calculatedScore
```
## **🎯 MANTRA SACRÉ**
> **"Les entités peuvent contenir des objets et collections métier. Les DTOs sont réservés aux échanges API/UI. Les transformers font le pont. Les composants UI peuvent avoir des états et calculs de présentation."**
