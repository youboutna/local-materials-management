import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Play, Pause, Clock, Settings, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const AlertsProcessorSettings: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ProcessorConfig>({
    enabled: true,
    batchSize: 50,
    intervalMinutes: 30,
    maxRetries: 3,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  

  useEffect(() => {
    loadConfig();
    loadLogs();
  }, []);

  const loadConfig = async () => {
    // For now, use localStorage until types are updated
    try {
      const saved = localStorage.getItem('alerts_processor_config');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadLogs = async () => {
    // For now, use mock data until types are updated
    setLogs([]);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // For now, save to localStorage until types are updated
      localStorage.setItem('alerts_processor_config', JSON.stringify(config));

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
      const { data, error } = await supabase.functions.invoke('project-alerts-processor');
      
      if (error) throw error;

      toast({
        title: "Traitement terminé",
        description: `${data.alertsGenerated} alertes générées pour ${data.processed} projets.`,
      });

      // Reload logs to show latest run
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
            Processeur d'Alertes de Projet
          </CardTitle>
          <CardDescription>
            Configuration du traitement automatique des alertes de projet en arrière-plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base">
                Processeur activé
              </Label>
              <p className="text-sm text-muted-foreground">
                Active ou désactive le traitement automatique des alertes
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
              <Label htmlFor="batchSize">Taille du lot</Label>
              <Input
                id="batchSize"
                type="number"
                min="1"
                max="50"
                value={config.batchSize}
                onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value) || 10})}
              />
              <p className="text-xs text-muted-foreground">
                Nombre de projets traités par lot
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervalMinutes">Intervalle (minutes)</Label>
              <Input
                id="intervalMinutes"
                type="number"
                min="5"
                max="1440"
                value={config.intervalMinutes}
                onChange={(e) => setConfig({...config, intervalMinutes: parseInt(e.target.value) || 60})}
              />
              <p className="text-xs text-muted-foreground">
                Fréquence d'exécution automatique
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries">Tentatives max</Label>
              <Input
                id="maxRetries"
                type="number"
                min="1"
                max="10"
                value={config.maxRetries}
                onChange={(e) => setConfig({...config, maxRetries: parseInt(e.target.value) || 3})}
              />
              <p className="text-xs text-muted-foreground">
                Nombre de tentatives en cas d'erreur
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
            Historique des traitements
          </CardTitle>
          <CardDescription>
            Dernières exécutions du processeur d'alertes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun traitement enregistré
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