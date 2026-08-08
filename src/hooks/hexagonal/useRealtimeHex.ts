/**
 * Hexagonal hook for real-time subscriptions
 * Centralizes real-time operations using hexagonal architecture
 */

import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RealtimeService, SubscribeToSubmissionUpdatesRequestDto, SubscribeToDocumentUpdatesRequestDto, SubscribeToNotificationUpdatesRequestDto, getRealtimeService} from '@/application/services/RealtimeService';
import type { RealtimePayload } from '@/domain/repositories/IRealtimeRepository';

export interface UseRealtimeOptions {
  userId?: string;
  onSubmissionInsert?: (payload: RealtimePayload) => void;
  onSubmissionUpdate?: (payload: RealtimePayload) => void;
  onDocumentChange?: (payload: RealtimePayload) => void;
  onNotificationChange?: (payload: RealtimePayload) => void;
}

export const useRealtimeHex = (options: UseRealtimeOptions = {}) => {
  const { toast } = useToast();
  const realtimeServiceRef = useRef<RealtimeService | null>(null);
  const subscriptionIdsRef = useRef<string[]>([]);

  // Initialize service
  useEffect(() => {
    realtimeServiceRef.current = getRealtimeService();

    return () => {
      // Cleanup on unmount
      if (realtimeServiceRef.current) {
        subscriptionIdsRef.current.forEach(id => {
          realtimeServiceRef.current?.unsubscribe(id).catch(console.error);
        });
        realtimeServiceRef.current.unsubscribeAll().catch(console.error);
      }
    };
  }, []);

  // Handle submission updates
  const handleSubmissionUpdate = useCallback((payload: RealtimePayload) => {
    const processed = realtimeServiceRef.current?.processSubmissionStatusChange(payload);
    
    if (!processed) return;

    if (processed.isNew && options.onSubmissionInsert) {
      options.onSubmissionInsert(payload);
      
      toast({
        title: "Nouvelle soumission",
        description: "Votre soumission a été enregistrée avec succès.",
      });
    } else if (processed.statusChanged && options.onSubmissionUpdate) {
      options.onSubmissionUpdate(payload);
      
      if (processed.newStatus !== processed.oldStatus) {
        const statusLabels = {
          submitted: 'Soumise',
          under_review: 'En cours d\'évaluation',
          approved: 'Approuvée',
          rejected: 'Rejetée'
        };
        
        toast({
          title: "Mise à jour du statut",
          description: `Le statut de votre soumission a changé: ${statusLabels[processed.newStatus as keyof typeof statusLabels] || processed.newStatus}`,
        });
      }
    }
  }, [toast, options]);

  // Subscribe to submission updates
  const subscribeToSubmissionUpdates = useCallback(async () => {
    if (!options.userId || !realtimeServiceRef.current) return;

    try {
      const subscriptionId = await realtimeServiceRef.current.subscribeToSubmissionUpdates({
        userId: options.userId,
        callback: handleSubmissionUpdate
      });
      
      subscriptionIdsRef.current.push(subscriptionId);
      console.log('Realtime subscription set up for user:', options.userId);
    } catch (error) {
      console.error('Failed to subscribe to submission updates:', error);
    }
  }, [options, handleSubmissionUpdate]);

  // Subscribe to document updates for a specific submission
  const subscribeToDocumentUpdates = useCallback(async (submissionId: string) => {
    if (!realtimeServiceRef.current) return;

    try {
      const subscriptionId = await realtimeServiceRef.current.subscribeToDocumentUpdates({
        submissionId,
        callback: options.onDocumentChange || (() => {})
      });
      
      subscriptionIdsRef.current.push(subscriptionId);
      console.log('Document subscription set up for submission:', submissionId);
    } catch (error) {
      console.error('Failed to subscribe to document updates:', error);
    }
  }, [options]);

  // Subscribe to notification updates
  const subscribeToNotificationUpdates = useCallback(async () => {
    if (!options.userId || !realtimeServiceRef.current) return;

    try {
      const subscriptionId = await realtimeServiceRef.current.subscribeToNotificationUpdates({
        userId: options.userId,
        callback: options.onNotificationChange || (() => {})
      });
      
      subscriptionIdsRef.current.push(subscriptionId);
      console.log('Notification subscription set up for user:', options.userId);
    } catch (error) {
      console.error('Failed to subscribe to notification updates:', error);
    }
  }, [options]);

  // Setup subscriptions when userId changes
  useEffect(() => {
    if (options.userId) {
      subscribeToSubmissionUpdates();
      subscribeToNotificationUpdates();
    }
  }, [options.userId, subscribeToSubmissionUpdates, subscribeToNotificationUpdates]);

  // Cleanup specific subscription
  const unsubscribe = useCallback(async (subscriptionId: string) => {
    if (!realtimeServiceRef.current) return;

    try {
      await realtimeServiceRef.current.unsubscribe(subscriptionId);
      subscriptionIdsRef.current = subscriptionIdsRef.current.filter(id => id !== subscriptionId);
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  }, []);

  // Get active subscriptions count
  const getActiveSubscriptionsCount = useCallback(() => {
    return realtimeServiceRef.current?.getActiveSubscriptionsCount() || 0;
  }, []);

  return {
    subscribeToSubmissionUpdates,
    subscribeToDocumentUpdates,
    subscribeToNotificationUpdates,
    unsubscribe,
    unsubscribeAll: () => realtimeServiceRef.current?.unsubscribeAll(),
    getActiveSubscriptionsCount
  };
};