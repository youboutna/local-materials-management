/**
 * InterventionZonesPicker
 *
 * Éditeur Leaflet multi-zones pour un projet.
 * Permet de dessiner plusieurs polygones et/ou cercles (zones non nécessairement
 * disjointes) représentant les zones bénéficiaires d'intervention.
 *
 * Distinction explicite avec l'adresse du projet :
 *  - L'adresse du projet (siège équipe / siège social) reste un champ texte simple,
 *    saisi ailleurs dans le formulaire.
 *  - Ces zones sont les surfaces géographiques où le projet est déployé.
 *
 * Sortie : `InterventionZoneDTO[]` via `onChange`.
 *
 * Implémentation volontairement légère (pas de `leaflet-draw`) : on utilise
 * react-leaflet et un mode d'édition par clics successifs.
 */
import React, { useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Circle,
  Polyline,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, MapPin, Plus, Check, X, Pencil, Circle as CircleIcon, Hexagon } from 'lucide-react';
import type {
  InterventionZoneDTO,
  InterventionZoneLatLng,
  InterventionZoneShape,
} from '@/dtos/entities/InterventionZoneDTO';
import { getGeocodingService } from '@/application/services/GeocodingServiceFactory';
import { toast } from 'sonner';

// Marqueur Leaflet par défaut.
const markerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- Calculs géométriques (degrés → m²) -------------------------------------
const EARTH_R = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

