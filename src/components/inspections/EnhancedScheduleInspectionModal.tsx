/**
 * EnhancedScheduleInspectionModal - Modal amélioré avec workflow multi-étapes
 * Supporte deux modes: 'request' (demande) et 'schedule' (programmation)
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, CheckCircle2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import {
  InspectionTypeStep,
  InspectionDetailsStep,
  InspectionDocumentsStep,
  InspectionReviewStep,
  InspectionDetails,
} from './workflow';
import { InspectionDocumentType, InspectionWorkflowService } from '@/application/services/InspectionWorkflowService';

type WorkflowStep = 'type' | 'details' | 'documents' | 'review';

interface EnhancedScheduleInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phaseId?: string;
  stepId?: string;
  projectName?: string;
  phaseName?: string;
  stepName?: string;
  mode?: 'request' | 'schedule';
  onSuccess?: () => void;
}

const WORKFLOW_STEPS: { key: WorkflowStep; label: string; icon: React.ReactNode }[] = [
  { key: 'type', label: 'Type', icon: <FileText className="h-4 w-4" /> },
  { key: 'details', label: 'Détails', icon: <Calendar className="h-4 w-4" /> },
  { key: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  { key: 'review', label: 'Révision', icon: <CheckCircle2 className="h-4 w-4" /> },
];

const EnhancedScheduleInspectionModal: React.FC<EnhancedScheduleInspectionModalProps> = ({
  open,
  onOpenChange,
  projectId,
  phaseId,
  stepId,
  projectName,
  phaseName,
  stepName,
  mode = 'schedule',
  onSuccess,
}) => {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('type');
  const [inspectionType, setInspectionType] = useState<string>('');
  const [details, setDetails] = useState<InspectionDetails | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<InspectionDocumentType[]>([]);
  const [notifyContractor, setNotifyContractor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current step index
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep);
  const progressPercent = ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentStep('type');
      setInspectionType('');
      setDetails(null);
      setSelectedDocuments([]);
      setNotifyContractor(true);
    }
    onOpenChange(newOpen);
  };

  // Navigate between steps
  const goToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
  };

  const goBack = () => {
    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(WORKFLOW_STEPS[stepIndex - 1].key);
    }
  };

  // Handle type selection
  const handleTypeSelect = (type: string) => {
    setInspectionType(type);
    // Pre-select required documents
    const requiredDocs = InspectionWorkflowService.getRequiredDocuments(type);
    setSelectedDocuments(requiredDocs.filter(d => d.required).map(d => d.type));
    setCurrentStep('details');
  };

  // Handle details completion
  const handleDetailsComplete = (newDetails: InspectionDetails) => {
    setDetails(newDetails);
    setCurrentStep('documents');
  };

  // Handle documents completion
  const handleDocumentsComplete = () => {
    setCurrentStep('review');
  };

  // Submit inspection
  const handleSubmit = async () => {
    if (!details || !inspectionType) {
      toast.error('Données manquantes');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'request') {
        // Create inspection request
        const result = await InspectionWorkflowService.createInspectionRequest({
          project_id: projectId,
          phase_id: phaseId,
          step_id: stepId,
          inspection_type: inspectionType,
          requested_by: 'current_user', // TODO: Get from auth
          requested_date: details.scheduled_date,
          proposed_dates: details.proposed_dates,
          priority: details.priority,
          requirements: details.requirements,
          required_documents: selectedDocuments,
        });

        if (result.success) {
          toast.success('Demande d\'inspection soumise avec succès');
          handleOpenChange(false);
          onSuccess?.();
        } else {
          throw new Error(result.error);
        }
      } else {
        // Schedule inspection
        const result = await InspectionWorkflowService.scheduleInspection({
          project_id: projectId,
          phase_id: phaseId,
          step_id: stepId,
          inspection_type: inspectionType,
          requested_by: 'current_user',
          requested_date: details.scheduled_date,
          scheduled_by: 'current_user',
          scheduled_date: `${details.scheduled_date}T${details.scheduled_time}:00.000Z`,
          inspector_id: details.inspector_id || '',
          inspector_name: details.inspector_name || 'Inspecteur',
          backup_inspector_id: details.backup_inspector_id,
          estimated_duration_hours: details.estimated_duration_hours,
          priority: details.priority,
          requirements: details.requirements,
          required_documents: selectedDocuments,
        });

        if (result.success) {
          toast.success('Inspection programmée avec succès');
          handleOpenChange(false);
          onSuccess?.();
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast.error((error as Error).message || 'Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="flex items-center gap-2">
                {mode === 'request' ? 'Demander une Inspection' : 'Programmer une Inspection'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {projectName && <span className="font-medium">{projectName}</span>}
                {phaseName && <span className="text-muted-foreground"> • {phaseName}</span>}
                {stepName && <span className="text-muted-foreground"> • {stepName}</span>}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="pt-4 pb-2">
          <Progress value={progressPercent} className="h-1" />
          <div className="flex justify-between mt-3">
            {WORKFLOW_STEPS.map((step, index) => {
              const isActive = step.key === currentStep;
              const isPast = index < currentStepIndex;
              const isFuture = index > currentStepIndex;
              
              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex flex-col items-center gap-1 transition-colors',
                    isActive && 'text-primary',
                    isPast && 'text-primary/70',
                    isFuture && 'text-muted-foreground'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                    isActive && 'bg-primary text-primary-foreground border-primary',
                    isPast && 'bg-primary/20 border-primary/50',
                    isFuture && 'bg-muted border-muted-foreground/30'
                  )}>
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {currentStep === 'type' && (
            <InspectionTypeStep
              mode={mode}
              selectedType={inspectionType}
              onSelect={handleTypeSelect}
            />
          )}

          {currentStep === 'details' && (
            <InspectionDetailsStep
              projectId={projectId}
              phaseId={phaseId}
              stepId={stepId}
              inspectionType={inspectionType}
              mode={mode}
              initialData={details || undefined}
              onComplete={handleDetailsComplete}
            />
          )}

          {currentStep === 'documents' && (
            <InspectionDocumentsStep
              inspectionType={inspectionType}
              selectedDocuments={selectedDocuments}
              onUpdate={setSelectedDocuments}
              onComplete={handleDocumentsComplete}
              mode={mode}
            />
          )}

          {currentStep === 'review' && details && (
            <InspectionReviewStep
              mode={mode}
              inspectionType={inspectionType}
              details={details}
              documents={selectedDocuments}
              notifyContractor={notifyContractor}
              onNotifyContractorChange={setNotifyContractor}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              projectName={projectName}
              phaseName={phaseName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedScheduleInspectionModal;
