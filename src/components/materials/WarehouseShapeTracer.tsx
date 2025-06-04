
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
      <CardContent>
        <div className="space-y-4">
          <Label>Tracez la forme de votre entrepôt ou bâtiment</Label>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <svg
              width="300"
              height="200"
              className="border bg-white cursor-crosshair"
              onClick={handleCanvasClick}
            >
              {/* Grid pattern */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Shape outline */}
              {currentPoints.length > 0 && (
                <path
                  d={pathData}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              )}
              
              {/* Points */}
              {currentPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#3b82f6"
                />
              ))}
            </svg>
          </div>
          
          {isDrawing && (
            <div className="text-sm text-blue-600">
              Cliquez sur le canevas pour ajouter des points. 
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 ml-2"
                onClick={handleFinishDrawing}
              >
                Terminer
              </Button>
            </div>
          )}
          
          {currentPoints.length > 0 && (
            <div className="text-sm text-gray-600">
              {currentPoints.length} points définis
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseShapeTracer;
