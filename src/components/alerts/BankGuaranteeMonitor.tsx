import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, Clock, Send } from 'lucide-react';
import { detectProjectDelays, triggerBankGuaranteeNotification, DELAY_THRESHOLDS } from '@/services/bankGuaranteeService';
import { toast } from '@/hooks/use-toast';

const BankGuaranteeMonitor: React.FC = () => {
  const [delays, setDelays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadDelays();
    // Check for delays every hour
    const interval = setInterval(loadDelays, 3600000);
    return () => clearInterval(interval);
  }, []);

  const loadDelays = async () => {
    try {
      const projectDelays = await detectProjectDelays();
      const criticalDelays = projectDelays.filter(
        delay => delay.delayPercentage >= DELAY_THRESHOLDS.WARNING
      );
      setDelays(criticalDelays);
    } catch (error) {
      console.error('Error loading delays:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les retards de projet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBankNotification = async (delay: any) => {
    setProcessing(delay.projectId);
    try {
      const bankGuaranteeData = {
        projectId: delay.projectId,
        contractorId: 'contractor-1', // Would be dynamic in real implementation
        bankLiaisonEmail: 'bank.liaison@example.com',
        guaranteeAmount: 500000, // 500K MRU example
        delayPercentage: delay.delayPercentage,
        contractClause: 'Article 15.3 - Garantie de bonne exécution'
      };

      const result = await triggerBankGuaranteeNotification(delay, bankGuaranteeData);
      
      toast({
        title: 'Notification bancaire envoyée',
        description: `La banque a été notifiée du retard sur "${delay.projectName}". ${result.notificationsSent} notifications internes envoyées.`,
      });

      // Remove from current delays list
      setDelays(prev => prev.filter(d => d.projectId !== delay.projectId));
    } catch (error) {
      console.error('Error triggering bank notification:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de l\'envoi de la notification bancaire',
        variant: 'destructive'
      });
    } finally {
      setProcessing(null);
    }
  };

  const getSeverityColor = (delayPercentage: number) => {
    if (delayPercentage >= DELAY_THRESHOLDS.GUARANTEE_TRIGGER) return 'destructive';
    if (delayPercentage >= DELAY_THRESHOLDS.BANK_NOTIFICATION) return 'default';
    return 'secondary';
  };

  const getSeverityLabel = (delayPercentage: number) => {
    if (delayPercentage >= DELAY_THRESHOLDS.GUARANTEE_TRIGGER) return 'GARANTIE À DÉCLENCHER';
    if (delayPercentage >= DELAY_THRESHOLDS.BANK_NOTIFICATION) return 'NOTIFICATION BANCAIRE';
    return 'ALERTE RETARD';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Surveillance Garanties Bancaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          {delays.length === 0 ? (
            <Alert>
              <AlertTitle>Aucun retard critique détecté</AlertTitle>
              <AlertDescription>
                Tous les projets respectent les délais contractuels.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>⚠️ {delays.length} projet(s) en retard critique</AlertTitle>
                <AlertDescription>
                  Des retards dépassent les seuils contractuels. Action immédiate requise.
                </AlertDescription>
              </Alert>

              {delays.map((delay) => (
                <Card key={delay.projectId} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{delay.projectName}</h3>
                          <Badge variant={getSeverityColor(delay.delayPercentage)}>
                            {getSeverityLabel(delay.delayPercentage)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Retard: {delay.delayDays} jours ({delay.delayPercentage}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>Entrepreneur: {delay.contractorName}</span>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Date prévue:</strong> {new Date(delay.plannedEndDate).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Jalons manqués:</strong> {delay.milestonesMissed}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        {delay.delayPercentage >= DELAY_THRESHOLDS.BANK_NOTIFICATION && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleTriggerBankNotification(delay)}
                            disabled={processing === delay.projectId}
                            className="flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            {processing === delay.projectId ? 'Envoi...' : 'Notifier Banque'}
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          Voir Projet
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seuils d'escalade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Seuils d'Escalade</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <div className="font-medium">Alerte Retard</div>
              <div className="text-muted-foreground">≥ {DELAY_THRESHOLDS.WARNING}% de retard</div>
            </div>
            <div className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
              <div className="font-medium">Notification Bancaire</div>
              <div className="text-muted-foreground">≥ {DELAY_THRESHOLDS.BANK_NOTIFICATION}% de retard</div>
            </div>
            <div className="p-2 bg-red-50 rounded border-l-4 border-red-400">
              <div className="font-medium">Déclenchement Garantie</div>
              <div className="text-muted-foreground">≥ {DELAY_THRESHOLDS.GUARANTEE_TRIGGER}% de retard</div>
            </div>
            <div className="p-2 bg-gray-50 rounded border-l-4 border-gray-400">
              <div className="font-medium">Escalade Juridique</div>
              <div className="text-muted-foreground">≥ {DELAY_THRESHOLDS.LEGAL_ESCALATION}% de retard</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankGuaranteeMonitor;