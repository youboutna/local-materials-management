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
import { useLanguage } from "@/contexts/LanguageContext";
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
  warehouseShapeType?: ShapeType;
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
  isDrawing: boolean;
  warehouseShapeType: ShapeType;
}> = ({ onMapClick, onPolygonClick, mode, isDrawing, warehouseShapeType }) => {
  useMapEvents({
    click: (e) => {
      if (mode === 'polygon' && onPolygonClick && isDrawing) {
        onPolygonClick(e.latlng);
      } else if (mode === 'warehouse' && onPolygonClick && isDrawing) {
        onPolygonClick(e.latlng);
      } else if (mode === 'center') {
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
  title,
  description,
  allowPolygon = false,
  allowCoordinateSelection = true,
  allowWarehouseTracing = false,
  className = ""
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'center' | 'polygon' | 'warehouse'>('center');
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPolygon, setTempPolygon] = useState<{ lat: number; lng: number }[]>([]);
  const [tempWarehouseShape, setTempWarehouseShape] = useState<{ lat: number; lng: number }[]>([]);
  const [warehouseShapeType, setWarehouseShapeType] = useState<ShapeType>(value.warehouseShapeType || 'polygon');
  const [coordinates, setCoordinates] = useState({
    latitude: value.center?.lat?.toString() || '',
    longitude: value.center?.lng?.toString() || ''
  });

  const mapRef = useRef<L.Map | null>(null);

  // Update warehouse shape type when changed
  const handleShapeTypeChange = (newShapeType: ShapeType) => {
    setWarehouseShapeType(newShapeType);
    // Clear current warehouse shape when changing type
    setTempWarehouseShape([]);
    setIsDrawing(false);
    onChange({ 
      ...value, 
      warehouseShape: undefined,
      warehouseShapeType: newShapeType 
    });
  };

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
      
      if (warehouseShapeType === 'rectangle') {
        // For rectangle, we need only 2 points (diagonal corners)
        if (tempWarehouseShape.length === 0) {
          setTempWarehouseShape([newPoint]);
        } else if (tempWarehouseShape.length === 1) {
          setTempWarehouseShape([tempWarehouseShape[0], newPoint]);
          // Auto-finish for rectangle after 2 points
          setTimeout(() => finishDrawing(), 100);
        }
      } else if (warehouseShapeType === 'circle') {
        // For circle, we need 2 points (center and radius point)
        if (tempWarehouseShape.length === 0) {
          setTempWarehouseShape([newPoint]);
        } else if (tempWarehouseShape.length === 1) {
          setTempWarehouseShape([tempWarehouseShape[0], newPoint]);
          // Auto-finish for circle after 2 points
          setTimeout(() => finishDrawing(), 100);
        }
      } else {
        // For polygon, allow multiple points
        setTempWarehouseShape(prev => [...prev, newPoint]);
      }
    }
  }, [mode, allowPolygon, allowWarehouseTracing, isDrawing, warehouseShapeType, tempWarehouseShape]);

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
    } else if (mode === 'warehouse') {
      let isValidShape = false;
      
      if (warehouseShapeType === 'polygon' && tempWarehouseShape.length >= 3) {
        isValidShape = true;
      } else if ((warehouseShapeType === 'rectangle' || warehouseShapeType === 'circle') && tempWarehouseShape.length >= 2) {
        isValidShape = true;
      }
      
      if (isValidShape) {
        onChange({ 
          ...value, 
          warehouseShape: tempWarehouseShape,
          warehouseShapeType: warehouseShapeType
        });
        setTempWarehouseShape([]);
      }
    }
  };

  const clearPolygon = () => {
    onChange({ ...value, polygon: undefined });
    setTempPolygon([]);
  };

  const clearWarehouseShape = () => {
    onChange({ 
      ...value, 
      warehouseShape: undefined,
      warehouseShapeType: undefined
    });
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
    const currentShapeType = value.warehouseShapeType || warehouseShapeType;
    
    if (currentShapeType === 'circle' && positions.length >= 2) {
      const center = positions[0];
      const radiusPoint = positions[1];
      // Calculate radius in meters
      const radius = Math.sqrt(
        Math.pow((radiusPoint[0] - center[0]) * 111000, 2) + 
        Math.pow((radiusPoint[1] - center[1]) * 111000 * Math.cos(center[0] * Math.PI / 180), 2)
      );
      
      return (
        <Circle
          center={center}
          radius={Math.max(radius, 50)} // Minimum 50m radius
          pathOptions={{
            color: '#e74c3c',
            weight: 3,
            fillColor: '#e74c3c',
            fillOpacity: 0.2
          }}
        />
      );
    } else if (currentShapeType === 'rectangle' && positions.length >= 2) {
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

  // Render temporary warehouse shape
  const renderTempWarehouseShape = () => {
    if (tempWarehouseShape.length === 0) return null;

    const positions = tempWarehouseShape.map(p => [p.lat, p.lng] as [number, number]);
    
    if (warehouseShapeType === 'circle' && positions.length >= 2) {
      const center = positions[0];
      const radiusPoint = positions[1];
      const radius = Math.sqrt(
        Math.pow((radiusPoint[0] - center[0]) * 111000, 2) + 
        Math.pow((radiusPoint[1] - center[1]) * 111000 * Math.cos(center[0] * Math.PI / 180), 2)
      );
      
      return (
        <Circle
          center={center}
          radius={Math.max(radius, 50)}
          pathOptions={{
            color: '#ef4444',
            weight: 2,
            fillColor: '#ef4444',
            fillOpacity: 0.1,
            dashArray: '5, 5'
          }}
        />
      );
    } else if (warehouseShapeType === 'rectangle' && positions.length >= 2) {
      const bounds: [[number, number], [number, number]] = [positions[0], positions[1]];
      return (
        <Rectangle
          bounds={bounds}
          pathOptions={{
            color: '#ef4444',
            weight: 2,
            fillColor: '#ef4444',
            fillOpacity: 0.1,
            dashArray: '5, 5'
          }}
        />
      );
    } else if (positions.length >= 1) {
      // For polygon, show points and lines
      if (positions.length >= 3) {
        return (
          <Polygon
            positions={positions}
            pathOptions={{
              color: '#ef4444',
              weight: 2,
              fillColor: '#ef4444',
              fillOpacity: 0.1,
              dashArray: '5, 5'
            }}
          />
        );
      } else {
        // Show markers for individual points
        return (
          <>
            {tempWarehouseShape.map((point, index) => (
              <Marker key={index} position={[point.lat, point.lng]}>
                <Popup>Point {index + 1}</Popup>
              </Marker>
            ))}
          </>
        );
      }
    }
    
    return null;
  };

  const defaultCenter: [number, number] = [20.5279, -10.0309]; // Mauritania center

  // Get instruction text based on shape type and drawing state
  const getInstructionText = () => {
    if (!isDrawing) return '';
    if (mode === 'polygon') {
      return t('map.instructions.polygon');
    } else if (mode === 'warehouse') {
      switch (warehouseShapeType) {
        case 'rectangle':
          return tempWarehouseShape.length === 0 
            ? t('map.instructions.rectangle.start')
            : t('map.instructions.rectangle.end');
        case 'circle':
          return tempWarehouseShape.length === 0 
            ? t('map.instructions.circle.start')
            : t('map.instructions.circle.end');
        case 'polygon':
        default:
          return t('map.instructions.warehouse.polygon');
      }
    }
    return '';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          {title || t('materials.map.title')}
          <div className="flex items-center gap-2">
            {allowCoordinateSelection && (
              <Badge 
                variant={mode === 'center' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setMode('center')}
              >
                {t('map.mode.center')}
              </Badge>
            )}
            {allowPolygon && (
              <Badge 
                variant={mode === 'polygon' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setMode('polygon')}
              >
                {t('map.mode.zone')}
              </Badge>
            )}
            {allowWarehouseTracing && (
              <Badge 
                variant={mode === 'warehouse' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setMode('warehouse')}
              >
                {t('map.mode.warehouse')}
              </Badge>
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">{description || t('materials.map.description')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coordinate inputs */}
        {allowCoordinateSelection && mode === 'center' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="latitude">{t('map.latitude')}</Label>
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
              <Label htmlFor="longitude">{t('map.longitude')}</Label>
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
                {t('map.apply')}
              </Button>
            </div>
          </div>
        )}

        {/* Polygon controls */}
        {allowPolygon && mode === 'polygon' && (
          <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-lg">
            <Button 
              onClick={startDrawing}
              disabled={isDrawing}
              variant={isDrawing ? "secondary" : "default"}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {isDrawing ? t('map.drawing') : t('map.draw.zone')}
            </Button>
            {isDrawing && (
              <Button onClick={finishDrawing}>
                <Save className="w-4 h-4 mr-2" />
                {t('map.finish')}
              </Button>
            )}
            {value.polygon && (
              <Button onClick={clearPolygon} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('map.clear')}
              </Button>
            )}
          </div>
        )}

        {/* Warehouse controls */}
        {allowWarehouseTracing && mode === 'warehouse' && (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-shrink-0">
                <Label className="text-sm font-medium">{t('map.shape.type')}</Label>
              </div>
              <Select value={warehouseShapeType} onValueChange={handleShapeTypeChange}>
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="polygon">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      {t('map.shape.polygon')}
                    </div>
                  </SelectItem>
                  <SelectItem value="rectangle">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      {t('map.shape.rectangle')}
                    </div>
                  </SelectItem>
                  <SelectItem value="circle">
                    <div className="flex items-center gap-2">
                      <CircleIcon className="w-4 h-4" />
                      {t('map.shape.circle')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={startDrawing}
                disabled={isDrawing}
                variant={isDrawing ? "secondary" : "default"}
              >
                <Pencil className="w-4 h-4 mr-2" />
                {isDrawing ? t('map.drawing') : t('map.draw.warehouse')}
              </Button>
              
              {isDrawing && warehouseShapeType === 'polygon' && tempWarehouseShape.length >= 3 && (
                <Button onClick={finishDrawing}>
                  <Save className="w-4 h-4 mr-2" />
                  {t('map.finish')}
                </Button>
              )}
              
              {value.warehouseShape && (
                <Button onClick={clearWarehouseShape} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('map.clear')}
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
              isDrawing={isDrawing}
              warehouseShapeType={warehouseShapeType}
            />

            {/* Center marker */}
            {value.center && (
              <Marker position={[value.center.lat, value.center.lng]}>
                <Popup>
                  {t('map.status.center')}<br />
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
            {renderTempWarehouseShape()}
          </MapContainer>
        </div>

        {/* Status information */}
        <div className="text-sm text-gray-600 space-y-1 p-3 bg-gray-50 rounded-lg">
          {value.center && (
            <div>{t('map.status.center')}: {value.center.lat.toFixed(4)}, {value.center.lng.toFixed(4)}</div>
          )}
          {value.polygon && (
            <div>{t('map.status.zone')}: {value.polygon.length} {t('map.status.points')}</div>
          )}
          {value.warehouseShape && (
            <div>
              {t('map.status.warehouse')} ({t(`map.shape.${value.warehouseShapeType || warehouseShapeType}`)}): {value.warehouseShape.length} {t('map.status.points')}
            </div>
          )}
          {getInstructionText() && (
            <div className="text-blue-600 font-medium">{getInstructionText()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
