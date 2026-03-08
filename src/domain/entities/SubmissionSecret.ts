/**
 * Submission Secret Domain Entity
 * Represents a secret code for tender submission access
 * Following hexagonal architecture: Props interface + create() factory
 */

export interface SubmissionSecretProps {
  id: string;
  submissionId: string;
  secretCode: string;
  expiresAt?: Date;
  isActive?: boolean;
  accessCount?: number;
  maxAccess?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SubmissionSecret {
  public readonly id: string;
  public readonly submissionId: string;
  public readonly secretCode: string;
  public readonly expiresAt: Date | undefined;
  public readonly isActive: boolean;
  public readonly accessCount: number;
  public readonly maxAccess: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: SubmissionSecretProps) {
    this.id = props.id;
    this.submissionId = props.submissionId;
    this.secretCode = props.secretCode;
    this.expiresAt = props.expiresAt;
    this.isActive = props.isActive ?? true;
    this.accessCount = props.accessCount ?? 0;
    this.maxAccess = props.maxAccess ?? 10;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  // ============= Factory Method =============
  static create(props: SubmissionSecretProps): SubmissionSecret {
    return new SubmissionSecret(props);
  }

  // ============= Business Logic =============
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isAccessLimitReached(): boolean {
    return this.accessCount >= this.maxAccess;
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired() && !this.isAccessLimitReached();
  }

  withIncrementedAccess(): SubmissionSecret {
    return SubmissionSecret.create({
      ...this.toProps(),
      accessCount: this.accessCount + 1,
      updatedAt: new Date()
    });
  }

  deactivate(): SubmissionSecret {
    return SubmissionSecret.create({
      ...this.toProps(),
      isActive: false,
      updatedAt: new Date()
    });
  }

  private toProps(): SubmissionSecretProps {
    return {
      id: this.id,
      submissionId: this.submissionId,
      secretCode: this.secretCode,
      expiresAt: this.expiresAt,
      isActive: this.isActive,
      accessCount: this.accessCount,
      maxAccess: this.maxAccess,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}