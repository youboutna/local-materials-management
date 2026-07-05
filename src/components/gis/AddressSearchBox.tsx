/**
 * AddressSearchBox — recherche d'adresse (base MR + Nominatim) avec fallback
 * en saisie manuelle (libellé + lat/lng) quand aucune source ne renvoie de
 * résultat.
 *
 * Utilisé par `GeoZoneEditor` (barre du haut) et `ZoneLocationEditor`
 * (édition d'une zone existante). Ne touche jamais à Supabase — délègue au
 * hook hexagonal `useAddressSearch`.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Pencil, X, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAddressSearch,
  type AddressSuggestion,
} from '@/hooks/hexagonal/useAddressSearch';

export interface AddressSelection {
  label: string;
  address?: string;
  lat: number;
  lng: number;
  source: 'base' | 'nominatim' | 'manual';
  meta?: AddressSuggestion['raw'];
}

interface AddressSearchBoxProps {
  onSelect: (selection: AddressSelection) => void;
  placeholder?: string;
  initialQuery?: string;
  minLength?: number;
  className?: string;
  /** Permet d'ouvrir directement le mode manuel (utile en édition). */
  allowManual?: boolean;
}

const isFiniteNum = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n);

const AddressSearchBox: React.FC<AddressSearchBoxProps> = ({
  onSelect,
  placeholder = 'Ville, wilaya, rue, adresse…',
  initialQuery = '',
  minLength = 3,
  className,
  allowManual = true,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [manual, setManual] = useState(false);
  const [manualLabel, setManualLabel] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading, isEmpty, error } = useAddressSearch(query, {
    minLength,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commitSuggestion = (s: AddressSuggestion) => {
    onSelect({
      label: s.label,
      address: s.label,
      lat: s.lat,
      lng: s.lng,
      source: s.source,
      meta: s.raw,
    });
    setQuery(s.label);
    setOpen(false);
    setHighlight(-1);
  };

  const openManual = () => {
    setManual(true);
    setManualLabel(query || '');
  };

  const commitManual = () => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (!isFiniteNum(lat) || !isFiniteNum(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    onSelect({
      label: manualLabel || `Point ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      address: manualLabel || undefined,
      lat,
      lng,
      source: 'manual',
    });
    setManual(false);
    setManualLabel('');
    setManualLat('');
    setManualLng('');
    setQuery('');
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' && allowManual) {
        e.preventDefault();
        openManual();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => Math.min(results.length - 1, h + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlight >= 0 && results[highlight]) commitSuggestion(results[highlight]);
        else if (allowManual) openManual();
        break;
      case 'Escape':
        setOpen(false);
        setHighlight(-1);
        break;
    }
  };

  const showDropdown = open && query.trim().length >= minLength && !manual;

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => query.trim().length >= minLength && setOpen(true)}
          onKeyDown={handleKey}
          className="pl-10 pr-10"
          autoComplete="off"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <ul
            className="bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-72 overflow-auto"
            role="listbox"
          >
            {results.map((s, i) => (
              <li
                key={s.id}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitSuggestion(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'px-3 py-2 cursor-pointer border-b border-border/40 last:border-b-0',
                  i === highlight ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.label}</div>
                    {s.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {s.subtitle}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                    </div>
                  </div>
                  <Badge
                    variant={s.source === 'base' ? 'secondary' : 'outline'}
                    className="text-[10px] shrink-0"
                  >
                    {s.source === 'base' ? 'Base' : 'Nominatim'}
                  </Badge>
                </div>
              </li>
            ))}

            {results.length === 0 && !isLoading && (
              <li className="px-3 py-3 text-sm text-muted-foreground">
                {error ? (
                  <span className="text-destructive">{error}</span>
                ) : isEmpty ? (
                  'Aucun résultat dans la base ni via Nominatim.'
                ) : (
                  'Tapez pour rechercher…'
                )}
                {allowManual && (
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onMouseDown={(e) => { e.preventDefault(); openManual(); }}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Saisir manuellement
                    </Button>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      )}

      {manual && (
        <div className="mt-2 rounded-md border bg-muted/30 p-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Saisie manuelle de la position
            </Label>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => setManual(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-3">
              <Label className="text-[11px]">Libellé / adresse</Label>
              <Input
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                placeholder="Ex. Chantier RN2 PK 45"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-[11px]">Latitude</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="18.0735"
                className="h-8"
                step="0.0001"
              />
            </div>
            <div>
              <Label className="text-[11px]">Longitude</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="-15.9582"
                className="h-8"
                step="0.0001"
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                className="h-8 w-full"
                onClick={commitManual}
                disabled={
                  !isFiniteNum(Number(manualLat)) || !isFiniteNum(Number(manualLng))
                }
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Utiliser cette position
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Les coordonnées manuelles sont conservées telles quelles.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressSearchBox;
