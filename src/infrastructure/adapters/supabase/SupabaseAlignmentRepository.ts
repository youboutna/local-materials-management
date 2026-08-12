/**
 * SupabaseAlignmentRepository — port Supabase pour l'historique d'alignement
 * "nom extrait → ressource". Table cible : public.boq_alignment_history
 * (vue miroir de btp.boq_alignment_history).
 */
import { supabase } from '@/integrations/supabase/client';
import type { AlignmentEntry, IAlignmentRepository } from '@/application/services/boq/AlignmentService';

const TABLE = 'boq_alignment_history';

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): AlignmentEntry {
  return {
    id: r.id,
    extractedName: r.extracted_name,
    resourceId: r.resource_id,
    resourceType: r.resource_type,
    occurrences: r.occurrences ?? 1,
    createdBy: r.created_by ?? null,
    createdAt: r.created_at,
  };
}

export class SupabaseAlignmentRepository implements IAlignmentRepository {
  async find(extractedName: string): Promise<AlignmentEntry | null> {
    const key = normalizeKey(extractedName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('normalized_key', key)
      .order('occurrences', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return fromRow(data);
  }

  async upsert(entry: AlignmentEntry): Promise<AlignmentEntry> {
    const key = normalizeKey(entry.extractedName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (supabase as any)
      .from(TABLE)
      .select('id, occurrences')
      .eq('normalized_key', key)
      .eq('resource_id', entry.resourceId)
      .maybeSingle();
    if (existing?.data?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .update({ occurrences: (existing.data.occurrences ?? 1) + 1 })
        .eq('id', existing.data.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return fromRow(data);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .insert({
        extracted_name: entry.extractedName,
        normalized_key: key,
        resource_id: entry.resourceId,
        resource_type: entry.resourceType,
        occurrences: entry.occurrences ?? 1,
        created_by: entry.createdBy ?? null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data);
  }

  async list(limit = 100): Promise<AlignmentEntry[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .order('occurrences', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map(fromRow);
  }
}
