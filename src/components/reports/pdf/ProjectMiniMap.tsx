/**
 * ProjectMiniMap — miniature cartographique rendue dans le PDF.
 *
 * Fond de carte : image statique du pays (`src/assets/mauritania-basemap.png`)
 * calibrée par le référentiel `mauritania-basemap.referential.ts`.
 * Surcouche vectorielle (react-pdf/Svg) : zones d'intervention réellement
 * persistées par le module SIG (`GeoZoneEditor`), centroïde du projet et villes
 * de repère voisines issues du référentiel. Aucune donnée simulée : sans
 * géométrie, le cadre affiche « Localisation non géoréférencée ».
 */
import basemap from '@/assets/mauritania-basemap.png';
import {
  MAURITANIA_BASEMAP,
  nearestReferenceCities,
} from '@/config/referentials/reports/mauritania-basemap.referential';
import type { InterventionZoneDTO, InterventionZoneLatLng } from '@/dtos/entities/InterventionZoneDTO';
import { Circle, Image, Polygon, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';

const MAP_W = 150;
const MAP_H = 104;

const palette = {
  border: '#93c5fd',
  zoneFill: '#3b82f6',
  zoneStroke: '#1e40af',
  pin: '#dc2626',
  city: '#374151',
  text: '#4b5563',
};

const styles = StyleSheet.create({
  container: {
    width: MAP_W,
    marginLeft: 10,
  },
  frame: {
    width: MAP_W,
    height: MAP_H,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  basemap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MAP_W,
    height: MAP_H,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cityLabel: {
    position: 'absolute',
    fontSize: 3.5,
    color: palette.city,
  },
  caption: {
    fontSize: 5,
    color: palette.text,
    textAlign: 'center',
    marginTop: 2,
  },
  empty: {
    fontSize: 5,
    color: palette.text,
    textAlign: 'center',
    marginTop: 46,
  },
});

export interface ProjectMiniMapInput {
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: { latitude?: number | null; longitude?: number | null } | null;
  interventionZones?: InterventionZoneDTO[] | null;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const collectPoints = (project: ProjectMiniMapInput): InterventionZoneLatLng[] => {
  const points: InterventionZoneLatLng[] = [];
  (project.interventionZones || []).forEach((zone) => {
    (zone?.coordinates || []).forEach((c) => {
      if (isNum(c?.lat) && isNum(c?.lng)) points.push({ lat: c.lat, lng: c.lng });
    });
  });
  const lat = project.latitude ?? project.coordinates?.latitude;
  const lng = project.longitude ?? project.coordinates?.longitude;
  if (isNum(lat) && isNum(lng)) points.push({ lat, lng });
  return points;
};

/** Projection fixe sur l'étendue du raster statique (pays entier). */
const projectPoint = (p: InterventionZoneLatLng) => {
  const { lngMin, lngMax, latMin, latMax } = MAURITANIA_BASEMAP;
  const x = ((p.lng - lngMin) / (lngMax - lngMin)) * MAP_W;
  const y = ((latMax - p.lat) / (latMax - latMin)) * MAP_H;
  return { x, y };
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function ProjectMiniMap({ project }: { project: ProjectMiniMapInput }) {
  const zones = (project.interventionZones || []).filter(
    (z) => Array.isArray(z?.coordinates) && z.coordinates.length > 0,
  );
  const points = collectPoints(project);

  if (points.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.frame}>
          <Image src={basemap} style={styles.basemap} />
          <Text style={styles.empty}>Localisation non géoréférencée</Text>
        </View>
        <Text style={styles.caption}>{project.location || 'Localisation non définie'}</Text>
      </View>
    );
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

  const pin = projectPoint({ lat: centerLat, lng: centerLng });
  const cities = nearestReferenceCities(centerLat, centerLng, 4);

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <Image src={basemap} style={styles.basemap} />

        <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={styles.overlay}>
          {zones.map((zone, idx) => {
            const projected = zone.coordinates
              .filter((c) => isNum(c?.lat) && isNum(c?.lng))
              .map(projectPoint);
            if (projected.length === 0) return null;

            if (zone.type === 'circle' && projected.length === 1) {
              const degPerPx = (MAURITANIA_BASEMAP.lngMax - MAURITANIA_BASEMAP.lngMin) / MAP_W;
              const radiusPx = zone.radiusMeters
                ? clamp(zone.radiusMeters / 111_320 / degPerPx, 1.2, MAP_W / 3)
                : 2;
              return (
                <Circle
                  key={`zone-${idx}`}
                  cx={projected[0].x}
                  cy={projected[0].y}
                  r={radiusPx}
                  fill={palette.zoneFill}
                  fillOpacity={0.3}
                  stroke={palette.zoneStroke}
                  strokeWidth={0.5}
                />
              );
            }

            if (projected.length === 1) {
              return (
                <Circle
                  key={`zone-${idx}`}
                  cx={projected[0].x}
                  cy={projected[0].y}
                  r={1.6}
                  fill={palette.pin}
                />
              );
            }

            return (
              <Polygon
                key={`zone-${idx}`}
                points={projected.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
                fill={palette.zoneFill}
                fillOpacity={0.3}
                stroke={palette.zoneStroke}
                strokeWidth={0.6}
              />
            );
          })}

          {/* Villes de repère voisines */}
          {cities.map((city) => {
            const c = projectPoint({ lat: city.lat, lng: city.lng });
            return (
              <Circle
                key={`city-${city.name}`}
                cx={c.x}
                cy={c.y}
                r={city.major ? 1.1 : 0.8}
                fill={palette.city}
              />
            );
          })}

          {/* Centroïde du projet */}
          <Circle cx={pin.x} cy={pin.y} r={2.2} fill={palette.pin} />
        </Svg>

        {cities.map((city) => {
          const c = projectPoint({ lat: city.lat, lng: city.lng });
          return (
            <Text
              key={`label-${city.name}`}
              style={[
                styles.cityLabel,
                {
                  left: clamp(c.x + 2, 0, MAP_W - 26),
                  top: clamp(c.y - 2.5, 0, MAP_H - 6),
                },
              ]}
            >
              {city.name}
            </Text>
          );
        })}
      </View>
      <Text style={styles.caption}>
        {(project.location || 'Localisation').slice(0, 30)} — {centerLat.toFixed(2)}, {centerLng.toFixed(2)}
        {zones.length > 0 ? ` (${zones.length} zone${zones.length > 1 ? 's' : ''})` : ''}
      </Text>
    </View>
  );
}
