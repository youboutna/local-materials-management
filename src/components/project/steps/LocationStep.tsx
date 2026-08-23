import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import UnifiedLocationSelector from '../../location/UnifiedLocationSelector';
import InterventionZonesPicker from '../../projects/InterventionZonesPicker';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';

// Import entity DTOs (following PROMPTS.md Rule #4: No type redefinition)
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { LocationDTO } from "@/dtos/shared";
import { T } from '@/components/i18n/T';

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
            <label className="block text-sm font-medium mb-2">
              Adresse du projet (siège équipe / siège social)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Adresse administrative et point de contact — distincte des zones bénéficiaires ci-dessous.
            </p>
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

          {/* Zones d'intervention — multi-polygones bénéficiaires */}
          <InterventionZonesPicker
            value={
              (formData as unknown as { interventionZones?: InterventionZoneDTO[] })
                .interventionZones ??
              ((formData as unknown as { interventionZone?: InterventionZoneDTO })
                .interventionZone
                ? [
                    (formData as unknown as { interventionZone: InterventionZoneDTO })
                      .interventionZone,
                  ]
                : [])
            }
            onChange={(zones) =>
              onUpdate({
                interventionZones: zones,
                // Legacy : on garde la première zone dans `interventionZone` pour compat.
                interventionZone: zones[0],
              } as unknown as Partial<ProjectDTO>)
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2"><T k="auto.locationstep.zone_geographique" fallback="Zone géographique" /></label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={(formData as any).geographicZone || (formData as any).geographic_zone || ''}
                onChange={(e) => onUpdate({ geographicZone: e.target.value } as any)}
              >
                <option value=""><T k="auto.locationstep.selectionner_une_zone" fallback="Sélectionner une zone" /></option>
                <option value="urban"><T k="auto.locationstep.zone_urbaine" fallback="Zone urbaine" /></option>
                <option value="suburban"><T k="auto.locationstep.zone_periurbaine" fallback="Zone périurbaine" /></option>
                <option value="rural"><T k="auto.locationstep.zone_rurale" fallback="Zone rurale" /></option>
                <option value="industrial"><T k="auto.locationstep.zone_industrielle" fallback="Zone industrielle" /></option>
                <option value="coastal"><T k="auto.locationstep.zone_cotiere" fallback="Zone côtière" /></option>
                <option value="mountain"><T k="auto.locationstep.zone_montagneuse" fallback="Zone montagneuse" /></option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><T k="auto.locationstep.type_de_terrain" fallback="Type de terrain" /></label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={(formData as any).terrainType || (formData as any).terrain_type || ''}
                onChange={(e) => onUpdate({ terrainType: e.target.value } as any)}
              >
                <option value=""><T k="auto.locationstep.selectionner_le_type" fallback="Sélectionner le type" /></option>
                <option value="flat"><T k="auto.locationstep.terrain_plat" fallback="Terrain plat" /></option>
                <option value="sloped"><T k="auto.locationstep.terrain_en_pente" fallback="Terrain en pente" /></option>
                <option value="rocky"><T k="auto.locationstep.terrain_rocheux" fallback="Terrain rocheux" /></option>
                <option value="clay"><T k="auto.locationstep.terrain_argileux" fallback="Terrain argileux" /></option>
                <option value="sandy"><T k="auto.locationstep.terrain_sableux" fallback="Terrain sableux" /></option>
                <option value="marshy"><T k="auto.locationstep.terrain_marecageux" fallback="Terrain marécageux" /></option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2"><T k="auto.locationstep.contraintes_environnementales" fallback="Contraintes environnementales" /></label>
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
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  checked={(formData as unknown as { has_utilities?: boolean }).has_utilities || false}
                  onChange={(e) => onUpdate({ has_utilities: e.target.checked } as unknown as Partial<ProjectDTO>)}
                />
                <label htmlFor="hasUtilities" className="text-sm font-medium">
                  <T k="auto.locationstep.raccordements_aux_reseaux_disponibles" fallback="Raccordements aux réseaux disponibles" />
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="requiresPermits"
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  checked={(formData as unknown as { requires_permits?: boolean }).requires_permits || false}
                  onChange={(e) => onUpdate({ requires_permits: e.target.checked } as unknown as Partial<ProjectDTO>)}
                />
              <label htmlFor="requiresPermits" className="text-sm font-medium">
                <T k="auto.locationstep.permis_speciaux_requis" fallback="Permis spéciaux requis" />
              </label>
            </div>
          </div>

           {formData.coordinates && (
             <div className="bg-muted p-4 rounded-lg">
               <h4 className="text-md font-medium mb-2"><T k="auto.locationstep.informations_de_localisation" fallback="Informations de localisation" /></h4>
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