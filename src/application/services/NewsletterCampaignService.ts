/**
 * NewsletterCampaignService - Hexagonal Architecture
 * Business logic for newsletter campaign management
 */

import { NewsletterCampaign, CampaignStatus } from '@/domain/entities/NewsletterCampaign';
import { INewsletterCampaignRepository } from '@/domain/repositories/INewsletterCampaignRepository';
import {
  NewsletterCampaignDTO,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  CampaignListDTO,
} from '@/dtos/entities/NewsletterCampaignDTO';
import { NewsletterCampaignTransformer } from '@/dtos/transforms/NewsletterCampaignTransformer';
import type { INewsletterCampaignDispatcher } from '@/domain/repositories/INewsletterCampaignDispatcher';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class NewsletterCampaignService {
  private campaignRepository: INewsletterCampaignRepository;

  constructor(
    repository: INewsletterCampaignRepository,
    private readonly campaignDispatcher: INewsletterCampaignDispatcher,
  ) {
    this.campaignRepository = repository;
  }

  async getAllCampaigns(status?: CampaignStatus): Promise<CampaignListDTO[]> {
    try {
      const entities = await this.campaignRepository.findAll(status);
      const dtos = entities.map((entity) => 
        NewsletterCampaignTransformer.toListDTO(entity)
      );
      return dtos;
    } catch (error) {
      console.error('NewsletterCampaignService.getAllCampaigns failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch campaigns');
    }
  }

  async getCampaignById(id: string): Promise<NewsletterCampaignDTO | null> {
    try {
      const entity = await this.campaignRepository.findById(id);
      return entity ? NewsletterCampaignTransformer.toDTO(entity) : null;
    } catch (error) {
      console.error('NewsletterCampaignService.getCampaignById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch campaign');
    }
  }

  async createCampaign(dto: CreateCampaignDTO, authorId: string): Promise<NewsletterCampaignDTO> {
    try {
      const scheduledFor = dto.scheduledFor ? Date.parse(dto.scheduledFor) : undefined;
      if (scheduledFor !== undefined && (!Number.isFinite(scheduledFor) || scheduledFor <= Date.now())) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Scheduled date must be in the future');
      }
      const normalizedDto = {
        ...dto,
        scheduledFor: scheduledFor === undefined ? undefined : new Date(scheduledFor).toISOString(),
      };
      const entity = NewsletterCampaignTransformer.fromCreateDTO(normalizedDto, authorId);
      await this.campaignRepository.save(entity);
      return NewsletterCampaignTransformer.toDTO(entity);
    } catch (error) {
      console.error('NewsletterCampaignService.createCampaign failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create campaign');
    }
  }

  async updateCampaign(id: string, dto: UpdateCampaignDTO): Promise<NewsletterCampaignDTO> {
    try {
      const entity = await this.campaignRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Campaign not found');
      }

      // Cannot update if already sent or sending
      if (entity.isSent() || entity.isSending()) {
        throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Cannot update sent or sending campaigns');
      }

      const updateData = NewsletterCampaignTransformer.toUpdateData(dto);
      entity.update(updateData);
      await this.campaignRepository.update(id, entity);
      return NewsletterCampaignTransformer.toDTO(entity);
    } catch (error) {
      console.error('NewsletterCampaignService.updateCampaign failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update campaign');
    }
  }

  async scheduleCampaign(id: string, scheduledDate: string): Promise<NewsletterCampaignDTO> {
    try {
      if (!Number.isFinite(Date.parse(scheduledDate)) || Date.parse(scheduledDate) <= Date.now()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Scheduled date must be in the future');
      }
      const normalizedScheduledDate = new Date(scheduledDate).toISOString();
      const entity = await this.campaignRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Campaign not found');
      }

      entity.schedule(normalizedScheduledDate);
      await this.campaignRepository.update(id, entity);
      return NewsletterCampaignTransformer.toDTO(entity);
    } catch (error) {
      console.error('NewsletterCampaignService.scheduleCampaign failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to schedule campaign');
    }
  }

  async sendCampaign(id: string): Promise<NewsletterCampaignDTO> {
    try {
      const entity = await this.campaignRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Campaign not found');
      }

      if (!entity.canBeSent()) {
        throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Campaign cannot be sent in current status');
      }
      const scheduledFor = entity.getScheduledFor();
      if (entity.isScheduled() && scheduledFor && Date.parse(scheduledFor) > Date.now()) {
        throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Campaign is scheduled for a future date');
      }

      await this.campaignDispatcher.dispatchCampaign(id);

      const updated = await this.campaignRepository.findById(id);
      if (!updated) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Campaign was not found after dispatch');
      }
      return NewsletterCampaignTransformer.toDTO(updated);
    } catch (error) {
      console.error('NewsletterCampaignService.sendCampaign failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send campaign');
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    try {
      const entity = await this.campaignRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Campaign not found');
      }

      // Cannot delete sent campaigns
      if (entity.isSent() || entity.isSending()) {
        throw new AppError(ErrorCode.BUSINESS_RULE_VIOLATION, 'Cannot delete sent or sending campaigns');
      }

      await this.campaignRepository.delete(id);
    } catch (error) {
      console.error('NewsletterCampaignService.deleteCampaign failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete campaign');
    }
  }

  async getScheduledCampaigns(): Promise<CampaignListDTO[]> {
    try {
      const entities = await this.campaignRepository.findScheduled();
      return entities.map((entity) => 
        NewsletterCampaignTransformer.toListDTO(entity)
      );
    } catch (error) {
      console.error('NewsletterCampaignService.getScheduledCampaigns failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch scheduled campaigns');
    }
  }

  async getCampaignsByAuthor(authorId: string): Promise<CampaignListDTO[]> {
    try {
      const entities = await this.campaignRepository.findByAuthor(authorId);
      return entities.map((entity) => 
        NewsletterCampaignTransformer.toListDTO(entity)
      );
    } catch (error) {
      console.error('NewsletterCampaignService.getCampaignsByAuthor failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch campaigns');
    }
  }
}
