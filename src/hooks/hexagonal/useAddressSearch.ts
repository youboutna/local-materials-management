/**
 * useAddressSearch — hook hexagonal d'auto-complétion d'adresses.
 *
 * Flux : UI → hook → GeocodingService (base MR + Nominatim).
 * Aucun appel réseau direct dans l'UI, aucun `supabase.from()`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { getGeocodingService } from '@/application/services/GeocodingServiceFactory';
import type { GeocodingResult } from '@/application/services/GeocodingService';
import { getGeocodingService } from '@/application/services/GeocodingService';

export interface AddressSuggestion {
  id: string;
  label: string;
  subtitle?: string;
  source: 'base' | 'nominatim';
  lat: number;
  lng: number;
  raw: GeocodingResult;
}

interface UseAddressSearchOptions {
  minLength?: number;
  debounceMs?: number;
  maxResults?: number;
}

interface UseAddressSearchState {
  results: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
}

const cache = new Map<string, AddressSuggestion[]>();

const toSuggestions = (results: GeocodingResult[]): AddressSuggestion[] =>
  results.map((r, idx) => {
    // Local (base) results carry `metadata.code` from MR referentials.
    const isBase = Boolean(r.metadata?.code) && r.type !== 'address';
    return {
      id: `${isBase ? 'base' : 'nom'}-${r.metadata?.code ?? idx}-${r.coordinates.lat.toFixed(4)}-${r.coordinates.lng.toFixed(4)}`,
      label: r.address,
      subtitle: [r.components?.city, r.components?.region, r.components?.country]
        .filter(Boolean)
        .join(' • '),
      source: isBase ? 'base' : 'nominatim',
      lat: r.coordinates.lat,
      lng: r.coordinates.lng,
      raw: r,
    };
  });

export const useAddressSearch = (
  query: string,
  { minLength = 3, debounceMs = 350, maxResults = 8 }: UseAddressSearchOptions = {},
): UseAddressSearchState => {
  const [state, setState] = useState<UseAddressSearchState>({
    results: [],
    isLoading: false,
    error: null,
    isEmpty: false,
  });

  const trimmed = query.trim();
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (trimmed.length < minLength) {
      setState({ results: [], isLoading: false, error: null, isEmpty: false });
      return;
    }

    // Cache hit.
    const cached = cache.get(trimmed.toLowerCase());
    if (cached) {
      setState({
        results: cached.slice(0, maxResults),
        isLoading: false,
        error: null,
        isEmpty: cached.length === 0,
      });
      return;
    }

    const currentReq = ++reqIdRef.current;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    const handle = setTimeout(async () => {
      try {
        const results = await getGeocodingService().geocode(trimmed);
        const suggestions = toSuggestions(results).slice(0, maxResults);
        cache.set(trimmed.toLowerCase(), suggestions);
        if (currentReq !== reqIdRef.current) return; // stale
        const base = suggestions.filter((s) => s.source === 'base').length;
        const nominatim = suggestions.length - base;
        console.info('[AddressSearch]', { query: trimmed, base, nominatim });
        setState({
          results: suggestions,
          isLoading: false,
          error: null,
          isEmpty: suggestions.length === 0,
        });
      } catch (err) {
        if (currentReq !== reqIdRef.current) return;
        const message = err instanceof Error ? err.message : 'Erreur de recherche';
        console.warn('[AddressSearch] error', message);
        setState({ results: [], isLoading: false, error: message, isEmpty: true });
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [trimmed, minLength, debounceMs, maxResults]);

  return useMemo(() => state, [state]);
};

export default useAddressSearch;
