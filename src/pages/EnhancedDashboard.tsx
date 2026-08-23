// ============================================================
// src/pages/EnhancedDashboard.tsx
// ============================================================
/**
 * Enhanced Dashboard Page
 * UI Layer - Tableau de bord avec AlertService
 * IMPORTE les types du domaine - NE DEFINI PAS de types
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTransformer } from '@/dtos/transforms/AlertTransformer';
import { useProjectManager } from '@/hooks/useProjectManager';
import { AlertTriangle, Bell, CheckCircle, ExternalLink, Eye } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { TranslatedSeverity } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
import { useI18n } from '@/hooks/useI18n';
import { alertTypeLabel } from '@/config/referentials/notifications/alerts.referential';

// ============================================================
// Composant Dashboard
// ============================================================
const EnhancedDashboardContent = () => {
  const { state, alerts, acknowledgeAlert, getSummaryStats, loading, runChecks } = useProjectManager();
  const { t, language, translateStatus, translateTerm } = useI18n();


  // Utiliser alerts depuis state
  const allAlerts = state?.alerts || alerts || [];
  const stats = getSummaryStats();

  // Transformer les alertes pour l'UI
  const uiAlerts = useMemo(() => {
    return AlertTransformer.toDTOList(allAlerts);
  }, [allAlerts]);

  // Filtrer les alertes critiques
  const criticalAlerts = useMemo(() => {
    return uiAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high');
  }, [uiAlerts]);

  // Gestion de l'acquittement
  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'current-user', 'Traité depuis le dashboard');
      await runChecks();
    } catch (error) {
      console.error('Erreur lors de l\'acquittement:', error);
    }
  }, [acknowledgeAlert, runChecks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground"><T k="auto.enhanceddashboard.tableau_de_bord" fallback="Tableau de Bord" /></h1>
                <p className="text-muted-foreground mt-2"><T k="auto.enhanceddashboard.vue_d_ensemble_des_activites_et_alertes_du_proje" fallback="Vue d'ensemble des activités et alertes du projet" /></p>
              </div>
              <div className="flex items-center gap-4">
                {criticalAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    {criticalAlerts.length} {t('auto.enhanceddashboard.alertes_critiques')}
                  </Badge>
                )}
                <Button variant="outline" onClick={runChecks}>
                  <T k="auto.enhanceddashboard.actualiser" fallback="Actualiser" />
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-destructive">{stats.criticalAlerts}</div>
                <p className="text-sm text-muted-foreground"><T k="auto.enhanceddashboard.alertes_critiques" fallback="Alertes critiques" /></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-warning">{stats.highAlerts || 0}</div>
                <p className="text-sm text-muted-foreground"><T k="auto.enhanceddashboard.alertes_elevees" fallback="Alertes élevées" /></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{stats.openAlerts || 0}</div>
                <p className="text-sm text-muted-foreground"><T k="auto.enhanceddashboard.alertes_ouvertes" fallback="Alertes ouvertes" /></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-500">{stats.activeRisks}</div>
                <p className="text-sm text-muted-foreground"><T k="auto.enhanceddashboard.risques_actifs" fallback="Risques actifs" /></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-success">{stats.totalAlerts}</div>
                <p className="text-sm text-muted-foreground"><T k="auto.enhanceddashboard.total_alertes" fallback="Total alertes" /></p>
              </CardContent>
            </Card>
          </div>

          {/* Alertes critiques */}
          {criticalAlerts.length > 0 && (
            <Card className="mb-8 border-destructive/30 bg-destructive/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <T k="auto.enhanceddashboard.alertes_critiques" fallback="Alertes Critiques" />
                  <Badge variant="destructive">{criticalAlerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-white border border-destructive/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{alert.icon}</span>
                            <p className="font-medium text-destructive">
                              {alert.displayName}
                            </p>
                          </div>
                          <p className="text-sm text-destructive mt-1">
                            <T k="auto.enhanceddashboard.severite" fallback="Sévérité:" /> <TranslatedSeverity code={alert.severity} /> | {t('alerts.type_label')}: {alertTypeLabel(alert.type, language)}
                          </p>
                          <p className="text-xs text-destructive mt-1">
                            {t('alerts.detected_at')}: {alert.formattedDate}
                          </p>

                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          <T k="auto.enhanceddashboard.traiter" fallback="Traiter" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toutes les alertes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <T k="auto.enhanceddashboard.toutes_les_alertes" fallback="Toutes les Alertes" />
                <Badge variant="secondary">{uiAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uiAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground"><T k="auto.enhanceddashboard.aucune_alerte_a_afficher" fallback="Aucune alerte à afficher" /></p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uiAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/10' :
                        alert.severity === 'high' ? 'border-warning/30 bg-warning/10' :
                        'bg-white'
                      } hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{alert.icon}</span>
                            <h4 className="font-medium">{alert.displayName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {alertTypeLabel(alert.type, language)}
                            </Badge>

                            <Badge 
                              variant="secondary"
                              className={
                                alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                                alert.severity === 'high' ? 'bg-warning/10 text-warning' :
                                'bg-primary/10 text-primary'
                              }
                            >
                              <TranslatedSeverity code={alert.severity} />
                            </Badge>
                          </div>
                          {alert.message && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{t('alerts.source_label')}: {translateTerm(alert.source) || t('common.unknown')}</span>
                            <span>{t('alerts.status_label')}: {translateStatus(alert.status || 'open')}</span>
                            <span>{t('alerts.detected_at')}: {alert.formattedDate}</span>
                          </div>

                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.acknowledged && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardContent;