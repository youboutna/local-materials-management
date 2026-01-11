# **PROMPTS.md - Snippets de Prompts pour Claude Code**

## **🚀 DÉMARRAGE DE SESSION**

### **Prompt : Démarrer la journée Phase 4**
```
@docs/task-plan.md @CONTEXT.md 

Bonjour 
agent AI ! Nous sommes en Phase 4 du projet HadraTech-GPI.

1. Rappelle-moi brièvement l'objectif de Phase 4
2. Liste les composants Phase 3 déjà disponibles pour réutilisation
3. Identifie les 3 premières tâches prioritaires pour Phase 4
4. Suggère un ordre d'implémentation optimal pour aujourd'hui

Phase 3 terminée ✅ - PhaseDetailsPage en construction 🚀
```

### **Prompt : État du projet**
```
@docs/task-plan.md 

Fais-moi un résumé de l'état d'avancement :
- Phase actuelle et % progression estimé
- Composants Phase 3 terminés (prêts pour réutilisation)
- Nouveaux composants Phase 4 à créer
- Risques ou blocages potentiels spécifiques à Phase 4
- Temps estimé pour compléter Phase 4
```

## **🎨 DESIGN & CONCEPTION PHASE 4**

### **Prompt : Concevoir PhaseDetailsPage**
```
@docs/task-plan.md section "Phase 4: Structure Planifiée"
@src/components/project/hierarchy/ProjectHeader.tsx
@CONTEXT.md

Conçois PhaseDetailsPage avec architecture modulaire :

**Requirements:**
1. Design cohérent avec ProjectDetailByDTO (Phase 3)
2. Deux modes d'affichage conditionnels (avec/sans étapes)
3. Navigation hiérarchique claire (breadcrumb)
4. Métriques phase-spécifiques
5. Actions contextuelles selon statut phase

**Structure proposée:**
```
PhaseDetailsPage
├── PhaseBreadcrumb (Projets → [Projet] → [Phase])
├── PhaseHeader (titre + statut + métriques)
├── PhaseContentSwitcher (conditionnel)
│   ├── PhaseWithStepsView (si hasSteps)
│   └── PhaseWithDirectMilestonesView (si !hasSteps)
├── PhaseMetrics (KPI détaillés)
└── PhaseActions (boutons selon workflow)
```

Crée une maquette conceptuelle avant implémentation.
```

### **Prompt : Réutiliser composants Phase 3**
```
@src/components/project/hierarchy/PhaseNode.tsx
@src/components/project/hierarchy/KPICard.tsx
@docs/task-plan.md

Adapte ces composants Phase 3 pour Phase 4 :

**PhaseNode → PhaseNodeDetail:**
- Enlever toggle expand/collapse (toujours expanded)
- Ajouter plus de détails phase
- Changer comportement navigation
- Ajouter actions spécifiques phase

**KPICard → PhaseKPICard:**
- Métriques phase-spécifiques
- Calculs budget phase (% du total projet)
- Indicateurs délai phase
- Jalons/inspections phase

Propose les modifications nécessaires.
```

## **🔨 IMPLÉMENTATION COMPOSANTS PHASE 4**

### **Prompt : Créer PhaseBreadcrumb**
```
@docs/task-plan.md section "Phase 4"
@CONTEXT.md

Crée le composant PhaseBreadcrumb :

**Fonctionnalités:**
1. Navigation hiérarchique : "Projets → [Nom Projet] → [Nom Phase]"
2. Lien cliquable "Projets" (retour liste)
3. Lien cliquable "[Nom Projet]" (retour ProjectDetailByDTO)
4. Texte courant "[Nom Phase]" (non cliquable, style accentué)
5. Icônes indicatives pour chaque niveau

**Props:**
```typescript
interface PhaseBreadcrumbProps {
  project: Project;
  phase: Phase;
  className?: string;
}
```

**Style:**
- Design cohérent avec breadcrumb existant
- Responsive : stack vertical sur mobile
- Typographie hiérarchique claire
- Couleurs du design system
```

### **Prompt : Créer PhaseHeader**
```
@docs/task-plan.md
@src/components/project/hierarchy/ProjectHeader.tsx

Crée PhaseHeader inspiré de ProjectHeader :

**Éléments à inclure:**
1. Titre phase + badge statut (même système couleurs)
2. Description phase (optionnelle)
3. Dates (début - fin) avec indicateur délai
4. Budget phase + % vs budget projet total
5. Progression phase (barre de progression)
6. Indicateur structure : "X étapes" ou "X jalons directs"

**Calculs nécessaires:**
- budgetPercentage = (phase.budget / project.budget) * 100
- daysRemaining = daysBetween(today, phase.end_date)
- structureLabel = phase.steps?.length > 0 ? `${phase.steps.length} étapes` : `${phase.milestones?.length || 0} jalons directs`

**Design:**
- Layout similaire à ProjectHeader mais phase-spécifique
- Utiliser les mêmes composants Shadcn/ui
- Responsive design
```

