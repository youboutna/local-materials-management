# Phase 6.1 — Rattrapage i18n et finalisation sur l'ensemble des pages

_HadraTech-GPI — 23/08/2026_

## 1. Livrables

| Tâche | Livrable | Statut |
|-------|----------|--------|
| T36 | Glossaire métier : « WBS » explicité (`GLOSSARY_LABELS`, `translateTerm`) et branché dans l'UI (sélecteur WBS, DQE, détail projet, création/édition projet, tableau de bord budgétaire, Gantt, messages de service) | ✅ |
| T37 | Overlays `AR_ADDITIONS_FLAT` / `EN_ADDITIONS_FLAT` dans `LanguageContext.tsx` : 131 clés d'interface complétées en arabe et anglais (portail fournisseur, garanties bancaires, alertes tableau de bord, documents matériaux, import projets, suivi des inspections, utilisateurs) | ✅ |
| T38 | Codes ENUM PostgreSQL couverts par les référentiels (`document_status`, `authorization_status`, `mission_status`, `movement_validation_status`, `user_role`, `document_type`) — aucune migration requise, les libellés restent hors base | ✅ |
| T39 | Finalisation des pages : 31 fichiers supplémentaires branchés (listes de sélection de statut/priorité/catégorie, départements, unités, catégories de métré, statut de soumission, PDF projet) | ✅ |
| T40 | Nettoyage : suppression des dictionnaires résiduels (`PhaseInspections`, `PhaseStepsManager`) et des faux positifs de codemod (codes HTTP du monitoring) | ✅ |
| T41 | Tests de non-régression : `I18nPhase61Coverage.test.ts` (T-V-33 → T-V-35) et garde statique `I18nNoRawCodes.test.ts` (T-V-36 → T-V-38) | ✅ |

## 2. Règles appliquées

- Source unique de vérité : `src/config/referentials/i18n/status-labels.referential.ts` (registre `REFERENTIAL_LABEL_REGISTRY`, dont le domaine `glossary`).
- Logique de traduction : `I18nService` (TypeScript pur, sans React) — `translateTerm` ajouté pour le glossaire.
- Pont UI : `useI18n()` (réactif au `LanguageContext`, expose aussi `t` et `setLanguage`).
- Rendu : composants partagés `src/components/i18n/TranslatedBadges.tsx`. Aucun code technique ni acronyme brut dans l'UI.
- Direction du texte : `document.documentElement.dir` piloté par la langue (RTL pour l'arabe).
- Aucun libellé stocké en base : les ENUM restent des codes techniques, traduits à l'affichage.

## 3. Plan de validation exécuté

| ID | Cas de test | Résultat |
|----|-------------|----------|
| T-V-33 | Glossaire : « WBS » rendu comme « Structure de découpage des travaux » (fr/ar/en) | ✅ |
| T-V-34 | Codes ENUM PostgreSQL traduits (statuts, rôles, types de documents) | ✅ |
| T-V-34b | Complétude fr/ar/en de tous les dictionnaires du registre | ✅ |
| T-V-35 | Parité de couverture des clés d'interface complétées (fr/ar/en) | ✅ |
| T-V-36 | Aucun rendu brut de `status`/`priority`/`severity`/`category`/`unit`/`role`/`department` | ✅ |
| T-V-37 | Plus aucun « WBS » dans le texte rendu | ✅ |
| T-V-38 | Listes de sélection statut/priorité alimentées par les référentiels | ✅ |

Exceptions documentées dans la garde statique : `HttpMonitor.tsx` et `PerformanceMetrics.tsx` affichent des **codes HTTP numériques** (donnée technique, non traduisible).

Résultat global : **242/242 tests verts**, typecheck OK, build OK.
