import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      context="phase"
      contextLabel={phaseName ? `Phase: ${phaseName}` : t('auto.phasedocumentupload.documents_de_phase')}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default PhaseDocumentUpload;