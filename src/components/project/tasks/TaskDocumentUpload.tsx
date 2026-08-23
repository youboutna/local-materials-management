import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface TaskDocumentUploadProps {
  projectId: string;
  phaseId?: string;
  stepId?: string;
  taskId?: string;
  taskTitle?: string;
  onDocumentUploaded?: () => void;
}

const TaskDocumentUpload = ({ 
  projectId, 
  phaseId, 
  stepId,
  taskId, 
  taskTitle, 
  onDocumentUploaded 
}: TaskDocumentUploadProps) => {
  const { t } = useLanguage();
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      stepId={stepId}
      taskId={taskId}
      context="task"
      contextLabel={taskTitle ? `Tâche: ${taskTitle}` : t('auto.taskdocumentupload.documents_de_tache')}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default TaskDocumentUpload;