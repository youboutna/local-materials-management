/**
 * InterventionZonesPicker — alias rétro-compatible.
 * Toute la logique GIS vit désormais dans `GeoZoneEditor` (composant unifié
 * utilisé partout : projets, matériaux, détail, édition, création).
 */
import React from 'react';
import GeoZoneEditor, { GeoZoneEditorProps } from '@/components/gis/GeoZoneEditor';

export type InterventionZonesPickerProps = GeoZoneEditorProps;

const InterventionZonesPicker: React.FC<InterventionZonesPickerProps> = (props) => (
  <GeoZoneEditor {...props} />
);

export default InterventionZonesPicker;
