// @ts-nocheck
/**
 * PV Generator Adapter - Supabase Implementation
 * Implements IPVGeneratorRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { IPVGeneratorRepository } from '@/domain/repositories/IPVGeneratorRepository';

export class PVGeneratorAdapter implements IPVGeneratorRepository {
  
  async getInspectionWithProject(inspectionId: string): Promise<any> {
    const { data, error } = await supabase
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
    pv_type: string;
    content: string;
    generated_at: string;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('inspection_pvs')
      .insert(pvData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getInspectionPVs(inspectionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('inspection_pvs')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPVContent(pvId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('inspection_pvs')
      .select('content')
      .eq('id', pvId)
      .single();

    if (error) throw error;
    return data?.content || null;
  }
}
