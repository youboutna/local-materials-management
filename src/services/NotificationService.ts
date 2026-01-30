/**
 * Legacy Notification Service - Migrated to Hexagonal Architecture
 * Provides backward compatibility while using hexagonal patterns
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationTransformer } from '@/dtos/transforms/NotificationTransformer';
import { 
  NotificationDTO, 
  CreateNotificationRequestDTO 
} from '@/dtos/entities/NotificationDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Legacy DTO interfaces for backward compatibility
export interface CreateNotificationDTO {
  recipient_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'system';
  related_id?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSupplierNotificationDTO {
  supplier_id: string;
  notification_type: string;
  email: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Legacy Notification Service - Hexagonal Compatibility Layer
 * Maintains the same interface for existing components while using hexagonal architecture
 */
export class NotificationService {
  private static getNotificationRepository() {
    return RepositoryFactory.getNotificationRepository();
  }

  /**
   * Create a notification for a user
   */
  static async createNotification(notification: CreateNotificationDTO) {
    try {
      const notificationRepository = this.getNotificationRepository();
      
      // Transform legacy DTO to hexagonal DTO
      const hexagonalDTO: CreateNotificationRequestDTO = {
        recipient_id: notification.recipient_id,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        metadata: {
          ...notification.metadata,
          related_id: notification.related_id
        }
      };

      // Validate and sanitize
      const sanitizedDTO = NotificationTransformer.sanitizeNotificationData(hexagonalDTO);
      const errors = NotificationTransformer.validateNotificationData(sanitizedDTO);
      
      if (errors.length > 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, errors.join(', '));
      }

      // Transform to repository format
      const repositoryData = NotificationTransformer.fromCreateDtoToDomain(sanitizedDTO);

      // Create notification using repository
      const result = await notificationRepository.createNotification(repositoryData);
      
      if (result.error) {
        throw result.error;
      }

      if (!result.notification) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create notification');
      }
      
      // Transform back to response format
      return NotificationTransformer.toResponseDto(result.notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création de la notification'
      );
    }
  }

  /**
   * Create multiple notifications at once
   */
  static async createBatchNotifications(notifications: CreateNotificationDTO[]) {
    try {
      const notificationRepository = this.getNotificationRepository();
      
      // Transform all notifications and create them one by one (repository doesn't support batch)
      const results: NotificationDTO[] = [];
      
      for (const notification of notifications) {
        const hexagonalDTO: CreateNotificationRequestDTO = {
          recipient_id: notification.recipient_id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          metadata: {
            ...notification.metadata,
            related_id: notification.related_id
          }
        };

        // Validate and sanitize each notification
        const sanitizedDTO = NotificationTransformer.sanitizeNotificationData(hexagonalDTO);
        const errors = NotificationTransformer.validateNotificationData(sanitizedDTO);
        
        if (errors.length > 0) {
          throw new AppError(ErrorCode.VALIDATION_ERROR, errors.join(', '));
        }

        // Transform to repository format
        const repositoryData = NotificationTransformer.fromCreateDtoToDomain(sanitizedDTO);

        // Create notification using repository
        const result = await notificationRepository.createNotification(repositoryData);
        
        if (result.error) {
          throw result.error;
        }

        if (!result.notification) {
          throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create notification');
        }

        results.push(NotificationTransformer.toResponseDto(result.notification));
      }
      
      return results;
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création des notifications'
      );
    }
  }

  /**
   * Create a supplier notification (legacy support)
   */
  static async createSupplierNotification(notification: CreateSupplierNotificationDTO) {
    try {
      // For now, create as a regular notification with supplier metadata
      return await this.createNotification({
        recipient_id: notification.supplier_id,
        title: `Supplier ${notification.notification_type}`,
        message: notification.message || `Notification for supplier ${notification.supplier_id}`,
        type: 'info',
        metadata: {
          ...notification.metadata,
          supplier_notification: true,
          notification_type: notification.notification_type,
          email: notification.email
        }
      });
    } catch (error) {
      console.error('Error creating supplier notification:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création de la notification fournisseur'
      );
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limit = 50) {
    try {
      // Validate userId to prevent UUID errors
      if (!userId || userId.trim() === '') {
        console.warn('NotificationService.getUserNotifications: Invalid userId provided, returning empty array');
        return [];
      }

      const notificationRepository = this.getNotificationRepository();
      const result = await notificationRepository.getUserNotifications(userId, limit);
      
      if (result.error) {
        throw result.error;
      }
      
      // Transform to DTOs
      return NotificationTransformer.toResponseDtoArray(result.notifications);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération des notifications'
      );
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      const notificationRepository = this.getNotificationRepository();
      
      const result = await notificationRepository.markAsRead(notificationId);
      
      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la mise à jour de la notification'
      );
    }
  }
}
