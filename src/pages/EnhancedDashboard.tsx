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

// ============================================================
// Composant Dashboard
// ============================================================
const EnhancedDashboardContent = () => {
  const { state, alerts, acknowledgeAlert, getSummaryStats, loading, runChecks } = useProjectManager();

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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                <p className="text-gray-600 mt-2">Vue d'ensemble des activités et alertes du projet</p>
              </div>
              <div className="flex items-center gap-4">
                {criticalAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    {criticalAlerts.length} Alertes critiques
                  </Badge>
                )}
                <Button variant="outline" onClick={runChecks}>
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</div>
                <p className="text-sm text-muted-foreground">Alertes critiques</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-500">{stats.highAlerts || 0}</div>
                <p className="text-sm text-muted-foreground">Alertes élevées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-500">{stats.openAlerts || 0}</div>
                <p className="text-sm text-muted-foreground">Alertes ouvertes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-500">{stats.activeRisks}</div>
                <p className="text-sm text-muted-foreground">Risques actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-500">{stats.totalAlerts}</div>
                <p className="text-sm text-muted-foreground">Total alertes</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertes critiques */}
          {criticalAlerts.length > 0 && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes Critiques
                  <Badge variant="destructive">{criticalAlerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-white border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{alert.icon}</span>
                            <p className="font-medium text-red-800">
                              {alert.displayName}
                            </p>
                          </div>
                          <p className="text-sm text-red-600 mt-1">
                            Sévérité: {alert.severity} | Type: {alert.type}
                          </p>
                          <p className="text-xs text-red-500 mt-1">
                            Détecté le: {alert.formattedDate}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          Traiter
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
                Toutes les Alertes
                <Badge variant="secondary">{uiAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uiAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune alerte à afficher</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uiAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                        alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                        'bg-white'
                      } hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{alert.icon}</span>
                            <h4 className="font-medium">{alert.displayName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {alert.type}
                            </Badge>
                            <Badge 
                              variant="secondary"
                              className={
                                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          {alert.message && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Source: {alert.source || 'inconnue'}</span>
                            <span>Statut: {alert.status || 'open'}</span>
                            <span>Détecté: {alert.formattedDate}</span>
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