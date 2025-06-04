import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Square,
  Navigation,
  Trash2,
  Target,
  Ruler,
  Move,
  RotateCcw,
  ClipboardCopy,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MAURITANIA_REGIONS, Region } from '@/types/mauritania';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Polygon, Polyline, Popup, Rectangle, Circle } from 'react-leaflet';
import { FeatureCollection } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAURITANIA_BOUNDS: [[number, number], [number, number]] = [
  [14.7159, -17.0665], // Southwest corner
  [27.2982, -4.8283]   // Northeast corner
];

interface Coordinate {
  lat: number;
  lng: number;
}

interface MapData {
  center?: Coordinate;
  polygon?: Coordinate[];
  address?: string;
}

interface InteractiveMapProps {
  value?: MapData;
  onChange: (data: MapData) => void;
  title?: string;
  description?: string;
  allowPolygon?: boolean;
  allowCoordinateSelection?: boolean;
  className?: string;
  regions?: Region[];
}

// Add this utility function near the top of the file
const calculateDistance = (point1: Coordinate, point2: Coordinate) => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Add this utility function
const calculatePolygonArea = (points: Coordinate[]) => {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].lng * points[j].lat;
    area -= points[j].lng * points[i].lat;
  }
  area = Math.abs(area) * 111.32 * 111.32 * Math.cos(points[0].lat * Math.PI / 180) / 2;
  return area;
};

// Add this utility function to calculate bounds for a set of points
const calculateBounds = (points: Coordinate[]): L.LatLngBounds => {
  if (points.length === 0) return L.latLngBounds(MAURITANIA_BOUNDS);
  
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  return L.latLngBounds([
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ]);
};

// Add the missing isWithinMauritania function
const isWithinMauritania = (lat: number, lng: number) => {
  return lat >= MAURITANIA_BOUNDS[0][0] && 
         lat <= MAURITANIA_BOUNDS[1][0] && 
         lng >= MAURITANIA_BOUNDS[0][1] && 
         lng <= MAURITANIA_BOUNDS[1][1];
};

// Update the MapController component to handle zoom better
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map.getBounds().contains(center)) {
      map.setView(center, zoom, {
        animate: true,
        duration: 1
      });
    } else {
      map.setZoom(zoom, {
        animate: true,
        duration: 0.5
      });
    }
  }, [map, center, zoom]);

  return null;
};

