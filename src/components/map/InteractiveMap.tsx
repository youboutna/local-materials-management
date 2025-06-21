
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, ZoomIn, ZoomOut, Plus, Square, Circle, Diamond, Pentagon, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapData {
  center?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
  warehouseShape?: { lat: number; lng: number }[];
  address?: string;
  shapeType?: "polygon" | "rectangle" | "circle" | "diamond";
}

interface InteractiveMapProps {
  title?: string;
  description?: string;
  value?: MapData;
  onChange?: (data: MapData) => void;
  allowPolygon?: boolean;
  className?: string;
}

// Custom map click handler component
const MapClickHandler: React.FC<{ 
  onLocationSelect: (lat: number, lng: number) => void;
  onShapeClick: (lat: number, lng: number) => void;
  isDrawingShape: boolean;
}> = ({ onLocationSelect, onShapeClick, isDrawingShape }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      if (isDrawingShape) {
        onShapeClick(lat, lng);
      } else {
        onLocationSelect(lat, lng);
      }
    },
  });
  return null;
};

// Custom zoom controls component
const ZoomControls: React.FC = () => {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleReset = () => {
    map.setView([20.0, -12.0], 6); // Center on Mauritania
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        className="bg-white shadow-md hover:bg-gray-50"
        onClick={handleZoomIn}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-white shadow-md hover:bg-gray-50"
        onClick={handleZoomOut}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-white shadow-md hover:bg-gray-50"
        onClick={handleReset}
        title="Recentrer sur la Mauritanie"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  title = "Carte interactive",
  description = "Sélectionnez une localisation sur la carte",
  value = {},
  onChange,
  allowPolygon = false,
  className = ""
}) => {
  const [mapData, setMapData] = useState<MapData>(value);
  const [address, setAddress] = useState(value?.address || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'rectangle' | 'circle' | 'diamond' | null>(null);
  const [shapePoints, setShapePoints] = useState<{ lat: number; lng: number }[]>([]);

  // Mauritania major cities and regions coordinates
  const mauritaniaCities = [
    { name: 'Nouakchott', lat: 18.0735, lng: -15.9582, isCapital: true },
    { name: 'Nouadhibou', lat: 20.9000, lng: -17.0347 },
    { name: 'Rosso', lat: 16.5167, lng: -15.8000 },
    { name: 'Kaédi', lat: 16.1500, lng: -13.5000 },
    { name: 'Zouérat', lat: 22.7500, lng: -12.4667 },
    { name: 'Kiffa', lat: 16.6167, lng: -11.4000 },
    { name: 'Atar', lat: 20.5167, lng: -13.0500 },
    { name: 'Aleg', lat: 17.0500, lng: -13.9167 },
    { name: 'Boutilimit', lat: 17.5500, lng: -14.7000 },
    { name: 'Tidjikja', lat: 18.5500, lng: -11.4333 }
  ];

  useEffect(() => {
    if (value) {
      setMapData(value);
      setAddress(value.address || '');
    }
  }, [value]);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    const updatedData = { ...mapData, address: newAddress };
    setMapData(updatedData);
    if (onChange) {
      onChange(updatedData);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    const center = { lat: Math.round(lat * 1000000) / 1000000, lng: Math.round(lng * 1000000) / 1000000 };
    const updatedData = { ...mapData, center };
    setMapData(updatedData);
    
    if (onChange) {
      onChange(updatedData);
    }
  };

  const handleShapeClick = (lat: number, lng: number) => {
    if (!isDrawingShape || !drawingMode) return;

    const newPoint = { lat, lng };
    const newPoints = [...shapePoints, newPoint];
    setShapePoints(newPoints);

    // For polygons, allow multiple points
    if (drawingMode === 'polygon') {
      // Continue adding points
      return;
    }

    // For other shapes, complete after specific number of points
    if (drawingMode === 'rectangle' && newPoints.length === 2) {
      completeRectangle(newPoints);
    } else if (drawingMode === 'circle' && newPoints.length === 2) {
      completeCircle(newPoints);
    } else if (drawingMode === 'diamond' && newPoints.length === 2) {
      completeDiamond(newPoints);
    }
  };

  const completeRectangle = (points: { lat: number; lng: number }[]) => {
    if (points.length !== 2) return;
    
    const [p1, p2] = points;
    const rectanglePoints = [
      p1,
      { lat: p1.lat, lng: p2.lng },
      p2,
      { lat: p2.lat, lng: p1.lng }
    ];
    
    finishShape(rectanglePoints, 'rectangle');
  };

  const completeCircle = (points: { lat: number; lng: number }[]) => {
    if (points.length !== 2) return;
    
    const [center, edge] = points;
    const radius = Math.sqrt(
      Math.pow(edge.lat - center.lat, 2) + Math.pow(edge.lng - center.lng, 2)
    );
    
    const circlePoints = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i * 2 * Math.PI) / 32;
      circlePoints.push({
        lat: center.lat + radius * Math.cos(angle),
        lng: center.lng + radius * Math.sin(angle)
      });
    }
    
    finishShape(circlePoints, 'circle');
  };

  const completeDiamond = (points: { lat: number; lng: number }[]) => {
    if (points.length !== 2) return;
    
    const [p1, p2] = points;
    const centerLat = (p1.lat + p2.lat) / 2;
    const centerLng = (p1.lng + p2.lng) / 2;
    const halfWidth = Math.abs(p2.lng - p1.lng) / 2;
    const halfHeight = Math.abs(p2.lat - p1.lat) / 2;
    
    const diamondPoints = [
      { lat: centerLat + halfHeight, lng: centerLng }, // Top
      { lat: centerLat, lng: centerLng + halfWidth },  // Right
      { lat: centerLat - halfHeight, lng: centerLng }, // Bottom
      { lat: centerLat, lng: centerLng - halfWidth }   // Left
    ];
    
    finishShape(diamondPoints, 'diamond');
  };

  const finishShape = (points: { lat: number; lng: number }[], shapeType: string) => {
    const updatedData = { 
      ...mapData, 
      warehouseShape: points,
      shapeType: shapeType as "polygon" | "rectangle" | "circle" | "diamond"
    };
    setMapData(updatedData);
    
    if (onChange) {
      onChange(updatedData);
    }
    
    setIsDrawingShape(false);
    setDrawingMode(null);
    setShapePoints([]);
  };

  const startDrawing = (mode: 'polygon' | 'rectangle' | 'circle' | 'diamond') => {
    setIsDrawingShape(true);
    setDrawingMode(mode);
    setShapePoints([]);
  };

  const finishPolygon = () => {
    if (shapePoints.length >= 3) {
      finishShape(shapePoints, 'polygon');
    }
  };

  const clearShape = () => {
    const updatedData = { ...mapData, warehouseShape: undefined, shapeType: undefined };
    setMapData(updatedData);
    
    if (onChange) {
      onChange(updatedData);
    }
    
    setIsDrawingShape(false);
    setDrawingMode(null);
    setShapePoints([]);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        const updatedData = { ...mapData, center };
        setMapData(updatedData);
        
        if (onChange) {
          onChange(updatedData);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Impossible d\'obtenir votre position. Veuillez vérifier les permissions de géolocalisation.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address input */}
        <div className="space-y-2">
          <Label htmlFor="map-address">Adresse</Label>
          <Input
            id="map-address"
            placeholder="Saisissez l'adresse"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
          />
        </div>

        {/* Shape drawing tools */}
        {allowPolygon && (
          <div className="space-y-2">
            <Label>Outils de traçage de forme</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={drawingMode === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => startDrawing('rectangle')}
                className="flex items-center gap-1"
              >
                <Square className="h-4 w-4" />
                Rectangle
              </Button>
              <Button
                type="button"
                variant={drawingMode === 'diamond' ? 'default' : 'outline'}
                size="sm"
                onClick={() => startDrawing('diamond')}
                className="flex items-center gap-1"
              >
                <Diamond className="h-4 w-4" />
                Losange
              </Button>
              <Button
                type="button"
                variant={drawingMode === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => startDrawing('circle')}
                className="flex items-center gap-1"
              >
                <Circle className="h-4 w-4" />
                Cercle
              </Button>
              <Button
                type="button"
                variant={drawingMode === 'polygon' ? 'default' : 'outline'}
                size="sm"
                onClick={() => startDrawing('polygon')}
                className="flex items-center gap-1"
              >
                <Pentagon className="h-4 w-4" />
                Polygone libre
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearShape}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Effacer
              </Button>
            </div>
            
            {isDrawingShape && (
              <div className="text-sm text-blue-600 p-2 bg-blue-50 rounded">
                {drawingMode === 'rectangle' && "Cliquez pour définir 2 coins opposés du rectangle"}
                {drawingMode === 'circle' && "Cliquez pour le centre puis pour définir le rayon"}
                {drawingMode === 'diamond' && "Cliquez pour définir 2 coins opposés du losange"}
                {drawingMode === 'polygon' && (
                  <div className="flex items-center justify-between">
                    <span>Cliquez pour ajouter des points ({shapePoints.length} points)</span>
                    {shapePoints.length >= 3 && (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 ml-2"
                        onClick={finishPolygon}
                      >
                        Terminer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GPS Coordinates display */}
        {mapData.center && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Coordonnées GPS:</strong>
            </p>
            <p className="text-sm font-mono">
              {mapData.center.lat.toFixed(6)}, {mapData.center.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Shape info display */}
        {mapData.warehouseShape && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-600">
              <strong>Forme tracée:</strong> {mapData.shapeType || 'polygon'} - {mapData.warehouseShape.length} points
            </p>
          </div>
        )}

        {/* Interactive Leaflet Map */}
        <div className="space-y-2">
          <Label>Carte de la Mauritanie (OpenStreetMap)</Label>
          <div className="relative w-full h-96 border-2 border-gray-300 rounded-lg overflow-hidden">
            <MapContainer
              center={mapData.center ? [mapData.center.lat, mapData.center.lng] : [20.0, -12.0]}
              zoom={mapData.center ? 10 : 6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              {/* OpenStreetMap tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Major cities markers */}
              {mauritaniaCities.map((city, index) => (
                <Marker key={index} position={[city.lat, city.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong className={city.isCapital ? 'text-red-600' : 'text-blue-600'}>
                        {city.name}
                      </strong>
                      {city.isCapital && <div className="text-xs text-red-500">Capitale</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Selected position marker */}
              {mapData.center && (
                <Marker position={[mapData.center.lat, mapData.center.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong className="text-green-600">Position sélectionnée</strong>
                      <div className="text-xs text-gray-600">
                        {mapData.center.lat.toFixed(6)}, {mapData.center.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Warehouse shape polygon */}
              {mapData.warehouseShape && mapData.warehouseShape.length > 0 && (
                <Polygon
                  positions={mapData.warehouseShape.map(point => [point.lat, point.lng])}
                  pathOptions={{ 
                    color: '#3b82f6', 
                    fillColor: '#3b82f6', 
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-blue-600">Forme de l'entrepôt</strong>
                      <div className="text-xs text-gray-600">
                        Type: {mapData.shapeType || 'polygon'}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* Drawing points for current shape */}
              {shapePoints.map((point, index) => (
                <Marker 
                  key={`drawing-${index}`} 
                  position={[point.lat, point.lng]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: #ef4444; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                    iconSize: [10, 10],
                    iconAnchor: [5, 5]
                  })}
                />
              ))}

              {/* Click handler */}
              <MapClickHandler 
                onLocationSelect={handleLocationSelect} 
                onShapeClick={handleShapeClick}
                isDrawingShape={isDrawingShape}
              />
              
              {/* Custom zoom controls */}
              <ZoomControls />
            </MapContainer>

            {/* Instructions overlay */}
            {!mapData.center && !isDrawingShape && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1001] bg-black/20">
                <div className="bg-white/95 px-6 py-4 rounded-lg shadow-lg text-center">
                  <MapPin className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700 font-medium">
                    Cliquez sur la carte pour sélectionner une position
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisez les contrôles de zoom pour naviguer
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current location button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2"
          >
            <Navigation className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
            {isGettingLocation ? 'Localisation...' : 'Utiliser ma position actuelle'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
