/**
 * PV Generator Adapter - Supabase Implementation
 * Implements IPVGeneratorRepository using Supabase
 *
 * inspection_pvs and inspections both live in the btp schema, accessed via btpClient.
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import { IPVGeneratorRepository, SavedPVRecord } from '@/domain/repositories/IPVGeneratorRepository';
import type { Database } from '@/integrations/supabase/types';

type InspectionPVRow = Database['btp']['Tables']['inspection_pvs']['Row'];

const toSavedPVRecord = (row: InspectionPVRow): SavedPVRecord => ({
  ...row,
  metadata: (row.metadata ?? null) as Record<string, unknown> | null,
});
type InspectionPVInsert = Database['btp']['Tables']['inspection_pvs']['Insert'];

export class PVGeneratorAdapter implements IPVGeneratorRepository {

  
  async getInspectionWithProject(inspectionId: string): Promise<any> {
    const { data, error } = await btpClient
      .from('inspections')
      .select(`
        *,
        projects (title, location),
        project_phases (phase_name)
      `)
      .eq('id', inspectionId)
      .single();

    if (error) throw error;
    return data;
  }


  async savePV(pvData: {
    inspection_id: string;
    pv_number: string;
    pv_type: string;
    title?: string;
    content: string;
    pdf_url?: string;
    status?: string;
    generated_by?: string;
    version?: number;
    metadata?: Record<string, unknown>;
    generated_at?: string;
  }): Promise<SavedPVRecord> {
    const payload: InspectionPVInsert = {
      ...pvData,
      status: pvData.status ?? 'draft',
      version: pvData.version ?? 1,
      generated_at: pvData.generated_at ?? new Date().toISOString(),
      metadata: (pvData.metadata ?? null) as InspectionPVInsert['metadata'],
    };

    const { data, error } = await btpClient
      .from('inspection_pvs')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return toSavedPVRecord(data);
  }

  async getInspectionPVs(inspectionId: string): Promise<SavedPVRecord[]> {
    const { data, error } = await btpClient
      .from('inspection_pvs')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toSavedPVRecord);
  }

  async getPVById(pvId: string): Promise<SavedPVRecord | null> {
    const { data, error } = await btpClient
      .from('inspection_pvs')
      .select('*')
      .eq('id', pvId)
      .maybeSingle();

    if (error) throw error;
    return data ? toSavedPVRecord(data) : null;
  }

  async getPVContent(pvId: string): Promise<string | null> {
    const { data, error } = await btpClient
      .from('inspection_pvs')
      .select('content')
      .eq('id', pvId)
      .maybeSingle();

    if (error) throw error;
    return data?.content || null;
  }
}

