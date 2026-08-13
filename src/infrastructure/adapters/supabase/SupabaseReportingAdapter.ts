
import { EvmService } from '@/application/services/EvmService';
import { PhaseWeightingService } from '@/application/services/PhaseWeightingService';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import type { ReportSectionKey } from '@/config/referentials/reports/report-profiles.referential';
import { IReportingRepository, ReportSectionsData } from '@/domain/repositories/IReportingRepository';
import { EnhancedPhaseDTO, ProjectReportDTO } from '@/dtos/entities/ProjectReportDTO';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { toPhaseViewModel, type PhaseViewModel } from '@/utils/phaseViewModel';
import { ReportCalculations } from '@/utils/reportCalculations';

// Phase hydratée pour les rapports — camelCase + alias `name` pour rester
// compatible avec EnhancedPhaseDTO/ProjectDetailDTO côté UI/PDF.
type ReportPhase = PhaseViewModel & { name: string; actualProgress: number };

const hydratePhase = (row: unknown): ReportPhase => {
  const vm = toPhaseViewModel(row as Record<string, unknown>);
  return { ...vm, name: vm.title, actualProgress: vm.progress };
};

export class SupabaseReportingAdapter implements IReportingRepository {

  async getProjectPhases(projectId: string): Promise<EnhancedPhaseDTO[]> {
    const { data } = await supabase.from('project_phases')
      .select('*')
      .eq('project_id', projectId);

    if (!data || data.length === 0) return [];

    const phaseIds = data.map((p: any) => p.id).filter(Boolean);

    // Tâches et jalons réellement rattachés aux phases (une requête par collection).
    const [tasksRes, milestonesRes] = await Promise.all([
      supabase.from('task_assignments').select('*').in('phase_id', phaseIds),
      supabase.from('project_milestones').select('*').in('phase_id', phaseIds),
    ]);

    const tasksByPhase = new Map<string, any[]>();
    (tasksRes.data || []).forEach((t: any) => {
      const list = tasksByPhase.get(t.phase_id) || [];
      list.push(t);
      tasksByPhase.set(t.phase_id, list);
    });

    const milestonesByPhase = new Map<string, any[]>();
    (milestonesRes.data || []).forEach((m: any) => {
      const list = milestonesByPhase.get(m.phase_id) || [];
      list.push(m);
      milestonesByPhase.set(m.phase_id, list);
    });

    return data.map((phase: any) => {
      const vm = hydratePhase(phase);
      return {
        id: vm.id,
        name: vm.name,
        // Statut et avancement viennent de la base : `??` et non `||`,
        // sinon un 0 % réel serait écrasé par une estimation temporelle.
        status: vm.status || 'not_started',
        progress: vm.progress ?? 0,
        startDate: vm.startDate || undefined,
        endDate: vm.endDate || undefined,
        actualStartDate: (phase.actual_start_date as string) || undefined,
        actualEndDate: vm.actualEndDate || undefined,
        // budget = estimated_cost, actualCost = actual_cost (colonnes réelles)
        budget: vm.budget,
        actualCost: vm.actualCost,
        weight: phase.weight ?? undefined,
        tasks: (tasksByPhase.get(phase.id) || []).map((t: any) => ({
          id: t.id,
          title: t.title || t.name || 'Tâche',
          status: t.status || 'pending',
          progress: t.progress ?? 0,
          assignedTo: Array.isArray(t.assigned_to) ? t.assigned_to : t.assigned_to ? [t.assigned_to] : [],
          startDate: t.start_date || undefined,
          endDate: t.due_date || t.end_date || undefined,
        })),
        milestones: (milestonesByPhase.get(phase.id) || []).map((m: any) => ({
          id: m.id,
          title: m.title || m.name || 'Jalon',
          status: m.status || 'pending',
          dueDate: m.due_date || m.target_date || undefined,
          completedAt: m.completed_at || undefined,
          weight: m.weight ?? 0,
        })),
        createdAt: phase.created_at || undefined,
        updatedAt: phase.updated_at || undefined,
        createdBy: phase.created_by || undefined,
        updatedBy: phase.updated_by || undefined,
        version: 1,
      };
    });

  }

  async getProjectInspections(projectId: string): Promise<any[]> {
    const { data } = await supabase.from('inspections')
      .select('*')
      .eq('project_id', projectId);
    return data || [];
  }

