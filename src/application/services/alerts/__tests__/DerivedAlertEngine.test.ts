import { describe, expect, it } from 'vitest';
import { toDerivedAlert, toDerivedAlerts, isDerivedAlertId } from '../DerivedAlertEngine';
import type { DerivedAlertSignal } from '@/domain/repositories/IDerivedAlertRepository';

const NOW = new Date('2026-08-25T12:00:00.000Z').getTime();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const inDays = (d: number) => new Date(NOW + d * 86_400_000).toISOString();

const signal = (over: Partial<DerivedAlertSignal>): DerivedAlertSignal => ({
  kind: 'phase_overdue',
  entityId: 'e1',
  projectId: 'p1',
  label: 'Gros œuvre',
  referenceDate: daysAgo(40),
  ...over,
});

describe('DerivedAlertEngine', () => {
  it('dérive une alerte critique pour une phase très en retard', () => {
    const alert = toDerivedAlert(signal({}), 'fr', NOW)!;
    expect(alert.severity).toBe('critical');
    expect(alert.type).toBe('project_delay');
    expect(alert.delayDays).toBe(40);
    expect(alert.message).toContain('Gros œuvre');
    expect(isDerivedAlertId(alert.id)).toBe(true);
  });

  it('applique les seuils du référentiel selon le retard', () => {
    const high = toDerivedAlert(signal({ referenceDate: daysAgo(15) }), 'fr', NOW)!;
    const medium = toDerivedAlert(signal({ referenceDate: daysAgo(5) }), 'fr', NOW)!;
    const low = toDerivedAlert(signal({ referenceDate: daysAgo(1) }), 'fr', NOW)!;
    expect([high.severity, medium.severity, low.severity]).toEqual(['high', 'medium', 'low']);
  });

  it('inverse la logique pour les échéances (expiry)', () => {
    const critical = toDerivedAlert(
      signal({ kind: 'guarantee_expiring', referenceDate: inDays(3) }),
      'fr',
      NOW,
    )!;
    const medium = toDerivedAlert(
      signal({ kind: 'guarantee_expiring', referenceDate: inDays(45) }),
      'fr',
      NOW,
    )!;
    expect(critical.severity).toBe('critical');
    expect(medium.severity).toBe('medium');
    expect(critical.deadline).toBeDefined();
  });

  it('produit des libellés trilingues sans texte en dur côté UI', () => {
    const ar = toDerivedAlert(signal({}), 'ar', NOW)!;
    const en = toDerivedAlert(signal({}), 'en', NOW)!;
    expect(ar.title).not.toBe(en.title);
    expect(en.message).toContain('end date');
  });

  it('génère des identifiants stables et déduplicables', () => {
    const [a, b] = toDerivedAlerts([signal({}), signal({})], 'fr', NOW);
    expect(a.id).toBe(b.id);
  });
});
