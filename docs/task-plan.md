# **Plan d'Action: Système de Gestion Intégrée des Projets d'Infrastructure**

---

## **Contexte et Vision**

### **Objectif Global**

Développement d'un logiciel de **gestion intégrée des projets d'infrastructure** (électrique, habitat, routes, bâtiment, santé...) avec bailleurs de fonds et/ou État.

### **Architecture Hiérarchique**

```
PROJET (Niveau Stratégique)
├── Référentiel applicable (src/config/referentials/*)
└── composants react  (src/components/*), inclus formulaires, panels, tabs, modal, dialog
│   └── Structure standardisée par type de projet
├── JALONS PROJET → Actions/Workflows
│   ├── Kick-off meeting
│   ├── Validation budget
│   ├── Réception provisoire
│   └── Réception définitive
└── PHASES (Niveau Tactique)
    ├── JALONS PHASE → Actions/Workflows
    │   ├── Inspection de phase
    │   ├── Paiement échéance
    │   └── Validation conformité
    └── ÉTAPES/Activités (Niveau Opérationnel)
        └── JALONS ÉTAPE → Actions/Workflows
            ├── Conformité matériaux
            ├── Documents livrables
            └── Tâches assignées
```

### **Parties Prenantes**

| Rôle                      | Responsabilités                                      |
| ------------------------- | ---------------------------------------------------- |
| **Maître d'ouvrage**      | Supervision globale, validation paiements, réception |
| **Contractant principal** | Exécution travaux, reporting avancement              |
| **Ingénieur conseil**     | Contrôle qualité, inspections, conformité            |
| **Fournisseurs**          | Livraison matériaux, documents conformité            |
| **Sous-traitants**        | Exécution lots spécifiques                           |
| **Bailleurs de fonds**    | Financement, suivi décaissements                     |

### **Cartographie SIG (Système d'Information Géographique)** 🗺️

Le système intègre une **cartographie interactive** essentielle pour :
| Fonctionnalité | Description | Composants |
|----------------|-------------|------------|
| **Géolocalisation projets** | Positionnement précis sur carte | `InteractiveMapGIS`, Leaflet/OpenStreetMap |
| **Zones de travaux** | Délimitation parcelles et périmètres | Polygones, mesures superficie |
| **Suivi terrain** | Visualisation chantiers, équipements | Marqueurs, clusters |
| **Analyse spatiale** | Distance, contraintes environnementales | Couches thématiques |
| **Réseaux existants** | Infrastructure électrique, routes, bâti | Overlays GeoJSON |

### **Méthodologies de Planification & Performance** 📊

#### **PERT (Program Evaluation and Review Technique)**

| Métrique             | Calcul               | Usage                |
| -------------------- | -------------------- | -------------------- |
| Durée optimiste (O)  | Estimation min       | Scénario favorable   |
| Durée probable (M)   | Estimation réaliste  | Planification        |
| Durée pessimiste (P) | Estimation max       | Gestion risques      |
| Durée attendue (TE)  | (O + 4M + P) / 6     | Moyenne pondérée     |
| Écart-type (σ)       | (P - O) / 6          | Variance             |
| **Chemin critique**  | Plus longue séquence | Délai incompressible |

#### **GANTT**

| Fonctionnalité       | Description                     |
| -------------------- | ------------------------------- |
| Timeline interactive | Zoom jour/semaine/mois          |
| Dépendances          | Fin-Début, Début-Début, Fin-Fin |
| Jalons               | Diamants sur timeline           |
| Progression          | Barre colorée % avancement      |
| Baseline             | Comparaison planifié vs réel    |

#### **Kanban Board**

| Colonne  | Limite WIP | Actions          |
| -------- | ---------- | ---------------- |
| Backlog  | -          | Priorisation     |
| À faire  | 10         | Sélection sprint |
| En cours | 5          | Exécution        |
| En revue | 3          | Validation       |
| Terminé  | -          | Archivage        |

#### **Waterfall (Cascade)**

