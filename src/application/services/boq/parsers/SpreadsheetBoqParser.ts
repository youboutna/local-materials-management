/**
 * SpreadsheetBoqParser — xlsx & csv → ParsedBoqRow[] via xlsx package.
 */
import * as XLSX from 'xlsx';
import type { IDocumentParser, ParseResult, ParsedBoqRow } from './IDocumentParser';

export class SpreadsheetBoqParser implements IDocumentParser {
  supports(file: File): boolean {
    const n = file.name.toLowerCase();
    return n.endsWith('.xlsx') || n.endsWith('.xls') || n.endsWith('.csv');
  }

  async parse(file: File): Promise<ParseResult> {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const first = wb.SheetNames[0];
    const sheet = wb.Sheets[first];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    const columns = json.length ? Object.keys(json[0]) : [];
    const rows: ParsedBoqRow[] = json.map((r) => ({
      raw: Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v == null ? null : (typeof v === 'number' ? v : String(v))])
      ),
    }));
    return { rows, columns, warnings: [] };
  }
}
