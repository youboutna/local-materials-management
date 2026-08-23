import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  const steps = [
    { id: 'creating', label: t('auto.submissionprogresstracker.creation_de_la_soumission'), step: 1 },
    { id: 'uploading', label: t('auto.submissionprogresstracker.telechargement_des_documents'), step: 2 },
    { id: 'generating', label: t('auto.submissionprogresstracker.generation_du_code_secret'), step: 3 }
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
      return <CheckCircle2 className="h-5 w-5 text-success" />;
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
    if (status === 'completed') return 'text-success';
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
              ? t('auto.submissionprogresstracker.soumission_completee') 
              : currentStep === 'error'
              ? t('auto.submissionprogresstracker.erreur_lors_de_la_soumission')
              : t('auto.submissionprogresstracker.soumission_en_cours')}
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
