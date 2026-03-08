/**
 * StepDetailPanel - Panneau de détail d'une étape avec actions intégrées
 * Architecture hexagonale: utilise les use cases pour les opérations
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  DollarSign, 
  FileText, 
  Target, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarPlus,
  X,
  Eye,
  ListChecks,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InspectionService } from '@/application/services/InspectionService';

// Components
import EnhancedScheduleInspectionModal from '@/components/inspections/EnhancedScheduleInspectionModal';
import PaymentRequestModal from '@/components/payments/PaymentRequestModal';

// Types
type StepDetailTab = 'overview' | 'inspections' | 'documents' | 'payments';

interface StepDetailPanelProps {
  step: {
    id: string;
    name: string;
    description?: string;
    status: string;
    progress?: number;
    order_index?: number;
    start_date?: string;
    end_date?: string;
    tasks?: unknown[];
    milestones?: unknown[];
    documents?: unknown[];
    inspections?: unknown[];
    payments?: unknown[];
  };
  phaseId: string;
  projectId: string;
  onClose?: () => void;
  onUpdate?: () => void;
}

export const StepDetailPanel: React.FC<StepDetailPanelProps> = ({
  step,
  phaseId,
  projectId,
  onClose,
  onUpdate
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
  const paymentRepository = RepositoryFactory.getPaymentRepository();

  const [activeTab, setActiveTab] = useState<StepDetailTab>('overview');
  const [inspectionModal, setInspectionModal] = useState<{
    open: boolean;
    mode: 'request' | 'schedule';
  }>({ open: false, mode: 'request' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch inspections for this step/phase
  const { data: inspectionsData } = useQuery({
    queryKey: ['step-inspections', phaseId],
    queryFn: async () => {
      const inspections = await inspectionService.getInspectionsByPhase(phaseId);

      const approvedCount = inspections.filter((i) => (i.status as string) === 'approved').length;
      return {
        inspections,
        totalCount: inspections.length,
        approvedCount,
      };
    },
    enabled: !!phaseId
  });

  // Fetch payments for this step/phase
  const { data: paymentsData } = useQuery({
    queryKey: ['step-payments', phaseId],
    queryFn: async () => {
      const payments = await paymentRepository.findByPhaseId(phaseId);
      const totalPaid = payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        payments,
        paymentCount: payments.length,
        totalPaid,
      };
    },
    enabled: !!phaseId
  });

  // Calculate permissions based on step status
  const permissions = useMemo(() => ({
    canRequestInspection: ['pending', 'in_progress'].includes(step.status),
    canScheduleInspection: ['pending', 'in_progress'].includes(step.status),
    canExecuteInspection: step.status === 'in_progress',
    canRequestPayment: step.status === 'completed' || (step.progress || 0) >= 100,
  }), [step.status, step.progress]);

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { label: 'Terminée', className: 'bg-success/10 text-success', icon: CheckCircle };
      case 'in_progress':
        return { label: 'En cours', className: 'bg-info/10 text-info', icon: Clock };
      case 'delayed':
        return { label: 'En retard', className: 'bg-destructive/10 text-destructive', icon: AlertTriangle };
      default:
        return { label: 'En attente', className: 'bg-muted text-muted-foreground', icon: Target };
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'MRU',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const statusConfig = getStatusConfig(step.status);
  const StatusIcon = statusConfig.icon;

  const handleInspectionAction = (mode: 'request' | 'schedule') => {
    setInspectionModal({ open: true, mode });
  };

  const handlePaymentAction = () => {
    setShowPaymentModal(true);
  };

  const handleModalSuccess = () => {
    setInspectionModal({ open: false, mode: 'request' });
    setShowPaymentModal(false);
    queryClient.invalidateQueries({ queryKey: ['step-inspections', phaseId] });
    queryClient.invalidateQueries({ queryKey: ['step-payments', phaseId] });
    onUpdate?.();
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                  {(step.order_index || 0) + 1}
                </div>
                <CardTitle className="text-lg">{step.name}</CardTitle>
                <Badge variant="outline" className={cn('text-xs', statusConfig.className)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {step.description || 'Aucune description'}
              </CardDescription>
              {step.progress !== undefined && (
                <div className="flex items-center gap-3 mt-3">
                  <Progress value={step.progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{step.progress}%</span>
                </div>
              )}
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-2">
              {permissions.canRequestInspection && (
                <Button 
                  size="sm" 
                  onClick={() => handleInspectionAction('request')}
                  className="gap-1"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Inspection</span>
                </Button>
              )}
              {permissions.canRequestPayment && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handlePaymentAction}
                  className="gap-1 text-success border-success/30 hover:bg-success/10"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Paiement</span>
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StepDetailTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="inspections" className="gap-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Inspections</span>
            {(inspectionsData?.totalCount || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {inspectionsData?.totalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Paiements</span>
            {(paymentsData?.paymentCount || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {paymentsData?.paymentCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Aperçu */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Métadonnées */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Date début</div>
                <div className="text-lg font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(step.start_date)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Date fin</div>
                <div className="text-lg font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(step.end_date)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Inspections</div>
                <div className="text-lg font-medium flex items-center gap-1">
                  <ClipboardCheck className="h-4 w-4" />
                  {inspectionsData?.approvedCount || 0}/{inspectionsData?.totalCount || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Paiements</div>
                <div className="text-lg font-medium flex items-center gap-1 text-success">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(paymentsData?.totalPaid || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tâches */}
          {step.tasks && step.tasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Tâches ({step.tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {step.tasks.map((taskItem, index) => {
                    const task = taskItem as any;
                    return (
                      <div 
                        key={task?.id || index}
                        className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50"
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          task?.status === 'completed' ? 'bg-success' : 
                          task?.status === 'in_progress' ? 'bg-info' : 'bg-muted'
                        )} />
                        <span className="flex-1 text-sm">{task?.name || 'Unnamed Task'}</span>
                        <Badge variant="outline" className="text-xs">
                          {task?.status || 'pending'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Inspections */}
        <TabsContent value="inspections" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Inspections</CardTitle>
                {permissions.canRequestInspection && (
                  <Button size="sm" variant="outline" onClick={() => handleInspectionAction('request')}>
                    <CalendarPlus className="h-4 w-4 mr-1" />
                    Nouvelle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {inspectionsData?.inspections && inspectionsData.inspections.length > 0 ? (
                <div className="space-y-3">
                  {inspectionsData.inspections.map((inspection) => (
                    <div 
                      key={inspection.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/inspections/${inspection.id}`)}
                    >
                      <div className={cn(
                        'p-2 rounded-full',
                        (inspection.status as string) === 'approved' ? 'bg-success/10 text-success' :
                        (inspection.status as string) === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      )}>
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{typeof inspection.inspector === 'string' ? inspection.inspector : (inspection.inspector as any)?.name || 'Inspector'}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(inspection.date)} • {inspection.progressAtInspection}%
                        </div>
                      </div>
                      <Badge variant={
                        inspection.status === 'approved' ? 'default' :
                        inspection.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {inspection.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune inspection pour cette étape</p>
                  {permissions.canRequestInspection && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => handleInspectionAction('request')}
                    >
                      <CalendarPlus className="h-4 w-4 mr-1" />
                      Programmer une inspection
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Documents */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {step.documents && step.documents.length > 0 ? (
                <div className="space-y-2">
                  {(step.documents as Array<{ id?: string; name?: string; title?: string }>).map((doc, index) => (
                    <div 
                      key={doc.id || index}
                      className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{doc.name || doc.title}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun document pour cette étape</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Paiements */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Paiements</CardTitle>
                {permissions.canRequestPayment && (
                  <Button size="sm" variant="outline" onClick={handlePaymentAction}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Demander
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {paymentsData?.payments && paymentsData.payments.length > 0 ? (
                <div className="space-y-3">
                  {paymentsData.payments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-success/10 text-success">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{payment.contractorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.progressAtPayment}% avancement
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="font-medium">Total payé</span>
                    <span className="font-bold text-lg text-success">
                      {formatCurrency(paymentsData.totalPaid)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun paiement pour cette étape</p>
                  {permissions.canRequestPayment && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={handlePaymentAction}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Demander un paiement
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Inspection */}
      <EnhancedScheduleInspectionModal
        open={inspectionModal.open}
        onOpenChange={(open) => setInspectionModal({ ...inspectionModal, open })}
        projectId={projectId}
        phaseId={phaseId}
        stepId={step.id}
        mode={inspectionModal.mode}
        onSuccess={handleModalSuccess}
      />

      {/* Modal Paiement */}
      <PaymentRequestModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        projectId={projectId}
        phaseId={phaseId}
        stepId={step.id}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default StepDetailPanel;
