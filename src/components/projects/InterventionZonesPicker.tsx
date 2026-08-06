/**
 * InterventionZonesPicker — Alias rétro-compatible pour GeoZoneEditor
 * 
 * Architecture Hexagonale :
 * - Délègue entièrement à GeoZoneEditor (composant GIS unifié)
 * - Utilise InterventionZoneDTO pour les données
 * - Pas de logique métier, uniquement un wrapper
 * - Maintient la compatibilité avec les imports existants
 * 
 * Ce composant est utilisé dans :
 * - ProjectFormWithMap (formulaire projet)
 * - MaterialDetail (détail matériau)
 * - EnhancedMaterialForm (formulaire matériau)
 * - ProjectDetailByDTO (détail projet)
 * - ProjectCreationWorkflow (workflow création)
 * 
 * Toute la logique GIS vit dans GeoZoneEditor :
 * - Dessin multi-formes (polygone, rectangle, cercle, point)
 * - Import/Export GeoJSON
 * - Reverse-geocoding
 * - Recherche d'adresse
 * - Gestion des zones d'intervention
 */

import React from 'react';
import GeoZoneEditor, { GeoZoneEditorProps } from '@/components/gis/GeoZoneEditor';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';

/**
 * Props pour InterventionZonesPicker
 * Hérite de GeoZoneEditorProps pour une compatibilité totale
 * 
 * @see GeoZoneEditorProps pour la documentation complète
 */
export type InterventionZonesPickerProps = GeoZoneEditorProps;

/**
 * InterventionZonesPicker - Wrapper pour GeoZoneEditor
 * 
 * @example
 * // Utilisation basique
 * <InterventionZonesPicker
 *   value={zones}
 *   onChange={setZones}
 *   title="Zones d'intervention"
 * />
 * 
 * @example
 * // Mode lecture seule
 * <InterventionZonesPicker
 *   value={project.interventionZones}
 *   readOnly={true}
 *   title="Zones du projet"
 *   defaultCenter={[18.0735, -15.9582]}
 * />
 * 
 * @param props - Les mêmes props que GeoZoneEditor
 * @returns Le composant GeoZoneEditor avec les props passées
 */
const InterventionZonesPicker: React.FC<InterventionZonesPickerProps> = (props) => {
  // Délégation totale à GeoZoneEditor
  return <GeoZoneEditor {...props} />;
};

// Export du composant par défaut
export default InterventionZonesPicker;

// Re-export des types pour faciliter l'utilisation
export type { InterventionZoneDTO, GeoZoneEditorProps };