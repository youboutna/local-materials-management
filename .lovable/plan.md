
# Alignement GIS — Localisation unifiée en 3 couches, partout

## Problème constaté

- `InterventionZonesPicker` n'est branché **que** dans `LocationStep` (étape création). Il ne sait pas importer un GeoJSON ni chercher une adresse pour créer une zone.
- La page **détail projet** (`ProjectDetailByDTO`) et la page **édition** utilisent `InteractiveMapGIS`, un composant matériel générique qui n'affiche **pas** les zones d'intervention du projet.
- `ProjectFormWithMap` (formulaire legacy) utilise aussi `InteractiveMapGIS` sans lien avec `interventionZones`.
- Sur les pages **matériaux** (`Materials`, `MaterialDetail`, `EnhancedMaterialForm`), pas de tracé possible : uniquement un point.
- Résultat : l'utilisateur ne "voit" pas les améliorations parce que le picker ne sort pas de l'étape 2 de création.

## Cible

Un modèle unique de localisation, applicable à tous les concepts géo-référencés :

1. **Adresse classique / attributaire** : adresse d'unité de gestion, siège, entrepôt, fournisseur, localité administrative.
2. **Géolocalisation GNSS** : point GPS exact `latitude/longitude`, issu de la base interne, saisie manuelle, GPS navigateur, reverse-geocoding ou provider carte.
3. **Tracé de formes géo-référencées** : `Polygon`, `MultiPolygon`, `GeometryCollection` / MultiGeometry, cercle, rectangle, point, avec libellés métier selon le contexte.

Un seul composant réutilisé partout : **`GeoZoneEditor` / Système GIS Interactif** qui combine :

1. **Recherche adresse** (via `UnifiedLocationSelector`) → ajoute un point ou centre une zone.
2. **Tracé multi-polygones / rectangle / cercle / point** sur Leaflet, avec preview de la ligne de fermeture et libellé par zone.
3. **Import GeoJSON fidèle** (`FeatureCollection`, `Feature`, `Geometry`) → conservation des géométries originales quand elles sont complexes.
4. **Export GeoJSON normalisé** (bouton "Télécharger") → ré-export fidèle des `MultiPolygon` / `GeometryCollection`.
5. **Reverse-geocoding auto** via `GeocodingServiceFactory` (déjà en place) pour remplir `regionCode`/`cityCode`.
6. **Mode `readOnly`** : rend les zones sans barre d'outils, pour l'affichage détail.
7. **Contexte métier paramétrable** : projet = zones d'intervention, matériau = workspace/warehouse/couverture logistique, indicateurs = zones d'analyse spatiale et infobulles détaillées.

## Livrables

### 1. Composant unifié

- `src/components/gis/GeoZoneEditor.tsx` (nouveau) — reprend la logique de `InterventionZonesPicker`, ajoute :
  - barre d'outils : Recherche adresse / source interne / source provider carte / Dessiner polygone / rectangle / cercle / point / Importer GeoJSON / Exporter / Reset.
  - bandeau adresse en tête (autocomplete `UnifiedLocationSelector`) qui permet de choisir la source : **base interne** ou **API provider carte**.
  - alimentation automatique du centre et du premier point de dessin depuis la source sélectionnée.
  - drop-zone GeoJSON (fichier `.geojson` / `.json`).
  - prop `readOnly?: boolean` pour l'affichage seul.
  - prop `showAddressBar?: boolean` (par défaut `true` en édition).
  - prop `contextLabel?: string` (`Zone d'intervention`, `Workspace/warehouse`, `Zone d'analyse`, etc.).
  - prop `tooltipRenderer?: (zone) => ReactNode` pour les infobulles d'analyse spatiale.
- `InterventionZonesPicker.tsx` devient un alias rétro-compatible qui délègue à `GeoZoneEditor`.

### 2. Wiring projet (create / edit / detail)

- `LocationStep.tsx` : garder le nouveau `GeoZoneEditor` avec `showAddressBar={true}`. L'adresse projet actuelle (siège) reste séparée au-dessus.
- `ProjectDetailByDTO.tsx` : remplacer le bloc `InteractiveMapGIS` par `GeoZoneEditor readOnly` alimenté par `project.interventionZones`. Fallback sur `InteractiveMapGIS` si aucune zone (ancien projet).
- `ProjectFormWithMap.tsx` : ajouter un `GeoZoneEditor` sous la carte pour édition legacy (garde compat).
- `EnhancedWorkflowPhaseManager.tsx` : simple substitution de la carte par `GeoZoneEditor readOnly` (déjà en contexte projet).

