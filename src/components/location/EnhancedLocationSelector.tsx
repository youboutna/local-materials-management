/**
 * EnhancedLocationSelector — alias rétro-compatible.
 *
 * Délègue intégralement à `UnifiedLocationSelector`, source unique pour la
 * sélection géospatiale (search + coordonnées + GPS + carte).
 * Conformément à `ARCHITECTURE_REFERENTIELS.md` / `PROMPTS.md` Rule #4 :
 * pas de duplication de logique de localisation.
 */

import React from 'react';
import UnifiedLocationSelector from './UnifiedLocationSelector';
import { LocationDTO } from '@/dtos/shared';

interface EnhancedLocationSelectorProps {
  value?: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
  };
  onChange: (location: {
    address?: string;
    latitude?: number;
    longitude?: number;
    regionCode?: string;
    cityCode?: string;
    locationData?: LocationDTO;
  }) => void;
  className?: string;
  showCoordinates?: boolean;
  showGPS?: boolean;
  allowManualEntry?: boolean;
}

const EnhancedLocationSelector: React.FC<EnhancedLocationSelectorProps> = ({
  value,
  onChange,
  className,
  showCoordinates = true,
  showGPS = true,
  allowManualEntry = true,
}) => {
  return (
    <UnifiedLocationSelector
      value={value}
      onChange={(loc) => {
        console.info('[EnhancedLocationSelector] change', loc);
        onChange({
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          regionCode: loc.regionCode,
          cityCode: loc.cityCode,
          // legacy field retained for callers expecting LocationDTO shape
          locationData: loc.locationData
            ? ({
                name: loc.locationData.address,
                code: (loc.locationData.metadata as { code?: string } | undefined)?.code ?? '',
                type: loc.locationData.type as 'region' | 'city',
                coordinates: loc.locationData.coordinates,
              } as unknown as LocationDTO)
            : undefined,
        });
      }}
      className={className}
      showCoordinates={showCoordinates}
      showGPS={showGPS}
      allowManualEntry={allowManualEntry}
      showMap={true}
    />
  );
};

export default EnhancedLocationSelector;
