import React from 'react';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface PhaseDocumentUploadProps {
  projectId: string;
  phaseId: string;
  phaseName?: string;
  onDocumentUploaded?: () => void;
}

const PhaseDocumentUpload = ({ 
  projectId, 
  phaseId, 
  phaseName, 
  onDocumentUploaded 
}: PhaseDocumentUploadProps) => {
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      context="phase"
      contextLabel={phaseName ? `Phase: ${phaseName}` : 'Documents de phase'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default PhaseDocumentUpload;