/**
 * Tender Notification DTO - Data Transfer Object for Tender Notification Entity
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO } from '@/dtos/entities/OrganizationDTO';;

export interface TenderNotificationDTO extends BaseEntityDTO {
  // Core notification data
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  notificationType: 'submission_received' | 'submission_approved' | 'submission_rejected' | 'tender_awarded' | 'tender_cancelled';
  
  // Related entity references
  tenderId?: string;
  submissionId?: string;
  supplierId?: string;
  
  // Metadata
  sentAt: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTenderNotificationRequestDTO {
  id: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

export interface TenderNotificationQueryDTO {
  recipientEmail?: string;
  notificationType?: TenderNotificationDTO['notificationType'];
  tenderId?: string;
  submissionId?: string;
  supplierIdends BaseEntityDTO {
  notificationId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: xport interface NotificationStatsDTO {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalPending: number;
  lastSentAt?: string;
  lastFailureAt?: string;
}