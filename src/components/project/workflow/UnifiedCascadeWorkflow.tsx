/**
 * UnifiedCascadeWorkflow - Vue unifiée du workflow en cascade
 * Chaque étape de la cascade est cliquable et ouvre un panel CRUD
 * 
 * Flux: Jalon → Étape → Phase → Inspection → Paiement → Matériaux
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
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
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Zap,
  FileText,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseDTO, PhaseStepDTO } from '@/types/phase-dto';

// Types for cascade management
type CascadeItemType = 'milestone' | 'step' | 'phase' | 'inspection' | 'payment' | 'material';

interface CascadeStep {
  id: CascadeItemType;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  progress?: number;
  details?: string;
  count?: number;
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
  milestones?: any[];
  steps?: PhaseStepDTO[];
  inspections?: any[];
  payments?: any[];
  materials?: any[];
  lowStockMaterials?: number;
  onScheduleInspection: () => void;
  onRequestPayment: () => void;
  onGeneratePV?: () => void;
  onGenerateDecompte?: () => void;
  onMilestoneAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  onStepAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  onInspectionAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  onPaymentAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  formatCurrency: (n: number) => string;
}

const UnifiedCascadeWorkflow: React.FC<UnifiedCascadeWorkflowProps> = ({
  phase,
  projectProgress,
  workflowMetrics,
  milestones = [],
  steps = [],
  inspections = [],
  payments = [],
  materials = [],
  lowStockMaterials = 0,
  onScheduleInspection,
  onRequestPayment,
  onGeneratePV,
  onGenerateDecompte,
  onMilestoneAction,
  onStepAction,
  onInspectionAction,
  onPaymentAction,
  formatCurrency,
}) => {
  const [activePanel, setActivePanel] = useState<CascadeItemType | null>(null);
  
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
      count: milestones.length,
    },
    {
      id: 'step',
      label: 'Étapes',
      icon: <Layers className="h-4 w-4" />,
      status: stepProgress >= 50 ? 'completed' : stepProgress > 0 ? 'active' : 'pending',
      progress: stepProgress,
      count: steps.length || phase.steps?.length || 0,
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
      id: 'inspection',
      label: 'Inspection',
      icon: <ClipboardCheck className="h-4 w-4" />,
      status: pendingInspections > 0 ? 'active' : lastApprovedProgress > 0 ? 'completed' : 'pending',
      details: pendingInspections > 0 ? `${pendingInspections} en attente` : lastApprovedProgress > 0 ? 'Validée' : 'À prog.',
      count: inspections.length,
    },
    {
      id: 'payment',
      label: 'Paiement',
      icon: <DollarSign className="h-4 w-4" />,
      status: lastApprovedProgress >= 100 ? 'completed' : lastApprovedProgress >= 25 ? 'active' : 'pending',
      details: `Seuil ${Math.floor(lastApprovedProgress / 25) * 25}%`,
      count: payments.length,
    },
    {
      id: 'material',
      label: 'Matériaux',
      icon: <Package className="h-4 w-4" />,
      status: lowStockMaterials > 0 ? 'blocked' : 'completed',
      details: lowStockMaterials > 0 ? `${lowStockMaterials} alerte` : 'OK',
      count: materials.length,
    },
  ], [stepProgress, phaseProgress, lastApprovedProgress, pendingInspections, lowStockMaterials, milestones.length, steps.length, phase.steps?.length, inspections.length, payments.length, materials.length]);

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
      case 'completed': return 'border-green-200 bg-green-50/50 dark:bg-green-950/20 hover:border-green-300';
      case 'active': return 'border-primary/30 bg-primary/5 hover:border-primary/50';
      case 'blocked': return 'border-destructive/30 bg-destructive/5 hover:border-destructive/50';
      default: return 'border-muted hover:border-muted-foreground/30';
    }
  };

  // Calcul décompte Mauritanie
  const decompteInfo = useMemo(() => {
    const validatedPercent = lastApprovedProgress;
    const payablePercentage = Math.floor(validatedPercent / 25) * 25;
    const grossAmount = contractAmount * (payablePercentage / 100);
    const guaranteeRetention = grossAmount * 0.10;
    const netPayable = Math.max(0, grossAmount - guaranteeRetention - totalPaid);
    return {
      validatedPercent,
      payablePercentage,
      grossAmount,
      guaranteeRetention,
      netPayable,
      remaining: contractAmount - totalPaid,
    };
  }, [contractAmount, lastApprovedProgress, totalPaid]);

  const handleStepClick = (stepId: CascadeItemType) => {
    setActivePanel(stepId);
  };

  // Panel content based on active cascade step
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'milestone':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Jalons ({milestones.length})</h4>
              <Button size="sm" onClick={() => onMilestoneAction?.('add')}>
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun jalon défini</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {milestones.map((m: any) => (
                  <div key={m.id} className="p-3 rounded-lg border flex items-center justify-between group hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{m.title || m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.status} • {m.target_date || m.due_date}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMilestoneAction?.('edit', m)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onMilestoneAction?.('delete', m)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'step':
        const phaseSteps = steps.length > 0 ? steps : (phase.steps || []);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Étapes ({phaseSteps.length})</h4>
              <Button size="sm" onClick={() => onStepAction?.('add')}>
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
            {phaseSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune étape définie</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {phaseSteps.map((s: any, idx: number) => (
                  <div key={s.id} className="p-3 rounded-lg border flex items-center justify-between group hover:bg-muted/50" draggable>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{s.status}</span>
                          <Progress value={s.progress || 0} className="w-16 h-1.5" />
                          <span>{s.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onStepAction?.('edit', s)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onStepAction?.('delete', s)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'phase':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold">Détails Phase</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Nom</p>
                <p className="font-medium">{phase.phase_name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Statut</p>
                <Badge variant="outline">{phase.status}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Progression</p>
                <div className="flex items-center gap-2">
                  <Progress value={phaseProgress} className="flex-1 h-2" />
                  <span className="font-medium">{phaseProgress}%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Budget</p>
                <p className="font-medium">{formatCurrency(contractAmount)}</p>
              </div>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>{phase.description || 'Aucune description'}</p>
            </div>
          </div>
        );

      case 'inspection':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Inspections ({inspections.length})</h4>
              <Button size="sm" onClick={onScheduleInspection}>
                <Plus className="h-3 w-3 mr-1" /> Programmer
              </Button>
            </div>
            {inspections.length === 0 ? (
              <div className="text-center py-4">
                <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Aucune inspection</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={onScheduleInspection}>
                  Programmer une inspection
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {inspections.map((insp: any) => (
                  <div key={insp.id} className="p-3 rounded-lg border flex items-center justify-between group hover:bg-muted/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insp.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                          {insp.status}
                        </Badge>
                        <span className="text-sm font-medium">{insp.inspector}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(insp.date).toLocaleDateString('fr-FR')} • Progression: {insp.progress_at_inspection}%
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Paiements ({payments.length})</h4>
              <Button size="sm" onClick={onRequestPayment} disabled={!workflowMetrics.canRequestPayment}>
                <Plus className="h-3 w-3 mr-1" /> Demander
              </Button>
            </div>
            
            {/* Décompte rapide */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs font-medium text-primary">Décompte Mauritanie</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Seuil atteint:</span>
                <span className="text-right font-medium">{decompteInfo.payablePercentage}%</span>
                <span className="text-muted-foreground">Montant brut:</span>
                <span className="text-right">{formatCurrency(decompteInfo.grossAmount)}</span>
                <span className="text-muted-foreground">Retenue 10%:</span>
                <span className="text-right text-amber-600">-{formatCurrency(decompteInfo.guaranteeRetention)}</span>
                <span className="font-semibold">Net à payer:</span>
                <span className="text-right font-bold text-primary">{formatCurrency(decompteInfo.netPayable)}</span>
              </div>
            </div>

            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">Aucun paiement</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {payments.map((pay: any) => (
                  <div key={pay.id} className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-green-600">{formatCurrency(pay.amount)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(pay.payment_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Badge variant="outline">{pay.payment_method}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'material':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold">Matériaux ({materials.length})</h4>
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun matériau associé</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {materials.map((mat: any) => (
                  <div key={mat.id} className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{mat.name}</p>
                      <p className="text-xs text-muted-foreground">{mat.quantity} {mat.unit}</p>
                    </div>
                    <Badge variant={mat.stock_status === 'low' ? 'destructive' : 'outline'}>
                      {mat.stock_status || 'OK'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/30 text-xs">
              <p className="font-medium mb-1">Règles Mauritanie</p>
              <ul className="text-muted-foreground space-y-0.5">
                <li>• Priorité locale si disponibilité &gt; 70%</li>
                <li>• Certifications obligatoires</li>
                <li>• Traçabilité source → chantier</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
        {/* Pipeline cascade horizontal - CLIQUABLE */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {cascadeSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  "flex-shrink-0 p-3 rounded-lg border-2 transition-all min-w-[100px] cursor-pointer",
                  getStatusBorder(step.status),
                  activePanel === step.id && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="flex flex-col items-center text-center gap-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    getStatusColor(step.status)
                  )}>
                    {step.icon}
                  </div>
                  <p className="text-xs font-medium">{step.label}</p>
                  {step.count !== undefined && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {step.count}
                    </Badge>
                  )}
                  {step.details && (
                    <p className="text-[10px] text-muted-foreground">{step.details}</p>
                  )}
                  {step.progress !== undefined && (
                    <Progress value={step.progress} className="h-1 w-full mt-1" />
                  )}
                </div>
              </button>
              {index < cascadeSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Panel CRUD contextuel */}
        {activePanel && (
          <div className="p-4 rounded-lg border bg-card animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {cascadeSteps.find(s => s.id === activePanel)?.icon}
                <span className="font-semibold capitalize">{activePanel}</span>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setActivePanel(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {renderPanelContent()}
          </div>
        )}

        <Separator />

        {/* Actions rapides et Décompte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Actions rapides */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actions Rapides
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="justify-start" onClick={onScheduleInspection}>
                <ClipboardCheck className="h-3 w-3 mr-2" /> Inspection
              </Button>
              <Button size="sm" variant={workflowMetrics.canRequestPayment ? 'default' : 'outline'} className="justify-start" onClick={onRequestPayment} disabled={!workflowMetrics.canRequestPayment}>
                <DollarSign className="h-3 w-3 mr-2" /> Paiement
              </Button>
              {onGeneratePV && (
                <Button size="sm" variant="outline" className="justify-start" onClick={onGeneratePV}>
                  <FileText className="h-3 w-3 mr-2" /> Générer PV
                </Button>
              )}
              {onGenerateDecompte && (
                <Button size="sm" variant="outline" className="justify-start" onClick={onGenerateDecompte}>
                  <FileText className="h-3 w-3 mr-2" /> Décompte
                </Button>
              )}
            </div>
          </div>

          {/* Décompte Mauritanie */}
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
              <DollarSign className="h-3 w-3" /> Seuils: 25%, 50%, 75%, 100%
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Shield className="h-3 w-3" /> Garantie: 10% retenu
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <ClipboardCheck className="h-3 w-3" /> Inspection requise
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Package className="h-3 w-3" /> Priorité locale 70%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedCascadeWorkflow;
