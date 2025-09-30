import React from 'react';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface InspectionDocumentUploadProps {
  projectId: string;
  inspectionId: string;
  inspectionTitle?: string;
  onDocumentUploaded?: () => void;
}

const InspectionDocumentUpload = ({ 
  projectId, 
  inspectionId, 
  inspectionTitle, 
  onDocumentUploaded 
}: InspectionDocumentUploadProps) => {
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      inspectionId={inspectionId}
      context="inspection"
      contextLabel={inspectionTitle ? `Inspection: ${inspectionTitle}` : 'Documents d\'inspection'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default InspectionDocumentUpload;