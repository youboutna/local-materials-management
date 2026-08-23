import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Clock, DollarSign, Shield, Settings, Save, RefreshCw, LucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEscalationThresholdsHex } from '@/hooks/hexagonal/useEscalationThresholdsHex';
import type { EscalationThresholdRow } from '@/domain/repositories/IEscalationThresholdRepository';
import {
import { T } from '@/components/i18n/T';
  ESCALATION_SEVERITIES,
  ESCALATION_THRESHOLD_CATEGORIES,
  ESCALATION_UNIT_LABELS,
  type EscalationUnit,
} from '@/config/referentials/kpi/escalation-thresholds.referential';

type EscalationThreshold = EscalationThresholdRow;

/** Résolution des icônes référentielles (le référentiel reste sans dépendance UI). */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  shield: Shield,
  money: DollarSign,
  alert: AlertTriangle,
  settings: Settings,
};

const EscalationThresholdsSettings: React.FC = () => {
  const [thresholds, setThresholds] = useState<EscalationThreshold[]>([]);
  const { toast } = useToast();
  const {
    thresholds: loadedThresholds,
    isLoading: loading,
    updateThresholds,
    isSaving: saving,
  } = useEscalationThresholdsHex();

  const thresholdTypes = useMemo(
    () =>
      ESCALATION_THRESHOLD_CATEGORIES.map((category) => ({
        key: category.key,
        label: category.label,
        description: category.description,
        highlighted: category.highlighted,
        icon: CATEGORY_ICONS[category.icon] ?? Settings,
      })),
    []
  );


  useEffect(() => {
    setThresholds(loadedThresholds);
  }, [loadedThresholds]);

  const updateThreshold = (id: string, field: keyof EscalationThreshold, value: any) => {
    setThresholds(prev => prev.map(threshold =>
      threshold.id === id ? { ...threshold, [field]: value } : threshold
    ));
  };

  const saveThresholds = async () => {
    try {
      await updateThresholds(
        thresholds.map(threshold => ({
          id: threshold.id,
          updates: {
            threshold_value: threshold.threshold_value,
            severity_level: threshold.severity_level,
            escalation_level: threshold.escalation_level,
            description: threshold.description,
            is_active: threshold.is_active,
          },
        }))
      );

      toast({
        title: 'Succès',
        description: 'Seuils d\'escalade mis à jour avec succès'
      });
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les seuils',
        variant: 'destructive'
      });
    }
  };

  const severityBadgeVariant = (
    severity: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getThresholdsByType = (type: string) => {
    return thresholds.filter(t => t.threshold_type === type);
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span><T k="auto.escalationthresholdssettings.chargement_des_seuils_d_escalade" fallback="Chargement des seuils d'escalade..." /></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <T k="auto.escalationthresholdssettings.configuration_des_seuils_d_escalade" fallback="Configuration des Seuils d'Escalade" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configurez les seuils qui déclenchent les alertes et les actions d'escalade automatiques.
            Ces valeurs remplacent les seuils codés en dur dans l'application.
          </p>
          
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm">
              <span className="font-medium"><T k="auto.escalationthresholdssettings.total_des_seuils_configures" fallback="Total des seuils configurés:" /></span>
              <Badge variant="outline" className="ml-2">{thresholds.length}</Badge>
            </div>
            <Button onClick={saveThresholds} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
            </Button>
          </div>

          <Tabs defaultValue="project_delay" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 mb-6 sm:grid sm:grid-cols-3 lg:grid-cols-6">
              {thresholdTypes.map(type => {
                const IconComponent = type.icon;
                const count = getThresholdsByType(type.key).length;
                return (
                  <TabsTrigger key={type.key} value={type.key} className="text-xs">
                    <IconComponent className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{type.label}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {thresholdTypes.map(type => (
              <TabsContent key={type.key} value={type.key}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <type.icon className="h-4 w-4 text-primary" />
                      {type.label}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>

                      <TableHeader>
                        <TableRow>
                          <TableHead><T k="auto.escalationthresholdssettings.nom_du_seuil" fallback="Nom du Seuil" /></TableHead>
                          <TableHead><T k="auto.escalationthresholdssettings.valeur" fallback="Valeur" /></TableHead>
                          <TableHead><T k="auto.escalationthresholdssettings.unite" fallback="Unité" /></TableHead>
                          <TableHead><T k="auto.escalationthresholdssettings.severite" fallback="Sévérité" /></TableHead>
                          <TableHead><T k="auto.escalationthresholdssettings.niveau" fallback="Niveau" /></TableHead>
                          <TableHead><T k="auto.escalationthresholdssettings.description" fallback="Description" /></TableHead>
                          <TableHead><T k="auto.escalationthresholdssettings.actif" fallback="Actif" /></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getThresholdsByType(type.key).map(threshold => (
                          <TableRow key={threshold.id}>
                            <TableCell className="font-medium">
                              {threshold.threshold_name}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={threshold.threshold_value}
                                onChange={(e) => updateThreshold(threshold.id, 'threshold_value', parseFloat(e.target.value))}
                                className="w-20"
                                min="0"
                                step={threshold.threshold_unit === 'percentage' ? '1' : '0.1'}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {ESCALATION_UNIT_LABELS[threshold.threshold_unit as EscalationUnit] ??
                                  threshold.threshold_unit}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <select
                                  value={threshold.severity_level}
                                  onChange={(e) => updateThreshold(threshold.id, 'severity_level', e.target.value)}
                                  className="border border-input bg-background text-foreground rounded px-2 py-1 text-xs"
                                  aria-label="Sévérité du seuil"
                                >
                                  {ESCALATION_SEVERITIES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                                <Badge variant={severityBadgeVariant(threshold.severity_level)} className="text-[10px]">
                                  {ESCALATION_SEVERITIES.find(s => s.value === threshold.severity_level)?.label ?? threshold.severity_level}
                                </Badge>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Input
                                type="number"
                                value={threshold.escalation_level}
                                onChange={(e) => updateThreshold(threshold.id, 'escalation_level', parseInt(e.target.value))}
                                className="w-16"
                                min="1"
                                max="4"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={threshold.description || ''}
                                onChange={(e) => updateThreshold(threshold.id, 'description', e.target.value || null)}
                                className="w-48"
                                placeholder="Description du seuil..."
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={!!threshold.is_active}
                                onChange={(e) => updateThreshold(threshold.id, 'is_active', e.target.checked)}
                                className="rounded"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {getThresholdsByType(type.key).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <type.icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p><T k="auto.escalationthresholdssettings.aucun_seuil_configure_pour_cette_categorie" fallback="Aucun seuil configuré pour cette catégorie" /></p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Section — catégories mises en avant par le référentiel */}
      <Card>
        <CardHeader>
          <CardTitle><T k="auto.escalationthresholdssettings.resume_des_seuils_d_escalade" fallback="Résumé des Seuils d'Escalade" /></CardTitle>
          <p className="text-sm text-muted-foreground">
            {thresholds.length} seuils référencés · {thresholds.filter(t => t.is_active).length} actifs ·{' '}
            {thresholds.filter(t => t.severity_level === 'critical').length} critiques
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {thresholdTypes.filter(t => t.highlighted).map(type => {
              const typeThresholds = getThresholdsByType(type.key);
              const activeThresholds = typeThresholds.filter(t => t.is_active);
              const criticalThresholds = typeThresholds.filter(t => t.severity_level === 'critical');

              return (
                <div key={type.key} className="p-4 border rounded-lg bg-card">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <type.icon className="h-4 w-4 text-primary" />
                    {type.label}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div><T k="auto.escalationthresholdssettings.total" fallback="Total:" /> <Badge variant="outline">{typeThresholds.length}</Badge></div>
                    <div><T k="auto.escalationthresholdssettings.actifs" fallback="Actifs:" /> <Badge variant="secondary">{activeThresholds.length}</Badge></div>
                    <div><T k="auto.escalationthresholdssettings.critiques" fallback="Critiques:" /> <Badge variant="destructive">{criticalThresholds.length}</Badge></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default EscalationThresholdsSettings;