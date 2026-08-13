/**
 * ProjectMiniMap — miniature GIS rendue dans le PDF (react-pdf/Svg).
 *
 * Utilise les données réelles du projet (coordonnées + zones d'intervention
 * telles que dessinées par le module SIG `GeoZoneEditor`) et les projette dans
 * une bbox normalisée. Aucune donnée simulée : si aucune géométrie n'existe,
 * le composant retourne un cadre "Localisation non géoréférencée".
 */
import type { InterventionZoneDTO, InterventionZoneLatLng } from '@/dtos/entities/InterventionZoneDTO';
import { Circle, Polygon, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';

const MAP_W = 120;
const MAP_H = 72;
const PAD = 6;

const palette = {
  land: '#f8fafc',
  border: '#93c5fd',
  zoneFill: '#3b82f6',
  zoneStroke: '#1e40af',
  pin: '#dc2626',
  text: '#4b5563',
};

const styles = StyleSheet.create({
  container: {
    width: MAP_W,
    height: MAP_H + 12,
    marginLeft: 10,
  },
  frame: {
    width: MAP_W,
    height: MAP_H,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    backgroundColor: palette.land,
    overflow: 'hidden',
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
    marginTop: 30,
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

export function ProjectMiniMap({ project }: { project: ProjectMiniMapInput }) {
  const zones = (project.interventionZones || []).filter(
    (z) => Array.isArray(z?.coordinates) && z.coordinates.length > 0,
  );
  const points = collectPoints(project);

  if (points.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.frame}>
          <Text style={styles.empty}>Localisation non géoréférencée</Text>
        </View>
        <Text style={styles.caption}>{project.location || 'Localisation non définie'}</Text>
      </View>
    );
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // Marge minimale pour éviter une division par zéro sur un point unique.
  const spanLat = Math.max(maxLat - minLat, 0.02);
  const spanLng = Math.max(maxLng - minLng, 0.02);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const projectPoint = (p: InterventionZoneLatLng) => {
    const x = PAD + ((p.lng - (centerLng - spanLng / 2)) / spanLng) * (MAP_W - 2 * PAD);
    // Latitude croissante vers le haut → inversion de l'axe Y.
    const y = PAD + ((centerLat + spanLat / 2 - p.lat) / spanLat) * (MAP_H - 2 * PAD);
    return { x, y };
  };

  const pin = projectPoint({ lat: centerLat, lng: centerLng });

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
          {/* Graticule de repère (échelle relative à la bbox du projet) */}
          <Rect x="0" y="0" width={MAP_W} height={MAP_H} fill={palette.land} />
          <Rect x={PAD} y={MAP_H / 2} width={MAP_W - 2 * PAD} height={0.4} fill="#e5e7eb" />
          <Rect x={MAP_W / 2} y={PAD} width={0.4} height={MAP_H - 2 * PAD} fill="#e5e7eb" />

          {zones.map((zone, idx) => {
            const projected = zone.coordinates
              .filter((c) => isNum(c?.lat) && isNum(c?.lng))
              .map(projectPoint);
            if (projected.length === 0) return null;

            if (zone.type === 'circle' && projected.length === 1) {
              const radiusPx = zone.radiusMeters
                ? Math.max(
                    2,
                    Math.min(
                      (MAP_W - 2 * PAD) / 2,
                      (zone.radiusMeters / 111_320 / spanLng) * (MAP_W - 2 * PAD),
                    ),
                  )
                : 3;
              return (
                <Circle
                  key={`zone-${idx}`}
                  cx={projected[0].x}
                  cy={projected[0].y}
                  r={radiusPx}
                  fill={palette.zoneFill}
                  fillOpacity={0.25}
                  stroke={palette.zoneStroke}
                  strokeWidth={0.6}
                />
              );
            }

            if (projected.length === 1) {
              return (
                <Circle
                  key={`zone-${idx}`}
                  cx={projected[0].x}
                  cy={projected[0].y}
                  r={2}
                  fill={palette.pin}
                />
              );
            }

            return (
              <Polygon
                key={`zone-${idx}`}
                points={projected.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
                fill={palette.zoneFill}
                fillOpacity={0.25}
                stroke={palette.zoneStroke}
                strokeWidth={0.6}
              />
            );
          })}

          {/* Centroïde du projet */}
          <Circle cx={pin.x} cy={pin.y} r={2.2} fill={palette.pin} />
        </Svg>
      </View>
      <Text style={styles.caption}>
        {(project.location || 'Localisation').slice(0, 26)} — {centerLat.toFixed(2)}, {centerLng.toFixed(2)}
        {zones.length > 0 ? ` (${zones.length} zone${zones.length > 1 ? 's' : ''})` : ''}
      </Text>
    </View>
  );
}
