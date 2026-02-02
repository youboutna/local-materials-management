// Transformer: Hierarchy Mapping
// Converts between domain entities and DTOs for hierarchy mapping

import { Employee, EmployeeRole, Permission } from '@/domain/entities';
import { HierarchyMember } from '@/domain/entities/Hierarchy';
import { 
  PositionTemplateDTO, 
  RoleSuggestionDTO, 
  HierarchyAssignmentDTO, 
  RoleValidationDTO,
  HierarchyMappingDTO 
} from '../entities/HierarchyMappingDTO';
import { 
  PositionTemplate, 
  RoleMapping, 
  TemplatePermissions 
} from '../../domain/services/HierarchyMappingService';

export class HierarchyMappingTransformer {
  
  // DTO → Domain: Position Template
  static toPositionTemplate(dto: PositionTemplateDTO): PositionTemplate {
    return {
      title: dto.title,
      department: dto.department,
      category: dto.category,
      level: dto.level,
      parent: dto.parent,
      permissions: {
        can_approve_projects: dto.permissions.can_approve_projects,
        can_approve_payments: dto.permissions.can_approve_payments,
        can_escalate_to_director: dto.permissions.can_escalate_to_director
      }
    };
  }

  // Domain → DTO: Position Template
  static toPositionTemplateDTO(domain: PositionTemplate): PositionTemplateDTO {
    return {
      title: domain.title,
      department: domain.department,
      category: domain.category,
      level: domain.level,
      parent: domain.parent,
      permissions: {
        can_approve_projects: domain.permissions.can_approve_projects,
        can_approve_payments: domain.permissions.can_approve_payments,
        can_escalate_to_director: domain.permissions.can_escalate_to_director
      }
    };
  }

  // Domain → DTO: Role Suggestion
  static toRoleSuggestionDTO(mapping: RoleMapping): RoleSuggestionDTO {
    return {
      suggestedRole: mapping.suggestedRole,
      confidence: mapping.confidence,
      matchedPermissions: mapping.matchedPermissions,
      missingPermissions: mapping.missingPermissions,
      extraPermissions: mapping.extraPermissions,
      compatibilityReason: this.getCompatibilityReason(mapping.confidence)
    };
  }

  // Domain → DTO: Hierarchy Assignment
  static toHierarchyAssignmentDTO(
    employeeId: string,
    positionId: string,
    hierarchyId: string,
    organizationName: string,
    assignedBy: string,
    notes?: string
  ): HierarchyAssignmentDTO {
    return {
      employeeId,
      positionId,
      hierarchyId,
      organizationName,
      assignmentDate: new Date().toISOString(),
      assignedBy,
      notes
    };
  }

  // Domain → DTO: Role Validation
  static toRoleValidationDTO(
    validation: { isValid: boolean; warnings: string[]; suggestions: string[] },
    alternatives: Array<{ role: EmployeeRole; compatibility: number; reason: string }>
  ): RoleValidationDTO {
    return {
      isValid: validation.isValid,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      alternativeRoles: alternatives.map(alt => ({
        role: alt.role,
        compatibility: alt.compatibility,
        reason: alt.reason
      }))
    };
  }

  // Utility: Get compatibility reason text
  private static getCompatibilityReason(confidence: number): string {
    if (confidence >= 0.9) return 'Parfaitement compatible';
    if (confidence >= 0.7) return 'Bon match';
    if (confidence >= 0.5) return 'Partiellement compatible';
    if (confidence >= 0.3) return 'Faible compatibilité';
    return 'Incompatible';
  }

  // Domain → DTO: Complete Hierarchy Mapping
  static toHierarchyMappingDTO(
    organizationName: string,
    assignments: HierarchyAssignmentDTO[],
    validationResults: RoleValidationDTO[],
    totalPositions: number
  ): HierarchyMappingDTO {
    return {
      organizationName,
      totalPositions,
      assignedPositions: assignments.length,
      unassignedPositions: totalPositions - assignments.length,
      assignments,
      validationResults,
      mappingDate: new Date().toISOString()
    };
  }

  // Validation: Ensure DTO integrity
  static validatePositionTemplateDTO(dto: PositionTemplateDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!dto.title || dto.title.trim().length === 0) {
      errors.push('Le titre est obligatoire');
    }

    if (!dto.department || dto.department.trim().length === 0) {
      errors.push('Le département est obligatoire');
    }

    if (!dto.category || dto.category.trim().length === 0) {
      errors.push('La catégorie est obligatoire');
    }

    if (dto.level < 1 || dto.level > 10) {
      errors.push('Le niveau doit être entre 1 et 10');
    }

    if (typeof dto.permissions !== 'object') {
      errors.push('Les permissions sont obligatoires');
    } else {
      if (typeof dto.permissions.can_approve_projects !== 'boolean') {
        errors.push('can_approve_projects doit être un booléen');
      }
      if (typeof dto.permissions.can_approve_payments !== 'boolean') {
        errors.push('can_approve_payments doit être un booléen');
      }
      if (typeof dto.permissions.can_escalate_to_director !== 'boolean') {
        errors.push('can_escalate_to_director doit être un booléen');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Normalize position title for better matching
  static normalizePositionTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents
  }

  // Check if two positions are similar (for duplicate detection)
  static arePositionsSimilar(pos1: PositionTemplateDTO, pos2: PositionTemplateDTO): boolean {
    const title1 = this.normalizePositionTitle(pos1.title);
    const title2 = this.normalizePositionTitle(pos2.title);
    
    // Exact match
    if (title1 === title2 && pos1.department === pos2.department) {
      return true;
    }

    // Partial match (70% similarity)
    const similarity = this.calculateStringSimilarity(title1, title2);
    return similarity > 0.7 && pos1.department === pos2.department;
  }

  // Simple string similarity calculation
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance algorithm
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