### 3. Wiring matériaux

- `EnhancedMaterialForm.tsx` : après le `UnifiedLocationSelector`, ajouter un `GeoZoneEditor` optionnel (`showAddressBar={false}`) pour tracer la zone de couverture du matériau (persistée dans `material.coverageZones` — colonne JSONB existante sinon on stocke dans `material.metadata.coverageZones`).
- `MaterialDetail.tsx` : remplacer `MaterialLocationMap` par `GeoZoneEditor readOnly` si `coverageZones` présent, sinon garder le point.
- `Materials.tsx` (page liste, mode carte) : passer la couche multi-polygones des matériaux via `GeoZoneEditor readOnly` global.

### 4. Persistance

- Rien à migrer côté DB : `projects.localisation` déjà en v3 (`normalize_intervention_zones`).
- Corriger `ProjectWorkflowService.saveStep(3)` et les transformers projet pour ne plus perdre `localisation` / `interventionZones` pendant création et modification.
- Étendre `InterventionZoneDTO` et le domaine pour accepter : `polygon`, `multipolygon`, `multigeometry`, `rectangle`, `circle`, `point`.
- Normaliser l'import/export GeoJSON dans un utilitaire unique :
  - `Point` → zone `point`.
  - `Polygon` → zone `polygon` avec géométrie originale préservée.
  - `MultiPolygon` → zone `multipolygon` avec géométrie originale préservée, pas d'écrasement en simples polygones sauf affichage Leaflet.
  - `GeometryCollection` → zone `multigeometry` avec géométries originales préservées.
  - `Feature.properties` → `properties` + `label` métier.
- Pour les matériaux, si la colonne dédiée n'existe pas, ajouter `coverage_zones jsonb default '[]'::jsonb` à `public.materials` via migration (avec GRANTs).
- Corriger `MaterialTransformer`, `MaterialDTO`, `useMaterialsHex` et `MaterialService` pour persister `adresse`, coordonnées GNSS, `forme`, `localisation` / `coverageZones` au create et update.

### 5. Traçabilité

- `console.info('[GeoZoneEditor] …')` sur : import GeoJSON (nb features), export, création/suppression de zone, résultat reverse-geocode.
- `console.info('[ProjectDetail] rendered N intervention zones')`.
- `console.info('[MaterialGIS] persisted N coverage/workspace zones')`.
- `console.info('[ProjectWorkflow] persisted N intervention zones')`.

## Détails techniques

- Leaflet + `leaflet-draw` non-requis : dessin fait à la main (déjà OK dans `InterventionZonesPicker`).
- Parsing GeoJSON : simple lecture `JSON.parse`, conversion `[lng,lat]` → `{lat,lng}`, mapping :
  - `Point` → `type: 'point'`
  - `Polygon` → `type: 'polygon'` (première ring)
  - `MultiPolygon` → `type: 'multipolygon'`, rendu comme plusieurs rings mais stockage fidèle
  - `GeometryCollection` → `type: 'multigeometry'`, rendu des sous-géométries supportées
  - `Feature.properties.label` → `label` de zone
- Reverse-geocoding batch : appelé uniquement pour les nouvelles zones (dédup par `label+centroid`).
- Aucune régression sur la couche adapter/transformer : les DTO/entities `InterventionZone*` sont déjà en v3.

## Fichiers touchés

```text
src/components/gis/GeoZoneEditor.tsx                          (new)
src/components/projects/InterventionZonesPicker.tsx           (alias → GeoZoneEditor)
src/components/project/steps/LocationStep.tsx                 (import via alias, showAddressBar=true)
src/components/project/ProjectDetailByDTO.tsx                 (remplace InteractiveMapGIS)
src/components/project/ProjectFormWithMap.tsx                 (ajout picker)
src/components/project/EnhancedWorkflowPhaseManager.tsx       (remplace map par picker readonly)
src/components/materials/EnhancedMaterialForm.tsx             (ajout picker optionnel)
src/pages/MaterialDetail.tsx                                  (picker readonly si zones)
src/pages/Materials.tsx                                       (couche multi-polygones)
src/dtos/transforms/ProjectImportTransformer.ts               (MultiPolygon support)
supabase/migrations/xxx_add_material_coverage_zones.sql       (si colonne absente)
```

## Hors périmètre

- Pas de refonte du fond de carte (Leaflet OSM reste par défaut).
- Pas de nouveau provider de géocodage (on garde `GeocodingServiceFactory`/Nominatim).
