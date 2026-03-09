/**
 * Contact Message Domain Entity
 * Represents a contact form submission with spam detection capabilities
 */

export class ContactMessage {
  constructor(
    public readonly id: string,
    public readonly senderName: string,
    public readonly senderEmail: string,
    public readonly senderPhone: string | null,
    public readonly subject: string,
    public readonly message: string,
    public readonly isRead: boolean,
    public readonly isSpam: boolean,
    public readonly isArchived: boolean,
    public readonly defaultReplyEmail: string,
    public readonly metadata: Record<string, any> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Business logic: Detect potential spam based on content analysis
   */
  isLikelySpam(): boolean {
    const spamKeywords = [
      'viagra', 'casino', 'lottery', 'winner', 'congratulations',
      'click here', 'urgent', 'limited time', 'act now', 'free money',
      'guaranteed', 'no obligation', 'risk free', 'call now',
      'crypto', 'bitcoin', 'investment opportunity'
    ];

    const suspiciousPatterns = [
      /\$[\d,]+/g, // Money amounts
      /\d{10,}/g, // Long numbers
      /([A-Z]{3,}\s+){3,}/g, // Multiple caps words
      /(https?:\/\/[^\s]+)/g, // URLs
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi // Email addresses
    ];

    const text = `${this.subject} ${this.message}`.toLowerCase();
    
    // Check for spam keywords
    const keywordMatches = spamKeywords.filter(keyword => text.includes(keyword)).length;
    
    // Check for suspicious patterns
    const patternMatches = suspiciousPatterns.filter(pattern => pattern.test(text)).length;
    
    // Calculate spam score (0-100)
    const spamScore = (keywordMatches * 20) + (patternMatches * 15);
    
    return spamScore >= 40; // Threshold for spam detection
  }

  /**
   * Check if message requires urgent attention
   */
  isUrgent(): boolean {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical'];
    const text = `${this.subject} ${this.message}`.toLowerCase();
    return urgentKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Mark message as read
   */
  markAsRead(): ContactMessage {
    return new ContactMessage(
      this.id,
      this.senderName,
      this.senderEmail,
      this.senderPhone,
      this.subject,
      this.message,
      true, // isRead
      this.isSpam,
      this.isArchived,
      this.defaultReplyEmail,
      this.metadata,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  /**
   * Mark message as spam
   */
  markAsSpam(): ContactMessage {
    return new ContactMessage(
      this.id,
      this.senderName,
      this.senderEmail,
      this.senderPhone,
      this.subject,
      this.message,
      this.isRead,
      true, // isSpam
      this.isArchived,
      this.defaultReplyEmail,
      this.metadata,
      this.createdAt,
      new Date() // updatedAt
    );
  }

  /**
   * Archive message
   */
  archive(): ContactMessage {
    return new ContactMessage(
      this.id,
      this.senderName,
      this.senderEmail,
      this.senderPhone,
      this.subject,
      this.message,
      this.isRead,
      this.isSpam,
      true, // isArchived
      this.defaultReplyEmail,
      this.metadata,
      this.createdAt,
      new Date() // updatedAt
    );
  }
}