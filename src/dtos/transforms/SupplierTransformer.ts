/**
 * SupplierTransformer - Transformer pour les entités Supplier
 * Respecte l'architecture hexagonale : Entity ↔ DTO
 * Compatible avec les DTOs legacy existants
 */

import { Supplier, SupplierCategory, SupplierStatus } from '@/domain/entities/Supplier';

// DTO legacy compatible avec le code existant
export interface SupplierDTO {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

export class SupplierTransformer {
  /**
   * Transformer une entité Supplier en DTO legacy
   */
  static toDTO(entity: Supplier): SupplierDTO {
    return {
      id: entity.id,
      name: entity.name,
      contact_person: entity.contacts[0]?.name || undefined,
      email: entity.email || undefined,
      phone: entity.phone || undefined
    };
  }

  /**
   * Transformer un DTO legacy en entité Supplier
   */
  static toEntity(dto: SupplierDTO): Supplier {
    return new Supplier(
      dto.id,
      dto.name,
      dto.email || null,
      dto.phone || null,
      null, // address
      null, // nif
      null, // category
      'active' as SupplierStatus, // status par défaut
      null, // rating
      dto.contact_person ? [{ name: dto.contact_person, email: dto.email || '', phone: dto.phone || '' }] : [], // contacts
      false, // isVerified
      null, // verifiedAt
      null, // workspaceId
      new Date().toISOString(), // createdAt
      new Date().toISOString()  // updatedAt
    );
  }

  /**
   * Transformer un tableau d'entités en tableau de DTOs
   */
  static toDTOList(entities: Supplier[]): SupplierDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Transformer un tableau de DTOs en tableau d'entités
   */
  static toEntityList(dtos: SupplierDTO[]): Supplier[] {
    return dtos.map(dto => this.toEntity(dto));
  }
}
