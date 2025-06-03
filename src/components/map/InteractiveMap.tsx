import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Square, Navigation, Trash2, Target, Ruler, Move, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MAURITANIA_REGIONS, Region } from '@/types/mauritania';

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
  //regions
  regions?: Region[];
 onRegionSelect?: (region: Region | null) => void;
}

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSelectingCoordinate, setIsSelectingCoordinate] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<Coordinate[]>(value?.polygon || []);
  const [centerPoint, setCenterPoint] = useState<Coordinate | undefined>(value?.center);
  const [address, setAddress] = useState(value?.address || '');
  const [manualLat, setManualLat] = useState(value?.center?.lat?.toString() || '');
  const [manualLng, setManualLng] = useState(value?.center?.lng?.toString() || '');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [measurementPoints, setMeasurementPoints] = useState<Coordinate[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw background (light blue for water, light green for land)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / zoom);
    gradient.addColorStop(0, '#e0f2fe');
    gradient.addColorStop(1, '#f0fdf4');
    ctx.fillStyle = gradient;
    ctx.fillRect(-offset.x / zoom, -offset.y / zoom, canvas.width / zoom, canvas.height / zoom);

    // Draw enhanced grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1 / zoom;
    const gridSize = 40;
    const startX = Math.floor((-offset.x / zoom) / gridSize) * gridSize;
    const startY = Math.floor((-offset.y / zoom) / gridSize) * gridSize;
    const endX = startX + (canvas.width / zoom) + gridSize;
    const endY = startY + (canvas.height / zoom) + gridSize;

    for (let i = startX; i < endX; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, startY);
      ctx.lineTo(i, endY);
      ctx.stroke();
    }
    for (let i = startY; i < endY; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, i);
      ctx.lineTo(endX, i);
      ctx.stroke();
    }

    // Draw coordinate system
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    
    // Draw latitude lines
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * (canvas.height / zoom);
      ctx.beginPath();
      ctx.moveTo(-offset.x / zoom, y);
      ctx.lineTo((-offset.x + canvas.width) / zoom, y);
      ctx.stroke();
    }
    
    // Draw longitude lines
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * (canvas.width / zoom);
      ctx.beginPath();
      ctx.moveTo(x, -offset.y / zoom);
      ctx.lineTo(x, (-offset.y + canvas.height) / zoom);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);

    // Draw center point
    if (centerPoint) {
      const x = ((centerPoint.lng + 180) / 360) * (canvas.width / zoom);
      const y = ((90 - centerPoint.lat) / 180) * (canvas.height / zoom);
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 8 / zoom, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      
      // Add GPS icon effect
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.arc(x, y, 15 / zoom, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 25 / zoom, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = '#000';
      ctx.font = `${12 / zoom}px sans-serif`;
      ctx.fillText('GPS', x + 12 / zoom, y - 10 / zoom);
    }

    // Draw polygon
    if (currentPolygon.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 3 / zoom;

      ctx.beginPath();
      currentPolygon.forEach((point, index) => {
        const x = ((point.lng + 180) / 360) * (canvas.width / zoom);
        const y = ((90 - point.lat) / 180) * (canvas.height / zoom);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      if (currentPolygon.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Draw polygon points
      currentPolygon.forEach((point, index) => {
        const x = ((point.lng + 180) / 360) * (canvas.width / zoom);
        const y = ((90 - point.lat) / 180) * (canvas.height / zoom);
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 5 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), x, y + 3 / zoom);
      });
    }

    // Draw measurement points and lines
    if (measurementPoints.length > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 / zoom;
      
      for (let i = 0; i < measurementPoints.length - 1; i++) {
        const p1 = measurementPoints[i];
        const p2 = measurementPoints[i + 1];
        
        const x1 = ((p1.lng + 180) / 360) * (canvas.width / zoom);
        const y1 = ((90 - p1.lat) / 180) * (canvas.height / zoom);
        const x2 = ((p2.lng + 180) / 360) * (canvas.width / zoom);
        const y2 = ((90 - p2.lat) / 180) * (canvas.height / zoom);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Calculate and display distance
        const distance = calculateDistance(p1, p2);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        ctx.fillStyle = '#f59e0b';
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${distance.toFixed(2)} km`, midX, midY);
      }
      
      // Draw measurement points
      measurementPoints.forEach((point, index) => {
        const x = ((point.lng + 180) / 360) * (canvas.width / zoom);
        const y = ((90 - point.lat) / 180) * (canvas.height / zoom);
        
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    ctx.restore();
  }, [centerPoint, currentPolygon, zoom, offset, measurementPoints]);

  const calculateDistance = (p1: Coordinate, p2: Coordinate): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };


    //Add state for the selected region
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
    toast({
      title: `Région sélectionnée: ${region.name}`,
      description: `Centré sur ${region.name} (${region.lat.toFixed(6)}, ${region.lng.toFixed(6)})`
    });
  }

  if (onRegionSelect) {
    onRegionSelect(region); // Pass the full region object or null
  }
};

const handleClearRegion = () => {
  setSelectedRegion(null);
  if (onRegionSelect) {
    onRegionSelect(null); // Notify parent that region was cleared
  }
};
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offset.x) / zoom;
    const y = (event.clientY - rect.top - offset.y) / zoom;

    // Convert canvas coordinates to lat/lng
    const lng = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;

    if (isMeasuring) {
      setMeasurementPoints(prev => [...prev, { lat, lng }]);
    } else if (isDrawing && allowPolygon) {
      const newPolygon = [...currentPolygon, { lat, lng }];
      setCurrentPolygon(newPolygon);
      updateMapData({ polygon: newPolygon });
    } else if (isSelectingCoordinate || !isDrawing) {
      const newCenter = { lat, lng };
      setCenterPoint(newCenter);
      setManualLat(lat.toFixed(6));
      setManualLng(lng.toFixed(6));
      updateMapData({ center: newCenter });
      
      if (isSelectingCoordinate) {
        setIsSelectingCoordinate(false);
        toast({
          title: "Coordonnées sélectionnées",
          description: `Position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      }
    }
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * zoomFactor)));
  };

  const updateMapData = (updates: Partial<MapData>) => {
    const newData = {
      center: centerPoint,
      polygon: currentPolygon,
      address,
      ...updates
    };
    onChange(newData);
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
          description:  `Coordonnées: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} `
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

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Erreur",
        description: "Coordonnées invalides (lat: -90 à 90, lng: -180 à 180)",
        variant: "destructive"
      });
      return;
    }

    const newCenter = { lat, lng };
    setCenterPoint(newCenter);
    updateMapData({ center: newCenter });
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const clearMeasurements = () => {
    setMeasurementPoints([]);
    setIsMeasuring(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Enhanced regions  select */}
              {/* Region selector */}
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

        {/* Enhanced coordinate inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="-90.000000 à 90.000000"
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="-180.000000 à 180.000000"
              className="text-sm"
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
                onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
              >
                +
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
              >
                -
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetView}
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

        {/* Enhanced map canvas */}
        <div className="relative border rounded-lg overflow-hidden bg-gray-100">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className={ `w-full h-64 ${
              isSelectingCoordinate ? 'cursor-crosshair' : 
              isDrawing ? 'cursor-copy' : 
              isMeasuring ? 'cursor-cell' :
              isPanning ? 'cursor-move' : 'cursor-pointer'
            } `}
            onClick={handleCanvasClick}
            onWheel={handleCanvasWheel}
          />
          
          {/* Legend positioned to avoid overlap */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs max-w-48">
            <h4 className="font-semibold mb-2">Légende</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Position GPS</span>
              </div>
              {allowPolygon && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500/30 border border-blue-500"></div>
                  <span>Zone tracée</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-amber-500"></div>
                <span>Mesures</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced map controls */}
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
              {currentPolygon.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentPolygon([]);
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
        </div>

        {/* Enhanced summary */}
        {(centerPoint || currentPolygon.length > 0 || measurementPoints.length > 0) && (
          <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
            {centerPoint && (
              <div className="flex justify-between">
                <span>Centre GPS:</span>
                <span className="font-mono">{centerPoint.lat.toFixed(6)}, {centerPoint.lng.toFixed(6)}</span>
              </div>
            )}
            {currentPolygon.length > 0 && (
              <div className="flex justify-between">
                <span>Zone tracée:</span>
                <span>{currentPolygon.length} points définis</span>
              </div>
            )}
            {measurementPoints.length > 1 && (
              <div className="flex justify-between">
                <span>Distance totale:</span>
                <span>
                  {measurementPoints.reduce((total, point, index) => {
                    if (index === 0) return 0;
                    return total + calculateDistance(measurementPoints[index - 1], point);
                  }, 0).toFixed(2)} km
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
