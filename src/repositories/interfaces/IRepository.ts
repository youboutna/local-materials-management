/**
 * Generic Repository Interface (Repository Pattern)
 * Allows abstraction from data source (Supabase, Java API, Prisma, PostGIS, etc.)
 */

export interface IRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: Record<string, any>): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface IPaginatedRepository<T> extends IRepository<T> {
  findPaginated(
    page: number, 
    pageSize: number, 
    filters?: Record<string, any>
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number }>;
}

export interface ITransactionalRepository {
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}
