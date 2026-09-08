/**
 * BoqSourceDocumentService — persistance du fichier source d'un import DQE/BOQ
 * dans le Document Hub (catégorie « boq »), avec traçabilité vers les lignes
 * importées. TypeScript pur : aucune dépendance React.
 */
import { getStorageService } from '@/application/services/StorageService';
import { getAuthService } from '@/application/services/AuthService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

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

const BUCKET = 'documents';

export class BoqSourceDocumentService {
  /**
   * Téléverse le fichier importé puis crée la fiche document liée au BOQ.
   * Ne lève jamais : un échec de traçabilité ne doit pas annuler l'import.
   */
  static async persist(input: PersistBoqSourceInput): Promise<boolean> {
    try {
      const safeName = input.file.name.replace(/[^\w.\-]+/g, '_');
      const scope = input.projectId ? `projects/${input.projectId}` : `boq/${input.source}`;
      const path = `${scope}/boq/${Date.now()}_${safeName}`;

      const storage = getStorageService();
      await storage.uploadFile({ bucket: BUCKET, path, file: input.file });
      const fileUrl = storage.getPublicUrl({ bucket: BUCKET, path });

      const user = await getAuthService().getCurrentUser();
      await RepositoryFactory.getDocumentRepository().insertRaw({
        title: input.title?.trim() || `DQE — ${input.file.name}`,
        description: `Fichier source de l'import DQE (${input.lineCount ?? 0} ligne(s)).`,
        file_url: fileUrl,
        file_name: input.file.name,
        mime_type: input.file.type || null,
        file_size: input.file.size,
        document_type: input.category ?? 'boq',
        uploaded_by: user?.id ?? null,
        ...(input.projectId ? { project_id: input.projectId } : {}),
        ...(input.phaseId ? { phase_id: input.phaseId } : {}),
        ...(input.tenderId ? { tender_id: input.tenderId } : {}),
        metadata: {
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
