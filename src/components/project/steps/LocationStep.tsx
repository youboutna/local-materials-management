import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LocationSelector from '@/components/location/LocationSelector';

interface LocationStepProps {
  formData: any;
  onUpdate: (data: any) => void;
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
            <label className="block text-sm font-medium mb-2">Adresse du projet</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Adresse complète du site de construction"
              value={formData.location || ''}
              onChange={(e) => onUpdate({ location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-4">Localisation précise et délimitation</label>
            <div className="border rounded-lg overflow-hidden">
              <LocationSelector
                onLocationSelect={(locationData) => {
                  onUpdate({ facilitiesLocation: locationData });
                }}
                initialLocation={formData.facilitiesLocation}
                enableShapeTracing={true}
                height="400px"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Zone géographique</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.geographic_zone || ''}
                onChange={(e) => onUpdate({ geographic_zone: e.target.value })}
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
              value={formData.environmental_constraints || ''}
              onChange={(e) => onUpdate({ environmental_constraints: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="hasUtilities"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={formData.has_utilities || false}
                onChange={(e) => onUpdate({ has_utilities: e.target.checked })}
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
                checked={formData.requires_permits || false}
                onChange={(e) => onUpdate({ requires_permits: e.target.checked })}
              />
              <label htmlFor="requiresPermits" className="text-sm font-medium">
                Permis spéciaux requis
              </label>
            </div>
          </div>

          {formData.facilitiesLocation && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium mb-2">Informations de localisation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {formData.facilitiesLocation.center && (
                  <>
                    <span>Latitude: {formData.facilitiesLocation.center.lat.toFixed(6)}</span>
                    <span>Longitude: {formData.facilitiesLocation.center.lng.toFixed(6)}</span>
                  </>
                )}
                {formData.facilitiesLocation.address && (
                  <span className="col-span-2">Adresse: {formData.facilitiesLocation.address}</span>
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