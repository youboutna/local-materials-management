
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Square, Circle, Pentagon, Trash2 } from 'lucide-react';

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