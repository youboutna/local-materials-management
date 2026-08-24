/**
 * ContractRecordDTO — projection camelCase de `btp.contracts`.
 *
 * Objet contractuel persisté lors de l'attribution d'un appel d'offres
 * (devis accepté → contrat / bon de commande). Distinct du `ContractDTO`
 * détaillé : il porte uniquement la trace d'attribution exploitée par les
 * portails et le suivi des paiements.
 */

export interface ContractRecordDTO {
  id: string;
  contractNumber: string;
  title: string;
  projectId: string | null;
  tenderId: string | null;
  supplierId: string | null;
  sourceEstimateId: string | null;
  contractType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalAmount: number;
  currency: string;
  signedAt: string | null;
  signedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateContractRecordDTO {
  contractNumber: string;
  title: string;
  projectId?: string | null;
  tenderId?: string | null;
  supplierId?: string | null;
  sourceEstimateId?: string | null;
  contractType?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  totalAmount: number;
  currency?: string;
  signedAt?: string | null;
  metadata?: Record<string, unknown> | null;
}
