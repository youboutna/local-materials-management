/**
 * Contract Repository Port (btp.contracts)
 * Trace contractuelle d'une attribution : appel d'offres → prestataire → projet.
 */

import type { ContractRecordDTO, CreateContractRecordDTO } from '@/dtos/entities/ContractRecordDTO';

export interface IContractRepository {
  findById(id: string): Promise<ContractRecordDTO | null>;
  findByProjectId(projectId: string): Promise<ContractRecordDTO[]>;
  findByTenderId(tenderId: string): Promise<ContractRecordDTO[]>;
  findBySupplierId(supplierId: string): Promise<ContractRecordDTO[]>;
  create(dto: CreateContractRecordDTO): Promise<ContractRecordDTO>;
  updateStatus(id: string, status: string): Promise<ContractRecordDTO>;
}
