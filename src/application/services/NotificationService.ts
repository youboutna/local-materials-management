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

export class NotificationService {
  constructor(private notificationRepository: INotificationRepository) {}

  /**
   * Create notification
   */
  async createNotification(notification: Omit<NotificationData, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationData> {
    try {
      const result = await this.notificationRepository.createNotification(notification);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create notification');
      }

      if (!result.notification) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'No notification created');
      }

      return result.notification;
    } catch (error) {
      console.error('NotificationService.createNotification failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create notification');
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 50): Promise<NotificationData[]> {
    try {
      const result = await this.notificationRepository.getUserNotifications(userId, limit);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get user notifications');
      }

      return result.notifications;
    } catch (error) {
      console.error('NotificationService.getUserNotifications failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get user notifications');
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const result = await this.notificationRepository.markAsRead(notificationId);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('NotificationService.markAsRead failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark notification as read');
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
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete notification');
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
      const result = await this.notificationRepository.getUnreadCount(userId);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get unread count');
      }

      return result.count;
    } catch (error) {
      console.error('NotificationService.getUnreadCount failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get unread count');
    }
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
        type,
        read: false
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
}
