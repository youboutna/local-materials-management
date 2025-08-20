
import { NotificationMetadata, TaskType } from '@/types/notification';

export const getTaskLink = (metadata: NotificationMetadata): string => {
  const { task_type, related_project_id, related_inspection_id, related_document_id, related_payment_id } = metadata;

  switch (task_type) {
    case 'project':
      return related_project_id ? `/projects/${related_project_id}` : '/projects';
    case 'inspection':
      if (related_inspection_id && related_project_id) {
        return `/projects/${related_project_id}?tab=inspections&inspection=${related_inspection_id}`;
      }
      return related_project_id ? `/projects/${related_project_id}` : '/projects';
    case 'document':
      return related_document_id ? `/documents?id=${related_document_id}` : '/documents';
    case 'payment':
      if (related_payment_id && related_project_id) {
        return `/projects/${related_project_id}?tab=payments&payment=${related_payment_id}`;
      }
      return related_project_id ? `/projects/${related_project_id}` : '/projects';
    case 'material':
      return '/materials';
    case 'insurance':
      return '/insurance-management';
    default:
      return '/dashboard';
  }
};

export const getTaskIcon = (taskType: TaskType): string => {
  switch (taskType) {
    case 'project':
      return 'Briefcase';
    case 'inspection':
      return 'Eye';
    case 'document':
      return 'FileText';
    case 'payment':
      return 'CreditCard';
    case 'material':
      return 'Package';
    case 'insurance':
      return 'Shield';
    default:
      return 'Bell';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
