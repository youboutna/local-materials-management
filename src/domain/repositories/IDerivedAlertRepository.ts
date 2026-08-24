/**
 * Port : signaux métier bruts servant à dériver les alertes opérationnelles.
 * Le domaine ne connaît que le signal (entité + date de référence), jamais SQL.
 */

import type { DerivedAlertKind } from '@/config/referentials/notifications/derived-alerts.referential';

export interface DerivedAlertSignal {
  kind: DerivedAlertKind;
  /** Identifiant de l'entité source (phase, jalon, tâche, garantie...). */
  entityId: string;
  projectId: string;
  phaseId?: string;
  /** Libellé métier de l'entité (déjà lisible : titre de phase, n° de police...). */
  label: string;
  /** Date de référence : échéance dépassée ou date d'expiration (ISO). */
  referenceDate: string;
  /** Données additionnelles conservées dans `metadata`. */
  extra?: Record<string, unknown>;
}

export interface IDerivedAlertRepository {
  /** Tous les signaux ouverts (tous projets). */
  findSignals(): Promise<DerivedAlertSignal[]>;
  /** Signaux ouverts d'un projet. */
  findSignalsByProject(projectId: string): Promise<DerivedAlertSignal[]>;
}
