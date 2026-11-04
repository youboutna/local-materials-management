/**
 * BoqRevisionService — crée une révision brouillon d'un document BOQ validé.
 * Les lignes sont copiées sous un nouveau document, rattachées au document
 * d'origine (sourceDocumentId) pour garder la traçabilité ; l'original n'est pas modifié.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export const REVISABLE_STATUSES = new Set(['validated', 'submitted', 'invoiced', 'paid']);

export class BoqRevisionService {
  static buildRevisionLines(lines: BoqLineDTO[], newDocumentId: string, sourceDocumentId: string): BoqLineDTO[] {
    return lines.map((l) => {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = l;
      const previous = Number((l.metadata as Record<string, unknown> | null)?.revision ?? 0) || 0;
      return {
        ...rest,
        documentId: newDocumentId,
        sourceDocumentId,
        sourceDocumentType: l.documentType ?? l.sourceDocumentType ?? null,
        status: 'draft',
        metadata: { ...(l.metadata ?? {}), revision: previous + 1, revisedFrom: sourceDocumentId },
      };
    });
  }

  static async createRevision(lines: BoqLineDTO[], sourceDocumentId: string, newDocumentId: string): Promise<BoqLineDTO[]> {
    if (!lines.length) throw new Error('BOQ_REVISION_EMPTY');
    return RepositoryFactory.getBoqRepository().bulkCreate(
      BoqRevisionService.buildRevisionLines(lines, newDocumentId, sourceDocumentId),
    );
  }
}
