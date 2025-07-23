
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Navigation, Square, Circle, Pentagon, Trash2, Save } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers in Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Coordinate {
  lat: number;
  lng: number;
}

interface MapData {
  coordinates?: Coordinate;
  address?: string;
  shape?: Coordinate[];
  shapeType?: 'polygon' | 'rectangle' | 'circle';
}

interface InteractiveMapGISProps {
  value?: MapData;
  onChange?: (data: MapData) => void;
  className?: string;
}

// Component to handle map clicks
const MapClickHandler = ({ 
  onMapClick, 
  onShapeClick, 
  isDrawingShape 
}: { 
  onMapClick: (latlng: L.LatLng) => void;
  onShapeClick: (latlng: L.LatLng) => void;
  isDrawingShape: boolean;
}) => {
  useMapEvents({
    click: (e) => {
      if (isDrawingShape) {
        onShapeClick(e.latlng);
      } else {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

const InteractiveMapGIS: React.FC<InteractiveMapGISProps> = ({
  value = {},
  onChange,
  className = ""
}) => {
  const [mapData, setMapData] = useState<MapData>(value);
  const [address, setAddress] = useState(value?.address || '');
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState<'polygon' | 'rectangle' | 'circle'>('polygon');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState('location');

  // Mauritania cities for reference
  const mauritaniaCities = [
    { name: "Nouakchott", lat: 18.0735, lng: -15.9582, isCapital: true },
    { name: "Nouadhibou", lat: 20.9, lng: -17.0347 },
    { name: "Rosso", lat: 16.5167, lng: -15.8 },
    { name: "Kaédi", lat: 16.15, lng: -13.5 },
    { name: "Zouérat", lat: 22.75, lng: -12.4667 },
    { name: "Kiffa", lat: 16.6167, lng: -11.4 },
  ];

  useEffect(() => {
    if (value) {
      setMapData(value);
      setAddress(value.address || '');
    }
  }, [value]);

  const updateMapData = useCallback((newData: Partial<MapData>) => {
    const updatedData = { ...mapData, ...newData };
    setMapData(updatedData);
    if (onChange) {
      onChange(updatedData);
    }
  }, [mapData, onChange]);

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    const coordinates = { lat: latlng.lat, lng: latlng.lng };
    updateMapData({ coordinates });
  }, [updateMapData]);

  const handleShapeClick = useCallback((latlng: L.LatLng) => {
    const newPoint = { lat: latlng.lat, lng: latlng.lng };
    const currentShape = mapData.shape || [];
    
    updateMapData({ 
      shape: [...currentShape, newPoint],
      shapeType: currentShapeType 
    });
  }, [mapData.shape, currentShapeType, updateMapData]);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    updateMapData({ address: newAddress });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        updateMapData({ coordinates });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        alert("Impossible d'obtenir votre position.");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const createRectangle = () => {
    const center = mapData.coordinates || { lat: 18.0735, lng: -15.9582 };
    const offset = 0.01;
    const rectangle = [
      { lat: center.lat - offset, lng: center.lng - offset },
      { lat: center.lat - offset, lng: center.lng + offset },
      { lat: center.lat + offset, lng: center.lng + offset },
      { lat: center.lat + offset, lng: center.lng - offset },
    ];
    updateMapData({ shape: rectangle, shapeType: 'rectangle' });
    setIsDrawingShape(false);
  };

  const createCircle = () => {
    const center = mapData.coordinates || { lat: 18.0735, lng: -15.9582 };
    const radius = 0.01;
    const points: Coordinate[] = [];
    
    for (let i = 0; i < 16; i++) {
      const angle = (i * 2 * Math.PI) / 16;
      points.push({
        lat: center.lat + radius * Math.cos(angle),
        lng: center.lng + radius * Math.sin(angle)
      });
    }
    updateMapData({ shape: points, shapeType: 'circle' });
    setIsDrawingShape(false);
  };

  const startFreeDrawing = () => {
    setCurrentShapeType('polygon');
    setIsDrawingShape(true);
    updateMapData({ shape: [] });
  };

  const finishDrawing = () => {
    setIsDrawingShape(false);
  };

  const clearShape = () => {
    updateMapData({ shape: [] });
    setIsDrawingShape(false);
  };

  const mapCenter: [number, number] = mapData.coordinates
    ? [mapData.coordinates.lat, mapData.coordinates.lng]
    : [20.0, -12.0];
  const mapZoom = mapData.coordinates ? 12 : 6;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Carte Interactive GIS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="location">Localisation</TabsTrigger>
            <TabsTrigger value="shape">Forme</TabsTrigger>
            <TabsTrigger value="summary">Résumé</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                placeholder="Saisissez l'adresse"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
              />
            </div>

            {mapData.coordinates && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600 font-medium">Coordonnées GPS:</p>
                <p className="text-sm font-mono">
                  {mapData.coordinates.lat.toFixed(6)}, {mapData.coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}

            <div className="h-80 w-full border-2 border-gray-300 rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />

                <MapClickHandler
                  onMapClick={handleMapClick}
                  onShapeClick={handleShapeClick}
                  isDrawingShape={isDrawingShape}
                />

                {mauritaniaCities.map((city, index) => (
                  <Marker key={index} position={[city.lat, city.lng]}>
                    <Popup>
                      <strong className={city.isCapital ? "text-red-600" : "text-blue-600"}>
                        {city.name}
                      </strong>
                      {city.isCapital && <div className="text-xs text-red-500">Capitale</div>}
                    </Popup>
                  </Marker>
                ))}

                {mapData.coordinates && (
                  <Marker position={[mapData.coordinates.lat, mapData.coordinates.lng]}>
                    <Popup>
                      <strong className="text-green-600">Position sélectionnée</strong>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2"
              >
                <Navigation className={`h-4 w-4 ${isGettingLocation ? "animate-spin" : ""}`} />
                {isGettingLocation ? "Localisation..." : "Ma position"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="shape" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={createRectangle}
                className="flex items-center gap-1"
              >
                <Square className="h-4 w-4" />
                Rectangle
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={createCircle}
                className="flex items-center gap-1"
              >
                <Circle className="h-4 w-4" />
                Cercle
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startFreeDrawing}
                className="flex items-center gap-1"
              >
                <Pentagon className="h-4 w-4" />
                Forme libre
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

            <div className="h-80 w-full border-2 border-gray-300 rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />

                <MapClickHandler
                  onMapClick={handleMapClick}
                  onShapeClick={handleShapeClick}
                  isDrawingShape={isDrawingShape}
                />

                {mapData.coordinates && (
                  <Marker position={[mapData.coordinates.lat, mapData.coordinates.lng]}>
                    <Popup>Position de référence</Popup>
                  </Marker>
                )}

                {mapData.shape && mapData.shape.length > 2 && (
                  <Polygon
                    positions={mapData.shape.map(point => [point.lat, point.lng])}
                    pathOptions={{
                      color: "#3b82f6",
                      fillColor: "#3b82f6",
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <strong>Forme tracée</strong>
                      <div className="text-xs text-gray-600">
                        Type: {mapData.shapeType || 'polygon'}
                      </div>
                    </Popup>
                  </Polygon>
                )}
              </MapContainer>
            </div>

            {isDrawingShape && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                Cliquez sur la carte pour ajouter des points à votre forme.
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 ml-2"
                  onClick={finishDrawing}
                >
                  Terminer
                </Button>
              </div>
            )}

            {mapData.shape && mapData.shape.length > 0 && (
              <div className="text-sm text-gray-600">
                {mapData.shape.length} points définis
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Localisation</h4>
                {mapData.coordinates ? (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <strong>GPS:</strong> {mapData.coordinates.lat.toFixed(6)}, {mapData.coordinates.lng.toFixed(6)}
                    </p>
                    {address && (
                      <p className="text-sm text-gray-600">
                        <strong>Adresse:</strong> {address}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune position sélectionnée</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Forme</h4>
                {mapData.shape && mapData.shape.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <strong>Type:</strong> {mapData.shapeType || 'polygon'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Points:</strong> {mapData.shape.length}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune forme tracée</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InteractiveMapGIS;
