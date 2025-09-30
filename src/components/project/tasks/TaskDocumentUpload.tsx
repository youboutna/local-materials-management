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
  return (
    <ProjectDocumentUpload
      projectId={projectId}
      phaseId={phaseId}
      stepId={stepId}
      taskId={taskId}
      context="task"
      contextLabel={taskTitle ? `Tâche: ${taskTitle}` : 'Documents de tâche'}
      onDocumentUploaded={onDocumentUploaded}
    />
  );
};

export default TaskDocumentUpload;