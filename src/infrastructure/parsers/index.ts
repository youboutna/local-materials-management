// src/infrastructure/parsers/index.ts
//
// Point d'entrée unique pour tous les parseurs de fichiers projet.
// Permet des imports courts :
//   import { ProjectFileParserFactory, JsonProjectParser } from '@/infrastructure/parsers';
//
// Ordre d'export : du plus générique au plus spécifique (respect des dépendances).

// =============================================================================
// CONTRAT + UTILITAIRES
// =============================================================================

export type {
  IProjectFileParser,
  ProjectFileParserOptions,
} from './IProjectFileParser';

export {
  readFileAsText,
  readFileAsArrayBuffer,
  getFileExtension,
  resolveLabel,
} from './IProjectFileParser';

// =============================================================================
// PARSEURS CONCRETS
// =============================================================================

export { JsonProjectParser } from './JsonProjectParser';
export { GeoJsonProjectParser } from './GeoJsonProjectParser';
export { KmlProjectParser } from './KmlProjectParser';
export { MSProjectXmlParser } from './MSProjectXmlParser';

// =============================================================================
// SÉLECTEUR
// =============================================================================

export { ProjectFileParserFactory } from './ProjectFileParserFactory';

// =============================================================================
// CONSTANTES PARTAGÉES
// =============================================================================

/**
 * Extensions de fichiers supportées pour l'import avancé.
 * Utile pour l'attribut `accept` des `<input type="file">`.
 */
export const SUPPORTED_PROJECT_FILE_EXTENSIONS = [
  '.geojson',
  '.kml',
  '.xml',
  '.json',
] as const;

/**
 * Types MIME supportés (approximatifs — les navigateurs ne fournissent
 * pas toujours un MIME pour .geojson ou .kml).
 */
export const SUPPORTED_PROJECT_FILE_MIME_TYPES = [
  'application/geo+json',
  'application/vnd.google-earth.kml+xml',
  'application/xml',
  'text/xml',
  'application/json',
] as const;

/**
 * Chaîne prête à l'emploi pour l'attribut `accept` d'un input file.
 */
export const PROJECT_FILE_ACCEPT_ATTRIBUTE =
  SUPPORTED_PROJECT_FILE_EXTENSIONS.join(',');