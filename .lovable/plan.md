
# Plan global — HadraTech‑GPI : alignement architecture + écart Planifié vs Réalisé

> Conformité stricte `docs/PROMPTS.md` + `docs/ARCHITECTURE_REFERENTIELS.md` :
> tout seuil/poids/règle/statut/indicateur/profil passe par `src/config/referentials/*` et un moteur générique. Aucune valeur métier en dur dans l'UI.

**Cadre métier générique** (toute entreprise, pas un cas client) :
`Planification (DQE / AO / Conformité / RH / Matériel) → Exécution → Clôture`.
Les utilisateurs (DG, CP, CFO, Contrôleur, Inspecteur, Fournisseur) doivent visualiser **l'écart Planifié vs Réalisé** sur 5 axes : *Performance · Suivi‑Évaluation · Reporting · Inspection · Paiement/Comptabilité*.

Vues projet (`/projects/{id}`) organisées par axe métier, pas par client :
`Planification` · `Exécution` · `Financier` · `Conformité` · `Localisation` (référentiel `project-views`).



---

## 1. Socle référentiel à compléter

Nouveaux référentiels (mêmes patterns que `weighting-models.referential.ts`) :

| Fichier | Rôle |
|---|---|
| `reports/report-profiles.referential.ts` | `summary / detailed / financial / project_manager` → sections + profondeur de hydratation |
| `inspections/inspection-statuses.referential.ts` | Statuts + transitions inspection (remplace M5 en dur) |
| `projects/project-views.referential.ts` | Onglets projet (`planification`, `exécution`, `financier`, `conformité`, `localisation`) par type (ETER, SOMELEC…) |
| `dqe/dqe-categories.referential.ts` | Postes DQE (Terrassement, Revêtement, Signalisation…) + unités + cibles rentabilité par entité |
| `kpi/health-thresholds.referential.ts` | Seuils santé projet (H5/H8) — feeds `DeviationEngine` |

Index `src/config/referentials/index.ts` mis à jour.

---

## 2. Vue Projet « cadre ETER/SOMELEC » (inspirée captures)

`ProjectDetail.tsx` (ou nouveau `ProjectDashboardView` orchestré) :

- **Bandeau KPI** : `Progression`, `Budget`, `Délai restant`, `Rentabilité` (cible récupérée depuis `dqe-categories.referential.ts` selon `project.referentialType`).
  - Badges via `DeviationEngine.compute(..., 'project')` (remplace H5 dur).
- **Onglets dynamiques** lus depuis `project-views.referential.ts` :
  - `Planification` : Phases & Jalons (cartes), Gantt (`GanttChart` existant), PERT.
  - `Exécution` : tâches en cours, retards, inspections planifiées (statuts via nouveau référentiel).
  - `Financier` : DQE détaillé (table groupée par poste, rentabilité par ligne), répartition budgétaire (donut), engagements vs réels (PED).
  - `Conformité` : tâches obligatoires injectées par `ComplianceInjector`, audits, garanties bancaires.
  - `Localisation` : carte + coordonnées (réutilise `GIS coordinate fallback`).
- Données via `ProjectService.getEnriched(id)` (un seul fetch, agrégat).

---

## 3. DQE — connecter DQE → dépenses réelles

- Entité `DQELine` (déjà partiellement présente via `QuantityTakeoff`) : `category`, `label`, `unit`, `quantity`, `unitPrice`, `total`, `targetMargin`.
- `DQEService.getProjectDQE(projectId)` → renvoie lignes groupées par poste + total + rentabilité **calculée** = `(total_planifié − coût_réel) / total_planifié`.
- `coût_réel` agrégé via `PaymentService.getApprovedByDQELine(lineId)`.
- Composant `DQEDetailedTable` (capture 2) : groupes pliables, badge rentabilité vs cible référentielle.
- Composant `BudgetBreakdownDonut` (capture 1) : poids par poste DQE.

---

## 4. Phases & Jalons — cartes + Gantt unifiés

- `PhasesAndMilestonesCards` (capture 3) : carte par phase avec dates, sous-étapes (label issu du référentiel `somelec/eter`), badge statut (référentiel `inspection-statuses` réutilisé pour cohérence).
- Lien card → `PhaseDetail` existant. Pas de doublon.
- Gantt alimenté par `ProjectService.getEnriched` (pas de Supabase direct).

---

## 5. Rapports & PDF — hydratation pilotée par profil/sections

Problème actuel : `ReportingService.generateCompleteProjectReport` ignore `reportType` + `includeSections` → tout hydraté. 5 sections (`paymentBlocks`, `suppliers`, `documents`, `escalationAlerts`, `ganttChart`) jamais rendues dans `ProjectPDFDocument`.

Actions :

1. **`ReportingService`** : signature étendue `generate({ project, profile?, sections? })`. Court-circuit fetch par section + profondeur (`light` skip PERT/EVM série, `full` tout).
2. **`ProjectReportGenerator.tsx`** : passe `profile` + `sections`. Maps `defaultSections` déplacées dans `report-profiles.referential.ts`. Retire `@ts-nocheck` (L3) après typage propre.
3. **`CompactProjectReportGenerator.tsx`** : ajoute Select profil (défaut `summary`), supprime `useDirectData` mort.
4. **`ProjectPDFDocument.tsx`** : brancher les 5 sections manquantes (chacune gardée par `reportConfig.includeSections.X`) :
   - `paymentBlocks` via `PaymentBlockingValidation`
   - `suppliers` via `enrichedData.suppliers`
   - `documents` (table)
   - `escalationAlerts` (filtrés `deviation-rules` critical/high)
   - `ganttChart` (rendu PDF statique simple, phases sur barre temporelle)
