import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      inspectionId={inspectionId}
      context="inspection"
      contextLabel={inspectionTitle ? `Inspection: ${inspectionTitle}` : t('auto.inspectiondocumentupload.documents_d_inspection')}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default InspectionDocumentUpload;