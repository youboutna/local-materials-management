/**
 * DQEImportService
 * Pure TypeScript service to parse a DQE (Devis Quantitatif Estimatif) workbook
 * and produce QuantityTakeoff request DTOs for batch insertion.
 *
 * Respects mem://constraints/no-react-in-services and
 * mem://architecture/utility-service-orchestration: this service delegates
 * persistence to QuantityTakeoffService; it never touches Supabase directly.
 *
 * Heuristic column matching tolerates common French DQE headers:
 *   Poste / Catégorie / N°
 *   Désignation / Description / Libellé
 *   Unité / U / Unit
 *   Quantité / Qté / Qty
 *   Prix unitaire / PU / P.U. / Unit price
 *   Montant / Total (informationnel — recalculé)
 */

import * as XLSX from 'xlsx';
import {
  DQE_CATEGORIES,
  getDQECategory,
  type DQECategory,
} from '@/config/referentials/dqe/dqe-categories.referential';
import {
  QuantityTakeoffService,
  type CreateQuantityTakeoffRequestDto,
  type QuantityTakeoffWithDetails,
} from './QuantityTakeoffService';

export interface DQEParsedRow {
  /** 1-based index in the source sheet (header excluded). */
  lineNumber: number;
  /** Code DQE détecté (TERRASSEMENT, REVETEMENT, ...). */
  categoryCode?: string;
  category?: DQECategory;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** Reasons why this row was rejected during validation, if any. */
  errors: string[];
}

export interface DQEParseResult {
  rows: DQEParsedRow[];
  sheetName: string;
  totalRows: number;
  validRows: number;
  totalValue: number;
}

export interface DQEImportContext {
  projectId: string;
  phaseId: string;
  /** Optional phase step id; encoded in the note for downstream filtering. */
  stepId?: string;
  /** Material UUID applied to every imported takeoff row. */
  defaultMaterialId: string;
}

export interface DQEImportResult {
  created: QuantityTakeoffWithDetails[];
  failed: Array<{ row: DQEParsedRow; error: string }>;
}

// ---------------------------------------------------------------------------
// Header detection
// ---------------------------------------------------------------------------

type HeaderKey =
  | 'category'
  | 'designation'
  | 'unit'
  | 'quantity'
  | 'unitPrice'
  | 'total';

const HEADER_ALIASES: Record<HeaderKey, RegExp[]> = {
  category: [/^poste/i, /^cat[eé]gorie/i, /^n[°o]?$/i, /^chapitre/i, /^lot/i],
  designation: [/^d[eé]signation/i, /^description/i, /^libell[eé]/i, /^intitul/i],
  unit: [/^unit[eé]?$/i, /^u$/i, /^unit$/i],
  quantity: [/^qu?antit[eé]?/i, /^q(t[eé])?$/i, /^qty$/i],
  unitPrice: [/^prix.*unit/i, /^p\.?\s*u\.?$/i, /^unit.*price/i, /^pu$/i],
  total: [/^montant/i, /^total/i, /^prix.*total/i],
};

const QT_VALID_UNITS = new Set(['m³', 'm3', 'm²', 'm2', 'm', 'ml', 'unité', 'u', 'forfait', 'h', 't', 'kg']);

function normalizeHeader(label: unknown): string {
  if (label == null) return '';
  return String(label).trim().toLowerCase().replace(/\s+/g, ' ');
}

function detectHeaderMap(headerRow: unknown[]): Partial<Record<HeaderKey, number>> {
  const map: Partial<Record<HeaderKey, number>> = {};
  headerRow.forEach((cell, idx) => {
    const norm = normalizeHeader(cell);
    if (!norm) return;
    for (const key of Object.keys(HEADER_ALIASES) as HeaderKey[]) {
      if (map[key] !== undefined) continue;
      if (HEADER_ALIASES[key].some((re) => re.test(norm))) {
        map[key] = idx;
        return;
      }
    }
  });
  return map;
}

