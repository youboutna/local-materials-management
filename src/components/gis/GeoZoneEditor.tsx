/**
 * GeoZoneEditor — composant GIS unifié.
 *
 * Un seul composant pour tous les écrans qui manipulent des zones géo :
 *   - projet : création / édition / détail (readonly)
 *   - matériau : formulaire / détail
 *
 * Fonctionnalités :
 *   - Barre de recherche adresse (autocomplete DB + géocodage) qui centre
 *     la carte et propose "ajouter comme point".
 *   - Dessin multi-formes : polygone, rectangle, cercle, point.
 *   - Import GeoJSON (Feature / FeatureCollection) et export .geojson.
 *   - Reverse-geocoding auto via GeocodingServiceFactory (regionCode / cityCode).
 *   - Mode `readOnly` (aucune barre d'outils, aucun clic).
 *
 * IO : `value: InterventionZoneDTO[]` <-> `onChange(zones)`.
 * L'`InterventionZonesPicker` est un alias qui délègue à ce composant.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Circle,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trash2,
  MapPin,
  Check,
  X,
  Pencil,
  Circle as CircleIcon,
  Hexagon,
  Square,
  Upload,
  Download,
  Search,
} from 'lucide-react';
import type {
  InterventionZoneDTO,
  InterventionZoneLatLng,
  InterventionZoneShape,
} from '@/dtos/entities/InterventionZoneDTO';
import { getGeocodingService } from '@/application/services/GeocodingServiceFactory';
import LocationAutocomplete from '@/components/location/LocationAutocomplete';
import { toast } from 'sonner';

// -----------------------------------------------------------------------------
// Marqueur Leaflet
// -----------------------------------------------------------------------------
const markerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// -----------------------------------------------------------------------------
// Géométrie
// -----------------------------------------------------------------------------
const EARTH_R = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

function polygonAreaSqm(coords: InterventionZoneLatLng[]): number {
  if (coords.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    total +=
      (toRad(p2.lng) - toRad(p1.lng)) *
      (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }
  return Math.abs((total * EARTH_R * EARTH_R) / 2);
}
const circleAreaSqm = (r: number) => Math.PI * r * r;

const formatArea = (sqm: number) =>
  sqm >= 1_000_000
    ? `${(sqm / 1_000_000).toFixed(2)} km²`
    : sqm >= 10_000
    ? `${(sqm / 10_000).toFixed(2)} ha`
    : `${Math.round(sqm)} m²`;

// -----------------------------------------------------------------------------
// GeoJSON I/O
// -----------------------------------------------------------------------------
type GJPos = [number, number] | number[];
type GJGeometry =
  | { type: 'Point'; coordinates: GJPos }
  | { type: 'Polygon'; coordinates: GJPos[][] }
  | { type: 'MultiPolygon'; coordinates: GJPos[][][] };
type GJFeature = { type: 'Feature'; geometry: GJGeometry; properties?: Record<string, unknown> };
type GJRoot = GJFeature | { type: 'FeatureCollection'; features: GJFeature[] } | GJGeometry;

function geojsonToZones(root: GJRoot): InterventionZoneDTO[] {
  const out: InterventionZoneDTO[] = [];
  const features: GJFeature[] =
    (root as { type?: string }).type === 'FeatureCollection'
      ? (root as { features: GJFeature[] }).features
      : (root as GJFeature).geometry
      ? [root as GJFeature]
      : [{ type: 'Feature', geometry: root as GJGeometry, properties: {} }];

  features.forEach((f, idx) => {
    const label = (f.properties?.label as string) || (f.properties?.name as string) || `Zone ${idx + 1}`;
    const g = f.geometry;
    if (!g) return;
    if (g.type === 'Point') {
      const [lng, lat] = g.coordinates as [number, number];
      out.push({ type: 'point', coordinates: [{ lat, lng }], label });
    } else if (g.type === 'Polygon') {
      const ring = g.coordinates[0] || [];
      const coords = ring.map((p) => ({ lat: (p as number[])[1], lng: (p as number[])[0] }));
      // GeoJSON polygons are closed (first == last) — drop the duplicate.
      if (coords.length > 1) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first.lat === last.lat && first.lng === last.lng) coords.pop();
      }
      if (coords.length >= 3) {
        out.push({
          type: 'polygon',
          coordinates: coords,
          areaSqm: polygonAreaSqm(coords),
          label,
        });
      }
    } else if (g.type === 'MultiPolygon') {
      g.coordinates.forEach((poly, i) => {
        const ring = poly[0] || [];
        const coords = ring.map((p) => ({ lat: (p as number[])[1], lng: (p as number[])[0] }));
        if (coords.length > 1) {
          const first = coords[0];
          const last = coords[coords.length - 1];
          if (first.lat === last.lat && first.lng === last.lng) coords.pop();
        }
        if (coords.length >= 3) {
          out.push({
            type: 'polygon',
            coordinates: coords,
            areaSqm: polygonAreaSqm(coords),
            label: `${label} #${i + 1}`,
          });
        }
      });
    }
  });
  return out;
}

function zonesToGeojson(zones: InterventionZoneDTO[]): {
  type: 'FeatureCollection';
  features: GJFeature[];
} {
  const features: GJFeature[] = zones.map((z, idx) => {
    const props: Record<string, unknown> = {
      label: z.label ?? `Zone ${idx + 1}`,
      address: z.address,
      regionCode: z.regionCode,
      cityCode: z.cityCode,
      areaSqm: z.areaSqm,
      shape: z.type,
      radiusMeters: z.radiusMeters,
    };
    if (z.type === 'point' && z.coordinates[0]) {
      const p = z.coordinates[0];
      return {
        type: 'Feature',
        properties: props,
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      };
    }
    if (z.type === 'circle' && z.coordinates[0]) {
      // Cercles exportés comme Point avec propriété radiusMeters (convention).
      const p = z.coordinates[0];
      return {
        type: 'Feature',
        properties: props,
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      };
    }
    // polygon / rectangle
    const ring = z.coordinates.map((p) => [p.lng, p.lat] as [number, number]);
    if (ring.length > 0) ring.push(ring[0]); // close ring
    return {
      type: 'Feature',
      properties: props,
      geometry: { type: 'Polygon', coordinates: [ring] },
    };
  });
  return { type: 'FeatureCollection', features };
}

// -----------------------------------------------------------------------------
// Helpers Leaflet
// -----------------------------------------------------------------------------
const ClickCapture: React.FC<{
  onClick: (latlng: InterventionZoneLatLng) => void;
  onDoubleClick?: () => void;
}> = ({ onClick, onDoubleClick }) => {
  useMapEvents({
    click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
    dblclick: () => onDoubleClick?.(),
  });
  return null;
};

const FlyTo: React.FC<{ target: [number, number] | null; zoom?: number }> = ({
  target,
  zoom = 12,
}) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, zoom, { duration: 0.7 });
  }, [target, zoom, map]);
  return null;
};

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
export interface GeoZoneEditorProps {
  value?: InterventionZoneDTO[];
  onChange?: (zones: InterventionZoneDTO[]) => void;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  height?: number | string;
  /** Sans barre d'outils ni interaction — mode affichage. */
  readOnly?: boolean;
  /** Cache la barre de recherche d'adresse en haut. */
  showAddressBar?: boolean;
  /** Titre affiché. */
  title?: string;
  /** Sous-titre / hint. */
  hint?: string;
}

