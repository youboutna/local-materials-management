// src/infrastructure/parsers/ProjectFileParserFactory.ts
//
// Sélecteur de parser selon l'extension du fichier.

import type { IProjectFileParser } from './IProjectFileParser';
import { getFileExtension } from './IProjectFileParser';
import { JsonProjectParser } from './JsonProjectParser';
import { GeoJsonProjectParser } from './GeoJsonProjectParser';
import { KmlProjectParser } from './KmlProjectParser';
import { MSProjectXmlParser } from './MSProjectXmlParser';

export class ProjectFileParserFactory {
  private static readonly parsers: IProjectFileParser[] = [
    new GeoJsonProjectParser(),
    new KmlProjectParser(),
    new MSProjectXmlParser(),
    new JsonProjectParser(),
  ];

  static forFile(file: File): IProjectFileParser {
    const ext = getFileExtension(file.name);
    const parser = this.parsers.find((p) => p.supportedExtensions.includes(ext));
    if (!parser) {
      throw new Error(
        `Aucun parser disponible pour l'extension ".${ext}". ` +
        `Extensions supportées : ${this.parsers.flatMap((p) => p.supportedExtensions).join(', ')}`,
      );
    }
    return parser;
  }

  static allSupportedExtensions(): string[] {
    return this.parsers.flatMap((p) => p.supportedExtensions);
  }
}