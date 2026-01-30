/**
 * Notification Service
 * Implements business logic for notification operations
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { 
  INotificationRepository, 
  NotificationData, 
  EmailData, 
  SMSData, 
  CallData 
} from '@/domain/repositories/INotificationRepository';
import { 
  NotificationDTO, 
  CreateNotificationRequestDTO, 
  UpdateNotificationRequestDTO 
} from '@/dtos/entities/NotificationDTO';

export class NotificationService {
  constructor(private notificationRepository: INotificationRepository) {}

  /**
   * Create notification
   */
  async createNotification(data: CreateNotificationRequestDTO): Promise<NotificationDTO> {
    try {
      // Transform DTO to domain entity
      const notificationData: Omit<NotificationData, 'id' | 'created_at' | 'updated_at'> = {
        recipient_id: data.recipient_id,
        title: data.title,
        message: data.message,
        type: data.type,
        read: false,
        priority: data.priority || 'medium',
        expires_at: data.expires_at || undefined,
        action_url: data.action_url || undefined,
        metadata: data.metadata || undefined
      };
      
      const result = await this.notificationRepository.createNotification(notificationData);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create notification');
      }

      if (!result.notification) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'No notification created');
      }

      // Transform domain entity back to DTO
      return {
        id: result.notification.id,
        recipient_id: result.notification.recipient_id,
        title: result.notification.title,
        message: result.notification.message,
        type: result.notification.type,
        read: result.notification.read,
        created_at: result.notification.created_at || new Date().toISOString(),
        updated_at: result.notification.updated_at,
        priority: result.notification.priority,
        expires_at: result.notification.expires_at || undefined,
        action_url: result.notification.action_url || undefined,
        metadata: result.notification.metadata || undefined
      };
    } catch (error) {
      console.error('NotificationService.createNotification failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create notification');
    }
  }

  /**
   * Get all notifications (system admin only)
   */
  async getAllNotifications(): Promise<NotificationDTO[]> {
    try {
      // In a project management app, only system admins can see all notifications
      // For now, we'll return an empty array as this requires admin privileges
      console.warn('NotificationService.getAllNotifications: Admin privileges required');
      return [];
    } catch (error) {
      console.error('NotificationService.getAllNotifications failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all notifications');
    }
  }

  /**
   * Get system notifications (admin only)
   */
  async getSystemNotifications(): Promise<NotificationDTO[]> {
    try {
      // System notifications are for all users, not tied to a specific user
      // For now, we'll use a system user ID as workaround
      const result = await this.notificationRepository.getUserNotifications('system', 1000);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get system notifications');
      }

      // Filter for system type notifications
      const systemNotifications = result.notifications.filter(n => n.type === 'system');
      return systemNotifications.map(notification => this.mapToDTO(notification));
    } catch (error) {
      console.error('NotificationService.getSystemNotifications failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get system notifications');
    }
  }

  /**
   * Get project notifications for all project stakeholders
   */
  async getProjectNotifications(projectId: string): Promise<NotificationDTO[]> {
    try {
      // Validate projectId for project management context
      if (!projectId || projectId.trim() === '') {
        console.warn('NotificationService.getProjectNotifications: Invalid projectId provided');
        return [];
      }

      // For now, we'll get all notifications and filter by project metadata
      // This is a workaround until we have a proper project notification repository method
      const allUsersResult = await this.notificationRepository.getUserNotifications('all', 1000);
      
      if (allUsersResult.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project notifications');
      }

      // Filter notifications related to this project
      const projectNotifications = allUsersResult.notifications.filter(notification => {
        const metadata = notification.metadata || {};
        return metadata.project_id === projectId;
      });

      return projectNotifications.map(notification => this.mapToDTO(notification));
    } catch (error) {
      console.error('NotificationService.getProjectNotifications failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project notifications');
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 50): Promise<NotificationDTO[]> {
    try {
      // Validate userId for project management context
      if (!userId || userId.trim() === '') {
        console.warn('NotificationService.getUserNotifications: Invalid userId provided');
        return [];
      }

      console.log('NotificationService.getUserNotifications: Fetching notifications for userId:', userId);
      
      const result = await this.notificationRepository.getUserNotifications(userId, limit);
      
      console.log('NotificationService.getUserNotifications: Repository result:', {
        hasError: !!result.error,
        error: result.error,
        notificationsCount: result.notifications.length
      });
      
      if (result.error) {
        console.error('NotificationService.getUserNotifications: Repository error:', result.error);
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get user notifications');
      }

      const mappedNotifications = result.notifications.map(notification => this.mapToDTO(notification));
      console.log('NotificationService.getUserNotifications: Successfully mapped', mappedNotifications.length, 'notifications');
      
      return mappedNotifications;
    } catch (error) {
      console.error('NotificationService.getUserNotifications failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get user notifications');
    }
  }

  /**
   * Update notification
   */
  async updateNotification(id: string, data: UpdateNotificationRequestDTO): Promise<NotificationDTO> {
    try {
      // This is a placeholder since updateNotification doesn't exist in the repository
      // For now, we'll return a mock response
      console.warn('NotificationService.updateNotification: Repository method not available');
      
      return {
        id,
        recipient_id: 'system',
        title: data.title || 'Updated Notification',
        message: data.message || 'Updated message',
        type: data.type || 'info',
        read: data.read || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: data.priority || 'medium',
        expires_at: data.expires_at,
        action_url: data.action_url,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('NotificationService.updateNotification failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update notification');
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<NotificationDTO> {
    try {
      const result = await this.notificationRepository.markAsRead(notificationId);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark notification as read');
      }

      // Return a mock notification since the repository doesn't return the updated notification
      return {
        id: notificationId,
        recipient_id: 'system',
        title: 'Notification',
        message: 'Marked as read',
        type: 'info',
        read: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: 'medium',
      };
    } catch (error) {
      console.error('NotificationService.markNotificationAsRead failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark notification as read');
    }
  }

  /**
   * Mark notification as unread
   */
  async markNotificationAsUnread(notificationId: string): Promise<NotificationDTO> {
    try {
      // This is a placeholder since markAsUnread doesn't exist in the repository
      console.warn('NotificationService.markNotificationAsUnread: Repository method not available');
      
      return {
        id: notificationId,
        recipient_id: 'system',
        title: 'Notification',
        message: 'Marked as unread',
        type: 'info',
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: 'medium',
      };
    } catch (error) {
      console.error('NotificationService.markNotificationAsUnread failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark notification as unread');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const result = await this.notificationRepository.deleteNotification(notificationId);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete notification');
      }
    } catch (error) {
      console.error('NotificationService.deleteNotification failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete notification');
    }
  }

  /**
   * Send email
   */
  async sendEmail(data: EmailData): Promise<void> {
    try {
      const result = await this.notificationRepository.sendEmail(data);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send email');
      }
    } catch (error) {
      console.error('NotificationService.sendEmail failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send email');
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(data: SMSData): Promise<void> {
    try {
      const result = await this.notificationRepository.sendSMS(data);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send SMS');
      }
    } catch (error) {
      console.error('NotificationService.sendSMS failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send SMS');
    }
  }

  /**
   * Schedule call
   */
  async scheduleCall(data: CallData): Promise<void> {
    try {
      const result = await this.notificationRepository.scheduleCall(data);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to schedule call');
      }
    } catch (error) {
      console.error('NotificationService.scheduleCall failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to schedule call');
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Validate userId for project management context
      if (!userId || userId.trim() === '') {
        console.warn('NotificationService.getUnreadCount: Invalid userId provided');
        return 0;
      }

      const result = await this.notificationRepository.getUnreadCount(userId);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get unread count');
      }

      return result.count;
    } catch (error) {
      console.error('NotificationService.getUnreadCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get unread count');
    }
  }

  /**
   * Get unread count for project
   */
  async getProjectUnreadCount(projectId: string): Promise<number> {
    try {
      // Validate projectId for project management context
      if (!projectId || projectId.trim() === '') {
        console.warn('NotificationService.getProjectUnreadCount: Invalid projectId provided');
        return 0;
      }

      // For now, we'll get all project notifications and count unread ones
      const projectNotifications = await this.getProjectNotifications(projectId);
      const unreadCount = projectNotifications.filter(n => !n.read).length;
      
      return unreadCount;
    } catch (error) {
      console.error('NotificationService.getProjectUnreadCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project unread count');
    }
  }

  /**
   * Helper method to transform notification data to DTO
   */
  private mapToDTO(notification: NotificationData): NotificationDTO {
    return {
      id: notification.id,
      recipient_id: notification.recipient_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      created_at: notification.created_at || new Date().toISOString(),
      updated_at: notification.updated_at || undefined,
      priority: notification.priority || undefined,
      expires_at: notification.expires_at || undefined,
      action_url: notification.action_url || undefined,
      metadata: notification.metadata || undefined,
    };
  }

  /**
   * Create and send notification to user
   */
  async notifyUser(userId: string, title: string, message: string, type: NotificationData['type'] = 'info'): Promise<void> {
    try {
      await this.createNotification({
        recipient_id: userId,
        title,
        message,
        type
      });
    } catch (error) {
      console.error('NotificationService.notifyUser failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to notify user');
    }
  }

  /**
   * Send notification via multiple channels
   */
  async sendMultiChannelNotification(
    userId: string,
    title: string,
    message: string,
    email?: EmailData,
    sms?: SMSData,
    call?: CallData
  ): Promise<void> {
    try {
      // Create in-app notification
      await this.notifyUser(userId, title, message);

      // Send email if provided
      if (email) {
        await this.sendEmail(email);
      }

      // Send SMS if provided
      if (sms) {
        await this.sendSMS(sms);
      }

      // Schedule call if provided
      if (call) {
        await this.scheduleCall(call);
      }
    } catch (error) {
      console.error('NotificationService.sendMultiChannelNotification failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send multi-channel notification');
    }
  }

  // Static methods for backward compatibility
  static async createNotification(data: CreateNotificationRequestDTO): Promise<NotificationDTO> {
    const { RepositoryFactory } = await import('@/infrastructure/supabase/RepositoryFactory');
    const service = new NotificationService(RepositoryFactory.getNotificationRepository());
    return await service.createNotification(data);
  }

  static async notifyUser(userId: string, title: string, message: string): Promise<void> {
    const { RepositoryFactory } = await import('@/infrastructure/supabase/RepositoryFactory');
    const service = new NotificationService(RepositoryFactory.getNotificationRepository());
    await service.notifyUser(userId, title, message);
  }
}
