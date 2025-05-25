import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Eye,
  FileText,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ProjectWithPayments, InspectionStatus } from '@/types/project';
import { InspectionDialog } from '@/components/project/InspectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowInspectionProps {
  project: ProjectWithPayments;
  onInspectionUpdate?: () => void;
}

export function WorkflowInspection({ project, onInspectionUpdate }: WorkflowInspectionProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Sort inspections by date
  const sortedInspections = project.inspections 
    ? [...project.inspections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleInspectionCreated = async () => {
    try {
      // Get the latest inspection after creation
      const { data: latestInspections } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', project.id)
        .order('date', { ascending: false })
        .limit(1);

      if (latestInspections && latestInspections.length > 0) {
        const latestInspection = latestInspections[0];
        
        console.log('Latest inspection:', latestInspection);
        
        // Get the last inspection by date with status 'approved' or 'requires_changes' for progress reference
        const { data: relevantInspections } = await supabase
          .from('inspections')
          .select('*')
          .eq('project_id', project.id)
          .in('status', ['approved', 'requires_changes'])
          .order('date', { ascending: false })
          .limit(1);

        // Use progress from the most recent approved or requires_changes inspection
        // If no such inspection exists, keep current project progress
        const newProgress = relevantInspections && relevantInspections.length > 0 
          ? relevantInspections[0].progress_at_inspection
          : project.progress;
        
        let newStatus = project.status;

        console.log('Using progress from last approved/requires_changes inspection:', relevantInspections?.[0]?.status, 'with progress:', newProgress);

        // Determine new status based on latest inspection status
        if (latestInspection.status === 'approved') {
          // If progress reaches 100%, mark project as completed
          if (newProgress >= 100) {
            newStatus = 'terminé';
          } else {
            newStatus = 'en cours';
          }
        } else if (latestInspection.status === 'requires_changes') {
          // For inspections requiring changes, set status to inspection
          newStatus = 'en inspection';
        } else if (latestInspection.status === 'rejected') {
          // For rejected inspections, set status to suspended
          newStatus = 'suspendu';
        } else if (latestInspection.status === 'pending') {
          // For pending inspections, set status to inspection
          newStatus = 'en inspection';
        }

        console.log('Updating project with:', { 
          newProgress, 
          newStatus, 
          currentProgress: project.progress,
          latestInspectionStatus: latestInspection.status,
          relevantInspectionFound: relevantInspections?.length > 0
        });

        // Update project with new progress and status
        const { error: updateError } = await supabase
          .from('projects')
          .update({ 
            progress: newProgress,
            status: newStatus
          })
          .eq('id', project.id);

        if (updateError) {
          throw updateError;
        }

        const statusMessages = {
          'approved': 'approuvée',
          'rejected': 'rejetée',
          'requires_changes': 'nécessitant des modifications',
          'pending': 'en attente'
        };

        const progressSource = relevantInspections && relevantInspections.length > 0 
          ? `basée sur la dernière inspection ${relevantInspections[0].status === 'approved' ? 'approuvée' : 'nécessitant des modifications'}`
          : 'maintenue (aucune inspection approuvée/modifiée trouvée)';

        toast({
          title: "Projet mis à jour",
          description: `Progression mise à jour à ${newProgress}% ${progressSource}. Statut: ${newStatus}`,
        });
      }

      if (onInspectionUpdate) {
        onInspectionUpdate();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la progression du projet.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'requires_changes':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'requires_changes': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: InspectionStatus) => {
    switch (status) {
      case 'approved': return 'Approuvée';
      case 'pending': return 'En attente';
      case 'requires_changes': return 'Modifications requises';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  // Calculate workflow progress based on approved inspections
  const approvedInspections = sortedInspections.filter(i => i.status === 'approved').length;
  const totalInspections = sortedInspections.length;
  const workflowProgress = totalInspections > 0 ? (approvedInspections / totalInspections) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-adrar-600" />
            Workflow d'inspection
          </CardTitle>
          <InspectionDialog 
            project={project} 
            onInspectionCreated={handleInspectionCreated}
          />
        </div>
        
        {/* Progress Overview */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression du workflow</span>
            <span>{Math.round(workflowProgress)}% approuvé</span>
          </div>
          <Progress value={workflowProgress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {approvedInspections} sur {totalInspections} inspections approuvées
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedInspections.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune inspection
            </h3>
            <p className="text-gray-500 mb-4">
              Commencez le workflow en créant votre première inspection.
            </p>
            <InspectionDialog 
              project={project} 
              onInspectionCreated={handleInspectionCreated}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative">
              {sortedInspections.map((inspection, index) => (
                <div key={inspection.id} className="relative">
                  {/* Timeline line */}
                  {index < sortedInspections.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                  )}
                  
                  {/* Inspection Step */}
                  <div 
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedStep === index 
                        ? 'bg-adrar-50 border-adrar-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStep(selectedStep === index ? null : index)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(inspection.status as InspectionStatus)}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">
                            Inspection #{totalInspections - index}
                          </h4>
                          <Badge className={getStatusColor(inspection.status as InspectionStatus)}>
                            {getStatusText(inspection.status as InspectionStatus)}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(inspection.date), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {inspection.inspector}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{inspection.progress_at_inspection}% de progression</span>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {selectedStep === index && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium mb-2">Détails de l'inspection</h5>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Date:</span>
                                  <span className="ml-2">{format(new Date(inspection.date), 'dd MMMM yyyy')}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Inspecteur:</span>
                                  <span className="ml-2">{inspection.inspector}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Progression:</span>
                                  <span className="ml-2">{inspection.progress_at_inspection}%</span>
                                </div>
                              </div>
                            </div>
                            
                            {inspection.comments && (
                              <div>
                                <h5 className="font-medium mb-2">Commentaires</h5>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {inspection.comments}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {inspection.status === 'requires_changes' && (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center gap-2 text-orange-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium">Actions requises</span>
                              </div>
                              <p className="text-sm text-orange-700 mt-1">
                                Des modifications sont nécessaires avant de pouvoir procéder à la prochaine étape.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {index < sortedInspections.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Separator />
            
            {/* Workflow Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">Résumé du workflow</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sortedInspections.filter(i => i.status === 'approved').length}
                  </div>
                  <div className="text-muted-foreground">Approuvées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {sortedInspections.filter(i => i.status === 'pending').length}
                  </div>
                  <div className="text-muted-foreground">En attente</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {sortedInspections.filter(i => i.status === 'requires_changes').length}
                  </div>
                  <div className="text-muted-foreground">À modifier</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {sortedInspections.filter(i => i.status === 'rejected').length}
                  </div>
                  <div className="text-muted-foreground">Rejetées</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
