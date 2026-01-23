/**
 * Project Domain Transformer - Simplified and Fixed
 * Handles conversion between Project entity and ProjectDTO
 * Following hexagonal architecture principles
 */

import { Project } from '@/domain/entities/Project';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';

export class ProjectDomainTransformer {
  /**
   * Transform Project entity to ProjectDTO
   * Converts Date objects to ISO strings
   */
  static toDTO(entity: Project): ProjectDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description || '',
      location: entity.location || '',
      status: entity.status,
      progress: entity.progress || 0,
      budget: entity.budget || 0,
      startDate: entity.startDate ? entity.startDate.toISOString() : new Date().toISOString(),
      endDate: entity.endDate ? entity.endDate.toISOString() : undefined,
      thumbnail: entity.thumbnail || '',
      teamSize: entity.teamSize || 0,
      coordinates: entity.coordinates ? {
        latitude: entity.coordinates.latitude,
        longitude: entity.coordinates.longitude
      } : undefined,
      
      // Additional fields from domain entity
      geographicZone: '', // Default values for now
      terrainType: '',
      environmentalConstraints: '',
      forme: '',
      adresse: '',
      localisation: [],
      marketType: '',
      selectionMode: '',
      launchDate: entity.startDate?.toISOString(),
      attributionDate: entity.endDate?.toISOString(),
      projectReference: '',
      allowsInitialPayment: false,
      initialPaymentPercentage: 0,
      currentPhase: '',
      currentStage: '',
      
      // BaseEntityDTO fields
      createdAt: entity.startDate?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Transform ProjectDTO to Project entity
   * Converts ISO strings to Date objects
   */
  static fromDTO(dto: ProjectDTO): Project {
    return new Project(
      dto.id,
      dto.title,
      dto.description,
      dto.status,
      dto.progress,
      dto.budget,
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
      dto.location,
      dto.coordinates ? {
        latitude: dto.coordinates.latitude || 0,
        longitude: dto.coordinates.longitude || 0
      } : undefined,
      dto.teamSize,
      dto.thumbnail
    );
  }

  /**
   * Transform Project entity to ProjectDTO (alias for toDTO)
   */
  static fromEntityToDTO(entity: Project): ProjectDTO {
    return this.toDTO(entity);
  }

  /**
   * Transform ProjectDTO to Project entity (alias for fromDTO)
   */
  static toEntity(dto: ProjectDTO): Project {
    return this.fromDTO(dto);
  }

  /**
   * Transform Project entity to ProjectDTO (alias for toDTO)
   */
  static toResponseDto(entity: Project): ProjectDTO {
    return this.toDTO(entity);
  }
}
