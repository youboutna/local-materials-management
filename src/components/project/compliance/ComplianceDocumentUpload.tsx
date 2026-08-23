import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      context="compliance"
      contextLabel={complianceType ? `Conformité: ${complianceType}` : t('auto.compliancedocumentupload.documents_de_conformite')}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default ComplianceDocumentUpload;