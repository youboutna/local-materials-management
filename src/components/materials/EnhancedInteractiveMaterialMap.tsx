import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Package, DollarSign, Eye } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MaterialUIDTO } from '@/dtos/transforms';
import { getMajorCities } from '@/utils/mauritania';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define default icon
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface EnhancedInteractiveMaterialMapProps {
  materials: MaterialUIDTO[];
  onMaterialSelect?: (material: MaterialUIDTO) => void;
}

// Map click handler component
const MapClickHandler: React.FC<{ onMapClick: (coords: [number, number]) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const EnhancedInteractiveMaterialMap: React.FC<EnhancedInteractiveMaterialMapProps> = ({
  materials,
  onMaterialSelect
}) => {
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

  const handleMapClick = (coords: [number, number]) => {
    setSelectedCoords(coords);
  };

  const getStockLevel = (available: number) => {
    if (available === 0) return 'out';
    if (available < 10) return 'low';
    if (available < 50) return 'medium';
    return 'high';
  };

  const getStockColor = (level: string) => {
    switch (level) {
      case 'high': return '#10b981'; // green-500
      case 'medium': return '#f59e0b'; // yellow-500
      case 'low': return '#f97316'; // orange-500
      case 'out': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  const formatPrice = (price: number | undefined | null): string => {
    if (!price && price !== 0) return "0 MRU";
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M MRU`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K MRU`;
    }
    return `${price.toLocaleString()} MRU`;
  };

  const createMaterialIcon = (material: MaterialUIDTO) => {
    const stockLevel = getStockLevel(material.availableQuantity);
    const color = getStockColor(stockLevel);
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">
          📦
        </div>
      `,
      className: 'custom-material-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };


  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-green-600" />
          Carte Interactive des Matériaux
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cliquez sur les marqueurs pour voir les détails des matériaux • Couleurs par niveau de stock
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Stock Élevé
          </Badge>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            Stock Moyen
          </Badge>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            Stock Faible
          </Badge>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            Rupture
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: '600px', width: '100%' }}>
          <MapContainer
            center={[19.0, -12.0]} // Center of Mauritania
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            className="rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Mauritanian cities markers */}
            {getMajorCities().map((city) => (
              <Marker
                key={city.name}
                position={[city.lat, city.lng]}
                icon={DefaultIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h4 className="font-medium">{city.name}</h4>
                    <p className="text-sm text-gray-600">Ville de Mauritanie</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Material markers */}
            {materials.map((material) => {
              if (!material.coordinatesLatitude || !material.coordinatesLongitude) return null;
              
              const stockLevel = getStockLevel(material.availableQuantity);
              
              return (
                <Marker
                  key={material.id}
                  position={[material.coordinatesLatitude, material.coordinatesLongitude]}
                  icon={createMaterialIcon(material)}
                >
                  <Popup maxWidth={300} className="material-popup">
                    <div className="p-2 min-w-[250px]">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-base text-primary">
                          {material.name}
                        </h4>
                        <div className={`w-3 h-3 rounded-full ${getStockColor(stockLevel) === '#10b981' ? 'bg-green-500' : getStockColor(stockLevel) === '#f59e0b' ? 'bg-yellow-500' : getStockColor(stockLevel) === '#f97316' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {material.description}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-500" />
                          <span>{material.category}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span>{material.originLocation || 'Région non spécifiée'}</span>
                        </div>
                        
                        {material.adresse && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            <span className="text-xs">{material.adresse}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600 text-sm">
                              {formatPrice(material.pricePerUnit)}/{material.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              {material.availableQuantity} {material.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              {stockLevel === 'high' && 'Stock élevé'}
                              {stockLevel === 'medium' && 'Stock moyen'}
                              {stockLevel === 'low' && 'Stock faible'}
                              {stockLevel === 'out' && 'Rupture de stock'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {onMaterialSelect && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                          onClick={() => onMaterialSelect(material)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Clicked coordinates marker */}
            {selectedCoords && (
              <Marker position={selectedCoords} icon={DefaultIcon}>
                <Popup>
                  <div className="text-center">
                    <h4 className="font-medium">Position sélectionnée</h4>
                    <p className="text-sm text-gray-600">
                      {selectedCoords[0].toFixed(6)}, {selectedCoords[1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedInteractiveMaterialMap;