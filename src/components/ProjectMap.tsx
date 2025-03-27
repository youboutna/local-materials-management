
import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// This is a placeholder for the actual map implementation
// In a real application, you would use a library like Mapbox or Leaflet
const ProjectMap = ({
  locations = [],
  className
}: {
  locations?: Array<{id: string, name: string, type: 'project' | 'material', latitude: number, longitude: number}>,
  className?: string
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapApiKey, setMapApiKey] = useState<string>('');
  
  // This would be replaced with actual map initialization code
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Placeholder - this would be where you initialize your map library
    console.log('Map container is ready for initialization');
    
    // Cleanup function
    return () => {
      console.log('Cleaning up map resources');
    };
  }, [mapContainerRef, mapApiKey]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-adrar-800 font-serif">
          <MapPin className="mr-2 h-5 w-5 text-terracotta-500" />
          Carte des projets et matériaux
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Map API key input - would be removed in production and replaced with environment variables */}
          <div className="mb-4">
            <label htmlFor="mapbox-key" className="block text-sm font-medium text-adrar-700 mb-1">
              Clé API Mapbox (temporaire)
            </label>
            <input
              id="mapbox-key"
              type="text"
              value={mapApiKey}
              onChange={(e) => setMapApiKey(e.target.value)}
              placeholder="Entrez votre clé API Mapbox publique"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <p className="mt-1 text-xs text-adrar-500">
              Obtenir une clé sur <a href="https://www.mapbox.com" target="_blank" rel="noopener noreferrer" className="text-terracotta-500 hover:underline">mapbox.com</a>
            </p>
          </div>

          {/* Placeholder for map */}
          <div 
            ref={mapContainerRef} 
            className="bg-gray-100 rounded-lg h-80 flex items-center justify-center"
          >
            {!mapApiKey ? (
              <div className="text-center p-4">
                <p className="text-adrar-600 mb-2">Entrez votre clé API Mapbox pour afficher la carte</p>
                <p className="text-sm text-adrar-500">La carte affichera les emplacements des projets et sources de matériaux</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-adrar-600">Carte en cours de chargement...</p>
              </div>
            )}
          </div>

          {/* Location list */}
          <div className="mt-4">
            <h3 className="font-medium text-adrar-700 mb-2">Emplacements ({locations.length})</h3>
            {locations.length > 0 ? (
              <ul className="space-y-2">
                {locations.map(location => (
                  <li key={location.id} className="flex items-start p-2 rounded-md bg-white border border-gray-100 shadow-sm">
                    <MapPin className={`mr-2 h-4 w-4 mt-0.5 ${location.type === 'project' ? 'text-terracotta-500' : 'text-green-500'}`} />
                    <div>
                      <p className="font-medium text-adrar-700">{location.name}</p>
                      <p className="text-xs text-adrar-500">
                        {location.type === 'project' ? 'Projet' : 'Source de matériaux'} - 
                        Lat: {location.latitude.toFixed(4)}, Long: {location.longitude.toFixed(4)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-adrar-500">Aucun emplacement à afficher</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectMap;
