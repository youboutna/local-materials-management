# Finaliser l'alignement GIS — clôturer .lovable/plan.md

Le plan initial est appliqué à 60 %. Ce plan ferme les 8 écarts restants pour que **tous** les composants "localisation" — création, édition, détail, liste, dashboard, matériaux, phases — passent par `GeoZoneEditor` / `UnifiedLocationSelector` avec support multi-polygones.

## Écarts à corriger

| # | Fichier | Problème | Action |
|---|---------|----------|--------|
| 1 | `src/components/project/ProjectFormWithMap.tsx` | Édition legacy sans zones d'intervention | Ajouter `GeoZoneEditor` sous la carte, alimenté par `formData.interventionZones` |
| 2 | `src/components/project/EnhancedWorkflowPhaseManager.tsx` | Import `InteractiveMapGIS` non aligné | Remplacer par `GeoZoneEditor readOnly` alimenté par les zones du projet courant |
| 3 | `src/components/materials/EnhancedMaterialForm.tsx` | Pas de tracé multi-polygones | Ajouter `GeoZoneEditor` (`showAddressBar={false}`, `contextLabel="Zone de couverture"`), persister dans `material.coverageZones` (JSONB) |
| 4 | `src/pages/Materials.tsx` (mode carte) | `InteractiveMapGIS` isolé | Remplacer par `ProjectMap` (déjà multi-zones) + overlay `coverageZones` des matériaux |
| 5 | `src/components/project/steps/LocationStep.tsx` | Import mort `InteractiveMapGIS` | Supprimer l'import résiduel |
| 6 | `src/pages/MaterialDetail.tsx` | Doublon `MaterialLocationMap` + `GeoZoneEditor` | Garder uniquement `GeoZoneEditor readOnly`; supprimer `MaterialLocationMap` du rendu (composant conservé pour usages tiers) |
| 7 | `src/components/project/ProjectDetailByDTO.tsx` | `InteractiveMapGIS` rendu en plus des zones | Le rendre en fallback strict (`zones.length === 0`) au lieu de rendu additionnel |
| 8 | `src/pages/Dashboard.tsx` + `src/components/dashboard/ProjectDashboard.tsx` | `ProjectMap` brut, pas de légende / pas de zones d'intervention agrégées | Passer `showInterventionZones` à `ProjectMap` et ajouter la légende multi-zones ; côté `ProjectDashboard`, brancher `UnifiedLocationSelector` en lecture unifiée avec surface zones du projet actif |

## Persistance matériau (si absente)

- Vérifier `public.materials.coverage_zones jsonb default '[]'::jsonb` ; sinon migration avec `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated;` et `GRANT ALL ... TO service_role;`.
- Étendre `MaterialTransformer.fromSupabase` / `toSupabase` et `MaterialDTO` pour porter `coverageZones: InterventionZoneDTO[]`.
- `useMaterialsHex` (create + update) doit propager `coverageZones` au lieu de le nullifier.

## Traçabilité (logs vérifiables)

- `console.info('[Dashboard] map rendered {N} zones')`
- `console.info('[MaterialsMap] rendered {N} coverage zones')`
- `console.info('[MaterialGIS] persisted {N} coverage zones', materialId)`
- `console.info('[ProjectForm] intervention zones editor mounted')`

## Hors périmètre

- Aucune évolution du fond de carte (Leaflet OSM).
- Pas de nouveau provider géocodage (`GeocodingServiceFactory` conservé).
- `MaterialLocationMap` non supprimé du repo — seulement retiré du rendu de `MaterialDetail` pour éviter le doublon.

## Vérification

- Build + lint automatiques.
- Playwright rapide : create projet → tracer 2 polygones → edit → détail → dashboard, vérifier via console les 4 lignes de log ci-dessus.
