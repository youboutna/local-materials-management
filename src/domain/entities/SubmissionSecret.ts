/**
 * Submission Secret Domain Entity
 * Represents a secret code for tender submission access
 */

export class SubmissionSecret {
  constructor(
    public id: string,
    public submissionId: string,
    public secretCode: string,
    public expiresAt: Date | undefined,
    public isActive: boolean,
    public accessCount: number,
    public maxAccess: number,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}
