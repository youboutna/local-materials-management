/**
 * BoqSourceDocumentService — persistance du fichier source d'un import DQE/BOQ
 * dans le Document Hub (catégorie « boq »), avec traçabilité vers les lignes
 * importées. TypeScript pur : aucune dépendance React.
 */
import { getAuthService } from '@/application/services/AuthService';
import { getDocumentService } from '@/application/services/DocumentService';
import { normalizeDocumentType } from '@/dtos/entities/DocumentDTO';

export interface PersistBoqSourceInput {
  file: File;
  /** Portée métier de l'import : projet, phase, appel d'offres… */
  projectId?: string | null;
  phaseId?: string | null;
  tenderId?: string | null;
  /** Référence du document DQE (contextId) pour la traçabilité. */
  contextId: string;
  source: string;
  /** Catégorie Document Hub : « boq » par défaut (DQE / expression de besoin). */
  category?: string;
  title?: string;
  lineCount?: number;
}

export class BoqSourceDocumentService {
  /**
   * Téléverse le fichier importé puis crée la fiche document liée au BOQ.
   * Ne lève jamais : un échec de traçabilité ne doit pas annuler l'import.
   */
  static async persist(input: PersistBoqSourceInput): Promise<boolean> {
    try {
      const user = await getAuthService().getCurrentUser();
      await getDocumentService().createDocument({
        title: input.title?.trim() || `DQE — ${input.file.name}`,
        description: `Fichier source de l'import DQE (${input.lineCount ?? 0} ligne(s)).`,
        file: input.file,
        documentType: normalizeDocumentType(input.category ?? 'boq'),
        uploadedBy: user?.id ?? null,
        projectId: input.projectId,
        phaseId: input.phaseId,
        metadata: {
          ...(input.tenderId ? { tenderId: input.tenderId } : {}),
          boq_context_id: input.contextId,
          boq_source: input.source,
          boq_line_count: input.lineCount ?? 0,
          imported_at: new Date().toISOString(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
