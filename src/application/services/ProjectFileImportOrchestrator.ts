// src/application/services/ProjectFileImportOrchestrator.ts
//
// Point d'entrée unifié pour l'import de projets depuis un fichier.
//
// Rôle :
// 1. Sélectionner le parser adapté au fichier
// 2. Parser → ProjectImportRow[]
// 3. Appeler ProjectImportExportService.importDataset()
// 4. Retourner un résultat unifié (raw + ui)

import {
  ProjectImportExportService,
  type ImportOptions,
  type ProjectImportResult,
} from '@/application/services/ProjectImportExportService';
import type { ImportResult } from '@/dtos/entities/ProjectReportDTO';
import { ProjectFileParserFactory } from '@/infrastructure/parsers/ProjectFileParserFactory';

export interface FileImportOptions extends ImportOptions {
  referentialCode?: string;
  fallbackLocation?: string;
  fallbackTitle?: string;
  language?: 'fr' | 'ar' | 'en';
}

export interface FileImportOutcome {
  raw: ProjectImportResult;
  ui: ImportResult;
}

export class ProjectFileImportOrchestrator {
  constructor(
    private readonly importService: ProjectImportExportService =
      ProjectImportExportService.default(),
  ) {}

  async importFromFile(
    file: File,
    options: FileImportOptions = {},
  ): Promise<FileImportOutcome> {
    // 1. Sélection du parser
    const parser = ProjectFileParserFactory.forFile(file);

    // 2. Parsing → ProjectImportRow[]
    const rows = await parser.parse(file, {
      referentialCode: options.referentialCode,
      fallbackLocation: options.fallbackLocation,
      fallbackTitle: options.fallbackTitle,
      language: options.language ?? 'fr',
    });

    if (!rows || rows.length === 0) {
      throw new Error('Aucun projet trouvé dans le fichier.');
    }

    // 3. Appel du service d'import canonique
    const raw = await this.importService.importDataset(
      { projects: rows },
      {
        mode: options.mode ?? 'upsert',
        continueOnError: options.continueOnError ?? true,
        generateMissingFromReferential: options.generateMissingFromReferential ?? false,
        validateAgainstReferential: options.validateAgainstReferential ?? false,
      },
    );

    // 4. Adaptation vers ImportResult (UI)
    const errors = raw.errors.map((e) => `Ligne ${e.row} : ${e.message}`);
    const message =
      `${raw.imported} projet(s) importé(s)` +
      (raw.failed > 0 ? ` (${raw.failed} erreur(s))` : '') +
      (raw.skipped > 0 ? ` — ${raw.skipped} ignoré(s)` : '');

    const ui: ImportResult = {
      success: raw.imported > 0,
      message,
      importedCount: raw.imported,
      imported: raw.imported,
      failed: raw.failed,
      skipped: raw.skipped,
      errors: errors.length > 0 ? errors : undefined,
    };

    return { raw, ui };
  }
}