
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Square, Circle, Pentagon, Trash2, Save, Layers, Target, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import GeoService and Mauritania utilities
import { GeocodingService, getGeocodingService} from '@/application/services/GeocodingService';
import { getGeocodingService } from '@/application/services/GeocodingServiceFactory';
import { 
  Region, 
  City, 
  getMajorCities, 
  getRegionsWithCapitals,
  getAllCityCoordinates,
  searchRegions,
  searchCities,
  getWilayaByCode,
  getCityByCode,
  getCitiesByWilaya
} from '@/utils/mauritaniaUtils';

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
  shapeType?: 'polygon' | 'rectangle' | 'circle' |'diamond';
  polygon?: Coordinate[];
  warehouseShape?: Coordinate[];
}

interface InteractiveMapGISProps {
  title?: string;
  description?: string;
  allowPolygon?: boolean;
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
  title = "Système GIS Interactif",
  description = "Sélectionnez une Géolocalisation et tracé de formes",
  allowPolygon = false,
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
  const [mapLayer, setMapLayer] = useState<'osm' | 'satellite' | 'topo' | 'relief'>('osm');

  // Enhanced Mauritania data using utilities
  const mauritaniaCities = getMajorCities();
  const regionsWithCapitals = getRegionsWithCapitals();
  const allCityCoordinates = getAllCityCoordinates();

