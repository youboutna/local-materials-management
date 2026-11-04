import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * Factory singleton du service des limites administratives (injection de dépendance).
 * Tous les consommateurs (hooks, composants, services) passent par ici afin de
 * partager le cache GeoJSON et éviter les téléchargements redondants.
 */
import { AdministrativeBoundaryService } from '@/application/services/gis/AdministrativeBoundaryService';

let instance: AdministrativeBoundaryService | null = null;

export const getAdministrativeBoundaryService = (): AdministrativeBoundaryService => {
  if (!instance) {
    instance = new AdministrativeBoundaryService(RepositoryFactory.getAdministrativeBoundaryRepository());
  }
  return instance;
};
