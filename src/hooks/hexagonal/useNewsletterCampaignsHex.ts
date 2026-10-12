/**
 * useNewsletterCampaignsHex - Hexagonal Hook for Newsletter Campaigns
 * React hook for newsletter campaign management using hexagonal architecture
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NewsletterCampaignService } from '@/application/services/NewsletterCampaignService';
import {
  CreateCampaignDTO,
  UpdateCampaignDTO,
  CampaignListDTO,
  CampaignStatus,
} from '@/dtos/entities/NewsletterCampaignDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

const campaignService = new NewsletterCampaignService(
  RepositoryFactory.getNewsletterCampaignRepository(),
  RepositoryFactory.getNewsletterCampaignDispatcher(),
);

export function useNewsletterCampaignsHex() {
  const queryClient = useQueryClient();

  // Query: Get all campaigns
  const useAllCampaigns = (status?: CampaignStatus) => {
    return useQuery({
      queryKey: ['newsletter-campaigns', status],
      queryFn: () => campaignService.getAllCampaigns(status),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Query: Get campaign by ID
  const useCampaignById = (id: string) => {
    return useQuery({
      queryKey: ['newsletter-campaign', id],
      queryFn: () => campaignService.getCampaignById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Query: Get scheduled campaigns
  const useScheduledCampaigns = () => {
    return useQuery({
      queryKey: ['newsletter-campaigns', 'scheduled'],
      queryFn: () => campaignService.getScheduledCampaigns(),
      staleTime: 2 * 60 * 1000,
      refetchInterval: 60 * 1000, // Refetch every minute for scheduled campaigns
    });
  };

  // Query: Get campaigns by author
  const useCampaignsByAuthor = (authorId: string) => {
    return useQuery({
      queryKey: ['newsletter-campaigns', 'author', authorId],
      queryFn: () => campaignService.getCampaignsByAuthor(authorId),
      enabled: !!authorId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Mutation: Create campaign
  const useCreateCampaign = () => {
    return useMutation({
      mutationFn: ({ dto, authorId }: { dto: CreateCampaignDTO; authorId: string }) =>
        campaignService.createCampaign(dto, authorId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      },
    });
  };

  // Mutation: Update campaign
  const useUpdateCampaign = () => {
    return useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: UpdateCampaignDTO }) =>
        campaignService.updateCampaign(id, dto),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaign', data.id] });
      },
    });
  };

  // Mutation: Schedule campaign
  const useScheduleCampaign = () => {
    return useMutation({
      mutationFn: ({ id, scheduledDate }: { id: string; scheduledDate: string }) =>
        campaignService.scheduleCampaign(id, scheduledDate),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaign', data.id] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns', 'scheduled'] });
      },
    });
  };

  // Mutation: Send campaign
  const useSendCampaign = () => {
    return useMutation({
      mutationFn: (id: string) => campaignService.sendCampaign(id),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaign', data.id] });
        queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers', 'count'] });
      },
    });
  };

  // Mutation: Delete campaign
  const useDeleteCampaign = () => {
    return useMutation({
      mutationFn: (id: string) => campaignService.deleteCampaign(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      },
    });
  };

  return {
    useAllCampaigns,
    useCampaignById,
    useScheduledCampaigns,
    useCampaignsByAuthor,
    useCreateCampaign,
    useUpdateCampaign,
    useScheduleCampaign,
    useSendCampaign,
    useDeleteCampaign,
  };
}
