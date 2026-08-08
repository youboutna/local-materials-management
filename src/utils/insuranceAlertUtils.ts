import { InsuranceService, getInsuranceService} from '@/application/services/InsuranceService';
import { toast } from '@/hooks/use-toast';

export const checkAndSendInsuranceAlerts = async () => {
  try {
    console.log('Checking for insurance expiry alerts...');
    
    // Detect expiring insurance using service instance
    const insuranceService = getInsuranceService();
    const alerts = await insuranceService.detectExpiringInsurance();
    
    if (alerts.length === 0) {
      console.log('No insurance alerts found');
      return { success: true, alertsSent: 0 };
    }

    console.log(`Found ${alerts.length} insurance alerts`);
    
    // Alerts detected - notify via toast
    toast({
      title: "Alertes d'assurance détectées",
      description: `${alerts.length} certificats d'assurance expirent bientôt.`,
    });
    
    return { 
      success: true, 
      alertsSent: alerts.length,
      notificationsSent: alerts.length 
    };
    
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