### **Prompt : Créer PhaseContentSwitcher**
```
@docs/task-plan.md section "Phase 4: Structure Planifiée"
@CONTEXT.md

Crée PhaseContentSwitcher avec logique conditionnelle :

**Mode 1: Phase AVEC étapes (hasSteps = true)**
- Afficher PhaseWithStepsView
- Structure : Liste StepAccordion dépliables
- Chaque StepAccordion contient ses MilestoneCard

**Mode 2: Phase SANS étapes (hasSteps = false)**
- Afficher PhaseWithDirectMilestonesView
- Structure : Liste directe de MilestoneCard
- Groupement optionnel par type

**Mode 3: Phase VIDE**
- Afficher EmptyState
- Message "Cette phase est vide"
- CTA "Ajouter étape" ou "Ajouter jalon"

**Props:**
```typescript
interface PhaseContentSwitcherProps {
  phase: Phase;
  project: Project;
  onAddStep?: () => void;
  onAddMilestone?: () => void;
}
```

Implémente la logique de rendu conditionnel.
```

### **Prompt : Créer PhaseWithStepsView**
```
@docs/task-plan.md
@src/components/project/hierarchy/StepNode.tsx

Crée PhaseWithStepsView pour phases avec étapes :

**Structure:**
```
PhaseWithStepsView
├── En-tête : "Étapes de la phase (X)"
├── Liste StepAccordion
│   ├── StepAccordion (étape 1)
│   │   ├── Titre étape + progression
│   │   ├── Dates étape
│   │   └── Liste MilestoneCard (jalons étape)
│   └── StepAccordion (étape 2)
└── Footer : bouton "Ajouter étape"
```

**Comportement:**
- StepAccordion dépliable/ployable
- Navigation vers détail étape au click sur titre
- Affichage progression étape (barre)
- Actions rapides sur chaque étape

Utilise StepNode de Phase 3 comme base.
```

### **Prompt : Créer PhaseWithDirectMilestonesView**
```
@docs/task-plan.md
@src/components/project/hierarchy/MilestoneNode.tsx

Crée PhaseWithDirectMilestonesView pour phases sans étapes :

**Structure:**
```
PhaseWithDirectMilestonesView
├── En-tête : "Jalons directs (X)"
├── Groupe par type (optionnel)
│   ├── "Validations" (X)
│   │   ├── MilestoneCard
│   │   └── MilestoneCard
│   ├── "Inspections" (X)
│   └── "Paiements" (X)
└── Footer : bouton "Ajouter jalon"
```

**Fonctionnalités:**
- Filtrage par type/statut
- Tri par date d'échéance
- Recherche dans les titres
- Vue compacte/étendue

Utilise MilestoneNode de Phase 3 comme base.
```

## **📱 RESPONSIVE DESIGN**

### **Prompt : Design responsive PhaseDetailsPage**
```
@docs/task-plan.md
@CONTEXT.md

Conçois le layout responsive pour PhaseDetailsPage :

**Mobile (< 768px):**
```
[PhaseBreadcrumb - stack vertical]
[PhaseHeader - version compacte]
[PhaseContentSwitcher - liste pleine largeur]
[PhaseActions - barre fixe bas ou menu]
```

**Tablet (768px - 1024px):**
```
[PhaseBreadcrumb]
[PhaseHeader]
┌──────────────────────┐
│ PhaseContent (70%)   │ PhaseMetrics (30%)
└──────────────────────┘
[PhaseActions - inline]
```

**Desktop (> 1024px):**
```
[PhaseBreadcrumb]
[PhaseHeader]
┌──────────────────────┬──────────────────┐
│ PhaseContent (60%)   │ SidePanel (40%)  │
│                      │ ├── PhaseMetrics │
│                      │ └── PhaseActions │
└──────────────────────┴──────────────────┘
```

Propose les classes Tailwind pour chaque layout.
```

## **🧪 TESTS & QUALITÉ**

### **Prompt : Tests composants Phase 4**
```
@docs/task-plan.md section "Phase 4"
@src/components/project/hierarchy/

Crée les tests pour les composants Phase 4 :

**Composants à tester:**
1. PhaseBreadcrumb
2. PhaseHeader
3. PhaseContentSwitcher (3 modes)
4. PhaseWithStepsView
5. PhaseWithDirectMilestonesView

**Scénarios:**
- Navigation breadcrumb fonctionnelle
- Calculs métriques corrects
- Affichage conditionnel selon structure
- États vides gérés
- Responsive breakpoints
- Interactions utilisateur

Utilise Vitest et Testing Library.
```

### **Prompt : Review code Phase 4**
```
@docs/architecture.md
@docs/task-plan.md section "Phase 4"
@src/components/project/hierarchy/[composant].tsx

Review complet selon critères Phase 4 :

**Cohérence Phase 3 ✅**
- Réutilise-t-il des patterns Phase 3 ?
- Design similaire à ProjectDetailByDTO ?
- Mêmes composants Shadcn/ui ?

**Architecture ✅**
- Utilise Services pour données ?
- Props bien typées ?
- Séparation des responsabilités ?

**Conditionnel ✅**
- Gère correctement hasSteps ?
- États vides bien gérés ?
- Navigation hiérarchique fonctionnelle ?

**Responsive ✅**
- Breakpoints corrects ?
- Mobile-first design ?
- Touch-friendly sur mobile ?

Suggestions d'amélioration spécifiques à Phase 4.
```

