/**
 * IBoqRepository — port for BOQ line persistence.
 * A single adapter (`SupabaseBoqRepository`) routes to the correct table by `source`.
 */
import type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';

export interface IBoqRepository {
  list(filter: BoqLineFilter): Promise<BoqLineDTO[]>;
  bulkCreate(dtos: BoqLineDTO[]): Promise<BoqLineDTO[]>;
  create(dto: BoqLineDTO): Promise<BoqLineDTO>;
  update(id: string, dto: Partial<BoqLineDTO>): Promise<BoqLineDTO>;
  updateStatus(ids: string[], status: NonNullable<BoqLineDTO['status']>, source: BoqLineDTO['source']): Promise<void>;
  delete(id: string, source: BoqLineDTO['source']): Promise<void>;
}
