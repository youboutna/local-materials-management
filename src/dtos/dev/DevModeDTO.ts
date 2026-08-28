/**
 * DTOs du mode de session (DEV local vs API réelle).
 * Codes en anglais MAJUSCULES — libellés résolus côté UI via i18n.
 */

export type DevModeCode = 'LOCAL' | 'API';

export interface DevModeRoleOptionDTO {
  code: string;
  email: string;
  description: string;
}

export interface DevModeStateDTO {
  /** Mode courant de la session applicative. */
  mode: DevModeCode;
  /** DEV_MODE activé au niveau de la configuration (env / runtime config). */
  devModeEnabled: boolean;
  /** Origine du réglage : ADMIN (override persisté) ou ENV (.env / runtime config). */
  devModeSource: 'ADMIN' | 'ENV';
  /** Rôle DEV actif (uniquement pertinent en mode LOCAL). */
  activeRole: string | null;
  /** Adaptateur d'authentification réellement instancié. */
  adapter: string;
  /** Profils DEV disponibles pour la bascule de rôle. */
  availableRoles: DevModeRoleOptionDTO[];
}
