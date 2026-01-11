# **Task Plan: Amélioration du Design et Hiérarchie Visuelle des Pages Projet**

## **Goal**

Améliorer le design et la hiérarchie visuelle des pages **ProjectDetailByDTO** et **PhaseDetailsPage** en appliquant l'architecture hiérarchique 5 niveaux basée sur la structure de données projet.

## **Phases**

- [x] Phase 1: Analyse de la structure de données projet existante ✓
- [x] Phase 2: Conception de l'architecture hiérarchique 5 niveaux ✓
- [x] Phase 3: Redesign de ProjectDetailByDTO (Niveau 1 - Vue Projet) ✓
- [ ] Phase 4: Redesign de PhaseDetailsPage (Niveau 2 - Vue Phase) (CURRENT)
- [ ] Phase 5: Implémentation des règles d'affichage conditionnel
- [ ] Phase 6: Intégration et tests

## **Decisions Made**

- Architecture hiérarchique : **Projet → Phase → Étape → Jalon → Action**
- Basé sur la structure de données réelle du workflow
- Règles d'affichage conditionnel selon présence d'étapes
- Navigation fluide entre les niveaux hiérarchiques

## **Status**

**Phase 3 COMPLÉTÉE** ✓  
**Démarrage Phase 4** - Redesign de la page PhaseDetailsPage

---

## **Phase 3: Réalisations**

### **Composants créés dans `src/components/project/hierarchy/`:**
1. **`KPICard.tsx`** - Carte d'indicateurs clés avec icônes et tendances
2. **`ProjectHeader.tsx`** - Header avec breadcrumb et grille KPI
3. **`PhaseNode.tsx`** - Nœud de phase interactif avec toggle
4. **`ProjectHierarchyView.tsx`** - Vue hiérarchique complète du projet
5. **`ProjectMatrixView.tsx`** - Tableau matriciel projet × phases
6. **`StepNode.tsx`** - Nœud d'étape (prêt pour Phase 4)
7. **`MilestoneNode.tsx`** - Nœud de jalon (prêt pour Phase 4)

### **Intégration dans ProjectDetailByDTO.tsx:**
- Implémentation du nouveau header avec KPIs dynamiques
- Intégration de la vue hiérarchique interactive
- Navigation visuelle entre les niveaux
- Design responsive et accessible

---

## **Phase 4: Redesign de PhaseDetailsPage (Niveau 2)**

### **Objectif**
Créer une page phase qui :
1. Montre le contexte hiérarchique (projet parent)
2. Affiche le contenu selon la structure (avec/sans étapes)
3. Permet la navigation vers les niveaux supérieur/inférieur
4. Gère les workflows spécifiques à la phase

### **Structure Planifiée**

```tsx
const PhaseDetailsPage = ({ phaseId }) => {
  const phase = getPhase(phaseId);
  const project = getProject(phase.project_id);
  const hasSteps = phase.steps && phase.steps.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb et contexte */}
      <PhaseBreadcrumb project={project} phase={phase} />
      
      {/* En-tête phase */}
      <PhaseHeader phase={phase} />
      
      {/* Contenu conditionnel */}
      {hasSteps ? (
        <PhaseWithStepsView phase={phase} />
      ) : (
        <PhaseWithDirectMilestonesView phase={phase} />
      )}
      
      {/* Métriques phase */}
      <PhaseMetrics phase={phase} />
      
      {/* Actions spécifiques */}
      <PhaseActions phase={phase} />
    </div>
  );
};
```

### **Tâches Spécifiques Phase 4**

#### **1. Composant PhaseBreadcrumb**
- Breadcrumb hiérarchique (Projets > [Projet] > [Phase])
- Navigation retour au projet parent
- Indication niveau courant

#### **2. Composant PhaseHeader**
- Titre phase + badge statut
- Dates (début/fin)
- Budget alloué
- Progression globale
- Indicateur structure (avec/sans étapes)

#### **3. Vue PhaseWithStepsView**
- Pour phases AVEC étapes
- Liste étapes dépliables
- Pour chaque étape → affichage jalons associés
- Navigation vers détail étape

#### **4. Vue PhaseWithDirectMilestonesView**
- Pour phases SANS étapes
- Liste jalons directs
- Groupement par type (validation, inspection, etc.)
- Filtres statut et type

#### **5. Composant PhaseMetrics**
- Métriques spécifiques phase
- Jalons complétés/totaux
- Inspections réalisées
- Documents attachés
- Échéances critiques

#### **6. Composant PhaseActions**
- Actions contextuelles (basées sur statut phase)
- Ajouter étape/jalon
- Générer rapport
- Modifier configuration
- Actions métier spécifiques

---

## **Prochaines Actions Immédiates**

### **Pour Phase 4 (Current):**
1. **Designer PhaseBreadcrumb** avec navigation hiérarchique
2. **Créer PhaseHeader** avec statut détaillé et métriques
3. **Développer PhaseWithStepsView** pour phases avec étapes
4. **Développer PhaseWithDirectMilestonesView** pour phases sans étapes
5. **Implémenter PhaseActions** avec actions conditionnelles

### **Pour Phase 5 (Next):**
1. **Définir règles d'affichage conditionnel**
2. **Implémenter logique de détection structure**
3. **Créer composants conditionnels réutilisables**
4. **Configurer transitions entre vues**

### **Livrables Attendus Phase 4:**
- ✅ Page PhaseDetailsPage avec navigation hiérarchique
- ✅ Affichage conditionnel selon structure phase
- ✅ Métriques phase pertinentes
- ✅ Actions contextuelles par statut
- ✅ Design cohérent avec ProjectDetailByDTO

---

## **Structure de Données (Référence)**

### **Niveau 1 : 🌐 PROJET**
- Dashboard stratégique global
- Vue d'ensemble avec KPI
- Navigation vers phases

### **Niveau 2 : 🏗️ PHASE**
- Vue opérationnelle par phase
- Structure conditionnelle (avec/sans étapes)
- Métriques spécifiques phase

### **Niveau 3 : 📋 ÉTAPE (Optionnel)**
- Détails processus (si existants)
- Jalons regroupés par étape
- Ressources et documents

### **Niveau 4 : 📍 JALON**
- Points de contrôle critiques
- Types : validation, inspection, paiement, livraison
- Documents et inspections associés

### **Niveau 5 : ⚡ ACTION**
- Interactions utilisateur
- Actions disponibles selon contexte
- Workflows spécifiques

---

**Statut actuel** : Phase 3 terminée ✅ - Phase 4 en démarrage 🚀  
**Prochaine milestone** : Livraison PhaseDetailsPage prototype 