/**
 * Supabase Inspection Payment Validation Adapter
 * Implements IInspectionPaymentValidationRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IInspectionPaymentValidationRepository, 
  PaymentRequest, 
  ProjectDetails, 
  InspectionDetails 
} from '@/domain/repositories/IInspectionPaymentValidationRepository';

export class SupabaseInspectionPaymentValidationAdapter implements IInspectionPaymentValidationRepository {
  // ============= Inspection Queries =============

  async getInspectionWithPaymentRequest(inspectionId: string): Promise<InspectionDetails | null> {
    // Get inspection
    const { data: inspectionData, error: inspectionError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (inspectionError) throw inspectionError;
    
    // Check if inspection is approved
    if (inspectionData?.status !== 'approved') {
      return null;
    }
    
    // Check if there's a pending payment request linked to this inspection
    const { data: paymentRequest } = await supabase
      .from('supplier_payment_requests')
      .select('*')
      .eq('inspection_id', inspectionId)
      .eq('status', 'pending')
      .single();
    
    // Only return inspection if it has a pending payment request
    if (!paymentRequest) {
      return null;
    }
    
    return inspectionData as InspectionDetails;
  }

  async getProjectWithStakeholders(projectId: string): Promise<ProjectDetails | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_stakeholders(
          stakeholder_type,
          stakeholder_entity_type,
          supplier_id,
          employee_id,
          suppliers(
            id,
            name,
            contact_person,
            phone,
            email
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data as ProjectDetails;
  }

  async updateInspectionStatus(inspectionId: string, status: string, comments: string): Promise<void> {
    const { error } = await supabase
      .from('inspections')
      .update({
        status,
        comments
      })
      .eq('id', inspectionId);

    if (error) throw error;
  }

  // ============= Stakeholder Information =============

  async getContractorInfo(projectId: string): Promise<any> {
    const project = await this.getProjectWithStakeholders(projectId);
    if (!project) return null;

    const stakeholders = project.project_stakeholders || [];
    const contractorStakeholder = stakeholders.find(s => 
      s.stakeholder_type === 'contractor' && s.stakeholder_entity_type === 'supplier'
    );
    
    if (contractorStakeholder?.supplier_id && project.suppliers) {
      const contractor = project.suppliers.find(s => s.id === contractorStakeholder.supplier_id);
      return contractor;
    }
    
    return null;
  }

  async getEngineerInfo(projectId: string): Promise<any> {
    const project = await this.getProjectWithStakeholders(projectId);
    if (!project) return null;

    const stakeholders = project.project_stakeholders || [];
    const engineerStakeholder = stakeholders.find(s => 
      s.stakeholder_type === 'engineering_consultant' && s.stakeholder_entity_type === 'employee'
    );
    
    if (engineerStakeholder?.employee_id && project.employees) {
      const engineer = project.employees.find(e => e.id === engineerStakeholder.employee_id);
      return engineer;
    }
    
    return null;
  }
}
