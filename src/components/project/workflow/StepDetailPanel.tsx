/**
 * StepDetailPanel - Panneau détaillé pour une étape
 * Utilise les composants existants: PhaseInspections, PhaseTasks, PhaseEmployees, PhaseMaterials, PhasePayments
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  X,
  Edit,
  ClipboardCheck,
  Users,
  Package,
  FileText,
  DollarSign,
  Play,
  Save,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseStepDTO } from '@/types/phase-dto';

// Import existing components
import PhaseInspections from '@/components/project/PhaseInspections';
import PhaseTasks from '@/components/project/PhaseTasks';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import PhasePayments from '@/components/project/PhasePayments';

interface StepDetailPanelProps {
  step: PhaseStepDTO;
  phaseId: string;
  projectId: string;
  onClose: () => void;
  onUpdateProgress: (stepId: string, progress: number) => void;
  onScheduleInspection: (stepId: string) => void;
  onGeneratePV?: (stepId: string) => void;
  onRequestPayment?: (stepId: string) => void;
  formatCurrency: (n: number) => string;
}

const StepDetailPanel: React.FC<StepDetailPanelProps> = ({
  step,
  phaseId,
  projectId,
  onClose,
  onUpdateProgress,
  onScheduleInspection,
  onGeneratePV,
  onRequestPayment,
  formatCurrency,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editProgress, setEditProgress] = useState(step.progress || 0);
  const [isEditingProgress, setIsEditingProgress] = useState(false);

  const handleSaveProgress = () => {
    onUpdateProgress(step.id, editProgress);
    setIsEditingProgress(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'approved': return 'bg-green-100 text-green-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4">
      {/* Header */}
      <Card>
        <CardHeader className="py-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{step.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Étape #{step.order_index + 1}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(step.status)}>{step.status}</Badge>
              <Button size="icon" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Progress Section */}
          <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression</span>
              {isEditingProgress ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editProgress}
                    onChange={(e) => setEditProgress(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-20 h-8"
                  />
                  <span className="text-sm">%</span>
                  <Button size="sm" onClick={handleSaveProgress}>
                    <Save className="h-3 w-3 mr-1" /> Valider
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingProgress(false)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{step.progress || 0}%</span>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingProgress(true)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <Progress value={step.progress || 0} className="h-2" />
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-muted/20 border">
              <p className="text-muted-foreground text-xs">Dates</p>
              <p className="font-medium">
                {step.start_date ? new Date(step.start_date).toLocaleDateString('fr-FR') : '—'} →{' '}
                {step.end_date ? new Date(step.end_date).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border">
              <p className="text-muted-foreground text-xs">Budget</p>
              <p className="font-medium">{formatCurrency((step as any).estimated_cost || (step as any).budget || 0)}</p>
            </div>
          </div>

          {step.description && (
            <div className="p-3 rounded-lg bg-muted/10 border">
              <p className="text-muted-foreground text-xs mb-1">Description</p>
              <p className="text-sm">{step.description}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onScheduleInspection(step.id)}>
              <ClipboardCheck className="h-3 w-3 mr-1" /> Programmer Inspection
            </Button>
            {onGeneratePV && (
              <Button size="sm" variant="outline" onClick={() => onGeneratePV(step.id)}>
                <FileText className="h-3 w-3 mr-1" /> Générer PV
              </Button>
            )}
            {onRequestPayment && (
              <Button size="sm" variant="outline" onClick={() => onRequestPayment(step.id)}>
                <DollarSign className="h-3 w-3 mr-1" /> Demander Paiement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections - using existing components */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="text-xs flex items-center gap-1">
            <ListTodo className="h-3 w-3" />
            Tâches
          </TabsTrigger>
          <TabsTrigger value="inspections" className="text-xs flex items-center gap-1">
            <ClipboardCheck className="h-3 w-3" />
            Inspections
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs flex items-center gap-1">
            <Users className="h-3 w-3" />
            RH
          </TabsTrigger>
          <TabsTrigger value="materials" className="text-xs flex items-center gap-1">
            <Package className="h-3 w-3" />
            Matériaux
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Paiements
          </TabsTrigger>
        </TabsList>

        {/* Tasks - Using existing PhaseTasks component */}
        <TabsContent value="overview" className="mt-4">
          <PhaseTasks phaseId={phaseId} projectId={projectId} />
        </TabsContent>

        {/* Inspections - Using existing PhaseInspections component */}
        <TabsContent value="inspections" className="mt-4">
          <PhaseInspections phaseId={phaseId} projectId={projectId} />
        </TabsContent>

        {/* Resources (Employees) - Using existing PhaseEmployees component */}
        <TabsContent value="resources" className="mt-4">
          <PhaseEmployees phaseId={phaseId} />
        </TabsContent>

        {/* Materials - Using existing PhaseMaterials component */}
        <TabsContent value="materials" className="mt-4">
          <PhaseMaterials phaseId={phaseId} projectId={projectId} />
        </TabsContent>

        {/* Payments - Using existing PhasePayments component */}
        <TabsContent value="payments" className="mt-4">
          <PhasePayments phaseId={phaseId} projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Documents / PV Section */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Procès-Verbaux & Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {onGeneratePV && (
              <Button size="sm" variant="outline" onClick={() => onGeneratePV(step.id)} className="justify-start">
                <FileText className="h-3 w-3 mr-2" /> PV Service Fait
              </Button>
            )}
            <Button size="sm" variant="outline" className="justify-start">
              <FileText className="h-3 w-3 mr-2" /> PV Main Levée
            </Button>
            <Button size="sm" variant="outline" className="justify-start">
              <FileText className="h-3 w-3 mr-2" /> Attachement
            </Button>
            <Button size="sm" variant="outline" className="justify-start">
              <FileText className="h-3 w-3 mr-2" /> Décompte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepDetailPanel;