| Phase             | Gate                 | Livrable          |
| ----------------- | -------------------- | ----------------- |
| Études            | Validation technique | Dossier technique |
| Approvisionnement | Validation budget    | Commandes         |
| Exécution         | Inspection           | PV conformité     |
| Réception         | Validation finale    | Attestation       |

#### **Indicateurs de Performance (KPIs)**

| Indicateur             | Formule                 | Interprétation                  |
| ---------------------- | ----------------------- | ------------------------------- |
| **SPI**                | EV / PV                 | >1 = Avance, <1 = Retard        |
| **CPI**                | EV / AC                 | >1 = Économie, <1 = Dépassement |
| **EV** (Earned Value)  | % réel × Budget         | Valeur acquise                  |
| **PV** (Planned Value) | % planifié × Budget     | Valeur planifiée                |
| **AC** (Actual Cost)   | Dépenses réelles        | Coût réel                       |
| **EAC**                | AC + (BAC - EV) / CPI   | Estimation à l'achèvement       |
| **TCPI**               | (BAC - EV) / (BAC - AC) | Performance requise             |

### **Objectifs Workflow**

- ✅ Suivi et planification des **inspections**
- ✅ Gestion des **conformités** et certifications
- ✅ Traçabilité des **matériaux** et équipements
- ✅ Gestion des **employés** et affectations
- ✅ Gestion documentaire (**GED**)
- ✅ Suivi des **tâches assignées**
- ✅ **Paiements échéancés** selon progression
- ✅ Éviter les **pénalités de retard**
- ✅ **Reporting** et performance multi-parties
- ✅ **Cartographie SIG** pour géolocalisation
- ✅ **Planification PERT/GANTT** pour optimisation

---

## **Progression Globale: 100% Phases Techniques ✅**

---

## **Phases Complétées**

### **Phase 1: Modélisation Jalons ✅**

- MilestoneDTO, MilestoneFormDTO
- IMilestoneRepository interface
- Hiérarchie: Projet → Phase → Étape
- **Types de jalons configurables** :
  - 📍 Point de contrôle (inspection, validation)
  - 📦 Livrable (document, rapport, ouvrage)
  - 📅 Événement (réunion, jalon contractuel)
  - 💰 Déclencheur paiement (échéance financière)

### **Phase 2: Migration Hexagonale ✅**

| Page                       | Hook Utilisé                           | Statut |
| -------------------------- | -------------------------------------- | ------ |
| `Projects.tsx`             | `useProjectsHex()`                     | ✅     |
| `ProjectDetail.tsx`        | `useProjectHex()`                      | ✅     |
| `Materials.tsx`            | `useMaterialsHex()`                    | ✅     |
| `MaterialCreate.tsx`       | `useMaterialsHex()`                    | ✅     |
| `MaterialDetail.tsx`       | `useMaterialHex()`                     | ✅     |
| `MaterialEdit.tsx`         | `useMaterialHex() + useMaterialsHex()` | ✅     |
| `Dashboard.tsx`            | `useDashboardHex()`                    | ✅     |
| `Suppliers.tsx`            | `useSuppliersHex()`                    | ✅     |
| `Documents.tsx`            | `useProjectsHex()`                     | ✅     |
| `NotificationsCenter.tsx`  | `useNotificationsHex()`                | ✅     |
| `BankGuaranteeMonitor.tsx` | `useBankGuaranteesHex()`               | ✅     |
| `PaymentControl.tsx`       | `usePaymentBlocksHex()`                | ✅     |
| `PhaseDetailsPage.tsx`     | `usePhaseHex()`                        | ✅     |
| `InspectionDetail.tsx`     | `useInspectionHex()`                   | ✅     |
| `InspectionEdit.tsx`       | `useInspectionsHex()`                  | ✅     |

### **Phase 3: Navigation & Layout ✅**

