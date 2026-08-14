# Plan P0 — Round-trip projet complet et preuve Lot 2

## Constat vérifié
- Le Lot 2 ciblé existe (`45bcdfdc-118e-4abc-9d2a-463c41977bf9`) avec une progression projet stockée à **66 %**, mais **0 phase**, **0 métré** et **0 ligne BOQ** en base.
- L’orchestrateur reprend actuellement `project.progress` lorsqu’aucune phase existe : cela explique l’artefact **66 % sans WBS**.
- L’étape WBS considère l’absence de phases comme un simple avertissement, alors que la page la déclare obligatoire.
- Les métrés sont gérés dans un composant autonome et ne remontent pas dans `relatedData.dqeLines`; `upsertPhaseRelations` ne persiste d’ailleurs pas ses `dqeLines`.
- Le détail lit les phases via deux requêtes/caches distincts, sans contrat atomique garantissant que WBS, métrés, ressources, Gantt et rapport utilisent le même état rafraîchi.

## Corrections

### 1. Création / édition : sauvegarde atomique de l’étape WBS
- Rendre l’étape 4 invalide lorsqu’aucune phase n’est définie.
- Après création des phases, récupérer leurs identifiants persistés et rattacher explicitement tâches, jalons, matériaux et lignes de métré.
- Relier le composant de métrés au workflow par DTO, puis persister les lignes via le service BOQ existant avec `projectId` et `phaseId` réels.
- Ne jamais considérer l’étape sauvegardée si une sous-persistance échoue; remonter une erreur métier précise.
- Invalider ensemble les caches projet, détail, phases, métrés, ressources et métriques après succès.

### 2. Hydratation unique pour édition et détail
- Faire de `ProjectWorkflowService.initializeEditWorkflow` le round-trip complet : projet, phases, dates, ressources de phase et métrés.
- Normaliser les phases une seule fois via les Transformers/DTO existants; supprimer les fallbacks divergents snake_case/camelCase dans les vues concernées.
- Alimenter `ProjectDetailByDTO` depuis le même agrégat applicatif pour WBS, Gantt, métriques et rapport.

### 3. Cohérence métriques / Gantt
- Appliquer la règle canonique : **aucune phase persistée = progression métier 0 %**, quels que soient les anciens `projects.progress` résiduels.
- Recalculer et synchroniser `projects.progress` depuis les phases après chaque mutation WBS; ne pas fabriquer de phase Gantt synthétique comme preuve de WBS.
- Afficher le Gantt uniquement depuis les phases persistées et datées; les mêmes lignes alimentent le PDF.

### 4. Données Lot 2
- Corriger d’abord le flux générique, puis créer pour le Lot 2 les phases datées requises via le workflow/référentiel existant, sans insertion ad hoc contournant les services.
- Importer/persister le métré demandé (dont **540 kg**) dans la phase choisie et vérifier son exposition comme ressource consommée/planifiée selon le modèle existant.
- Recharger le projet depuis la base et vérifier que les données survivent à une nouvelle session/navigation.

### 5. Tests et preuves
- Ajouter des tests de round-trip : nouveau projet → phases → métré → rechargement; projet sans phase → 0 %; projet avec phases → progression pondérée et Gantt identiques UI/PDF.
- Exécuter typecheck et tests ciblés puis suite complète.
- Capturer dans la preview le Lot 2 : WBS daté, métré 540 kg, ressource liée, Gantt et progression cohérente.
- Générer le PDF réel du Lot 2, le convertir en images avec `pdftoppm`, inspecter page 1, pagination et Gantt, puis fournir les artefacts visuels.

## Fichiers principaux concernés
- `src/pages/ProjectCreate.tsx`, `src/pages/ProjectEdit.tsx`, `src/pages/ProjectDetail.tsx`
- `src/components/project/ProjectCreationWorkflow.tsx`, `ProjectDetailByDTO.tsx`, composants phases/métrés
- `src/hooks/hexagonal/useUnifiedProjectWorkflow.ts`, hooks phases/métrés
- `src/application/services/ProjectWorkflowService.ts`, `ProjectMetricsOrchestrator.ts`, services BOQ/ressources
- Adapters/Transformers de phases, métrés et ressources, plus tests associés
