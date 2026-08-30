/**
 * Contract Repository Port (btp.contracts + btp.contract_lines)
 * Trace contractuelle d'une attribution : appel d'offres → prestataire → projet.
 */

import type { ContractRecordDTO, CreateContractRecordDTO, UpdateContractRecordDTO } from '@/dtos/entities/ContractRecordDTO';
import type {
  ContractLineDTO,
  CreateContractLineDTO,
  UpdateContractLineDTO,
} from '@/dtos/entities/ContractLineDTO';

export interface ContractQueryFilters {
  status?: string;
  contractType?: string;
  search?: string;
  limit?: number;
}

export interface IContractRepository {
  findById(id: string): Promise<ContractRecordDTO | null>;
  findAll(filters?: ContractQueryFilters): Promise<ContractRecordDTO[]>;
  findByProjectId(projectId: string): Promise<ContractRecordDTO[]>;
  findByTenderId(tenderId: string): Promise<ContractRecordDTO[]>;
  findBySupplierId(supplierId: string): Promise<ContractRecordDTO[]>;
  create(dto: CreateContractRecordDTO): Promise<ContractRecordDTO>;
  update(id: string, dto: UpdateContractRecordDTO): Promise<ContractRecordDTO>;
  updateStatus(id: string, status: string): Promise<ContractRecordDTO>;
  delete(id: string): Promise<void>;

  // --- Lignes contractuelles (prix figés) ---
  findLines(contractId: string): Promise<ContractLineDTO[]>;
  createLines(lines: CreateContractLineDTO[]): Promise<ContractLineDTO[]>;
  updateLine(id: string, patch: UpdateContractLineDTO): Promise<ContractLineDTO>;
  deleteLine(id: string): Promise<void>;
  deleteLinesByContract(contractId: string): Promise<void>;
}
