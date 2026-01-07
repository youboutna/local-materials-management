/**
 * CascadeWorkflowView - Vue simplifiée du workflow en cascade
 * 
 * Visualise le flux:
 * Jalon → Étape → Phase → Projet → Paiement → Matériaux → Qualité → Notification
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Circle,
  ArrowDown,
  Target,
  Layers,
  Building,
  DollarSign,
  Package,
  ClipboardCheck,
  Bell,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface CascadeWorkflowViewProps {
  phaseProgress: number;
  stepProgress: number;
  projectProgress: number;
  lastApprovedProgress: number;
  totalPaid: number;
  contractAmount: number;
  pendingInspections: number;
  lowStockMaterials: number;
  onCompleteMilestone?: () => void;
  onScheduleInspection?: () => void;
  onRequestPayment?: () => void;
  onCheckMaterials?: () => void;
  formatCurrency?: (n: number) => string;
}

const CascadeWorkflowView: React.FC<CascadeWorkflowViewProps> = ({
  phaseProgress,
  stepProgress,
  projectProgress,
  lastApprovedProgress,
  totalPaid,
  contractAmount,
  pendingInspections,
  lowStockMaterials,
  onCompleteMilestone,
  onScheduleInspection,
  onRequestPayment,
  onCheckMaterials,
  formatCurrency = (n) => `${n.toLocaleString('fr-FR')} MRU`,
}) => {
  // Déterminer l'étape active dans la cascade
  const getPaymentStatus = () => {
    if (lastApprovedProgress >= 100) return 'completed';
    if (lastApprovedProgress >= 25) return 'active';
    return 'pending';
  };

  const cascadeSteps: CascadeStep[] = [
    {
      id: 'milestone',
      label: 'Jalon complété',
      icon: <Target className="h-5 w-5" />,
      status: stepProgress >= 25 ? 'completed' : 'active',
      progress: stepProgress,
      details: `Progression étapes: ${Math.round(stepProgress)}%`,
      action: onCompleteMilestone ? {
        label: 'Marquer jalon',
        onClick: onCompleteMilestone,
        disabled: stepProgress >= 100,
      } : undefined,
    },
    {
      id: 'step',
      label: 'Recalcul étape',
      icon: <Layers className="h-5 w-5" />,
      status: stepProgress >= 50 ? 'completed' : stepProgress > 0 ? 'active' : 'pending',
      progress: stepProgress,
      details: `${Math.round(stepProgress)}% complété`,
    },
    {
      id: 'phase',
      label: 'Recalcul phase',
      icon: <Building className="h-5 w-5" />,
      status: phaseProgress >= 100 ? 'completed' : phaseProgress > 0 ? 'active' : 'pending',
      progress: phaseProgress,
      details: `Phase: ${Math.round(phaseProgress)}%`,
    },
    {
      id: 'project',
      label: 'Recalcul projet',
      icon: <Building className="h-5 w-5" />,
      status: projectProgress >= 100 ? 'completed' : projectProgress > 0 ? 'active' : 'pending',
      progress: projectProgress,
      details: `Projet: ${Math.round(projectProgress)}%`,
    },
    {
      id: 'payment',
      label: 'Seuil paiement',
      icon: <DollarSign className="h-5 w-5" />,
      status: getPaymentStatus(),
      details: lastApprovedProgress >= 25 
        ? `Seuil ${Math.floor(lastApprovedProgress / 25) * 25}% atteint`
        : 'Seuil 25% requis',
      action: onRequestPayment && lastApprovedProgress >= 25 ? {
        label: 'Demander paiement',
        onClick: onRequestPayment,
        disabled: lastApprovedProgress < 25,
      } : undefined,
    },
    {
      id: 'material',
      label: 'Matériaux',
      icon: <Package className="h-5 w-5" />,
      status: lowStockMaterials > 0 ? 'blocked' : 'completed',
      details: lowStockMaterials > 0 
        ? `${lowStockMaterials} en stock faible`
        : 'Stock OK',
      action: onCheckMaterials && lowStockMaterials > 0 ? {
        label: 'Vérifier stock',
        onClick: onCheckMaterials,
      } : undefined,
    },
    {
      id: 'quality',
      label: 'Inspection',
      icon: <ClipboardCheck className="h-5 w-5" />,
      status: pendingInspections > 0 ? 'active' : lastApprovedProgress > 0 ? 'completed' : 'pending',
      details: pendingInspections > 0 
        ? `${pendingInspections} en attente`
        : lastApprovedProgress > 0 ? 'Validée' : 'À programmer',
      action: onScheduleInspection ? {
        label: pendingInspections > 0 ? 'Voir inspection' : 'Programmer',
        onClick: onScheduleInspection,
      } : undefined,
    },
    {
      id: 'notification',
      label: 'Notification',
      icon: <Bell className="h-5 w-5" />,
      status: 'completed',
      details: 'Parties prenantes notifiées',
    },
  ];

  const getStatusColor = (status: CascadeStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'active': return 'bg-blue-500 text-white animate-pulse';
      case 'blocked': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: CascadeStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="py-4 bg-gradient-to-r from-primary/10 via-transparent to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Workflow en Cascade
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {formatCurrency(totalPaid)} payé
            </Badge>
            <Badge variant="outline">
              / {formatCurrency(contractAmount)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-6">
        {/* Pipeline horizontal sur desktop, vertical sur mobile */}
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-0 items-stretch">
          {cascadeSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Étape */}
              <div className={cn(
                "flex-1 p-3 rounded-lg border-2 transition-all",
                step.status === 'active' && "border-blue-300 bg-blue-50/50",
                step.status === 'completed' && "border-green-200 bg-green-50/30",
                step.status === 'blocked' && "border-red-200 bg-red-50/30",
                step.status === 'pending' && "border-muted bg-muted/20",
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    getStatusColor(step.status)
                  )}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{step.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{step.details}</p>
                  </div>
                  {getStatusIcon(step.status)}
                </div>

                {step.progress !== undefined && (
                  <Progress value={step.progress} className="h-1.5 mb-2" />
                )}

                {step.action && (
                  <Button
                    size="sm"
                    variant={step.status === 'blocked' ? 'destructive' : 'outline'}
                    className="w-full text-xs h-7"
                    onClick={step.action.onClick}
                    disabled={step.action.disabled}
                  >
                    {step.action.label}
                  </Button>
                )}
              </div>

              {/* Connecteur */}
              {index < cascadeSteps.length - 1 && (
                <div className="flex items-center justify-center py-1 lg:py-0 lg:px-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground lg:rotate-[-90deg]" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Règles Mauritanie */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Règles Métier Mauritanie
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-medium text-muted-foreground mb-1">Paiements</p>
              <ul className="space-y-1">
                <li>• Seuils: 25%, 50%, 75%, 100%</li>
                <li>• Garantie: 10% retenu</li>
                <li>• Inspection requise avant paiement</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Matériaux</p>
              <ul className="space-y-1">
                <li>• Priorité locale si dispo &gt; 70%</li>
                <li>• Certifications obligatoires</li>
                <li>• Traçabilité source → chantier</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Qualité</p>
              <ul className="space-y-1">
                <li>• Inspections à chaque seuil</li>
                <li>• Approbation ingénieur local</li>
                <li>• Normes mauritaniennes</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CascadeWorkflowView;
