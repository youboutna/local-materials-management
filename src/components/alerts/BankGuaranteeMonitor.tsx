import { ActionsDropdown } from '@/components/actions/ActionsDropdown';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { supabase } from '@/integrations/supabase/client';
import { createBankGuaranteeAction } from '@/services/bankGuaranteeActionService';
import { detectProjectDelays, triggerBankGuaranteeNotification } from '@/services/bankGuaranteeService';
import { AlertTriangle, Clock, DollarSign, Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DELAY_THRESHOLDS } from '../../types/project';

const BankGuaranteeMonitor: React.FC = () => {
  const [delays, setDelays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    currentData: paginatedDelays,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage
  } = usePagination({
    data: delays,
    itemsPerPage: 10
  });

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
      // Get real bank guarantee data from database
      const { data: guarantee, error: guaranteeError } = await supabase
        .from('bank_guarantees')
        .select('*')
        .eq('project_id', delay.projectId)
        .eq('status', 'active')
        .single();

      if (guaranteeError) {
        console.error('Error fetching bank guarantee:', guaranteeError);
        toast({
          title: 'Erreur',
          description: 'Aucune garantie bancaire trouvée pour ce projet',
          variant: 'destructive'
        });
        return;
      }

      const bankGuaranteeData = {
        projectId: delay.projectId,
        contractorId: guarantee.contractor_id,
        bankLiaisonEmail: `contact@${guarantee.bank_name.toLowerCase().replace(/\s+/g, '')}.mr`,
        guaranteeAmount: guarantee.guarantee_amount,
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

  const handleBankGuaranteeAction = async (projectId: string, actionType: string) => {
    try {
      const delay = delays.find(d => d.projectId === projectId);
      if (!delay) {
        toast({
          title: 'Erreur',
          description: 'Projet introuvable',
          variant: 'destructive'
        });
        return;
      }

      // Get current user or use a fallback
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || 'system-user';

      let title = '';
      let message = '';
      
      switch (actionType) {
        case 'task_assignment':
          title = 'Gestion retard projet';
          message = `Veuillez traiter le retard de ${delay.delayDays} jours sur le projet ${delay.projectName}`;
          break;
        case 'hierarchy_notification':
          title = 'Alerte retard critique';
          message = `Le projet ${delay.projectName} accuse un retard de ${delay.delayPercentage}%`;
          break;
        case 'sms':
          title = 'SMS retard projet';
          message = `SMS: Retard ${delay.delayDays} jours - ${delay.projectName}`;
          break;
        case 'call':
          title = 'Appel retard projet';
          message = `Appel concernant le retard du projet ${delay.projectName}`;
          break;
        case 'email':
          title = 'Email retard projet';
          message = `Email concernant le retard du projet ${delay.projectName}`;
          break;
        case 'mail':
          title = 'Courrier retard projet';
          message = `Courrier concernant le retard du projet ${delay.projectName}`;
          break;
        default:
          toast({
            title: 'Erreur',
            description: 'Type d\'action non reconnu',
            variant: 'destructive'
          });
          return;
      }

      await createBankGuaranteeAction({
        bankGuaranteeId: `bg-${projectId}`,
        projectId,
        contractorId: delay.contractorId || 'demo-contractor-001',
        actionType: actionType as any,
        title,
        message,
        priority: 'urgent',
        assigneeId: currentUserId,
        recipientIds: [currentUserId],
        metadata: { delayData: delay }
      });

      toast({
        title: 'Action créée',
        description: `${title} créée avec succès`,
      });
    } catch (error: any) {
      console.error('Error creating bank guarantee action:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de créer l'action: ${error?.message || 'Erreur inconnue'}`,
        variant: 'destructive'
      });
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

              {paginatedDelays.map((delay) => (
                <Card key={delay.projectId} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{delay.projectName}</h3>
                          <Badge variant={getSeverityColor(delay.delayPercentage)}>
                            {getSeverityLabel(delay.delayPercentage)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
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
                        
                        <ActionsDropdown
                          entityType="bank_guarantee"
                          entityId={delay.projectId}
                          projectId={delay.projectId}
                          contractorId={delay.contractorId}
                          onActionComplete={loadDelays}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              {delays.length > 10 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={goToPage}
                  showItemsPerPage={false}
                />
              )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
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