| Composant           | Description                                 |
| ------------------- | ------------------------------------------- |
| `Breadcrumb`        | Navigation fil d'Ariane automatique         |
| `QuickLinks`        | Liens rapides contextuels                   |
| `ContextualSidebar` | Sidebar collapsible avec navigation groupée |
| `EntityQuickNav`    | Navigation entre entités liées              |
| `AppLayout`         | Layout principal avec sidebar + breadcrumb  |
| `PageHeader`        | En-tête de page standardisé                 |
| `PageSection`       | Sections de contenu cohérentes              |

### **Phase 5: Design System ✅**

- Variables CSS sémantiques
- Gradients et shadows personnalisés
- Palette Adrar/Terracotta cohérente

---

## **Phase 7: Améliorations Proposées** 🚀

### **A. Design & UI/UX**

#### **1. Tableau de Bord Unifié**

| Amélioration                                    | Page(s)                                  | Priorité   |
| ----------------------------------------------- | ---------------------------------------- | ---------- |
| KPIs temps réel avec sparklines                 | `Dashboard.tsx`, `EnhancedDashboard.tsx` | 🔴 Haute   |
| Widget alertes critiques (pénalités imminentes) | `Dashboard.tsx`                          | 🔴 Haute   |
| Graphique Gantt interactif projets              | `Projects.tsx`                           | 🟡 Moyenne |
| Heatmap progression phases                      | `ProjectDetail.tsx`                      | 🟡 Moyenne |

#### **2. Cartes Projets Enrichies**

| Amélioration                                      | Impact                 |
| ------------------------------------------------- | ---------------------- |
| Indicateur visuel santé projet (vert/jaune/rouge) | Décision rapide        |
| Mini-timeline phases inline                       | Vue d'ensemble         |
| Badge retard/avance avec jours                    | Anticipation pénalités |
| Avatar parties prenantes                          | Identification rapide  |

#### **3. Formulaires Intelligents**

| Amélioration                          | Page(s)                                     |
| ------------------------------------- | ------------------------------------------- |
| Wizard multi-étapes création projet   | `ProjectCreate.tsx`                         |
| Auto-save brouillon                   | Tous formulaires                            |
| Validation temps réel avec feedback   | Tous formulaires                            |
| Templates pré-remplis par référentiel | `ProjectCreate.tsx`, `InspectionCreate.tsx` |

### **B. Navigation & Workflows**

#### **1. Navigation Contextuelle Améliorée**

| Amélioration                       | Description                       |
| ---------------------------------- | --------------------------------- |
| Mega-menu projets récents          | Accès rapide derniers projets     |
| Breadcrumb cliquable avec dropdown | Navigation rapide dans hiérarchie |
| Sidebar adaptative par rôle        | Menus selon profil utilisateur    |
| Quick actions flottantes           | FAB contextuel par page           |

#### **2. Workflows Visuels**

| Workflow                      | Pages Concernées                              | Amélioration                     |
| ----------------------------- | --------------------------------------------- | -------------------------------- |
| Inspection → Paiement         | `InspectionDetail.tsx` → `PaymentControl.tsx` | Lien direct avec pré-remplissage |
| Jalon atteint → Notification  | `PhaseDetail.tsx`                             | Déclenchement auto notifications |
| Document uploadé → Validation | `Documents.tsx`                               | Workflow approbation visuel      |
| Retard détecté → Escalade     | `ComprehensiveMonitoring.tsx`                 | Alertes automatiques             |

#### **3. Transitions et États**

| État                  | Visualisation                     |
| --------------------- | --------------------------------- |
| En attente validation | Badge orange pulsant              |
| Approuvé              | Check vert animé                  |
| Rejeté                | Badge rouge avec tooltip raison   |
| En retard             | Badge rouge avec compte à rebours |
| Bloqué                | Icône cadenas + lien déblocage    |

### **C. Pages à Migrer/Améliorer**

#### **Pages Non Migrées vers AppLayout**

