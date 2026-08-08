/**
 * Service: StakeholderService
 * Gère les parties prenantes avec architecture hexagonale
 */

import { Stakeholder } from '@/domain/entities/Stakeholder';
import { IStakeholderRepository } from '@/domain/repositories/IStakeholderRepository';

import { 
  StakeholderDTO, 
  CreateStakeholderRequestDTO, 
  UpdateStakeholderRequestDTO, 
  StakeholderResponseDTO,
  StakeholderServiceResult,
  StakeholderListResult,
  StakeholderType,
  StakeholderRole
} from '@/dtos/entities/StakeholderDTO';
import { StakeholderTransformer } from '@/dtos/transforms/StakeholderTransformer';

const StakeholderRoles = {
  [StakeholderType.EMPLOYEE]: ['project_manager', 'team_lead', 'developer', 'analyst'],
  [StakeholderType.EXTERNAL]: ['consultant', 'contractor', 'vendor', 'partner'],
  [StakeholderType.CLIENT]: ['owner', 'representative', 'manager', 'contact'],
  [StakeholderType.VENDOR]: ['supplier', 'material_provider', 'service_provider'],
  [StakeholderType.PARTNER]: ['strategic_partner', 'operational_partner'],
  [StakeholderType.REGULATOR]: ['inspector', 'auditor', 'compliance_officer'],
  [StakeholderType.INVESTOR]: ['investor', 'funder', 'sponsor']
} as const;

export class StakeholderService {
  constructor(private stakeholderRepository: IStakeholderRepository) {}

  /**
   * Crée une nouvelle partie prenante
   */
  async createStakeholder(data: CreateStakeholderRequestDTO): Promise<StakeholderServiceResult> {
    try {
      console.info('STAKEHOLDER_SERVICE_001: Creating stakeholder', {
        code: 'STAKEHOLDER_SERVICE_001',
        message: 'Début de la création de partie prenante',
        projectId: data.projectId,
        type: data.type,
        role: data.role,
        stack: new Error().stack
      });

      // Validation des données
      const validation = StakeholderTransformer.validateCreateDTO(data);
      if (!validation.isValid) {
        console.error('STAKEHOLDER_SERVICE_002: Validation failed', {
          code: 'STAKEHOLDER_SERVICE_002',
          message: 'Échec de validation des données',
          errors: validation.errors,
          stack: new Error().stack
        });

        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Données invalides',
            details: validation.errors
          }
        };
      }

