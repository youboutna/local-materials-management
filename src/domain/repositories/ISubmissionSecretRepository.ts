/**
 * Submission Secret Repository Interface
 * Defines persistence operations for submission secrets
 */
import { SubmissionSecret } from '../entities/SubmissionSecret';

export interface ISubmissionSecretRepository {
  save(entity: Partial<SubmissionSecret>): Promise<SubmissionSecret>;
  findById(id: string): Promise<SubmissionSecret | null>;
  findBySecretCode(secretCode: string): Promise<SubmissionSecret | null>;
  findBySubmissionId(submissionId: string): Promise<SubmissionSecret[]>;
  delete(entity: SubmissionSecret): Promise<void>;
  findExpired(): Promise<SubmissionSecret[]>;
}
