import { supabase } from '@/integrations/supabase/client';

export interface CommunicationService {
  sendEmail: (params: EmailParams) => Promise<any>;
  sendSMS: (params: SMSParams) => Promise<any>;
  scheduleCall: (params: CallParams) => Promise<any>;
  assignTask: (params: TaskParams) => Promise<any>;
}

export interface EmailParams {
  to: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionType: string;
  metadata?: Record<string, any>;
}

export interface SMSParams {
  to: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionType: string;
  metadata?: Record<string, any>;
}

export interface CallParams {
  recipientId: string;
  recipientPhone: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: string;
  actionType: string;
  metadata?: Record<string, any>;
}

export interface TaskParams {
  assigneeId: string;
  assigneeName: string;
  assigneeEmail?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  projectId?: string;
  relatedId?: string;
  actionType: string;
  metadata?: Record<string, any>;
}

class RealCommunicationService implements CommunicationService {
  async sendEmail(params: EmailParams): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email-notification', {
        body: params
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendSMS(params: SMSParams): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-notification', {
        body: params
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async scheduleCall(params: CallParams): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('schedule-call', {
        body: params
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error scheduling call:', error);
      throw error;
    }
  }

  async assignTask(params: TaskParams): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('assign-task-to-employee', {
        body: params
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }
}

export const communicationService = new RealCommunicationService();