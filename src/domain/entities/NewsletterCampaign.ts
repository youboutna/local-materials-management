/**
 * NewsletterCampaign Entity - Hexagonal Architecture
 * Represents a newsletter campaign/email campaign
 */

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface CampaignData {
  id: string;
  subject: string;
  preheader?: string;
  content: string;
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  metadata?: Record<string, unknown>;
}

export class NewsletterCampaign {
  private readonly id: string;
  private subject: string;
  private preheader?: string;
  private content: string;
  private status: CampaignStatus;
  private scheduledFor?: string;
  private sentAt?: string;
  private readonly createdAt: string;
  private updatedAt: string;
  private readonly authorId: string;
  private totalRecipients: number;
  private sentCount: number;
  private failedCount: number;
  private metadata?: Record<string, unknown>;

  private constructor(data: CampaignData) {
    this.id = data.id;
    this.subject = data.subject;
    this.preheader = data.preheader;
    this.content = data.content;
    this.status = data.status;
    this.scheduledFor = data.scheduledFor;
    this.sentAt = data.sentAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.authorId = data.authorId;
    this.totalRecipients = data.totalRecipients;
    this.sentCount = data.sentCount;
    this.failedCount = data.failedCount;
    this.metadata = data.metadata;
  }

  static create(data: Omit<CampaignData, 'id' | 'createdAt' | 'updatedAt' | 'sentCount' | 'failedCount'>): NewsletterCampaign {
    const now = new Date().toISOString();
    return new NewsletterCampaign({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      sentCount: 0,
      failedCount: 0,
    });
  }

  static fromData(data: CampaignData): NewsletterCampaign {
    return new NewsletterCampaign(data);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getSubject(): string {
    return this.subject;
  }

  getPreheader(): string | undefined {
    return this.preheader;
  }

  getContent(): string {
    return this.content;
  }

  getStatus(): CampaignStatus {
    return this.status;
  }

  getScheduledFor(): string | undefined {
    return this.scheduledFor;
  }

  getSentAt(): string | undefined {
    return this.sentAt;
  }

  getCreatedAt(): string {
    return this.createdAt;
  }

  getUpdatedAt(): string {
    return this.updatedAt;
  }

  getAuthorId(): string {
    return this.authorId;
  }

  getTotalRecipients(): number {
    return this.totalRecipients;
  }

  getSentCount(): number {
    return this.sentCount;
  }

  getFailedCount(): number {
    return this.failedCount;
  }

  getSuccessRate(): number {
    if (this.totalRecipients === 0) return 0;
    return (this.sentCount / this.totalRecipients) * 100;
  }

  getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

  // Business methods
  schedule(scheduledDate: string): void {
    if (this.status !== 'draft') {
      throw new Error('Can only schedule draft campaigns');
    }
    this.status = 'scheduled';
    this.scheduledFor = scheduledDate;
    this.updatedAt = new Date().toISOString();
  }

  startSending(totalRecipients: number): void {
    if (this.status !== 'draft' && this.status !== 'scheduled') {
      throw new Error('Can only start sending draft or scheduled campaigns');
    }
    this.status = 'sending';
    this.totalRecipients = totalRecipients;
    this.updatedAt = new Date().toISOString();
  }

  recordSuccess(): void {
    if (this.status !== 'sending') {
      throw new Error('Can only record success for sending campaigns');
    }
    this.sentCount++;
    this.updatedAt = new Date().toISOString();
  }

  recordFailure(): void {
    if (this.status !== 'sending') {
      throw new Error('Can only record failure for sending campaigns');
    }
    this.failedCount++;
    this.updatedAt = new Date().toISOString();
  }

  complete(): void {
    if (this.status !== 'sending') {
      throw new Error('Can only complete sending campaigns');
    }
    this.status = this.sentCount === 0 ? 'failed' : 'sent';
    this.sentAt = this.sentCount === 0 ? undefined : new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  fail(): void {
    this.status = 'failed';
    this.updatedAt = new Date().toISOString();
  }

  update(data: Partial<Omit<CampaignData, 'id' | 'createdAt' | 'authorId' | 'sentCount' | 'failedCount'>>): void {
    if (data.subject !== undefined) this.subject = data.subject;
    if (data.preheader !== undefined) this.preheader = data.preheader;
    if (data.content !== undefined) this.content = data.content;
    if (data.status !== undefined && data.status === 'draft') {
      this.status = data.status;
      this.scheduledFor = undefined;
      this.sentAt = undefined;
    }
    if (data.scheduledFor !== undefined) {
      this.scheduledFor = data.scheduledFor;
      this.status = 'scheduled';
    }
    if (data.metadata !== undefined) this.metadata = data.metadata;
    this.updatedAt = new Date().toISOString();
  }

  isDraft(): boolean {
    return this.status === 'draft';
  }

  isScheduled(): boolean {
    return this.status === 'scheduled';
  }

  isSending(): boolean {
    return this.status === 'sending';
  }

  isSent(): boolean {
    return this.status === 'sent';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  canBeSent(): boolean {
    return this.status === 'draft' || this.status === 'scheduled';
  }

  toData(): CampaignData {
    return {
      id: this.id,
      subject: this.subject,
      preheader: this.preheader,
      content: this.content,
      status: this.status,
      scheduledFor: this.scheduledFor,
      sentAt: this.sentAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      authorId: this.authorId,
      totalRecipients: this.totalRecipients,
      sentCount: this.sentCount,
      failedCount: this.failedCount,
      metadata: this.metadata,
    };
  }
}
