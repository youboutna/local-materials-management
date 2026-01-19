/**
 * Quantity Takeoff Use Cases
 */

import { QuantityTakeoffWithDetails } from '@/types/quantityTakeoff';
import { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Get Quantity Takeoffs by Project
export interface GetQuantityTakeoffsResult {
  success: boolean;
  quantityTakeoffs: QuantityTakeoffWithDetails[];
  error?: string;
}

export class GetQuantityTakeoffsUseCase {
  private quantityTakeoffRepository: IQuantityTakeoffRepository;

  constructor(quantityTakeoffRepository?: IQuantityTakeoffRepository) {
    this.quantityTakeoffRepository = quantityTakeoffRepository || RepositoryFactory.getQuantityTakeoffRepository();
  }

  async execute(projectId: string): Promise<GetQuantityTakeoffsResult> {
    try {
      const quantityTakeoffs = await this.quantityTakeoffRepository.findByProjectId(projectId);
      return { success: true, quantityTakeoffs };
    } catch (error) {
      console.error('GetQuantityTakeoffsUseCase error:', error);
      return {
        success: false,
        quantityTakeoffs: [],
        error: error instanceof Error ? error.message : 'Failed to fetch quantity takeoffs'
      };
    }
  }
}

// Delete Quantity Takeoff
export interface DeleteQuantityTakeoffResult {
  success: boolean;
  error?: string;
}

export class DeleteQuantityTakeoffUseCase {
  private quantityTakeoffRepository: IQuantityTakeoffRepository;

  constructor(quantityTakeoffRepository?: IQuantityTakeoffRepository) {
    this.quantityTakeoffRepository = quantityTakeoffRepository || RepositoryFactory.getQuantityTakeoffRepository();
  }

  async execute(id: string): Promise<DeleteQuantityTakeoffResult> {
    try {
      await this.quantityTakeoffRepository.delete(id);
      return { success: true };
    } catch (error) {
      console.error('DeleteQuantityTakeoffUseCase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete quantity takeoff'
      };
    }
  }
}

// Get Total Quantity by Unit
export interface GetTotalQuantityByUnitResult {
  success: boolean;
  total: number;
  error?: string;
}

export class GetTotalQuantityByUnitUseCase {
  private quantityTakeoffRepository: IQuantityTakeoffRepository;

  constructor(quantityTakeoffRepository?: IQuantityTakeoffRepository) {
    this.quantityTakeoffRepository = quantityTakeoffRepository || RepositoryFactory.getQuantityTakeoffRepository();
  }

  async execute(projectId: string, unit: string): Promise<GetTotalQuantityByUnitResult> {
    try {
      const total = await this.quantityTakeoffRepository.getTotalQuantityByUnit(projectId, unit);
      return { success: true, total };
    } catch (error) {
      console.error('GetTotalQuantityByUnitUseCase error:', error);
      return {
        success: false,
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to get total quantity'
      };
    }
  }
}

// Get Total Value
export interface GetTotalValueResult {
  success: boolean;
  totalValue: number;
  error?: string;
}

export class GetTotalValueUseCase {
  private quantityTakeoffRepository: IQuantityTakeoffRepository;

  constructor(quantityTakeoffRepository?: IQuantityTakeoffRepository) {
    this.quantityTakeoffRepository = quantityTakeoffRepository || RepositoryFactory.getQuantityTakeoffRepository();
  }

  async execute(projectId: string): Promise<GetTotalValueResult> {
    try {
      const totalValue = await this.quantityTakeoffRepository.getTotalValue(projectId);
      return { success: true, totalValue };
    } catch (error) {
      console.error('GetTotalValueUseCase error:', error);
      return {
        success: false,
        totalValue: 0,
        error: error instanceof Error ? error.message : 'Failed to get total value'
      };
    }
  }
}
