# Compléter l’import projet et ses sous-objets

## Objectif

Rendre l’import JSON réellement complet et idempotent : les champs projet et les relations présentes dans le fichier doivent être persistés puis relus, sans succès partiel silencieux.

## Corrections

1. **Normalisation unique du dataset**
   - Conserver aussi bien les projets plats que les enveloppes `{ project, phases, milestones, tasks, dqeLines, stakeholders, interventionZones }`.
   - Normaliser les alias (`projectReference`/`reference`, `name`/`title`, dates, budgets) avant validation et persistance.

2. **Persistance complète du projet**
   - Mapper tous les champs supportés par `CreateProjectDTO`, notamment la référence projet actuellement perdue, la configuration financière, la classification, les responsables et la localisation.
   - Corriger la symétrie create/update/export afin qu’un réimport ne réinitialise pas les champs absents.

3. **Persistance complète des relations**
   - Upsert idempotent des phases avec statut, coûts, ressources et métadonnées.
   - Importer les jalons de phase et les jalons projet, les tâches avec affectations résolues, les parties prenantes, les lignes DQE et leurs dimensions/fiscalité/métadonnées.
   - Accepter les DQE projet sans phase explicite en les rattachant à la phase indiquée ou à une phase d’import dédiée, au lieu de les ignorer.

4. **Interface et résultat d’import**
   - Faire respecter le mode choisi dans `ProjectFileImporter` (`create`, mise à jour, partiel).
   - Afficher les compteurs détaillés projets/phases/jalons/tâches/DQE/parties prenantes et signaler clairement les importations partielles.

5. **Preuve de non-régression**
   - Ajouter des tests ciblés sur l’enveloppe imbriquée, la référence projet, les relations et les champs DQE enrichis.
   - Exécuter les tests du service et vérifier le build de prévisualisation.
