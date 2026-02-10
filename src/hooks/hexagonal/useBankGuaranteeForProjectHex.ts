/**
 * Hexagonal Hook: useBankGuaranteesMonitorHex
 * Uses BankGuaranteeService instead of direct Supabase access
 */
import { useQuery } from '@tanstack/react-query';
import { BankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
    const service = new BankGuaranteeService(RepositoryFactory.getBankGuaranteeRepository());
    const guarantee = await service.getActiveGuaranteeForProject(projectId);

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
      contractorId: guarantee.contractorId || '',
      bankLiaisonEmail: guarantee.bankName 
        ? `contact@${guarantee.bankName.toLowerCase().replace(/\s+/g, '')}.mr`
        : '',
      guaranteeAmount: guarantee.guaranteeAmount || 0,
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
