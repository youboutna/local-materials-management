
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Square, Circle, Pentagon, Trash2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface WarehouseShapeTracerProps {
  value?: Point[];
  onChange: (points: Point[]) => void;
  title?: string;
}

const WarehouseShapeTracer: React.FC<WarehouseShapeTracerProps> = ({
  value = [],
  onChange,
  title = "Délimitation de l'entrepôt"
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>(value);

  const handleCanvasClick = (event: React.MouseEvent<SVGElement>) => {
    if (!isDrawing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newPoints = [...currentPoints, { x, y }];
    setCurrentPoints(newPoints);
    onChange(newPoints);
  };

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setCurrentPoints([]);
    onChange([]);
  };

  const handleFinishDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setCurrentPoints([]);
    onChange([]);
    setIsDrawing(false);
  };

  const createRectangle = () => {
    const points = [
      { x: 50, y: 50 },
      { x: 250, y: 50 },
      { x: 250, y: 150 },
      { x: 50, y: 150 }
    ];
    setCurrentPoints(points);
    onChange(points);
  };

  const createCircle = () => {
    const centerX = 150;
    const centerY = 100;
    const radius = 50;
    const points: Point[] = [];
    
    for (let i = 0; i < 16; i++) {
      const angle = (i * 2 * Math.PI) / 16;
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    setCurrentPoints(points);
    onChange(points);
  };

  const pathData = currentPoints.length > 0 
    ? `M ${currentPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <div className="flex gap-2">
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
              onClick={handleStartDrawing}
              className="flex items-center gap-1"
            >
              <Pentagon className="h-4 w-4" />
              Forme libre
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Effacer
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
  
    </Card>
  );
};

export default WarehouseShapeTracer;
