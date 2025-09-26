import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  Users, 
  DollarSign, 
  Package, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

// Import existing CRUD components
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentsList from '@/components/documents/DocumentsList';
import DocumentViewer from '@/components/documents/DocumentViewer';
import TaskAssignments from '@/components/documents/TaskAssignments';
import EmployeeManagement from '@/components/documents/EmployeeManagement';
import PaymentCrud from '@/components/payments/PaymentCrud';
import InspectionCrud from '@/components/inspections/InspectionCrud';
import type { Database } from '@/integrations/supabase/types';

// Use database types for better type safety
type Phase = Database['public']['Tables']['project_phases']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

interface EnhancedWorkflowPhaseManagerProps {
  projectId: string;
  readonly?: boolean;
}

const EnhancedWorkflowPhaseManager: React.FC<EnhancedWorkflowPhaseManagerProps> = ({
  projectId,
  readonly = false
}) => {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load project phases with proper error handling
  const { data: phases, isLoading: phasesLoading } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<Phase[]> => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('Error loading project phases:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!projectId,
  });

  // Load phase documents using existing document system
  const { data: phaseDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ['phase-documents', selectedPhase?.id],
    queryFn: async (): Promise<Document[]> => {
      if (!selectedPhase?.id) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('phase_id', selectedPhase.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading phase documents:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!selectedPhase?.id,
  });

  // Load phase statistics
  const { data: phaseStats } = useQuery({
    queryKey: ['phase-stats', selectedPhase?.id],
    queryFn: async () => {
      if (!selectedPhase?.id) return null;
      
      const [documentsCount, tasksCount, paymentsCount, inspectionsCount] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact' }).eq('phase_id', selectedPhase.id),
        supabase.from('task_assignments').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('payments').select('id', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('inspections').select('id', { count: 'exact' }).eq('project_id', projectId)
      ]);

      return {
        documents: documentsCount.count || 0,
        tasks: tasksCount.count || 0,
        payments: paymentsCount.count || 0,
        inspections: inspectionsCount.count || 0
      };
    },
    enabled: !!selectedPhase?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  if (phasesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phases Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Phases du Projet ({phases?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phases && phases.length > 0 ? (
            <div className="grid gap-4">
              {phases.map((phase) => (
                <div
                  key={phase.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedPhase?.id === phase.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPhase(phase)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{phase.phase_name}</h3>
                      {phase.description && (
                        <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(phase.status)}
                      <Badge className={getStatusColor(phase.status)}>
                        {phase.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Date début</p>
                      <p className="text-sm font-medium">
                        {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : 'Non définie'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date fin</p>
                      <p className="text-sm font-medium">
                        {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'Non définie'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Budget estimé</p>
                      <p className="text-sm font-medium">
                        {phase.estimated_cost ? `${phase.estimated_cost.toLocaleString()} €` : 'Non défini'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Coût réel</p>
                      <p className="text-sm font-medium">
                        {phase.actual_cost ? `${phase.actual_cost.toLocaleString()} €` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>{phase.progress}%</span>
                    </div>
                    <Progress value={phase.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucune phase définie pour ce projet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Phase Details with CRUD Components */}
      {selectedPhase && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Détails de la Phase: {selectedPhase.phase_name}</span>
              <div className="flex gap-2">
                {phaseStats && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{phaseStats.documents} docs</span>
                    <span>{phaseStats.tasks} tâches</span>
                    <span>{phaseStats.payments} paiements</span>
                    <span>{phaseStats.inspections} inspections</span>
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="documents" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Tâches
                </TabsTrigger>
                <TabsTrigger value="employees" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Équipe
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Paiements
                </TabsTrigger>
                <TabsTrigger value="inspections" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Inspections
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Matériaux
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Documents de la Phase</h3>
                  {!readonly && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          Télécharger un document
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Télécharger un document pour {selectedPhase.phase_name}</DialogTitle>
                        </DialogHeader>
                        <DocumentUpload />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <DocumentsList onDocumentSelect={handleDocumentSelect} />
                  </div>
                  <div>
                    {selectedDocument ? (
                      <DocumentViewer document={selectedDocument as any} />
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                          Sélectionnez un document pour le prévisualiser
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <TaskAssignments />
              </TabsContent>

              <TabsContent value="employees">
                <EmployeeManagement />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentCrud />
              </TabsContent>

              <TabsContent value="inspections">
                <InspectionCrud />
              </TabsContent>

              <TabsContent value="materials">
                <div className="text-center text-muted-foreground py-8">
                  Gestion des matériaux - À développer
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedWorkflowPhaseManager;