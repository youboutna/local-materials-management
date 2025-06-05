
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polygon, Rectangle, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, Square, Circle as CircleIcon, Pencil } from 'lucide-react';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface InteractiveMapValue {
  center?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
  warehouseShape?: { lat: number; lng: number }[];
  address?: string;
}

interface InteractiveMapProps {
  value: InteractiveMapValue;
  onChange: (value: InteractiveMapValue) => void;
  title?: string;
  description?: string;
  allowPolygon?: boolean;
  allowCoordinateSelection?: boolean;
  allowWarehouseTracing?: boolean;
  className?: string;
}

type ShapeType = 'polygon' | 'rectangle' | 'circle';

// Map event handler component
const MapEventHandler: React.FC<{
  onMapClick: (latlng: L.LatLng) => void;
  onPolygonClick?: (latlng: L.LatLng) => void;
  mode: 'center' | 'polygon' | 'warehouse';
}> = ({ onMapClick, onPolygonClick, mode }) => {
  useMapEvents({
    click: (e) => {
      if (mode === 'polygon' && onPolygonClick) {
        onPolygonClick(e.latlng);
      } else {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

// Map center controller
const MapCenterController: React.FC<{ center?: { lat: number; lng: number } }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);

  return null;
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  value,
  onChange,
  title = "Carte Interactive",
  description = "Cliquez sur la carte pour définir les coordonnées",
  allowPolygon = false,
  allowCoordinateSelection = true,
  allowWarehouseTracing = false,
  className = ""
}) => {
  const [mode, setMode] = useState<'center' | 'polygon' | 'warehouse'>('center');
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPolygon, setTempPolygon] = useState<{ lat: number; lng: number }[]>([]);
  const [tempWarehouseShape, setTempWarehouseShape] = useState<{ lat: number; lng: number }[]>([]);
  const [warehouseShapeType, setWarehouseShapeType] = useState<ShapeType>('polygon');
  const [coordinates, setCoordinates] = useState({
    latitude: value.center?.lat?.toString() || '',
    longitude: value.center?.lng?.toString() || ''
  });

  const mapRef = useRef<L.Map | null>(null);

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    if (mode === 'center' && allowCoordinateSelection) {
      const newCenter = { lat: latlng.lat, lng: latlng.lng };
      setCoordinates({
        latitude: latlng.lat.toString(),
        longitude: latlng.lng.toString()
      });
      onChange({ ...value, center: newCenter });
    }
  }, [mode, allowCoordinateSelection, value, onChange]);

  const handlePolygonClick = useCallback((latlng: L.LatLng) => {
    if (mode === 'polygon' && allowPolygon && isDrawing) {
      const newPoint = { lat: latlng.lat, lng: latlng.lng };
      setTempPolygon(prev => [...prev, newPoint]);
    } else if (mode === 'warehouse' && allowWarehouseTracing && isDrawing) {
      const newPoint = { lat: latlng.lat, lng: latlng.lng };
      setTempWarehouseShape(prev => [...prev, newPoint]);
    }
  }, [mode, allowPolygon, allowWarehouseTracing, isDrawing]);

  const startDrawing = () => {
    setIsDrawing(true);
    if (mode === 'polygon') {
      setTempPolygon([]);
    } else if (mode === 'warehouse') {
      setTempWarehouseShape([]);
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    if (mode === 'polygon' && tempPolygon.length >= 3) {
      onChange({ ...value, polygon: tempPolygon });
      setTempPolygon([]);
    } else if (mode === 'warehouse' && tempWarehouseShape.length >= 3) {
      onChange({ ...value, warehouseShape: tempWarehouseShape });
      setTempWarehouseShape([]);
    }
  };

  const clearPolygon = () => {
    onChange({ ...value, polygon: undefined });
    setTempPolygon([]);
  };

  const clearWarehouseShape = () => {
    onChange({ ...value, warehouseShape: undefined });
    setTempWarehouseShape([]);
  };

  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    setCoordinates(prev => ({ ...prev, [field]: value }));
  };

  const applyCoordinates = () => {
    const lat = parseFloat(coordinates.latitude);
    const lng = parseFloat(coordinates.longitude);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      onChange({ ...value, center: { lat, lng } });
    }
  };

  // Render warehouse shape based on type
  const renderWarehouseShape = () => {
    if (!value.warehouseShape || value.warehouseShape.length === 0) return null;

    const positions = value.warehouseShape.map(point => [point.lat, point.lng] as [number, number]);
    
    if (warehouseShapeType === 'circle' && positions.length >= 1) {
      const center = positions[0];
      const radius = positions.length > 1 ? 
        Math.sqrt(Math.pow(positions[1][0] - center[0], 2) + Math.pow(positions[1][1] - center[1], 2)) * 111000 : 100;
      
      return (
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: '#e74c3c',
            weight: 3,
            fillColor: '#e74c3c',
            fillOpacity: 0.2
          }}
        />
      );
    } else if (warehouseShapeType === 'rectangle' && positions.length >= 2) {
      const bounds: [[number, number], [number, number]] = [positions[0], positions[1]];
      return (
        <Rectangle
          bounds={bounds}
          pathOptions={{
            color: '#e74c3c',
            weight: 3,
            fillColor: '#e74c3c',
            fillOpacity: 0.2
          }}
        />
      );
    } else if (positions.length >= 3) {
      return (
        <Polygon
          positions={positions}
          pathOptions={{
            color: '#e74c3c',
            weight: 3,
            fillColor: '#e74c3c',
            fillOpacity: 0.2
          }}
        />
      );
    }
    
    return null;
  };

  const defaultCenter: [number, number] = [20.5279, -10.0309]; // Mauritania center

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex items-center gap-2">
            {allowCoordinateSelection && (
              <Badge 
                variant={mode === 'center' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setMode('center')}
              >
                Centre
              </Badge>
            )}
            {allowPolygon && (
              <Badge 
                variant={mode === 'polygon' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setMode('polygon')}
              >
                Zone
              </Badge>
            )}
            {allowWarehouseTracing && (
              <Badge 
                variant={mode === 'warehouse' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setMode('warehouse')}
              >
                Entrepôt
              </Badge>
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coordinate inputs */}
        {allowCoordinateSelection && mode === 'center' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="20.5279"
                value={coordinates.latitude}
                onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-10.0309"
                value={coordinates.longitude}
                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={applyCoordinates} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        )}

        {/* Polygon controls */}
        {allowPolygon && mode === 'polygon' && (
          <div className="flex gap-2">
            <Button 
              onClick={startDrawing}
              disabled={isDrawing}
              variant={isDrawing ? "secondary" : "default"}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {isDrawing ? 'Tracé en cours...' : 'Tracer Zone'}
            </Button>
            {isDrawing && (
              <Button onClick={finishDrawing}>
                <Save className="w-4 h-4 mr-2" />
                Terminer
              </Button>
            )}
            {value.polygon && (
              <Button onClick={clearPolygon} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Effacer
              </Button>
            )}
          </div>
        )}

        {/* Warehouse controls */}
        {allowWarehouseTracing && mode === 'warehouse' && (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Select value={warehouseShapeType} onValueChange={(value: ShapeType) => setWarehouseShapeType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      Polygone
                    </div>
                  </SelectItem>
                  <SelectItem value="rectangle">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      Rectangle
                    </div>
                  </SelectItem>
                  <SelectItem value="circle">
                    <div className="flex items-center gap-2">
                      <CircleIcon className="w-4 h-4" />
                      Cercle
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={startDrawing}
                disabled={isDrawing}
                variant={isDrawing ? "secondary" : "default"}
              >
                <Pencil className="w-4 h-4 mr-2" />
                {isDrawing ? 'Tracé en cours...' : 'Tracer Entrepôt'}
              </Button>
              
              {isDrawing && (
                <Button onClick={finishDrawing}>
                  <Save className="w-4 h-4 mr-2" />
                  Terminer
                </Button>
              )}
              
              {value.warehouseShape && (
                <Button onClick={clearWarehouseShape} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Effacer
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="h-96 rounded-lg overflow-hidden border">
          <MapContainer
            center={value.center ? [value.center.lat, value.center.lng] : defaultCenter}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapCenterController center={value.center} />
            
            <MapEventHandler 
              onMapClick={handleMapClick}
              onPolygonClick={handlePolygonClick}
              mode={mode}
            />

            {/* Center marker */}
            {value.center && (
              <Marker position={[value.center.lat, value.center.lng]}>
                <Popup>
                  Centre sélectionné<br />
                  Lat: {value.center.lat.toFixed(4)}<br />
                  Lng: {value.center.lng.toFixed(4)}
                </Popup>
              </Marker>
            )}

            {/* Polygon */}
            {value.polygon && value.polygon.length >= 3 && (
              <Polygon
                positions={value.polygon.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 3,
                  fillColor: '#3b82f6',
                  fillOpacity: 0.2
                }}
              />
            )}

            {/* Temporary polygon */}
            {tempPolygon.length > 0 && (
              <Polygon
                positions={tempPolygon.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#f59e0b',
                  weight: 2,
                  fillColor: '#f59e0b',
                  fillOpacity: 0.1,
                  dashArray: '5, 5'
                }}
              />
            )}

            {/* Warehouse shape */}
            {renderWarehouseShape()}

            {/* Temporary warehouse shape */}
            {tempWarehouseShape.length > 0 && (
              <Polygon
                positions={tempWarehouseShape.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#ef4444',
                  weight: 2,
                  fillColor: '#ef4444',
                  fillOpacity: 0.1,
                  dashArray: '5, 5'
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Status information */}
        <div className="text-sm text-gray-600 space-y-1">
          {value.center && (
            <div>Centre: {value.center.lat.toFixed(4)}, {value.center.lng.toFixed(4)}</div>
          )}
          {value.polygon && (
            <div>Zone tracée: {value.polygon.length} points</div>
          )}
          {value.warehouseShape && (
            <div>Entrepôt tracé: {value.warehouseShape.length} points</div>
          )}
          {isDrawing && mode === 'polygon' && (
            <div className="text-blue-600">Cliquez pour ajouter des points à la zone. Cliquez sur "Terminer" quand vous avez fini.</div>
          )}
          {isDrawing && mode === 'warehouse' && (
            <div className="text-red-600">Cliquez pour tracer la forme de l'entrepôt. Cliquez sur "Terminer" quand vous avez fini.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
