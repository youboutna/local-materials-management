import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Trash2, Target, Ruler, Move, RotateCcw } from 'lucide-react';
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
  allowCoordinateSelection?: boolean;
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  value,
  onChange,
  title = "Localisation et zone",
  description = "Définissez la position GPS et tracez la zone si nécessaire",
  allowPolygon = true,
  allowCoordinateSelection = true,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelectingCoordinate, setIsSelectingCoordinate] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<Coordinate[]>(value?.polygon || []);
  const [centerPoint, setCenterPoint] = useState<Coordinate | undefined>(value?.center);
  const [manualLat, setManualLat] = useState(value?.center?.lat?.toString() || '');
  const [manualLng, setManualLng] = useState(value?.center?.lng?.toString() || '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (centerPoint) {
      const x = ((centerPoint.lng + 180) / 360) * canvas.width;
      const y = ((90 - centerPoint.lat) / 180) * canvas.height;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (currentPolygon.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 3;

      ctx.beginPath();
      currentPolygon.forEach((point, index) => {
        const x = ((point.lng + 180) / 360) * canvas.width;
        const y = ((90 - point.lat) / 180) * canvas.height;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (currentPolygon.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
    }
  }, [centerPoint, currentPolygon]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingCoordinate && !allowPolygon) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const lng = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;

    const newCoord = { lat, lng };

    if (isSelectingCoordinate) {
      setCenterPoint(newCoord);
      onChange({ ...value, center: newCoord });
      toast({ title: 'Coordonnée sélectionnée', description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` });
    }

    if (allowPolygon) {
      const updatedPolygon = [...currentPolygon, newCoord];
      setCurrentPolygon(updatedPolygon);
      onChange({ ...value, polygon: updatedPolygon });
    }
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: 'Erreur', description: 'Coordonnées invalides', variant: 'destructive' });
      return;
    }
    const newCoord = { lat, lng };
    setCenterPoint(newCoord);
    onChange({ ...value, center: newCoord });
  };

  const clearPolygon = () => {
    setCurrentPolygon([]);
    onChange({ ...value, polygon: [] });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center space-x-4">
          <Input placeholder="Latitude" value={manualLat} onChange={(e) => setManualLat(e.target.value)} />
          <Input placeholder="Longitude" value={manualLng} onChange={(e) => setManualLng(e.target.value)} />
          <Button onClick={handleManualUpdate}><Target className="mr-2 h-4 w-4" />Centrer</Button>
        </div>
        <div className="mb-4 flex gap-2">
          {allowCoordinateSelection && (
            <Button variant={isSelectingCoordinate ? 'destructive' : 'outline'} onClick={() => setIsSelectingCoordinate(!isSelectingCoordinate)}>
              <MapPin className="mr-2 h-4 w-4" />{isSelectingCoordinate ? 'Annuler GPS' : 'Sélection GPS'}
            </Button>
          )}
          {allowPolygon && (
            <Button variant="outline" onClick={clearPolygon}><Trash2 className="mr-2 h-4 w-4" />Effacer zone</Button>
          )}
        </div>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          width={600}
          height={400}
          className="border border-gray-300 rounded w-full h-[400px]"
        />
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
