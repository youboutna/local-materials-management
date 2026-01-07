/**
 * UnifiedCascadeWorkflow - Vue unifiée du workflow en cascade
 * Fusionne: CascadeWorkflowView, WorkflowBoard, QuickActions, PaymentCalculator
 * 
 * Flux: Jalon → Étape → Phase → Projet → Paiement → Matériaux → Qualité
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Target,
  Layers,
  Building,
  DollarSign,
  Package,
  ClipboardCheck,
  Shield,
  Play,
  AlertTriangle,
  Calendar,
  FileText,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseDTO, PhaseStepDTO } from '@/types/phase-dto';

interface CascadeStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  progress?: number;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

interface UnifiedCascadeWorkflowProps {
  phase: PhaseDTO;
  projectProgress: number;
  workflowMetrics: {
    stepProgress: number;
    lastApprovedProgress: number;
    totalPaid: number;
    pendingInspections: number;
    canRequestPayment?: boolean;
    canScheduleInspection?: boolean;
  };
  lowStockMaterials?: number;
  onScheduleInspection: () => void;
  onRequestPayment: () => void;
  onGeneratePV?: () => void;
  onGenerateDecompte?: () => void;
  formatCurrency: (n: number) => string;
}

const UnifiedCascadeWorkflow: React.FC<UnifiedCascadeWorkflowProps> = ({
  phase,
  projectProgress,
  workflowMetrics,
  lowStockMaterials = 0,
  onScheduleInspection,
  onRequestPayment,
  onGeneratePV,
  onGenerateDecompte,
  formatCurrency,
}) => {
  const phaseProgress = phase.progress || 0;
  const contractAmount = phase.estimated_cost || 0;
  const { stepProgress, lastApprovedProgress, totalPaid, pendingInspections } = workflowMetrics;

  // Cascade steps basés sur le flux métier
  const cascadeSteps: CascadeStep[] = useMemo(() => [
    {
      id: 'milestone',
      label: 'Jalons',
      icon: <Target className="h-4 w-4" />,
      status: stepProgress >= 25 ? 'completed' : stepProgress > 0 ? 'active' : 'pending',
      progress: stepProgress,
      details: `${Math.round(stepProgress)}%`,
    },
    {
      id: 'step',
      label: 'Étapes',
      icon: <Layers className="h-4 w-4" />,
      status: stepProgress >= 50 ? 'completed' : stepProgress > 0 ? 'active' : 'pending',
      progress: stepProgress,
    },
    {
      id: 'phase',
      label: 'Phase',
      icon: <Building className="h-4 w-4" />,
      status: phaseProgress >= 100 ? 'completed' : phaseProgress > 0 ? 'active' : 'pending',
      progress: phaseProgress,
      details: `${Math.round(phaseProgress)}%`,
    },
    {
      id: 'quality',
      label: 'Inspection',
      icon: <ClipboardCheck className="h-4 w-4" />,
      status: pendingInspections > 0 ? 'active' : lastApprovedProgress > 0 ? 'completed' : 'pending',
      details: pendingInspections > 0 ? `${pendingInspections} en attente` : lastApprovedProgress > 0 ? 'Validée' : 'À programmer',
      action: {
        label: pendingInspections > 0 ? 'Voir' : 'Programmer',
        onClick: onScheduleInspection,
      },
    },
    {
      id: 'payment',
      label: 'Paiement',
      icon: <DollarSign className="h-4 w-4" />,
      status: lastApprovedProgress >= 100 ? 'completed' : lastApprovedProgress >= 25 ? 'active' : 'pending',
      details: lastApprovedProgress >= 25 ? `Seuil ${Math.floor(lastApprovedProgress / 25) * 25}%` : 'Seuil 25% requis',
      action: lastApprovedProgress >= 25 ? {
        label: 'Demander',
        onClick: onRequestPayment,
      } : undefined,
    },
    {
      id: 'material',
      label: 'Matériaux',
      icon: <Package className="h-4 w-4" />,
      status: lowStockMaterials > 0 ? 'blocked' : 'completed',
      details: lowStockMaterials > 0 ? `${lowStockMaterials} alerte` : 'OK',
    },
  ], [stepProgress, phaseProgress, lastApprovedProgress, pendingInspections, lowStockMaterials, onScheduleInspection, onRequestPayment]);

  const getStatusColor = (status: CascadeStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'active': return 'bg-primary text-primary-foreground';
      case 'blocked': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBorder = (status: CascadeStep['status']) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50/50 dark:bg-green-950/20';
      case 'active': return 'border-primary/30 bg-primary/5';
      case 'blocked': return 'border-destructive/30 bg-destructive/5';
      default: return 'border-muted';
    }
  };

  // Calcul décompte Mauritanie
  const decompteInfo = useMemo(() => {
    const validatedPercent = lastApprovedProgress;
    const grossAmount = contractAmount * (validatedPercent / 100);
    const guaranteeRetention = grossAmount * 0.10;
    const netPayable = grossAmount - guaranteeRetention - totalPaid;
    return {
      validatedPercent,
      grossAmount,
      guaranteeRetention,
      netPayable: Math.max(0, netPayable),
      remaining: contractAmount - totalPaid,
    };
  }, [contractAmount, lastApprovedProgress, totalPaid]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Workflow Cascade
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
              {formatCurrency(totalPaid)}
            </Badge>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{formatCurrency(contractAmount)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-5 space-y-6">
        {/* Pipeline cascade horizontal */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {cascadeSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={cn(
                "flex-shrink-0 p-3 rounded-lg border-2 transition-all min-w-[100px]",
                getStatusBorder(step.status)
              )}>
                <div className="flex flex-col items-center text-center gap-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    getStatusColor(step.status)
                  )}>
                    {step.icon}
                  </div>
                  <p className="text-xs font-medium">{step.label}</p>
                  {step.details && (
                    <p className="text-[10px] text-muted-foreground">{step.details}</p>
                  )}
                  {step.progress !== undefined && (
                    <Progress value={step.progress} className="h-1 w-full mt-1" />
                  )}
                  {step.action && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2 mt-1"
                      onClick={step.action.onClick}
                      disabled={step.action.disabled}
                    >
                      {step.action.label}
                    </Button>
                  )}
                </div>
              </div>
              {index < cascadeSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        <Separator />

        {/* Actions rapides et Calcul décompte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Actions rapides */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actions Rapides
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="justify-start"
                onClick={onScheduleInspection}
                disabled={!workflowMetrics.canScheduleInspection}
              >
                <ClipboardCheck className="h-3 w-3 mr-2" />
                Inspection
              </Button>
              <Button
                size="sm"
                variant={workflowMetrics.canRequestPayment ? 'default' : 'outline'}
                className="justify-start"
                onClick={onRequestPayment}
                disabled={!workflowMetrics.canRequestPayment}
              >
                <DollarSign className="h-3 w-3 mr-2" />
                Paiement
              </Button>
              {onGeneratePV && (
                <Button
                  size="sm"
                  variant="outline"
                  className="justify-start"
                  onClick={onGeneratePV}
                >
                  <FileText className="h-3 w-3 mr-2" />
                  Générer PV
                </Button>
              )}
              {onGenerateDecompte && (
                <Button
                  size="sm"
                  variant="outline"
                  className="justify-start"
                  onClick={onGenerateDecompte}
                >
                  <FileText className="h-3 w-3 mr-2" />
                  Décompte
                </Button>
              )}
            </div>
          </div>

          {/* Calcul Mauritanie */}
          <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              Décompte Mauritanie
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Progression validée:</span>
              <span className="font-medium text-right">{decompteInfo.validatedPercent}%</span>
              
              <span className="text-muted-foreground">Montant brut:</span>
              <span className="font-medium text-right">{formatCurrency(decompteInfo.grossAmount)}</span>
              
              <span className="text-muted-foreground">Retenue garantie (10%):</span>
              <span className="font-medium text-right text-amber-600">-{formatCurrency(decompteInfo.guaranteeRetention)}</span>
              
              <span className="text-muted-foreground">Déjà payé:</span>
              <span className="font-medium text-right text-green-600">-{formatCurrency(totalPaid)}</span>
              
              <Separator className="col-span-2 my-1" />
              
              <span className="font-semibold">Net à payer:</span>
              <span className="font-bold text-right text-primary">{formatCurrency(decompteInfo.netPayable)}</span>
            </div>
          </div>
        </div>

        {/* Règles métier compactes */}
        <div className="p-3 rounded-lg bg-muted/20 border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground overflow-x-auto">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <DollarSign className="h-3 w-3" />
              Seuils: 25%, 50%, 75%, 100%
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Shield className="h-3 w-3" />
              Garantie: 10% retenu
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <ClipboardCheck className="h-3 w-3" />
              Inspection requise
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Package className="h-3 w-3" />
              Priorité locale 70%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedCascadeWorkflow;
