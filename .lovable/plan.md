## Périmètre

Trois lots indépendants à exécuter dans la foulée. Lot A (bugs bloquants) en premier, puis Lot B (domaine zones), puis Lot C (UI/import-export).

---

## Lot A — Bugs runtime (priorité haute)

### A1. `OperationalStatus is not defined` (SupabaseWorkspaceAdapter)
- Lire `src/infrastructure/supabase/adapters/SupabaseWorkspaceAdapter.ts` + `src/domain/entities/Workspace.ts`.
- Ajouter l'import manquant de `OperationalStatus` (ou retirer la référence si l'enum a été supprimé) dans `mapToEntity`.

### A2. `require is not defined` (KPI / `getAlertRepository`)
- Rechercher `require(` côté navigateur (`rg "require\\(" src/`).
- Remplacer par `import` statique ou `await import(...)` dynamique (selon mémoire « Dynamic Supabase Import »).

### A3. `Contractor contact is required` (PaymentRequestService)
- Lire `PaymentTransformer` et `Payment` entité : la validation `validateContractorContact` bloque le `mapToEntity` lors d'un simple findAll dashboard.
- Rendre la validation **tolérante en lecture** : si le contact manque, journaliser un warning et retourner l'entité avec `contractorContact: undefined` au lieu de throw. La validation stricte reste à la création/mise à jour.

### A4. `invalid input syntax for type uuid: "consulting_firms"` (création de tâche)
- Reproduire : page Tasks → Créer. Inspecter le payload : un champ catégorie/type (`consulting_firms`) est envoyé dans une colonne `uuid` (probablement `assignee_id` ou `project_id` mal mappé).
- Lire `TaskService.createTask` + `SupabaseTaskAdapter` + le formulaire `TaskCreateForm`.
- Corriger le mapping : la chaîne `consulting_firms` doit aller dans une colonne `text` (type/catégorie), pas dans une FK uuid.

---

## Lot B — Domaine multi-zones d'intervention

### B1. Séparation conceptuelle
- **`projects.address`** (déjà existant via DTO `address` + `coordinates`) = adresse administrative du projet (siège équipe). Pas touché.
- **`projects.localisation` (jsonb)** = liste de zones bénéficiaires (multi-polygones non disjoints).

### B2. Domaine
- Mettre à jour `src/domain/entities/InterventionZone.ts` pour exposer aussi un **wrapper `InterventionZoneCollection`** : tableau de `InterventionZone` + `getBoundingCenter()` + `getTotalAreaSqm()`.
- Format JSON stocké en DB :
  ```json
  { "version": 2, "zones": [ {InterventionZoneProps}, ... ] }
  ```
  Rétro-compat : si `{ type: 'polygon'|... }` à la racine → wrap automatiquement en `{ zones: [old] }`.

### B3. DTO + Transformer
- `ProjectDTO.interventionZone` → `interventionZones: InterventionZoneDTO[]` (au pluriel). Garder un getter `interventionZone` (alias = `zones[0]`) pour compat ascendante temporaire.
- `ProjectTransformer.fromSupabase` : parse `localisation` jsonb → `zones[]`. Centroïde projet = barycentre des centroïdes (fallback `coordinates_latitude/longitude`).
- `ProjectTransformer.toSupabase` : `localisation = { version: 2, zones: zones.map(z => z.toJSON()) }`.

### B4. Service
- `ProjectService.setInterventionZones(projectId, zones[])`.
- `ProjectService.addInterventionZone` / `removeInterventionZone(zoneIndex)`.

---

## Lot C — UI : picker Leaflet + import/export

### C1. `InterventionZonesPicker` (nouveau composant)
- `src/components/projects/InterventionZonesPicker.tsx`.
- Leaflet + `leaflet-draw` (déjà utilisé dans le projet, sinon `bun add leaflet-draw @types/leaflet-draw`).
- Permet de **dessiner plusieurs polygones / rectangles / cercles** sur la même carte, les modifier, les supprimer. Affiche label + surface calculée par zone. Bouton "Ajouter une zone".
- Props : `value: InterventionZoneDTO[]`, `onChange(zones)`, `addressMarker?: LatLng` (affiche l'adresse projet comme repère distinct).

### C2. Intégration formulaires
- `ProjectCreate.tsx` / `ProjectEdit.tsx` : section "Adresse du projet" (existante) + nouvelle section "Zones bénéficiaires" utilisant `InterventionZonesPicker`. Sauvegarde via `useProjectInterventionZoneHex` (renommé `useProjectInterventionZonesHex`).

### C3. Affichage carte projets
- `EnhancedInteractiveMap` / `Projects.tsx` : afficher chaque zone d'intervention en `Polygon`/`Circle` Leaflet (couleur selon statut). Marqueur adresse = pin classique distinct.

### C4. Refonte importers/exporters
- **`AdvancedProjectImporter.tsx`** + **`ProjectFileImporter.tsx`** : supprimer toute instanciation directe de `ProjectService`/`supabase.from`. Passer par `useProjectImportExportHex().importProjects`.
- **`ProjectExporter.tsx`** : utiliser `useProjectImportExportHex().exportProjects`. Ajouter case à cocher "Inclure zones d'intervention (GeoJSON)".
- **Nouveau `ProjectImportTransformer`** (`src/dtos/transforms/ProjectImportTransformer.ts`) : ligne CSV/Excel/JSON brute → `CreateProjectDTO` validé (référentiel, parsing GeoJSON pour `interventionZones`, normalisation wilaya via `mauritaniaUtils`).
- `ProjectImportExportService.importProjects` utilise `ProjectImportTransformer.fromRow` au lieu de mapping inline.

### C5. Critères de validation
- `rg "supabase.from" src/components/projects/` → 0 hit pour Importer/Exporter.
- `rg "new ProjectService" src/components/` → 0 hit.
- Build TS vert (`tsgo`).
- Création projet : on dessine 2 polygones se chevauchant → sauvegarde → reload → les 2 zones réapparaissent sur la carte et dans l'export GeoJSON.

---

## Ordre d'exécution

1. **Lot A** en parallèle (4 fixes indépendants, fichiers distincts).
2. **Lot B** (domaine pur, pas de dépendance UI).
3. **Lot C** (dépend de B). C1 (picker) + C4 (refonte importers) en parallèle, puis C2/C3 qui consomment C1.

Migration DB : aucune nouvelle table. Juste un `COMMENT ON COLUMN public.projects.localisation` mis à jour pour documenter `{version:2, zones:[]}`.
