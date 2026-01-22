/**
 * Auth Domain Transformer
 * Transforms between domain entities and DTOs for authentication
 * Following hexagonal architecture principles
 */

import { User } from '@/domain/entities/User';
import { UserDTO, LoginRequestDto, RegisterRequestDto } from '@/dtos/entities';

export class AuthDomainTransformer {
  /**
   * Transform domain entity to DTO
   */
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      role: user.role,
      is_active: user.isActive,
      last_login: user.lastLogin,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
  }

  /**
   * Transform DTO to domain entity
   */
  static toEntity(dto: UserDTO): User {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.full_name,
      avatarUrl: dto.avatar_url,
      role: dto.role,
      isActive: dto.is_active,
      lastLogin: dto.last_login,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
    };
  }

  /**
   * Transform LoginRequestDto to domain entity
   */
  static toEntityFromLoginDto(dto: LoginRequestDto): Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'> {
    return {
      email: dto.email,
      password: dto.password,
      fullName: dto.full_name || dto.email.split('@')[0],
      avatarUrl: dto.avatar_url,
      role: dto.role || 'user',
      isActive: true
    };
  }

  /**
   * Transform RegisterRequestDto to domain entity
   */
  static toEntityFromRegisterDto(dto: RegisterRequestDto): Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'> {
    return {
      email: dto.email,
      password: dto.password,
      fullName: dto.full_name || dto.email.split('@')[0],
      avatarUrl: dto.avatar_url,
      role: dto.role || 'user',
      isActive: true
    };
  }

  /**
   * Transform domain entity to database row
   */
  static toDatabaseRow(user: User): any {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      role: user.role,
      is_active: user.isActive,
      last_login: user.lastLogin,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };
  }

  /**
   * Transform database row to domain entity
   */
  static toEntityFromDatabaseRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      role: row.role || 'user',
      isActive: row.is_active ?? true,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Transform array of domain entities to DTOs
   */
  static toDTOs(users: User[]): UserDTO[] {
    return users.map(user => this.toDTO(user));
  }

  /**
   * Transform array of DTOs to domain entities
   */
  static toEntities(dtos: UserDTO[]): User[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Transform login response to domain entity
   */
  static toEntityFromLoginResponse(response: any): User {
    return {
      id: response.user.id,
      email: response.user.email,
      fullName: response.user.user_metadata?.full_name || response.user.email.split('@')[0],
      avatarUrl: response.user.user_metadata?.avatar_url,
      role: response.user.user_metadata?.role || 'user',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: response.user.created_at,
      updatedAt: response.user.updated_at
    };
  }

  /**
   * Transform user session to domain entity
   */
  static toEntityFromSession(session: any): User {
    return {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
      avatarUrl: session.user.user_metadata?.avatar_url,
      role: session.user.user_metadata?.role || 'user',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: session.user.created_at,
      updatedAt: session.user.updated_at
    };
  }
}