  // GeoService instance
  const geoService = getGeocodingService();

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
  }, [mapData?.shape, currentShapeType, updateMapData]);

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
    const center = mapData?.coordinates || { lat: 18.0735, lng: -15.9582 };
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
    const center = mapData?.coordinates || { lat: 18.0735, lng: -15.9582 };
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

  const mapCenter: [number, number] = mapData?.coordinates
    ? [mapData.coordinates.lat, mapData.coordinates.lng]
    : [20.0, -12.0];
  const mapZoom = mapData?.coordinates ? 12 : 6;

  const getMapTileLayer = () => {
    switch (mapLayer) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        };
      case 'topo':
        return {
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
        };
      case 'relief':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri, NAVTEQ, DeLorme'
        };
      case 'osm':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors'
        };
    }
  };

  const tileLayerConfig = getMapTileLayer();

  return (
    <Card className={`${className} border-0 shadow-elegant bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-sm`}>
      <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-accent/20 to-accent/10 text-accent-foreground border-accent/20">
            <Target className="h-3 w-3 mr-1" />
            Précision GPS
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl border border-border/50">
            <TabsTrigger 
              value="location" 
              className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            >
              <MapPin className="h-4 w-4" />
              Localisation
            </TabsTrigger>
            <TabsTrigger 
              value="shape"
              className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            >
              <Pentagon className="h-4 w-4" />
              Forme
            </TabsTrigger>
            <TabsTrigger 
              value="summary"
              className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            >
              <Info className="h-4 w-4" />
              Résumé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-6 mt-6">
            <div className="space-y-3">
              <Label htmlFor="address" className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Adresse de localisation
              </Label>
              <Input
                id="address"
                placeholder="Saisissez l'adresse complète..."
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                className="border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background/50 backdrop-blur-sm"
              />
            </div>

            {mapData?.coordinates && (
              <div className="bg-gradient-to-r from-muted/50 to-accent/10 border border-accent/20 p-4 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Coordonnées GPS précises</span>
                </div>
                <div className="font-mono text-sm text-muted-foreground bg-background/60 px-3 py-2 rounded-lg border">
                  Lat: {mapData.coordinates.lat.toFixed(6)} | Lng: {mapData.coordinates.lng.toFixed(6)}
                </div>
              </div>
            )}

            <div className="relative">
              <div className="h-80 w-full border border-border/50 rounded-xl overflow-hidden shadow-lg bg-background/50 backdrop-blur-sm">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    key={mapLayer}
                    url={tileLayerConfig.url}
                    attribution={tileLayerConfig.attribution}
                  />

                  <MapClickHandler
                    onMapClick={handleMapClick}
                    onShapeClick={handleShapeClick}
                    isDrawingShape={isDrawingShape}
                  />

                  {mauritaniaCities.map((city, index) => (
                    <Marker key={index} position={[city.lat, city.lng]}>
                      <Popup>
                        <div className="text-center">
                          <strong className={city.isCapital ? "text-red-600" : "text-blue-600"}>
                            {city.name}
                          </strong>
                          {city.isCapital && <div className="text-xs text-red-500 font-semibold">Capitale</div>}
                          <div className="text-xs text-gray-600 mt-1">
                            Région: {getWilayaByCode(city.parentCode)?.name || city.parentCode}
                          </div>
                          {city.economicImportance && (
                            <div className="text-xs text-gray-500">
                              Importance: {city.economicImportance}
                            </div>
                          )}
                          {city.population && (
                            <div className="text-xs text-gray-500">
                              Population: {city.population.toLocaleString()}
                            </div>
                          )}
                          {city.hasAirport && (
                            <div className="text-xs text-green-600">🛫 Aéroport</div>
                          )}
                          {city.hasPort && (
                            <div className="text-xs text-blue-600">⚓ Port</div>
                          )}
                          {city.hasUniversity && (
                            <div className="text-xs text-purple-600">🎓 Université</div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {mapData?.coordinates && (
                    <Marker position={[mapData.coordinates.lat, mapData.coordinates.lng]}>
                      <Popup>
                        <strong className="text-green-600">Position sélectionnée</strong>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-2 flex gap-1">
                <Button
                  type="button"
                  variant={mapLayer === 'osm' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('osm')}
                  className="text-xs"
                >
                  OSM
                </Button>
                <Button
                  type="button"
                  variant={mapLayer === 'satellite' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('satellite')}
                  className="text-xs"
                >
                  Satellite
                </Button>
                <Button
                  type="button"
                  variant={mapLayer === 'topo' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('topo')}
                  className="text-xs"
                >
                  Topo
                </Button>
                <Button
                  type="button"
                  variant={mapLayer === 'relief' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('relief')}
                  className="text-xs"
                >
                  Relief
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2 bg-gradient-to-r from-background to-muted/50 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-md"
              >
                <Navigation className={`h-4 w-4 ${isGettingLocation ? "animate-spin text-primary" : "text-accent"}`} />
                {isGettingLocation ? "Localisation en cours..." : "Utiliser ma position GPS"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="shape" className="space-y-6 mt-6">
            <div className="bg-gradient-to-r from-muted/30 to-accent/10 border border-border/50 p-4 rounded-xl">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Pentagon className="h-4 w-4 text-primary" />
                Outils de tracé géométrique
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={createRectangle}
                  className="flex items-center gap-2 bg-background/50 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                >
                  <Square className="h-4 w-4" />
                  Rectangle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={createCircle}
                  className="flex items-center gap-2 bg-background/50 border-accent/20 hover:border-accent hover:bg-accent/5 transition-all shadow-sm"
                >
                  <Circle className="h-4 w-4" />
                  Cercle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startFreeDrawing}
                  className="flex items-center gap-2 bg-background/50 border-success/20 hover:border-success hover:bg-success/5 transition-all shadow-sm"
                >
                  <Pentagon className="h-4 w-4" />
                  Forme libre
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearShape}
                  className="flex items-center gap-2 bg-background/50 border-destructive/20 hover:border-destructive hover:bg-destructive/5 transition-all shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Effacer
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="h-80 w-full border border-border/50 rounded-xl overflow-hidden shadow-lg bg-background/50 backdrop-blur-sm">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    key={mapLayer}
                    url={tileLayerConfig.url}
                    attribution={tileLayerConfig.attribution}
                  />

                  <MapClickHandler
                    onMapClick={handleMapClick}
                    onShapeClick={handleShapeClick}
                    isDrawingShape={isDrawingShape}
                  />

                  {mapData?.coordinates && (
                    <Marker position={[mapData.coordinates.lat, mapData.coordinates.lng]}>
                      <Popup>Position de référence</Popup>
                    </Marker>
                  )}

                  {mapData?.shape && mapData?.shape?.length > 2 && (
                    <Polygon
                      positions={mapData.shape.map(point => ({
                        lat: point.lat,
                        lng: point.lng
                      }))}
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
                          Type: {mapData?.shapeType || 'polygon'}
                        </div>
                      </Popup>
                    </Polygon>
                  )}
                </MapContainer>
              </div>
              <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-2 flex gap-1">
                <Button
                  type="button"
                  variant={mapLayer === 'osm' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('osm')}
                  className="text-xs"
                >
                  OSM
                </Button>
                <Button
                  type="button"
                  variant={mapLayer === 'satellite' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('satellite')}
                  className="text-xs"
                >
                  Satellite
                </Button>
                <Button
                  type="button"
                  variant={mapLayer === 'topo' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('topo')}
                  className="text-xs"
                >
                  Topo
                </Button>
                <Button
                  type="button"
                  variant={mapLayer === 'relief' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMapLayer('relief')}
                  className="text-xs"
                >
                  Relief
                </Button>
              </div>
            </div>

            {isDrawingShape && (
              <div className="bg-gradient-to-r from-info/10 to-primary/10 border border-info/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-info animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Mode tracé actif</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={finishDrawing}
                    className="bg-gradient-to-r from-success/10 to-success/5 border-success/20 hover:border-success text-success-foreground"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Terminer
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur la carte pour ajouter des points à votre forme géométrique.
                </p>
              </div>
            )}

            {mapData?.shape && mapData?.shape?.length > 0 && (
              <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Pentagon className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-foreground">
                    {mapData?.shape?.length || 0} points définis pour la forme
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-6 mt-6">
            <div className="grid gap-4">
              <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Informations de localisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {mapData?.coordinates && mapData?.coordinates?.lat > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-background/60 border border-border/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium text-muted-foreground">Coordonnées GPS</span>
                        </div>
                        <p className="font-mono text-sm text-foreground">
                          {mapData?.coordinates.lat.toFixed(6)}, {mapData.coordinates.lng.toFixed(6)}
                        </p>
                      </div>
                      {address && (
                        <div className="bg-background/60 border border-border/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-3 w-3 text-accent" />
                            <span className="text-xs font-medium text-muted-foreground">Adresse</span>
                          </div>
                          <p className="text-sm text-foreground">{address}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">Aucune position sélectionnée</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-accent/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pentagon className="h-4 w-4 text-accent" />
                    Données géométriques
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {mapData?.shape && mapData?.shape?.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background/60 border border-border/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Square className="h-3 w-3 text-accent" />
                            <span className="text-xs font-medium text-muted-foreground">Type de forme</span>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {mapData?.shapeType || 'polygon'}
                          </Badge>
                        </div>
                        <div className="bg-background/60 border border-border/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-3 w-3 text-accent" />
                            <span className="text-xs font-medium text-muted-foreground">Nombre de points</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{mapData?.shape?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">Aucune forme géométrique tracée</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InteractiveMapGIS;
