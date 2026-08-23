/**
 * Phase 6 — Couverture des traductions UI et des ENUM PostgreSQL.
 *
 * Doctrine : seuls les codes techniques (référentiels + ENUM) et les libellés
 * d'interface sont traduits. Les données libres de la base ne le sont jamais.
 */
import { describe, it, expect } from 'vitest';
import { I18nService } from '../I18nService';
import {
  REFERENTIAL_LABEL_REGISTRY,
  ReferentialLabelDomain,
  ReferentialLanguage,
} from '@/config/referentials/i18n/status-labels.referential';
import { translations } from '@/contexts/LanguageContext';

const LANGS: ReferentialLanguage[] = ['fr', 'ar', 'en'];

/** ENUM PostgreSQL du périmètre BTP/public → domaine de libellés attendu. */
const PG_ENUMS: Record<string, { domain: ReferentialLabelDomain; codes: string[] }> = {
  applicant_type: { domain: 'category', codes: ['company', 'individual'] },
  authorization_status: {
    domain: 'status',
    codes: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'returned'],
  },
  document_category: {
    domain: 'documentType',
    codes: [
      'construction_permit',
      'property_cadastre',
      'distribution_license',
      'environmental_study',
      'safety_assessment',
      'other',
    ],
  },
  document_status: {
    domain: 'status',
    codes: ['draft', 'pending_review', 'approved', 'rejected', 'archived'],
  },
  document_type: {
    domain: 'documentType',
    codes: [
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
  },
  mission_status: { domain: 'status', codes: ['planned', 'in_progress', 'completed', 'cancelled'] },
  movement_validation_status: {
    domain: 'status',
    codes: ['pending', 'validated', 'rejected', 'in_transit'],
  },
  supply_request_status: { domain: 'status', codes: ['pending', 'approved', 'rejected', 'completed'] },
  tender_document_category: { domain: 'category', codes: ['administrative', 'technical', 'financial'] },
  user_role: {
    domain: 'role',
    codes: ['insurance_company', 'practitioner', 'patient', 'admin', 'manager', 'director', 'agent', 'supplier'],
  },
};

/** Clés UI ajoutées en Phase 6 pour les générateurs de structure. */
const PHASE_STRUCTURE_KEYS = [
  'referential',
  'select_referential',
  'generate_milestones',
  'generate_structure',
  'generating',
  'generate_milestones_from_referential',
  'no_phase_defined',
  'no_phase_for_project',
  'use_generator_hint',
  'takeoff_after_step1',
];

describe('T-V-47 — ENUM PostgreSQL couverts par les référentiels de libellés', () => {
  Object.entries(PG_ENUMS).forEach(([enumName, { domain, codes }]) => {
    it(`${enumName} : tous les codes ont un libellé fr/ar/en`, () => {
      const dict = REFERENTIAL_LABEL_REGISTRY[domain];
      codes.forEach((code) => {
        const entry = dict[code];
        expect(entry, `${enumName}.${code} absent du domaine ${domain}`).toBeDefined();
        LANGS.forEach((lang) => {
          expect(entry?.[lang], `${enumName}.${code} sans libellé ${lang}`).toBeTruthy();
        });
      });
    });
  });
});

describe('T-V-48 — Aucun code technique renvoyé tel quel par I18nService', () => {
  it('traduit les codes ENUM dans les trois langues', () => {
    LANGS.forEach((lang) => {
      const service = new I18nService(lang);
      Object.entries(PG_ENUMS).forEach(([enumName, { domain, codes }]) => {
        codes.forEach((code) => {
          const dict = REFERENTIAL_LABEL_REGISTRY[domain];
          const translated = service.translate(dict[code], lang);
          expect(translated, `${enumName}.${code} (${lang})`).not.toBe(code);
          expect(translated).not.toMatch(/^[a-z0-9]+(_[a-z0-9]+)+$/);
        });
      });
    });
  });
});

describe('T-V-49 — Clés UI des générateurs de structure disponibles fr/ar/en', () => {
  LANGS.forEach((lang) => {
    it(`phase_structure.* est complet en ${lang}`, () => {
      const bundle = (translations as unknown as Record<string, Record<string, Record<string, string>>>)[lang];
      const section = bundle?.phase_structure;
      expect(section, `section phase_structure absente en ${lang}`).toBeDefined();
      PHASE_STRUCTURE_KEYS.forEach((key) => {
        expect(section?.[key], `phase_structure.${key} manquant en ${lang}`).toBeTruthy();
      });
    });
  });

  it('les libellés arabes diffèrent du français (traduction réelle)', () => {
    const fr = (translations as unknown as Record<string, Record<string, Record<string, string>>>).fr.phase_structure;
    const ar = (translations as unknown as Record<string, Record<string, Record<string, string>>>).ar.phase_structure;
    PHASE_STRUCTURE_KEYS.forEach((key) => {
      expect(ar[key]).not.toBe(fr[key]);
    });
  });
});

describe('T-V-50 — Direction du texte pilotée par la langue', () => {
  it('arabe = rtl, français et anglais = ltr', () => {
    const service = new I18nService('fr');
    expect(service.getDirection('ar')).toBe('rtl');
    expect(service.getDirection('fr')).toBe('ltr');
    expect(service.getDirection('en')).toBe('ltr');
  });
});
