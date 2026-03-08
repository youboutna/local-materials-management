/**
 * PhaseMonitoringDashboard - Dashboard unifié pour le suivi de phase
 * Affiche Tâches, Inspections et Paiements avec liaison aux jalons (checkpoints)
 * Utilise les hooks hexagonaux pour les données
 */

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquare, 
  ClipboardCheck, 
  DollarSign, 
  Target,
  Plus,
  TrendingUp,
  AlertTriangle,
  Eye,
  Play,
  CheckCircle,
  Clock
} from 'lucide-react';
import { getMilestoneService, MilestoneService } from '@/application/services/MilestoneService';
import { MilestoneSummaryDTO } from '@/types/milestone-dto';
import { MilestoneCheckpointActions, MilestoneActionContext } from '@/components/project/milestones';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { InspectionFormWithContext } from '@/components/project/inspection';
import { PaymentFormWithContext } from '@/components/project/payment';
import { usePhaseMonitoringSummaryHex } from '@/hooks/hexagonal';

// Import existing components
import PhaseTasks from '@/components/project/PhaseTasks';
import PhaseInspections from '@/components/project/PhaseInspections';
import PhasePayments from '@/components/project/PhasePayments';

interface PhaseMonitoringDashboardProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

const PhaseMonitoringDashboard: React.FC<PhaseMonitoringDashboardProps> = ({
  phaseId,
  projectId,
  phaseName
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedMilestoneContext, setSelectedMilestoneContext] = useState<MilestoneActionContext | undefined>(undefined);
  const queryClient = useQueryClient();

  // Fetch phase milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['phase-milestones-monitoring', projectId, phaseId],
    queryFn: async () => {
      const service = getMilestoneService();
      const raw = await service.getProjectMilestones(projectId);
      return raw.filter((m: any) => m.phase_id === phaseId).map((m: any) => ({
        id: m.id, title: m.title, target_date: m.target_date, status: m.status,
        type: m.type || 'checkpoint', priority: m.priority || 'medium',
        weight: m.weight || 0.2, phase_id: m.phase_id, phase_name: m.phase_name,
        completed_date: m.actual_completion_date, is_critical: m.priority === 'critical',
        is_from_template: false,
      })) as MilestoneSummaryDTO[];
    },
    enabled: !!projectId && !!phaseId,
  });

  // Use hexagonal hooks for summaries
  const { tasksSummary, inspectionsSummary, paymentsSummary } = usePhaseMonitoringSummaryHex(phaseId);

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'text-success';
    if (value >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tableau de bord du suivi
            {phaseName && <span className="text-muted-foreground font-normal">- {phaseName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tasks Summary */}
            <div 
              className={cn(
                "p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                activeTab === 'tasks' && "ring-2 ring-primary"
              )}
              onClick={() => setActiveTab('tasks')}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Tâches</span>
              </div>
              <p className="text-2xl font-bold">{tasksSummary?.total || 0}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  {tasksSummary?.completed || 0} ✓
                </Badge>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  {tasksSummary?.inProgress || 0} →
                </Badge>
              </div>
            </div>

            {/* Inspections Summary */}
            <div 
              className={cn(
                "p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                activeTab === 'inspections' && "ring-2 ring-primary"
              )}
              onClick={() => setActiveTab('inspections')}
            >
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Inspections</span>
              </div>
              <p className="text-2xl font-bold">{inspectionsSummary?.total || 0}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  {inspectionsSummary?.approved || 0} ✓
                </Badge>
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  {inspectionsSummary?.pending || 0} ⏳
                </Badge>
              </div>
            </div>

            {/* Payments Summary */}
            <div 
              className={cn(
                "p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                activeTab === 'payments' && "ring-2 ring-primary"
              )}
              onClick={() => setActiveTab('payments')}
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Paiements</span>
              </div>
              <p className="text-2xl font-bold">{paymentsSummary?.total || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(paymentsSummary?.totalAmount || 0).toLocaleString()} MRU
              </p>
            </div>

            {/* Milestones Link */}
            <div 
              className={cn(
                "p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                activeTab === 'milestones' && "ring-2 ring-primary"
              )}
              onClick={() => setActiveTab('milestones')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Jalons</span>
              </div>
              <p className="text-2xl font-bold">{milestones.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {milestones.filter(m => m.status === 'completed').length} terminés
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {inspectionsSummary && inspectionsSummary.avgProgress > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Progression moyenne (inspections)</span>
                <span className={cn("font-medium", getProgressColor(inspectionsSummary.avgProgress))}>
                  {inspectionsSummary.avgProgress}%
                </span>
              </div>
              <Progress value={inspectionsSummary.avgProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Checkpoint Actions */}
      <MilestoneCheckpointActions
        milestones={milestones}
        projectId={projectId}
        phaseId={phaseId}
        onAddInspection={(context) => {
          setSelectedMilestoneContext(context);
          setInspectionDialogOpen(true);
        }}
        onAddPayment={(context) => {
          setSelectedMilestoneContext(context);
          setPaymentDialogOpen(true);
        }}
        onMilestoneComplete={async (milestoneId) => {
          try {
            await MilestoneService.updateMilestone(milestoneId, { status: 'completed' });
            queryClient.invalidateQueries({ queryKey: ['phase-milestones-monitoring'] });
            toast({
              title: "Jalon terminé",
              description: "Le jalon a été marqué comme terminé",
            });
          } catch (error) {
            toast({
              title: "Erreur",
              description: "Impossible de marquer le jalon comme terminé",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview" className="gap-1">
            <Eye className="h-4 w-4" />
            Vue
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1">
            <CheckSquare className="h-4 w-4" />
            Tâches
          </TabsTrigger>
          <TabsTrigger value="inspections" className="gap-1">
            <ClipboardCheck className="h-4 w-4" />
            Inspec.
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1">
            <DollarSign className="h-4 w-4" />
            Paiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Quick view of all services with milestone context */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Tasks */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tâches récentes
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('tasks')}>
                    Voir tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasksSummary && tasksSummary.total > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Terminées</span>
                      <span className="font-medium text-success">{tasksSummary.completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">En cours</span>
                      <span className="font-medium text-blue-600">{tasksSummary.inProgress}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">En attente</span>
                      <span className="font-medium text-muted-foreground">{tasksSummary.pending}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Aucune tâche
                    <Button size="sm" variant="link" onClick={() => setActiveTab('tasks')}>
                      <Plus className="h-3 w-3 mr-1" /> Ajouter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Inspections */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Inspections récentes
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('inspections')}>
                    Voir tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inspectionsSummary && inspectionsSummary.total > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Approuvées</span>
                      <span className="font-medium text-success">{inspectionsSummary.approved}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">En attente</span>
                      <span className="font-medium text-warning">{inspectionsSummary.pending}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rejetées</span>
                      <span className="font-medium text-destructive">{inspectionsSummary.rejected}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Aucune inspection
                    <Button size="sm" variant="link" onClick={() => setActiveTab('inspections')}>
                      <Plus className="h-3 w-3 mr-1" /> Ajouter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Milestone-Service Matrix */}
          {milestones.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Services par jalon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.slice(0, 5).map(milestone => (
                    <div 
                      key={milestone.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          milestone.status === 'completed' ? 'bg-success' :
                          milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-muted-foreground'
                        )} />
                        <div>
                          <p className="font-medium text-sm">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground">{milestone.target_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <CheckSquare className="h-3 w-3 mr-1" /> 0
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <ClipboardCheck className="h-3 w-3 mr-1" /> 0
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" /> 0
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <PhaseTasks phaseId={phaseId} projectId={projectId} />
        </TabsContent>

        <TabsContent value="inspections" className="mt-4">
          <PhaseInspections phaseId={phaseId} projectId={projectId} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PhasePayments phaseId={phaseId} projectId={projectId} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Jalons et services associés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map(milestone => (
                    <div 
                      key={milestone.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            milestone.status === 'completed' ? 'bg-success/10' :
                            milestone.priority === 'critical' ? 'bg-destructive/10' : 'bg-primary/10'
                          )}>
                            <Target className={cn(
                              "h-4 w-4",
                              milestone.status === 'completed' ? 'text-success' :
                              milestone.priority === 'critical' ? 'text-destructive' : 'text-primary'
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">{milestone.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {milestone.target_date}
                              {milestone.priority === 'critical' && (
                                <Badge variant="destructive" className="text-xs h-4">Critique</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                          {milestone.status === 'completed' ? 'Terminé' : 
                           milestone.status === 'in_progress' ? 'En cours' : 'À venir'}
                        </Badge>
                      </div>

                      {/* Services linked to this milestone */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <CheckSquare className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                          <p className="text-xs text-muted-foreground">Tâches</p>
                          <p className="font-medium">0</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <ClipboardCheck className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                          <p className="text-xs text-muted-foreground">Inspections</p>
                          <p className="font-medium">0</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-600" />
                          <p className="text-xs text-muted-foreground">Paiements</p>
                          <p className="font-medium">0</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-2">Aucun jalon défini pour cette phase</p>
                  <p className="text-xs text-muted-foreground">
                    Créez des jalons depuis l'onglet Jalons pour lier vos services
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Inspection Dialog with Context */}
      <InspectionFormWithContext
        projectId={projectId}
        milestoneContext={selectedMilestoneContext}
        isOpen={inspectionDialogOpen}
        onClose={() => {
          setInspectionDialogOpen(false);
          setSelectedMilestoneContext(undefined);
        }}
        onInspectionCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['phase-inspections'] });
          queryClient.invalidateQueries({ queryKey: ['phase-milestones-monitoring'] });
        }}
      />

      {/* Payment Dialog with Context */}
      <PaymentFormWithContext
        projectId={projectId}
        milestoneContext={selectedMilestoneContext}
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedMilestoneContext(undefined);
        }}
        onPaymentCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['phase-payments'] });
          queryClient.invalidateQueries({ queryKey: ['phase-milestones-monitoring'] });
        }}
      />
    </div>
  );
};

export default PhaseMonitoringDashboard;
