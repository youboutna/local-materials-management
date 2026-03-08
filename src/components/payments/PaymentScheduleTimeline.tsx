/**
 * PaymentScheduleTimeline - Visual payment schedule with penalty alerts
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Bell,
  FileText
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePaymentsHex } from '@/hooks/hexagonal';

// Define PaymentMilestone interface locally since hook doesn't export it
interface PaymentMilestone {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'approved' | 'overdue' | 'blocked' | 'completed';
  progressRequired: number;
  currentProgress: number;
  phaseName?: string;
  penaltyAccrued?: number;
  penaltyRate?: number;
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
  const { payments: rawPayments, isLoading } = usePaymentsHex();

  // Transform payments to PaymentMilestone format
  const payments: PaymentMilestone[] = (rawPayments || []).map(p => ({
    id: p.id,
    title: `Paiement ${p.id.slice(0, 8)}`,
    dueDate: p.createdAt || new Date().toISOString(),
    amount: p.amount || 0,
    status: (p.status || 'pending') as 'pending',
    progressRequired: 0,
    currentProgress: 0,
    phaseName: undefined
  }));
  
  const totalAmount = projectBudget || payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const totalPenalties = 0;

  const getStatusInfo = (payment: PaymentMilestone) => {
    switch (payment.status) {
      case 'paid':
      case 'completed':
        return { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', label: 'Payé' };
      case 'approved':
        return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Approuvé' };
      case 'overdue':
        return { icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'En retard' };
      case 'blocked':
        return { icon: Bell, color: 'text-amber-500', bgColor: 'bg-amber-500/10', label: 'Bloqué' };
      case 'pending':
      default:
        return { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'En attente' };
    }
  };

  const getDaysUntil = (dueDate: string) => {
    return differenceInDays(parseISO(dueDate), new Date());
  };

  if (isLoading) {
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
            {payments.map((payment) => {
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
