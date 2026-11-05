import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { geoJSON } from 'leaflet';
import type { Geometry } from 'geojson';

/** Fit imported project assets once their geometry changes, preserving subsequent user navigation. */
export default function InfraMapExtent({ geometries }: { geometries: Geometry[] }) {
  const map = useMap();
  const signature = JSON.stringify(geometries);
  useEffect(() => {
    const shapes: Geometry[] = JSON.parse(signature);
    if (!shapes.length) return;
    const bounds = geoJSON({ type: 'FeatureCollection', features: shapes.map(geometry => ({ type: 'Feature', geometry, properties: {} })) }).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17, animate: false });
  }, [map, signature]);
  return null;
}