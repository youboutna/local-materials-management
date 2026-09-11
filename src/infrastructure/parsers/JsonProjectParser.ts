// src/infrastructure/parsers/JsonProjectParser.ts
//
// Parseur JSON natif — accepte :
// - un dataset complet { projects: [...], organizations: [...], ... }
// - un tableau de projets [ {...}, {...} ]
// - un projet unique { title, ... }

import type { ProjectImportRow } from '@/application/services/ProjectImportExportService';
import {
  IProjectFileParser,
  ProjectFileParserOptions,
  readFileAsText,
} from './IProjectFileParser';

export class JsonProjectParser implements IProjectFileParser {
  readonly name = 'JsonProjectParser';
  readonly supportedExtensions = ['json'];

  async parse(file: File, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    const content = await readFileAsText(file);
    return this.parseContent(content, options);
  }

  async parseContent(content: string, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('JSON invalide : impossible de lire le fichier.');
    }

    return this.normalizeToRows(parsed, options);
  }

  private normalizeToRows(
    parsed: unknown,
    _options: ProjectFileParserOptions,
  ): ProjectImportRow[] {
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.projects)) {
        return obj.projects as ProjectImportRow[];
      }
      if (Array.isArray(obj.projets)) {
        return obj.projets as ProjectImportRow[];
      }
      return [obj as unknown as ProjectImportRow];
    }

    if (Array.isArray(parsed)) {
      return parsed as ProjectImportRow[];
    }

    throw new Error('Format JSON non reconnu : attendu un objet ou un tableau.');
  }
}