## **📝 DOCUMENTATION & SUIVI**

### **Prompt : Mettre à jour task-plan après avancement**
```
@docs/task-plan.md

Nous venons de terminer :
- [Composant1 Phase 4] ✅
- [Composant2 Phase 4] ✅

Mets à jour le task-plan.md :
1. Ajoute une section "Réalisations Phase 4" avec composants créés
2. Mets à jour la progression Phase 4 (%)
3. Liste les prochaines tâches prioritaires
4. Note les décisions techniques importantes prises
5. Identifie les composants Phase 3 réutilisés

Garde le format .md cohérent.
```

### **Prompt : Documentation composant Phase 4**
```
@src/components/project/hierarchy/[NomComposantPhase4].tsx

Génère la documentation complète :

**Format:**
```markdown
## [NomComposant]

### Description
[Rôle dans PhaseDetailsPage]

### Cas d'utilisation
- Quand utiliser ce composant ?
- Parties de PhaseDetailsPage où il apparaît

### Props
```typescript
// Interface avec commentaires détaillés
```

### Relations
- Composants parents : [liste]
- Composants enfants : [liste]
- Hooks/services utilisés : [liste]

### Affichage conditionnel
[Description des règles d'affichage spécifiques]

### Responsive design
[Comportement sur mobile/tablet/desktop]

### Exemple d'utilisation
```typescript
// Code exemple complet
```

### Notes Phase 4
[Décisions spécifiques à Phase 4]
```
```

## **🔄 INTÉGRATION & MIGRATION**

### **Prompt : Intégrer PhaseDetailsPage dans le router**
```
@src/routes/
@docs/task-plan.md

Intègre PhaseDetailsPage dans l'application :

**Requirements:**
1. Route : `/phases/:phaseId`
2. Layout : Même layout que ProjectDetailByDTO
3. Navigation : Depuis PhaseNode dans ProjectDetailByDTO
4. Breadcrumb : Doit fonctionner avec navigation history
5. Data loading : Utiliser PhaseService

**À faire:**
- Créer la route dans router configuration
- Implémenter le loader pour la phase
- Gérer les états loading/error
- Intégrer le breadcrumb hiérarchique
- Tester la navigation depuis ProjectDetailByDTO
```

### **Prompt : Migration depuis ancien design**
```
@docs/task-plan.md
@CONTEXT.md section "Ancien design"

Planifie la migration vers le nouveau design PhaseDetailsPage :

**Étapes:**
1. Backup de l'ancienne implémentation
2. Implémentation progressive (feature flags)
3. Tests A/B si nécessaire
4. Migration données (si structure changée)
5. Formation utilisateurs (si changements majeurs)

**Risques:**
- Données existantes à préserver
- URLs à maintenir pour le SEO
- Sessions utilisateurs en cours
- Permissions et accès

Propose un plan de migration par étapes.
```

## **🎯 PROMPTS RAPIDES POUR TÂCHES COURANTES**

### **Prompt : Composant simple**
```
@CONTEXT.md

Crée un composant [Nom] avec :
- Props : [liste]
- Style : [description]
- Responsive : [breakpoints]
- Tests : [scénarios]
```

### **Prompt : Debug erreur**
```
@src/[fichier].tsx

Erreur : [message]
Contexte : [description]
Essayer de : [action]
Résultat attendu : [comportement]
Résultat actuel : [comportement]
```

### **Prompt : Optimisation**
```
@src/[fichier].tsx

Problème : [description lenteur/complexité]
Suggère optimisations pour : [aspect spécifique]
```

### **Prompt : Refactor**
```
@src/[fichier].tsx

Ce code est [problème]. Refactorise pour :
1. [objectif 1]
2. [objectif 2]
3. [objectif 3]
```

---

## **💡 CONSEILS POUR PHASE 4**

### **Réutiliser Phase 3 :**
```
Composants Phase 3 réutilisables :
- KPICard → adapter pour PhaseKPICard
- PhaseNode → adapter pour PhaseNodeDetail
- StepNode → base pour StepAccordion
- MilestoneNode → base pour MilestoneCard
- ProjectHierarchyView → patterns pour PhaseWithStepsView
```

### **Priorités Phase 4 :**
```
1. PhaseBreadcrumb (navigation essentielle)
2. PhaseHeader (cohérence visuelle avec Phase 3)
3. PhaseContentSwitcher (logique conditionnelle)
4. PhaseWithStepsView (cas principal)
5. PhaseWithDirectMilestonesView (cas secondaire)
6. PhaseActions (workflows métier)
```

### **Tests Phase 4 :**
```
Scénarios critiques :
1. Phase avec étapes → affiche StepAccordion
2. Phase sans étapes → affiche MilestoneCard directs
3. Phase vide → empty state + CTA
4. Navigation breadcrumb fonctionnelle
5. Métriques calculées correctement
```

**Statut :** Phase 4 en cours - PhaseDetailsPage en développement 🚀  
**Pro tip :** Réutilise au maximum les composants et patterns de Phase 3 !