function toNumber(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  // FR locale: "1 234,56" → 1234.56
  const s = String(value).replace(/\s/g, '').replace(/\u00a0/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function detectCategory(rawCategory: unknown, designation: string): DQECategory | undefined {
  const candidates = [String(rawCategory ?? ''), designation].join(' ').toLowerCase();
  if (!candidates.trim()) return undefined;
  // Try explicit code match first
  const direct = DQE_CATEGORIES.find((c) => candidates.includes(c.code.toLowerCase()));
  if (direct) return direct;
  // Fallback: label match
  return DQE_CATEGORIES.find((c) => candidates.includes(c.label.fr.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class DQEImportService {
  /**
   * Parse a DQE file (xlsx/xls/csv) and return structured rows.
   * Does not persist anything.
   */
  static async parseFile(file: File): Promise<DQEParseResult> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { rows: [], sheetName: '', totalRows: 0, validRows: 0, totalValue: 0 };
    }
    const sheet = workbook.Sheets[sheetName];
    const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (matrix.length === 0) {
      return { rows: [], sheetName, totalRows: 0, validRows: 0, totalValue: 0 };
    }

    // Detect header row: the first row containing at least 2 known headers.
    let headerIdx = 0;
    let headerMap: Partial<Record<HeaderKey, number>> = {};
    for (let i = 0; i < Math.min(matrix.length, 10); i++) {
      const candidate = detectHeaderMap(matrix[i]);
      if (Object.keys(candidate).length >= 2) {
        headerIdx = i;
        headerMap = candidate;
        break;
      }
    }
    if (Object.keys(headerMap).length < 2) {
      throw new Error(
        'Impossible de détecter les colonnes DQE (Désignation, Unité, Quantité, Prix unitaire). Vérifiez les en-têtes.',
      );
    }

    const rows: DQEParsedRow[] = [];
    let totalValue = 0;
    let validRows = 0;

    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const raw = matrix[i] ?? [];
      const designation = headerMap.designation != null ? String(raw[headerMap.designation] ?? '').trim() : '';
      const unit = headerMap.unit != null ? String(raw[headerMap.unit] ?? '').trim() : '';
      const quantity = headerMap.quantity != null ? toNumber(raw[headerMap.quantity]) : 0;
      const unitPrice = headerMap.unitPrice != null ? toNumber(raw[headerMap.unitPrice]) : 0;
      const rawCategory = headerMap.category != null ? raw[headerMap.category] : undefined;

      // Skip empty / total rows
      if (!designation && quantity === 0) continue;
      if (/^(total|sous[-\s]?total|s\.\s?total)/i.test(designation)) continue;

      const errors: string[] = [];
      if (!designation) errors.push('Désignation manquante');
      if (!unit) errors.push('Unité manquante');
      if (quantity <= 0) errors.push('Quantité invalide');

      const category = detectCategory(rawCategory, designation);
      const totalPrice = quantity * unitPrice;
      if (errors.length === 0) {
        validRows += 1;
        totalValue += totalPrice;
      }

      rows.push({
        lineNumber: rows.length + 1,
        categoryCode: category?.code,
        category,
        designation,
        unit,
        quantity,
        unitPrice,
        totalPrice,
        errors,
      });
    }

    return { rows, sheetName, totalRows: rows.length, validRows, totalValue };
  }

  /**
   * Map a parsed DQE row to a CreateQuantityTakeoffRequestDto.
   * Because the QuantityTakeoff entity recomputes quantity from
   * length × width × height, we encode the DQE quantity in `length`
   * with unit='m'. The original unit/category/designation are preserved
   * inside the `note` field as structured JSON.
   */
  static buildRequest(row: DQEParsedRow, ctx: DQEImportContext): CreateQuantityTakeoffRequestDto {
    const note = JSON.stringify({
      source: 'dqe-import',
      stepId: ctx.stepId,
      categoryCode: row.categoryCode,
      categoryLabel: row.category?.label.fr,
      designation: row.designation,
      originalUnit: row.unit,
      originalQuantity: row.quantity,
    });
    return {
      project_id: ctx.projectId,
      phase_id: ctx.phaseId,
      material_id: ctx.defaultMaterialId,
      element_type: row.categoryCode || 'DQE',
      unit: 'm', // see note above — length stores the true DQE quantity
      length: row.quantity,
      unit_price: row.unitPrice,
      note,
    };
  }

  /**
   * Persist parsed rows via QuantityTakeoffService. Continues on per-row errors.
   */
  static async importRows(
    rows: DQEParsedRow[],
    ctx: DQEImportContext,
    service: QuantityTakeoffService = new QuantityTakeoffService(),
  ): Promise<DQEImportResult> {
    const created: QuantityTakeoffWithDetails[] = [];
    const failed: Array<{ row: DQEParsedRow; error: string }> = [];

    for (const row of rows) {
      if (row.errors.length > 0) {
        failed.push({ row, error: row.errors.join(', ') });
        continue;
      }
      try {
        const request = DQEImportService.buildRequest(row, ctx);
        const result = await service.createQuantityTakeoff(request);
        created.push(result);
      } catch (error) {
        failed.push({
          row,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return { created, failed };
  }
}

export default DQEImportService;
