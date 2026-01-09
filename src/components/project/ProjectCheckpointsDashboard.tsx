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

interface ProjectCheckpointsDashboardProps {
  projectId: string;
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!projectVerification || !projectDecompte) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune donnée de vérification disponible</p>
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
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              {projectVerification.allVerified ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Vérifié</>
              ) : (
                <><Clock className="h-3 w-3 mr-1" /> En cours</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 border text-center">
              <p className="text-xs text-muted-foreground">Progression vérifiée</p>
              <p className="text-xl font-bold text-primary">{metrics.verifiedProgress}%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 text-center">
              <p className="text-xs text-muted-foreground">Total payé</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-center">
              <p className="text-xs text-muted-foreground">Retenue garantie</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(metrics.totalRetained)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border text-center">
              <p className="text-xs text-muted-foreground">Checkpoints</p>
              <p className="text-lg font-bold">
                <span className="text-green-600">{metrics.completedCheckpoints}</span>
                <span className="text-muted-foreground">/{metrics.completedCheckpoints + metrics.pendingCheckpoints}</span>
              </p>
            </div>
          </div>

          {projectDecompte.canRequestPayment && (
            <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Paiement disponible: {formatCurrency(projectDecompte.netPayable)}
                </span>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Demander
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
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              )}
            >
              Score: {projectVerification.verificationScore}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-primary/5 border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Progression</span>
              </div>
              <p className="text-2xl font-bold text-primary">{metrics.verifiedProgress}%</p>
              <Progress value={metrics.verifiedProgress} className="h-1 mt-2" />
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">Budget total</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(metrics.totalBudget)}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Payé</span>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Retenue</span>
              </div>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(metrics.totalRetained)}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Checkpoints</span>
              </div>
              <p className="text-xl font-bold">
                <span className="text-green-600">{metrics.completedCheckpoints}</span>
                <span className="text-muted-foreground text-base">/{metrics.completedCheckpoints + metrics.pendingCheckpoints}</span>
              </p>
            </div>
          </div>

          {/* Verification status */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              projectVerification.inspectionVerified ? 'bg-green-50 border-green-200' : 'bg-muted/30'
            )}>
              <ClipboardCheck className={cn('h-4 w-4', projectVerification.inspectionVerified ? 'text-green-600' : 'text-muted-foreground')} />
              <span className="text-sm">Inspections</span>
              {projectVerification.inspectionVerified && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
            </div>
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              projectVerification.documentVerified ? 'bg-green-50 border-green-200' : 'bg-muted/30'
            )}>
              <FileCheck className={cn('h-4 w-4', projectVerification.documentVerified ? 'text-green-600' : 'text-muted-foreground')} />
              <span className="text-sm">Documents</span>
              {projectVerification.documentVerified && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
            </div>
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              projectVerification.approvalVerified ? 'bg-green-50 border-green-200' : 'bg-muted/30'
            )}>
              <Shield className={cn('h-4 w-4', projectVerification.approvalVerified ? 'text-green-600' : 'text-muted-foreground')} />
              <span className="text-sm">Approbations</span>
              {projectVerification.approvalVerified && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
            </div>
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2',
              projectVerification.pvVerified ? 'bg-green-50 border-green-200' : 'bg-muted/30'
            )}>
              <FileCheck className={cn('h-4 w-4', projectVerification.pvVerified ? 'text-green-600' : 'text-muted-foreground')} />
              <span className="text-sm">PV Service Fait</span>
              {projectVerification.pvVerified && <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />}
            </div>
          </div>

          {/* Payment action */}
          {projectDecompte.canRequestPayment && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-700">Paiement disponible</p>
                  <p className="text-sm text-green-600">
                    Net à payer: {formatCurrency(projectDecompte.netPayable)} 
                    (après retenue de {formatCurrency(projectDecompte.retentionAmount)})
                  </p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Demander le paiement
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
              <Progress value={(metrics.verifiedProgress / projectDecompte.nextPaymentThreshold) * 100} className="h-1 mt-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase-by-phase breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail par phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {phases.map((phase) => {
              const phaseVerif = phaseVerifications.get(phase.id);
              const phaseDecompte = phaseDecomptes.get(phase.id);
              
              return (
                <div 
                  key={phase.id}
                  className="p-4 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onPhaseClick?.(phase.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{phase.phase_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {phase.progress || 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {phaseVerif?.allVerified ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Vérifié
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" /> En cours
                        </Badge>
                      )}
                      {phaseDecompte?.canRequestPayment && (
                        <Badge className="bg-green-600 text-white">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(phaseDecompte.netPayable)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={phase.progress || 0} className="h-1" />
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Budget: {formatCurrency(phase.estimated_cost || 0)}</span>
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
