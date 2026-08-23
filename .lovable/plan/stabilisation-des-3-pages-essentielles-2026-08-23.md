# Stabilisation des 3 pages essentielles

## Objectif
Stabiliser exclusivement :
1. `/projects/:id/*` et son DQE ;
2. `/projects/create` ;
3. `/dashboard`.

La correction conserve l’architecture hexagonale, les DTO camelCase, les référentiels centralisés et l’i18n FR/AR/EN.

## Phase 1 — DQE projet

- Remplacer le CRUD hybride par un brouillon cohérent : ajouts, modifications et suppressions restent locaux jusqu’à **Enregistrer**, puis sont persistés ensemble.
- Activer **Enregistrer** dès qu’une ligne est ajoutée, modifiée ou supprimée ; le désactiver seulement sans changement, pendant la sauvegarde ou lorsque le document est réellement verrouillé.
- Activer **Ajouter une ligne**, **Importer** et **Vider le brouillon** sur un document modifiable ; vider rétablit les dernières données persistées et remet l’état `dirty` à zéro.
- Verrouiller toutes les mutations uniquement pour un DQE signé ou transmis dans un statut final métier ; conserver la consultation, le PDF et les actions autorisées.
- Remplacer les libellés résiduels et codes visibles des lignes par les libellés issus des référentiels et de `useI18n`.
- Ajouter des tests ciblés : édition, ajout, suppression, annulation du brouillon, sauvegarde groupée et verrouillage après transmission.

## Phase 2 — Dashboard

- Définir une seule chaîne de lecture pour chaque donnée :
  - alertes via `MonitoringAlertService` ;
  - métriques portefeuille via un service d’agrégation ;
  - actions à traiter issues des inspections, tâches, paiements et alertes persistés avec contexte projet/phase.
- Supprimer les alertes synthétiques concurrentes et les calculs géographiques/statuts dupliqués dans l’UI.
- Centraliser les codes de rôles, statuts et capacités dans les référentiels ; traduire uniquement leurs labels à l’affichage.
- Distinguer `non disponible/non évaluable` d’une vraie valeur zéro pour budget, SPI, CPI, conformité et productivité.
- Calculer séparément budget, engagé, payé, reste et écarts depuis les sources financières existantes ; ne pas assimiler budget à recette ni `paid - pending` à un flux de trésorerie.
- Invalider les requêtes Dashboard après les mutations liées aux projets, jalons, paiements, inspections et alertes.

## Phase 3 — Création projet

- Conserver la création du projet à l’étape 1, puis garantir que son identifiant canonique est propagé aux étapes suivantes.
- Vérifier et corriger la persistance de la WBS complète : phases, jalons, tâches, DQE et ressources avec leurs vrais UUID et liens `projectId/phaseId`.
- Éviter qu’une étape non visitée écrase des données existantes par un tableau vide.
- Implémenter la persistance de l’étape Conformité via les services existants pour garanties/assurances/documents, sans accès Supabase depuis React.
- Après chaque étape enregistrée, relire/invalider les données concernées afin que le workflow et le détail projet affichent le même état.
- Remplacer les chaînes UI restantes du workflow, y compris résumé et actions finales, par des clés i18n.

## Phase 4 — Détail projet

- Faire de chaque repository/service spécialisé la source unique de son onglet : DQE, phases, jalons, tâches, équipe, documents, matériaux et fournisseurs.
- Supprimer les merges UI entre DTO global et hooks spécialisés qui produisent des états divergents.
- Unifier les parties prenantes sur `project_stakeholders`; ne plus utiliser le JSON `contacts` comme source concurrente.
- Relier les jalons, tâches, ressources consommées et lignes DQE par `projectId`, `phaseId`, `milestoneId` et `taskId` lorsque disponibles.
- Harmoniser les invalidations de cache afin qu’une modification dans un onglet soit immédiatement reflétée dans les autres.

## Validation

- Typecheck/build sans erreur et tests ciblés verts.
- Parcours DQE : ajouter → éditer → supprimer → vider → enregistrer → recharger → transmettre → vérifier le verrouillage.
- Parcours création : étapes 1 à 8 → rechargement après chaque étape → contrôle des phases/jalons/tâches/conformité dans le détail.
- Dashboard : comparer les compteurs et montants avec les données des services sources ; afficher `N/A` quand le calcul est impossible, jamais un zéro artificiel.
- Vérifier l’absence de libellés techniques visibles et les trois langues sur ces écrans.
- Vérifier les vues desktop et mobile publiques ; pour les écrans authentifiés, utiliser les signaux automatisables disponibles dans ce projet Supabase externe.

## Détails techniques

- Aucun accès `supabase.*` ajouté dans React ; flux UI → hook → service → repository → adapter.
- Aucune modification manuelle de `src/integrations/supabase/types.ts` ou de `.env`.
- Les changements de schéma éventuels passent uniquement par migration approuvée, avec grants et RLS adaptés.
- Les corrections indépendantes DQE, Dashboard et Projet sont exécutées en parallèle, puis intégrées et validées ensemble.
