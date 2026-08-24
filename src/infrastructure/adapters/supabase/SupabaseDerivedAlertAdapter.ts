/**
 * Supabase Derived Alert Adapter
 * Lit l'état réel du projet (phases, jalons, tâches, inspections, paiements,
 * garanties, assurances, risques) et le retourne sous forme de signaux neutres.
 *
 * Aucune règle de criticité ici : les seuils vivent dans le référentiel.
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  DerivedAlertSignal,
  IDerivedAlertRepository,
} from '@/domain/repositories/IDerivedAlertRepository';

const CLOSED_STATUSES = ['completed', 'termine', 'terminee', 'terminé', 'terminée', 'cancelled', 'annule', 'annulee'];
const CLOSED_INSPECTION_STATUSES = [...CLOSED_STATUSES, 'validated', 'valide', 'validé', 'approved', 'approuve'];
const CLOSED_RISK_STATUSES = ['closed', 'ferme', 'fermé', 'resolved', 'resolu', 'résolu', 'mitigated'];

const isClosed = (status: string | null | undefined, closed: string[]): boolean =>
  closed.includes((status ?? '').trim().toLowerCase());

const nowIso = () => new Date().toISOString();
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Fenêtre de veille des échéances (garanties / assurances), en jours. */
const EXPIRY_WINDOW_DAYS = 60;

export class SupabaseDerivedAlertAdapter implements IDerivedAlertRepository {
  async findSignals(): Promise<DerivedAlertSignal[]> {
    return this.collect(null);
  }

  async findSignalsByProject(projectId: string): Promise<DerivedAlertSignal[]> {
    if (!projectId) return [];
    return this.collect(projectId);
  }

