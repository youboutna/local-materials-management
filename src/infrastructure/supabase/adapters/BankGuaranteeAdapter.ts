/**
 * Bank Guarantee Adapter - Supabase Implementation
 * Implements IBankGuaranteeRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';

export class BankGuaranteeAdapter implements IBankGuaranteeRepository {
  
  async create(guarantee: {
    project_id: string;
    guarantee_type: string;
    guarantee_amount: number;
    issuing_bank: string;
    guarantee_number: string;
    issue_date: string;
    expiry_date: string;
    status: string;
    conditions: string[];
    documents: string[];
  }): Promise<any> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(guarantee)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getByProject(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateStatus(guaranteeId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', guaranteeId);

    if (error) throw error;
  }

  async releasePhaseGuarantees(phaseId: string): Promise<void> {
    const { error } = await supabase
      .from('phase_guarantees')
      .update({ released: true, released_at: new Date().toISOString() })
      .eq('phase_id', phaseId);

    if (error) throw error;
  }

  async releaseProjectGuarantees(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_guarantees')
      .update({ released: true, released_at: new Date().toISOString() })
      .eq('project_id', projectId);

    if (error) throw error;
  }

  async getById(guaranteeId: string): Promise<any> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('id', guaranteeId)
      .single();

    if (error) throw error;
    return data;
  }

  async update(guaranteeId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', guaranteeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(guaranteeId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', guaranteeId);

    if (error) throw error;
  }
}
