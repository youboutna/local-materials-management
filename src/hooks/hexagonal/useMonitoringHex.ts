/**
 * Hexagonal Hooks for Monitoring
 * Bank Guarantees, Payment Blocks, Insurance, Notifications
 *
 * Corrections appliquées :
 *   - ✅ Signature cohérente : accepte `string | { enabled }`
 *   - ✅ Suppression des doublons `i.x || i.x`
 *   - ✅ Cleanup dans useEffect (race conditions)
 *   - ✅ Suppression des console.log en production
 *   - ✅ setLoading géré proprement (pas de setState après unmount)
 *   - ✅ Mapping PaymentBlock corrigé
 *   - ✅ Typage strict (pas de `as any`)
 *   - ✅ Stats mémoïsées
 */

import { BankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { getInsuranceService } from '@/application/services/InsuranceService';
import { getPaymentBlockingService } from '@/application/services/PaymentBlockingService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

/**
 * Options unifiées pour tous les hooks de monitoring
 * - `string` : projectId direct (compat existante)
 * - `{ enabled: boolean }` : activer/désactiver le fetch
 * - `{ projectId: string }` : projectId explicite
 * - `undefined` : fetch global
 */
export type MonitoringHookOptions =
  | string
  | {
      enabled?: boolean;
      projectId?: string;
    }
  | undefined;

/**
 * Normalise les options en un objet standard
 */
function normalizeOptions(
  options: MonitoringHookOptions
): { enabled: boolean; projectId: string | undefined } {
  if (typeof options === 'string') {
    return { enabled: true, projectId: options };
  }
  if (options && typeof options === 'object') {
    return {
      enabled: options.enabled !== false,
      projectId: options.projectId,
    };
  }
  return { enabled: true, projectId: undefined };
}

// ────────────────────────────────────────────────────────────
// ENTITÉS PUBLIQUES (interfaces exposées)
// ────────────────────────────────────────────────────────────

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
  paymentRequestId: string;
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

// ────────────────────────────────────────────────────────────
// HOOK : BANK GUARANTEES
// ────────────────────────────────────────────────────────────

export function useBankGuaranteesHex(options?: MonitoringHookOptions) {
  const { enabled, projectId } = useMemo(() => normalizeOptions(options), [options]);

  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  // ✅ Ref pour éviter les setState après unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const bankGuaranteeService = useMemo(
    () => new BankGuaranteeService(RepositoryFactory.getBankGuaranteeRepository()),
    []
  );

  const fetchGuarantees = useCallback(async () => {
    // ✅ Pas de fetch si désactivé
    if (!enabled) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    // ✅ Pas de fetch si pas de projectId (comportement attendu)
    if (!projectId || projectId.trim() === '') {
      if (mountedRef.current) {
        setGuarantees([]);
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await bankGuaranteeService.getProjectBankGuarantees(projectId);
      if (!mountedRef.current) return;

      const transformedData: BankGuarantee[] = data.map((dto) => ({
        id: dto.id,
        projectId: dto.projectId ?? '',
        contractorId: dto.contractorId ?? '',
        bankName: dto.bankName ?? '',
        guaranteeType: dto.guaranteeType ?? '',
        guaranteeAmount: dto.guaranteeAmount ?? 0,
        issueDate: dto.issueDate ?? '',
        expiryDate: dto.expiryDate ?? '',
        status: dto.status ?? '',
        createdAt: dto.createdAt ?? '',
        updatedAt: dto.updatedAt ?? '',
      }));
      setGuarantees(transformedData);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch bank guarantees');
      if (import.meta.env.DEV) {
        console.error('[useBankGuaranteesHex] Error:', err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [projectId, enabled, bankGuaranteeService]);

  useEffect(() => {
    fetchGuarantees();
  }, [fetchGuarantees]);

  // ✅ Stats mémoïsées
  const stats = useMemo(() => {
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);

    const expiringSoon = guarantees.filter((g) => {
      const expiry = new Date(g.expiryDate);
      return expiry <= threshold && expiry > now && g.status === 'active';
    });

    return {
      total: guarantees.length,
      active: guarantees.filter((g) => g.status === 'active').length,
      expiringSoon: expiringSoon.length,
      totalAmount: guarantees.reduce((sum, g) => sum + g.guaranteeAmount, 0),
    };
  }, [guarantees]);

  const getExpiringGuarantees = useCallback(
    (daysThreshold: number = 30) => {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      const now = new Date();

      return guarantees.filter((g) => {
        const expiryDate = new Date(g.expiryDate);
        return expiryDate <= thresholdDate && expiryDate > now && g.status === 'active';
      });
    },
    [guarantees]
  );

  return {
    guarantees,
    loading,
    error,
    refetch: fetchGuarantees,
    getExpiringGuarantees,
    stats,
  };
}

// ────────────────────────────────────────────────────────────
// HOOK : PAYMENT BLOCKS
// ────────────────────────────────────────────────────────────

export function usePaymentBlocksHex(options?: MonitoringHookOptions) {
  const { enabled, projectId } = useMemo(() => normalizeOptions(options), [options]);

  const [blocks, setBlocks] = useState<PaymentBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchBlocks = useCallback(async () => {
    if (!enabled) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    if (!projectId || projectId.trim() === '') {
      if (mountedRef.current) {
        setBlocks([]);
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const blockingService = getPaymentBlockingService();
      const data = await blockingService.getPaymentBlocks(projectId);
      if (!mountedRef.current) return;

      // ✅ FIX : mapping corrigé (paymentRequestId ≠ projectId)
      const transformed: PaymentBlock[] = data.map((b) => ({
        id: b.id,
        paymentRequestId: b.paymentRequestId,
        amount: b.blockedAmount ?? 0,
        blockingReasons: b.blockReason ?? {},
        notes: b.resolutionNotes ?? null,
        blockedAt: b.createdAt,
        blockedBy: b.blockedBy ?? null,
        resolvedAt: b.resolvedAt ?? null,
        resolvedBy: b.resolvedBy ?? null,
      }));
      setBlocks(transformed);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load payment blocks');
      if (import.meta.env.DEV) {
        console.error('[usePaymentBlocksHex] Error:', err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // ✅ resolveBlock typé strictement
  const resolveBlock = useCallback(
    async (blockId: string, resolvedBy: string): Promise<boolean> => {
      try {
        const blockingService = getPaymentBlockingService();
        await blockingService.resolvePaymentBlock({
          block_id: blockId,
          resolution_notes: '',
          resolved_by: resolvedBy,
        });
        await fetchBlocks();
        return true;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[usePaymentBlocksHex.resolveBlock] Error:', err);
        }
        return false;
      }
    },
    [fetchBlocks]
  );

  // ✅ Stats mémoïsées
  const stats = useMemo(
    () => ({
      total: blocks.length,
      pending: blocks.filter((b) => !b.resolvedAt).length,
      resolved: blocks.filter((b) => b.resolvedAt).length,
      totalBlocked: blocks
        .filter((b) => !b.resolvedAt)
        .reduce((sum, b) => sum + b.amount, 0),
    }),
    [blocks]
  );

  return {
    blocks,
    loading,
    error,
    refetch: fetchBlocks,
    resolveBlock,
    stats,
  };
}

// ────────────────────────────────────────────────────────────
// HOOK : INSURANCE
// ────────────────────────────────────────────────────────────

export function useInsurancesHex(options?: MonitoringHookOptions) {
  const { enabled, projectId } = useMemo(() => normalizeOptions(options), [options]);

  const [insurances, setInsurances] = useState<InsuranceCertificate[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const insuranceService = useMemo(() => getInsuranceService(), []);

  const fetchInsurances = useCallback(async () => {
    if (!enabled) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    if (!projectId || projectId.trim() === '') {
      if (mountedRef.current) {
        setInsurances([]);
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const insuranceData = await insuranceService.getInsuranceCertificates(projectId);
      if (!mountedRef.current) return;

      // ✅ FIX : suppression des doublons `i.x || i.x`
      const transformed: InsuranceCertificate[] = insuranceData.map((i) => ({
        id: i.id,
        projectId: i.projectId ?? '',
        contractorId: i.contractorId ?? '',
        contractorName: i.contractorName ?? '',
        insuranceCompany: i.insuranceCompany ?? '',
        policyNumber: i.policyNumber ?? '',
        coverageType: i.insuranceType ?? '',
        coverageAmount: i.coverageAmount ?? 0,
        validFrom: i.validFrom ?? '',
        validUntil: i.validUntil ?? '',
        status: i.status ?? '',
        createdAt: i.createdAt ?? '',
        updatedAt: i.updatedAt ?? '',
      }));
      setInsurances(transformed);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load insurances');
      if (import.meta.env.DEV) {
        console.error('[useInsurancesHex] Error:', err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [projectId, enabled, insuranceService]);

  useEffect(() => {
    fetchInsurances();
  }, [fetchInsurances]);

  // ✅ Stats mémoïsées
  const stats = useMemo(() => {
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);

    const expiringSoon = insurances.filter((i) => {
      const expiry = new Date(i.validUntil);
      return expiry <= threshold && expiry > now && i.status === 'active';
    });

    return {
      total: insurances.length,
      active: insurances.filter((i) => i.status === 'active').length,
      expiringSoon: expiringSoon.length,
      totalCoverage: insurances.reduce((sum, i) => sum + i.coverageAmount, 0),
    };
  }, [insurances]);

  const getExpiringInsurances = useCallback(
    (daysThreshold: number = 30) => {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      const now = new Date();

      return insurances.filter((i) => {
        const expiryDate = new Date(i.validUntil);
        return expiryDate <= thresholdDate && expiryDate > now && i.status === 'active';
      });
    },
    [insurances]
  );

  return {
    insurances,
    loading,
    error,
    refetch: fetchInsurances,
    getExpiringInsurances,
    stats,
  };
}