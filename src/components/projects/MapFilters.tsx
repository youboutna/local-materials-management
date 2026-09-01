import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MapLocation } from '@/domain/entities/Location';
import { MapPin, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import { T } from '@/components/i18n/T';

interface MapFiltersProps {
  locations: MapLocation[];
  onFilterChange: (filteredLocations: MapLocation[]) => void;
}

const MapFilters = ({ locations, onFilterChange }: MapFiltersProps) => {
  const { translateStatus, translateGeo, geoRegionOptionsFrom, matchesRegion, formatLocationLabel } = useI18n();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Codes de statut présents (libellés résolus par référentiel)
  const availableStatuses = useMemo(
    () => Array.from(new Set(locations.map(l => l.status).filter(Boolean))) as string[],
    [locations],
  );

  // Wilayas présentes, résolues par code technique depuis n'importe quel champ
  const regionOptions = useMemo(
    () => geoRegionOptionsFrom(locations as unknown as Record<string, unknown>[]),
    [locations, geoRegionOptionsFrom],
  );

  const filteredLocations = useMemo(() => {
    return locations.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (regionFilter !== 'all' && !matchesRegion(item as unknown as Record<string, unknown>, regionFilter)) return false;
      return true;
    });
  }, [locations, statusFilter, regionFilter, matchesRegion]);

  useEffect(() => {
    onFilterChange(filteredLocations);
  }, [filteredLocations, onFilterChange]);

  const statusDotClass = (status: string) => {
    const code = status.toLowerCase();
    if (code.includes('cours')) return 'bg-blue-500';
    if (code.includes('termin') || code.includes('completed')) return 'bg-success';
    if (code.includes('attente') || code.includes('pending')) return 'bg-yellow-500';
    if (code.includes('inspect')) return 'bg-purple-500';
    if (code.includes('suspend')) return 'bg-orange-500';
    if (code.includes('annul') || code.includes('cancel')) return 'bg-destructive';
    return 'bg-muted-foreground';
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium"><T k="auto.mapfilters.filtres_de_la_carte" fallback="Filtres de la carte" /></h3>
          <Badge variant="secondary" className="ml-auto">
            {filteredLocations.length} / {locations.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium">
              <T k="auto.mapfilters.statut_du_projet" fallback="Statut du projet" />
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <T k="auto.mapfilters.tous_les_statuts" fallback="Tous les statuts" />
                </SelectItem>
                {availableStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusDotClass(status)}`} />
                      {translateStatus(status)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wilaya (code technique + libellé multilingue) */}
          <div className="space-y-2">
            <Label htmlFor="region-filter" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-success" />
              <T k="auto.mapfilters.region_wilaya" fallback="Wilaya" />
            </Label>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger id="region-filter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">
                  <T k="auto.mapfilters.toutes_les_regions" fallback="Toutes les wilayas" />
                </SelectItem>
                {regionOptions.map(option => (
                  <SelectItem key={option.code} value={option.code}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {option.secondaryLabel && (
                        <span className="text-xs text-muted-foreground">{option.secondaryLabel}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Résultats */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              <T k="auto.mapfilters.resultats" fallback="Résultats" />
            </Label>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-foreground">{filteredLocations.length}</div>
              <div className="text-xs text-muted-foreground">
                {regionFilter !== 'all'
                  ? `${translateGeo(regionFilter)} · ${translateGeo('MR')}`
                  : translateGeo('MR')}
              </div>
            </div>
          </div>
        </div>

        {(statusFilter !== 'all' || regionFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              <T k="auto.mapfilters.filtres_actifs" fallback="Filtres actifs:" />
            </span>
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {translateStatus(statusFilter)}
                <button onClick={() => setStatusFilter('all')} className="ml-1 rounded-full px-1 hover:bg-muted">×</button>
              </Badge>
            )}
            {regionFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {translateGeo(regionFilter)}
                <button onClick={() => setRegionFilter('all')} className="ml-1 rounded-full px-1 hover:bg-muted">×</button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => { setStatusFilter('all'); setRegionFilter('all'); }}
            >
              <T k="auto.mapfilters.reinitialiser" fallback="Réinitialiser" />
            </Button>
          </div>
        )}

        {filteredLocations.length === 1 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {formatLocationLabel(filteredLocations[0] as unknown as Record<string, unknown>)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MapFilters;
