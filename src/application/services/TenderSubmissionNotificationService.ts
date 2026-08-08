import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import { TenderSubmissionNotificationData } from '@/dtos/entities/NotificationDTO';
export const sendTenderSubmissionNotification = async (data: TenderSubmissionNotificationData) => {
  try {
    console.log('Sending tender submission notification:', data);

    // Call the edge function
    const { data: result, error } = await supabase.functions.invoke('send-tender-submission-notification', {
      body: data
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    console.log('Notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending tender submission notification:', error);
    toast({
      title: "Avertissement",
      description: "La soumission a été enregistrée mais l'email de confirmation n'a pas pu être envoyé.",
      variant: "default",
    });
    // Don't throw - we don't want to fail the submission if email fails
    return null;
  }
};