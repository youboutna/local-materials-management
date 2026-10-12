/**
 * Supabase NewsletterCampaign Adapter
 * Implements INewsletterCampaignRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type { BtpTables, BtpTablesInsert, BtpTablesUpdate } from '@/integrations/supabase/btp-types';
import type { Json } from '@/integrations/supabase/types';
import { NewsletterCampaign, CampaignData, CampaignStatus } from '@/domain/entities/NewsletterCampaign';
import { INewsletterCampaignRepository } from '@/domain/repositories/INewsletterCampaignRepository';

type CampaignRow = BtpTables<'newsletter_campaigns'>;
type CampaignInsert = BtpTablesInsert<'newsletter_campaigns'>;
type CampaignUpdate = BtpTablesUpdate<'newsletter_campaigns'>;

const toJson = (value?: Record<string, unknown>): Json =>
  JSON.parse(JSON.stringify(value ?? {})) as Json;

const fromJson = (value: Json | null): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;

export class SupabaseNewsletterCampaignAdapter implements INewsletterCampaignRepository {
  async findById(id: string): Promise<NewsletterCampaign | null> {
    if (!id || id.trim() === '') return null;

    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? NewsletterCampaign.fromData(this.mapFromDb(data)) : null;
  }

  async findAll(status?: CampaignStatus): Promise<NewsletterCampaign[]> {
    let query = supabase
      .from('newsletter_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('SupabaseNewsletterCampaignAdapter.findAll error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      NewsletterCampaign.fromData(this.mapFromDb(row))
    );
  }

  async findByAuthor(authorId: string): Promise<NewsletterCampaign[]> {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SupabaseNewsletterCampaignAdapter.findByAuthor error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      NewsletterCampaign.fromData(this.mapFromDb(row))
    );
  }

  async findScheduled(): Promise<NewsletterCampaign[]> {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('SupabaseNewsletterCampaignAdapter.findScheduled error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      NewsletterCampaign.fromData(this.mapFromDb(row))
    );
  }

  async save(campaign: NewsletterCampaign): Promise<void> {
    const data = this.mapToDb(campaign.toData());
    const { error } = await supabase
      .from('newsletter_campaigns')
      .insert(data);

    if (error) {
      console.error('SupabaseNewsletterCampaignAdapter.save error:', error);
      throw error;
    }
  }

  async update(id: string, campaign: NewsletterCampaign): Promise<void> {
    const data = campaign.toData();
    const dbData: CampaignUpdate = {};
    dbData.subject = data.subject;
    dbData.preheader = data.preheader ?? null;
    dbData.content = data.content;
    dbData.status = data.status;
    dbData.scheduled_for = data.scheduledFor ?? null;
    dbData.sent_at = data.sentAt ?? null;
    dbData.total_recipients = data.totalRecipients;
    dbData.sent_count = data.sentCount;
    dbData.failed_count = data.failedCount;
    dbData.metadata = toJson(data.metadata);
    
    dbData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('newsletter_campaigns')
      .update(dbData)
      .eq('id', id);

    if (error) {
      console.error('SupabaseNewsletterCampaignAdapter.update error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('newsletter_campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('SupabaseNewsletterCampaignAdapter.delete error:', error);
      throw error;
    }
  }

  private mapFromDb(row: CampaignRow): CampaignData {
    return {
      id: row.id,
      subject: row.subject,
      preheader: row.preheader ?? undefined,
      content: row.content,
      status: row.status,
      scheduledFor: row.scheduled_for ?? undefined,
      sentAt: row.sent_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      authorId: row.author_id,
      totalRecipients: row.total_recipients,
      sentCount: row.sent_count,
      failedCount: row.failed_count,
      metadata: fromJson(row.metadata),
    };
  }

  private mapToDb(entity: CampaignData): CampaignInsert {
    return {
      id: entity.id,
      subject: entity.subject,
      preheader: entity.preheader ?? null,
      content: entity.content,
      status: entity.status,
      scheduled_for: entity.scheduledFor ?? null,
      sent_at: entity.sentAt ?? null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      author_id: entity.authorId,
      total_recipients: entity.totalRecipients,
      sent_count: entity.sentCount,
      failed_count: entity.failedCount,
      metadata: toJson(entity.metadata),
    };
  }
}
