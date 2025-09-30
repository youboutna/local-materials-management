import React from 'react';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface TaskDocumentUploadProps {
  projectId: string;
  phaseId?: string;
  taskId?: string;
  taskTitle?: string;
  onDocumentUploaded?: () => void;
}

const TaskDocumentUpload = ({ 
  projectId, 
  phaseId, 
  taskId, 
  taskTitle, 
  onDocumentUploaded 
}: TaskDocumentUploadProps) => {
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      context="task"
      contextLabel={taskTitle ? `Tâche: ${taskTitle}` : 'Documents de tâche'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default TaskDocumentUpload;