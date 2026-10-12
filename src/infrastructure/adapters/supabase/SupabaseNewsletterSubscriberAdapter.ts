/**
 * Supabase NewsletterSubscriber Adapter
 * Implements INewsletterSubscriberRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type { BtpTables, BtpTablesInsert, BtpTablesUpdate } from '@/integrations/supabase/btp-types';
import type { Json } from '@/integrations/supabase/types';
import { NewsletterSubscriber, SubscriberData, SubscriberStatus } from '@/domain/entities/NewsletterSubscriber';
import { INewsletterSubscriberRepository } from '@/domain/repositories/INewsletterSubscriberRepository';

type SubscriberRow = BtpTables<'newsletter_subscribers'>;
type SubscriberInsert = BtpTablesInsert<'newsletter_subscribers'>;
type SubscriberUpdate = BtpTablesUpdate<'newsletter_subscribers'>;

const toJson = (value?: Record<string, unknown>): Json =>
  JSON.parse(JSON.stringify(value ?? {})) as Json;

const fromJson = (value: Json | null): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;

export class SupabaseNewsletterSubscriberAdapter implements INewsletterSubscriberRepository {
  async findById(id: string): Promise<NewsletterSubscriber | null> {
    if (!id || id.trim() === '') return null;

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? NewsletterSubscriber.fromData(this.mapFromDb(data)) : null;
  }

  async findByEmail(email: string): Promise<NewsletterSubscriber | null> {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? NewsletterSubscriber.fromData(this.mapFromDb(data)) : null;
  }

  async findAll(status?: SubscriberStatus): Promise<NewsletterSubscriber[]> {
    let query = supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('SupabaseNewsletterSubscriberAdapter.findAll error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      NewsletterSubscriber.fromData(this.mapFromDb(row))
    );
  }

  async findActive(): Promise<NewsletterSubscriber[]> {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('status', 'active')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('SupabaseNewsletterSubscriberAdapter.findActive error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      NewsletterSubscriber.fromData(this.mapFromDb(row))
    );
  }

  async search(term: string): Promise<NewsletterSubscriber[]> {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .ilike('email', `%${term}%`)
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('SupabaseNewsletterSubscriberAdapter.search error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      NewsletterSubscriber.fromData(this.mapFromDb(row))
    );
  }

  async save(subscriber: NewsletterSubscriber): Promise<void> {
    const data = this.mapToDb(subscriber.toData());
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert(data);

    if (error) {
      console.error('SupabaseNewsletterSubscriberAdapter.save error:', error);
      throw error;
    }
  }

  async update(id: string, subscriber: NewsletterSubscriber): Promise<void> {
    const data = subscriber.toData();
    const dbData: SubscriberUpdate = {
      status: data.status,
      confirmed_at: data.confirmedAt ?? null,
      unsubscribed_at: data.unsubscribedAt ?? null,
      metadata: toJson(data.metadata),
    };

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update(dbData)
      .eq('id', id);

    if (error) {
      console.error('SupabaseNewsletterSubscriberAdapter.update error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('SupabaseNewsletterSubscriberAdapter.delete error:', error);
      throw error;
    }
  }

  async countActive(): Promise<number> {
    const { count, error } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) {
      console.error('SupabaseNewsletterSubscriberAdapter.countActive error:', error);
      throw error;
    }

    return count || 0;
  }

  private mapFromDb(row: SubscriberRow): SubscriberData {
    return {
      id: row.id,
      email: row.email,
      status: row.status,
      subscribedAt: row.subscribed_at,
      confirmedAt: row.confirmed_at ?? undefined,
      unsubscribedAt: row.unsubscribed_at ?? undefined,
      source: row.source ?? '',
      consentGiven: row.consent_given,
      consentDate: row.consent_date,
      metadata: fromJson(row.metadata),
    };
  }

  private mapToDb(entity: SubscriberData): SubscriberInsert {
    return {
      id: entity.id,
      email: entity.email,
      status: entity.status,
      subscribed_at: entity.subscribedAt,
      confirmed_at: entity.confirmedAt ?? null,
      unsubscribed_at: entity.unsubscribedAt ?? null,
      source: entity.source,
      consent_given: entity.consentGiven,
      consent_date: entity.consentDate,
      metadata: toJson(entity.metadata),
    };
  }
}
