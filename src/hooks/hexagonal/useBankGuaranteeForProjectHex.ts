/**
 * Hexagonal Hook: useBankGuaranteesMonitorHex
 * Uses BankGuaranteeService instead of direct Supabase access
 */
import { BankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { useQuery } from '@tanstack/react-query';

export interface BankGuaranteeData {
  projectId: string;
  contractorId: string;
  bankLiaisonEmail: string;
  guaranteeAmount: number;
  delayPercentage: number;
  contractClause: string;
}

async function fetchBankGuaranteeForProject(projectId: string): Promise<BankGuaranteeData | null> {
  if (!projectId || projectId.trim() === '') {
    return {
      projectId: '',
      contractorId: '',
      bankLiaisonEmail: '',
      guaranteeAmount: 0,
      delayPercentage: 0,
      contractClause: 'Article 15.3 - Garantie de bonne exécution',
    };
  }

  try {
    const guarantees = await BankGuaranteeService.getByProjectId(projectId);
    const guarantee = guarantees.find(g => g.status === 'active') || guarantees[0];

    if (!guarantee) {
      return {
        projectId,
        contractorId: '',
        bankLiaisonEmail: '',
        guaranteeAmount: 0,
        delayPercentage: 0,
        contractClause: 'Article 15.3 - Garantie de bonne exécution',
      };
    }

    return {
      projectId,
      contractorId: guarantee.contractorId || guarantee.contractor_id || '',
      bankLiaisonEmail: (guarantee.issuingBank || guarantee.bank_name)
        ? `contact@${(guarantee.issuingBank || guarantee.bank_name || '').toLowerCase().replace(/\s+/g, '')}.mr`
        : '',
      guaranteeAmount: guarantee.guaranteeAmount || guarantee.amount || 0,
      delayPercentage: 0,
      contractClause: 'Article 15.3 - Garantie de bonne exécution',
    };
  } catch {
    return {
      projectId,
      contractorId: '',
      bankLiaisonEmail: '',
      guaranteeAmount: 0,
      delayPercentage: 0,
      contractClause: 'Article 15.3 - Garantie de bonne exécution',
    };
  }
}

export function useBankGuaranteeForProjectHex(projectId: string) {
  const { data: guarantee, isLoading, error, refetch } = useQuery({
    queryKey: ['bank-guarantee-project-hex', projectId],
    queryFn: () => fetchBankGuaranteeForProject(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  return { guarantee, isLoading, error, refetch };
}

export default useBankGuaranteeForProjectHex;
