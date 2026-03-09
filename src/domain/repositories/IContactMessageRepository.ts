/**
 * Contact Message Repository Interface
 * Defines the contract for contact message data access
 */

import { ContactMessage } from '../entities/ContactMessage';
import { BlockedSender } from '../entities/BlockedSender';

export interface CreateContactMessageData {
  senderName: string;
  senderEmail: string;
  senderPhone?: string | null;
  subject: string;
  message: string;
  defaultReplyEmail?: string;
  metadata?: Record<string, any> | null;
}

export interface UpdateContactMessageData {
  isRead?: boolean;
  isSpam?: boolean;
  isArchived?: boolean;
  metadata?: Record<string, any> | null;
}

export interface CreateBlockedSenderData {
  email: string;
  reason?: string | null;
  blockedBy?: string | null;
}

export interface ContactMessageFilters {
  isRead?: boolean;
  isSpam?: boolean;
  isArchived?: boolean;
  senderEmail?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface ContactMessageStats {
  totalMessages: number;
  unreadMessages: number;
  spamMessages: number;
  archivedMessages: number;
  todayMessages: number;
  thisWeekMessages: number;
}

export interface IContactMessageRepository {
  // Contact Message CRUD operations
  create(data: CreateContactMessageData): Promise<ContactMessage>;
  findById(id: string): Promise<ContactMessage | null>;
  findAll(filters?: ContactMessageFilters): Promise<ContactMessage[]>;
  findRecent(limit?: number): Promise<ContactMessage[]>;
  update(id: string, data: UpdateContactMessageData): Promise<ContactMessage>;
  delete(id: string): Promise<void>;
  
  // Statistics and Analytics
  getStats(): Promise<ContactMessageStats>;
  
  // Bulk operations
  markMultipleAsRead(ids: string[]): Promise<void>;
  markMultipleAsSpam(ids: string[]): Promise<void>;
  archiveMultiple(ids: string[]): Promise<void>;
  deleteMultiple(ids: string[]): Promise<void>;

  // Blocked Senders management
  createBlockedSender(data: CreateBlockedSenderData): Promise<BlockedSender>;
  findBlockedSenderByEmail(email: string): Promise<BlockedSender | null>;
  findAllBlockedSenders(): Promise<BlockedSender[]>;
  updateBlockedSender(id: string, data: { isActive?: boolean; reason?: string }): Promise<BlockedSender>;
  deleteBlockedSender(id: string): Promise<void>;
  isEmailBlocked(email: string): Promise<boolean>;
}