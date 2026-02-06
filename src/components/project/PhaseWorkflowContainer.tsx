import React, { useState } from 'react';
import PhaseWorkflowOrchestrator from './PhaseWorkflowOrchestrator';
import { usePhaseWorkflow } from '@/hooks/usePhaseWorkflow';
import { useCreateProjectPayment } from '@/hooks/useProjectPayments';
import { generatePVPDF } from '@/lib/pvGenerator';
import { StorageFactory } from '@/services/storage/StorageFactory';
import { DocumentService } from '@/application/services/DocumentService';
import { DocumentType } from '@/domain/entities/Document';
import type { CreateDocumentRequestDto } from '@/dtos/entities/DocumentDTO';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

interface PhaseWorkflowContainerProps {
  projectId: string;
  phaseId: string;
  rawPhaseData: any;
  rawSteps?: any;
  rawMilestones?: any[];
  onAddStep?: () => void;
  onActionComplete?: () => void;
  metrics?: any;
  workflowMetrics?: any;
  progressMetrics?: any;
  phaseCosts?: any;
  latestApprovedInspection?: any;
  auditEntries?: any[];
}

const PhaseWorkflowContainer: React.FC<PhaseWorkflowContainerProps> = ({
  projectId,
  phaseId,
  rawPhaseData,
  rawSteps,
  rawMilestones,
  onAddStep,
  onActionComplete,
  metrics,
  workflowMetrics,
  progressMetrics,
  phaseCosts,
  latestApprovedInspection,
  auditEntries,
}) => {
  const {
    calculateDecompte,
    getStepWorkflowStatus,
    scheduleInspection,
    updateStepProgress,
    refetch: refetchWorkflow,
  } = usePhaseWorkflow(projectId || '', phaseId || '', rawPhaseData);

  const { mutateAsync: createPayment } = useCreateProjectPayment();
  const { toast } = useToast();
  const { createNotification } = useNotifications();

  const [isProcessingPV, setIsProcessingPV] = useState(false);

  const handleScheduleInspection = async (stepId?: string) => {
    try {
      const created = await scheduleInspection({
        date: new Date().toISOString(),
        inspector: 'system',
        comments: `Automatique depuis tableau de bord (step ${stepId || 'phase'})`,
      });
      if (created && created.id) {
        // orchestrator / other UI can open dialogs using events or callbacks
        toast({ title: 'Inspection programmée', description: 'Inspection créée.' });
      }
    } catch (err) {
      console.error('Erreur scheduleInspection', err);
      toast({ title: 'Erreur', description: 'Impossible de programmer l\'inspection', variant: 'destructive' });
    }
  };

  const handleUpdateProgress = async (stepId?: string) => {
    if (!stepId) return;
    try {
      const nextProgress = 10; // caller can implement more advanced UI
      await updateStepProgress({ stepId, progress: nextProgress });
      toast({ title: 'Progression mise à jour' });
    } catch (err) {
      console.error('Erreur updateStepProgress', err);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la progression', variant: 'destructive' });
    }
  };

  const handleRequestPayment = async (stepId?: string, canRequest: boolean = true) => {
    try {
      const decompte = calculateDecompte(rawPhaseData?.estimated_cost || 0, 5);
      if (decompte.netPayable <= 0) return;
      await createPayment({
        projectId: projectId || '',
        payment: {
          amount: decompte.netPayable,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'manual',
          contractorName: rawPhaseData?.contractor_name || 'Contractor',
          contractorContact: rawPhaseData?.contractor_contact || '',
        },
      });
      toast({ title: 'Paiement créé', description: 'Demande de paiement enregistrée.' });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error('Erreur createPayment', err);
      toast({ title: 'Erreur', description: 'Impossible de créer le paiement', variant: 'destructive' });
    }
  };

  const handleGenerateDecompte = async () => {
    const decompte = calculateDecompte(rawPhaseData?.estimated_cost || 0, 5);
    // Orchestrator can open preview using a callback/event; here we simply notify
    toast({ title: 'Décompte prêt', description: `Net payable: ${decompte.netPayable}`, variant: 'default' });
  };

  const handleGeneratePV = async () => {
    if (!rawPhaseData || !projectId) return;
    setIsProcessingPV(true);
    try {
      const pvResult = await generatePVPDF({
        title: `PV - ${rawPhaseData.phase_name}`,
        phaseName: rawPhaseData.phase_name || 'Phase',
        decompte: { netPayable: 0, payablePercentage: rawPhaseData.progress || 0 },
        autoSave: false,
      });

      if (pvResult && pvResult.blob) {
        const storage = StorageFactory.createProvider();
        const file = new File([pvResult.blob], pvResult.fileName, { type: 'application/pdf' });
        const destPath = `phases/${projectId}/${pvResult.fileName}`;
        const uploadRes = await storage.upload(file, destPath);

        if (uploadRes.success) {
          const publicUrl = uploadRes.url || '';
          try {
             const documentService = new DocumentService();
             const docRecord = await documentService.createDocument({
               title: `PV - ${rawPhaseData.phase_name}`,
               name: `PV - ${rawPhaseData.phase_name}`,
               type: DocumentType.PV,
               projectId: projectId,
               description: `Procès-verbal généré pour la phase ${rawPhaseData.phase_name}`,
               url: publicUrl,
             } as any);

            const { data: projectData } = await supabase
              .from('projects')
              .select('created_by')
              .eq('id', projectId)
              .single();

            if (projectData?.created_by) {
              await createNotification(
                projectData.created_by,
                'PV généré',
                `Un procès-verbal pour la phase ${rawPhaseData.phase_name} a été généré.`,
                'document',
                (docRecord as any)?.id || null,
                { documents: docRecord ? [{ id: String((docRecord as any)?.id || ''), file_url: publicUrl }] : [{ file_url: publicUrl }] }
              );
            }

            toast({ title: 'PV généré', description: 'Le PV a été généré et stocké.' });
            if (onActionComplete) onActionComplete();
          } catch (docErr) {
            console.error('Error creating PV document record', docErr);
            toast({ title: 'Erreur', description: "PV généré mais impossible d'enregistrer le document.", variant: 'destructive' });
          }
        } else {
          toast({ title: 'Erreur upload', description: "Impossible d'uploader le PV.", variant: 'destructive' });
        }
      }
    } catch (err) {
      console.error('handleGeneratePV error', err);
      toast({ title: 'Erreur', description: 'Impossible de générer le PV.', variant: 'destructive' });
    } finally {
      setIsProcessingPV(false);
    }
  };

  const handleReorderSteps = async (newOrder: string[]) => {
    // Expose reorder to orchestrator; persistence should be handled by parent services or via events
    // Here we trigger a refetch after a short delay to reflect backend changes
    setTimeout(() => {
      if (typeof refetchWorkflow === 'function') refetchWorkflow();
      if (onActionComplete) onActionComplete();
    }, 400);
  };

  return (
    <PhaseWorkflowOrchestrator
      rawPhaseData={rawPhaseData}
      rawSteps={rawSteps}
      rawMilestones={rawMilestones}
      projectId={projectId}
      phaseId={phaseId}
      enableNormalization={true}
      showEmptyState={true}
      onRetry={() => { if (typeof refetchWorkflow === 'function') refetchWorkflow(); }}
      onAddStep={onAddStep}
      onScheduleInspection={handleScheduleInspection}
      onUpdateProgress={handleUpdateProgress}
      onRequestPayment={handleRequestPayment}
      onGenerateDecompte={handleGenerateDecompte}
      onGeneratePV={handleGeneratePV}
      onReorderSteps={handleReorderSteps}
      onActionComplete={onActionComplete}
      metrics={metrics}
      workflowMetrics={workflowMetrics}
      progressMetrics={progressMetrics}
      phaseCosts={phaseCosts}
      latestApprovedInspection={latestApprovedInspection}
      auditEntries={auditEntries}
    />
  );
};

export default PhaseWorkflowContainer;
