/**
 * Hexagonal Hook: useBankGuaranteesMonitorHex
 * Provides bank guarantees monitoring via services
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BankGuaranteeData {
  projectId: string;
  contractorId: string;
  bankLiaisonEmail: string;
  guaranteeAmount: number;
  delayPercentage: number;
  contractClause: string;
}

async function fetchBankGuaranteeForProject(projectId: string): Promise<BankGuaranteeData | null> {
  const { data: guarantee, error } = await supabase
    .from('bank_guarantees')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .single();

  if (error || !guarantee) {
    return null;
  }

  return {
    projectId,
    contractorId: guarantee.contractor_id,
    bankLiaisonEmail: `contact@${guarantee.bank_name.toLowerCase().replace(/\s+/g, '')}.mr`,
    guaranteeAmount: guarantee.guarantee_amount,
    delayPercentage: 0,
    contractClause: 'Article 15.3 - Garantie de bonne exécution',
  };
}

export function useBankGuaranteeForProjectHex(projectId: string) {
  const {
    data: guarantee,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bank-guarantee-project-hex', projectId],
    queryFn: () => fetchBankGuaranteeForProject(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  return {
    guarantee,
    isLoading,
    error,
    refetch,
  };
}

export default useBankGuaranteeForProjectHex;
