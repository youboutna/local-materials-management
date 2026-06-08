# Architecture Référentiels — HadraTech-GPI

> Philosophie d'intégration des outils de programmation et de suivi (PTBA, PPM, PED, TBI).
> Tout comportement métier est **paramétrable via des référentiels**, jamais codé en dur.

---

## 1. Vue d'ensemble : des référentiels au pilotage

```text
┌─────────────────────────────────────────────────────────────┐
│                RÉFÉRENTIELS (src/config/referentials/)       │
├─────────────────────────────────────────────────────────────┤
│ • projectTypes.referential.ts       (SOMELEC, ETER, etc.)    │
│ • weighting-models.referential.ts   (Pareto, ETER, SOMELEC)  │
│ • deviation-rules.referential.ts    (écarts durée/coût/TEP)  │
│ • compliance-obligations.referential.ts (Code électricité)   │
│ • roles-responsibilities.referential.ts (rôles & tâches)     │
│ • indicator-templates.referential.ts (CPI, SPI, TEP, marge)  │
│ • budget-2026.referential.ts        (enveloppes financières) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            MOTEURS DE CALCUL GÉNÉRIQUES (services)           │
├─────────────────────────────────────────────────────────────┤
│ • WeightedProgressCalculator (TEP)                           │
│ • DeviationEngine            (écarts planifié/réalisé)       │
│ • ComplianceInjector         (tâches obligatoires)           │
│ • ScheduleVsActualService    (agrégation)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│       OUTILS DE PROGRAMMATION ET SUIVI (vues dynamiques)     │
├─────────────────────────────────────────────────────────────┤
│ PTBA │ PPM │ PED │ TBI │ Rapports performance │ Sanctions    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Les quatre outils majeurs

### 2.1 PTBA — Plan de Travail et Budget Annuels
- Hiérarchie **Résultat → Action → Activité → Tâche**.
- Chaque tâche : poids (`weighting-models`), indicateur cible (`indicator-templates`).
- Tâches obligatoires (inspections, audits) injectées par `ComplianceInjector`.
- UI : tableau pondéré + Gantt (`IntegratedWorkflowTimeline`), alertes via `deviation-rules`.

### 2.2 PPM — Plan de Passation des Marchés
- Étapes définies dans `mauritanian-public-procurement.referential.ts`.
- Délais réglementaires par étape (ex. AON = 30 j) ; alertes via `DeviationEngine`.
- UI : `CascadeWorkflowView`, rapport de suivi (canevas guide §6.4.2.6).
- Notification PRMP / CCMP au dépassement de seuil.

### 2.3 PED — Plan d'Engagement des Dépenses
- Lie PTBA + PPM pour projeter les décaissements mensuels.
- `budget-2026.referential.ts` fournit les enveloppes par source de financement.
- `DeviationEngine` compare engagements réels vs prévisionnels.
- UI : `PaymentCalculator` enrichi (courbe d'engagement), alerte si exécution <70 % à mi-exercice.
- Export ERP (SAGE/COBOL).

### 2.4 TBI — Tableau de Bord des Indicateurs
- Indicateurs (CPI, SPI, TEP, marge…) décrits dans `indicator-templates.referential.ts`
  (formule, unité, seuils).
- Chaque indicateur rattaché à un niveau de résultat (produit, effet, impact).
- `projectTypes` détermine le jeu d'indicateurs.
- UI : `IntegratedWorkflowBoard` avec feux tricolores + drill-down projet → phase → étape → tâche.
- Rapport annuel de performance auto-généré (canevas guide §6.7).

---

## 3. Cœur de l'enrichissement : calcul des écarts (planifié vs exécuté)

### 3.1 Principes
Comparaison systématique **planned vs actual** sur :
- Durées (dates début/fin)
- Coûts (budget vs réel)
- Taux d'avancement physique (TEP)
- Indicateurs de performance (CPI, SPI, marge)

Règles paramétrables dans `deviation-rules.referential.ts` :
- `duration_deviation` → `actualEnd - plannedEnd` (seuil alerte 5 j)
- `profit_margin_eter` → `(revenue - cost) / revenue` (cible [10 %, 30 %])

### 3.2 Mise en œuvre technique
- **`ScheduleVsActualService`** : calcule tous les écarts d'un projet selon les règles.
- **Table `project_actuals`** : `actualProgressPercent`, `actualCost`,
  `actualStartDate`, `actualEndDate` par tâche.
- **Batch quotidien** (ou déclenchement manuel) : recalcul + mise à jour des alertes.

### 3.3 Exemple — projet SOMELEC

| Tâche              | Prévision    | Réel         | Écart           | Alerte         |
|--------------------|--------------|--------------|-----------------|----------------|
| DAO_VALIDATION     | 15 j         | 22 j         | +7 j            | 🔴 haute       |
| CIVIL_ENGINEERING  | 45 j, 100 k€ | 40 j, 110 k€ | -5 j, +10 %     | 🟡 moyenne coût |
| TEP phase EXECUTION| 75 %         | 62 %         | -13 pts         | 🔴 haute       |

Écarts visibles dans `WorkflowKanban` (badges), `StepDetailPanel` (graphe) et rapports.

---

## 4. Référentiels comme « légos métier »

### 4.1 Cycle de vie d'une configuration
1. **Définition** par l'équipe métier (JSON/YAML ou TS).
2. **Validation** (ex. somme des poids = 100 par étape).
3. **Stockage** versionné dans le code (ou en base pour les plus dynamiques).
4. **Exécution** : les moteurs lisent les référentiels au runtime.

### 4.2 Personnalisation ETER (entretien routier) — zéro code applicatif modifié
- Ajouter un modèle de pondération `eter_road_maintenance`.
- Règle d'écart `profit_margin_eter` cible [10 %, 30 %].
- Tâche obligatoire `MONTHLY_EQUIPMENT_AUDIT`.
- Indicateur custom : consommation gazole / km.

### 4.3 Avantages
- **Évolutivité** : nouveau type de projet = nouveau référentiel.
- **Conformité** : mise à jour `compliance-obligations.referential.ts` suit la loi.
- **Tests** : chaque référentiel testable isolément.

---

## 5. Liens avec composants existants

| Composant                  | Source de données                              |
|----------------------------|------------------------------------------------|
| `WorkflowKanban`           | écarts durée via `DeviationEngine`             |
| `IntegratedWorkflowBoard`  | TBI via `ScheduleVsActualService`              |
| `CascadeWorkflowView`      | étapes PPM via référentiel procurement         |
| `PaymentCalculator`        | PED enrichi des décaissements prévisionnels    |
| `StepDetailPanel`          | graphique d'évolution planifié vs réel         |

**Règle d'or** : ces composants ne contiennent **aucune logique métier**. Ils affichent ce que
les services calculent à partir des référentiels.

---

## 6. Synthèse — valeur ajoutée ETER / Direction des Travaux

| Outil                  | Apport                                                                |
|------------------------|-----------------------------------------------------------------------|
| PTBA                   | Planification granulaire avec pondération ETER (gazole, rendement h.) |
| PPM                    | Respect délais passation (AON, gré à gré), traçabilité                |
| PED                    | Anticipation décaissements mensuels vs budget réel                    |
| TBI                    | Pilotage marge (10–30 %), TEP, écarts coût/durée                      |
| Rapports performance   | Génération auto pour Ministère et bailleurs (canevas guide)           |
| Sanctions              | Workflow non-conformités (Titre VI Code de l'électricité)             |

> **Conclusion** : HadraTech-GPI devient une plateforme ultra-flexible, adaptable à toute
> réglementation et entité (SOMELEC, ETER, SNAT…) sans réécriture.
> Le comportement des outils PTBA / PPM / PED / TBI est dicté par les référentiels,
> et le calcul des écarts planification vs exécution est entièrement automatisé.

---

## 7. Catalogue de référentiels importables (HadraTech-GPI)

L'administrateur peut **créer ou importer** des référentiels via plusieurs formats, puis les **associer à un ou plusieurs projets**. Le moteur de validation applique automatiquement les contraintes (champs, workflows, indicateurs, blocages).

| Type de référentiel | Formats supportés | Exemples | Usage métier |
|---|---|---|---|
| Politique publique / Stratégie nationale | JSON, Excel, API | Plan Émergence Mauritanie, Vision 2030 | Alignement projets sur priorités nationales |
| Budget programme / LFI | CSV, Excel, API | LFI 2025/2026 — lignes par ministère | Contrainte budgétaire ; **blocage si dépassement** |
| ODD & normes internationales | JSON, CSV | ODD 6, 9, 11 | Traçabilité contribution objectifs mondiaux |
| Référentiel projets | XML MS Project, Excel | Chantiers types (routes, bâtiments, réseaux) | Standardisation phases/jalons |
| SIG QField | `.qgs`, `.qml`, GeoJSON | Relevés topo, points d'intérêt | Géolocalisation, cartographie |
| Normes techniques | JSON, XML | CCTP, DTU, spécifications matériaux | Validation technique tâches & matériaux |
| Structure organisationnelle | CSV, Excel | Organigramme, rôles, responsabilités | Gestion utilisateurs & permissions |

### 7.1 Mécanismes d'administration
- **Import** (drag & drop) + **édition** dans l'UI dédiée.
- **Versioning** : chaque référentiel est versionné (semver) ; basculement entre versions.
- **Publication** : workflow brouillon → revue → publication.
- **Validation temps réel** : moteur générique applique les contraintes au save d'une entité.
- **Rapports de conformité** : tableau de bord (ex. contribution ODD, exécution LFI).

### 7.2 Synchronisation externe
Référentiels synchronisables via **API** avec : SAGE (ERP financier), LFI (portail Trésor),
catalogues ODD, AD/LDAP (structure orga).
