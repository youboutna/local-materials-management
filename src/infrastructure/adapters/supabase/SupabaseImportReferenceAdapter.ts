import type { IImportReferenceRepository, ImportQueryOutcome } from '@/domain/repositories/IImportReferenceRepository';

async function btp(): Promise<any> {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  return btpClient;
}

const outcome = <T>({ data, error }: { data: any; error: any }): ImportQueryOutcome<T> => ({
  data: (data ?? null) as T | null,
  error: error ? { code: error.code, message: error.message, details: error.details, hint: error.hint } : null,
});

export class SupabaseImportReferenceAdapter implements IImportReferenceRepository {
  async findOne(table: string, columns: string, column: string, value: string) {
    return outcome<Record<string, any>>(await (await btp()).from(table).select(columns).eq(column, value).maybeSingle());
  }
  async insertReturning(table: string, row: Record<string, unknown>) {
    return outcome<Record<string, any>>(await (await btp()).from(table).insert(row).select().single());
  }
  async insert(table: string, row: Record<string, unknown>) {
    return outcome<null>(await (await btp()).from(table).insert(row));
  }
  async updateById(table: string, id: string, row: Record<string, unknown>) {
    return outcome<null>(await (await btp()).from(table).update(row).eq('id', id));
  }
}
