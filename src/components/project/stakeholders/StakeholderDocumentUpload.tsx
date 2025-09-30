import React from 'react';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface StakeholderDocumentUploadProps {
  projectId: string;
  stakeholderId: string;
  stakeholderName?: string;
  onDocumentUploaded?: () => void;
}

const StakeholderDocumentUpload = ({ 
  projectId, 
  stakeholderId, 
  stakeholderName, 
  onDocumentUploaded 
}: StakeholderDocumentUploadProps) => {
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      stakeholderId={stakeholderId}
      context="stakeholder"
      contextLabel={stakeholderName ? `Partie prenante: ${stakeholderName}` : 'Documents partie prenante'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default StakeholderDocumentUpload;