  /**
   * Hydrate sectional report data driven by the user-selected sections.
   * Each query is gated by its corresponding section flag — disabled sections
   * return empty arrays to keep the PDF render shape stable and avoid waste.
   */
  async getProjectReportSections(
    projectId: string,
    sections: Partial<Record<ReportSectionKey, boolean>>,
  ): Promise<ReportSectionsData> {
    const empty: ReportSectionsData = {
      materials: [],
      inspections: [],
      bankGuarantees: [],
      insurance: [],
      paymentBlocks: [],
      suppliers: [],
      documents: [],
      employees: [],
      escalationAlerts: [],
      constructionMilestones: [],
    };

    const safeFetch = async <T>(label: string, p: Promise<{ data: T[] | null; error: any }>): Promise<T[]> => {
      try {
        const { data, error } = await p;
        if (error) {
          console.warn(`[ReportSections] ${label} fetch error:`, error.message);
          return [];
        }
        return data || [];
      } catch (e) {
        console.warn(`[ReportSections] ${label} threw:`, e);
        return [];
      }
    };

    const tasks: Array<Promise<void>> = [];

    if (sections.materials) {
      tasks.push(
        safeFetch('materials', supabase.from('project_materials').select('*').eq('project_id', projectId) as any)
          .then(rows => { empty.materials = rows; }),
      );
    }
    if (sections.inspections) {
      tasks.push(
        safeFetch('inspections', supabase.from('inspections').select('*').eq('project_id', projectId) as any)
          .then(rows => { empty.inspections = rows; }),
      );
    }
    if (sections.bankGuarantees) {
      tasks.push(
        safeFetch('bankGuarantees', supabase.from('bank_guarantees').select('*').eq('project_id', projectId) as any)
          .then(rows => { empty.bankGuarantees = rows; }),
      );
    }
    if (sections.insurance) {
      tasks.push(
        safeFetch('insurance', supabase.from('insurance_certificates').select('*').eq('project_id', projectId) as any)
          .then(rows => { empty.insurance = rows; }),
      );
    }
    if (sections.paymentBlocks) {
      tasks.push(
        safeFetch('paymentBlocks', supabase.from('payment_blocks').select('*').eq('project_id', projectId) as any)
          .then(rows => { empty.paymentBlocks = rows; }),
      );
    }
    if (sections.documents) {
      tasks.push(
        safeFetch('documents', supabase.from('documents').select('*').eq('project_id', projectId) as any)
          .then(rows => { empty.documents = rows; }),
      );
    }
    if (sections.milestones) {
      tasks.push(
        safeFetch('milestones', supabase.from('project_milestones').select('*').eq('project_id', projectId) as any)
          .then(rows => { empty.constructionMilestones = rows; }),
      );
    }
    if (sections.employees) {
      tasks.push(
        safeFetch(
          'employees',
          supabase
            .from('project_resources')
            .select('*')
            .eq('project_id', projectId)
            .eq('type', 'human') as any,
        ).then(rows => { empty.employees = rows; }),
      );
    }
    if (sections.suppliers) {
      // Suppliers are linked to a project via project_stakeholders.supplier_id.
      tasks.push(
        (async () => {
          const stakeholders = await safeFetch(
            'project_stakeholders',
            supabase
              .from('project_stakeholders')
              .select('supplier_id')
              .eq('project_id', projectId)
              .not('supplier_id', 'is', null) as any,
          );
          const ids = Array.from(
            new Set(stakeholders.map((s: any) => s.supplier_id).filter(Boolean)),
          );
          if (ids.length === 0) {
            empty.suppliers = [];
            return;
          }
          const rows = await safeFetch(
            'suppliers',
            supabase.from('suppliers').select('*').in('id', ids as string[]) as any,
          );
          empty.suppliers = rows;
        })(),
      );
    }
    // escalationAlerts: table not standardized — leave empty until referential exposes a feed.

    await Promise.all(tasks);
    return empty;
  }


  async calculateRealProjectCosts(projectId: string): Promise<any> {
    return await ProjectCalculationService.calculateRealProjectCosts(projectId);
  }

  async calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<any> {
    return await ProjectCalculationService.calculatePhaseResourceUtilization(projectId, phaseId);
  }

