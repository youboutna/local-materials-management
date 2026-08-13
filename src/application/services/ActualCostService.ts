/**
 * ActualCostService — computes a realistic Actual Cost (AC) for EVM/CPI.
 *
 * Historically AC only counted validated payments, which left CPI undefined
 * whenever a project had committed resources (materials from the métré) but
 * no payment yet. This service adds resource commitments (quantity * unit
 * price) on top of payments so `computeActualCost` becomes CPI-ready.
 *
 * Zero React — pure application service, consumable by ProjectMetricsOrchestrator
 * callers (see wiring note in getTakeoffToBoqService / this file's header).
 */
import { getPaymentService, PaymentService } from '@/application/services/PaymentService';
import { getMaterialService, MaterialService } from '@/application/services/MaterialService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type { IPhaseMaterialRepository } from '@/domain/repositories/IPhaseMaterialRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface ActualCostBreakdown {
  paymentsCost: number;
  resourcesCost: number;
  /** paymentsCost + resourcesCost — feed this into ProjectMetricsOrchestrator's `actualCost` input. */
  actualCost: number;
}

export class ActualCostService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly materialService: MaterialService,
    private readonly phaseMaterialRepository: IPhaseMaterialRepository,
  ) {}

  /**
   * AC = paid payments + committed phase resources (quantity * unit price).
   * Resources without a matching material price contribute 0 (never throws on missing price).
   */
  async computeActualCost(projectId: string): Promise<ActualCostBreakdown> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');

    const [paymentSummary, resources] = await Promise.all([
      this.paymentService.getPaymentSummary(projectId),
      this.phaseMaterialRepository.findByProjectId(projectId),
    ]);

    const paymentsCost = paymentSummary.paid ?? 0;

    const materialIds = Array.from(new Set(resources.map((r) => r.materialId)));
    const priceById = new Map<string, number>();
    await Promise.all(
      materialIds.map(async (id) => {
        const material = await this.materialService.getMaterialById(id);
        priceById.set(id, material?.pricePerUnit ?? 0);
      }),
    );

    const resourcesCost = resources.reduce((sum, r) => {
      const price = priceById.get(r.materialId) ?? 0;
      return sum + r.quantity * price;
    }, 0);

    return {
      paymentsCost,
      resourcesCost,
      actualCost: paymentsCost + resourcesCost,
    };
  }
}

let instance: ActualCostService | null = null;

export function getActualCostService(): ActualCostService {
  if (!instance) {
    instance = new ActualCostService(
      getPaymentService(),
      getMaterialService(),
      RepositoryFactory.getPhaseMaterialRepository(),
    );
  }
  return instance;
}
