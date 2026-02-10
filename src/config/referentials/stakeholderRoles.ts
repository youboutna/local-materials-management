/**
 * Stakeholder Roles Referential
 * Centralized stakeholder role definitions following hexagonal architecture
 * Following PROMPTS.md Rule #2: Proper casing conventions
 */

import { StakeholderType } from '@/dtos/entities/StakeholderDTO';

/**
 * Internal stakeholder roles for employee-type stakeholders
 */
export const internalStakeholderRoles = [
  "Responsable financier",
  "Responsable achats", 
  "Responsable logistique",
  "Responsable HSE",
  "Coordonnateur sécurité",
  "Gestionnaire contrats",
  "Contrôleur de gestion",
  "Autres",
] as const;

/**
 * External stakeholder roles for external parties
 */
export const externalStakeholderRoles = [
  "Ingénieur conseil",
  "Fournisseur matériaux",
  "Entrepreneur / Contractant",
  "Bureau de contrôle",
  "Architecte",
  "Bureau d'études",
  "Ministère (tutelle)",
  "Banque / Bailleur de fonds",
  "Assureur",
  "Organisme certification",
  "Autres",
] as const;

/**
 * Team member positions for project team
 */
export const teamPositions = [
  "Chef de projet",
  "Ingénieur principal",
  "Architecte projet",
  "Coordonnateur technique",
  "Responsable qualité",
  "Coordonnateur sécurité",
  "Gestionnaire contrats",
  "Superviseur travaux",
  "Technicien spécialisé",
  "Assistant projet",
] as const;

/**
 * Get role options based on stakeholder type
 * Following PROMPTS.md Rule #4: Use centralized DTOs
 */
export function getRoleOptions(stakeholderType: StakeholderType) {
  const roles = stakeholderType === StakeholderType.EMPLOYEE 
    ? internalStakeholderRoles 
    : externalStakeholderRoles;
    
  return roles.map((role) => ({ value: role, label: role }));
}

/**
 * Get team position options
 */
export function getTeamPositionOptions() {
  return teamPositions.map((position) => ({ 
    value: position, 
    label: position 
  }));
}

/**
 * Type definitions for role arrays
 */
export type InternalStakeholderRole = typeof internalStakeholderRoles[number];
export type ExternalStakeholderRole = typeof externalStakeholderRoles[number];
export type TeamPosition = typeof teamPositions[number];
