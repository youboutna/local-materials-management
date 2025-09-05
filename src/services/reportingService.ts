import { supabase } from '@/integrations/supabase/client';
import { ProjectData } from '@/types/project';
import { format } from 'date-fns';

export interface ReportData {
  bankGuarantees?: any[];
  insurance?: any[];
  paymentBlocks?: any[];
  suppliers?: any[];
  documents?: any[];
  employees?: any[];
  escalationAlerts?: any[];
  materials?: any[];
  phases?: any[];
  inspections?: any[];
}

export interface CostCalculation {
  actualCost: number;
  estimatedCost: number;
  materialCost: number;
  laborCost: number;
}

export class ReportingService {
  
  /**
   * Fetch all data needed for project reports
   */
  static async fetchReportData(projectId: string): Promise<ReportData> {
    try {
      const [
        bankGuaranteesResult,
        insuranceResult,
        paymentBlocksResult,
        materialsResult,
        phasesResult,
        inspectionsResult,
        documentsResult,
        employeesResult
      ] = await Promise.all([
        supabase.from('bank_guarantees').select('*').eq('project_id', projectId),
        supabase.from('insurance_certificates').select('*').eq('project_id', projectId),
        supabase.from('payment_blocks').select('*').eq('project_id', projectId),
        supabase.from('project_materials').select(`
          quantity,
          materials (
            name,
            unit,
            price_per_unit
          )
        `).eq('project_id', projectId),
        supabase.from('project_phases').select('*').eq('project_id', projectId),
        supabase.from('inspections').select('*').eq('project_id', projectId),
        supabase.from('documents').select('*').eq('project_id', projectId),
        supabase.from('phase_employees').select(`
          *,
          employees (
            full_name,
            position,
            department
          ),
          project_phases!inner (
            project_id
          )
        `).eq('project_phases.project_id', projectId)
      ]);

      // Fetch suppliers (simplified for now)
      const suppliersResult = await supabase.from('suppliers').select('*').limit(50);

      // Fetch escalation alerts (notifications)
      const alertsResult = await supabase
        .from('notifications')
        .select('*')
        .eq('related_id', projectId)
        .in('type', ['escalation', 'alert', 'warning']);

      return {
        bankGuarantees: bankGuaranteesResult.data || [],
        insurance: insuranceResult.data || [],
        paymentBlocks: paymentBlocksResult.data || [],
        suppliers: suppliersResult.data || [],
        documents: documentsResult.data || [],
        employees: employeesResult.data || [],
        escalationAlerts: alertsResult.data || [],
        materials: materialsResult.data || [],
        phases: phasesResult.data || [],
        inspections: inspectionsResult.data || []
      };
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  }

  /**
   * Calculate project costs
   */
  static async calculateProjectCosts(projectId: string): Promise<CostCalculation> {
    try {
      // Calculate actual costs from materials and human resources
      const { data: materialCosts } = await supabase
        .from('project_materials')
        .select(`
          quantity,
          materials (
            price_per_unit
          )
        `)
        .eq('project_id', projectId);

      const { data: humanResourceCosts } = await supabase
        .from('phase_employees')
        .select(`
          daily_rate,
          start_date,
          end_date,
          project_phases!inner (
            project_id
          )
        `)
        .eq('project_phases.project_id', projectId);

      let materialCost = 0;
      if (materialCosts) {
        materialCost = materialCosts.reduce((sum, item) => {
          const price = item.materials?.price_per_unit || 0;
          return sum + (item.quantity * price);
        }, 0);
      }

      let laborCost = 0;
      if (humanResourceCosts) {
        laborCost = humanResourceCosts.reduce((sum, employee) => {
          if (!employee.daily_rate || !employee.start_date || !employee.end_date) return sum;
          const startDate = new Date(employee.start_date);
          const endDate = new Date(employee.end_date);
          const workingDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
          return sum + (employee.daily_rate * workingDays);
        }, 0);
      }

      const actualCost = materialCost + laborCost;

      // Calculate estimated costs from quantity takeoffs and phase estimates
      const { data: quantityTakeoffs } = await supabase
        .from('quantity_takeoffs')
        .select(`
          quantity,
          materials (
            price_per_unit
          )
        `)
        .eq('project_id', projectId);

      const { data: phaseData } = await supabase
        .from('project_phases')
        .select('estimated_cost, human_resources')
        .eq('project_id', projectId);

      let takeoffTotal = 0;
      if (quantityTakeoffs) {
        takeoffTotal = quantityTakeoffs.reduce((sum, item) => {
          const price = item.materials?.price_per_unit || 0;
          return sum + (item.quantity * price);
        }, 0);
      }

      let hrEstimatedTotal = 0;
      if (phaseData) {
        hrEstimatedTotal = phaseData.reduce((sum, phase) => {
          if (phase.human_resources && Array.isArray(phase.human_resources)) {
            const phaseHrCost = phase.human_resources.reduce((hrSum: number, hr: any) => {
              const dailyRate = hr.daily_rate || 0;
              const estimatedDays = hr.estimated_days || 30;
              return hrSum + (dailyRate * estimatedDays);
            }, 0);
            return sum + phaseHrCost;
          }
          return sum + (phase.estimated_cost || 0);
        }, 0);
      }

      const estimatedCost = takeoffTotal + hrEstimatedTotal;

      return {
        actualCost,
        estimatedCost,
        materialCost,
        laborCost
      };
    } catch (error) {
      console.error('Error calculating project costs:', error);
      return {
        actualCost: 0,
        estimatedCost: 0,
        materialCost: 0,
        laborCost: 0
      };
    }
  }

  /**
   * Generate supplier payment summary
   */
  static async generateSupplierPaymentSummary(supplierId: string, payments: any[]) {
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const paidAmount = payments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const pendingAmount = payments
      .filter(payment => payment.status === 'pending')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const overdueAmount = payments
      .filter(payment => payment.status === 'overdue')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      paymentCount: payments.length
    };
  }

  /**
   * Generate inspection summary
   */
  static generateInspectionSummary(inspections: any[]) {
    return {
      total: inspections.length,
      approved: inspections.filter(i => i.status === 'approved').length,
      rejected: inspections.filter(i => i.status === 'rejected').length,
      pending: inspections.filter(i => i.status === 'pending').length,
      requiresChanges: inspections.filter(i => i.status === 'requires_changes').length
    };
  }
}