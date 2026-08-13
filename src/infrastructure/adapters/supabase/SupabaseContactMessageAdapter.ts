/**
 * Supabase Contact Message Adapter
 * Implements contact message repository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';
import { ContactMessage } from '@/domain/entities/ContactMessage';
import { BlockedSender } from '@/domain/entities/BlockedSender';
import {
  IContactMessageRepository,
  CreateContactMessageData,
  UpdateContactMessageData,
  CreateBlockedSenderData,
  ContactMessageFilters,
  ContactMessageStats
} from '@/domain/repositories/IContactMessageRepository';

export class SupabaseContactMessageAdapter implements IContactMessageRepository {
  
  async create(data: CreateContactMessageData): Promise<ContactMessage> {
    const { data: result, error } = await btpClient.from('contact_messages')
      .insert({
        sender_name: data.senderName,
        sender_email: data.senderEmail,
        sender_phone: data.senderPhone,
        subject: data.subject,
        message: data.message,
        default_reply_email: data.defaultReplyEmail || 'non-reply@hadratech.com',
        metadata: data.metadata
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact message: ${error.message}`);
    }

    return this.mapToContactMessage(result);
  }

  async findById(id: string): Promise<ContactMessage | null> {
    const { data, error } = await btpClient.from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find contact message: ${error.message}`);
    }

    return this.mapToContactMessage(data);
  }

  async findAll(filters: ContactMessageFilters = {}): Promise<ContactMessage[]> {
    let query = btpClient.from('contact_messages').select('*');

    // Apply filters
    if (filters.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }
    if (filters.isSpam !== undefined) {
      query = query.eq('is_spam', filters.isSpam);
    }
    if (filters.isArchived !== undefined) {
      query = query.eq('is_archived', filters.isArchived);
    }
    if (filters.senderEmail) {
      query = query.eq('sender_email', filters.senderEmail);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }
    if (filters.searchTerm) {
      query = query.or(`subject.ilike.%${filters.searchTerm}%,message.ilike.%${filters.searchTerm}%,sender_name.ilike.%${filters.searchTerm}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find contact messages: ${error.message}`);
    }

    return data.map(item => this.mapToContactMessage(item));
  }

  async findRecent(limit: number = 10): Promise<ContactMessage[]> {
    const { data, error } = await btpClient.from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find recent contact messages: ${error.message}`);
    }

    return data.map(item => this.mapToContactMessage(item));
  }

  async update(id: string, data: UpdateContactMessageData): Promise<ContactMessage> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (data.isRead !== undefined) updateData.is_read = data.isRead;
    if (data.isSpam !== undefined) updateData.is_spam = data.isSpam;
    if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: result, error } = await btpClient.from('contact_messages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contact message: ${error.message}`);
    }

    return this.mapToContactMessage(result);
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete contact message: ${error.message}`);
    }
  }

  async getStats(): Promise<ContactMessageStats> {
    const [
      totalResult,
      unreadResult,
      spamResult,
      archivedResult,
      todayResult,
      weekResult
    ] = await Promise.all([
      btpClient.from('contact_messages').select('id', { count: 'exact', head: true }),
      btpClient.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
      btpClient.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_spam', true),
      btpClient.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_archived', true),
      btpClient.from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toDateString()),
      btpClient.from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      totalMessages: totalResult.count || 0,
      unreadMessages: unreadResult.count || 0,
      spamMessages: spamResult.count || 0,
      archivedMessages: archivedResult.count || 0,
      todayMessages: todayResult.count || 0,
      thisWeekMessages: weekResult.count || 0
    };
  }

  async markMultipleAsRead(ids: string[]): Promise<void> {
    const { error } = await btpClient.from('contact_messages')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  async markMultipleAsSpam(ids: string[]): Promise<void> {
    const { error } = await btpClient.from('contact_messages')
      .update({ is_spam: true, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to mark messages as spam: ${error.message}`);
    }
  }

  async archiveMultiple(ids: string[]): Promise<void> {
    const { error } = await btpClient.from('contact_messages')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to archive messages: ${error.message}`);
    }
  }

  async deleteMultiple(ids: string[]): Promise<void> {
    const { error } = await btpClient.from('contact_messages')
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to delete messages: ${error.message}`);
    }
  }

  // Blocked Senders Management
  async createBlockedSender(data: CreateBlockedSenderData): Promise<BlockedSender> {
    const { data: result, error } = await btpClient.from('blocked_senders')
      .insert({
        email: data.email,
        reason: data.reason,
        blocked_by: data.blockedBy
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create blocked sender: ${error.message}`);
    }

    return this.mapToBlockedSender(result);
  }

  async findBlockedSenderByEmail(email: string): Promise<BlockedSender | null> {
    const { data, error } = await btpClient.from('blocked_senders')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find blocked sender: ${error.message}`);
    }

    return this.mapToBlockedSender(data);
  }

  async findAllBlockedSenders(): Promise<BlockedSender[]> {
    const { data, error } = await btpClient.from('blocked_senders')
      .select('*')
      .order('blocked_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find blocked senders: ${error.message}`);
    }

    return data.map(item => this.mapToBlockedSender(item));
  }

  async updateBlockedSender(id: string, data: { isActive?: boolean; reason?: string }): Promise<BlockedSender> {
    const updateData: Record<string, any> = {};
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.reason !== undefined) updateData.reason = data.reason;

    const { data: result, error } = await btpClient.from('blocked_senders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update blocked sender: ${error.message}`);
    }

    return this.mapToBlockedSender(result);
  }

  async deleteBlockedSender(id: string): Promise<void> {
    const { error } = await btpClient.from('blocked_senders')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete blocked sender: ${error.message}`);
    }
  }

  async isEmailBlocked(email: string): Promise<boolean> {
    const { data, error } = await btpClient.from('blocked_senders')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check blocked email: ${error.message}`);
    }

    return !!data;
  }

  // Private mapping methods
  private mapToContactMessage(data: any): ContactMessage {
    return new ContactMessage(
      data.id,
      data.sender_name,
      data.sender_email,
      data.sender_phone,
      data.subject,
      data.message,
      data.is_read,
      data.is_spam,
      data.is_archived,
      data.default_reply_email,
      data.metadata,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  private mapToBlockedSender(data: any): BlockedSender {
    return new BlockedSender(
      data.id,
      data.email,
      data.reason,
      data.blocked_by,
      new Date(data.blocked_at),
      data.is_active,
      new Date(data.created_at)
    );
  }
}