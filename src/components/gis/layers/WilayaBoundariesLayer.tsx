import { useLanguage } from '@/contexts/LanguageContext';
/**
 * WilayaBoundariesLayer — couche react-leaflet des frontières / limites administratives.
 *
 * Présentation uniquement : les données viennent du service applicatif
 * (`AdministrativeBoundaryService`) via `useAdministrativeBoundaries`, les couleurs
 * et libellés du référentiel `wilaya-boundaries.referential`.
 */
import React, { useMemo } from 'react';
import { GeoJSON, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { FeatureCollection } from 'geojson';
import { useAdministrativeBoundaries } from '@/hooks/gis/useAdministrativeBoundaries';

export interface WilayaBoundariesLayerProps {
  /** Active le rendu de la couche. */
  visible?: boolean;
  /** Affiche les libellés (nom FR) au centre de chaque wilaya. */
  showLabels?: boolean;
  /** Opacité du remplissage (0 = contours seuls). */
  fillOpacity?: number;
  /** Callback au clic sur une wilaya (code interne + nom FR). */
  onWilayaClick?: (code: string, nameFr: string) => void;
}

const WilayaBoundariesLayer: React.FC<WilayaBoundariesLayerProps> = ({
  visible = true,
  showLabels = true,
  fillOpacity = 0.12,
  onWilayaClick,
}) => {
  const { t } = useLanguage();
  const { boundaries } = useAdministrativeBoundaries(visible);

  const collections = useMemo(
    () =>
      boundaries.filter((boundary) => {
        const geometry = boundary.geometry;
        return Boolean(
          geometry &&
          (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') &&
          Array.isArray(geometry.coordinates) &&
          geometry.coordinates.length > 0,
        );
      }).map((boundary) => ({
        boundary,
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',

              properties: { id: boundary.featureId },
              geometry: boundary.geometry,
            },
          ],
        } as FeatureCollection,
      })),
    [boundaries],
  );

  if (!visible || collections.length === 0) return null;

  return (
    <>
      {collections.map(({ boundary, data }) => (
        <GeoJSON
          key={boundary.featureId}
          data={data}
          style={{
            color: boundary.color,
            weight: 2,
            fillColor: boundary.color,
            fillOpacity,
            dashArray: '3',
          }}
          eventHandlers={{
            click: () => onWilayaClick?.(boundary.code, boundary.nameFr),
            mouseover: (event) => {
              const layer = event.layer ?? event.target;
              layer.setStyle?.({ weight: 3, fillOpacity: fillOpacity + 0.15 });
            },
            mouseout: (event) => {
              const layer = event.layer ?? event.target;
              layer.setStyle?.({ weight: 2, fillOpacity });
            },
          }}
        >
          <Tooltip sticky>
            <span className="font-semibold">{boundary.nameAr}</span>
            <br />
            {boundary.nameFr}
          </Tooltip>
        </GeoJSON>
      ))}

      {showLabels &&
        collections.map(({ boundary }) => (
          <Marker
            key={`label-${boundary.featureId}`}
            position={[boundary.center.lat, boundary.center.lng]}
            interactive={false}
            icon={L.divIcon({
              className: 'wilaya-label',
              html: `<span style="color:${boundary.color}">${boundary.nameFr}</span>`,
              iconSize: [110, 18],
              iconAnchor: [55, 9],
            })}
          />
        ))}
    </>
  );
};

export default WilayaBoundariesLayer;
