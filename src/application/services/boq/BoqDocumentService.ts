import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';

/** Canonical application boundary for BOQ persistence; adapters remain provider-specific. */
export class BoqDocumentService implements IBoqRepository {
  constructor(private readonly repository?: IBoqRepository) {}
  private async port(): Promise<IBoqRepository> {
    if (this.repository) return this.repository;
    const { boqRepository } = await import('@/infrastructure/adapters/supabase/SupabaseBoqRepository');
    return boqRepository;
  }
  async list(filter: BoqLineFilter) { return (await this.port()).list(filter); }
  async create(dto: BoqLineDTO) { return (await this.port()).create(dto); }
  async bulkCreate(dtos: BoqLineDTO[]) { return (await this.port()).bulkCreate(dtos); }
  async update(id: string, dto: Partial<BoqLineDTO>) { return (await this.port()).update(id, dto); }
  async updateStatus(ids: string[], status: NonNullable<BoqLineDTO['status']>, source: BoqLineDTO['source']) {
    return (await this.port()).updateStatus(ids, status, source);
  }
  async delete(id: string, source: BoqLineDTO['source']) { return (await this.port()).delete(id, source); }
  async deleteMany(ids: string[], source: BoqLineDTO['source']) { return (await this.port()).deleteMany(ids, source); }
}

const service = new BoqDocumentService();
export function getBoqDocumentService(): BoqDocumentService { return service; }