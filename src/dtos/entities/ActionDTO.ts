/**
 * Action Data Transfer Objects
 */

export interface ActionMetadataDTO {
  source?: string;
  category?: string;
  urgency?: 'normal' | 'urgent' | 'critical';
  attachments?: string[];
  customFields?: Record<string, string | number | boolean>;
  priority?: number;
  deadline?: Date;
  estimatedDuration?: number; // en minutes
  requiredSkills?: string[];
  location?: string;
  budget?: number;
}

export interface EnhancedActionDTO {
  id: string;
  entityType: 'insurance' | 'bankGuarantee' | 'payment' | 'project' | 'document';
  entityId: string;
  projectId?: string;
  contractorId?: string;
  actionType: 'taskAssignment' | 'hierarchyNotification' | 'sms' | 'call' | 'email' | 'mail' | 'notification';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  assigneeId?: string;
  recipientIds: string[];
  metadata?: ActionMetadataDTO;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateEnhancedActionRequestDTO {
  insuranceId?: string;
  projectId?: string;
  contractorId?: string;
  actionType: EnhancedActionDTO['actionType'];
  title: string;
  message: string;
  priority?: EnhancedActionDTO['priority'];
  assigneeId?: string;
  recipientIds?: string[];
  metadata?: ActionMetadataDTO;
}
