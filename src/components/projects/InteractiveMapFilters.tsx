import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Filter, MapPin, DollarSign, Target } from 'lucide-react';
import { ProjectData } from '@/dtos/entities/ProjectDTO';
import { getProjectCoordinates } from '@/utils/projectLocationBuckets';
import { useI18n } from '@/hooks/useI18n';
import { T } from '@/components/i18n/T';

interface InteractiveMapFiltersProps {
  projects: ProjectData[];
  onFiltersChange: (filteredProjects: ProjectData[]) => void;
}

const LAT_BOUNDS: [number, number] = [10, 30];
const LNG_BOUNDS: [number, number] = [-25, 0];

const InteractiveMapFilters: React.FC<InteractiveMapFiltersProps> = ({
  projects,
  onFiltersChange
}) => {
  const { translateStatus, translateGeo, geoRegionOptionsFrom, matchesRegion } = useI18n();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [budgetRange, setBudgetRange] = useState<[number, number] | null>(null);
  const [gpsLatRange, setGpsLatRange] = useState<[number, number]>(LAT_BOUNDS);
  const [gpsLngRange, setGpsLngRange] = useState<[number, number]>(LNG_BOUNDS);

  // Statuts disponibles = codes techniques, libellés résolus par référentiel
  const availableStatuses = useMemo(
    () => Array.from(new Set(projects.map(p => p.status).filter(Boolean))) as string[],
    [projects],
  );

  // Wilayas réellement représentées (codes techniques uniques)
  const regionOptions = useMemo(
    () => geoRegionOptionsFrom(projects as unknown as Record<string, unknown>[]),
    [projects, geoRegionOptionsFrom],
  );

  const budgets = useMemo(() => projects.map(p => p.budget ?? 0), [projects]);
  const minBudget = budgets.length ? Math.min(...budgets) : 0;
  const maxBudget = budgets.length ? Math.max(...budgets) : 0;
  const effectiveBudget: [number, number] = budgetRange ?? [minBudget, maxBudget];

  const applyFilters = useCallback(() => {
    const filtered = projects.filter(project => {
      // Filtre wilaya : comparaison par code technique (jamais par libellé)
      if (selectedRegion !== 'all' && !matchesRegion(project as unknown as Record<string, unknown>, selectedRegion)) {
        return false;
      }

      if (selectedStatus !== 'all' && project.status !== selectedStatus) {
        return false;
      }

      const budget = project.budget ?? 0;
      if (budget < effectiveBudget[0] || budget > effectiveBudget[1]) {
        return false;
      }

      const coords = getProjectCoordinates(project);
      if (coords) {
        if (
          coords.latitude < gpsLatRange[0] ||
          coords.latitude > gpsLatRange[1] ||
          coords.longitude < gpsLngRange[0] ||
          coords.longitude > gpsLngRange[1]
        ) {
          return false;
        }
      }

      return true;
    });
    onFiltersChange(filtered);
  }, [
    projects,
    selectedRegion,
    selectedStatus,
    effectiveBudget,
    gpsLatRange,
    gpsLngRange,
    matchesRegion,
    onFiltersChange,
  ]);

  const resetFilters = () => {
    setSelectedRegion('all');
    setSelectedStatus('all');
    setBudgetRange(null);
    setGpsLatRange(LAT_BOUNDS);
    setGpsLngRange(LNG_BOUNDS);
  };

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <Card className="bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <T k="auto.interactivemapfilters.filtres_carte_interactive" fallback="Filtres Carte Interactive" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Wilaya */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <T k="auto.interactivemapfilters.region" fallback="Wilaya" />
            </Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all"><T k="auto.interactivemapfilters.toutes_les_regions" fallback="Toutes les wilayas" /></SelectItem>
                {regionOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    <span className="flex items-center gap-2">
                      <span>{option.label}</span>
                      {option.secondaryLabel && (
                        <span className="text-xs text-muted-foreground">{option.secondaryLabel}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label><T k="auto.interactivemapfilters.statut" fallback="Statut" /></Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><T k="auto.interactivemapfilters.tous_les_statuts" fallback="Tous les statuts" /></SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {translateStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <T k="auto.interactivemapfilters.budget_mru" fallback="Budget (MRU)" />
            </Label>
            <div className="px-2">
              <Slider
                value={effectiveBudget}
                onValueChange={(value) => setBudgetRange(value as [number, number])}
                min={minBudget}
                max={Math.max(maxBudget, minBudget + 1)}
                step={Math.max(1, Math.round((maxBudget - minBudget) / 100) || 1)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{(effectiveBudget[0] / 1_000_000).toFixed(1)}M</span>
                <span>{(effectiveBudget[1] / 1_000_000).toFixed(1)}M</span>
              </div>
            </div>
          </div>

          {/* Reset */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button variant="outline" onClick={resetFilters} className="w-full">
              <T k="auto.interactivemapfilters.reinitialiser" fallback="Réinitialiser" />
            </Button>
          </div>
        </div>

        {/* Coordonnées GPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Latitude ({gpsLatRange[0].toFixed(2)}° → {gpsLatRange[1].toFixed(2)}°)
            </Label>
            <div className="px-2">
              <Slider
                value={gpsLatRange}
                onValueChange={(value) => setGpsLatRange(value as [number, number])}
                min={LAT_BOUNDS[0]}
                max={LAT_BOUNDS[1]}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Longitude ({gpsLngRange[0].toFixed(2)}° → {gpsLngRange[1].toFixed(2)}°)
            </Label>
            <div className="px-2">
              <Slider
                value={gpsLngRange}
                onValueChange={(value) => setGpsLngRange(value as [number, number])}
                min={LNG_BOUNDS[0]}
                max={LNG_BOUNDS[1]}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {selectedRegion !== 'all' && (
          <p className="text-xs text-muted-foreground">
            {translateGeo(selectedRegion)} · {translateGeo('MR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMapFilters;
