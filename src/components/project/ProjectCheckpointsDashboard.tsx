/**
 * ProjectCheckpointsDashboard - Vue consolidée des checkpoints projet
 * Affiche l'état de vérification et décomptes au niveau projet
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Shield,
  FileCheck,
  ClipboardCheck,
  TrendingUp,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectCheckpoints } from '@/hooks/useProjectCheckpoints';
import { T } from '@/components/i18n/T';

interface ProjectCheckpointsDashboardProps {
  projectId: string;
  /** Avancement canonique fourni par ProjectMetricsOrchestrator. */
  progress?: number;
  compact?: boolean;
  onPhaseClick?: (phaseId: string) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MR', { 
    style: 'decimal', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MRU';
};

const ProjectCheckpointsDashboard: React.FC<ProjectCheckpointsDashboardProps> = ({
  projectId,
  progress,
  compact = false,
  onPhaseClick,
}) => {
  const {
    phases,
    projectVerification,
    phaseVerifications,
    projectDecompte,
    phaseDecomptes,
    metrics,
    isLoading,
  } = useProjectCheckpoints(projectId);
  const canonicalProgress = progress ?? metrics.verifiedProgress;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-2"><T k="auto.projectcheckpointsdashboard.chargement" fallback="Chargement..." /></p>
        </CardContent>
      </Card>
    );
  }

  if (!projectVerification || !projectDecompte) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground"><T k="auto.projectcheckpointsdashboard.aucune_donnee_de_verification_disponible" fallback="Aucune donnée de vérification disponible" /></p>
        </CardContent>
      </Card>
    );
  }

  // Compact view for overview tab
  if (compact) {
    return (
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Suivi Décompte & Vérifications
            </CardTitle>
            <Badge 
              variant="outline" 
              className={cn(
                projectVerification.allVerified 
                  ? 'bg-success-soft text-success border-success/30' 
                  : 'bg-warning/10 text-warning border-warning/30'
              )}
            >
              {projectVerification.allVerified ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> <T k="auto.projectcheckpointsdashboard.verifie" fallback="Vérifié" /></>
              ) : (
                <><Clock className="h-3 w-3 mr-1" /> <T k="auto.projectcheckpointsdashboard.en_cours" fallback="En cours" /></>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 border text-center">
              <p className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.progression_globale" fallback="Progression globale" /></p>
              <p className="text-xl font-bold text-primary">{canonicalProgress}%</p>
            </div>
            <div className="p-3 rounded-lg bg-success-soft dark:bg-success/20 border border-success/30 text-center">
              <p className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.total_paye" fallback="Total payé" /></p>
              <p className="text-lg font-bold text-success">{formatCurrency(metrics.totalPaid)}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 dark:bg-amber-900/20 border border-warning/30 text-center">
              <p className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.retenue_garantie" fallback="Retenue garantie" /></p>
              <p className="text-lg font-bold text-warning">{formatCurrency(metrics.totalRetained)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border text-center">
              <p className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.checkpoints" fallback="Checkpoints" /></p>
              <p className="text-lg font-bold">
                <span className="text-success">{metrics.completedCheckpoints}</span>
                <span className="text-muted-foreground">/{metrics.completedCheckpoints + metrics.pendingCheckpoints}</span>
              </p>
            </div>
          </div>

          {projectDecompte.canRequestPayment && (
            <div className="mt-3 p-2 rounded-lg bg-success-soft dark:bg-success/20 border border-success/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-success flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Paiement disponible: {formatCurrency(projectDecompte.netPayable)}
                </span>
                <Button size="sm" className="bg-success hover:bg-success">
                  <T k="auto.projectcheckpointsdashboard.demander" fallback="Demander" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view for dedicated tab
  return (
    <div className="space-y-6">
      {/* Project-level summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Tableau de bord Vérifications & Décomptes
            </CardTitle>
            <Badge 
              variant="outline" 
              className={cn(
                'text-sm',
                projectVerification.allVerified 
                  ? 'bg-success-soft text-success border-success/30' 
                  : 'bg-warning/10 text-warning border-warning/30'
              )}
            >
              Score: {(projectVerification as any).verificationScore ?? 0}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-primary/5 border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.progression" fallback="Progression" /></span>
              </div>
              <p className="text-2xl font-bold text-primary">{canonicalProgress}%</p>
              <Progress value={canonicalProgress} className="h-1 mt-2" />
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.budget_total" fallback="Budget total" /></span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(metrics.totalBudget)}</p>
            </div>
            <div className="p-4 rounded-lg bg-success-soft dark:bg-success/20 border border-success/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.paye" fallback="Payé" /></span>
              </div>
              <p className="text-xl font-bold text-success">{formatCurrency(metrics.totalPaid)}</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 dark:bg-amber-900/20 border border-warning/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.retenue" fallback="Retenue" /></span>
              </div>
              <p className="text-xl font-bold text-warning">{formatCurrency(metrics.totalRetained)}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 dark:bg-blue-900/20 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground"><T k="auto.projectcheckpointsdashboard.checkpoints" fallback="Checkpoints" /></span>
              </div>
              <p className="text-xl font-bold">
                <span className="text-success">{metrics.completedCheckpoints}</span>
                <span className="text-muted-foreground text-base">/{metrics.completedCheckpoints + metrics.pendingCheckpoints}</span>
              </p>
            </div>
          </div>

          {/* Verification status */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              (projectVerification as any).inspectionVerified ? 'bg-success-soft border-success/30' : 'bg-muted/30'
            )}>
              <ClipboardCheck className={cn('h-4 w-4', (projectVerification as any).inspectionVerified ? 'text-success' : 'text-muted-foreground')} />
              <span className="text-sm"><T k="auto.projectcheckpointsdashboard.inspections" fallback="Inspections" /></span>
              {(projectVerification as any).inspectionVerified && <CheckCircle className="h-3 w-3 text-success ml-auto" />}
            </div>
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              (projectVerification as any).documentVerified ? 'bg-success-soft border-success/30' : 'bg-muted/30'
            )}>
              <FileCheck className={cn('h-4 w-4', (projectVerification as any).documentVerified ? 'text-success' : 'text-muted-foreground')} />
              <span className="text-sm"><T k="auto.projectcheckpointsdashboard.documents" fallback="Documents" /></span>
              {(projectVerification as any).documentVerified && <CheckCircle className="h-3 w-3 text-success ml-auto" />}
            </div>
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              (projectVerification as any).approvalVerified ? 'bg-success-soft border-success/30' : 'bg-muted/30'
            )}>
              <Shield className={cn('h-4 w-4', (projectVerification as any).approvalVerified ? 'text-success' : 'text-muted-foreground')} />
              <span className="text-sm"><T k="auto.projectcheckpointsdashboard.approbations" fallback="Approbations" /></span>
              {(projectVerification as any).approvalVerified && <CheckCircle className="h-3 w-3 text-success ml-auto" />}
            </div>
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              (projectVerification as any).pvVerified ? 'bg-success-soft border-success/30' : 'bg-muted/30'
            )}>
              <FileCheck className={cn('h-4 w-4', (projectVerification as any).pvVerified ? 'text-success' : 'text-muted-foreground')} />
              <span className="text-sm"><T k="auto.projectcheckpointsdashboard.pv_service_fait" fallback="PV Service Fait" /></span>
              {(projectVerification as any).pvVerified && <CheckCircle className="h-3 w-3 text-success ml-auto" />}
            </div>
          </div>

          {/* Payment action */}
          {projectDecompte.canRequestPayment && (
            <div className="p-4 rounded-lg bg-success-soft dark:bg-success/20 border border-success/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-success"><T k="auto.projectcheckpointsdashboard.paiement_disponible" fallback="Paiement disponible" /></p>
                  <p className="text-sm text-success">
                    Net à payer: {formatCurrency(projectDecompte.netPayable)} 
                    (après retenue de {formatCurrency(projectDecompte.retentionAmount)})
                  </p>
                </div>
                <Button className="bg-success hover:bg-success">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <T k="auto.projectcheckpointsdashboard.demander_le_paiement" fallback="Demander le paiement" />
                </Button>
              </div>
            </div>
          )}

          {!projectDecompte.canRequestPayment && projectDecompte.progressToNextThreshold > 0 && (
            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Prochain seuil de paiement à {projectDecompte.nextPaymentThreshold}% 
                  ({projectDecompte.progressToNextThreshold}% restants)
                </span>
              </div>
              <Progress value={(canonicalProgress / projectDecompte.nextPaymentThreshold) * 100} className="h-1 mt-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase-by-phase breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base"><T k="auto.projectcheckpointsdashboard.detail_par_phase" fallback="Détail par phase" /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {phases.map((phase: any) => {
              const phaseVerif = phaseVerifications.get(phase.id);
              const phaseDecompte = phaseDecomptes.get(phase.id);
              const phaseName = phase.phaseName || phase.phase_name || 'Phase';
              const estCost = phase.estimatedCost ?? phase.estimated_cost ?? 0;
              
              return (
                <div 
                  key={phase.id}
                  className="p-4 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onPhaseClick?.(phase.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{phaseName}</span>
                      <Badge variant="outline" className="text-xs">
                        {phase.progress || 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {phaseVerif?.allVerified ? (
                        <Badge className="bg-success-soft text-success border-success/30">
                          <CheckCircle className="h-3 w-3 mr-1" /> <T k="auto.projectcheckpointsdashboard.verifie" fallback="Vérifié" />
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          <Clock className="h-3 w-3 mr-1" /> <T k="auto.projectcheckpointsdashboard.en_cours" fallback="En cours" />
                        </Badge>
                      )}
                      {phaseDecompte?.canRequestPayment && (
                        <Badge className="bg-success text-white">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(phaseDecompte.netPayable)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={phase.progress || 0} className="h-1" />
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Budget: {formatCurrency(estCost)}</span>
                    <span>Payé: {formatCurrency(phaseDecompte?.totalAlreadyPaid || 0)}</span>
                    <span>Retenu: {formatCurrency(phaseDecompte?.retentionAmount || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectCheckpointsDashboard;
