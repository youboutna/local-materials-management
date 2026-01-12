/**
 * PaymentScheduleTimeline - Visual payment schedule with penalty alerts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Bell,
  FileText
} from 'lucide-react';
import { format, differenceInDays, parseISO, addDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMilestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'blocked';
  progressRequired: number;
  currentProgress: number;
  phaseId?: string;
  phaseName?: string;
  penaltyRate?: number;
  penaltyAccrued?: number;
}

interface PaymentScheduleTimelineProps {
  projectId: string;
  projectBudget?: number;
  onPaymentClick?: (paymentId: string) => void;
  onInitiatePayment?: (milestoneId: string) => void;
}

const PaymentScheduleTimeline: React.FC<PaymentScheduleTimelineProps> = ({
  projectId,
  projectBudget = 0,
  onPaymentClick,
  onInitiatePayment
}) => {
  const [payments, setPayments] = useState<PaymentMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentSchedule();
  }, [projectId]);

  const loadPaymentSchedule = async () => {
    try {
      setLoading(true);

      // Fetch payment milestones from enhanced_project_milestones
      const { data: milestonesData, error: mError } = await supabase
        .from('enhanced_project_milestones')
        .select(`
          *,
          project_phases (id, phase_name, progress)
        `)
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });

      if (mError) throw mError;

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId);

      const paymentMap = new Map((paymentsData || []).map((p: any) => [p.milestone_id, p]));

      // Filter milestones that are payment triggers
      const paymentMilestones: PaymentMilestone[] = (milestonesData || [])
        .filter((m: any) => {
          const deps = m.dependencies as any;
          return deps?.type === 'payment' || deps?.is_payment_trigger;
        })
        .map((m: any) => {
          const deps = m.dependencies as any;
          const existingPayment = paymentMap.get(m.id);
          const today = new Date();
          const dueDate = parseISO(m.target_date);
          const daysOverdue = Math.max(0, differenceInDays(today, dueDate));
          
          let status: PaymentMilestone['status'] = 'pending';
          if (existingPayment?.status === 'paid') status = 'paid';
          else if (existingPayment?.status === 'approved') status = 'approved';
          else if (isBefore(dueDate, today)) status = 'overdue';
          else if (existingPayment?.status === 'blocked') status = 'blocked';

          // Calculate penalty (0.1% per day of delay, typical construction)
          const penaltyRate = deps?.penalty_rate || 0.001;
          const penaltyAccrued = status === 'overdue' 
            ? (deps?.payment_amount || 0) * penaltyRate * daysOverdue 
            : 0;

          return {
            id: m.id,
            title: m.title,
            amount: deps?.payment_amount || (projectBudget * (m.weight || 0.1)),
            dueDate: m.target_date,
            status,
            progressRequired: deps?.progress_required || ((m.weight || 0.1) * 100),
            currentProgress: m.project_phases?.progress || 0,
            phaseId: m.phase_id,
            phaseName: m.project_phases?.phase_name,
            penaltyRate,
            penaltyAccrued
          };
        });

      setPayments(paymentMilestones);
    } catch (error) {
      console.error('Error loading payment schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (payment: PaymentMilestone) => {
    switch (payment.status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', label: 'Payé' };
      case 'approved':
        return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Approuvé' };
      case 'overdue':
        return { icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'En retard' };
      case 'blocked':
        return { icon: Bell, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Bloqué' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'En attente' };
    }
  };

  const getDaysUntil = (dueDate: string) => {
    return differenceInDays(parseISO(dueDate), new Date());
  };

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const totalPenalties = payments.reduce((sum, p) => sum + (p.penaltyAccrued || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Échéancier des Paiements
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total</span>
            </div>
            <p className="text-xl font-bold">
              {(totalAmount / 1000000).toFixed(2)}M
            </p>
            <p className="text-xs text-muted-foreground">MRU</p>
          </div>

          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-4 border border-success/20">
            <div className="flex items-center gap-2 text-success mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Payé</span>
            </div>
            <p className="text-xl font-bold">
              {(paidAmount / 1000000).toFixed(2)}M
            </p>
            <Progress value={(paidAmount / totalAmount) * 100} className="h-1 mt-2" />
          </div>

          <div className={cn(
            "rounded-lg p-4 border",
            overdueAmount > 0 
              ? "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20"
              : "bg-muted/30 border-muted"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-2",
              overdueAmount > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">En retard</span>
            </div>
            <p className="text-xl font-bold">
              {(overdueAmount / 1000000).toFixed(2)}M
            </p>
          </div>

          <div className={cn(
            "rounded-lg p-4 border",
            totalPenalties > 0 
              ? "bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20"
              : "bg-muted/30 border-muted"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-2",
              totalPenalties > 0 ? "text-orange-600" : "text-muted-foreground"
            )}>
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Pénalités</span>
            </div>
            <p className="text-xl font-bold">
              {(totalPenalties / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-muted-foreground">MRU accumulées</p>
          </div>
        </div>

        {/* Payment Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {payments.map((payment, idx) => {
              const status = getStatusInfo(payment);
              const StatusIcon = status.icon;
              const daysUntil = getDaysUntil(payment.dueDate);
              const progressMet = payment.currentProgress >= payment.progressRequired;

              return (
                <div
                  key={payment.id}
                  className={cn(
                    "relative pl-14 pr-4 py-4 rounded-lg border cursor-pointer transition-all",
                    "hover:shadow-md",
                    status.bgColor,
                    payment.status === 'overdue' && "ring-2 ring-destructive/30"
                  )}
                  onClick={() => onPaymentClick?.(payment.id)}
                >
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute left-4 top-6 w-5 h-5 rounded-full flex items-center justify-center",
                    "bg-background border-2",
                    payment.status === 'paid' && "border-success",
                    payment.status === 'approved' && "border-blue-500",
                    payment.status === 'overdue' && "border-destructive",
                    payment.status === 'pending' && "border-muted-foreground"
                  )}>
                    <StatusIcon className={cn("h-3 w-3", status.color)} />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{payment.title}</span>
                        <Badge variant="outline" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                        {payment.phaseName && (
                          <Badge variant="secondary" className="text-xs">
                            {payment.phaseName}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseISO(payment.dueDate), 'd MMM yyyy', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {(payment.amount / 1000000).toFixed(2)}M MRU
                        </div>
                      </div>

                      {/* Progress Check */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            Progression requise: {payment.progressRequired}%
                          </span>
                          <span className={progressMet ? "text-success" : "text-muted-foreground"}>
                            Actuel: {payment.currentProgress}%
                          </span>
                        </div>
                        <Progress 
                          value={payment.currentProgress} 
                          className="h-1.5" 
                        />
                      </div>

                      {/* Penalty Warning */}
                      {payment.penaltyAccrued && payment.penaltyAccrued > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>
                            Pénalité accumulée: {(payment.penaltyAccrued / 1000).toFixed(0)}K MRU 
                            ({(payment.penaltyRate! * 100).toFixed(2)}%/jour)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Days indicator */}
                      {payment.status === 'pending' && (
                        <Badge 
                          variant={daysUntil <= 7 ? 'destructive' : daysUntil <= 14 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {daysUntil < 0 
                            ? `${Math.abs(daysUntil)}j de retard`
                            : daysUntil === 0 
                              ? "Aujourd'hui"
                              : `Dans ${daysUntil}j`
                          }
                        </Badge>
                      )}

                      {/* Action Button */}
                      {payment.status === 'pending' && progressMet && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInitiatePayment?.(payment.id);
                          }}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Initier
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun échéancier de paiement défini</p>
            <p className="text-xs mt-1">
              Créez des jalons de type "paiement" pour définir l'échéancier
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentScheduleTimeline;