  private async collect(projectId: string | null): Promise<DerivedAlertSignal[]> {
    const scope = <T extends { eq: (c: string, v: string) => T }>(query: T): T =>
      projectId ? query.eq('project_id', projectId) : query;

    const results = await Promise.allSettled([
      scope(
        btpClient
          .from('project_phases')
          .select('id, project_id, phase_name, label_fr, end_date, status')
          .lt('end_date', nowIso())
          .limit(500) as never,
      ),
      scope(
        btpClient
          .from('project_milestones')
          .select('id, project_id, phase_id, title, target_date, status')
          .lt('target_date', nowIso())
          .limit(500) as never,
      ),
      scope(
        btpClient
          .from('task_assignments')
          .select('id, project_id, phase_id, title, due_date, status')
          .lt('due_date', nowIso())
          .limit(500) as never,
      ),
      scope(
        btpClient
          .from('inspections')
          .select('id, project_id, phase_id, date, status')
          .lt('date', nowIso())
          .limit(500) as never,
      ),
      scope(
        btpClient
          .from('payment_blocks')
          .select('id, project_id, amount, blocking_reasons, blocked_at, resolved_at')
          .is('resolved_at', null)
          .limit(500) as never,
      ),
      scope(
        btpClient
          .from('bank_guarantees')
          .select('id, project_id, phase_id, guarantee_number, bank_name, expiry_date, status')
          .lt('expiry_date', inDays(EXPIRY_WINDOW_DAYS))
          .limit(500) as never,
      ),
      scope(
        btpClient
          .from('insurance_certificates')
          .select('id, project_id, phase_id, policy_number, insurance_company, valid_until, status')
          .lt('valid_until', inDays(EXPIRY_WINDOW_DAYS))
          .limit(500) as never,
      ),
      scope(
        btpClient
          .from('project_risks')
          .select('id, project_id, risk_title, risk_level, status, due_date, identified_date')
          .limit(500) as never,
      ),
    ]);

    const rows = (index: number): Array<Record<string, unknown>> => {
      const result = results[index];
      if (result.status !== 'fulfilled') {
        console.warn('SupabaseDerivedAlertAdapter: signal source unavailable', result.reason);
        return [];
      }
      const payload = result.value as { data?: unknown; error?: unknown };
      if (payload?.error) {
        console.warn('SupabaseDerivedAlertAdapter: signal query error', payload.error);
        return [];
      }
      return (payload?.data as Array<Record<string, unknown>>) ?? [];
    };

    const str = (v: unknown): string => (typeof v === 'string' ? v : '');
    const signals: DerivedAlertSignal[] = [];

    rows(0).forEach((r) => {
      if (isClosed(str(r.status), CLOSED_STATUSES)) return;
      signals.push({
        kind: 'phase_overdue',
        entityId: str(r.id),
        projectId: str(r.project_id),
        phaseId: str(r.id),
        label: str(r.label_fr) || str(r.phase_name) || str(r.id),
        referenceDate: str(r.end_date),
        extra: { status: r.status },
      });
    });

    rows(1).forEach((r) => {
      if (isClosed(str(r.status), CLOSED_STATUSES)) return;
      signals.push({
        kind: 'milestone_overdue',
        entityId: str(r.id),
        projectId: str(r.project_id),
        phaseId: str(r.phase_id) || undefined,
        label: str(r.title) || str(r.id),
        referenceDate: str(r.target_date),
        extra: { status: r.status },
      });
    });

    rows(2).forEach((r) => {
      if (isClosed(str(r.status), CLOSED_STATUSES)) return;
      signals.push({
        kind: 'task_overdue',
        entityId: str(r.id),
        projectId: str(r.project_id),
        phaseId: str(r.phase_id) || undefined,
        label: str(r.title) || str(r.id),
        referenceDate: str(r.due_date),
        extra: { status: r.status },
      });
    });

    rows(3).forEach((r) => {
      if (isClosed(str(r.status), CLOSED_INSPECTION_STATUSES)) return;
      signals.push({
        kind: 'inspection_pending',
        entityId: str(r.id),
        projectId: str(r.project_id),
        phaseId: str(r.phase_id) || undefined,
        label: str(r.date).slice(0, 10),
        referenceDate: str(r.date),
        extra: { status: r.status },
      });
    });

    rows(4).forEach((r) => {
      const reasons = Array.isArray(r.blocking_reasons) ? (r.blocking_reasons as unknown[]) : [];
      signals.push({
        kind: 'payment_blocked',
        entityId: str(r.id),
        projectId: str(r.project_id),
        label: reasons.map((x) => str(x)).filter(Boolean).join(', ') || str(r.id),
        referenceDate: str(r.blocked_at) || nowIso(),
        extra: { amount: r.amount },
      });
    });

    rows(5).forEach((r) => {
      signals.push({
        kind: 'guarantee_expiring',
        entityId: str(r.id),
        projectId: str(r.project_id),
        phaseId: str(r.phase_id) || undefined,
        label: str(r.guarantee_number) || str(r.bank_name) || str(r.id),
        referenceDate: str(r.expiry_date),
        extra: { status: r.status },
      });
    });

    rows(6).forEach((r) => {
      signals.push({
        kind: 'insurance_expiring',
        entityId: str(r.id),
        projectId: str(r.project_id),
        phaseId: str(r.phase_id) || undefined,
        label: str(r.policy_number) || str(r.insurance_company) || str(r.id),
        referenceDate: str(r.valid_until),
        extra: { status: r.status },
      });
    });

    rows(7).forEach((r) => {
      if (isClosed(str(r.status), CLOSED_RISK_STATUSES)) return;
      const level = str(r.risk_level).toLowerCase();
      if (!['high', 'critical', 'eleve', 'élevé', 'critique'].includes(level)) return;
      signals.push({
        kind: 'risk_open',
        entityId: str(r.id),
        projectId: str(r.project_id),
        label: str(r.risk_title) || str(r.id),
        referenceDate: str(r.due_date) || str(r.identified_date) || nowIso(),
        extra: { riskLevel: r.risk_level, status: r.status },
      });
    });

    return signals.filter((s) => s.projectId && s.referenceDate);
  }
}
