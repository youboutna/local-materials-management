import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { geoJSON } from 'leaflet';
import type { FeatureCollection, Geometry } from 'geojson';

/** Fit imported project assets once their geometry changes, preserving subsequent user navigation. */
export default function InfraMapExtent({ geometries }: { geometries: Geometry[] }) {
  const map = useMap();
  const signature = JSON.stringify(geometries);
  useEffect(() => {
    const shapes: Geometry[] = JSON.parse(signature);
    if (!shapes.length) return;
    const collection: FeatureCollection = { type: 'FeatureCollection', features: shapes.map(geometry => ({ type: 'Feature', geometry, properties: {} })) };
    const bounds = geoJSON(collection as unknown as Parameters<typeof geoJSON>[0]).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17, animate: false });
  }, [map, signature]);
  return null;
}