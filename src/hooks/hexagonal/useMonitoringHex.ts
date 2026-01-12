/**
 * Hexagonal Hooks for Monitoring
 * Bank Guarantees, Payment Blocks, Insurance, Notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  blockingReasons: any;
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
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

// Bank Guarantees Hook
export function useBankGuaranteesHex(projectId?: string) {
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuarantees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('bank_guarantees').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setGuarantees((data || []).map(g => ({
        id: g.id,
        projectId: g.project_id,
        contractorId: g.contractor_id,
        bankName: g.bank_name,
        guaranteeType: g.guarantee_type,
        guaranteeAmount: g.guarantee_amount,
        issueDate: g.issue_date,
        expiryDate: g.expiry_date,
        status: g.status,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bank guarantees');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('payment_blocks').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error: queryError } = await query.order('blocked_at', { ascending: false });

      if (queryError) throw queryError;

      setBlocks((data || []).map(b => ({
        id: b.id,
        projectId: b.project_id,
        contractorId: b.contractor_id,
        amount: b.amount,
        blockingReasons: b.blocking_reasons,
        notes: b.notes,
        blockedAt: b.blocked_at,
        blockedBy: b.blocked_by,
        resolvedAt: b.resolved_at,
        resolvedBy: b.resolved_by,
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
      const { error } = await supabase
        .from('payment_blocks')
        .update({ 
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy
        })
        .eq('id', blockId);

      if (error) throw error;
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

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('insurance_certificates').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setInsurances((data || []).map(i => ({
        id: i.id,
        projectId: i.project_id,
        contractorId: i.contractor_id,
        contractorName: i.contractor_name,
        insuranceCompany: i.insurance_company,
        policyNumber: i.policy_number,
        coverageType: i.coverage_type,
        coverageAmount: i.coverage_amount,
        validFrom: i.valid_from,
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
  }, [projectId]);

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

// Notifications Hook
export function useNotificationsHex(recipientId?: string, types?: string[]) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('notifications').select('*');
      
      if (recipientId) {
        query = query.eq('recipient_id', recipientId);
      }
      
      if (types && types.length > 0) {
        query = query.in('type', types);
      }

      const { data, error: queryError } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (queryError) throw queryError;

      setNotifications((data || []).map(n => ({
        id: n.id,
        recipientId: n.recipient_id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        relatedId: n.related_id,
        metadata: n.metadata as Record<string, any>,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [recipientId, types]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      return true;
    } catch (err) {
      console.error('Failed to mark as read:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!recipientId) return false;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', recipientId)
        .eq('read', false);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      return true;
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      return false;
    }
  }, [recipientId]);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    stats: {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
  };
}
