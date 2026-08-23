/**
 * Doctrine i18n (garde permanente) :
 *
 * 1. On ne traduit JAMAIS les données de la base (titres, noms, descriptions,
 *    commentaires, adresses saisies par les utilisateurs). Elles sont affichées
 *    telles que stockées.
 * 2. On traduit UNIQUEMENT l'UI : libellés d'interface (LanguageContext) et
 *    codes techniques métier (référentiels + ENUM PostgreSQL).
 * 3. Chaque référentiel = code unique + libellés fr / ar / en. Les ENUM de la
 *    base suivent exactement la même approche : le code reste en base, le
 *    libellé vit dans le référentiel.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import {
  REFERENTIAL_LABEL_REGISTRY,
  ReferentialLabelDomain,
  normalizeReferentialCode,
  resolveReferentialLabel,
} from '@/config/referentials/i18n/status-labels.referential';

const domains = Object.keys(REFERENTIAL_LABEL_REGISTRY) as ReferentialLabelDomain[];
const files = globSync('src/**/*.{ts,tsx}', { absolute: true }).filter(
  (f) => !f.includes('__tests__') && !f.includes('.test.')
);

/** Retire commentaires et chaînes littérales : on n'analyse que le code effectif. */
const stripNoise = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/`[^`]*`/g, '``')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""');

describe('Doctrine i18n — UI traduite, données de la base intactes', () => {
  it('T-V-42 : aucune donnée libre de la base n’est passée aux traducteurs', () => {
    // Champs texte libres : jamais des codes, donc jamais traduisibles.
    const freeText =
      '(name|title|description|comment|comments|notes|note|address|email|phone|fullName|full_name|company_name|companyName|reference|remarks|subject|message|content)';
    const translateCall = new RegExp(
      `translate(?:Status|Priority|Severity|Category|Unit|Role|Department|DocumentType|ProjectType|Deviation|Term|TenderStep|InvoiceDocument)\\(\\s*[A-Za-z_$][\\w$?.\\[\\]]*\\.${freeText}\\b`
    );
    // Idem via les composants de rendu : <TranslatedStatus code={x.title} />
    const translatedComponent = new RegExp(
      `<Translated\\w+[^>]*\\bcode=\\{\\s*[A-Za-z_$][\\w$?.\\[\\]]*\\.${freeText}\\b`
    );

    const offenders = files
      .filter((f) => {
        const src = stripNoise(readFileSync(f, 'utf-8'));
        return translateCall.test(src) || translatedComponent.test(src);
      })
      .map((f) => f.replace(`${process.cwd()}/`, ''));

    expect(offenders).toEqual([]);
  });

  it('T-V-43 : un code inconnu est rendu tel quel (aucune invention de libellé)', () => {
    // Cas typique : une valeur libre venue de la base traverse un badge.
    expect(resolveReferentialLabel('status', 'Réhabilitation du réseau 33 kV', 'ar')).toBe(
      'Réhabilitation du réseau 33 kV'
    );
    expect(resolveReferentialLabel('status', null, 'en')).toBe('');
  });

  it('T-V-44 : chaque entrée porte un code unique, technique et normalisé', () => {
    const problems: string[] = [];
    for (const domain of domains) {
      const dictionary = REFERENTIAL_LABEL_REGISTRY[domain] as Record<
        string,
        { code: string; fr: string; ar: string; en: string }
      >;
      const seen = new Set<string>();
      for (const [key, entry] of Object.entries(dictionary)) {
        if (entry.code !== key) problems.push(`${domain}.${key}: code=${entry.code} ≠ clé`);
        if (normalizeReferentialCode(key) !== key)
          problems.push(`${domain}.${key}: code non normalisé (attendu snake_case minuscule)`);
        if (seen.has(entry.code)) problems.push(`${domain}.${key}: code dupliqué`);
        seen.add(entry.code);
      }
    }
    expect(problems).toEqual([]);
  });

  it('T-V-45 : les ENUM PostgreSQL suivent la même approche code + libellés', () => {
    const enums: Array<[ReferentialLabelDomain, string[]]> = [
      [
        'status',
        [
          // document_status / authorization_status / mission_status
          'draft',
          'pending_review',
          'approved',
          'rejected',
          'archived',
          'submitted',
          'under_review',
          'returned',
          'planned',
          'in_progress',
          'completed',
          'cancelled',
          // movement_validation_status
          'pending',
          'validated',
          'in_transit',
        ],
      ],
      [
        'documentType',
        [
          'inspection_report',
          'location_photo',
          'project_report',
          'contract',
          'supplier_info',
          'task_assignment',
          'employee_record',
          'tender',
          'supplier_catalog',
        ],
      ],
      [
        'role',
        ['admin', 'manager', 'director', 'agent', 'supplier', 'practitioner', 'patient'],
      ],
    ];

    const missing: string[] = [];
    for (const [domain, codes] of enums) {
      for (const code of codes) {
        for (const lang of ['fr', 'ar', 'en'] as const) {
          const label = resolveReferentialLabel(domain, code, lang);
          if (!label || label === code) missing.push(`${domain}.${code} (${lang})`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('T-V-46 : aucune écriture de libellé traduit vers la base', () => {
    // Les adaptateurs/services d'écriture ne doivent pas persister de traduction.
    const writeSites = globSync('src/{infrastructure,application}/**/*.ts', { absolute: true });
    const offenders = writeSites
      .filter((f) => {
        const src = stripNoise(readFileSync(f, 'utf-8'));
        return /\.(insert|update|upsert)\([\s\S]{0,400}?(translateStatus|translatePriority|translateSeverity|translateCategory|translateUnit|translateRole|translateDepartment|translateDocumentType|translateProjectType|translateTerm)\(/.test(
          src
        );
      })
      .map((f) => f.replace(`${process.cwd()}/`, ''));
    expect(offenders).toEqual([]);
  });
});