  async transformProjectForReport(project: any): Promise<ProjectReportDTO> {
    try {
      // Fetch real project data from database
      const [phasesData, milestonesData, materialsData, inspectionsData] = await Promise.all([
        supabase.from('project_phases').select('*').eq('project_id', project.id),
        supabase.from('project_milestones').select('*').eq('project_id', project.id),
        supabase.from('project_materials').select('*').eq('project_id', project.id),
        supabase.from('inspections').select('*').eq('project_id', project.id),
      ]);

      // Hydratation snake_case → camelCase via le transformer phase.
      const phases: ReportPhase[] = (phasesData.data || []).map(hydratePhase);
      const milestones = milestonesData.data || [];
      const materials = materialsData.data || [];
      const inspections = inspectionsData.data || [];

      const { data: paymentsData } = await supabase.from('payments')
        .select('amount')
        .eq('project_id', project.id);

      // Coût réel : coûts réels des phases (actual_cost) prioritaires, sinon paiements.
      const paymentsTotal =
        paymentsData?.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) || 0;
      const phasesActualCost = PhaseWeightingService.sumActualCost(phases as any);
      const actualCost = phasesActualCost > 0 ? phasesActualCost : paymentsTotal;

      // TEP pondéré : source unique de l'avancement projet dans les rapports.
      const weightedProgress = PhaseWeightingService.computeWeightedProgress(phases as any);
      const canonicalProgress = weightedProgress.isEmpty
        ? Number(project.progress ?? 0)
        : weightedProgress.progress;

      const evm = EvmService.compute({
        budget: Number(project.budget ?? 0),
        progress: canonicalProgress,
        startDate: project.startDate ?? project.start_date,
        endDate: project.endDate ?? project.end_date,
        actualCost,
        phases: phases as any,
      });
      const evmMetrics = EvmService.toLegacyMetrics(evm);

      // Santé projet à partir de données réelles (plus de 85/90/88 en dur) :
      //  - budget      : taux d'engagement budgétaire réel
      //  - planning    : SPI réel (converti en score 0..100), 0 si indéterminé
      //  - qualité     : taux de conformité des inspections réalisées
      const budgetUtilization = evm.budgetCommitmentRate;
      const schedulePerformance =
        evm.schedulePerformanceIndex !== null
          ? Math.max(0, Math.min(100, evm.schedulePerformanceIndex * 100))
          : 0;
      const qualityScore = this.computeInspectionQualityScore(inspections);

      const analytics = ProjectCalculationService.calculateProjectHealthScore(
        canonicalProgress,
        budgetUtilization,
        schedulePerformance,
        qualityScore,
      );

      return {
        project: {
          ...project,
          progress: canonicalProgress,
          progressBasis: evm.progressBasis,
          // `phases` (EnhancedPhaseDTO-like) ET `plannedPhases` (ProjectDetailDTO-like)
          // pointent sur la même source hydratée, plus de divergence snake/camel.
          phases,
          plannedPhases: phases,
          milestones: milestones.map((m: any) => ({
            ...m,
            title: m.title,
            status: this.getMilestoneStatus(m),
          })),
          materials,
          inspections,
        },
        evmMetrics,
        evm,
        analytics,
        generatedAt: new Date().toISOString(),
      } as unknown as ProjectReportDTO;

    } catch (error) {
      console.error('Error transforming project for report:', error);
      throw error;
    }
  }

  /**
   * Score qualité réel = taux de conformité des inspections terminées.
   * Retourne 0 (et non 85) quand aucune inspection n'est disponible : le
   * rapport doit refléter l'absence de donnée, pas une valeur inventée.
   */
  private computeInspectionQualityScore(inspections: any[]): number {
    const list = Array.isArray(inspections) ? inspections : [];
    const completed = list.filter(
      (i: any) => i?.status === 'completed' || i?.status === 'validated' || i?.status === 'approved',
    );
    if (completed.length === 0) return 0;

    const scored = completed
      .map((i: any) => Number(i?.score ?? i?.compliance_score ?? NaN))
      .filter((n: number) => Number.isFinite(n));

    if (scored.length > 0) {
      return Number(
        (scored.reduce((sum: number, n: number) => sum + n, 0) / scored.length).toFixed(2),
      );
    }

    const compliant = completed.filter(
      (i: any) => i?.result === 'compliant' || i?.is_compliant === true || i?.conformity === true,
    ).length;
    return Number(((compliant / completed.length) * 100).toFixed(2));
  }


  /**
   * Get milestone status
   */
  private getMilestoneStatus(milestone: any): string {
    if (milestone.completion_date) return 'completed';
    if (milestone.status === 'completed') return 'completed';
    if (milestone.target_date && new Date(milestone.target_date) < new Date()) return 'overdue';
    return 'pending';
  }
}