type DraftMode = 'idle' | 'polygon' | 'rectangle' | 'circle' | 'point';

// -----------------------------------------------------------------------------
// Composant
// -----------------------------------------------------------------------------
const GeoZoneEditor: React.FC<GeoZoneEditorProps> = ({
  value,
  onChange,
  defaultCenter = [18.0735, -15.9582], // Nouakchott
  defaultZoom = 6,
  height = 460,
  readOnly = false,
  showAddressBar = true,
  title,
  hint,
}) => {
  const zones = useMemo(() => value ?? [], [value]);
  const zonesRef = useRef<InterventionZoneDTO[]>(zones);
  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  const [mode, setMode] = useState<DraftMode>('idle');
  const [draftCoords, setDraftCoords] = useState<InterventionZoneLatLng[]>([]);
  const [draftCircle, setDraftCircle] = useState<{
    center: InterventionZoneLatLng;
    radius: number;
  } | null>(null);
  const [draftRect, setDraftRect] = useState<{
    first: InterventionZoneLatLng;
    second?: InterventionZoneLatLng;
  } | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialCenter: [number, number] = zones[0]?.coordinates[0]
    ? [zones[0].coordinates[0].lat, zones[0].coordinates[0].lng]
    : defaultCenter;

  // ---------------------------------------------------------------------------
  // Persistance zone + reverse-geocode
  // ---------------------------------------------------------------------------
  const emit = (next: InterventionZoneDTO[]) => {
    zonesRef.current = next;
    onChange?.(next);
  };

  const enrichWithReverseGeocode = async (
    zone: InterventionZoneDTO,
  ): Promise<InterventionZoneDTO> => {
    const center =
      zone.type === 'polygon' && zone.coordinates.length >= 3
        ? zone.coordinates.reduce(
            (acc, p, _i, arr) => ({
              lat: acc.lat + p.lat / arr.length,
              lng: acc.lng + p.lng / arr.length,
            }),
            { lat: 0, lng: 0 },
          )
        : zone.coordinates[0];
    if (!center) return zone;
    try {
      const results = await getGeocodingService().reverseGeocode(center.lat, center.lng);
      const r = results?.[0];
      if (!r) return zone;
      return {
        ...zone,
        address: zone.address ?? r.address,
        regionCode: zone.regionCode ?? (r.type === 'region' ? r.metadata?.code : undefined),
        cityCode: zone.cityCode ?? (r.type === 'city' ? r.metadata?.code : undefined),
        geocodingMeta: {
          provider: 'openstreetmap',
          confidence: r.confidence,
          displayName: r.address,
          placeId: (r as unknown as { placeId?: string | number }).placeId,
          geocodedAt: new Date().toISOString(),
        },
      };
    } catch {
      return zone;
    }
  };

  const commitZone = async (zone: InterventionZoneDTO) => {
    const provisional = [...zonesRef.current, zone];
    const insertedIndex = provisional.length - 1;
    console.info('[GeoZoneEditor] commit zone', {
      index: insertedIndex,
      type: zone.type,
      vertices: zone.coordinates.length,
      radiusMeters: zone.radiusMeters,
      areaSqm: zone.areaSqm,
    });
    emit(provisional);

    const enriched = await enrichWithReverseGeocode(zone);
    if (enriched === zone) return;
    const next = zonesRef.current.slice();
    if (next[insertedIndex]) next[insertedIndex] = enriched;
    else next.push(enriched);
    console.info('[GeoZoneEditor] zone enriched (reverse-geocode)', {
      index: insertedIndex,
      address: enriched.address,
      regionCode: enriched.regionCode,
      cityCode: enriched.cityCode,
    });
    emit(next);
  };

  // ---------------------------------------------------------------------------
  // Interactions carte
  // ---------------------------------------------------------------------------
  const handleMapClick = (latlng: InterventionZoneLatLng) => {
    if (readOnly) return;
    if (mode === 'polygon') {
      setDraftCoords((prev) => [...prev, latlng]);
    } else if (mode === 'rectangle') {
      if (!draftRect) setDraftRect({ first: latlng });
      else setDraftRect({ ...draftRect, second: latlng });
    } else if (mode === 'circle' && !draftCircle) {
      setDraftCircle({ center: latlng, radius: 1000 });
    } else if (mode === 'point') {
      void commitZone({
        type: 'point',
        coordinates: [latlng],
        label: draftLabel || `Point ${zones.length + 1}`,
      });
      setDraftLabel('');
      setMode('idle');
    }
  };

  const finishPolygon = () => {
    if (draftCoords.length < 3) return;
    void commitZone({
      type: 'polygon',
      coordinates: draftCoords,
      areaSqm: polygonAreaSqm(draftCoords),
      label: draftLabel || `Zone ${zones.length + 1}`,
    });
    setDraftCoords([]);
    setDraftLabel('');
    setMode('idle');
  };

  const finishRectangle = () => {
    if (!draftRect?.second) return;
    const { first, second } = draftRect;
    const coords: InterventionZoneLatLng[] = [
      { lat: first.lat, lng: first.lng },
      { lat: first.lat, lng: second.lng },
      { lat: second.lat, lng: second.lng },
      { lat: second.lat, lng: first.lng },
    ];
    void commitZone({
      type: 'rectangle',
      coordinates: coords,
      areaSqm: polygonAreaSqm(coords),
      label: draftLabel || `Zone ${zones.length + 1}`,
    });
    setDraftRect(null);
    setDraftLabel('');
    setMode('idle');
  };

  const finishCircle = () => {
    if (!draftCircle) return;
    void commitZone({
      type: 'circle',
      coordinates: [draftCircle.center],
      radiusMeters: draftCircle.radius,
      areaSqm: circleAreaSqm(draftCircle.radius),
      label: draftLabel || `Zone ${zones.length + 1}`,
    });
    setDraftCircle(null);
    setDraftLabel('');
    setMode('idle');
  };

  const cancelDraft = () => {
    setDraftCoords([]);
    setDraftCircle(null);
    setDraftRect(null);
    setDraftLabel('');
    setMode('idle');
  };

  const removeZone = (idx: number) => emit(zones.filter((_, i) => i !== idx));

  // ---------------------------------------------------------------------------
  // GeoJSON import / export
  // ---------------------------------------------------------------------------
  const importGeoJSON = async (file: File) => {
    try {
      const text = await file.text();
      const root = JSON.parse(text) as GJRoot;
      const parsed = geojsonToZones(root);
      console.info('[GeoZoneEditor] geojson import', {
        file: file.name,
        parsedZones: parsed.length,
      });
      if (parsed.length === 0) {
        toast.error('GeoJSON invalide — aucune zone importée.');
        return;
      }
      const next = [...zonesRef.current, ...parsed];
      emit(next);
      toast.success(`${parsed.length} zone(s) importée(s).`);
      // Enrich in background.
      for (let i = 0; i < parsed.length; i++) {
        const idx = next.length - parsed.length + i;
        const enriched = await enrichWithReverseGeocode(parsed[i]);
        const arr = zonesRef.current.slice();
        arr[idx] = enriched;
        emit(arr);
      }
    } catch (err) {
      console.error('[GeoZoneEditor] geojson import failed', err);
      toast.error('Fichier GeoJSON illisible.');
    }
  };

  const exportGeoJSON = () => {
    const fc = zonesToGeojson(zones);
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zones-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    console.info('[GeoZoneEditor] geojson export', { zones: zones.length });
  };

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  const shapeIcon = (s: InterventionZoneShape) => {
    if (s === 'circle') return <CircleIcon className="h-3 w-3" />;
    if (s === 'point') return <MapPin className="h-3 w-3" />;
    if (s === 'rectangle') return <Square className="h-3 w-3" />;
    return <Hexagon className="h-3 w-3" />;
  };

  const totalArea = zones.reduce((s, z) => s + (z.areaSqm ?? 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {title ?? "Zones d'intervention"} ({zones.length})
            {totalArea > 0 && (
              <Badge variant="outline" className="text-xs">
                Total {formatArea(totalArea)}
              </Badge>
            )}
          </span>
          {hint && (
            <span className="text-xs font-normal text-muted-foreground">{hint}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Barre adresse (recherche + centrage) */}
        {!readOnly && showAddressBar && (
          <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-2">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs flex items-center gap-1 mb-1">
                <Search className="h-3 w-3" />
                Rechercher une adresse (base + Nominatim)
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <LocationAutocomplete
                    onChange={(text, locationData) => {
                      const coords = locationData?.coordinates;
                      if (coords) {
                        console.info('[GeoZoneEditor] address selected', {
                          text,
                          type: locationData?.type,
                          code: locationData?.code,
                          coords,
                        });
                        setFlyTarget([coords.lat, coords.lng]);
                      }
                    }}
                    placeholder="Ville, wilaya, région…"
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (flyTarget) {
                      void commitZone({
                        type: 'point',
                        coordinates: [{ lat: flyTarget[0], lng: flyTarget[1] }],
                        label: `Point ${zones.length + 1}`,
                      });
                    } else {
                      toast.info('Sélectionnez d\'abord une adresse.');
                    }
                  }}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" /> Ajouter comme point
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar dessin + import/export */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'idle' ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setMode('polygon')}>
                  <Hexagon className="h-3.5 w-3.5 mr-1" /> Polygone
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMode('rectangle')}>
                  <Square className="h-3.5 w-3.5 mr-1" /> Rectangle
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMode('circle')}>
                  <CircleIcon className="h-3.5 w-3.5 mr-1" /> Cercle
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMode('point')}>
                  <MapPin className="h-3.5 w-3.5 mr-1" /> Point
                </Button>
                <span className="mx-1 h-5 w-px bg-border" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-1" /> Importer GeoJSON
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importGeoJSON(f);
                    if (e.target) e.target.value = '';
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportGeoJSON}
                  disabled={zones.length === 0}
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Exporter
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="capitalize">
                  <Pencil className="h-3 w-3 mr-1" /> Mode {mode}
                </Badge>
                <Input
                  placeholder="Libellé (optionnel)"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  className="h-8 w-40"
                />
                {mode === 'polygon' && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {draftCoords.length} sommet(s) — double-clic pour terminer
                    </span>
                    <Button size="sm" onClick={finishPolygon} disabled={draftCoords.length < 3}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Terminer
                    </Button>
                  </>
                )}
                {mode === 'rectangle' && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {!draftRect
                        ? 'Cliquez pour le 1er coin'
                        : !draftRect.second
                        ? 'Cliquez pour le coin opposé'
                        : 'Coins définis'}
                    </span>
                    <Button
                      size="sm"
                      onClick={finishRectangle}
                      disabled={!draftRect?.second}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Terminer
                    </Button>
                  </>
                )}
                {mode === 'circle' && (
                  <>
                    {draftCircle ? (
                      <>
                        <Label className="text-xs">Rayon (m)</Label>
                        <Input
                          type="number"
                          min={50}
                          value={draftCircle.radius}
                          onChange={(e) =>
                            setDraftCircle({
                              ...draftCircle,
                              radius: Math.max(1, Number(e.target.value) || 0),
                            })
                          }
                          className="h-8 w-24"
                        />
                        <Button size="sm" onClick={finishCircle}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Terminer
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Cliquez pour placer le centre
                      </span>
                    )}
                  </>
                )}
                {mode === 'point' && (
                  <span className="text-xs text-muted-foreground">
                    Cliquez sur la carte
                  </span>
                )}
                <Button size="sm" variant="ghost" onClick={cancelDraft}>
                  <X className="h-3.5 w-3.5 mr-1" /> Annuler
                </Button>
              </>
            )}
          </div>
        )}

        {/* Carte */}
        <div
          className="rounded-md overflow-hidden border"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          <MapContainer
            center={initialCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            doubleClickZoom={mode !== 'polygon'}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {!readOnly && (
              <ClickCapture
                onClick={handleMapClick}
                onDoubleClick={mode === 'polygon' ? finishPolygon : undefined}
              />
            )}
            <FlyTo target={flyTarget} zoom={12} />

            {zones.map((z, idx) => {
              if (z.type === 'circle' && z.coordinates[0]) {
                return (
                  <Circle
                    key={`z-${idx}`}
                    center={[z.coordinates[0].lat, z.coordinates[0].lng]}
                    radius={z.radiusMeters ?? 500}
                    pathOptions={{ color: '#2563eb', fillOpacity: 0.2 }}
                  >
                    <Popup>
                      <strong>{z.label ?? `Zone ${idx + 1}`}</strong>
                      <br />
                      cercle · rayon {z.radiusMeters ?? 0} m
                      {z.address ? (
                        <>
                          <br />
                          {z.address}
                        </>
                      ) : null}
                    </Popup>
                  </Circle>
                );
              }
              if (z.type === 'point' && z.coordinates[0]) {
                return (
                  <Marker
                    key={`z-${idx}`}
                    position={[z.coordinates[0].lat, z.coordinates[0].lng]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <strong>{z.label ?? `Point ${idx + 1}`}</strong>
                      {z.address ? (
                        <>
                          <br />
                          {z.address}
                        </>
                      ) : null}
                    </Popup>
                  </Marker>
                );
              }
              if (z.coordinates.length >= 3) {
                return (
                  <Polygon
                    key={`z-${idx}`}
                    positions={z.coordinates.map(
                      (c) => [c.lat, c.lng] as [number, number],
                    )}
                    pathOptions={{
                      color: z.type === 'rectangle' ? '#7c3aed' : '#10b981',
                      fillOpacity: 0.2,
                    }}
                  >
                    <Popup>
                      <strong>{z.label ?? `Zone ${idx + 1}`}</strong>
                      <br />
                      {z.type} · {z.coordinates.length} sommets
                      {z.areaSqm ? (
                        <>
                          <br />
                          {formatArea(z.areaSqm)}
                        </>
                      ) : null}
                      {z.address ? (
                        <>
                          <br />
                          {z.address}
                        </>
                      ) : null}
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            })}

            {/* Brouillons */}
            {!readOnly && mode === 'polygon' && draftCoords.length >= 2 && (
              <Polyline
                positions={[
                  ...draftCoords.map((c) => [c.lat, c.lng] as [number, number]),
                  ...(draftCoords.length >= 3
                    ? [[draftCoords[0].lat, draftCoords[0].lng] as [number, number]]
                    : []),
                ]}
                pathOptions={{ color: '#f59e0b', dashArray: '4 6' }}
              />
            )}
            {!readOnly &&
              mode === 'polygon' &&
              draftCoords.map((c, i) => (
                <Marker key={`d-${i}`} position={[c.lat, c.lng]} icon={markerIcon} />
              ))}
            {!readOnly && mode === 'circle' && draftCircle && (
              <Circle
                center={[draftCircle.center.lat, draftCircle.center.lng]}
                radius={draftCircle.radius}
                pathOptions={{ color: '#f59e0b', dashArray: '4 6', fillOpacity: 0.1 }}
              />
            )}
            {!readOnly && mode === 'rectangle' && draftRect?.first && draftRect?.second && (
              <Polygon
                positions={[
                  [draftRect.first.lat, draftRect.first.lng],
                  [draftRect.first.lat, draftRect.second.lng],
                  [draftRect.second.lat, draftRect.second.lng],
                  [draftRect.second.lat, draftRect.first.lng],
                ]}
                pathOptions={{ color: '#f59e0b', dashArray: '4 6', fillOpacity: 0.1 }}
              />
            )}
          </MapContainer>
        </div>

        {/* Liste */}
        {zones.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {readOnly
              ? 'Aucune zone définie pour cet élément.'
              : "Aucune zone. Dessinez, importez un GeoJSON ou recherchez une adresse."}
          </p>
        ) : (
          <ul className="space-y-1">
            {zones.map((z, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge variant="outline" className="gap-1">
                    {shapeIcon(z.type)} {z.type}
                  </Badge>
                  <span className="truncate font-medium">
                    {z.label ?? `Zone ${idx + 1}`}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {z.type === 'circle'
                      ? `r=${z.radiusMeters ?? 0}m`
                      : z.type === 'point'
                      ? `${z.coordinates[0]?.lat.toFixed(4)}, ${z.coordinates[0]?.lng.toFixed(4)}`
                      : `${z.coordinates.length} sommets`}
                  </span>
                  {z.areaSqm ? (
                    <span className="text-xs text-muted-foreground shrink-0">
                      · {formatArea(z.areaSqm)}
                    </span>
                  ) : null}
                  {z.address && (
                    <span className="text-xs text-muted-foreground truncate">
                      · {z.address}
                    </span>
                  )}
                </div>
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeZone(idx)}
                    className="h-7 w-7 p-0"
                    aria-label="Supprimer la zone"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default GeoZoneEditor;
