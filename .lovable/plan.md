# Vérification .lovable/plan.md + normalisation bidirectionnelle GIS

## 1. Vérification de l'exécution du plan (8 écarts)

Audit rapide de chaque écart via lecture ciblée des fichiers :

| # | Fichier | Statut attendu | Action si écart |
|---|---------|----------------|-----------------|
| 1 | `ProjectFormWithMap.tsx` | `GeoZoneEditor` monté | Compléter si manquant |
| 2 | `EnhancedWorkflowPhaseManager.tsx` | `GeoZoneEditor readOnly` | Remplacer `InteractiveMapGIS` |
| 3 | `EnhancedMaterialForm.tsx` | `GeoZoneEditor` coverage | Idem |
| 4 | `Materials.tsx` | `ProjectMap` + overlay | Idem |
| 5 | `LocationStep.tsx` | import mort supprimé | Nettoyer |
| 6 | `MaterialDetail.tsx` | doublon supprimé | Nettoyer |
| 7 | `ProjectDetailByDTO.tsx` | fallback strict | Corriger condition |
| 8 | `Dashboard.tsx` + `ProjectDashboard.tsx` | `showInterventionZones` + légende | Compléter |

Rapport écrit dans le message final (fichier par fichier, avec numéros de ligne). Correction uniquement des écarts réels détectés.

## 2. Normalisation bidirectionnelle multi-polygones

Objectif : garantir qu'un projet **exporté** puis **réimporté** conserve à l'identique ses zones (Polygon, MultiPolygon, Circle, Point) — round-trip fidèle.

### 2.1 Format canonique d'export (GeoJSON standard)

`ProjectImportExportService.toExportRow` produit déjà `interventionZonesGeoJSON` (FeatureCollection). Extensions nécessaires :

- **Cercle** → `Feature` `Point` + `properties.shape="circle"` + `properties.radiusMeters` (respect GeoJSON RFC 7946 : cercle non natif, encodé via propriété).
- **Rectangle** → `Feature` `Polygon` fermé + `properties.shape="rectangle"` (les 4 sommets + fermeture).
- **Polygon** → déjà OK, mais garantir la fermeture du ring (dernier point = premier).
- **MultiPolygon** (nouveau) : si une zone porte plusieurs rings, émettre `geometry.type="MultiPolygon"`.
- Propager `regionCode`, `cityCode`, `geocodingMeta`, `areaSqm`, `label`, `address` dans `properties`.

### 2.2 Import symétrique dans `ProjectImportTransformer.geoJsonToZones`

Compléter la reconstruction pour restituer le type d'origine à partir de `properties.shape` :

- `Point` + `properties.shape="circle"` + `radiusMeters` → `InterventionZoneDTO { type:'circle', coordinates:[centre], radiusMeters }`.
- `Polygon` + `properties.shape="rectangle"` → `type:'rectangle'`.
- `Polygon` sans hint → `type:'polygon'` (comportement actuel préservé).
- `MultiPolygon` → une `InterventionZoneDTO` par polygone (plutôt qu'une par ring), en réhydratant `label` depuis `properties`.
- Restaurer `regionCode`, `cityCode`, `geocodingMeta`, `areaSqm`, `label`, `address` depuis `properties`.
- Toujours fermer le ring en entrée (tolérance : accepter ring fermé ou ouvert).

### 2.3 Utilitaire partagé `GeoJsonZoneCodec`

Nouveau fichier `src/dtos/transforms/GeoJsonZoneCodec.ts` :

```ts
export class GeoJsonZoneCodec {
  static toFeature(zone: InterventionZoneDTO, index: number): GeoJSON.Feature
  static fromFeature(feature: GeoJSON.Feature): InterventionZoneDTO[]
  static toFeatureCollection(zones: InterventionZoneDTO[]): GeoJSON.FeatureCollection
  static fromFeatureCollection(fc: unknown): InterventionZoneDTO[]
}
```

- Source de vérité unique utilisée par :
  - `ProjectImportExportService.toExportRow` (remplace le mapping inline)
  - `ProjectImportTransformer.geoJsonToZones` (remplace le mapping inline)
  - futur consommateur `GeoZoneEditor` (import GeoJSON drag & drop)
- Écrit avec des types `GeoJSON.*` (déjà installés via `@types/geojson`, sinon inline minimal).

### 2.4 Test round-trip

Ajouter `src/dtos/transforms/__tests__/GeoJsonZoneCodec.roundtrip.test.ts` :

- Fixture couvrant les 4 formes (`polygon`, `rectangle`, `circle`, `point`) + un `MultiPolygon` reconstitué depuis 2 zones.
- Assert : `fromFeatureCollection(toFeatureCollection(zones))` égal à `zones` (comparaison structurelle sur type, coordonnées, radiusMeters, label, regionCode).

## Livrables

- Corrections ciblées des écarts plan.md restants.
- `src/dtos/transforms/GeoJsonZoneCodec.ts` (nouveau).
- `ProjectImportExportService.ts` + `ProjectImportTransformer.ts` : délégation au codec.
- Test round-trip.
- Aucun changement de schéma DB, aucune migration.

## Hors périmètre

- Pas de refonte des composants carte.
- Pas de nouveau format de fichier (on reste GeoJSON FeatureCollection standard).
