/**
 * NewsletterSubscriberDTO - Data Transfer Object
 * Represents newsletter subscriber data for API/UI communication
 */

export type SubscriberStatus = 'pending_confirmation' | 'active' | 'unsubscribed';

export interface NewsletterSubscriberDTO {
  id: string;
  email: string;
  status: SubscriberStatus;
  subscribedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  source?: string;
  consentGiven: boolean;
  consentDate: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSubscriberDTO {
  email: string;
  source?: string;
  consentGiven: boolean;
}

export interface UpdateSubscriberDTO {
  status?: SubscriberStatus;
  metadata?: Record<string, unknown>;
}

export interface SubscriberListDTO {
  id: string;
  email: string;
  status: SubscriberStatus;
  subscribedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  source?: string;
}
