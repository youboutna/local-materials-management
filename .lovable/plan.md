# Plan — Deux tâches parallélisables

Les deux tâches sont **indépendantes** (fichiers et tables disjoints) et peuvent être implémentées en parallèle.

---

## Tâche 1 — Aligner Import / Export projets sur l'architecture hexagonale + référentiels

### Constats

- `ProjectImporter2025.tsx` viole la règle hexagonale : import direct `supabase.from(...)` (interdit dans `components/`). Doit passer par `ProjectService` via `useImportProjectsHex`.
- `ProjectFileImporter.tsx`, `AdvancedProjectImporter.tsx`, `ProjectExporter.tsx` instancient `new ProjectService(RepositoryFactory.getProjectRepository())` dans le composant : à remplacer par les hooks hexagonaux (`useImportProjectsHex`, `useProjectsHex`).
- `ProjectExporter` utilise `projects: any[]` → typer en `ProjectDTO[]`.
- `useProjectImporterHex` ne propage pas les champs d'import enrichis (référentiel, type de projet, méthodologie, zone d'intervention, coordonnées, phases référentielles). Doit accepter `CreateProjectDTO` étendu et déléguer à `ProjectService.createProject` (qui passe par les transformers et déclenche la génération de phases via `ProjectWorkflowService` quand un référentiel `projectType` est résolu).
- Aucune validation référentielle à l'import : il faut faire passer chaque ligne par `ReferentialService.validateProjectAgainstReferential(...)` (ou un nouvel utilitaire `ProjectImportValidator`) qui :
  - mappe `project_type` → `projectTypes.referential.ts` (SOMELEC, ETER, SNAT…),
  - vérifie les champs obligatoires du référentiel,
  - injecte les tâches obligatoires de `compliance-obligations.referential.ts`,
  - applique les modèles de pondération (`weighting-models`) si phases présentes.
- Export : enrichir le payload avec les indicateurs TBI (CPI/SPI/TEP) calculés via `ScheduleVsActualService` et la zone d'intervention (cf. Tâche 2). Format JSON exhaustif, Excel/CSV : colonnes plates documentées.

### Livrables

