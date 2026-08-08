import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * Contact Message Application Service
 * Orchestrates contact message business logic and repository interactions
 */

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

export class ContactMessageService {
  constructor(
    private readonly contactMessageRepository: IContactMessageRepository
  ) {}

  /**
   * Submit a new contact message with automatic spam detection
   */
  async submitMessage(data: CreateContactMessageData): Promise<ContactMessage> {
    // Check if sender is blocked
    const isBlocked = await this.contactMessageRepository.isEmailBlocked(data.senderEmail);
    if (isBlocked) {
      throw new Error('Cette adresse email est bloquée');
    }

    // Set default reply email if not provided
    const messageData = {
      ...data,
      defaultReplyEmail: data.defaultReplyEmail || 'non-reply@hadratech.com'
    };

    // Create the message
    const newMessage = await this.contactMessageRepository.create(messageData);

    // Check for spam and auto-block if necessary
    if (newMessage.isLikelySpam()) {
      // Mark as spam
      await this.contactMessageRepository.update(newMessage.id, { isSpam: true });
      
      // Auto-block sender if this is spam
      await this.autoBlockSpamSender(data.senderEmail, newMessage.id);
    }

    return newMessage;
  }

  /**
   * Get contact message by ID
   */
  async getMessageById(id: string): Promise<ContactMessage | null> {
    return await this.contactMessageRepository.findById(id);
  }

  /**
   * Get all contact messages with optional filters
   */
  async getMessages(filters?: ContactMessageFilters): Promise<ContactMessage[]> {
    return await this.contactMessageRepository.findAll(filters);
  }

  /**
   * Get recent contact messages
   */
  async getRecentMessages(limit?: number): Promise<ContactMessage[]> {
    return await this.contactMessageRepository.findRecent(limit);
  }

  /**
   * Update contact message
   */
  async updateMessage(id: string, data: UpdateContactMessageData): Promise<ContactMessage> {
    return await this.contactMessageRepository.update(id, data);
  }

  /**
   * Delete contact message
   */
  async deleteMessage(id: string): Promise<void> {
    await this.contactMessageRepository.delete(id);
  }

  /**
   * Get contact message statistics
   */
  async getStats(): Promise<ContactMessageStats> {
    return await this.contactMessageRepository.getStats();
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: string): Promise<ContactMessage> {
    return await this.contactMessageRepository.update(id, { isRead: true });
  }

  /**
   * Mark message as spam
   */
  async markAsSpam(id: string): Promise<ContactMessage> {
    const message = await this.contactMessageRepository.findById(id);
    if (!message) {
      throw new Error('Message non trouvé');
    }

    // Mark as spam
    const updatedMessage = await this.contactMessageRepository.update(id, { isSpam: true });
    
    // Block the sender
    await this.autoBlockSpamSender(message.senderEmail, id);

    return updatedMessage;
  }

  /**
   * Archive message
   */
  async archiveMessage(id: string): Promise<ContactMessage> {
    return await this.contactMessageRepository.update(id, { isArchived: true });
  }

  /**
   * Bulk operations
   */
  async markMultipleAsRead(ids: string[]): Promise<void> {
    await this.contactMessageRepository.markMultipleAsRead(ids);
  }

  async markMultipleAsSpam(ids: string[]): Promise<void> {
    await this.contactMessageRepository.markMultipleAsSpam(ids);
    
    // Get messages to block senders
    const messages = await Promise.all(
      ids.map(id => this.contactMessageRepository.findById(id))
    );

    // Block all senders
    for (const message of messages) {
      if (message) {
        await this.autoBlockSpamSender(message.senderEmail, message.id);
      }
    }
  }

  async archiveMultiple(ids: string[]): Promise<void> {
    await this.contactMessageRepository.archiveMultiple(ids);
  }

  async deleteMultiple(ids: string[]): Promise<void> {
    await this.contactMessageRepository.deleteMultiple(ids);
  }

  /**
   * Blocked Senders Management
   */
  async blockSender(data: CreateBlockedSenderData): Promise<BlockedSender> {
    return await this.contactMessageRepository.createBlockedSender(data);
  }

  async getBlockedSenders(): Promise<BlockedSender[]> {
    return await this.contactMessageRepository.findAllBlockedSenders();
  }

  async unblockSender(id: string): Promise<BlockedSender> {
    return await this.contactMessageRepository.updateBlockedSender(id, { isActive: false });
  }

  async deleteBlockedSender(id: string): Promise<void> {
    await this.contactMessageRepository.deleteBlockedSender(id);
  }

  async isEmailBlocked(email: string): Promise<boolean> {
    return await this.contactMessageRepository.isEmailBlocked(email);
  }

  /**
   * Private method to automatically block spam senders
   */
  private async autoBlockSpamSender(email: string, messageId: string): Promise<void> {
    try {
      // Check if already blocked
      const existingBlock = await this.contactMessageRepository.findBlockedSenderByEmail(email);
      if (existingBlock) {
        return; // Already blocked
      }

      // Create new blocked sender
      await this.contactMessageRepository.createBlockedSender({
        email,
        reason: `Auto-blocked due to spam message (ID: ${messageId})`
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to auto-block sender:', error);
    }
  }
}

let contactMessageServiceInstance: ContactMessageService | null = null;
export function getContactMessageService(): ContactMessageService {
  if (!contactMessageServiceInstance) {
    contactMessageServiceInstance = new ContactMessageService(RepositoryFactory.getContactMessageRepository());
  }
  return contactMessageServiceInstance;
}
