/**
 * NewsletterSubscriberService - Hexagonal Architecture
 * Business logic for newsletter subscriber management
 */

import { NewsletterSubscriber, SubscriberStatus } from '@/domain/entities/NewsletterSubscriber';
import { INewsletterSubscriberRepository } from '@/domain/repositories/INewsletterSubscriberRepository';
import {
  NewsletterSubscriberDTO,
  CreateSubscriberDTO,
  UpdateSubscriberDTO,
  SubscriberListDTO,
} from '@/dtos/entities/NewsletterSubscriberDTO';
import { NewsletterSubscriberTransformer } from '@/dtos/transforms/NewsletterSubscriberTransformer';
import type { INewsletterSubscriptionGateway, NewsletterPublicAction } from '@/domain/repositories/INewsletterSubscriptionGateway';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class NewsletterSubscriberService {
  private subscriberRepository: INewsletterSubscriberRepository;

  constructor(
    repository: INewsletterSubscriberRepository,
    private readonly subscriptionGateway: INewsletterSubscriptionGateway,
  ) {
    this.subscriberRepository = repository;
  }

  async getAllSubscribers(status?: SubscriberStatus): Promise<SubscriberListDTO[]> {
    try {
      const entities = await this.subscriberRepository.findAll(status);
      return entities.map(NewsletterSubscriberTransformer.toListDTO);
    } catch (error) {
      console.error('NewsletterSubscriberService.getAllSubscribers failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch subscribers');
    }
  }

  async getSubscriberById(id: string): Promise<NewsletterSubscriberDTO | null> {
    try {
      const entity = await this.subscriberRepository.findById(id);
      return entity ? NewsletterSubscriberTransformer.toDTO(entity) : null;
    } catch (error) {
      console.error('NewsletterSubscriberService.getSubscriberById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch subscriber');
    }
  }

  async getSubscriberByEmail(email: string): Promise<NewsletterSubscriberDTO | null> {
    try {
      const entity = await this.subscriberRepository.findByEmail(email.toLowerCase().trim());
      return entity ? NewsletterSubscriberTransformer.toDTO(entity) : null;
    } catch (error) {
      console.error('NewsletterSubscriberService.getSubscriberByEmail failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch subscriber');
    }
  }

  async subscribe(dto: CreateSubscriberDTO): Promise<void> {
    try {
      if (!dto.consentGiven) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Explicit consent is required');
      }
      await this.subscriptionGateway.requestSubscription(dto);
    } catch (error) {
      console.error('NewsletterSubscriberService.subscribe failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to subscribe',
      );
    }
  }

  public async completePublicAction(action: NewsletterPublicAction, token: string): Promise<void> {
    try {
      await this.subscriptionGateway.completePublicAction(action, token);
    } catch (error) {
      console.error(`NewsletterSubscriberService.${action} failed:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : `Failed to ${action} newsletter subscription`,
      );
    }
  }

  async confirmSubscription(id: string): Promise<NewsletterSubscriberDTO> {
    try {
      const entity = await this.subscriberRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Subscriber not found');
      }

      entity.confirm();
      await this.subscriberRepository.update(id, entity);
      return NewsletterSubscriberTransformer.toDTO(entity);
    } catch (error) {
      console.error('NewsletterSubscriberService.confirmSubscription failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to confirm subscription');
    }
  }

  async unsubscribe(id: string): Promise<void> {
    try {
      const entity = await this.subscriberRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Subscriber not found');
      }

      entity.unsubscribe();
      await this.subscriberRepository.update(id, entity);
    } catch (error) {
      console.error('NewsletterSubscriberService.unsubscribe failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to unsubscribe');
    }
  }

  async updateSubscriber(id: string, dto: UpdateSubscriberDTO): Promise<NewsletterSubscriberDTO> {
    try {
      const entity = await this.subscriberRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Subscriber not found');
      }

      const updateData = NewsletterSubscriberTransformer.toUpdateData(dto);
      entity.update(updateData);
      await this.subscriberRepository.update(id, entity);
      return NewsletterSubscriberTransformer.toDTO(entity);
    } catch (error) {
      console.error('NewsletterSubscriberService.updateSubscriber failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update subscriber');
    }
  }

  async deleteSubscriber(id: string): Promise<void> {
    try {
      const entity = await this.subscriberRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Subscriber not found');
      }

      await this.subscriberRepository.delete(id);
    } catch (error) {
      console.error('NewsletterSubscriberService.deleteSubscriber failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete subscriber');
    }
  }

  async getActiveSubscribers(): Promise<NewsletterSubscriberDTO[]> {
    try {
      const entities = await this.subscriberRepository.findActive();
      return entities.map(NewsletterSubscriberTransformer.toDTO);
    } catch (error) {
      console.error('NewsletterSubscriberService.getActiveSubscribers failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch active subscribers');
    }
  }

  async searchSubscribers(term: string): Promise<SubscriberListDTO[]> {
    try {
      const entities = await this.subscriberRepository.search(term);
      return entities.map(NewsletterSubscriberTransformer.toListDTO);
    } catch (error) {
      console.error('NewsletterSubscriberService.searchSubscribers failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search subscribers');
    }
  }

  async countActiveSubscribers(): Promise<number> {
    try {
      return await this.subscriberRepository.countActive();
    } catch (error) {
      console.error('NewsletterSubscriberService.countActiveSubscribers failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to count active subscribers');
    }
  }
}
