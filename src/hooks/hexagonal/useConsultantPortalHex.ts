/**
 * useConsultantPortalHex
 * Agrège, via les services hexagonaux uniquement, le périmètre du consultant :
 * projets suivis, alertes, échéances (garanties / assurances), notifications.
 * Aucun accès direct Supabase.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAlertsHex } from '@/hooks/hexagonal/useAlertsHex';
import { useNotificationsHex } from '@/hooks/hexagonal/useNotificationsHex';
import { useBankGuaranteesList } from '@/hooks/hexagonal/useBankGuaranteesHex';
import { useInsuranceCertificatesHex } from '@/hooks/hexagonal/useInsuranceCertificatesHex';
import { ConsultantScopeService } from '@/application/services/ConsultantScopeService';
import { DERIVED_ALERT_RULES } from '@/config/referentials/notifications/derived-alerts.referential';

export interface ConsultantProjectRef {
  id: string;
  title: string;
  progress: number;
  status?: string;
}

export interface ExpiryItem {
  id: string;
  kind: 'bank_guarantee' | 'insurance';
  label: string;
  reference: string;
  projectId?: string;
  expiryDate?: string | null;
  amount?: number;
}

const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
};

export function useConsultantPortalHex(consultantId?: string) {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['consultant-projects', consultantId],
    enabled: !!consultantId,
    staleTime: 60_000,
    queryFn: async (): Promise<ConsultantProjectRef[]> => {
      if (!consultantId) return [];
      const { getProjectService } = await import('@/application/services/ProjectService');
      const list = await getProjectService().getProjectsByConsultantId(consultantId);
      return list.map((p) => ({
        id: p.id,
        title: p.title ?? 'Projet sans titre',
        progress: Number((p as { progress?: number }).progress ?? 0),
        status: (p as { status?: string }).status,
      }));
    },
  });

  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);

  const { alerts, isLoading: alertsLoading, acknowledgeAlert, resolveAlert } = useAlertsHex();
  const { notifications, markAsRead, isLoading: notificationsLoading } = useNotificationsHex();
  const { data: guarantees = [], isLoading: guaranteesLoading } = useBankGuaranteesList();
  const { certificates = [], isLoading: insuranceLoading } = useInsuranceCertificatesHex();


  const scopedAlerts = useMemo(
    () =>
      ConsultantScopeService.filterProjects(alerts ?? [], projectIds),
    [alerts, projectIds],
  );

  const expiries = useMemo<ExpiryItem[]>(() => {
    const fromGuarantees: ExpiryItem[] = ConsultantScopeService.filterProjects(guarantees ?? [], projectIds)
      .map((g) => ({
        id: g.id,
        kind: 'bank_guarantee' as const,
        label: g.bankName || 'Garantie bancaire',
        reference: g.guaranteeType || 'garantie',
        projectId: g.projectId,
        expiryDate: g.expiryDate,
        amount: g.guaranteeAmount,
      }));

    const fromInsurance: ExpiryItem[] = ConsultantScopeService.filterProjects(certificates ?? [], projectIds)
      .map((c) => ({
        id: c.id,
        kind: 'insurance' as const,
        label: c.insuranceCompany || "Police d'assurance",
        reference: c.policyNumber || String(c.insuranceType ?? 'police'),
        projectId: c.projectId || undefined,
        expiryDate: c.validUntil ?? c.endDate ?? null,
        amount: c.coverageAmount,
      }));


    return [...fromGuarantees, ...fromInsurance].sort((a, b) => {
      const da = daysUntil(a.expiryDate) ?? 9999;
      const db = daysUntil(b.expiryDate) ?? 9999;
      return da - db;
    });
  }, [guarantees, certificates, projectIds]);

  const paymentNotifications = useMemo(
    () => (notifications ?? []).filter((n) => String(n.type).startsWith('payment') || /paiement|décompte/i.test(n.title ?? '')),
    [notifications],
  );

  const kpis = useMemo(() => {
    const criticalAlerts = scopedAlerts.filter(
      (a) => String((a as { severity?: string }).severity) === 'critical',
    ).length;
    const expiringSoon = expiries.filter((e) => {
      const d = daysUntil(e.expiryDate);
      const rule = DERIVED_ALERT_RULES.find(r => r.kind === (e.kind === 'bank_guarantee' ? 'guarantee_expiring' : 'insurance_expiring'));
      return d !== null && Boolean(rule && d <= rule.thresholds.medium);
    }).length;
    return {
      projectCount: projects.length,
      criticalAlerts,
      openAlerts: scopedAlerts.filter((a) => !(a as { acknowledged?: boolean }).acknowledged).length,
      expiringSoon,
      unreadNotifications: (notifications ?? []).filter((n) => !n.read).length,
      pendingPaymentNotifications: paymentNotifications.filter((n) => !n.read).length,
    };
  }, [scopedAlerts, expiries, projects.length, notifications, paymentNotifications]);

  return {
    projects,
    projectIds,
    alerts: scopedAlerts,
    expiries,
    notifications: notifications ?? [],
    paymentNotifications,
    kpis,
    isLoading:
      projectsLoading || alertsLoading || guaranteesLoading || !!insuranceLoading || notificationsLoading,
    acknowledgeAlert,
    resolveAlert,
    markNotificationAsRead: markAsRead,
    daysUntil,
  };
}

export default useConsultantPortalHex;
