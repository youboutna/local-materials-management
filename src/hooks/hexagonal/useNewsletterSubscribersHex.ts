/**
 * useNewsletterSubscribersHex - Hexagonal Hook for Newsletter Subscribers
 * React hook for newsletter subscriber management using hexagonal architecture
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NewsletterSubscriberService } from '@/application/services/NewsletterSubscriberService';
import {
  CreateSubscriberDTO,
  UpdateSubscriberDTO,
  SubscriberListDTO,
  SubscriberStatus,
} from '@/dtos/entities/NewsletterSubscriberDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

const subscriberService = new NewsletterSubscriberService(
  RepositoryFactory.getNewsletterSubscriberRepository(),
  RepositoryFactory.getNewsletterSubscriptionGateway(),
);

export function useNewsletterSubscribersHex() {
  const queryClient = useQueryClient();

  // Query: Get all subscribers
  const useAllSubscribers = (status?: SubscriberStatus) => {
    return useQuery({
      queryKey: ['newsletter-subscribers', status],
      queryFn: () => subscriberService.getAllSubscribers(status),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Query: Get subscriber by ID
  const useSubscriberById = (id: string) => {
    return useQuery({
      queryKey: ['newsletter-subscriber', id],
      queryFn: () => subscriberService.getSubscriberById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Query: Get subscriber by email
  const useSubscriberByEmail = (email: string) => {
    return useQuery({
      queryKey: ['newsletter-subscriber', 'email', email],
      queryFn: () => subscriberService.getSubscriberByEmail(email),
      enabled: !!email,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Query: Get active subscribers
  const useActiveSubscribers = () => {
    return useQuery({
      queryKey: ['newsletter-subscribers', 'active'],
      queryFn: () => subscriberService.getActiveSubscribers(),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Query: Search subscribers
  const useSearchSubscribers = (term: string) => {
    return useQuery({
      queryKey: ['newsletter-subscribers', 'search', term],
      queryFn: () => subscriberService.searchSubscribers(term),
      enabled: term.length > 2,
      staleTime: 2 * 60 * 1000,
    });
  };

  // Query: Count active subscribers
  const useCountActiveSubscribers = () => {
    return useQuery({
      queryKey: ['newsletter-subscribers', 'count'],
      queryFn: () => subscriberService.countActiveSubscribers(),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Mutation: Subscribe (public facing)
  const useSubscribe = () => {
    return useMutation({
      mutationFn: (dto: CreateSubscriberDTO) => subscriberService.subscribe(dto),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers', 'count'] });
      },
    });
  };

  // Mutation: Confirm subscription
  const useConfirmSubscription = () => {
    return useMutation({
      mutationFn: (id: string) => subscriberService.confirmSubscription(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      },
    });
  };

  // Mutation: Public confirmation/unsubscription uses single-use email tokens.
  const useConfirmSubscriptionByToken = () => {
    return useMutation({
      mutationFn: (token: string) => subscriberService.completePublicAction('confirm', token),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      },
    });
  };

  // Mutation: Unsubscribe
  const useUnsubscribe = () => {
    return useMutation({
      mutationFn: (id: string) => subscriberService.unsubscribe(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers', 'count'] });
      },
    });
  };

  // Mutation: Unsubscribe by email (public facing)
  const useUnsubscribeByToken = () => {
    return useMutation({
      mutationFn: (token: string) => subscriberService.completePublicAction('unsubscribe', token),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers', 'count'] });
      },
    });
  };

  // Mutation: Update subscriber
  const useUpdateSubscriber = () => {
    return useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: UpdateSubscriberDTO }) =>
        subscriberService.updateSubscriber(id, dto),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscriber', data.id] });
      },
    });
  };

  // Mutation: Delete subscriber
  const useDeleteSubscriber = () => {
    return useMutation({
      mutationFn: (id: string) => subscriberService.deleteSubscriber(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      },
    });
  };

  return {
    useAllSubscribers,
    useSubscriberById,
    useSubscriberByEmail,
    useActiveSubscribers,
    useSearchSubscribers,
    useCountActiveSubscribers,
    useSubscribe,
    useConfirmSubscription,
    useConfirmSubscriptionByToken,
    useUnsubscribe,
    useUnsubscribeByToken,
    useUpdateSubscriber,
    useDeleteSubscriber,
  };
}
