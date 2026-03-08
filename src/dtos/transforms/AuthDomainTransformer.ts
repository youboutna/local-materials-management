/**
 * Auth Domain Transformer
 * Transforms between domain entities and DTOs for authentication
 * Uses `any` casts for cross-layer compatibility during migration
 */

import { User } from '@/domain/entities/User';
import { UserDTO } from '@/dtos/entities';

// Local auth request types
export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export class AuthDomainTransformer {
  static toDTO(user: any): UserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name || '',
      avatarUrl: user.avatar || user.avatarUrl || user.avatar_url || null,
      isActive: user.isActive ?? user.is_active ?? true,
      lastLogin: user.lastLogin || user.last_login || null,
      createdAt: user.createdAt || user.created_at || '',
      updatedAt: user.updatedAt || user.updated_at || '',
    } as UserDTO;
  }

  static toEntity(dto: any): any {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.fullName || dto.full_name || '',
      avatar: dto.avatarUrl || dto.avatar_url || null,
      isActive: dto.isActive ?? dto.is_active ?? true,
      lastLogin: dto.lastLogin || dto.last_login || null,
      createdAt: dto.createdAt || dto.created_at || '',
      updatedAt: dto.updatedAt || dto.updated_at || '',
    };
  }

  static toEntityFromLoginDto(dto: LoginRequestDto): any {
    return {
      email: dto.email,
      fullName: '',
      avatar: null,
      isActive: true,
    };
  }

  static toEntityFromRegisterDto(dto: RegisterRequestDto): any {
    return {
      email: dto.email,
      fullName: dto.fullName,
      avatar: null,
      isActive: true,
      phone: dto.phone,
    };
  }

  static toProfileDTO(user: any): any {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name || '',
      avatar: user.avatar || user.avatarUrl || null,
      isActive: user.isActive ?? true,
    };
  }

  static toProfileEntity(dto: any): any {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.fullName || '',
      avatar: dto.avatar || dto.avatarUrl || null,
      isActive: dto.isActive ?? true,
    };
  }

  static toSessionDTO(session: any): any {
    return {
      accessToken: session.access_token || session.accessToken,
      refreshToken: session.refresh_token || session.refreshToken,
      expiresAt: session.expires_at || session.expiresAt,
      user: session.user ? AuthDomainTransformer.toDTO(session.user) : null,
    };
  }

  static toSessionEntity(dto: any): any {
    return {
      accessToken: dto.accessToken || dto.access_token,
      refreshToken: dto.refreshToken || dto.refresh_token,
      expiresAt: dto.expiresAt || dto.expires_at,
      user: dto.user ? AuthDomainTransformer.toEntity(dto.user) : null,
    };
  }
}
