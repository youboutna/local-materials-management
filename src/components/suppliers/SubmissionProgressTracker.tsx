import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export type SubmissionStep = 'idle' | 'creating' | 'uploading' | 'generating' | 'completed' | 'error';

interface SubmissionProgressTrackerProps {
  currentStep: SubmissionStep;
  totalDocuments?: number;
  uploadedDocuments?: number;
  error?: string;
}

export function SubmissionProgressTracker({
  currentStep,
  totalDocuments = 0,
  uploadedDocuments = 0,
  error
}: SubmissionProgressTrackerProps) {
  const steps = [
    { id: 'creating', label: 'Création de la soumission', step: 1 },
    { id: 'uploading', label: 'Téléchargement des documents', step: 2 },
    { id: 'generating', label: 'Génération du code secret', step: 3 }
  ];

  const getCurrentStepIndex = () => {
    if (currentStep === 'idle') return -1;
    if (currentStep === 'creating') return 0;
    if (currentStep === 'uploading') return 1;
    if (currentStep === 'generating') return 2;
    if (currentStep === 'completed') return 3;
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();
  const progressPercentage = currentStep === 'completed' 
    ? 100 
    : currentStep === 'error' 
    ? 0 
    : ((currentStepIndex + 1) / steps.length) * 100;

  const getStepStatus = (stepIndex: number) => {
    if (currentStep === 'error') return 'error';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    
    if (status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (status === 'active') {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
    if (status === 'error') {
      return <Circle className="h-5 w-5 text-destructive" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getStepTextColor = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    if (status === 'completed') return 'text-green-600';
    if (status === 'active') return 'text-primary font-medium';
    if (status === 'error') return 'text-destructive';
    return 'text-muted-foreground';
  };

  if (currentStep === 'idle') return null;

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {currentStep === 'completed' 
              ? 'Soumission complétée' 
              : currentStep === 'error'
              ? 'Erreur lors de la soumission'
              : 'Soumission en cours...'}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(index)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${getStepTextColor(index)}`}>
                {step.label}
              </p>
              {step.id === 'uploading' && currentStepIndex === 1 && totalDocuments > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadedDocuments} / {totalDocuments} document{totalDocuments > 1 ? 's' : ''} téléchargé{uploadedDocuments > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
