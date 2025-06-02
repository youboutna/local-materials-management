
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Square, Navigation, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  value,
  onChange,
  title = "Localisation et zone",
  description = "Définissez la position GPS et tracez la zone si nécessaire",
  allowPolygon = true,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<Coordinate[]>(value?.polygon || []);
  const [centerPoint, setCenterPoint] = useState<Coordinate | undefined>(value?.center);
  const [address, setAddress] = useState(value?.address || '');
  const [manualLat, setManualLat] = useState(value?.center?.lat?.toString() || '');
  const [manualLng, setManualLng] = useState(value?.center?.lng?.toString() || '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (light blue for water, light green for land)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e0f2fe');
    gradient.addColorStop(1, '#f0fdf4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw center point
    if (centerPoint) {
      // Normalize coordinates to canvas
      const x = ((centerPoint.lng + 180) / 360) * canvas.width;
      const y = ((90 - centerPoint.lat) / 180) * canvas.height;
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add white border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add center point label
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.fillText('Centre', x + 12, y - 10);
    }

    // Draw polygon
    if (currentPolygon.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 3;

      ctx.beginPath();
      currentPolygon.forEach((point, index) => {
        const x = ((point.lng + 180) / 360) * canvas.width;
        const y = ((90 - point.lat) / 180) * canvas.height;
        
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
        const x = ((point.lng + 180) / 360) * canvas.width;
        const y = ((90 - point.lat) / 180) * canvas.height;
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Number the points
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), x, y + 3);
      });
    }
  }, [centerPoint, currentPolygon]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert canvas coordinates to lat/lng
    const lng = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;

    if (isDrawing && allowPolygon) {
      // Add point to polygon
      const newPolygon = [...currentPolygon, { lat, lng }];
      setCurrentPolygon(newPolygon);
      updateMapData({ polygon: newPolygon });
    } else {
      // Set center point
      const newCenter = { lat, lng };
      setCenterPoint(newCenter);
      setManualLat(lat.toFixed(6));
      setManualLng(lng.toFixed(6));
      updateMapData({ center: newCenter });
    }
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
          description: `Coordonnées: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
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

  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPolygon([]);
    updateMapData({ polygon: [] });
    toast({
      title: "Mode dessin activé",
      description: "Cliquez sur la carte pour tracer le polygone"
    });
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    if (currentPolygon.length < 3) {
      toast({
        title: "Polygone incomplet",
        description: "Au moins 3 points sont nécessaires pour un polygone",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Polygone terminé",
        description: `Polygone créé avec ${currentPolygon.length} points`
      });
    }
  };

  const clearPolygon = () => {
    setCurrentPolygon([]);
    setIsDrawing(false);
    updateMapData({ polygon: [] });
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
        {/* Manual coordinates input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="-90 à 90"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="-180 à 180"
            />
          </div>
          <div className="flex gap-2 items-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleManualCoordinates}
              className="flex-1"
            >
              Appliquer
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={getCurrentLocation}
              size="icon"
            >
              <Navigation className="h-4 w-4" />
            </Button>
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
            placeholder="Adresse complète"
          />
        </div>

        {/* Map canvas */}
        <div className="border rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full h-64 cursor-crosshair"
            onClick={handleCanvasClick}
          />
        </div>

        {/* Map controls */}
        {allowPolygon && (
          <div className="flex flex-wrap gap-2">
            {!isDrawing ? (
              <Button
                type="button"
                variant="outline"
                onClick={startDrawing}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Tracer zone
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={finishDrawing}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Terminer
              </Button>
            )}
            {currentPolygon.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={clearPolygon}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Effacer zone
              </Button>
            )}
          </div>
        )}

        {/* Summary */}
        {(centerPoint || currentPolygon.length > 0) && (
          <div className="text-sm text-gray-600 space-y-1">
            {centerPoint && (
              <div>Centre: {centerPoint.lat.toFixed(6)}, {centerPoint.lng.toFixed(6)}</div>
            )}
            {currentPolygon.length > 0 && (
              <div>Zone: {currentPolygon.length} points définis</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