      // Validate type
      if (!isValidStakeholderType(data.type)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid stakeholder type',
            details: { type: ['Invalid stakeholder type'] }
          }
        };
      }

      // Validate role if provided
      if (data.role && !isValidStakeholderRole(data.type, data.role)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role for stakeholder type',
            details: { 
              role: [`Invalid role '${data.role}' for type '${data.type}'`],
              validRoles: StakeholderRoles[data.type]
            }
          }
        };
      }

      // Transformation en entité
      const entity = StakeholderTransformer.fromCreateDTOToEntity(data);

      // Validation de l'entité
      const entityValidation = entity.validate();
      if (!entityValidation.isValid) {
        console.error('STAKEHOLDER_SERVICE_003: Entity validation failed', {
          code: 'STAKEHOLDER_SERVICE_003',
          message: 'Échec de validation de l\'entité',
          errors: entityValidation.errors,
          stack: new Error().stack
        });

        return {
          success: false,
          error: {
            code: 'ENTITY_VALIDATION_ERROR',
            message: 'Entité invalide',
            details: entityValidation.errors
          }
        };
      }

      // Persistance
      const savedEntity = await this.stakeholderRepository.save(entity);

      console.info('STAKEHOLDER_SERVICE_004: Stakeholder created successfully', {
        code: 'STAKEHOLDER_SERVICE_004',
        message: 'Partie prenante créée avec succès',
        stakeholderId: savedEntity.id,
        projectId: savedEntity.projectId,
        stack: new Error().stack
      });

      return {
        success: true,
        data: StakeholderTransformer.toResponseDTO(savedEntity)
      };

    } catch (error) {
      console.error('STAKEHOLDER_SERVICE_005: Failed to create stakeholder', {
        code: 'STAKEHOLDER_SERVICE_005',
        message: 'Échec de la création de partie prenante',
        technicalError: error,
        stack: new Error().stack
      });

      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors de la création de la partie prenante',
          details: error
        }
      };
    }
  }

  /**
   * Met à jour une partie prenante
   */
  async updateStakeholder(id: string, data: UpdateStakeholderRequestDTO): Promise<StakeholderServiceResult> {
    try {
      console.info('STAKEHOLDER_SERVICE_006: Updating stakeholder', {
        code: 'STAKEHOLDER_SERVICE_006',
        message: 'Début de la mise à jour de partie prenante',
        stakeholderId: id,
        stack: new Error().stack
      });

      // Validation des données
      const validation = StakeholderTransformer.validateUpdateDTO(data);
      if (!validation.isValid) {
        console.error('STAKEHOLDER_SERVICE_007: Update validation failed', {
          code: 'STAKEHOLDER_SERVICE_007',
          message: 'Échec de validation des données de mise à jour',
          errors: validation.errors,
          stack: new Error().stack
        });

        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Données de mise à jour invalides',
            details: validation.errors
          }
        };
      }

      // Validate type
      if (data.type && !isValidStakeholderType(data.type)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid stakeholder type',
            details: { type: ['Invalid stakeholder type'] }
          }
        };
      }

      // Validate role if provided
      if (data.role && data.type && !isValidStakeholderRole(data.type, data.role)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role for stakeholder type',
            details: { 
              role: [`Invalid role '${data.role}' for type '${data.type}'`],
              validRoles: data.type ? [...(StakeholderRoles[data.type] || [])] : []
            }
          }
        };
      }

      // Récupération de l'entité existante
      const existingEntity = await this.stakeholderRepository.findById(id);
      if (!existingEntity) {
        console.error('STAKEHOLDER_SERVICE_008: Stakeholder not found', {
          code: 'STAKEHOLDER_SERVICE_008',
          message: 'Partie prenante non trouvée',
          stakeholderId: id,
          stack: new Error().stack
        });

        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partie prenante non trouvée'
          }
        };
      }

      // Application des mises à jour
      const updatedEntity = await this.stakeholderRepository.update(id, data);

      console.info('STAKEHOLDER_SERVICE_009: Stakeholder updated successfully', {
        code: 'STAKEHOLDER_SERVICE_009',
        message: 'Partie prenante mise à jour avec succès',
        stakeholderId: id,
        stack: new Error().stack
      });

      return {
        success: true,
        data: StakeholderTransformer.toResponseDTO(updatedEntity)
      };

    } catch (error) {
      console.error('STAKEHOLDER_SERVICE_010: Failed to update stakeholder', {
        code: 'STAKEHOLDER_SERVICE_010',
        message: 'Échec de la mise à jour de partie prenante',
        stakeholderId: id,
        technicalError: error,
        stack: new Error().stack
      });

      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors de la mise à jour de la partie prenante',
          details: error
        }
      };
    }
  }

  /**
   * Récupère une partie prenante par son ID
   */
  async getStakeholderById(id: string): Promise<StakeholderServiceResult> {
    try {
      console.info('STAKEHOLDER_SERVICE_011: Getting stakeholder', {
        code: 'STAKEHOLDER_SERVICE_011',
        message: 'Récupération de partie prenante',
        stakeholderId: id,
        stack: new Error().stack
      });

      const entity = await this.stakeholderRepository.findById(id);
      if (!entity) {
        console.error('STAKEHOLDER_SERVICE_012: Stakeholder not found', {
          code: 'STAKEHOLDER_SERVICE_012',
          message: 'Partie prenante non trouvée',
          stakeholderId: id,
          stack: new Error().stack
        });

        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partie prenante non trouvée'
          }
        };
      }

      return {
        success: true,
        data: StakeholderTransformer.toResponseDTO(entity)
      };

    } catch (error) {
      console.error('STAKEHOLDER_SERVICE_013: Failed to get stakeholder', {
        code: 'STAKEHOLDER_SERVICE_013',
        message: 'Échec de la récupération de partie prenante',
        stakeholderId: id,
        technicalError: error,
        stack: new Error().stack
      });

      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors de la récupération de la partie prenante',
          details: error
        }
      };
    }
  }

  /**
   * Récupère toutes les parties prenantes d'un projet
   */
  async getStakeholdersByProject(projectId: string): Promise<StakeholderListResult> {
    try {
      console.info('STAKEHOLDER_SERVICE_014: Getting project stakeholders', {
        code: 'STAKEHOLDER_SERVICE_014',
        message: 'Récupération des parties prenantes du projet',
        projectId,
        stack: new Error().stack
      });

      const entities = await this.stakeholderRepository.findByProjectId(projectId);
      const dtos = entities.map(entity => StakeholderTransformer.toResponseDTO(entity));

      return {
        success: true,
        data: dtos
      };

    } catch (error) {
      console.error('STAKEHOLDER_SERVICE_015: Failed to get project stakeholders', {
        code: 'STAKEHOLDER_SERVICE_015',
        message: 'Échec de la récupération des parties prenantes du projet',
        projectId,
        technicalError: error,
        stack: new Error().stack
      });

      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors de la récupération des parties prenantes',
          details: error
        }
      };
    }
  }

  /**
   * Supprime une partie prenante
   */
  async deleteStakeholder(id: string): Promise<StakeholderServiceResult> {
    try {
      console.info('STAKEHOLDER_SERVICE_016: Deleting stakeholder', {
        code: 'STAKEHOLDER_SERVICE_016',
        message: 'Suppression de partie prenante',
        stakeholderId: id,
        stack: new Error().stack
      });

      // Vérification de l'existence
      const existingEntity = await this.stakeholderRepository.findById(id);
      if (!existingEntity) {
        console.error('STAKEHOLDER_SERVICE_017: Stakeholder not found for deletion', {
          code: 'STAKEHOLDER_SERVICE_017',
          message: 'Partie prenante non trouvée pour suppression',
          stakeholderId: id,
          stack: new Error().stack
        });

        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Partie prenante non trouvée'
          }
        };
      }

      await this.stakeholderRepository.delete(id);

      console.info('STAKEHOLDER_SERVICE_018: Stakeholder deleted successfully', {
        code: 'STAKEHOLDER_SERVICE_018',
        message: 'Partie prenante supprimée avec succès',
        stakeholderId: id,
        stack: new Error().stack
      });

      return {
        success: true
      };

    } catch (error) {
      console.error('STAKEHOLDER_SERVICE_019: Failed to delete stakeholder', {
        code: 'STAKEHOLDER_SERVICE_019',
        message: 'Échec de la suppression de partie prenante',
        stakeholderId: id,
        technicalError: error,
        stack: new Error().stack
      });

      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors de la suppression de la partie prenante',
          details: error
        }
      };
    }
  }

  /**
   * Active/désactive une partie prenante
   */
  async toggleStakeholderStatus(id: string, isActive: boolean): Promise<StakeholderServiceResult> {
    try {
      console.info('STAKEHOLDER_SERVICE_020: Toggling stakeholder status', {
        code: 'STAKEHOLDER_SERVICE_020',
        message: 'Changement de statut de partie prenante',
        stakeholderId: id,
        isActive,
        stack: new Error().stack
      });

      const result = await this.updateStakeholder(id, { isActive } as UpdateStakeholderRequestDTO);

      if (result.success) {
        console.info('STAKEHOLDER_SERVICE_021: Status toggled successfully', {
          code: 'STAKEHOLDER_SERVICE_021',
          message: 'Statut changé avec succès',
          stakeholderId: id,
          newStatus: isActive,
          stack: new Error().stack
        });
      }

      return result;

    } catch (error) {
      console.error('STAKEHOLDER_SERVICE_022: Failed to toggle status', {
        code: 'STAKEHOLDER_SERVICE_022',
        message: 'Échec du changement de statut',
        stakeholderId: id,
        technicalError: error,
        stack: new Error().stack
      });

      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors du changement de statut',
          details: error
        }
      };
    }
  }
}

// Enhanced type guards
function isValidStakeholderType(type: string): type is StakeholderType {
  return Object.values(StakeholderType).includes(type as StakeholderType);
}

function isValidStakeholderRole(
  type: StakeholderType | undefined,
  role: string
): boolean {
  if (!type) return false;
  const validRoles = StakeholderRoles[type] as readonly string[] | undefined;
  return validRoles?.includes(role) ?? false;
}

let stakeholderServiceInstance: StakeholderService | null = null;
export function getStakeholderService(): StakeholderService {
  if (!stakeholderServiceInstance) {
    stakeholderServiceInstance = new StakeholderService(RepositoryFactory.getStakeholderRepository());
  }
  return stakeholderServiceInstance;
}
