/**
 * NewsletterSubscriberTransformer - Data Mapper
 * Converts between NewsletterSubscriber entities and DTOs
 */

import { NewsletterSubscriber } from '@/domain/entities/NewsletterSubscriber';
import {
  NewsletterSubscriberDTO,
  CreateSubscriberDTO,
  UpdateSubscriberDTO,
  SubscriberListDTO,
} from '@/dtos/entities/NewsletterSubscriberDTO';

export class NewsletterSubscriberTransformer {
  static toDTO(entity: NewsletterSubscriber): NewsletterSubscriberDTO {
    const data = entity.toData();
    return {
      id: data.id,
      email: data.email,
      status: data.status,
      subscribedAt: data.subscribedAt,
      confirmedAt: data.confirmedAt,
      unsubscribedAt: data.unsubscribedAt,
      source: data.source,
      consentGiven: data.consentGiven,
      consentDate: data.consentDate,
      metadata: data.metadata,
    };
  }

  static toListDTO(entity: NewsletterSubscriber): SubscriberListDTO {
    const data = entity.toData();
    return {
      id: data.id,
      email: data.email,
      status: data.status,
      subscribedAt: data.subscribedAt,
      confirmedAt: data.confirmedAt,
      unsubscribedAt: data.unsubscribedAt,
      source: data.source,
    };
  }

  static fromCreateDTO(dto: CreateSubscriberDTO): NewsletterSubscriber {
    return NewsletterSubscriber.create(dto.email, dto.source, dto.consentGiven);
  }

  static toUpdateData(dto: UpdateSubscriberDTO): Partial<Parameters<NewsletterSubscriber['update']>[0]> {
    const data: Partial<Parameters<NewsletterSubscriber['update']>[0]> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;
    return data;
  }
}
