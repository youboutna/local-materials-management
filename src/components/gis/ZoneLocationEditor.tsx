/**
 * ZoneLocationEditor — édition d'une zone géo existante (multi-formes).
 *
 * Ouvert depuis la liste des zones dans `GeoZoneEditor` via un bouton crayon.
 * Aucun appel Supabase : mute la zone puis remonte au parent qui persiste.
 */
import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Check, X } from 'lucide-react';
import AddressSearchBox, { type AddressSelection } from '@/components/gis/AddressSearchBox';
import type {
  InterventionZoneDTO,
  InterventionZoneLatLng,
} from '@/dtos/entities/InterventionZoneDTO';

interface ZoneLocationEditorProps {
  open: boolean;
  zone: InterventionZoneDTO | null;
  index: number;
  onClose: () => void;
  onSave: (index: number, next: InterventionZoneDTO) => void;
}

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const EARTH_R = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

function polygonAreaSqm(coords: InterventionZoneLatLng[]): number {
  if (coords.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    total +=
      toRad(p2.lng - p1.lng) *
      (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }
  return Math.abs((total * EARTH_R * EARTH_R) / 2);
}

function circleAreaSqm(radius: number): number {
  return Math.PI * radius * radius;
}

function centroid(coords: InterventionZoneLatLng[]): InterventionZoneLatLng | null {
  if (coords.length === 0) return null;
  const sum = coords.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / coords.length, lng: sum.lng / coords.length };
}

const ZoneLocationEditor: React.FC<ZoneLocationEditorProps> = ({
  open,
  zone,
  index,
  onClose,
  onSave,
}) => {
  const [label, setLabel] = useState(zone?.label ?? '');
  const [address, setAddress] = useState(zone?.address ?? '');
  const [coords, setCoords] = useState<InterventionZoneLatLng[]>(
    zone?.coordinates ?? [],
  );
  const [radius, setRadius] = useState<number>(zone?.radiusMeters ?? 500);

  // Reset when zone changes
  React.useEffect(() => {
    if (zone) {
      setLabel(zone.label ?? '');
      setAddress(zone.address ?? '');
      setCoords(zone.coordinates ?? []);
      setRadius(zone.radiusMeters ?? 500);
    }
  }, [zone]);

  const center = useMemo(() => centroid(coords), [coords]);

  if (!zone) return null;

  const applyAddress = (sel: AddressSelection) => {
    const newLabel = label || sel.label;
    const newAddress = sel.address ?? sel.label;
    const newCenter: InterventionZoneLatLng = { lat: sel.lat, lng: sel.lng };

    if (zone.type === 'point' || zone.type === 'circle') {
      setCoords([newCenter]);
    } else if (zone.type === 'rectangle' || zone.type === 'polygon') {
      // Translate all vertices around new centroid, keep shape.
      const c = center;
      if (c && coords.length > 0) {
        const dLat = newCenter.lat - c.lat;
        const dLng = newCenter.lng - c.lng;
        setCoords(coords.map((p) => ({ lat: p.lat + dLat, lng: p.lng + dLng })));
      } else {
        setCoords([newCenter]);
      }
    }
    setAddress(newAddress);
    if (!label) setLabel(newLabel);
  };

  const updateCoord = (i: number, field: 'lat' | 'lng', v: string) => {
    const n = num(v);
    if (n === undefined) return;
    const next = coords.slice();
    next[i] = { ...next[i], [field]: n };
    setCoords(next);
  };

  const canSave = coords.length > 0 && coords.every((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));

  const handleSave = () => {
    if (!canSave) return;
    let areaSqm = zone.areaSqm;
    if (zone.type === 'circle') areaSqm = circleAreaSqm(radius);
    else if (zone.type === 'polygon' || zone.type === 'rectangle')
      areaSqm = polygonAreaSqm(coords);

    const next: InterventionZoneDTO = {
      ...zone,
      label: label || zone.label,
      address: address || undefined,
      coordinates: coords,
      radiusMeters: zone.type === 'circle' ? radius : zone.radiusMeters,
      areaSqm,
    };
    console.info('[ZoneLocationEditor] edit', { idx: index, before: zone, after: next });
    onSave(index, next);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Éditer la localisation
            <Badge variant="outline" className="capitalize">
              {zone.type}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Libellé</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nom de la zone"
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">
              Rechercher / changer l'adresse (base + Nominatim)
            </Label>
            <AddressSearchBox
              initialQuery={address}
              onSelect={applyAddress}
              placeholder="Chercher une nouvelle adresse ou saisir manuellement…"
            />
            {address && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                Adresse actuelle : {address}
              </p>
            )}
          </div>

          {/* Géométrie par forme */}
          {zone.type === 'point' && coords[0] && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={coords[0].lat}
                  onChange={(e) => updateCoord(0, 'lat', e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={coords[0].lng}
                  onChange={(e) => updateCoord(0, 'lng', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {zone.type === 'circle' && coords[0] && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Centre — Lat</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={coords[0].lat}
                  onChange={(e) => updateCoord(0, 'lat', e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Centre — Lng</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={coords[0].lng}
                  onChange={(e) => updateCoord(0, 'lng', e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Rayon (m)</Label>
                <Input
                  type="number"
                  min={1}
                  value={radius}
                  onChange={(e) => setRadius(Math.max(1, Number(e.target.value) || 0))}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {zone.type === 'rectangle' && coords.length >= 4 && (
            <div className="grid grid-cols-2 gap-2">
              {[0, 2].map((i) => (
                <React.Fragment key={i}>
                  <div>
                    <Label className="text-xs">Coin {i === 0 ? 'A' : 'B'} — Lat</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={coords[i].lat}
                      onChange={(e) => updateCoord(i, 'lat', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Coin {i === 0 ? 'A' : 'B'} — Lng</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={coords[i].lng}
                      onChange={(e) => updateCoord(i, 'lng', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </React.Fragment>
              ))}
              <p className="col-span-2 text-[11px] text-muted-foreground">
                Astuce : « Recherche adresse » recentre l'ensemble du rectangle
                autour du nouveau centre en gardant sa taille.
              </p>
            </div>
          )}

          {zone.type === 'polygon' && (
            <div className="rounded-md border p-2 bg-muted/20 text-xs text-muted-foreground">
              {coords.length} sommet(s). L'édition sommet-par-sommet se fait sur
              la carte. Ici, « Recherche adresse » translate tout le polygone
              autour du nouveau centre.
              {center && (
                <div className="mt-1">
                  Centroïde : {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Annuler
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            <Check className="h-4 w-4 mr-1" /> Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ZoneLocationEditor;
