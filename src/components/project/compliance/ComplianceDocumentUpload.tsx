import React from 'react';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface ComplianceDocumentUploadProps {
  projectId: string;
  phaseId?: string;
  complianceType?: string;
  onDocumentUploaded?: () => void;
}

const ComplianceDocumentUpload = ({ 
  projectId, 
  phaseId, 
  complianceType, 
  onDocumentUploaded 
}: ComplianceDocumentUploadProps) => {
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      context="compliance"
      contextLabel={complianceType ? `Conformité: ${complianceType}` : 'Documents de conformité'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default ComplianceDocumentUpload;