| Page                    | Action Requise           | Priorité   |
| ----------------------- | ------------------------ | ---------- |
| `Auth.tsx`              | Layout auth dédié        | 🟢 Basse   |
| `Contact.tsx`           | AppLayout                | 🟡 Moyenne |
| `Policy.tsx`            | Layout simple            | 🟢 Basse   |
| `Terms.tsx`             | Layout simple            | 🟢 Basse   |
| `NotFound.tsx`          | Layout minimal           | 🟢 Basse   |
| `ResetPassword.tsx`     | Layout auth              | 🟢 Basse   |
| `SupplierPortal.tsx`    | Layout fournisseur dédié | 🔴 Haute   |
| `SupplierDashboard.tsx` | Layout fournisseur       | 🔴 Haute   |

#### **Pages à Enrichir**

| Page                       | Améliorations                                               |
| -------------------------- | ----------------------------------------------------------- |
| `ProjectDetail.tsx`        | Vue jalons intégrée, timeline interactive, cartographie SIG |
| `PhaseDetail.tsx`          | Workflow Étape→Jalons→Actions, GANTT phase                  |
| `InspectionMonitoring.tsx` | Calendrier inspections, filtres avancés, carte sites        |
| `PaymentControl.tsx`       | Échéancier visuel, alertes pénalités, courbe S              |

### **E. Module Tenders (Appels d'Offres)** 📋

#### **Problèmes Actuels**

| Problème                                      | Impact              |
| --------------------------------------------- | ------------------- |
| Sélection projet sans affichage phases/étapes | Incohérence données |
| Tabs non contextuels                          | Navigation confuse  |
| Processus non guidé                           | Erreurs soumission  |
| Manque lien projet → tender                   | Traçabilité faible  |

#### **Améliorations Proposées**

##### **1. Cohérence Données Projet ↔ Tender**

| Fonctionnalité              | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| **Affichage phases/étapes** | Quand projet sélectionné → afficher structure complète  |
| **Lots par phase**          | Possibilité de créer des lots alignés sur phases projet |
| **Matériaux requis**        | Lier matériaux du référentiel projet au tender          |
| **Budget estimatif**        | Pré-calcul basé sur phases/étapes projet                |

##### **2. Pages & Tabs Tenders**

| Tab                  | Contenu              | Amélioration                                 |
| -------------------- | -------------------- | -------------------------------------------- |
| **Informations**     | Détails tender       | + Aperçu projet lié                          |
| **Structure Projet** | Phases/Étapes/Jalons | **NOUVEAU** - Vue hiérarchique si projet lié |
| **Lots**             | Découpage travaux    | + Alignement sur phases                      |
| **Documents**        | Cahier des charges   | + Templates par référentiel                  |
| **Soumissions**      | Offres reçues        | + Scoring automatique                        |
| **Évaluation**       | Comparatif           | + Critères pondérés                          |
| **Attribution**      | Décision finale      | + Workflow validation                        |

##### **3. Processus Tender Guidé**

```
1. CRÉATION
   └── Choix type (ouvert/restreint/gré à gré)
   └── Lien projet (optionnel)
        └── SI projet → Charger phases/étapes/matériaux
        └── SINON → Saisie manuelle

2. CONFIGURATION
   └── Définir lots (alignés phases si projet)
   └── Définir critères évaluation
   └── Fixer délais (soumission, attribution)

3. PUBLICATION
   └── Générer avis public
   └── Notifier fournisseurs qualifiés
   └── Ouvrir portail soumissions

4. RÉCEPTION
   └── Validation documents conformité
   └── Vérification administrative
   └── Enregistrement horodaté

5. ÉVALUATION
   └── Scoring technique automatique
   └── Analyse financière comparative
   └── Rapport commission

6. ATTRIBUTION
   └── Notification gagnant
   └── Lettres de rejet
   └── Création contrat → LIEN PROJET
```

##### **4. Interface Tender Améliorée**

| Composant                  | Description                        |
| -------------------------- | ---------------------------------- |
| `TenderProjectPreview`     | Aperçu phases/étapes projet lié    |
| `TenderLotBuilder`         | Création lots avec mapping phases  |
| `TenderTimeline`           | Frise chronologique processus      |
| `TenderScorecard`          | Tableau scoring soumissions        |
| `TenderWorkflow`           | Stepper état avancement            |
| `TenderManagement.tsx`     | Kanban soumissions, scoring visuel |
| `BankGuaranteeMonitor.tsx` | Timeline expirations, alertes      |

