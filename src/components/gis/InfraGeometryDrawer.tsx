/**
 * InfraGeometryDrawer — tracé d'un ouvrage réseau sur la carte, avec la même
 * interaction que l'éditeur de zones d'intervention (clic = sommet, double-clic
 * = terminer, annuler / effacer, recherche d'adresse). Le mode est imposé par
 * le type d'ouvrage (Point, LineString, Polygon) issu du référentiel infra.
 * Composant UI pur : il émet une géométrie GeoJSON (lng, lat ; WGS84).
 */
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Polyline, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Geometry } from 'geojson';
import { Button } from '@/components/ui/button';
import AddressSearchBox from '@/components/gis/AddressSearchBox';
import { useLanguage } from '@/contexts/LanguageContext';
import type { GeometryKind } from '@/dtos/entities/ProjectWorkbenchDTO';
import { Undo2, Eraser, Check, MapPin, Spline, Hexagon } from 'lucide-react';

type DrawMode = 'Point' | 'LineString' | 'Polygon';
type LatLng = { lat: number; lng: number };
const markerIcon = L.icon({ iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

const toGeometry = (mode: DrawMode, points: LatLng[]): Geometry | null => {
  const pos = points.map(p => [p.lng, p.lat]);
  if (mode === 'Point') return points[0] ? { type: 'Point', coordinates: pos[0] } : null;
  if (mode === 'LineString') return points.length >= 2 ? { type: 'LineString', coordinates: pos } : null;
  return points.length >= 3 ? { type: 'Polygon', coordinates: [[...pos, pos[0]]] } : null;
};
const fromGeometry = (geometry?: Geometry | null): LatLng[] => {
  if (!geometry) return [];
  if (geometry.type === 'Point') return [{ lng: geometry.coordinates[0], lat: geometry.coordinates[1] }];
  if (geometry.type === 'LineString') return geometry.coordinates.map(c => ({ lng: c[0], lat: c[1] }));
  if (geometry.type === 'Polygon') return (geometry.coordinates[0] || []).slice(0, -1).map(c => ({ lng: c[0], lat: c[1] }));
  return [];
};
const modesFor = (kind?: GeometryKind): DrawMode[] => {
  if (kind === 'Point' || kind === 'MultiPoint') return ['Point'];
  if (kind === 'LineString' || kind === 'MultiLineString') return ['LineString'];
  if (kind === 'Polygon' || kind === 'MultiPolygon') return ['Polygon'];
  return ['Point', 'LineString', 'Polygon'];
};

function Clicks({ onClick, onDouble }: { onClick: (p: LatLng) => void; onDouble: () => void }) {
  useMapEvents({ click: e => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }), dblclick: () => onDouble() });
  return null;
}
function Fly({ target }: { target: [number, number] | null }) { const map = useMap(); useEffect(() => { if (target) map.flyTo(target, 14, { duration: 0.6 }); }, [target, map]); return null; }

export interface InfraGeometryDrawerProps {
  value?: Geometry | null;
  kind?: GeometryKind;
  onChange: (geometry: Geometry | null) => void;
  center: [number, number];
  context?: FeatureCollection;
}

export function InfraGeometryDrawer({ value, kind, onChange, center, context }: InfraGeometryDrawerProps) {
  const { t } = useLanguage();
  const modes = modesFor(kind);
  const [mode, setMode] = useState<DrawMode>(value && modes.includes(value.type as DrawMode) ? value.type as DrawMode : modes[0]);
  const [points, setPoints] = useState<LatLng[]>(() => fromGeometry(value));
  const [target, setTarget] = useState<[number, number] | null>(null);
  useEffect(() => { if (!modes.includes(mode)) { setMode(modes[0]); setPoints([]); onChange(null); } }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = (next: LatLng[], m = mode) => { setPoints(next); onChange(toGeometry(m, next)); };
  const add = (p: LatLng) => update(mode === 'Point' ? [p] : [...points, p]);
  const positions = useMemo(() => points.map(p => [p.lat, p.lng] as [number, number]), [points]);
  const icons = { Point: MapPin, LineString: Spline, Polygon: Hexagon };
  const complete = toGeometry(mode, points) !== null;

  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      {modes.map(m => { const Icon = icons[m]; return <Button key={m} type="button" size="sm" variant={m === mode ? 'default' : 'outline'} onClick={() => { setMode(m); update([], m); }}><Icon className="h-4 w-4 mr-1" />{t(`workbench.draw_${m.toLowerCase()}`)}</Button>; })}
      <Button type="button" size="sm" variant="ghost" disabled={!points.length} onClick={() => update(points.slice(0, -1))}><Undo2 className="h-4 w-4 mr-1" />{t('workbench.undo')}</Button>
      <Button type="button" size="sm" variant="ghost" disabled={!points.length} onClick={() => update([])}><Eraser className="h-4 w-4 mr-1" />{t('workbench.clear')}</Button>
      <span className="text-sm text-muted-foreground inline-flex items-center gap-1">{complete && <Check className="h-4 w-4 text-primary" />}{t(`workbench.draw_hint_${mode.toLowerCase()}`)} · {points.length} {t('workbench.vertices')}</span>
    </div>
    <AddressSearchBox onSelect={selection => { setTarget([selection.lat, selection.lng]); if (mode === 'Point') update([{ lat: selection.lat, lng: selection.lng }]); }} />
    <div className="h-[360px] overflow-hidden border border-border">
      <MapContainer center={positions[0] || center} zoom={positions.length ? 12 : 8} doubleClickZoom={false} className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {context && context.features.length > 0 && <GeoJSON key={JSON.stringify(context).length} data={context} style={{ color: 'hsl(var(--muted-foreground))', weight: 1, fillOpacity: 0.05 }} />}
        <Clicks onClick={add} onDouble={() => undefined} />
        <Fly target={target} />
        {mode === 'Point' && positions[0] && <Marker position={positions[0]} icon={markerIcon} />}
        {mode === 'LineString' && positions.length > 0 && <Polyline positions={positions} pathOptions={{ color: 'hsl(var(--primary))', weight: 4 }} />}
        {mode === 'Polygon' && positions.length > 0 && <Polygon positions={positions} pathOptions={{ color: 'hsl(var(--primary))' }} />}
        {mode !== 'Point' && positions.map((p, i) => <Marker key={i} position={p} icon={markerIcon} opacity={0.6} />)}
      </MapContainer>
    </div>
  </div>;
}
export default InfraGeometryDrawer;
