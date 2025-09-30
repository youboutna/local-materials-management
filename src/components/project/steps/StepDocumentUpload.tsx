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
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      stepId={stepId}
      context="step"
      contextLabel={stepTitle ? `Étape: ${stepTitle}` : 'Documents d\'étape'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default StepDocumentUpload;