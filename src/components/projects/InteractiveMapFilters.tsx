import React, { useState, useCallback, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { ProjectData } from '@/dtos/entities/ProjectDTO';
import { getProjectCoordinates } from '@/utils/projectLocationBuckets';
import { useI18n } from '@/hooks/useI18n';
import { useLanguage } from '@/contexts/LanguageContext';
import CompactFilterBar, { CompactFilterField } from '@/components/common/CompactFilterBar';

interface InteractiveMapFiltersProps {
  projects: ProjectData[];
  onFiltersChange: (filteredProjects: ProjectData[]) => void;
}

const LAT_BOUNDS: [number, number] = [10, 30];
const LNG_BOUNDS: [number, number] = [-25, 0];

/**
 * Filtres de la carte interactive — barre compacte : wilaya + statut en ligne,
 * budget et bornes GPS dans le tiroir « Avancé » pour ne pas repousser la carte.
 */
const InteractiveMapFilters: React.FC<InteractiveMapFiltersProps> = ({ projects, onFiltersChange }) => {
  const { translateStatus, translateGeo, geoRegionOptionsFrom, matchesRegion } = useI18n();
  const { t } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [budgetRange, setBudgetRange] = useState<[number, number] | null>(null);
  const [gpsLatRange, setGpsLatRange] = useState<[number, number]>(LAT_BOUNDS);
  const [gpsLngRange, setGpsLngRange] = useState<[number, number]>(LNG_BOUNDS);

  // Statuts disponibles = codes techniques, libellés résolus par référentiel
  const availableStatuses = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status).filter(Boolean))) as string[],
    [projects],
  );

  // Wilayas réellement représentées (codes techniques uniques)
  const regionOptions = useMemo(
    () => geoRegionOptionsFrom(projects as unknown as Record<string, unknown>[]),
    [projects, geoRegionOptionsFrom],
  );

  const budgets = useMemo(() => projects.map((p) => p.budget ?? 0), [projects]);
  const minBudget = budgets.length ? Math.min(...budgets) : 0;
  const maxBudget = budgets.length ? Math.max(...budgets) : 0;
  const effectiveBudget: [number, number] = budgetRange ?? [minBudget, maxBudget];

  const applyFilters = useCallback(() => {
    const filtered = projects.filter((project) => {
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

  const filters: CompactFilterField[] = [
    {
      key: 'region',
      label: t('auto.interactivemapfilters.region'),
      placeholder: t('auto.interactivemapfilters.toutes_les_regions'),
      allLabel: t('auto.interactivemapfilters.toutes_les_regions'),
      value: selectedRegion,
      onChange: setSelectedRegion,
      options: regionOptions.map((option) => ({
        value: option.code,
        label: option.label,
        secondaryLabel: option.secondaryLabel,
      })),
    },
    {
      key: 'status',
      label: t('auto.interactivemapfilters.statut'),
      placeholder: t('auto.interactivemapfilters.tous_les_statuts'),
      allLabel: t('auto.interactivemapfilters.tous_les_statuts'),
      value: selectedStatus,
      onChange: setSelectedStatus,
      options: availableStatuses.map((status) => ({ value: status, label: translateStatus(status) })),
    },
  ];

  const advancedActiveCount =
    (budgetRange ? 1 : 0) +
    (gpsLatRange[0] !== LAT_BOUNDS[0] || gpsLatRange[1] !== LAT_BOUNDS[1] ? 1 : 0) +
    (gpsLngRange[0] !== LNG_BOUNDS[0] || gpsLngRange[1] !== LNG_BOUNDS[1] ? 1 : 0);

  return (
    <CompactFilterBar
      title={t('auto.interactivemapfilters.filtres_carte_interactive')}
      filters={filters}
      onReset={resetFilters}
      resultCount={undefined}
      advancedActiveCount={advancedActiveCount}
      trailing={
        <span className="hidden md:inline">
          {selectedRegion !== 'all' ? `${translateGeo(selectedRegion)} · ${translateGeo('MR')}` : translateGeo('MR')}
        </span>
      }
      className="mb-3"
      advancedContent={
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{t('auto.interactivemapfilters.budget_mru')}</span>
              <span>
                {(effectiveBudget[0] / 1_000_000).toFixed(1)}M → {(effectiveBudget[1] / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <Slider
              value={effectiveBudget}
              onValueChange={(value) => setBudgetRange(value as [number, number])}
              min={minBudget}
              max={Math.max(maxBudget, minBudget + 1)}
              step={Math.max(1, Math.round((maxBudget - minBudget) / 100) || 1)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Latitude</span>
              <span>
                {gpsLatRange[0].toFixed(2)}° → {gpsLatRange[1].toFixed(2)}°
              </span>
            </div>
            <Slider
              value={gpsLatRange}
              onValueChange={(value) => setGpsLatRange(value as [number, number])}
              min={LAT_BOUNDS[0]}
              max={LAT_BOUNDS[1]}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Longitude</span>
              <span>
                {gpsLngRange[0].toFixed(2)}° → {gpsLngRange[1].toFixed(2)}°
              </span>
            </div>
            <Slider
              value={gpsLngRange}
              onValueChange={(value) => setGpsLngRange(value as [number, number])}
              min={LNG_BOUNDS[0]}
              max={LNG_BOUNDS[1]}
              step={0.1}
            />
          </div>
        </div>
      }
    />
  );
};

export default InteractiveMapFilters;
