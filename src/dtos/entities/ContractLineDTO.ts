/**
 * ContractLineDTO — projection camelCase de `btp.contract_lines`.
 *
 * Les lignes contractuelles figent les prix issus du devis attribué (DQE lauréat)
 * et servent de base aux décomptes et aux factures.
 */

export interface ContractLineDTO {
  id: string;
  contractId: string;
  sourceBoqLineId: string | null;
  sourceEstimateItemId: string | null;
  phaseId: string | null;
  lotId: string | null;
  lineCode: string | null;
  designation: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  amountHt: number;
  vatRate: number;
  amountTtc: number;
  currency: string;
  category: string | null;
  displayOrder: number;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateContractLineDTO {
  contractId: string;
  sourceBoqLineId?: string | null;
  sourceEstimateItemId?: string | null;
  phaseId?: string | null;
  lotId?: string | null;
  lineCode?: string | null;
  designation: string;
  unit?: string | null;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  currency?: string;
  category?: string | null;
  displayOrder?: number;
  metadata?: Record<string, unknown> | null;
}

export type UpdateContractLineDTO = Partial<Omit<CreateContractLineDTO, 'contractId'>>;

/** Totaux d'un jeu de lignes contractuelles (HT / TVA / TTC). */
export interface ContractLineTotals {
  amountHt: number;
  vatAmount: number;
  amountTtc: number;
  lineCount: number;
}

export function computeContractLineTotals(lines: ContractLineDTO[]): ContractLineTotals {
  const amountHt = lines.reduce((sum, l) => sum + (Number(l.amountHt) || 0), 0);
  const amountTtc = lines.reduce((sum, l) => sum + (Number(l.amountTtc) || 0), 0);
  return {
    amountHt,
    vatAmount: amountTtc - amountHt,
    amountTtc,
    lineCount: lines.length,
  };
}