### **D. Fonctionnalités Manquantes**

#### **1. Système de Jalons Complet**

| Fonctionnalité           | Statut           |
| ------------------------ | ---------------- |
| CRUD Jalons projet       | ⏳ À implémenter |
| CRUD Jalons phase        | ⏳ À implémenter |
| CRUD Jalons étape        | ⏳ À implémenter |
| Dépendances entre jalons | ⏳ À implémenter |
| Calcul chemin critique   | ⏳ À implémenter |
| Notifications jalons     | ⏳ À implémenter |

#### **2. Reporting Avancé**

| Rapport                         | Description          |
| ------------------------------- | -------------------- |
| Avancement global multi-projets | Vue portefeuille     |
| Analyse retards et causes       | Prédiction pénalités |
| Performance fournisseurs        | Scoring livraisons   |
| Consommation budget vs planifié | Courbe S             |
| Export PDF rapports officiels   | Bailleurs de fonds   |

#### **3. Intégrations**

| Intégration            | Usage                   |
| ---------------------- | ----------------------- |
| Email notifications    | Alertes automatiques    |
| Calendrier (ical)      | Sync inspections/jalons |
| Export Excel avancé    | Reporting personnalisé  |
| Signature électronique | PV réception            |

---

## **Roadmap Suggérée**

### **Sprint 1: Jalons & Workflows (2 semaines)**

- [ ] Implémenter CRUD complet jalons (3 niveaux)
- [ ] Créer composant MilestoneTimeline
- [ ] Intégrer jalons dans ProjectDetail et PhaseDetail
- [ ] Notifications auto sur jalons atteints

### **Sprint 2: Module Tenders Cohérent (2 semaines)**

- [ ] Affichage phases/étapes quand projet sélectionné
- [ ] Création lots alignés sur phases
- [ ] Workflow processus tender guidé
- [ ] Scoring automatique soumissions

### **Sprint 3: Paiements & Pénalités (2 semaines)**

- [ ] Échéancier visuel paiements
- [ ] Calcul automatique pénalités retard
- [ ] Alertes préventives (J-7, J-3, J-1)
- [ ] Workflow validation paiement

### **Sprint 4: Cartographie & Performance (2 semaines)**

- [ ] Amélioration InteractiveMapGIS
- [ ] Dashboard KPIs PERT/GANTT temps réel
- [ ] Courbe S budget
- [ ] Rapports PDF bailleurs

### **Sprint 5: Portail Fournisseurs (2 semaines)**

- [ ] Layout dédié fournisseurs
- [ ] Upload documents conformité
- [ ] Suivi commandes
- [ ] Notifications livraisons

---

## **Phase 8: Audit Complet Appels Supabase Directs** 🔧

### **Statistiques Audit (13/01/2026 - Final)**
| Métrique | Avant | Après |
|----------|-------|-------|
| **Fichiers impactés** | 118 | ~95 |
| **Hooks hexagonaux** | 33 | 37 |
| **Composants migrés** | 17 | 32 |
| **Migration %** | 14% | **27%** (32/118) |

---

### **Terminé ✅** (32 fichiers)

