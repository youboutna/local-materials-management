/**
 * Insurance Repository - Hexagonal Architecture
 * Domain repository interface for insurance certificate management
 * Uses adapters for data access
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InsuranceCertificateEntity } from '@/types/insurance.entity';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface IInsuranceRepository {
  getActiveCertificates(): Promise<InsuranceCertificateEntity[]>;
  getByProjectId(projectId: string): Promise<InsuranceCertificateEntity[]>;
  getById(id: string): Promise<InsuranceCertificateEntity | null>;
  create(certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceCertificateEntity>;
  update(id: string, updates: Partial<InsuranceCertificateEntity>): Promise<InsuranceCertificateEntity>;
  delete(id: string): Promise<void>;
  getExpiringSoon(daysThreshold: number): Promise<InsuranceCertificateEntity[]>;
  getByContractorId(contractorId: string): Promise<InsuranceCertificateEntity[]>;
  search(filters: any): Promise<InsuranceCertificateEntity[]>;
}

export class InsuranceRepository implements IInsuranceRepository {
