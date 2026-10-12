/**
 * NewsletterCampaignDTO - Data Transfer Object
 * Represents newsletter campaign data for API/UI communication
 */

import { BaseEntityDTO } from './BaseEntityDTO';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface NewsletterCampaignDTO extends BaseEntityDTO {
  subject: string;
  preheader?: string;
  content: string;
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  authorId: string;
  authorName?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  metadata?: Record<string, unknown>;
}

export interface CreateCampaignDTO {
  subject: string;
  preheader?: string;
  content: string;
  scheduledFor?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCampaignDTO {
  subject?: string;
  preheader?: string;
  content?: string;
  status?: CampaignStatus;
  scheduledFor?: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignListDTO {
  id: string;
  subject: string;
  preheader?: string;
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
}
