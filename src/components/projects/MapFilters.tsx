import React, { useState, useEffect, useMemo } from 'react';
import { MapLocation } from '@/domain/entities/Location';
import { useI18n } from '@/hooks/useI18n';
import { useLanguage } from '@/contexts/LanguageContext';
import CompactFilterBar, { CompactFilterField } from '@/components/common/CompactFilterBar';

interface MapFiltersProps {
  locations: MapLocation[];
  onFilterChange: (filteredLocations: MapLocation[]) => void;
}

/**
 * Filtres de la carte — barre compacte (une ligne) pour garder la carte et la
 * liste des résultats visibles sans scroller.
 */
const MapFilters = ({ locations, onFilterChange }: MapFiltersProps) => {
  const { translateStatus, translateGeo, geoRegionOptionsFrom, matchesRegion } = useI18n();
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Codes de statut présents (libellés résolus par référentiel)
  const availableStatuses = useMemo(
    () => Array.from(new Set(locations.map((l) => l.status).filter(Boolean))) as string[],
    [locations],
  );

  // Wilayas présentes, résolues par code technique depuis n'importe quel champ
  const regionOptions = useMemo(
    () => geoRegionOptionsFrom(locations as unknown as Record<string, unknown>[]),
    [locations, geoRegionOptionsFrom],
  );

  const filteredLocations = useMemo(() => {
    return locations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (regionFilter !== 'all' && !matchesRegion(item as unknown as Record<string, unknown>, regionFilter))
        return false;
      return true;
    });
  }, [locations, statusFilter, regionFilter, matchesRegion]);

  useEffect(() => {
    onFilterChange(filteredLocations);
  }, [filteredLocations, onFilterChange]);

  const filters: CompactFilterField[] = [
    {
      key: 'status',
      label: t('auto.mapfilters.statut_du_projet'),
      placeholder: t('auto.mapfilters.tous_les_statuts'),
      allLabel: t('auto.mapfilters.tous_les_statuts'),
      value: statusFilter,
      onChange: setStatusFilter,
      options: availableStatuses.map((status) => ({ value: status, label: translateStatus(status) })),
    },
    {
      key: 'region',
      label: t('auto.mapfilters.region_wilaya'),
      placeholder: t('auto.mapfilters.toutes_les_regions'),
      allLabel: t('auto.mapfilters.toutes_les_regions'),
      value: regionFilter,
      onChange: setRegionFilter,
      options: regionOptions.map((option) => ({
        value: option.code,
        label: option.label,
        secondaryLabel: option.secondaryLabel,
      })),
    },
  ];

  return (
    <CompactFilterBar
      title={t('auto.mapfilters.filtres_de_la_carte')}
      filters={filters}
      onReset={() => {
        setStatusFilter('all');
        setRegionFilter('all');
      }}
      resultCount={filteredLocations.length}
      totalCount={locations.length}
      trailing={
        <span className="hidden md:inline">
          {regionFilter !== 'all' ? `${translateGeo(regionFilter)} · ${translateGeo('MR')}` : translateGeo('MR')}
        </span>
      }
      className="mb-3"
    />
  );
};

export default MapFilters;
