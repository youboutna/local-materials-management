/**
 * NewsletterSubscriber - Domain Entity
 * Business entity for newsletter subscribers with consent tracking
 */

export type SubscriberStatus = 'pending_confirmation' | 'active' | 'unsubscribed';

export interface SubscriberData {
  id: string;
  email: string;
  status: SubscriberStatus;
  subscribedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  source: string;
  consentGiven: boolean;
  consentDate: string;
  metadata?: Record<string, unknown>;
}

export class NewsletterSubscriber {
  private data: SubscriberData;

  constructor(data: SubscriberData) {
    this.data = data;
  }

  static create(email: string, source: string = 'footer', consentGiven = false): NewsletterSubscriber {
    const now = new Date().toISOString();
    return new NewsletterSubscriber({
      id: crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      status: 'pending_confirmation',
      subscribedAt: now,
      source,
      consentGiven,
      consentDate: now,
      metadata: {},
    });
  }

  static fromData(data: SubscriberData): NewsletterSubscriber {
    return new NewsletterSubscriber(data);
  }

  toData(): SubscriberData {
    return { ...this.data };
  }

  getId(): string {
    return this.data.id;
  }

  getEmail(): string {
    return this.data.email;
  }

  getStatus(): SubscriberStatus {
    return this.data.status;
  }

  confirm(): void {
    if (this.data.status === 'unsubscribed') {
      throw new Error('Cannot confirm an unsubscribed email. Please subscribe again.');
    }
    this.data.status = 'active';
    this.data.confirmedAt = new Date().toISOString();
  }

  unsubscribe(): void {
    this.data.status = 'unsubscribed';
    this.data.unsubscribedAt = new Date().toISOString();
  }

  requestResubscription(source: string): void {
    const now = new Date().toISOString();
    this.data.status = 'pending_confirmation';
    this.data.source = source;
    this.data.subscribedAt = now;
    this.data.confirmedAt = undefined;
    this.data.unsubscribedAt = undefined;
    this.data.consentGiven = true;
    this.data.consentDate = now;
  }

  update(data: Partial<SubscriberData>): void {
    if (data.status !== undefined) {
      this.data.status = data.status;
    }
    if (data.metadata !== undefined) {
      this.data.metadata = data.metadata;
    }
  }

  isPending(): boolean {
    return this.data.status === 'pending_confirmation';
  }

  isActive(): boolean {
    return this.data.status === 'active';
  }

  isUnsubscribed(): boolean {
    return this.data.status === 'unsubscribed';
  }

  canReceiveCampaigns(): boolean {
    return this.data.status === 'active';
  }
}
