import 'leaflet/dist/leaflet.css';
import React, { useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Circle, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import type { FeatureCollection, Feature } from 'geojson';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pentagon, Circle as CircleIcon, MapPin, Upload, Download, Layers, LocateFixed, Plus, Minus, Check, X } from 'lucide-react';
import AddressSearchBox from '@/components/gis/AddressSearchBox';
import WilayaBoundariesLayer from '@/components/gis/layers/WilayaBoundariesLayer';
import { T } from '@/components/i18n/T';
import type { MapLocation } from '@/domain/entities/Location';
import type { InterventionZoneDTO, InterventionZoneLatLng } from '@/dtos/entities/InterventionZoneDTO';
import { MAP_LAYERS, MAP_STATUS_TONES, MAP_DEFAULT_TONE, MAP_NEUTRAL_TONE, type MapLayerCode } from '@/config/referentials/gis/map-layers.referential';
import { INFRA_DEFAULT_MAP_CENTER } from '@/config/referentials/projects/project-workbench.referential';

type DrawTool = 'polygon' | 'circle' | 'point' | null;

export interface GisInteractiveMapProps {
  locations?: MapLocation[];
  infrastructure?: FeatureCollection | null;
  zones?: InterventionZoneDTO[];
  height?: string;
  className?: string;
  onMarkerSelect?: (location: MapLocation) => void;
  /** Fourni ⇒ outils de dessin actifs ; la forme est persistée par l'appelant via son service. */
  onShapeDrawn?: (zone: InterventionZoneDTO) => void | Promise<void>;
  /** Fourni ⇒ import GeoJSON actif ; la persistance passe par le service de l'appelant. */
  onImportGeoJson?: (collection: FeatureCollection) => void | Promise<void>;
}

const tone = (v: string) => {
  const raw = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue(v).trim() : '';
  return raw ? `hsl(${raw})` : 'currentColor';
};
const statusTone = (status?: string) => tone(MAP_STATUS_TONES[(status ?? '').toLowerCase().trim()] ?? MAP_DEFAULT_TONE);

