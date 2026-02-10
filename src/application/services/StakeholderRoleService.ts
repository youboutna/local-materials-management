/**
 * Stakeholder Role Service
 * Centralized role management following hexagonal architecture
 * Following PROMPTS.md Rule #1: Arrow Flow and Rule #4: Type Safety
 */

import { StakeholderType } from '@/dtos/entities/StakeholderDTO';
import { 
  internalStakeholderRoles, 
  externalStakeholderRoles, 
  teamPositions,
  getRoleOptions,
  getTeamPositionOptions 
} from '@/config/referentials/stakeholderRoles';

/**
 * Service for managing stakeholder roles
 * Provides centralized role management with proper type safety
 */
export class StakeholderRoleService {
  
  /**
   * Get available roles for a specific stakeholder type
   * Following PROMPTS.md Rule #4: Use centralized DTOs
   */
  getRolesForStakeholderType(stakeholderType: StakeholderType) {
    return getRoleOptions(stakeholderType);
  }

  /**
   * Get all internal stakeholder roles
   */
  getInternalRoles() {
    return internalStakeholderRoles.map((role) => ({ 
      value: role, 
      label: role 
    }));
  }

  /**
   * Get all external stakeholder roles
   */
  getExternalRoles() {
    return externalStakeholderRoles.map((role) => ({ 
      value: role, 
      label: role 
    }));
  }

  /**
   * Get all team positions
   */
  getTeamPositions() {
    return getTeamPositionOptions();
  }

  /**
   * Validate if a role is valid for a stakeholder type
   * Following PROMPTS.md Rule #4: Type safety
   */
  isValidRoleForStakeholderType(role: string, stakeholderType: StakeholderType): boolean {
    const availableRoles = this.getRolesForStakeholderType(stakeholderType);
    return availableRoles.some(r => r.value === role);
  }

  /**
   * Validate if a team position is valid
   */
  isValidTeamPosition(position: string): boolean {
    const availablePositions = this.getTeamPositions();
    return availablePositions.some(p => p.value === position);
  }

  /**
   * Get role suggestions based on stakeholder type
   * Following PROMPTS.md Rule #5: UI Layer Separation
   */
  getRoleSuggestions(stakeholderType: StakeholderType, searchTerm: string) {
    const roles = this.getRolesForStakeholderType(stakeholderType);
    
    if (!searchTerm) {
      return roles;
    }

    return roles.filter(role => 
      role.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Get team position suggestions
   */
  getTeamPositionSuggestions(searchTerm: string) {
    const positions = this.getTeamPositions();
    
    if (!searchTerm) {
      return positions;
    }

    return positions.filter(position => 
      position.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Get role categories for better organization
   * Following PROMPTS.md Rule #5: Display calculations
   */
  getRoleCategories() {
    return {
      internal: this.getInternalRoles(),
      external: this.getExternalRoles(),
      team: this.getTeamPositions()
    };
  }
}
