/**
 * Blocked Sender Domain Entity
 * Represents a blocked email address for spam management
 */

export class BlockedSender {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly reason: string | null,
    public readonly blockedBy: string | null,
    public readonly blockedAt: Date,
    public readonly isActive: boolean,
    public readonly createdAt: Date
  ) {}

  /**
   * Check if this blocked sender is currently active
   */
  isCurrentlyBlocked(): boolean {
    return this.isActive;
  }

  /**
   * Check if email matches this blocked sender
   */
  blocksEmail(email: string): boolean {
    return this.email.toLowerCase() === email.toLowerCase() && this.isActive;
  }

  /**
   * Deactivate this blocked sender
   */
  deactivate(): BlockedSender {
    return new BlockedSender(
      this.id,
      this.email,
      this.reason,
      this.blockedBy,
      this.blockedAt,
      false, // isActive
      this.createdAt
    );
  }

  /**
   * Reactivate this blocked sender
   */
  reactivate(): BlockedSender {
    return new BlockedSender(
      this.id,
      this.email,
      this.reason,
      this.blockedBy,
      this.blockedAt,
      true, // isActive
      this.createdAt
    );
  }
}