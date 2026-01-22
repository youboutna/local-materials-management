/**
 * Realtime Service
 * Implements business logic for real-time subscription operations
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { 
  IRealtimeRepository, 
  RealtimeSubscription, 
  RealtimePayload 
} from '@/domain/repositories/IRealtimeRepository';

export class RealtimeService {
  constructor(private realtimeRepository: IRealtimeRepository) {}

  /**
   * Subscribe to tender submission updates for a specific user
   */
  async subscribeToSubmissionUpdates(
    userId: string, 
    callback: (payload: RealtimePayload) => void
  ): Promise<string> {
    try {
      const subscription: RealtimeSubscription = {
        id: `submission-updates-${userId}`,
        table: 'tender_submissions',
        filter: `user_id=eq.${userId}`,
        event: '*',
        callback
      };

      const subscriptionId = await this.realtimeRepository.subscribe(subscription);
      
      console.log(`Subscribed to submission updates for user: ${userId}`);
      return subscriptionId;
    } catch (error) {
      console.error('RealtimeService.subscribeToSubmissionUpdates failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to subscribe to submission updates');
    }
  }

  /**
   * Subscribe to document updates for a specific submission
   */
  async subscribeToDocumentUpdates(
    submissionId: string,
    callback: (payload: RealtimePayload) => void
  ): Promise<string> {
    try {
      const subscription: RealtimeSubscription = {
        id: `document-updates-${submissionId}`,
        table: 'submission_documents',
        filter: `submission_id=eq.${submissionId}`,
        event: '*',
        callback
      };

      const subscriptionId = await this.realtimeRepository.subscribe(subscription);
      
      console.log(`Subscribed to document updates for submission: ${submissionId}`);
      return subscriptionId;
    } catch (error) {
      console.error('RealtimeService.subscribeToDocumentUpdates failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to subscribe to document updates');
    }
  }

  /**
   * Subscribe to notification updates for a specific user
   */
  async subscribeToNotificationUpdates(
    userId: string,
    callback: (payload: RealtimePayload) => void
  ): Promise<string> {
    try {
      const subscription: RealtimeSubscription = {
        id: `notification-updates-${userId}`,
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
        event: '*',
        callback
      };

      const subscriptionId = await this.realtimeRepository.subscribe(subscription);
      
      console.log(`Subscribed to notification updates for user: ${userId}`);
      return subscriptionId;
    } catch (error) {
      console.error('RealtimeService.subscribeToNotificationUpdates failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to subscribe to notification updates');
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    try {
      await this.realtimeRepository.unsubscribe(subscriptionId);
      console.log(`Unsubscribed from: ${subscriptionId}`);
    } catch (error) {
      console.error('RealtimeService.unsubscribe failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to unsubscribe');
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    try {
      await this.realtimeRepository.unsubscribeAll();
      console.log('Unsubscribed from all subscriptions');
    } catch (error) {
      console.error('RealtimeService.unsubscribeAll failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to unsubscribe from all subscriptions');
    }
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.realtimeRepository.getActiveSubscriptionsCount();
  }

  /**
   * Process submission status change payload
   */
  processSubmissionStatusChange(payload: RealtimePayload): {
    isNew: boolean;
    statusChanged: boolean;
    newStatus?: string;
    oldStatus?: string;
  } {
    const isNew = payload.eventType === 'INSERT';
    const statusChanged = payload.eventType === 'UPDATE' && 
      payload.new?.status !== payload.old?.status;

    return {
      isNew,
      statusChanged,
      newStatus: payload.new?.status as string,
      oldStatus: payload.old?.status as string
    };
  }
}
