import { detectExpiringInsurance, sendInsuranceExpiryAlerts } from '@/services/insuranceCertificateService';
import { toast } from '@/hooks/use-toast';

export const checkAndSendInsuranceAlerts = async () => {
  try {
    console.log('Checking for insurance expiry alerts...');
    
    // Detect expiring insurance
    const alerts = await detectExpiringInsurance();
    
    if (alerts.length === 0) {
      console.log('No insurance alerts found');
      return { success: true, alertsSent: 0 };
    }

    console.log(`Found ${alerts.length} insurance alerts`);
    
    // Send alerts
    const result = await sendInsuranceExpiryAlerts(alerts);
    
    if (result.success) {
      toast({
        title: "Alertes d'assurance envoyées",
        description: `${result.alertsProcessed} alertes ont été traitées et ${result.notificationsSent} notifications envoyées.`,
      });
      
      return { 
        success: true, 
        alertsSent: result.alertsProcessed,
        notificationsSent: result.notificationsSent 
      };
    } else {
      throw new Error('Failed to send insurance alerts');
    }
    
  } catch (error) {
    console.error('Error checking insurance alerts:', error);
    toast({
      title: "Erreur",
      description: "Erreur lors de l'envoi des alertes d'assurance",
      variant: "destructive",
    });
    
    return { success: false, alertsSent: 0 };
  }
};