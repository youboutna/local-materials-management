import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InteractiveMapGIS from '../../materials/InteractiveMapGIS';
import UnifiedLocationSelector from '../../location/UnifiedLocationSelector';

// Import entity DTOs (following PROMPTS.md Rule #4: No type redefinition)
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { LocationDTO } from "@/dtos/shared";

interface LocationStepProps {
  formData: ProjectDTO;
  onUpdate: (data: Partial<ProjectDTO>) => void;
  isEditing?: boolean;
}

const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-500" />
          Géolocalisation & Cartographie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <UnifiedLocationSelector
              value={{
                address: formData.location || formData.address,
                latitude: formData.coordinates?.latitude || formData.latitude,
                longitude: formData.coordinates?.longitude || formData.longitude
              }}
              onChange={(locationData) => onUpdate({
                location: locationData.address,
                address: locationData.address,
                coordinates: locationData.latitude && locationData.longitude ? {
                  latitude: locationData.latitude,
                  longitude: locationData.longitude
                } : undefined,
                latitude: locationData.latitude,
                longitude: locationData.longitude
              })}
              placeholder="Rechercher l'emplacement du projet..."
              filter="all"
              showCoordinates={true}
              showGPS={true}
              allowManualEntry={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-4">Localisation précise et délimitation</label>
            <div className="border rounded-lg overflow-hidden">
              <InteractiveMapGIS
                title="Géolocalisation du Projet"
                description="Sélectionnez l'emplacement et tracez la zone de travail"
                allowPolygon={true}
                value={formData.coordinates ? {
                  coordinates: {
                    lat: formData.coordinates.latitude,
                    lng: formData.coordinates.longitude
                  }
                } : undefined}
                onChange={(locationData) => {
                  if (locationData?.coordinates) {
                    onUpdate({ 
                      coordinates: {
                        latitude: locationData.coordinates.lat,
                        longitude: locationData.coordinates.lng
                      }
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Zone géographique</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={(formData as any).geographicZone || (formData as any).geographic_zone || ''}
                onChange={(e) => onUpdate({ geographicZone: e.target.value } as any)}
              >
                <option value="">Sélectionner une zone</option>
                <option value="urban">Zone urbaine</option>
                <option value="suburban">Zone périurbaine</option>
                <option value="rural">Zone rurale</option>
                <option value="industrial">Zone industrielle</option>
                <option value="coastal">Zone côtière</option>
                <option value="mountain">Zone montagneuse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type de terrain</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.terrain_type || ''}
                onChange={(e) => onUpdate({ terrain_type: e.target.value })}
              >
                <option value="">Sélectionner le type</option>
                <option value="flat">Terrain plat</option>
                <option value="sloped">Terrain en pente</option>
                <option value="rocky">Terrain rocheux</option>
                <option value="clay">Terrain argileux</option>
                <option value="sandy">Terrain sableux</option>
                <option value="marshy">Terrain marécageux</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contraintes environnementales</label>
              <textarea 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                placeholder="Décrivez les contraintes environnementales, réglementaires ou géographiques spécifiques au site"
                value={(formData as unknown as { environmental_constraints?: string }).environmental_constraints || ''}
                onChange={(e) => onUpdate({ environmental_constraints: e.target.value } as unknown as Partial<ProjectDTO>)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="hasUtilities"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={(formData as unknown as { has_utilities?: boolean }).has_utilities || false}
                  onChange={(e) => onUpdate({ has_utilities: e.target.checked } as unknown as Partial<ProjectDTO>)}
                />
                <label htmlFor="hasUtilities" className="text-sm font-medium">
                  Raccordements aux réseaux disponibles
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="requiresPermits"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={(formData as unknown as { requires_permits?: boolean }).requires_permits || false}
                  onChange={(e) => onUpdate({ requires_permits: e.target.checked } as unknown as Partial<ProjectDTO>)}
                />
              <label htmlFor="requiresPermits" className="text-sm font-medium">
                Permis spéciaux requis
              </label>
            </div>
          </div>

           {formData.coordinates && (
             <div className="bg-muted p-4 rounded-lg">
               <h4 className="text-md font-medium mb-2">Informations de localisation</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                 {formData.coordinates?.latitude && (
                   <>
                     <span>Latitude: {formData.coordinates.latitude.toFixed(6)}</span>
                     <span>Longitude: {formData.coordinates.longitude.toFixed(6)}</span>
                   </>
                 )}
                 {formData.address && (
                   <span className="col-span-2">Adresse: {formData.address}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationStep;