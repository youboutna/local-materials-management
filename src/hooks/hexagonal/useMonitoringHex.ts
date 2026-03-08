/**
 * Hexagonal Hooks for Monitoring
 * Bank Guarantees, Payment Blocks, Insurance, Notifications
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { BankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { PaymentBlockingService } from '@/application/services/PaymentBlockingService';
import { InsuranceService } from '@/application/services/InsuranceService';
import { NotificationService } from '@/application/services/NotificationService';

// Types for monitoring entities
export interface BankGuarantee {
  id: string;
  projectId: string;
  contractorId: string;
  bankName: string;
  guaranteeType: string;
  guaranteeAmount: number;
  issueDate: string;
  expiryDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentBlock {
  id: string;
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons: Record<string, unknown> | string;
  notes: string | null;
  blockedAt: string;
  blockedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface InsuranceCertificate {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageType: string;
  coverageAmount: number;
  validFrom: string;
  validUntil: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  relatedId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Bank Guarantees Hook
export function useBankGuaranteesHex(projectId?: string) {
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bankGuaranteeService = useMemo(() => 
    new BankGuaranteeService(RepositoryFactory.getBankGuaranteeRepository()), 
    []
  );

  const fetchGuarantees = useCallback(async () => {
    // Don't fetch if no projectId provided - this is normal in a project management app
    if (!projectId || projectId.trim() === '') {
      console.log('useBankGuaranteesHex: No projectId provided, skipping fetch');
      setGuarantees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await bankGuaranteeService.getProjectBankGuarantees(projectId);
      // Transform BankGuaranteeDTO to BankGuarantee
      const transformedData = data.map(dto => ({
        id: dto.id,
        projectId: dto.project_id || '',
        contractorId: dto.contractor_id || '',
        bankName: dto.bank_name || '',
        guaranteeType: dto.guarantee_type || '',
        guaranteeAmount: dto.guarantee_amount || 0,
        issueDate: dto.issue_date || '',
        expiryDate: dto.expiry_date || '',
        status: dto.status || '',
        createdAt: dto.created_at || '',
        updatedAt: dto.updated_at || '',
      }));
      setGuarantees(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bank guarantees');
      console.error('Error fetching bank guarantees:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, bankGuaranteeService]);

  useEffect(() => {
    fetchGuarantees();
  }, [fetchGuarantees]);

  const getExpiringGuarantees = useCallback((daysThreshold: number = 30) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return guarantees.filter(g => {
      const expiryDate = new Date(g.expiryDate);
      return expiryDate <= thresholdDate && g.status === 'active';
    });
  }, [guarantees]);

  return {
    guarantees,
    loading,
    error,
    refetch: fetchGuarantees,
    getExpiringGuarantees,
    stats: {
      total: guarantees.length,
      active: guarantees.filter(g => g.status === 'active').length,
      expiringSoon: getExpiringGuarantees(30).length,
      totalAmount: guarantees.reduce((sum, g) => sum + g.guaranteeAmount, 0),
    },
  };
}

// Payment Blocks Hook
export function usePaymentBlocksHex(projectId?: string) {
  const [blocks, setBlocks] = useState<PaymentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    // Don't fetch if no projectId provided - this is normal in a project management app
    if (!projectId || projectId.trim() === '') {
      console.log('usePaymentBlocksHex: No projectId provided, skipping fetch');
      setBlocks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const blockingService = new PaymentBlockingService();
      const data = await blockingService.getPaymentBlocks(projectId);
      
      setBlocks(data.map(b => ({
        id: b.id,
        projectId: b.payment_request_id, // Map from payment_request_id
        contractorId: '', // Not available in PaymentBlock interface
        amount: b.blocked_amount, // Map from blocked_amount
        blockingReasons: b.block_reason, // Map from block_reason
        notes: b.resolution_notes || null, // Map from resolution_notes
        blockedAt: b.created_at, // Map from created_at
        blockedBy: null, // Not available in PaymentBlock interface
        resolvedAt: b.resolved_at || null, // Map from resolved_at
        resolvedBy: b.resolved_by || null, // Map from resolved_by
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment blocks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const resolveBlock = useCallback(async (blockId: string, resolvedBy: string): Promise<boolean> => {
    try {
      const blockingService = new PaymentBlockingService();
      await blockingService.resolvePaymentBlock({ block_id: blockId, resolution_notes: '', resolved_by: resolvedBy } as any);
      await fetchBlocks();
      return true;
    } catch (err) {
      console.error('Failed to resolve block:', err);
      return false;
    }
  }, [fetchBlocks]);

  return {
    blocks,
    loading,
    error,
    refetch: fetchBlocks,
    resolveBlock,
    stats: {
      total: blocks.length,
      pending: blocks.filter(b => !b.resolvedAt).length,
      resolved: blocks.filter(b => b.resolvedAt).length,
      totalBlocked: blocks.filter(b => !b.resolvedAt).reduce((sum, b) => sum + b.amount, 0),
    },
  };
}

// Insurance Certificates Hook
export function useInsurancesHex(projectId?: string) {
  const [insurances, setInsurances] = useState<InsuranceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const insuranceService = useMemo(() => 
    new InsuranceService(), 
    []
  );

  const fetchInsurances = useCallback(async () => {
    // Don't fetch if no projectId provided - this is normal in a project management app
    if (!projectId || projectId.trim() === '') {
      console.log('useInsurancesHex: No projectId provided, skipping fetch');
      setInsurances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use InsuranceService - placeholder implementation
      const insuranceData = await insuranceService.getInsuranceCertificates(projectId);

      setInsurances(insuranceData.map(i => ({
        id: i.id,
        projectId: i.project_id,
        contractorId: i.contractor_id,
        contractorName: i.provider, // Using provider as contractorName
        insuranceCompany: i.provider,
        policyNumber: i.policy_number,
        coverageType: i.insurance_type,
        coverageAmount: i.coverage_amount,
        validFrom: i.start_date,
        validUntil: i.valid_until,
        status: i.status,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insurances');
    } finally {
      setLoading(false);
    }
  }, [projectId, insuranceService]);

  useEffect(() => {
    fetchInsurances();
  }, [fetchInsurances]);

  const getExpiringInsurances = useCallback((daysThreshold: number = 30) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return insurances.filter(i => {
      const expiryDate = new Date(i.validUntil);
      return expiryDate <= thresholdDate && i.status === 'active';
    });
  }, [insurances]);

  return {
    insurances,
    loading,
    error,
    refetch: fetchInsurances,
    getExpiringInsurances,
    stats: {
      total: insurances.length,
      active: insurances.filter(i => i.status === 'active').length,
      expiringSoon: getExpiringInsurances(30).length,
      totalCoverage: insurances.reduce((sum, i) => sum + i.coverageAmount, 0),
    },
  };
}
