/**
 * INewsletterSubscriberRepository - Domain Repository Interface
 * Defines the contract for newsletter subscriber data access
 */

import { NewsletterSubscriber, SubscriberStatus } from '@/domain/entities/NewsletterSubscriber';

export interface INewsletterSubscriberRepository {
  findById(id: string): Promise<NewsletterSubscriber | null>;
  findByEmail(email: string): Promise<NewsletterSubscriber | null>;
  findAll(status?: SubscriberStatus): Promise<NewsletterSubscriber[]>;
  findActive(): Promise<NewsletterSubscriber[]>;
  search(term: string): Promise<NewsletterSubscriber[]>;
  save(subscriber: NewsletterSubscriber): Promise<void>;
  update(id: string, subscriber: NewsletterSubscriber): Promise<void>;
  delete(id: string): Promise<void>;
  countActive(): Promise<number>;
}