| Phase | Composants Migrés |
|-------|-------------------|
| **Selectors** ✅ | UserSelector, ProjectSelector, SupplierSelector, MaterialSelector, EmployeeSelector, SimpleSupplierSelector, InspectorSelector, EnhancedProjectSelector |
| **Documents** ✅ | SupplierDocumentsList, DocumentsList, TenderDocuments, PhaseDocuments |
| **Précédents** | 17 composants (inspections, payments, phases, etc.) |
| PhaseTasks | `usePhaseTasksHex` |
| PhaseMonitoringDashboard | `usePhaseMonitoringSummaryHex` |
| UnifiedPhaseMonitoring | `usePhaseMonitoringSummaryHex` |
| PhaseEmployees | `usePhaseEmployeesHex` |
| PhaseMaterials | `usePhaseMaterialsHex` |
| InspectionCrud | `useInspectionCrudHex` |
| PaymentRequests | `usePaymentRequestsHex` |
| UnifiedInsuranceManager | `useInsuranceCertificatesHex` |
| UserManagementDialog | `useUserManagementHex` |
| Storage (générique) | `useStorageHex` |
| EnhancedTaskList | `useTaskListHex` |
| TenderEvaluationPanel | `useTenderEvaluationHex` |
| ProgressInvoiceForm | `useProgressInvoiceHex` |
| PhaseInspections | `usePhaseInspectionsHex` |
| EnhancedSupplierTenderPortal | `useSupplierPortalHex` |
| **UserSelector** ✅ | `useUsersSelector` |
| **ProjectSelector** ✅ | `useProjectsSelector` |
| **SupplierSelector** ✅ | `useSuppliersSelector` |
| **MaterialSelector** ✅ | `useMaterialsSelector` |
| **EmployeeSelector** ✅ | `useEmployeesSelector` |
| **SimpleSupplierSelector** ✅ | `useSuppliersSelector` |
| **InspectorSelector** ✅ | `useInspectorsSelector` |
| **EnhancedProjectSelector** ✅ | `useProjectsSelector` + `useProjectTenders` |
| **useSelectorsHex** ✅ | Hook centralisé (7 exports) |

---

### **Reste à Faire 📋** (92 fichiers)

| Répertoire | Fichiers | Priorité | Hook Recommandé |
|------------|----------|----------|-----------------|
| **suppliers/** | SupplierSubmissionDashboard, +5 | 🔴 Haute | `useSuppliersHex` |
| **project/** | ProjectStakeholders, ProjectDocuments, +8 | 🔴 Haute | `useProjectDetailsHex` |
| **tenders/** | TenderDocumentUploadForm, TenderExcelImporter, +6 | 🟡 Moyenne | `useTenderHex` |
| **documents/** | DocumentUploader, DocumentList, +4 | 🟡 Moyenne | `useDocumentsHex` |
| **inspections/** | InspectionExecutionForm, InspectionForm, +3 | 🟡 Moyenne | `useInspectionHex` ✅ |
| **payments/** | PaymentRequestModal | 🟡 Moyenne | `usePaymentActionsHex` ✅ |
| **admin/** | EscalationThresholdsSettings | 🟢 Basse | Nouveau hook |
| **reports/** | InspectionReportGenerator | 🟢 Basse | Edge functions |

---

### **Hooks useSelectorsHex Exports**

```typescript
// Exports disponibles
export { 
  useUsersSelector,      // profiles + suppliers
  useProjectsSelector,   // projects (secure mode option)
  useSuppliersSelector,  // suppliers actifs
  useMaterialsSelector,  // materials avec filtre catégorie
  useEmployeesSelector,  // employees avec filtres
  useInspectorsSelector, // employees + suppliers (stakeholders)
  useProjectTenders      // parsed_invoices par project
} from '@/hooks/hexagonal/useSelectorsHex';

// Types exportés
export type {
  UserProfile,
  ProjectOption,
  SupplierOption,
  MaterialOption,
  EmployeeOption,
  Inspector,
  TenderOption
} from '@/hooks/hexagonal/useSelectorsHex';
```

---

### **Prochaines Actions**
1. ~~Phase A selectors/~~ ✅ **TERMINÉ**
2. Phase A suppliers/ (5 fichiers restants)
3. Phase A project/ (8 fichiers)
4. Phase B tenders/ + documents/

---

### **Résumé Global**

| Catégorie | Valeur |
|-----------|--------|
| Fichiers avec violations | 99 (était 118) |
| Hooks créés | 35 |
| **Composants migrés** | **26** |
| **Migration réelle** | **22%** |
| Prochain objectif | 35% (41 fichiers) |

**Statut**: ✅ Phase A selectors/ terminée | En cours: suppliers/ project/
