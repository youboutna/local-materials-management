/**
 * PhaseSourceAggregateService — point de vérité UNIQUE des onglets d'une phase.
 *
 * Compose, sans aucune saisie manuelle :
 *   - PhaseResourceLinkService  → matériaux / équipements / main d'œuvre (boq_lines)
 *   - ProjectFinancialsService  → Budget → Engagé → Dépensé → Payé → Restant
 *   - StakeholderRepository     → intervenants (identités hydratées)
 *   - PhaseEmployeeService      → équipe déclarée (complément manuel)
 *
 * TypeScript pur : aucun hook, aucun accès direct au client Supabase.
 */
import { getPhaseResourceLinkService } from '@/application/services/boq/PhaseResourceLinkService';
import { getPhaseEmployeeService } from '@/application/services/PhaseEmployeeService';
import { getProjectFinancialsService } from '@/application/services/ProjectFinancialsService';
import type {
  PhaseAggregateDTO,
  PhaseDataSource,
  PhaseStakeholderRefDTO,
  PhaseTeamMemberDTO,
} from '@/dtos/entities/PhaseAggregateDTO';
import { emptyPhaseAggregate } from '@/dtos/entities/PhaseAggregateDTO';
import type { PhasePlannedResourcesDTO } from '@/dtos/entities/PhasePlannedResourcesDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export interface PhaseAggregateInput {
  projectId: string;
  phaseId: string;
  /** Budget déclaré de la phase (repli documenté si aucun DQE validé). */
  declaredBudget?: number | null;
  currency?: string;
}

const round2 = (v: number): number => Number((Number.isFinite(v) ? v : 0).toFixed(2));

export class PhaseSourceAggregateService {
  async getAggregate(input: PhaseAggregateInput): Promise<PhaseAggregateDTO> {
    const { projectId, phaseId } = input;
    const currency = input.currency || 'MRU';
    if (!projectId || !phaseId) return emptyPhaseAggregate(projectId || '', phaseId || '', currency);

    const [resources, financials, stakeholders, employees] = await Promise.all([
      this.loadResources(projectId, phaseId),
      getProjectFinancialsService()
        .getSummary({
          scope: 'phase',
          entityId: phaseId,
          declaredBudget: input.declaredBudget ?? 0,
          currency,
        })
        .catch(() => emptyPhaseAggregate(projectId, phaseId, currency).financials),
      this.loadStakeholders(projectId, phaseId),
      getPhaseEmployeeService()
        .getByPhase(phaseId)
        .catch(() => []),
    ]);

    const laborLines = resources.labor.lines;

    const team: PhaseTeamMemberDTO[] = [
      ...laborLines.map((line) => ({
        id: line.id,
        name: line.designation,
        role: line.category || 'Main d\u2019œuvre',
        origin: 'dqe' as const,
        quantity: line.quantity || null,
        unit: line.unit || null,
        dailyRate: line.unitPrice || null,
        totalCost: round2(line.totalHt),
        locked: line.locked,
      })),
      ...employees.map((row) => ({
        id: row.id,
        name: row.employeeName,
        role: row.employeeRole || 'Membre',
        origin: 'manuel' as const,
        quantity: null,
        unit: null,
        dailyRate: row.dailyRate ?? null,
        totalCost: round2(row.dailyRate ?? 0),
        locked: false,
      })),
    ];

    const source: PhaseDataSource = resources.chain.quoteAccepted
      ? 'devis'
      : resources.chain.hasDqe
        ? 'dqe'
        : employees.length > 0
          ? 'manuel'
          : 'aucune';

    // Le budget planifié privilégie la chaîne documentaire, puis la doctrine
    // financière (DQE validé / budget déclaré) — jamais une valeur non sourcée.
    const totalPlanned = round2(
      resources.totals.plannedCost > 0 ? resources.totals.plannedCost : financials.budgetTotal,
    );
    const totalEngaged = round2(
      resources.totals.engagedCost > 0 ? resources.totals.engagedCost : financials.engaged,
    );

    return {
      projectId,
      phaseId,
      source,
      linkedToBoq: resources.linkedToBoq,
      currency,
      totalPlanned,
      totalEngaged,
      totalSpent: financials.spent,
      totalPaid: financials.paid,
      remaining: round2(totalPlanned - financials.spent),
      remainingToPay: financials.remainingToPay,
      financials,
      resources,
      laborLines,
      team,
      stakeholders,
      counts: {
        materials: resources.materials.count,
        equipment: resources.equipment.count,
        labor: resources.labor.count,
        team: team.length,
        stakeholders: stakeholders.length,
      },
    };
  }

  private async loadResources(projectId: string, phaseId: string): Promise<PhasePlannedResourcesDTO> {
    try {
      return await getPhaseResourceLinkService().getPhaseResources(projectId, phaseId);
    } catch {
      return emptyPhaseAggregate(projectId, phaseId).resources;
    }
  }

  private async loadStakeholders(projectId: string, phaseId: string): Promise<PhaseStakeholderRefDTO[]> {
    try {
      const repository = RepositoryFactory.getStakeholderRepository();
      const rows = await repository.findByProjectId(projectId);
      return (rows || [])
        .map((s: any): PhaseStakeholderRefDTO => {
          const contact = s.contact ?? {};
          return {
            id: String(s.id),
            name: contact.name || s.organization?.name || 'Intervenant sans identité',
            roleCode: s.role ?? null,
            organization: s.organization?.name ?? null,
            email: contact.email || null,
            phone: contact.phone || null,
            isPrimary: !!s.isPrimary,
            isInternal: !!s.isInternal,
            scopedToPhase: s.phaseId ? String(s.phaseId) === phaseId : false,
          };
        })
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }
}

let instance: PhaseSourceAggregateService | null = null;

export function getPhaseSourceAggregateService(): PhaseSourceAggregateService {
  if (!instance) instance = new PhaseSourceAggregateService();
  return instance;
}
