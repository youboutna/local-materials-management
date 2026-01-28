/**
 * Notification Transformer
 * Converts between domain entities and DTOs for notifications
 */

import { NotificationData } from '@/domain/repositories/INotificationRepository';
import { 
  NotificationDTO, 
  CreateNotificationRequestDTO, 
  UpdateNotificationRequestDTO 
} from '@/dtos/entities/NotificationDTO';

export class NotificationTransformer {
  /**
   * Transform domain entity to response DTO
   */
  static toResponseDto(entity: NotificationData): NotificationDTO {
    return {
      id: entity.id,
      recipient_id: entity.recipient_id,
      title: entity.title,
      message: entity.message,
      type: entity.type as 'info' | 'success' | 'warning' | 'error' | 'system',
      read: entity.read || false,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      priority: entity.priority as 'low' | 'medium' | 'high' || undefined,
      expires_at: entity.expires_at || undefined,
      action_url: entity.action_url || undefined,
      metadata: entity.metadata || undefined,
    };
  }

  /**
   * Transform create request DTO to domain entity
   */
  static fromCreateDtoToDomain(dto: CreateNotificationRequestDTO): Omit<NotificationData, 'id' | 'created_at' | 'updated_at'> {
    const now = new Date().toISOString();
    
    return {
      recipient_id: dto.recipient_id,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      read: false,
      priority: dto.priority || 'medium',
      expires_at: dto.expires_at || null,
      action_url: dto.action_url || null,
      metadata: dto.metadata || null,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Transform update request DTO to domain entity update data
   */
  static fromUpdateDtoToDomain(dto: UpdateNotificationRequestDTO): Partial<NotificationData> {
    const updateData: Partial<NotificationData> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.message !== undefined) updateData.message = dto.message;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.read !== undefined) updateData.read = dto.read;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.expires_at !== undefined) updateData.expires_at = dto.expires_at;
    if (dto.action_url !== undefined) updateData.action_url = dto.action_url;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    return updateData;
  }

  /**
   * Transform array of domain entities to DTOs
   */
  static toResponseDtoArray(entities: NotificationData[]): NotificationDTO[] {
    return entities.map(entity => NotificationTransformer.toResponseDto(entity));
  }

  /**
   * Validate notification data
   */
  static validateNotificationData(data: CreateNotificationRequestDTO): string[] {
    const errors: string[] = [];

    if (!data.recipient_id || data.recipient_id.trim().length === 0) {
      errors.push('Recipient ID is required');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (data.title && data.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push('Message is required');
    }

    if (data.message && data.message.length > 2000) {
      errors.push('Message must be less than 2000 characters');
    }

    const validTypes = ['info', 'success', 'warning', 'error', 'system'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('Invalid notification type');
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    if (data.expires_at && new Date(data.expires_at) <= new Date()) {
      errors.push('Expiration date must be in the future');
    }

    return errors;
  }

  /**
   * Sanitize notification data
   */
  static sanitizeNotificationData(data: CreateNotificationRequestDTO): CreateNotificationRequestDTO {
    return {
      ...data,
      title: data.title?.trim() || '',
      message: data.message?.trim() || '',
      recipient_id: data.recipient_id?.trim() || '',
      type: data.type || 'info',
      priority: data.priority || 'medium',
    };
  }
}
