/**
 * Supabase Inspection Payment Validation Adapter
 * Implements IInspectionPaymentValidationRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
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
        id,
        title,
        description,
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
          ),
          employees(
            id,
            first_name,
            last_name,
            phone,
            email
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const { project_stakeholders, ...project } = data as typeof data & {
      project_stakeholders?: unknown;
    };

    return {
      ...project,
      stakeholders: project_stakeholders,
    } as ProjectDetails;
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

    const stakeholders = (project.stakeholders || []) as Array<{
      stakeholder_type: string;
      stakeholder_entity_type: string;
      supplier_id?: string | null;
      employee_id?: string | null;
      suppliers?: any;
    }>;
    const contractorStakeholder = stakeholders.find(s =>
      s.stakeholder_type === 'contractor' && s.stakeholder_entity_type === 'supplier'
    );

    if (contractorStakeholder?.supplier_id && contractorStakeholder.suppliers) {
      return contractorStakeholder.suppliers;
    }

    return null;
  }

  async getEngineerInfo(projectId: string): Promise<any> {
    const project = await this.getProjectWithStakeholders(projectId);
    if (!project) return null;

    const stakeholders = (project.stakeholders || []) as Array<{
      stakeholder_type: string;
      stakeholder_entity_type: string;
      supplier_id?: string | null;
      employee_id?: string | null;
      employees?: any;
    }>;
    const engineerStakeholder = stakeholders.find(s =>
      s.stakeholder_type === 'engineering_consultant' && s.stakeholder_entity_type === 'employee'
    );

    if (engineerStakeholder?.employee_id && engineerStakeholder.employees) {
      return engineerStakeholder.employees;
    }

    return null;
  }
}
