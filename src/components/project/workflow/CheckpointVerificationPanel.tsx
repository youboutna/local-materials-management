/**
 * CheckpointVerificationPanel - Panneau de vérification des jalons
 * Affiche le statut de vérification et permet de déclencher les paiements
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Shield,
  FileCheck,
  ClipboardCheck 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCheckpointVerification } from '@/hooks/useCheckpointVerification';
import { formatCurrency } from '../phase';

interface CheckpointVerificationPanelProps {
  projectId: string;
  phaseId: string;
  compact?: boolean;
}

const CheckpointVerificationPanel: React.FC<CheckpointVerificationPanelProps> = ({
  projectId,
  phaseId,
  compact = false,
}) => {
  const {
    checkpoints,
    decompteData,
    verificationStatus,
    isLoading,
    triggerPayment,
    canTriggerPayment,
    isPaying,
  } = useCheckpointVerification({ projectId, phaseId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Vérification</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            {verificationStatus.verified}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {verificationStatus.pending}
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-600" />
            {verificationStatus.failed}
          </span>
        </div>
        <Progress value={verificationStatus.score} className="w-20 h-2" />
        {canTriggerPayment && (
          <Button size="sm" onClick={triggerPayment} disabled={isPaying}>
            <DollarSign className="h-3 w-3 mr-1" />
            Payer
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Vérification des Jalons
          </CardTitle>
          <Badge variant="outline">
            Score: {verificationStatus.score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/30 border">
            <p className="text-lg font-bold">{verificationStatus.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-2 rounded-lg bg-green-50 border border-green-200">
            <p className="text-lg font-bold text-green-600">{verificationStatus.verified}</p>
            <p className="text-xs text-muted-foreground">Vérifiés</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border">
            <p className="text-lg font-bold">{verificationStatus.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
          <div className="p-2 rounded-lg bg-red-50 border border-red-200">
            <p className="text-lg font-bold text-red-600">{verificationStatus.failed}</p>
            <p className="text-xs text-muted-foreground">Échoués</p>
          </div>
        </div>

        {/* Decompte Info */}
        {decompteData && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Décompte automatique</span>
              <Badge variant={canTriggerPayment ? 'default' : 'secondary'}>
                {canTriggerPayment ? 'Prêt' : 'En attente'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Brut</p>
                <p className="font-medium">{formatCurrency(decompteData.current_period_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Retenue</p>
                <p className="font-medium text-amber-600">{formatCurrency(decompteData.retention_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net</p>
                <p className="font-bold text-primary">{formatCurrency(decompteData.net_payable)}</p>
              </div>
            </div>
            {canTriggerPayment && (
              <Button className="w-full" size="sm" onClick={triggerPayment} disabled={isPaying}>
                <DollarSign className="h-4 w-4 mr-2" />
                {isPaying ? 'Création...' : 'Créer le paiement'}
              </Button>
            )}
          </div>
        )}

        {/* Checkpoint List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {checkpoints?.map((cp) => (
            <div 
              key={cp.id} 
              className={cn(
                "flex items-center justify-between p-2 rounded-lg border",
                getStatusBadge(cp.status)
              )}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(cp.status)}
                <span className="text-sm">{cp.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {cp.trigger_progress}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {cp.verification_score}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <ClipboardCheck className="h-3 w-3" /> Inspection
          </span>
          <span className="flex items-center gap-1">
            <FileCheck className="h-3 w-3" /> Documents
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" /> Approbation
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckpointVerificationPanel;
