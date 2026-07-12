/**
 * AlignmentService — persiste et sert l'historique d'alignement
 * "nom extrait → resource_id" pour l'auto-mapping cross-import (DQE, devis,
 * factures fournisseur, calculateur).
 *
 * Table cible : btp.boq_alignment_history (créée dans migration séparée).
 * Hexagonal : dépend d'un port `IAlignmentRepository` — un adapter Supabase
 * peut être branché quand la table est disponible ; fallback in-memory sinon.
 */
import type { BoqResourceType } from '@/domain/boq/BoqLine';

export interface AlignmentEntry {
  id?: string;
  extractedName: string;
  resourceId: string;
  resourceType: BoqResourceType;
  occurrences: number;
  createdBy?: string | null;
  createdAt?: string;
}

export interface IAlignmentRepository {
  find(extractedName: string): Promise<AlignmentEntry | null>;
  upsert(entry: AlignmentEntry): Promise<AlignmentEntry>;
  list(limit?: number): Promise<AlignmentEntry[]>;
}

/** In-memory fallback (SSR-safe, tests). */
export class InMemoryAlignmentRepository implements IAlignmentRepository {
  private store = new Map<string, AlignmentEntry>();

  async find(extractedName: string) {
    const k = normalizeKey(extractedName);
    return this.store.get(k) ?? null;
  }
  async upsert(entry: AlignmentEntry) {
    const k = normalizeKey(entry.extractedName);
    const existing = this.store.get(k);
    const merged: AlignmentEntry = existing
      ? { ...existing, ...entry, occurrences: (existing.occurrences ?? 0) + 1 }
      : { ...entry, occurrences: entry.occurrences ?? 1 };
    this.store.set(k, merged);
    return merged;
  }
  async list(limit = 100) {
    return Array.from(this.store.values()).slice(0, limit);
  }
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export class AlignmentService {
  constructor(private repo: IAlignmentRepository = new InMemoryAlignmentRepository()) {}

  /** Lookup previous alignment; returns resourceId if known. */
  async suggestResource(extractedName: string): Promise<AlignmentEntry | null> {
    return this.repo.find(extractedName);
  }

  /** Persist user's confirmation of an extracted name → resource mapping. */
  async remember(entry: Omit<AlignmentEntry, 'occurrences' | 'id' | 'createdAt'>): Promise<AlignmentEntry> {
    return this.repo.upsert({ ...entry, occurrences: 1 });
  }

  /** Batch enrich extracted names with known resource ids. */
  async batchSuggest(names: string[]): Promise<Record<string, AlignmentEntry | null>> {
    const out: Record<string, AlignmentEntry | null> = {};
    await Promise.all(names.map(async (n) => { out[n] = await this.repo.find(n); }));
    return out;
  }
}

/** Singleton with in-memory repo — swap via setAlignmentRepository. */
let _instance = new AlignmentService();
export function getAlignmentService() { return _instance; }
export function setAlignmentRepository(repo: IAlignmentRepository) {
  _instance = new AlignmentService(repo);
}
