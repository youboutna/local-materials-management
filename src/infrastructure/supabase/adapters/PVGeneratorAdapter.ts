// @ts-nocheck
/**
 * PV Generator Adapter - Supabase Implementation
 * Implements IPVGeneratorRepository using Supabase
 *
 * inspection_pvs lives in the public schema, so we use the default supabase client.
 * Inspection metadata still lives under btp.* and is accessed via btpClient.
 */

import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';
import { IPVGeneratorRepository } from '@/domain/repositories/IPVGeneratorRepository';

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
  }): Promise<any> {
    const payload: Record<string, unknown> = { ...pvData };
    if (!payload.status) payload.status = 'draft';
    if (!payload.version) payload.version = 1;
    if (!payload.generated_at) payload.generated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('inspection_pvs')
      .insert(payload)
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

  async getPVById(pvId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('inspection_pvs')
      .select('*')
      .eq('id', pvId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async getPVContent(pvId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('inspection_pvs')
      .select('content')
      .eq('id', pvId)
      .maybeSingle();

    if (error) throw error;
    return data?.content || null;
  }
}

