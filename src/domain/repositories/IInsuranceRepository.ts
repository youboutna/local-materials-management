/**
 * Insurance Repository Interface
 * Defines contract for insurance certificate data access
 */

import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { InsuranceCertificateFilterData } from '@/dtos/entities/InsuranceDTO';;

export interface IInsuranceRepository {
  getByProjectId(projectId: string): Promise<InsuranceCertificateEntity[]>;
  getActiveCertificates(): Promise<InsuranceCertificateEntity[]>;
  getById(id: string): Promise<InsuranceCertificateEntity | null>;
  create(certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceCertificateEntity>;
  update(id: string, updates: Partial<InsuranceCertificateEntity>): Promise<InsuranceCertificateEntity>;
  delete(id: string): Promise<void>;
  getExpiringSoon(daysThreshold: number): Promise<InsuranceCertificateEntity[]>;
  getByContractorId(contractorId: string): Promise<InsuranceCertificateEntity[]>;
  search(filters: InsuranceCertificateFilterData): Promise<InsuranceCertificateEntity[]>;
}
