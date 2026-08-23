# Stabilisation P0 — DQE et tableau de bord data-centric

## Objectif
Rendre le DQE réellement éditable tant qu’il n’est ni signé ni transmis, et faire converger les indicateurs du tableau de bord vers des données réelles, contextualisées et traçables.

## Exécution
1. **Corriger le cycle DQE**
   - Distinguer strictement `draft` (modifiable) de `submitted`/transmis (lecture seule).
   - Créer/importer les nouvelles lignes en brouillon, activer immédiatement Enregistrer/Vider brouillon, et ne passer à `submitted` que lors de la transmission métier.
   - Conserver le verrouillage pour signature ou métadonnée de transfert, avec mode consultation dans la liste.
   - Corriger la détection des documents mixtes pour éviter de verrouiller un brouillon éditable par erreur.

2. **Nettoyer l’affichage DQE**
   - Résoudre statuts, WBS, référentiels et unités via `useI18n` et les référentiels fr/ar/en.
   - Remplacer les valeurs tronquées ou ambiguës par des libellés complets et des fallbacks explicites.
   - Localiser la référence projet, les messages, confirmations et états vides encore codés en dur.

3. **Centraliser les métriques réelles**
   - Introduire un service d’agrégation unique pour projets, phases/jalons, tâches, paiements, inspections et alertes/notifications.
   - Supprimer les requêtes invalides et les valeurs de secours trompeuses (`findByProjectId('')`, zéros silencieux, dates artificielles).
   - Exposer pour chaque métrique sa portée projet/phase et sa source métier ; partager les mêmes résultats entre KPI, actions et alertes.
   - Calculer actions critiques, validations, tâches urgentes, décisions et revue budgétaire à partir des enregistrements persistés.

4. **Conformité UI et hooks**
   - Traduire rôles, catégories, niveaux et états via les référentiels existants.
   - Corriger « Moyennu »/« Moyennes » selon le contexte et supprimer les fallbacks français visibles.
   - Mettre les mutations TanStack Query v5 en conformité sans callbacks `onSuccess`/`onError`.

5. **Validation**
   - Ajouter des tests ciblés sur les transitions DQE et les agrégations dashboard.
   - Vérifier le build, les logs runtime et les écrans DQE/dashboard en session authentifiée.
   - Aucun changement de schéma prévu : les champs de contexte nécessaires existent déjà ; une migration ne sera ajoutée que si la vérification d’implémentation révèle un manque réel.

## Détails techniques
- Flux imposé : UI → hook → service → repository/adapter → base ; DTOs camelCase.
- Les composants ne requêtent jamais Supabase directement.
- Les codes restent persistés ; seuls les labels localisés sont affichés.
- Les métriques non évaluables sont affichées comme telles, jamais remplacées par un zéro ou un ratio fictif.
