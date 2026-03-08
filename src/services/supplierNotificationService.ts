// @ts-nocheck
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
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
      const taskRepository = RepositoryFactory.getTaskRepository();
      await taskRepository.update(data.task_id, { 
        completion_token: token,
        completion_url: completion_url 
      });
    }

    // Call the edge function via auth service
    const authRepository = RepositoryFactory.getAuthRepository();
    const result = await authRepository.invokeFunction('send-supplier-notification', {
      body: {
        ...data,
        completion_url
      }
    });

    if (!result) throw new Error('Failed to send notification');

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
    const authRepository = RepositoryFactory.getAuthRepository();
    const data = await authRepository.invokeRPC('generate_supplier_reset_token', {
      supplier_email: supplierEmail
    });

    if (!data) throw new Error('Failed to generate reset token');

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
