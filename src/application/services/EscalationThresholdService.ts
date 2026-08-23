/**
 * EscalationThresholdService — btp.escalation_thresholds
 *
 * Source de vérité : référentiel `escalation-thresholds.referential` (catégories,
 * unités, valeurs par défaut) surchargé par les lignes persistées en base.
 * Aucun seuil codé en dur dans l'UI : les métriques (total / actifs / critiques)
 * sont donc toujours cohérentes, même avant la première personnalisation.
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type {
  IEscalationThresholdRepository,
  EscalationThresholdRow,
} from '@/domain/repositories/IEscalationThresholdRepository';
import {
  ESCALATION_THRESHOLD_DEFAULTS,
  isReferentialThresholdId,
  referentialThresholdId,
} from '@/config/referentials/kpi/escalation-thresholds.referential';
import { AppError, ErrorCode } from '@/utils/errorHandling';

const defaultToRow = (
  d: (typeof ESCALATION_THRESHOLD_DEFAULTS)[number]
): EscalationThresholdRow => ({
  id: referentialThresholdId(d.thresholdType, d.thresholdName),
  thresholdType: d.thresholdType,
  thresholdName: d.thresholdName,
  thresholdValue: d.thresholdValue,
  thresholdUnit: d.thresholdUnit,
  severityLevel: d.severityLevel,
  escalationLevel: d.escalationLevel,
  description: d.description,
  isActive: true,
});

export class EscalationThresholdService {
  constructor(private repository: IEscalationThresholdRepository) {}

  /** Défauts référentiels fusionnés avec les valeurs persistées. */
  async getAll(): Promise<EscalationThresholdRow[]> {
    let persisted: EscalationThresholdRow[] = [];
    try {
      persisted = await this.repository.findAll();
    } catch {
      persisted = [];
    }

    const byKey = new Map<string, EscalationThresholdRow>();
    ESCALATION_THRESHOLD_DEFAULTS.forEach((d) => {
      const row = defaultToRow(d);
      byKey.set(`${row.thresholdType}::${row.thresholdName}`, row);
    });
    persisted.forEach((row) => {
      byKey.set(`${row.thresholdType}::${row.thresholdName}`, row);
    });

    return Array.from(byKey.values()).sort(
      (a, b) =>
        a.thresholdType.localeCompare(b.thresholdType) ||
        a.thresholdValue - b.thresholdValue
    );
  }

  async update(
    id: string,
    updates: Partial<EscalationThresholdRow>
  ): Promise<EscalationThresholdRow> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Threshold ID is required');
    if (updates.thresholdValue !== undefined && updates.thresholdValue < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Le seuil doit être positif');
    }
    if (
      updates.escalationLevel !== undefined &&
      (updates.escalationLevel < 1 || updates.escalationLevel > 4)
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Le niveau d'escalade doit être entre 1 et 4");
    }

    // Seuil issu du référentiel : première persistance via upsert.
    if (isReferentialThresholdId(id)) {
      const [, type, name] = id.split(':');
      const base =
        ESCALATION_THRESHOLD_DEFAULTS.find(
          (d) => d.thresholdType === type && d.thresholdName === name
        ) ?? null;
      if (!base) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Seuil référentiel inconnu');
      const { id: _ignored, ...row } = { ...defaultToRow(base), ...updates };
      return this.repository.upsert(row);
    }

    return this.repository.update(id, updates);
  }

  async updateMany(
    items: Array<{ id: string; updates: Partial<EscalationThresholdRow> }>
  ): Promise<void> {
    for (const item of items) {
      await this.update(item.id, item.updates);
    }
  }
}

let instance: EscalationThresholdService | null = null;

export function getEscalationThresholdService(): EscalationThresholdService {
  if (!instance) {
    instance = new EscalationThresholdService(RepositoryFactory.getEscalationThresholdRepository());
  }
  return instance;
}
