# Phase 6 — Correction visible de l’écran WBS

## Objectif
Rendre l’écran de création/édition projet intégralement traduit via `LanguageContext`, avec le libellé français « Structure de découpage des travaux » à la place de « Planification WBS », sans traduire les données métier stockées en base.

## Mise en œuvre
1. Compléter les clés UI fr/ar/en dans `LanguageContext` pour le workflow, la progression, les états de sauvegarde, la navigation, les messages de validation et l’écran WBS.
2. Brancher `ProjectCreationWorkflow`, `ProjectCreate` et `ProjectEdit` sur ces clés, y compris les textes interpolés (`Étape {current}/{total}`, `{percent} %`) et les boutons Précédent/Sauvegarder/Suivant.
3. Corriger le référentiel des étapes du workflow pour que son code technique reste stable et que ses libellés passent par l’i18n ; afficher `wbs.label` en français comme « Structure de découpage des travaux ».
4. Corriger les derniers libellés visibles des composants WBS concernés (phases, jalons et métré), sans toucher aux titres/descriptions provenant de la base.
5. Vérifier récursivement les référentiels sur trois niveaux et la couverture des ENUM PostgreSQL par les registres multilingues ; ajouter uniquement les entrées techniques manquantes.
6. Valider par tests ciblés, état du build et capture Playwright de l’écran en français aux dimensions du preview actuel.

## Contraintes techniques
- Base : codes techniques bruts uniquement.
- UI : `useLanguage().t(...)` exclusivement pour les libellés statiques.
- Référentiels/ENUM : code unique + libellés fr/ar/en.
- Les nombres et pourcentages sont localisés avec `Intl.NumberFormat`, pas traduits comme du texte.