/** Attributs lisibles (aucun JSON brut) : seules les valeurs scalaires sont affichées. */
export function readableAttributes(props: Record<string, unknown> | null | undefined): Array<[string, string]> {
  return Object.entries(props ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object')
    .map(([k, v]) => [k, String(v)]);
}

const AttributePanel: React.FC<{ title: string; rows: Array<[string, string]>; children?: React.ReactNode }> = ({ title, rows, children }) => (
  <div className="min-w-[180px] space-y-1 text-xs">
    <div className="font-semibold text-sm">{title}</div>
    <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
      {rows.map(([k, v]) => (<React.Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></React.Fragment>))}
    </dl>
    {children}
  </div>
);

const MapControls: React.FC<{ home: [number, number]; zoom: number }> = ({ home, zoom }) => {
  const map = useMap();
  return (
    <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1">
      <Button size="icon" variant="secondary" aria-label="Zoom +" onClick={() => map.zoomIn()}><Plus className="h-4 w-4" /></Button>
      <Button size="icon" variant="secondary" aria-label="Zoom -" onClick={() => map.zoomOut()}><Minus className="h-4 w-4" /></Button>
      <Button size="icon" variant="secondary" aria-label="Recentrer" onClick={() => map.setView(home, zoom)}><LocateFixed className="h-4 w-4" /></Button>
    </div>
  );
};

const FlyTo: React.FC<{ target: [number, number] | null }> = ({ target }) => {
  const map = useMap();
  React.useEffect(() => { if (target) map.flyTo(target, 12); }, [target, map]);
  return null;
};

const DrawCapture: React.FC<{ tool: DrawTool; points: InterventionZoneLatLng[]; setPoints: (p: InterventionZoneLatLng[]) => void; finish: (z: InterventionZoneDTO) => void }> = ({ tool, points, setPoints, finish }) => {
  useMapEvents({
    click(e) {
      if (!tool) return;
      const p = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (tool === 'point') return finish({ type: 'point', coordinates: [p] });
      if (tool === 'circle' && points.length === 1) {
        return finish({ type: 'circle', coordinates: [points[0]], radiusMeters: Math.round(L.latLng(points[0]).distanceTo(e.latlng)) });
      }
      setPoints([...points, p]);
    },
  });
  return null;
};

export const GisInteractiveMap: React.FC<GisInteractiveMapProps> = ({
  locations = [], infrastructure, zones = [], height = '600px', className, onMarkerSelect, onShapeDrawn, onImportGeoJson,
}) => {
  const [layers, setLayers] = useState<Record<MapLayerCode, boolean>>(() => Object.fromEntries(MAP_LAYERS.map(l => [l.code, l.defaultOn])) as Record<MapLayerCode, boolean>);
  const [panelOpen, setPanelOpen] = useState(true);
  const [tool, setTool] = useState<DrawTool>(null);
  const [points, setPoints] = useState<InterventionZoneLatLng[]>([]);
  const [target, setTarget] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const home: [number, number] = [INFRA_DEFAULT_MAP_CENTER.lat, INFRA_DEFAULT_MAP_CENTER.lng];

  const projects = useMemo(() => locations.filter(l => l.type === 'project'), [locations]);
  const materials = useMemo(() => locations.filter(l => l.type !== 'project'), [locations]);
  const allZones = useMemo(() => [...zones, ...projects.flatMap(p => (p.interventionZone ? [p.interventionZone] : []))], [zones, projects]);

  const finish = async (zone: InterventionZoneDTO) => {
    setTool(null); setPoints([]);
    try { await onShapeDrawn?.(zone); setError(null); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const onFile = async (file?: File) => {
    if (!file || !onImportGeoJson) return;
    try {
      const parsed = JSON.parse(await file.text()) as FeatureCollection;
      if (parsed?.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) throw new Error('GeoJSON FeatureCollection attendu');
      await onImportGeoJson(parsed); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportGeoJson = () => {
    const zoneFeatures: Feature[] = allZones.map(z => z.type === 'polygon' || z.type === 'rectangle'
      ? { type: 'Feature', properties: { label: z.label ?? null, type: z.type }, geometry: { type: 'Polygon', coordinates: [[...z.coordinates, z.coordinates[0]].map(c => [c.lng, c.lat])] } }
      : { type: 'Feature', properties: { label: z.label ?? null, type: z.type, radiusMeters: z.radiusMeters ?? null }, geometry: { type: 'Point', coordinates: [z.coordinates[0].lng, z.coordinates[0].lat] } });
    const locFeatures: Feature[] = locations.map(l => ({ type: 'Feature', properties: { id: l.id, name: l.name, type: l.type, status: l.status ?? null }, geometry: { type: 'Point', coordinates: [l.longitude, l.latitude] } }));
    const fc: FeatureCollection = { type: 'FeatureCollection', features: [...locFeatures, ...zoneFeatures, ...(infrastructure?.features ?? [])] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(fc)], { type: 'application/geo+json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'carte.geojson'; a.click(); URL.revokeObjectURL(url);
  };

  const toolBtn = (code: Exclude<DrawTool, null>, icon: React.ReactNode, k: string, fb: string) => (
    <Button size="sm" variant={tool === code ? 'default' : 'ghost'} disabled={!onShapeDrawn} onClick={() => { setTool(tool === code ? null : code); setPoints([]); }}>
      {icon}<span className="hidden sm:inline"><T k={k} fallback={fb} /></span>
    </Button>
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ height }}>
      <div className="absolute left-1/2 top-2 z-[1000] flex w-[min(95%,760px)] -translate-x-1/2 flex-wrap items-center gap-1 rounded-md border bg-background/95 p-1 shadow">
        {toolBtn('polygon', <Pentagon className="h-4 w-4" />, 'map.tool.polygon', 'Polygone')}
        {toolBtn('circle', <CircleIcon className="h-4 w-4" />, 'map.tool.circle', 'Cercle')}
        {toolBtn('point', <MapPin className="h-4 w-4" />, 'map.tool.point', 'Point')}
        {tool === 'polygon' && points.length >= 3 && <Button size="sm" onClick={() => finish({ type: 'polygon', coordinates: points })}><Check className="h-4 w-4" /></Button>}
        {tool && <Button size="sm" variant="ghost" aria-label="Annuler" onClick={() => { setTool(null); setPoints([]); }}><X className="h-4 w-4" /></Button>}
        <Button size="sm" variant="ghost" disabled={!onImportGeoJson} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /><span className="hidden sm:inline"><T k="map.tool.import" fallback="Importer GeoJSON" /></span></Button>
        <input ref={fileRef} type="file" accept=".geojson,.json,application/geo+json" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
        <Button size="sm" variant="ghost" onClick={exportGeoJson}><Download className="h-4 w-4" /><span className="hidden sm:inline"><T k="map.tool.export" fallback="Exporter" /></span></Button>
        <div className="min-w-[180px] flex-1"><AddressSearchBox allowManual={false} onSelect={s => setTarget([s.lat, s.lng])} /></div>
      </div>

      <div className="absolute right-2 top-16 z-[1000] rounded-md border bg-background/95 p-2 text-sm shadow">
        <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => setPanelOpen(!panelOpen)}><Layers className="h-4 w-4" /><T k="map.layers" fallback="Calques" /></Button>
        {panelOpen && MAP_LAYERS.map(l => (
          <label key={l.code} className="flex min-h-9 cursor-pointer items-center gap-2 px-2">
            <Checkbox checked={layers[l.code]} onCheckedChange={v => setLayers({ ...layers, [l.code]: v === true })} />
            <T k={l.labelKey} fallback={l.fallback} />
          </label>
        ))}
      </div>

      {error && <div role="alert" className="absolute bottom-3 right-3 z-[1000] rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">{error}</div>}

      <MapContainer center={home} zoom={INFRA_DEFAULT_MAP_CENTER.zoom} zoomControl={false} className="h-full w-full rounded-lg">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapControls home={home} zoom={INFRA_DEFAULT_MAP_CENTER.zoom} />
        <FlyTo target={target} />
        <DrawCapture tool={tool} points={points} setPoints={setPoints} finish={finish} />
        {points.length > 0 && <Polygon positions={points.map(p => [p.lat, p.lng] as [number, number])} pathOptions={{ color: tone('--primary'), dashArray: '4' }} />}

        {layers.region && <WilayaBoundariesLayer visible showLabels />}

        {layers.location && projects.map(p => (
          <CircleMarker key={p.id} center={[p.latitude, p.longitude]} radius={8}
            pathOptions={{ color: layers.status ? statusTone(p.status) : tone(MAP_NEUTRAL_TONE), fillOpacity: 0.8 }}>
            <Popup>
              <AttributePanel title={p.name} rows={readableAttributes({ Statut: p.status, Région: p.region, Adresse: p.adresse, Début: p.startDate, Fin: p.endDate, Budget: p.budget })}>
                {onMarkerSelect && <Button size="sm" className="mt-1" onClick={() => onMarkerSelect(p)}><T k="auto.projectmap.voir_les_details" fallback="Voir les détails" /></Button>}
              </AttributePanel>
            </Popup>
          </CircleMarker>
        ))}

        {layers.materials && materials.map(m => (
          <CircleMarker key={m.id} center={[m.latitude, m.longitude]} radius={6} pathOptions={{ color: statusTone(m.status), fillOpacity: 0.9 }}>
            <Popup><AttributePanel title={m.name} rows={readableAttributes({ Type: m.type, Stock: m.status, Région: m.region, Adresse: m.adresse })} /></Popup>
          </CircleMarker>
        ))}

        {layers.zones && allZones.map((z, i) => {
          const c = { color: tone('--accent-foreground'), fillOpacity: 0.15 };
          const pop = <Popup><AttributePanel title={z.label ?? 'Zone'} rows={readableAttributes({ Forme: z.type, Rayon: z.radiusMeters })} /></Popup>;
          if (z.type === 'circle' && z.coordinates[0]) return <Circle key={i} center={[z.coordinates[0].lat, z.coordinates[0].lng]} radius={z.radiusMeters ?? 500} pathOptions={c}>{pop}</Circle>;
          if (z.coordinates.length >= 3) return <Polygon key={i} positions={z.coordinates.map(p => [p.lat, p.lng] as [number, number])} pathOptions={c}>{pop}</Polygon>;
          if (z.coordinates[0]) return <CircleMarker key={i} center={[z.coordinates[0].lat, z.coordinates[0].lng]} radius={6} pathOptions={c}>{pop}</CircleMarker>;
          return null;
        })}

        {layers.infrastructure && infrastructure && infrastructure.features.length > 0 && (
          <GeoJSON key={infrastructure.features.length} data={infrastructure} style={() => ({ color: tone('--secondary-foreground'), weight: 3 })}
            pointToLayer={(_f, latlng) => L.circleMarker(latlng, { radius: 6 })}
            onEachFeature={(f, layer) => {
              const rows = readableAttributes(f.properties as Record<string, unknown>);
              const el = document.createElement('div');
              el.className = 'text-xs space-y-0.5';
              rows.forEach(([k, v]) => { const d = document.createElement('div'); d.textContent = `${k} : ${v}`; el.appendChild(d); });
              layer.bindPopup(el);
            }} />
        )}
      </MapContainer>
    </div>
  );
};

export default GisInteractiveMap;
