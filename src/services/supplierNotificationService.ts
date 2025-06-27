
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SupplierNotificationData {
  type: 'password_reset' | 'task_assignment';
  email: string;
  supplier_name?: string;
  supplier_id?: string;
  task_id?: string;
  task_title?: string;
}

export const sendSupplierNotification = async (data: SupplierNotificationData) => {
  try {
    // Generate completion URL for task assignments
    let completion_url = '';
    if (data.type === 'task_assignment' && data.task_id) {
      const token = btoa(JSON.stringify({ taskId: data.task_id, timestamp: Date.now() }));
      completion_url = `${window.location.origin}/supplier-portal?task=${token}`;
      
      // Update task with completion URL
      await supabase
        .from('task_assignments')
        .update({ 
          completion_token: token,
          completion_url: completion_url 
        })
        .eq('id', data.task_id);
    }

    // Call the edge function
    const { data: result, error } = await supabase.functions.invoke('send-supplier-notification', {
      body: {
        ...data,
        completion_url
      }
    });

    if (error) throw error;

    return result;
  } catch (error) {
    console.error('Error sending supplier notification:', error);
    toast({
      title: "Erreur",
      description: "Impossible d'envoyer la notification au fournisseur.",
      variant: "destructive",
    });
    throw error;
  }
};

export const generateSupplierPasswordReset = async (supplierEmail: string, supplierName: string, supplierId: string) => {
  try {
    const { data, error } = await supabase.rpc('generate_supplier_reset_token', {
      supplier_email: supplierEmail
    });

    if (error) throw error;

    // Send the reset notification
    await sendSupplierNotification({
      type: 'password_reset',
      email: supplierEmail,
      supplier_name: supplierName,
      supplier_id: supplierId
    });

    toast({
      title: "Email envoyé",
      description: `Un email de réinitialisation a été envoyé à ${supplierEmail}`,
    });

    return data;
  } catch (error) {
    console.error('Error generating password reset:', error);
    toast({
      title: "Erreur",
      description: "Impossible de générer le lien de réinitialisation.",
      variant: "destructive",
    });
    throw error;
  }
};
