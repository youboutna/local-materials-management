/**
 * NewsletterCampaignTransformer - Data Mapper
 * Converts between NewsletterCampaign entities and DTOs
 */

import { NewsletterCampaign } from '@/domain/entities/NewsletterCampaign';
import {
  NewsletterCampaignDTO,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  CampaignListDTO,
} from '@/dtos/entities/NewsletterCampaignDTO';

export class NewsletterCampaignTransformer {
  static toDTO(entity: NewsletterCampaign, enrichData?: {
    authorName?: string;
  }): NewsletterCampaignDTO {
    const data = entity.toData();
    return {
      id: data.id,
      subject: data.subject,
      preheader: data.preheader,
      content: data.content,
      status: data.status,
      scheduledFor: data.scheduledFor,
      sentAt: data.sentAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      authorId: data.authorId,
      authorName: enrichData?.authorName,
      totalRecipients: data.totalRecipients,
      sentCount: data.sentCount,
      failedCount: data.failedCount,
      successRate: entity.getSuccessRate(),
      metadata: data.metadata,
    };
  }

  static toListDTO(entity: NewsletterCampaign, enrichData?: {
    authorName?: string;
  }): CampaignListDTO {
    const data = entity.toData();
    return {
      id: data.id,
      subject: data.subject,
      preheader: data.preheader,
      status: data.status,
      scheduledFor: data.scheduledFor,
      sentAt: data.sentAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      authorId: data.authorId,
      authorName: enrichData?.authorName,
      totalRecipients: data.totalRecipients,
      sentCount: data.sentCount,
      failedCount: data.failedCount,
      successRate: entity.getSuccessRate(),
    };
  }

  static fromCreateDTO(dto: CreateCampaignDTO, authorId: string): NewsletterCampaign {
    return NewsletterCampaign.create({
      subject: dto.subject,
      preheader: dto.preheader,
      content: dto.content,
      status: dto.scheduledFor ? 'scheduled' : 'draft',
      scheduledFor: dto.scheduledFor,
      authorId,
      totalRecipients: 0,
      metadata: dto.metadata,
    });
  }

  static toUpdateData(dto: UpdateCampaignDTO): Partial<Parameters<NewsletterCampaign['update']>[0]> {
    const data: Partial<Parameters<NewsletterCampaign['update']>[0]> = {};
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.preheader !== undefined) data.preheader = dto.preheader;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.scheduledFor !== undefined) data.scheduledFor = dto.scheduledFor;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;
    return data;
  }
}
