/**
 * Hexagonal hook for project import/export.
 *
 * Exposes two mutations backed by ProjectImportExportService:
 *  - importProjects(rows)
 *  - exportProjects(opts)
 *
 * The UI never touches Supabase directly — it pushes ProjectImportRow[] in
 * and gets a ProjectImportResult / serialized payload out.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ProjectImportExportService,
  type ProjectImportRow,
  type ProjectImportResult,
  type ProjectExportOptions,
} from '@/application/services/ProjectImportExportService';

const service = ProjectImportExportService.default();

export function useProjectImportExportHex() {
  const queryClient = useQueryClient();

  const importMutation = useMutation<ProjectImportResult, Error, ProjectImportRow[]>({
    mutationFn: (rows) => service.importProjects(rows),
  });

  const exportMutation = useMutation({
    mutationFn: (opts: ProjectExportOptions) => service.exportProjects(opts),
  });

  return {
    importProjects: async (rows: ProjectImportRow[]) => {
      try {
        const res = await importMutation.mutateAsync(rows);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        if (res.failed === 0 && res.imported > 0) {
          toast.success(
            `Import réussi : ${res.imported} projet(s) créé(s)` +
              (res.skipped ? `, ${res.skipped} ignoré(s)` : ''),
          );
        } else if (res.imported > 0) {
          toast.warning(
            `Import partiel : ${res.imported} créé(s), ${res.failed} en erreur, ${res.skipped} ignoré(s)`,
          );
        } else if (res.skipped > 0 && res.failed === 0) {
          toast.info(`Aucun nouveau projet (${res.skipped} déjà existant(s))`);
        } else {
          toast.error(`Import échoué (${res.failed} erreurs)`);
        }
        return res;
      } catch (e) {
        toast.error(
          `Erreur d'import : ${e instanceof Error ? e.message : 'inconnue'}`,
        );
        throw e;
      }
    },
    exportProjects: async (opts: ProjectExportOptions) => {
      try {
        const out = await exportMutation.mutateAsync(opts);
        toast.success(
          `Export prêt (${out.rows?.length ?? 0} projets, ${out.extension.toUpperCase()})`,
        );
        return out;
      } catch (e) {
        toast.error(
          `Erreur d'export : ${e instanceof Error ? e.message : 'inconnue'}`,
        );
        throw e;
      }
    },
    isImporting: importMutation.isPending,
    isExporting: exportMutation.isPending,
    importError: importMutation.error,
    exportError: exportMutation.error,
    lastImportResult: importMutation.data,
  };
}
