import * as XLSX from 'xlsx';
import type { PlanningWorkbookDTO, PlanningSourceCellDTO } from '@/dtos/entities/PlanningWorkbookDTO';
import { readFileAsArrayBuffer } from './IProjectFileParser';

/** Technical extraction only. Business interpretation belongs to the template service. */
export class PlanningWorkbookReader {
  static async read(file: File): Promise<PlanningWorkbookDTO> {
    return this.fromBuffer(await readFileAsArrayBuffer(file), file.name);
  }

  static fromBuffer(buffer: ArrayBuffer, filename: string): PlanningWorkbookDTO {
    const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true, cellFormula: true, cellNF: true });
    return { filename, sheets: workbook.SheetNames.map(name => {
      const sheet = workbook.Sheets[name];
      if (!sheet?.['!ref']) return { name, rows: [], merges: [] };
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const rows: PlanningSourceCellDTO[][] = [];
      for (let r = 0; r <= range.e.r; r++) {
        const row: PlanningSourceCellDTO[] = [];
        for (let c = 0; c <= range.e.c; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r, c })];
          row.push({ value: cell?.v ?? null, ...(cell?.f ? { formula: cell.f } : {}), ...(cell?.w ? { formatted: cell.w } : {}), ...(cell?.s ? { style: cell.s } : {}) });
        }
        rows.push(row);
      }
      return { name, rows, merges: (sheet['!merges'] ?? []).map(merge => XLSX.utils.encode_range(merge)) };
    }) };
  }

  static async narrative(file: File): Promise<string> {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await readFileAsArrayBuffer(file) });
    return result.value;
  }
}