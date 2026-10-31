import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { DEFAULT_METERING_POLICY, type MeteringPolicy } from '@/config/referentials/boq/metering-policy.referential';

export interface BoqConsistencyIssue {
  index: number;
  code: string;
  field: 'totalHt' | 'unitPrice';
  expected: number;
  actual: number;
  delta: number;
  corrected: boolean;
}

/** Checks source arithmetic even when an import has already reconciled the PU. */
export class BoqConsistencyService {
  static inspect(lines: readonly BoqLineDTO[], policy: MeteringPolicy = DEFAULT_METERING_POLICY): BoqConsistencyIssue[] {
    return lines.flatMap((line, index) => {
      const correction = line.metadata?.priceCorrection;
      const original = correction && typeof correction === 'object' && 'originalUnitPrice' in correction
        ? correction.originalUnitPrice : undefined;
      const unitPrice = typeof original === 'number' ? original : line.unitPrice;
      if (unitPrice == null || line.totalHt == null) return [];
      const expected = line.quantity * unitPrice + (line.fees ?? 0);
      const actual = line.totalHt;
      if (!Number.isFinite(expected) || !Number.isFinite(actual) || Math.abs(expected - actual) <= policy.absolutePriceTolerance) return [];
      return [{ index, code: line.code ?? String(index + 1), field: 'totalHt' as const, expected, actual,
        delta: Math.abs(expected - actual), corrected: typeof original === 'number' }];
    });
  }

  static assertReady(lines: readonly BoqLineDTO[], policy: MeteringPolicy = DEFAULT_METERING_POLICY): void {
    const unresolved = this.inspect(lines, policy).filter((issue) => {
      const line = lines[issue.index];
      const approval = line.metadata?.priceCorrectionReview;
      return !(approval && typeof approval === 'object' && 'quantity' in approval && 'unitPrice' in approval && 'totalHt' in approval
        && approval.quantity === line.quantity && approval.unitPrice === line.unitPrice && approval.totalHt === line.totalHt && issue.corrected);
    });
    if (policy.blockUnresolvedCorrections && unresolved.length) throw new Error(`DQE: ${unresolved.length} unresolved price inconsistencies`);
  }

  static review(lines: readonly BoqLineDTO[]): BoqLineDTO[] {
    return lines.map((line) => ({ ...line, metadata: { ...line.metadata,
      priceCorrectionReview: { quantity: line.quantity, unitPrice: line.unitPrice, totalHt: line.totalHt },
    } }));
  }

  static compare(left: readonly BoqLineDTO[], right: readonly BoqLineDTO[], policy: MeteringPolicy = DEFAULT_METERING_POLICY): BoqConsistencyIssue[] {
    const byCode = new Map(right.filter((line) => line.code).map((line) => [line.code, line]));
    return left.flatMap((line, index) => {
      const other = line.code ? byCode.get(line.code) : undefined;
      if (!other || line.unitPrice == null || other.unitPrice == null || Math.abs(line.unitPrice - other.unitPrice) <= policy.absolutePriceTolerance) return [];
      return [{ index, code: line.code ?? String(index + 1), field: 'unitPrice' as const,
        expected: line.unitPrice, actual: other.unitPrice, delta: Math.abs(line.unitPrice - other.unitPrice), corrected: false }];
    });
  }
}