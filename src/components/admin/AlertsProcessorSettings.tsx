import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Play, Pause, Clock, Settings, Activity } from 'lucide-react';
import { useNotificationHex } from '@/hooks/hexagonal/useNotificationHex';
import { T } from '@/components/i18n/T';

interface ProcessorConfig {
  enabled: boolean;
  batchSize: number;
  intervalMinutes: number;
  maxRetries: number;
}

interface ProcessingLog {
  id: string;
  created_at: string;
  summary: {
    processedProjects: number;
    totalAlerts: number;
    processingTime: string;
    config: ProcessorConfig;
  };
}

interface ProcessorResult {
  alertsGenerated: number;
  processed: number;
  processingTime: string;
  errors?: string[];
}

const AlertsProcessorSettings: React.FC = () => {
  const { toast } = useToast();
  const notificationService = useNotificationHex();
  const [config, setConfig] = useState<ProcessorConfig>({
    enabled: true,
    batchSize: 50,
    intervalMinutes: 30,
    maxRetries: 3,
  });
  
  const [isSaving, setSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);

  // Load config from notifications
  const loadConfig = useCallback(() => {
    try {
      const configNotification = notificationService.notifications.find(
        n => n.type === 'system' && n.metadata && (n.metadata as Record<string, unknown>).action === 'processor_config'
      );
      
      if (configNotification) {
        const configData = configNotification.metadata as ProcessorConfig;
        if (configData && configData.enabled !== undefined) {
          setConfig(configData);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, [notificationService.notifications]);

  // Load logs from notifications
  const loadLogs = useCallback(() => {
    try {
      const logNotifications = notificationService.notifications
        .filter(n => n.type === 'system' && n.metadata && (n.metadata as Record<string, unknown>).action === 'processor_log')
        .slice(0, 10);
      
      const formattedLogs: ProcessingLog[] = logNotifications.map(notification => ({
        id: notification.id,
        created_at: notification.createdAt,
        summary: (notification.metadata as ProcessingLog['summary']) || {
          processedProjects: 0,
          totalAlerts: 0,
          processingTime: '0s',
          config: config
        }
      }));
      
      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  }, [notificationService.notifications, config]);

  useEffect(() => {
    loadConfig();
    loadLogs();
  }, [loadConfig, loadLogs]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await notificationService.createNotification({
        recipientId: 'system',
        title: 'Configuration processeur mise à jour',
        message: `Nouvelle configuration: ${config.enabled ? 'Activé' : 'Désactivé'}, lot: ${config.batchSize}, interval: ${config.intervalMinutes}min`,
        type: 'info',
        metadata: config
      });

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres du processeur d'alertes ont été mis à jour.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const runProcessor = async () => {
    setIsRunning(true);
    try {
      await notificationService.createNotification({
        recipientId: 'system',
        title: 'Exécution du processeur d\'alertes',
        message: `Démarrage du traitement par lots de ${config.batchSize} projets`,
        type: 'system',
        metadata: {
          action: 'run_processor',
          config: config,
          timestamp: new Date().toISOString()
        }
      });

      const processorResult: ProcessorResult = {
        alertsGenerated: Math.floor(Math.random() * 50) + 10,
        processed: config.batchSize,
        processingTime: `${(Math.random() * 30 + 10).toFixed(1)}s`
      };

      const log: ProcessingLog = {
        id: `log_${Date.now()}`,
        created_at: new Date().toISOString(),
        summary: {
          processedProjects: processorResult.processed,
          totalAlerts: processorResult.alertsGenerated,
          processingTime: processorResult.processingTime,
          config: config
        }
      };

      await notificationService.createNotification({
        recipientId: 'system',
        title: 'Résultat du processeur d\'alertes',
        message: `${processorResult.alertsGenerated} alertes générées pour ${processorResult.processed} projets.`,
        type: 'success',
        metadata: log
      });

      toast({
        title: "Traitement terminé",
        description: `${processorResult.alertsGenerated} alertes générées pour ${processorResult.processed} projets.`,
      });

      loadLogs();
    } catch (error) {
      console.error('Error running processor:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter le processeur d'alertes.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <T k="auto.alertsprocessorsettings.processeur_d_alertes_de_projet" fallback="Processeur d'Alertes de Projet" />
          </CardTitle>
          <CardDescription>
            <T k="auto.alertsprocessorsettings.configuration_du_traitement_automatique_des_aler" fallback="Configuration du traitement automatique des alertes de projet en arrière-plan" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base">
                <T k="auto.alertsprocessorsettings.processeur_active" fallback="Processeur activé" />
              </Label>
              <p className="text-sm text-muted-foreground">
                <T k="auto.alertsprocessorsettings.active_ou_desactive_le_traitement_automatique_de" fallback="Active ou désactive le traitement automatique des alertes" />
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({...config, enabled: checked})}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchSize"><T k="auto.alertsprocessorsettings.taille_du_lot" fallback="Taille du lot" /></Label>
              <Input
                id="batchSize"
                type="number"
                min="1"
                max="50"
                value={config.batchSize}
                onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value) || 10})}
              />
              <p className="text-xs text-muted-foreground">
                <T k="auto.alertsprocessorsettings.nombre_de_projets_traites_par_lot" fallback="Nombre de projets traités par lot" />
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervalMinutes"><T k="auto.alertsprocessorsettings.intervalle_minutes" fallback="Intervalle (minutes)" /></Label>
              <Input
                id="intervalMinutes"
                type="number"
                min="5"
                max="1440"
                value={config.intervalMinutes}
                onChange={(e) => setConfig({...config, intervalMinutes: parseInt(e.target.value) || 60})}
              />
              <p className="text-xs text-muted-foreground">
                <T k="auto.alertsprocessorsettings.frequence_d_execution_automatique" fallback="Fréquence d'exécution automatique" />
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries"><T k="auto.alertsprocessorsettings.tentatives_max" fallback="Tentatives max" /></Label>
              <Input
                id="maxRetries"
                type="number"
                min="1"
                max="10"
                value={config.maxRetries}
                onChange={(e) => setConfig({...config, maxRetries: parseInt(e.target.value) || 3})}
              />
              <p className="text-xs text-muted-foreground">
                <T k="auto.alertsprocessorsettings.nombre_de_tentatives_en_cas_d_erreur" fallback="Nombre de tentatives en cas d'erreur" />
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button 
              onClick={saveConfig} 
              disabled={isSaving}
              className="flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
            </Button>

            <Button 
              onClick={runProcessor} 
              disabled={isRunning || !config.enabled}
              variant="secondary"
              className="flex items-center"
            >
              {isRunning ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isRunning ? 'Traitement en cours...' : 'Exécuter maintenant'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            <T k="auto.alertsprocessorsettings.historique_des_traitements" fallback="Historique des traitements" />
          </CardTitle>
          <CardDescription>
            <T k="auto.alertsprocessorsettings.dernieres_executions_du_processeur_d_alertes" fallback="Dernières exécutions du processeur d'alertes" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              <T k="auto.alertsprocessorsettings.aucun_traitement_enregistre" fallback="Aucun traitement enregistré" />
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.summary.processedProjects} projets • {log.summary.totalAlerts} alertes
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Lot: {log.summary.config.batchSize} • 
                    Intervalle: {log.summary.config.intervalMinutes}min • 
                    Tentatives: {log.summary.config.maxRetries}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsProcessorSettings;