5. **DQE & rentabilité** ajoutés au PDF (nouvelle section gated par `dqe`).
6. **Edge function `send-project-report`** : ne recalcule rien, reçoit le DTO filtré + blob PDF, envoie l'email.

---

## 6. Items HIGH/MEDIUM/LOW restants

| ID | Action | Statut |
|---|---|---|
| H5 | `ProjectCard.getProjectHealth` → `classifyProjectHealth` (`health-thresholds.referential`) | ✅ fait |
| H8 | `PerformanceMetrics` seuils via `PERFORMANCE_THRESHOLDS` + `classifyPerformance` | ✅ fait |
| M3 | `toPhaseViewModel` typé → élimine `(phase as any)` dans `PhaseDetail` | ✅ fait (PhaseDetail) — à propager : `UnifiedCascadeWorkflow`, `ConstructionPhaseWithSteps`, `PhaseDetailsPage` |
| M5 | Statuts inspection via `INSPECTION_STATUSES` (`getInspectionStatus*`) | ✅ fait (`RoleBasedInspectionMonitoring`) |
| M7 | Cross-link Tender ↔ Project complet (inspections liées) | ⏳ à faire |
| M9 | Persist statut milestone + toast retour utilisateur | ✅ fait (hook hex + `entityToasts`) |
| M10 | Toasts standardisés via `entityToasts(entityLabel)` factory | ✅ socle fait — à propager sur paiements/tenders/tasks |
| L3 | Retirer `@ts-nocheck` (reports + composants) | 🟡 partiel : `PhaseDetail` OK ; restants : `enhancedReportingService`, `TenderSubmissionService`, `EnhancedSupplierTenderPortal`, utils calculs |


---

## 7. Conformité PROMPTS.md (gardes-fous)

À chaque fichier touché : ✅ pas de `import { supabase }` dans composants/pages, ✅ pas de hook React dans `application/services`, ✅ DTO camelCase, ✅ TanStack v5 sans `onError/onSuccess`, ✅ aucune valeur métier en dur (seuils, statuts, profils).

---

## Détails techniques

```ts
// reports/report-profiles.referential.ts
export type ReportProfile = 'summary' | 'detailed' | 'financial' | 'project_manager';
export interface ReportProfileConfig {
  code: ReportProfile;
  label: MultiLanguageLabel;
  depth: 'light' | 'full' | 'financial' | 'managerial';
  includes: ReportSectionKey[];
}
export const REPORT_PROFILES: Record<ReportProfile, ReportProfileConfig> = { /* ... */ };
export const defaultSectionsFor = (p: ReportProfile) => /* map → Record<key, boolean> */;

// dqe/dqe-categories.referential.ts
export interface DQECategory {
  code: string;            // TERRASSEMENT, REVETEMENT, SIGNALISATION
  label: MultiLanguageLabel;
  unit?: string;
  targetMargin: { min: number; max: number }; // [10, 30] pour ETER
  applicableEntities?: string[]; // ['ETER']
}

// ReportingService.ts (signature)
generateCompleteProjectReport(input: {
  project: ProjectData;
  profile?: ReportProfile;          // défaut 'detailed'
  sections?: Partial<Record<ReportSectionKey, boolean>>;
}): Promise<CompleteProjectReportResultDto>;
```

---

## Fichiers

**Créés**
- `src/config/referentials/reports/report-profiles.referential.ts`
- `src/config/referentials/inspections/inspection-statuses.referential.ts`
- `src/config/referentials/projects/project-views.referential.ts`
- `src/config/referentials/dqe/dqe-categories.referential.ts`
- `src/config/referentials/kpi/health-thresholds.referential.ts`
- `src/components/project/dashboard/ProjectKpiBand.tsx`
- `src/components/project/dashboard/DQEDetailedTable.tsx`
- `src/components/project/dashboard/BudgetBreakdownDonut.tsx`
- `src/components/project/dashboard/PhasesAndMilestonesCards.tsx`
- `src/application/services/DQEService.ts`

**Modifiés**
- `src/config/referentials/index.ts`
- `src/application/services/ReportingService.ts`
- `src/components/reports/ProjectReportGenerator.tsx`
- `src/components/reports/CompactProjectReportGenerator.tsx`
- `src/components/reports/pdf/ProjectPDFDocument.tsx`
- `src/components/project/ProjectCard.tsx`
- `src/components/project/PerformanceMetrics.tsx`
- `src/components/inspections/RoleBasedInspectionMonitoring.tsx`
- `src/pages/ProjectDetail.tsx`
- `supabase/functions/send-project-report/index.ts`
- `.lovable/plan.md`

## Hors scope

- Intégrations ERP (SAGE/COBOL), SCADA (OPC UA), SIG (ArcGIS/WMS), Active Directory/LDAP — chiffrage séparé.
- Refonte visuelle globale ; on s'aligne sur les captures sans refondre le design system.
- Migration legacy `src/services` / `src/types` (mémoire protège).
