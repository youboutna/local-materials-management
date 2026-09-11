// src/infrastructure/parsers/IProjectFileParser.ts
//
// Contrat commun à tous les parseurs de fichiers projet.
// Produit toujours du ProjectImportRow[] (JSON canonique) attendu par
// ProjectImportExportService.importDataset().

import type { ProjectImportRow } from '@/application/services/ProjectImportExportService';

export interface ProjectFileParserOptions {
  fallbackTitle?: string;
  fallbackLocation?: string;
  referentialCode?: string;
  language?: 'fr' | 'ar' | 'en';
}

export interface IProjectFileParser {
  readonly name: string;
  readonly supportedExtensions: string[];

  parse(
    file: File,
    options?: ProjectFileParserOptions,
  ): Promise<ProjectImportRow[]>;

  parseContent(
    content: string,
    options?: ProjectFileParserOptions,
  ): Promise<ProjectImportRow[]>;

  parseBuffer?(
    buffer: ArrayBuffer,
    options?: ProjectFileParserOptions,
  ): Promise<ProjectImportRow[]>;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsText(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as ArrayBuffer) ?? new ArrayBuffer(0));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsArrayBuffer(file);
  });
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

export function resolveLabel(
  label: unknown,
  lang: 'fr' | 'ar' | 'en' = 'fr',
): string {
  if (!label) return '';
  if (typeof label === 'string') return label;
  if (typeof label === 'object') {
    const obj = label as Record<string, string>;
    return obj[lang] || obj.fr || obj.code || '';
  }
  return String(label);
}