function polygonAreaSqm(coords: InterventionZoneLatLng[]): number {
  if (coords.length < 3) return 0;
  // Formule de l'aire sphérique (Lambert).
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

function circleAreaSqm(radiusMeters: number): number {
  return Math.PI * radiusMeters * radiusMeters;
}

function formatArea(sqm: number): string {
  if (sqm >= 1_000_000) return `${(sqm / 1_000_000).toFixed(2)} km²`;
  if (sqm >= 10_000) return `${(sqm / 10_000).toFixed(2)} ha`;
  return `${Math.round(sqm)} m²`;
}

// --- Capture des clics sur la carte -----------------------------------------
const ClickCapture: React.FC<{ onClick: (latlng: InterventionZoneLatLng) => void }> = ({
  onClick,
}) => {
  useMapEvents({
    click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

// --- Props ------------------------------------------------------------------
export interface InterventionZonesPickerProps {
  value?: InterventionZoneDTO[];
  onChange: (zones: InterventionZoneDTO[]) => void;
  /** Centre initial si aucune zone. Défaut : Nouakchott. */
  defaultCenter?: [number, number];
  defaultZoom?: number;
  height?: number | string;
}

type DraftMode = 'idle' | 'polygon' | 'circle' | 'point';

const InterventionZonesPicker: React.FC<InterventionZonesPickerProps> = ({
  value,
  onChange,
  defaultCenter = [18.0735, -15.9582], // Nouakchott
  defaultZoom = 6,
  height = 460,
}) => {
  const zones = useMemo(() => value ?? [], [value]);
  const [mode, setMode] = useState<DraftMode>('idle');
  const [draftCoords, setDraftCoords] = useState<InterventionZoneLatLng[]>([]);
  const [draftCircle, setDraftCircle] = useState<{
    center: InterventionZoneLatLng;
    radius: number;
  } | null>(null);
  const [draftLabel, setDraftLabel] = useState('');

  const initialCenter: [number, number] = zones[0]?.coordinates[0]
    ? [zones[0].coordinates[0].lat, zones[0].coordinates[0].lng]
    : defaultCenter;

  /**
   * Reverse-geocode the zone center via the singleton GeocodingService
   * and merge address + Mauritania region/city codes + provider metadata.
   * Best-effort — silently ignored on failure (the zone stays usable).
   */
  const enrichWithReverseGeocode = async (
    zone: InterventionZoneDTO,
  ): Promise<InterventionZoneDTO> => {
    const center = zone.coordinates[0];
    if (!center) return zone;
    try {
      const results = await getGeocodingService().reverseGeocode(center.lat, center.lng);
      const r = results?.[0];
      if (!r) return zone;
      return {
        ...zone,
        address: zone.address ?? r.address,
        regionCode:
          zone.regionCode ?? (r.type === 'region' ? r.metadata?.code : undefined),
        cityCode:
          zone.cityCode ?? (r.type === 'city' ? r.metadata?.code : undefined),
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
    // Append immediately for snappy UX, then patch with geocoding result.
    const provisional = [...zones, zone];
    onChange(provisional);
    const enriched = await enrichWithReverseGeocode(zone);
    if (enriched !== zone) {
      onChange([...zones, enriched]);
      if (enriched.address) {
        toast.success(`📍 Zone géolocalisée : ${enriched.address}`);
      }
    }
  };

  const handleMapClick = (latlng: InterventionZoneLatLng) => {
    if (mode === 'polygon') {
      setDraftCoords((prev) => [...prev, latlng]);
    } else if (mode === 'circle' && !draftCircle) {
      setDraftCircle({ center: latlng, radius: 1000 });
    } else if (mode === 'point') {
      const z: InterventionZoneDTO = {
        type: 'point',
        coordinates: [latlng],
        label: draftLabel || `Point ${zones.length + 1}`,
      };
      void commitZone(z);
      setDraftLabel('');
      setMode('idle');
    }
  };

  const finishPolygon = () => {
    if (draftCoords.length < 3) return;
    const areaSqm = polygonAreaSqm(draftCoords);
    const z: InterventionZoneDTO = {
      type: 'polygon',
      coordinates: draftCoords,
      areaSqm,
      label: draftLabel || `Zone ${zones.length + 1}`,
    };
    void commitZone(z);
    setDraftCoords([]);
    setDraftLabel('');
    setMode('idle');
  };

  const finishCircle = () => {
    if (!draftCircle) return;
    const z: InterventionZoneDTO = {
      type: 'circle',
      coordinates: [draftCircle.center],
      radiusMeters: draftCircle.radius,
      areaSqm: circleAreaSqm(draftCircle.radius),
      label: draftLabel || `Zone ${zones.length + 1}`,
    };
    void commitZone(z);
    setDraftCircle(null);
    setDraftLabel('');
    setMode('idle');
  };

  const cancelDraft = () => {
    setDraftCoords([]);
    setDraftCircle(null);
    setDraftLabel('');
    setMode('idle');
  };

  const removeZone = (idx: number) => {
    onChange(zones.filter((_, i) => i !== idx));
  };

  const shapeIcon = (s: InterventionZoneShape) => {
    if (s === 'circle') return <CircleIcon className="h-3 w-3" />;
    if (s === 'point') return <MapPin className="h-3 w-3" />;
    return <Hexagon className="h-3 w-3" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Zones d'intervention ({zones.length})
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            Distinctes de l'adresse du projet — un projet peut couvrir plusieurs zones.
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'idle' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setMode('polygon')}>
                <Hexagon className="h-3.5 w-3.5 mr-1" /> Polygone
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode('circle')}>
                <CircleIcon className="h-3.5 w-3.5 mr-1" /> Cercle
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode('point')}>
                <MapPin className="h-3.5 w-3.5 mr-1" /> Point
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
                    {draftCoords.length} sommet(s) — cliquez sur la carte
                  </span>
                  <Button size="sm" onClick={finishPolygon} disabled={draftCoords.length < 3}>
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
                      Cliquez sur la carte pour placer le centre
                    </span>
                  )}
                </>
              )}
              {mode === 'point' && (
                <span className="text-xs text-muted-foreground">
                  Cliquez sur la carte pour placer le point
                </span>
              )}
              <Button size="sm" variant="ghost" onClick={cancelDraft}>
                <X className="h-3.5 w-3.5 mr-1" /> Annuler
              </Button>
            </>
          )}
        </div>

        {/* Carte */}
        <div
          className="rounded-md overflow-hidden border"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          <MapContainer
            center={initialCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickCapture onClick={handleMapClick} />

            {/* Zones existantes */}
            {zones.map((z, idx) => {
              if (z.type === 'circle' && z.coordinates[0]) {
                return (
                  <Circle
                    key={`z-${idx}`}
                    center={[z.coordinates[0].lat, z.coordinates[0].lng]}
                    radius={z.radiusMeters ?? 500}
                    pathOptions={{ color: '#2563eb', fillOpacity: 0.2 }}
                  />
                );
              }
              if (z.type === 'point' && z.coordinates[0]) {
                return (
                  <Marker
                    key={`z-${idx}`}
                    position={[z.coordinates[0].lat, z.coordinates[0].lng]}
                    icon={markerIcon}
                  />
                );
              }
              if (z.coordinates.length >= 3) {
                return (
                  <Polygon
                    key={`z-${idx}`}
                    positions={z.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
                    pathOptions={{ color: '#10b981', fillOpacity: 0.2 }}
                  />
                );
              }
              return null;
            })}

            {/* Brouillon polygone */}
            {mode === 'polygon' && draftCoords.length > 0 && (
              <Polyline
                positions={draftCoords.map((c) => [c.lat, c.lng] as [number, number])}
                pathOptions={{ color: '#f59e0b', dashArray: '4 6' }}
              />
            )}
            {mode === 'polygon' &&
              draftCoords.map((c, i) => (
                <Marker key={`d-${i}`} position={[c.lat, c.lng]} icon={markerIcon} />
              ))}

            {/* Brouillon cercle */}
            {mode === 'circle' && draftCircle && (
              <Circle
                center={[draftCircle.center.lat, draftCircle.center.lng]}
                radius={draftCircle.radius}
                pathOptions={{ color: '#f59e0b', dashArray: '4 6', fillOpacity: 0.1 }}
              />
            )}
          </MapContainer>
        </div>

        {/* Liste des zones */}
        {zones.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Aucune zone définie. Utilisez les boutons ci-dessus pour en ajouter.
          </p>
        ) : (
          <ul className="space-y-1">
            {zones.map((z, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="gap-1">
                    {shapeIcon(z.type)} {z.type}
                  </Badge>
                  <span className="truncate font-medium">
                    {z.label ?? `Zone ${idx + 1}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {z.type === 'circle'
                      ? `r=${z.radiusMeters ?? 0}m`
                      : z.type === 'point'
                      ? `${z.coordinates[0]?.lat.toFixed(4)}, ${z.coordinates[0]?.lng.toFixed(4)}`
                      : `${z.coordinates.length} sommets`}
                  </span>
                  {z.areaSqm ? (
                    <span className="text-xs text-muted-foreground">
                      · {formatArea(z.areaSqm)}
                    </span>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeZone(idx)}
                  className="h-7 w-7 p-0"
                  aria-label="Supprimer la zone"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default InterventionZonesPicker;
