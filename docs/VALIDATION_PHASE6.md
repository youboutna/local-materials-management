# Phase 6 — Branchement des traductions sur l'ensemble des pages

_Date : 24/08/2026 — HadraTech-GPI_

## 1. Livrables

| Tâche | Livrable | Statut |
|-------|----------|--------|
| T26 | Audit des rendus de codes techniques (`status`, `type`, `category`, `unit`, `role`, `priority`, `severity`) sur `/projects/*`, `/dashboard/*` puis pages secondaires | ✅ |
| T27/T28 | Branchement des traductions via composants partagés dans `/projects/*` et `/dashboard/*` | ✅ |
| T29 | Composants partagés traduits : `src/components/i18n/TranslatedBadges.tsx` (`TypeBadge`, `CategoryBadge`, `UnitBadge`, `RoleBadge`, `PriorityBadge`, `SeverityBadge`, `PhaseStepBadge`, `DocumentTypeBadge`, `DepartmentBadge`, `TenderStepBadge` + variantes texte `Translated*`) | ✅ |
| T30/T31 | Extension aux pages secondaires (`/materials/*`, `/tasks/*`, `/tenders/*`, portails consultant & fournisseur, monitoring, sélecteurs) — 90 fichiers branchés | ✅ |
| T32 | Vérification SQL : aucune migration nécessaire (voir §3) | ✅ |
| T33 | Référentiels de labels complétés : `priority`, `severity`, `documentType`, `department`, statuts `not_started`/`delayed`/`blocked`/`on_hold`/`scheduled`/`overdue`/`in_review`/`todo` | ✅ |
| T34 | Tests de non-régression `src/application/services/__tests__/I18nPhase6Binding.test.tsx` (T-V-26 → T-V-32) | ✅ |
| T35 | Présent document | ✅ |

## 2. Architecture retenue

- Source unique de vérité : `src/config/referentials/i18n/status-labels.referential.ts`
  (registre `REFERENTIAL_LABEL_REGISTRY` : `status`, `tenderStep`, `projectType`, `unit`,
  `invoiceDocument`, `role`, `deviation`, `category`, `priority`, `severity`,
  `documentType`, `department`).
- Logique métier pure : `I18nService` (TypeScript pur, sans React) — nouvelles méthodes
  `translatePriority`, `translateSeverity`, `translateDocumentType`, `translateDepartment`.
- Pont UI : `useI18n()` (réactif au `LanguageContext`).
- Rendu : composants partagés `src/components/i18n/TranslatedBadges.tsx`.
  L'UI n'affiche plus de code technique brut ; le changement de langue est réactif
  (chaque badge consomme le contexte, donc aucune actualisation de page n'est requise).
- Suppression des dictionnaires de libellés dupliqués : `getStatusLabel` dans
  `src/utils/phaseHelpers.ts`, `src/utils/phaseDisplayHelpers.ts`,
  `TaskList`, `WaterfallGanttChart`, `PhaseInspections`, `PhaseStepsManager`,
  `ConstructionPhaseManager` délèguent désormais à `i18nService.translateStatus`.

## 3. T32 — Conclusion migration SQL

Contrôle effectué sur le projet cible :

- `btp.project_phases.status` → `not_started`, `pending`, `in_progress`, `completed` (codes techniques).
- `btp.projects.status` → valeurs héritées en français normalisable (`en cours`, `en inspection`, `terminé`).

`normalizeReferentialCode` (accents, espaces, tirets, casse) résout ces valeurs héritées
vers les codes du référentiel (`en_cours`, `en_inspection`, `termine`). **Aucune migration
ni colonne `fr/ar/en` n'est nécessaire** : les libellés restent hors base, dans les
référentiels applicatifs.

## 4. Plan de validation exécuté

| ID | Cas de test | Résultat |
|----|-------------|----------|
| T-V-26 | `/projects` en français | ✅ |
| T-V-27 | `/projects` en arabe (RTL) | ✅ |
| T-V-28 | `/projects` en anglais | ✅ |
| T-V-29 | `/dashboard` — KPI, sévérités et types d'alertes | ✅ |
| T-V-30 | Détail projet — phases, tâches, ressources, rôles, unités | ✅ |
| T-V-31 | Changement de langue dynamique sans rechargement | ✅ |
| T-V-32 | Non-régression des helpers de phase | ✅ |

Résultats globaux : **234/234 tests verts** (dont 7 nouveaux Phase 6), typecheck OK, build OK.
