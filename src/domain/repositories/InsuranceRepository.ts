/**
 * Insurance Repository - Hexagonal Architecture
 * Domain repository interface for insurance certificate management
 * Uses adapters for data access
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { InsuranceCertificateFilterData } from '@/dtos/entities/InsuranceCertificateDTO';

export interface IInsuranceRepository {
  getActiveCertificates(): Promise<InsuranceCertificateEntity[]>;
  getByProjectId(projectId: string): Promise<InsuranceCertificateEntity[]>;
  getById(id: string): Promise<InsuranceCertificateEntity | null>;
  create(certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceCertificateEntity>;
  update(id: string, updates: Partial<InsuranceCertificateEntity>): Promise<InsuranceCertificateEntity>;
  delete(id: string): Promise<void>;
  getExpiringSoon(daysThreshold: number): Promise<InsuranceCertificateEntity[]>;
  getByContractorId(contractorId: string): Promise<InsuranceCertificateEntity[]>;
  search(filters: InsuranceCertificateFilterData): Promise<InsuranceCertificateEntity[]>;
}

export class InsuranceRepository implements IInsuranceRepository {
  private adapter = RepositoryFactory.getInsuranceRepository();

  async getActiveCertificates(): Promise<InsuranceCertificateEntity[]> {
    return this.adapter.getActiveCertificates();
  }

  async getByProjectId(projectId: string): Promise<InsuranceCertificateEntity[]> {
    return this.adapter.getByProjectId(projectId);
  }

  async getById(id: string): Promise<InsuranceCertificateEntity | null> {
    return this.adapter.getById(id);
  }

  async create(certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceCertificateEntity> {
    return this.adapter.create(certificate);
  }

  async update(id: string, updates: Partial<InsuranceCertificateEntity>): Promise<InsuranceCertificateEntity> {
    return this.adapter.update(id, updates);
  }

  async delete(id: string): Promise<void> {
    return this.adapter.delete(id);
  }

  async getExpiringSoon(daysThreshold: number): Promise<InsuranceCertificateEntity[]> {
    return this.adapter.getExpiringSoon(daysThreshold);
  }

  async getByContractorId(contractorId: string): Promise<InsuranceCertificateEntity[]> {
    return this.adapter.getByContractorId(contractorId);
  }

  async search(filters: InsuranceCertificateFilterData): Promise<InsuranceCertificateEntity[]> {
    return this.adapter.search(filters);
  }
}
