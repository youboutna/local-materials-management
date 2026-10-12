/**
 * INewsletterCampaignRepository - Domain Repository Interface
 * Defines the contract for newsletter campaign data access
 */

import { NewsletterCampaign, CampaignStatus } from '@/domain/entities/NewsletterCampaign';

export interface INewsletterCampaignRepository {
  findById(id: string): Promise<NewsletterCampaign | null>;
  findAll(status?: CampaignStatus): Promise<NewsletterCampaign[]>;
  findByAuthor(authorId: string): Promise<NewsletterCampaign[]>;
  findScheduled(): Promise<NewsletterCampaign[]>;
  save(campaign: NewsletterCampaign): Promise<void>;
  update(id: string, campaign: NewsletterCampaign): Promise<void>;
  delete(id: string): Promise<void>;
}