1. **Service unifié** `src/application/services/ProjectImportExportService.ts`
  - `importProjects(rows: ProjectImportRow[], opts): Promise<ImportResult>` : validation référentielle → `ProjectService.createProject` → génération phases via `ProjectWorkflowService` → `ImportResult` agrégé.
  - `exportProjects(ids: string[], format): Promise<Blob>` : récupère via `ProjectService.getProjectsByIds`, enrichit (zone d'intervention, indicateurs TBI), sérialise.
  - Pure TS, zéro React (mémoire `no-react-in-services`).
2. **Hook** `src/hooks/hexagonal/useProjectImportExportHex.ts` exposant `importProjects` (mutation) + `exportProjects` (mutation) avec toasts, `isImporting`, `isExporting`, erreurs.
3. **DTOs** : étendre `src/dtos/entities/ProjectImportDTO.ts` avec `referentialCode`, `interventionZone` (cf. Tâche 2), `phasesTemplate`. Ajouter `ProjectExportDTO`.
4. **Refonte UI** (présentation uniquement, logique métier dans le service) :
  - `ProjectImporter2025.tsx` : remplacer `supabase.from('projects').insert` par `useProjectImportExportHex().importProjects`.
  - `ProjectFileImporter.tsx`, `AdvancedProjectImporter.tsx` : supprimer instanciation directe de `ProjectService`, brancher sur le hook, mapper les colonnes parsées vers `ProjectImportRow` via un transformer dédié `src/dtos/transforms/ProjectImportTransformer.ts` (`fileRowToImportDTO`, `geoFeatureToImportDTO`).
  - `ProjectExporter.tsx` : typer `projects: ProjectDTO[]`, brancher `useProjectsHex` + `exportProjects`, ajouter case à cocher « Inclure zone d'intervention » et « Inclure indicateurs TBI ».
5. **Tests/validation** : build TS, lint, mini script `bunx vitest run` sur le transformer.

### Critères d'acceptation

- `rg "supabase\.from" src/components/projects` → 0 hit.
- `rg "new ProjectService" src/components` → 0 hit.
- Un import Excel basique crée des projets, génère les phases via référentiel si `project_type` mappé, et affiche un `ImportResult` avec erreurs ligne par ligne.
- Export JSON contient la `interventionZone` (si présente) et un bloc `indicators` (CPI/SPI/TEP) ; Excel/CSV applatissent ces données.

---

## Tâche 2 — Localisation projet = zone d'intervention (forme géométrique), pas seulement adresse

### Constats

- Table `projects` possède déjà : `forme text`, `localisation jsonb`, `geographic_zone text`, `adresse jsonb`, `coordinates_latitude/longitude`, `area_sqm`. Aucune géométrie polygone structurée n'est exploitée côté domaine.
- `Project` entity / `ProjectDTO` n'exposent qu'un point (`latitude/longitude`) + `location: string`. La carte (`MapLocation`) supporte déjà `warehouseShape: {lat,lng}[]` mais uniquement pour les entrepôts.
- L'utilisateur veut : la **localisation d'un projet = une zone d'intervention** (polygone / rectangle / cercle), pas qu'une adresse.

### Modèle cible

- Nouveau type domaine `InterventionZone` :
  ```ts
  type InterventionZoneShape = 'polygon' | 'rectangle' | 'circle';
  interface InterventionZone {
    type: InterventionZoneShape;
    coordinates: { lat: number; lng: number }[]; // polygone/rect : sommets ; cercle : [center]
    radiusMeters?: number;                       // cercle uniquement
    label?: string;                              // ex. "Lot 3 — wilaya de Trarza"
    areaSqm?: number;                            // calculé
    address?: string;                            // libellé textuel (ex-`location`)
  }
  ```
  &nbsp;
- Stockage : utiliser la colonne existante `**localisation jsonb**` pour persister la zone (rétrocompatible). La colonne `forme text` est conservée comme libellé court (`'polygon'`, `'circle'`...). `location: string` reste pour l'adresse libre. **Pas de migration destructive** ; juste un `COMMENT ON COLUMN` SQL pour documenter le format JSON.

### Livrables

1. **Domaine**
  - `src/domain/entities/InterventionZone.ts` : entité + factory + helpers (`computeCentroid`, `computeAreaSqm`, `contains(lat,lng)`).
  - `src/domain/entities/Project.ts` : ajouter `interventionZone?: InterventionZone`, `getCenter()`, conserver `latitude/longitude` (auto-calculés depuis le centroïde si absents).
2. **DTO + Transformer**
  - `src/dtos/entities/ProjectDTO.ts` : champ `interventionZone?: InterventionZoneDTO`.
  - `src/dtos/transforms/ProjectTransformer.ts` (et `SupabaseProjectAdapter`) : sérialiser/désérialiser `localisation` jsonb ↔ `InterventionZoneDTO`. `coordinates_latitude/longitude` renseignés depuis le centroïde quand zone fournie.
3. **Service**
  - `ProjectService.setInterventionZone(projectId, zone)` + recalcul `area_sqm`.
  - `getProjectCoordinates` (déjà mémoïsé en mémoire) : prend en compte le centroïde de la zone.
4. **UI**
  - Édition projet (`ProjectEdit` / step Localisation) : remplacer le simple input par un `InterventionZonePicker` (réutilise les composants Leaflet déjà présents, draw polygon/rectangle/circle, basé sur `react-leaflet-draw` déjà inclus pour les entrepôts).
  - Carte interactive (`EnhancedInteractiveMap`, `InteractiveProjectsList`) : afficher la zone du projet (polygone) en plus du marqueur, popup « Voir détails » → `/projects/:id`.
  - `MapLocation` (`Location.ts`) : ajouter `interventionZone?: InterventionZoneDTO` (sans casser `warehouseShape`).
  - `Projects.tsx` : transformer projets → `MapLocation` en propageant la zone.
5. **Hook** `useProjectInterventionZoneHex` (lecture+save via service).
6. **Documentation** : section dans `docs/ARCHITECTURE_REFERENTIELS.md` § « Zone d'intervention » (1 paragraphe + schéma JSON).
7. **Migration légère SQL** : `COMMENT ON COLUMN public.projects.localisation IS '{type, coordinates[], radiusMeters?, label?, areaSqm?, address?}'`. Pas de modification de structure.

### Critères d'acceptation

- Création/édition d'un projet permet de dessiner une zone (polygone/rectangle/cercle) sur la carte. Sauvegarde persiste dans `projects.localisation`.
- Au chargement, la zone réapparaît, le marqueur est positionné sur le centroïde, `area_sqm` est mis à jour.
- L'export projet (Tâche 1) inclut la zone ; l'import GeoJSON (`AdvancedProjectImporter`) hydrate la zone depuis `feature.geometry` quand `type ∈ {Polygon, MultiPolygon, Point}`.
- `rg "supabase\.from" src/components` reste à 0.

---

## Exécution

Les deux tâches peuvent être codées en parallèle (aucun fichier partagé sauf `ProjectDTO.ts` / `ProjectTransformer.ts`, qu'on traite en premier dans la Tâche 2 puis consommé par la Tâche 1). Build/typecheck final commun.

```text
T2 (domain + DTO zone) ──┐
                         ├─► merge → build TS
T1 (service + UI I/E)  ──┘
```

&nbsp;