// Update the MapClickHandler component
const MapClickHandler = ({ 
  onMapClick,
  isSelectingCoordinate,
  isDrawing,
  isMeasuring,
  currentPolygon,
  onPolygonUpdate,
  onMeasurementUpdate,
  zoneShape,
  setRectangleBounds,
  setCircleCenter,
  setCircleRadius,
  drawingStep,
  setDrawingStep,
  rectangleBounds, // <-- add this
  circleCenter,    // <-- add this if needed
}: { 
  onMapClick: (lat: number, lng: number) => void;
  isSelectingCoordinate: boolean;
  isDrawing: boolean;
  isMeasuring: boolean;
  currentPolygon: Coordinate[];
  onPolygonUpdate: (points: Coordinate[]) => void;
  onMeasurementUpdate: (points: Coordinate[]) => void;
  zoneShape: 'polygon' | 'rectangle' | 'circle';
  setRectangleBounds: (bounds: [Coordinate, Coordinate] | null) => void;
  setCircleCenter: (center: Coordinate | null) => void;
  setCircleRadius: (radius: number) => void;
  drawingStep: number;
  setDrawingStep: (step: number) => void;
  rectangleBounds: [Coordinate, Coordinate] | null; // <-- add this
  circleCenter: Coordinate | null; // <-- add this if needed
}) => {
  const map = useMap();
  const currentZoomRef = useRef(map.getZoom());
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const coordsTooltipRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'coords-tooltip bg-white/90 px-2 py-1 rounded text-xs shadow-sm pointer-events-none fixed hidden z-[1000]';
    document.body.appendChild(tooltip);
    coordsTooltipRef.current = tooltip;

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const point = map.mouseEventToLatLng(e.originalEvent);
      const lat = parseFloat(point.lat.toFixed(6));
      const lng = parseFloat(point.lng.toFixed(6));
      setMouseCoords({ lat, lng });

      // Update tooltip position
      const containerPoint = map.latLngToContainerPoint([lat, lng]);
      const mapRect = map.getContainer().getBoundingClientRect();
      tooltip.style.left = `${mapRect.left + containerPoint.x + 10}px`;
      tooltip.style.top = `${mapRect.top + containerPoint.y - 20}px`;
      tooltip.innerHTML = `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`;
      tooltip.style.display = 'block';
    };

    const handleMouseOut = () => {
      setMouseCoords(null);
      if (coordsTooltipRef.current) {
        coordsTooltipRef.current.style.display = 'none';
      }
    };

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isDragging) return;
      const point = map.mouseEventToLatLng(e.originalEvent);
      const lat = parseFloat(point.lat.toFixed(6));
      const lng = parseFloat(point.lng.toFixed(6));

      if (!isWithinMauritania(lat, lng)) {
        toast({
          title: "Position invalide",
          description: "Veuillez sélectionner un point en Mauritanie",
          variant: "destructive"
        });
        return;
      }

      if (isDrawing) {
        if (zoneShape === 'polygon') {
          const newPolygon = [...currentPolygon, { lat, lng }];
          onPolygonUpdate(newPolygon);
        } else if (zoneShape === 'rectangle') {
          if (drawingStep === 0) {
            setRectangleBounds([{ lat, lng }, { lat, lng }]);
            setDrawingStep(1);
          } else if (drawingStep === 1 && rectangleBounds) {
            setRectangleBounds([rectangleBounds[0], { lat, lng }]);
            setDrawingStep(2);
            // Optionally, finish drawing here
          }
        } else if (zoneShape === 'circle') {
          if (drawingStep === 0) {
            setCircleCenter({ lat, lng });
            setDrawingStep(1);
          } else if (drawingStep === 1 && circleCenter) {
            const radius = map.distance([circleCenter.lat, circleCenter.lng], [lat, lng]);
            setCircleRadius(radius);
            setDrawingStep(2);
            // Optionally, finish drawing here
          }
        }
      }

      // ADD THIS LINE to always notify parent of click
      onMapClick(lat, lng);
    };

    // Update cursor styles based on mode
    const container = map.getContainer();
    if (isSelectingCoordinate) {
      container.style.cursor = 'pointer';
      map.dragging.disable();
      map.scrollWheelZoom.disable();
    } else if (isDrawing || isMeasuring) {
      container.style.cursor = 'crosshair';
      map.dragging.disable();
      map.scrollWheelZoom.enable();
    } else {
      container.style.cursor = 'grab';
      map.dragging.enable();
      map.scrollWheelZoom.enable();
    }

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);
    map.on('click', handleClick);
    map.on('dragstart', () => setIsDragging(true));
    map.on('dragend', () => setTimeout(() => setIsDragging(false), 50));

    // Lock the map view when in drawing/measuring mode
    if (isDrawing || isMeasuring) {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      
      // Fit bounds to current points if they exist
      if (currentPolygon.length > 0) {
        const bounds = calculateBounds(currentPolygon);
        const padding: L.PointTuple = [50, 50];
        map.fitBounds(bounds, { padding });
      }
    } else {
      map.dragging.enable();
      map.doubleClickZoom.enable();
    }

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
      map.off('click', handleClick);
      map.off('dragstart');
      map.off('dragend');
      container.style.cursor = 'grab';
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      if (coordsTooltipRef.current) {
        document.body.removeChild(coordsTooltipRef.current);
      }
    };
  }, [map, onMapClick, isSelectingCoordinate, isDrawing, isMeasuring, currentPolygon, zoneShape, drawingStep, rectangleBounds, circleCenter]);

  return null;
};

