/**
 * BoqInjectionGateService — porte de validation avant injection d'un devis ou
 * d'un décompte dans la planification / l'exécution du projet.
 *
 * Devis    → validation gestionnaire de projet (origine : soumission AO).
 * Décompte → validation consultant (le gestionnaire / directeur portent
 *            implicitement la casquette consultant).
 *
 * Service pur (TypeScript, aucun React) : persistance via le repository BOQ.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import {
  BOQ_INJECTION_GATE_REFERENTIAL,
  canValidateInjection,
  readInjectionStamp,
  resolveInjectionKind,
  type BoqInjectionKind,
  type InjectionValidationStamp,
} from '@/config/referentials/boq/boq-injection-gate.referential';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface InjectionActor {
  userId?: string | null;
  roles?: string[];
  /** Consultant explicitement désigné sur le projet (project_stakeholders). */
  isDesignatedConsultant?: boolean;
}

export interface InjectionGateEvaluation {
  allowed: boolean;
  /** Natures présentes dans le lot de lignes. */
  kinds: BoqInjectionKind[];
  /** Lignes soumises à validation et non validées. */
  blockedLines: BoqLineDTO[];
  /** Motifs bloquants (référentiel). */
  reasons: string[];
  /** Avertissements non bloquants (origine non tracée…). */
  warnings: string[];
}

export class BoqInjectionGateService {
  /** Nature d'injection d'une ligne (null = prévisionnel, libre). */
  static kindOf(line: BoqLineDTO): BoqInjectionKind | null {
    return resolveInjectionKind({ dqeType: line.dqeType, source: line.source });
  }

  /** Une ligne est-elle déjà validée pour injection ? */
  static isValidated(line: BoqLineDTO): boolean {
    const kind = BoqInjectionGateService.kindOf(line);
    if (!kind) return true;
    const stamp = readInjectionStamp(line.metadata);
    if (!stamp || stamp.kind !== kind) return false;
    const gate = BOQ_INJECTION_GATE_REFERENTIAL.gates[kind];
    return gate.requiredStatuses.includes(String(line.status ?? 'draft'));
  }

  /** Évalue l'injectabilité d'un lot de lignes. */
  static evaluate(lines: BoqLineDTO[]): InjectionGateEvaluation {
    const kinds = new Set<BoqInjectionKind>();
    const blockedLines: BoqLineDTO[] = [];
    const reasons = new Set<string>();
    const warnings = new Set<string>();

    for (const line of lines) {
      const kind = BoqInjectionGateService.kindOf(line);
      if (!kind) continue;
      kinds.add(kind);
      const gate = BOQ_INJECTION_GATE_REFERENTIAL.gates[kind];
      if (!BoqInjectionGateService.isValidated(line)) {
        blockedLines.push(line);
        reasons.add(gate.blockedMessage);
        continue;
      }
      if (kind === 'devis' && !line.bidRef && !line.submittedBy) {
        warnings.add(gate.originWarning);
      }
      if (kind === 'decompte' && !line.phaseId && !line.milestoneId && !line.taskId) {
        warnings.add(gate.originWarning);
      }
    }

    return {
      allowed: blockedLines.length === 0,
      kinds: [...kinds],
      blockedLines,
      reasons: [...reasons],
      warnings: [...warnings],
    };
  }

  /** Lève une erreur métier si le lot n'est pas injectable. */
  static assertInjectable(lines: BoqLineDTO[]): InjectionGateEvaluation {
    const evaluation = BoqInjectionGateService.evaluate(lines);
    if (!evaluation.allowed) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `${evaluation.reasons.join(' ')} (${evaluation.blockedLines.length} ligne(s) concernée(s))`,
      );
    }
    return evaluation;
  }

  /** L'acteur peut-il valider ce type de document ? */
  static canValidate(kind: BoqInjectionKind, actor: InjectionActor): boolean {
    return canValidateInjection(kind, actor.roles, {
      isDesignatedConsultant: actor.isDesignatedConsultant,
    });
  }

  /**
   * Appose la validation d'injection sur les lignes concernées et passe leur
   * statut à `validated` lorsque nécessaire.
   */
  static async approve(
    lines: BoqLineDTO[],
    actor: InjectionActor,
    comment?: string | null,
  ): Promise<{ validated: number; kinds: BoqInjectionKind[] }> {
    const targets = lines.filter((l) => BoqInjectionGateService.kindOf(l) !== null);
    if (!targets.length) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Aucun devis ni décompte à valider.');
    }

    const kinds = [...new Set(targets.map((l) => BoqInjectionGateService.kindOf(l)!))];
    for (const kind of kinds) {
      if (!BoqInjectionGateService.canValidate(kind, actor)) {
        const gate = BOQ_INJECTION_GATE_REFERENTIAL.gates[kind];
        throw new AppError(
          ErrorCode.FORBIDDEN,
          `Validation refusée : ${gate.label} — habilitation requise (${gate.validatorRoles.join(', ')})${
            gate.requiresConsultant ? ' avec casquette consultant' : ''
          }.`,
        );
      }
    }

    const validatorRole = (actor.roles ?? [])[0] ?? 'unknown';
    const validatedAt = new Date().toISOString();
    let validated = 0;

    for (const line of targets) {
      const kind = BoqInjectionGateService.kindOf(line)!;
      const stamp: InjectionValidationStamp = {
        kind,
        validatedBy: actor.userId ?? 'unknown',
        validatorRole,
        validatedAt,
        comment: comment ?? null,
      };
      const metadata = {
        ...(line.metadata ?? {}),
        [BOQ_INJECTION_GATE_REFERENTIAL.metadataKey]: stamp,
      };
      const nextStatus = BOQ_INJECTION_GATE_REFERENTIAL.gates[kind].requiredStatuses.includes(
        String(line.status ?? 'draft'),
      )
        ? line.status
        : 'validated';

      if (!line.id) continue;
      await boqRepository.update(line.id, { metadata, status: nextStatus, source: line.source });
      validated += 1;
    }

    return { validated, kinds };
  }
}

export default BoqInjectionGateService;
