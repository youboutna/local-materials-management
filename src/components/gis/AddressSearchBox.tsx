/**
 * AddressSearchBox — Recherche d'adresse avec fallback manuel
 * 
 * Architecture Hexagonale :
 * - Utilise le hook hexagonal `useAddressSearch` pour les données
 * - Ne touche jamais à Supabase directement
 * - Délègue la recherche au service de géocodage
 * - Gestion des états de chargement et d'erreur
 * - Mode manuel pour saisie directe des coordonnées
 * 
 * Utilisé par :
 * - GeoZoneEditor (barre de recherche)
 * - ZoneLocationEditor (édition de zone)
 * 
 * Sources de données :
 * - Base de données locale (Mauritanie)
 * - Nominatim (OpenStreetMap)
 * - Saisie manuelle
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

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sélection d'adresse complète
 * Contient toutes les informations nécessaires pour localiser un point
 */
export interface AddressSelection {
  /** Libellé affiché (nom du lieu) */
  label: string;
  /** Adresse complète */
  address?: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Source de la donnée */
  source: 'base' | 'nominatim' | 'manual';
  /** Métadonnées supplémentaires */
  meta?: AddressSuggestion['raw'];
}

/**
 * Props du composant AddressSearchBox
 */
interface AddressSearchBoxProps {
  /** Callback appelé lors de la sélection d'une adresse */
  onSelect: (selection: AddressSelection) => void;
  /** Texte placeholder du champ de recherche */
  placeholder?: string;
  /** Requête initiale */
  initialQuery?: string;
  /** Longueur minimale pour déclencher la recherche */
  minLength?: number;
  /** Classes CSS supplémentaires */
  className?: string;
  /** Autoriser la saisie manuelle des coordonnées */
  allowManual?: boolean;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Vérifie si une valeur est un nombre fini
 */
const isFiniteNum = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n);

/**
 * Valide les coordonnées
 */
const isValidCoordinates = (lat: number, lng: number): boolean => {
  return isFiniteNum(lat) && isFiniteNum(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AddressSearchBox: React.FC<AddressSearchBoxProps> = ({
  onSelect,
  placeholder = 'Ville, wilaya, rue, adresse…',
  initialQuery = '',
  minLength = 3,
  className,
  allowManual = true,
}) => {
  // ============ State ============
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [manual, setManual] = useState(false);
  const [manualLabel, setManualLabel] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // ============ Refs ============
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============ Hook hexagonal ============
  const { results, isLoading, isEmpty, error } = useAddressSearch(query, {
    minLength,
  });

  // ============ Effets ============
  // Fermer la liste lors d'un clic à l'extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mettre à jour la requête initiale (sans boucle : on ignore les valeurs identiques)
  useEffect(() => {
    setQuery((prev) => (prev === initialQuery ? prev : initialQuery));
  }, [initialQuery]);

  // ============ Handlers ============
  
  /**
   * Sélectionne une suggestion et notifie le parent
   */
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

  /**
   * Ouvre le mode de saisie manuelle
   */
  const openManual = () => {
    setManual(true);
    setManualLabel(query || '');
    setOpen(false);
  };

  /**
   * Valide et envoie la saisie manuelle
   */
  const commitManual = () => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    
    if (!isValidCoordinates(lat, lng)) {
      return;
    }
    
    onSelect({
      label: manualLabel || `Point ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      address: manualLabel || undefined,
      lat,
      lng,
      source: 'manual',
    });
    
    // Réinitialiser le mode manuel
    setManual(false);
    setManualLabel('');
    setManualLat('');
    setManualLng('');
    setQuery('');
    setOpen(false);
  };

  /**
   * Gestion des touches clavier
   */
  const handleKey = (e: React.KeyboardEvent) => {
    // Si la liste est fermée et que l'utilisateur appuie sur Entrée
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
        if (highlight >= 0 && results[highlight]) {
          commitSuggestion(results[highlight]);
        } else if (allowManual) {
          openManual();
        }
        break;
      case 'Escape':
        setOpen(false);
        setHighlight(-1);
        break;
    }
  };

  /**
   * Efface la recherche
   */
  const clearSearch = () => {
    setQuery('');
    setOpen(false);
    setHighlight(-1);
  };

  /**
   * Gère le changement de requête
   */
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    setHighlight(-1);
  };

  // ============ Rendu conditionnel ============
  const showDropdown = open && query.trim().length >= minLength && !manual;
  const hasManualCoords = isFiniteNum(Number(manualLat)) && isFiniteNum(Number(manualLng));

  // ============ Rendu ============
  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {/* Champ de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query.trim().length >= minLength && setOpen(true)}
          onKeyDown={handleKey}
          className="pl-10 pr-10"
          autoComplete="off"
          aria-label="Rechercher une adresse"
        />
        
        {/* Indicateur de chargement ou bouton d'effacement */}
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Liste des suggestions */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <ul
            className="bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-72 overflow-auto"
            role="listbox"
            aria-label="Suggestions d'adresses"
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
                  i === highlight ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
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
                    {s.source === 'base' ? 'Base MR' : 'Nominatim'}
                  </Badge>
                </div>
              </li>
            ))}

            {/* Message d'absence de résultat */}
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onMouseDown={(e) => { 
                        e.preventDefault(); 
                        openManual(); 
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> 
                      Saisir manuellement
                    </Button>
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Mode saisie manuelle */}
      {manual && (
        <div className="mt-2 rounded-md border bg-muted/30 p-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1">
              <Pencil className="h-3 w-3" /> 
              Saisie manuelle de la position
            </Label>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => setManual(false)}
              aria-label="Fermer la saisie manuelle"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-3">
              <Label className="text-[11px]" htmlFor="manual-label">
                Libellé / adresse
              </Label>
              <Input
                id="manual-label"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                placeholder="Ex. Chantier RN2 PK 45"
                className="h-8"
              />
            </div>
            
            <div>
              <Label className="text-[11px]" htmlFor="manual-lat">
                Latitude
              </Label>
              <Input
                id="manual-lat"
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
              <Label className="text-[11px]" htmlFor="manual-lng">
                Longitude
              </Label>
              <Input
                id="manual-lng"
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
                disabled={!hasManualCoords}
                aria-label="Utiliser cette position"
              >
                <Check className="h-3.5 w-3.5 mr-1" /> 
                Utiliser cette position
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> 
            Les coordonnées manuelles sont conservées telles quelles.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressSearchBox;