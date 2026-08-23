import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      stakeholderId={stakeholderId}
      context="stakeholder"
      contextLabel={stakeholderName ? `Partie prenante: ${stakeholderName}` : t('auto.stakeholderdocumentupload.documents_partie_prenante')}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default StakeholderDocumentUpload;