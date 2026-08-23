import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface StepDocumentUploadProps {
  projectId: string;
  phaseId: string;
  stepId: string;
  stepTitle?: string;
  onDocumentUploaded?: () => void;
}

const StepDocumentUpload = ({ 
  projectId, 
  phaseId, 
  stepId, 
  stepTitle, 
  onDocumentUploaded 
}: StepDocumentUploadProps) => {
  const { t } = useLanguage();
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      stepId={stepId}
      context="step"
      contextLabel={stepTitle ? `Étape: ${stepTitle}` : t('auto.stepdocumentupload.documents_d')étape'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default StepDocumentUpload;