// Use a red marker icon for Position GPS
const redMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  value,
  onChange,
  title = "Localisation et zone",
  description = "Définissez la position GPS et tracez la zone si nécessaire",
  allowPolygon = true,
  allowCoordinateSelection = true,
  regions = MAURITANIA_REGIONS,
  className
}) => {
  const mapRef = useRef<L.Map>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSelectingCoordinate, setIsSelectingCoordinate] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<Coordinate[]>(value?.polygon || []);
  const [centerPoint, setCenterPoint] = useState<Coordinate | undefined>(value?.center);
  const [address, setAddress] = useState(value?.address || '');
  const [manualLat, setManualLat] = useState(value?.center?.lat?.toString() || '');
  const [manualLng, setManualLng] = useState(value?.center?.lng?.toString() || '');
  const [zoom, setZoom] = useState(1);
  const [measurementPoints, setMeasurementPoints] = useState<Coordinate[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const [zoneShape, setZoneShape] = useState<'polygon' | 'rectangle' | 'circle'>('polygon');
  const [rectangleBounds, setRectangleBounds] = useState<[Coordinate, Coordinate] | null>(null);
  const [circleCenter, setCircleCenter] = useState<Coordinate | null>(null);
  const [circleRadius, setCircleRadius] = useState<number>(0);
  const [drawingStep, setDrawingStep] = useState<number>(0); // for rectangle/circle steps

  const updateMapData = (updates: Partial<MapData>) => {
    const newData = {
      center: centerPoint,
      polygon: currentPolygon,
      address,
      ...updates
    };
    onChange(newData);
  };

  const handleRegionChange = (regionCode: string) => {
    const region = regions.find(r => r.code === regionCode) || null;
    setSelectedRegion(region);

    if (region) {
      const newCenter = { lat: region.lat, lng: region.lng };
      setCenterPoint(newCenter);
      setManualLat(region.lat.toFixed(6));
      setManualLng(region.lng.toFixed(6));
      updateMapData({ center: newCenter });
      setZoom(8);

      if (mapRef.current) {
        mapRef.current.setView([region.lat, region.lng], 8);
      }

      toast({
        title: `Région sélectionnée: ${region.name}`,
        description: `Centré sur ${region.name} (${region.lat.toFixed(6)}, ${region.lng.toFixed(6)})`
      });

      setIsSelectingCoordinate(true); // Force next click to refine
    }
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Erreur",
        description: "Coordonnées invalides",
        variant: "destructive"
      });
      return;
    }

    if (lat < MAURITANIA_BOUNDS[0][0] || lat > MAURITANIA_BOUNDS[1][0] || 
        lng < MAURITANIA_BOUNDS[0][1] || lng > MAURITANIA_BOUNDS[1][1]) {
      toast({
        title: "Erreur",
        description: "Les coordonnées doivent être en Mauritanie",
        variant: "destructive"
      });
      return;
    }

    const newCenter = { lat, lng };
    setCenterPoint(newCenter);
    updateMapData({ center: newCenter });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Erreur",
        description: "La géolocalisation n'est pas supportée par votre navigateur",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCenter = { lat: latitude, lng: longitude };
        setCenterPoint(newCenter);
        setManualLat(latitude.toFixed(6));
        setManualLng(longitude.toFixed(6));
        updateMapData({ center: newCenter });
        
        toast({
          title: "Position obtenue",
          description:  `Coordonnées: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'obtenir votre position",
          variant: "destructive"
        });
      }
    );
  };

  const resetView = () => {
    setZoom(1);
  };

  const clearMeasurements = () => {
    setMeasurementPoints([]);
    setIsMeasuring(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel current action
        setIsDrawing(false);
        setIsSelectingCoordinate(false);
        setIsMeasuring(false);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete last point in polygon or measurement
        if (isDrawing && currentPolygon.length > 0) {
          setCurrentPolygon(prev => prev.slice(0, -1));
        } else if (isMeasuring && measurementPoints.length > 0) {
          setMeasurementPoints(prev => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDrawing, isMeasuring, currentPolygon, measurementPoints]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Regions select */}
          {regions && regions.length > 0 && (
            <div>
              <Label htmlFor="region-select">Sélectionner une région</Label>
              <select
                id="region-select"
                value={selectedRegion?.code || ""}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Choisir une région --</option>
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name} ({region.nameAr})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Coordinate inputs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="-90.000000 à 90.000000"
                className={`text-sm font-mono ${isSelectingCoordinate ? 'bg-blue-50 border-blue-200' : ''}`}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="-180.000000 à 180.000000"
                className={`text-sm font-mono ${isSelectingCoordinate ? 'bg-blue-50 border-blue-200' : ''}`}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleManualCoordinates}
                className="flex-1 text-xs"
              >
                Appliquer
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={getCurrentLocation}
                size="icon"
                title="Ma position"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label>Zoom: {zoom.toFixed(1)}x</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newZoom = Math.min(18, zoom + 1);
                    setZoom(newZoom);
                    if (mapRef.current) {
                      mapRef.current.setZoom(newZoom, {
                        animate: true,
                        duration: 0.5
                      });
                    }
                  }}
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newZoom = Math.max(5, zoom - 1);
                    setZoom(newZoom);
                    if (mapRef.current) {
                      mapRef.current.setZoom(newZoom, {
                        animate: true,
                        duration: 0.5
                      });
                    }
                  }}
                >
                  -
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setZoom(8);
                    if (mapRef.current && centerPoint) {
                      mapRef.current.setView([centerPoint.lat, centerPoint.lng], 8, {
                        animate: true,
                        duration: 1
                      });
                    }
                  }}
                  title="Reset vue"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Address field */}
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                updateMapData({ address: e.target.value });
              }}
              placeholder="Adresse complète de l'entrepôt"
            />
          </div>

          {/* Map container */}
          <div className="relative border rounded-lg overflow-hidden bg-gray-100">
            <MapContainer
              ref={mapRef}
              center={[centerPoint?.lat || 18.0735, centerPoint?.lng || -15.9582]}
              zoom={zoom}
              className="h-64 w-full"
              zoomControl={false}
              attributionControl={false}
              maxBounds={MAURITANIA_BOUNDS}
              minZoom={5}
              maxZoom={18}
              boundsOptions={{ padding: [50, 50] }}
              doubleClickZoom={false}
              keyboard={false}
              whenReady={() => {
                if (mapRef.current) {
                  const map = mapRef.current;
                  map.on('zoomend', () => {
                    setZoom(map.getZoom());
                  });
                  map.on('moveend', () => {
                    const center = map.getCenter();
                    if (!isWithinMauritania(center.lat, center.lng)) {
                      map.panTo([18.0735, -15.9582]);
                    }
                  });
                }
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              <MapController 
                center={[centerPoint?.lat || 18.0735, centerPoint?.lng || -15.9582]}
                zoom={zoom}
              />

              <MapClickHandler 
                onMapClick={(lat, lng) => {
                  if (isSelectingCoordinate) {
                    setManualLat(lat.toFixed(6));
                    setManualLng(lng.toFixed(6));
                    setCenterPoint({ lat, lng });
                    updateMapData({ center: { lat, lng } });
                    setIsSelectingCoordinate(false);
                    toast({
                      title: "Coordonnées sélectionnées",
                      description: `Position: ${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`,
                      duration: 3000
                    });
                  }
                }}
                isSelectingCoordinate={isSelectingCoordinate}
                isDrawing={isDrawing}
                isMeasuring={isMeasuring}
                currentPolygon={currentPolygon}
                onPolygonUpdate={(points) => {
                  setCurrentPolygon(points);
                  updateMapData({ polygon: points });
                }}
                onMeasurementUpdate={(points) => {
                  setMeasurementPoints(points);
                }}
                zoneShape={zoneShape}
                setRectangleBounds={setRectangleBounds}
                setCircleCenter={setCircleCenter}
                setCircleRadius={setCircleRadius}
                drawingStep={drawingStep}
                setDrawingStep={setDrawingStep}
                rectangleBounds={rectangleBounds}
                circleCenter={circleCenter}
              />

              {/* Polygon */}
              {zoneShape === 'polygon' && currentPolygon.length > 0 && (
                <Polygon 
                  positions={currentPolygon.map(p => [p.lat, p.lng])}
                  pathOptions={{
                    color: '#2563eb', // blue-600
                    weight: 2,
                    fillColor: '#3b82f6', // blue-500
                    fillOpacity: 0.2
                  }}
                />
              )}
              {/* Rectangle */}
              {zoneShape === 'rectangle' && rectangleBounds && (
                <Rectangle
                  bounds={[
                    [rectangleBounds[0].lat, rectangleBounds[0].lng],
                    [rectangleBounds[1].lat, rectangleBounds[1].lng]
                  ]}
                  pathOptions={{
                    color: '#2563eb', // blue-600
                    weight: 2,
                    fillColor: '#3b82f6', // blue-500
                    fillOpacity: 0.2
                  }}
                />
              )}
              {/* Circle */}
              {zoneShape === 'circle' && circleCenter && circleRadius > 0 && (
                <Circle
                  center={[circleCenter.lat, circleCenter.lng]}
                  radius={circleRadius}
                  pathOptions={{
                    color: '#f59e42',
                    weight: 2,
                    fillColor: '#fde68a',
                    fillOpacity: 0.2
                  }}
                />
              )}

              {/* Show measurement lines */}
              {measurementPoints.length > 1 && (
                <Polyline
                  positions={measurementPoints.map(p => [p.lat, p.lng])}
                  pathOptions={{
                    color: '#f59e0b', // amber-500
                    weight: 3,
                    dashArray: '6 6'
                  }}
                />
              )}

              {/* Show selected point */}
              {centerPoint && (
                <Marker 
                  position={[centerPoint.lat, centerPoint.lng]}
                  icon={redMarkerIcon}
                />
              )}
              {selectedRegion && selectedRegion.geometry && (
                <GeoJSON 
                  data={selectedRegion.geometry}
                  style={{
                    color: '#2563eb', // blue-600
                    weight: 2,
                    fillColor: '#3b82f6', // blue-500
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </MapContainer>

            {/* Legend */}
            <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg text-xs w-auto">
              <h4 className="font-semibold mb-1.5">Légende</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Position GPS</span>
                </div>
                {allowPolygon && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500/30 border border-blue-500"></div>
                    <span>Zone tracée</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 bg-amber-500"></div>
                  <span>Mesures</span>
                </div>
                {selectedRegion && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500/20 border border-blue-600"></div>
                    <span>Région: {selectedRegion.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attribution */}
            <div className="absolute bottom-0 right-0 z-[1000] text-xs text-gray-500 bg-white/80 px-1">
              © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>
            </div>
          </div>

          {/* Map controls */}
          <div className="flex flex-wrap gap-2">
            {allowCoordinateSelection && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSelectingCoordinate(!isSelectingCoordinate);
                  setIsDrawing(false);
                  setIsMeasuring(false);
                }}
                className={ `flex items-center gap-2 text-xs ${isSelectingCoordinate ? 'bg-blue-100' : ''} `}
              >
                <Target className="h-4 w-4" />
                Sélectionner GPS
              </Button>
            )}
            {allowPolygon && (
              <>
                {!isDrawing ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDrawing(true);
                      setIsSelectingCoordinate(false);
                      setIsMeasuring(false);
                      setCurrentPolygon([]);
                      updateMapData({ polygon: [] });
                    }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Square className="h-4 w-4" />
                    Tracer zone
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDrawing(false);
                      if (currentPolygon.length < 3) {
                        toast({
                          title: "Zone incomplète",
                          description: "Au moins 3 points sont nécessaires",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="flex items-center gap-2 text-xs bg-green-100"
                  >
                    <Square className="h-4 w-4" />
                    Terminer zone
                  </Button>
                )}
                {(currentPolygon.length > 0 || rectangleBounds || circleCenter) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentPolygon([]);
                      setRectangleBounds(null);
                      setCircleCenter(null);
                      setCircleRadius(0);
                      setDrawingStep(0);
                      setIsDrawing(false);
                      updateMapData({ polygon: [] });
                    }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Trash2 className="h-4 w-4" />
                    Effacer zone
                  </Button>
                )}
              </>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsMeasuring(!isMeasuring);
                setIsDrawing(false);
                setIsSelectingCoordinate(false);
                if (!isMeasuring) {
                  setMeasurementPoints([]);
                }
              }}
              className={ `flex items-center gap-2 text-xs ${isMeasuring ? 'bg-amber-100' : ''} `}
            >
              <Ruler className="h-4 w-4" />
              Mesurer distance
            </Button>
            {measurementPoints.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={clearMeasurements}
                className="flex items-center gap-2 text-xs"
              >
                <Trash2 className="h-4 w-4" />
                Effacer mesures
              </Button>
            )}
            <div className="flex gap-2 items-center">
              <Label>Forme:</Label>
              <select
                value={zoneShape}
                onChange={e => {
                  setZoneShape(e.target.value as any);
                  setCurrentPolygon([]);
                  setRectangleBounds(null);
                  setCircleCenter(null);
                  setCircleRadius(0);
                  setDrawingStep(0);
                }}
                className="border rounded px-2 py-1 text-xs"
              >
                <option value="polygon">Polygone</option>
                <option value="rectangle">Rectangle</option>
                <option value="circle">Cercle</option>
              </select>
            </div>
          </div>

          {/* Summary section */}
          <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg">
            {centerPoint && (
              <div className="space-y-2 border-b pb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Position GPS:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border">
                      {centerPoint.lat.toFixed(6)}°N, {centerPoint.lng.toFixed(6)}°E
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(`${centerPoint.lat.toFixed(6)}, ${centerPoint.lng.toFixed(6)}`);
                        toast({ description: "Coordonnées copiées" });
                      }}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {selectedRegion && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Région:</span>
                    <span className="bg-blue-50 px-2 py-0.5 rounded-full text-blue-700">
                      {selectedRegion.name} ({selectedRegion.nameAr})
                    </span>
                  </div>
                )}
              </div>
            )}
            {currentPolygon.length > 0 && (
              <div className="space-y-2 border-b pb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Zone tracée:</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 px-2 py-0.5 rounded-full text-blue-700">
                      {currentPolygon.length} points
                    </span>
                    {currentPolygon.length >= 3 && (
                      <span className="bg-green-50 px-2 py-0.5 rounded-full text-green-700">
                        {calculatePolygonArea(currentPolygon).toFixed(2)} km²
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs grid grid-cols-2 gap-1">
                  {currentPolygon.map((point, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-1 rounded">
                      <span>Point {index + 1}:</span>
                      <span className="font-mono">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {measurementPoints.length > 1 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Mesures:</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-50 px-2 py-0.5 rounded-full text-amber-700">
                      {measurementPoints.length} points
                    </span>
                    <span className="bg-amber-50 px-2 py-0.5 rounded-full text-amber-700">
                      {measurementPoints.reduce((total, point, index) => {
                        if (index === 0) return 0;
                        return total + calculateDistance(measurementPoints[index - 1], point);
                      }, 0).toFixed(2)} km
                    </span>
                  </div>
                </div>
                <div className="text-xs grid grid-cols-1 gap-1">
                  {measurementPoints.map((point, index) => {
                    if (index === 0) return null;
                    const distance = calculateDistance(measurementPoints[index - 1], point);
                    return (
                      <div key={index} className="flex items-center justify-between bg-white p-1 rounded">
                        <span>Segment {index}:</span>
                        <span className="font-mono">{distance.toFixed(2)} km</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveMap;
