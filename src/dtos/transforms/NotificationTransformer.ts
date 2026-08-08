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
      recipientId: entity.recipient_id,
      title: entity.title,
      message: entity.message,
      type: entity.type as 'info' | 'success' | 'warning' | 'error' | 'system',
      read: entity.read || false,
      createdAt: entity.created_at || new Date().toISOString(),
      updatedAt: entity.updated_at,
      priority: entity.priority as 'low' | 'medium' | 'high' || undefined,
      expiresAt: entity.expires_at || undefined,
      actionUrl: entity.action_url || undefined,
      metadata: entity.metadata || undefined,
    };
  }

  /**
   * Transform create request DTO to domain entity
   */
  static fromCreateDtoToDomain(dto: CreateNotificationRequestDTO): Omit<NotificationData, 'id' | 'created_at' | 'updated_at'> {
    return {
      recipient_id: dto.recipientId,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      read: false,
      priority: dto.priority || 'medium',
      expires_at: dto.expiresAt || null,
      action_url: dto.actionUrl || null,
      metadata: dto.metadata || null,
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
    if (dto.expiresAt !== undefined) updateData.expires_at = dto.expiresAt;
    if (dto.actionUrl !== undefined) updateData.action_url = dto.actionUrl;
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

    if (!data.recipientId || data.recipientId.trim().length === 0) {
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

    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
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
      recipientId: data.recipientId?.trim() || '',
      type: data.type || 'info',
      priority: data.priority || 'medium',
    };
  }
}
