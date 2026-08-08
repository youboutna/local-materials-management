import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Clock, DollarSign, Shield, Settings, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';



import { EscalationThreshold } from '@/dtos/entities/NotificationDTO';
const EscalationThresholdsSettings: React.FC = () => {
  const [thresholds, setThresholds] = useState<EscalationThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const thresholdTypes = [
    { key: 'project_delay', label: 'Retards de Projet', icon: Clock },
    { key: 'insurance_expiry', label: 'Expiration d\'Assurance', icon: Shield },
    { key: 'payment_validation', label: 'Validation Paiement', icon: DollarSign },
    { key: 'inspection_overdue', label: 'Inspections en Retard', icon: AlertTriangle },
    { key: 'material_wastage', label: 'Gaspillage Matériau', icon: Settings },
    { key: 'budget_allocation', label: 'Allocation Budget', icon: Settings }
  ];

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('escalation_thresholds')
        .select('*')
        .order('threshold_type', { ascending: true })
        .order('threshold_value', { ascending: true });

      if (error) throw error;
      setThresholds((data || []).filter(d => d.id) as EscalationThreshold[]);
    } catch (error) {
      console.error('Error loading thresholds:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les seuils d\'escalade',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateThreshold = (id: string, field: keyof EscalationThreshold, value: any) => {
    setThresholds(prev => prev.map(threshold =>
      threshold.id === id ? { ...threshold, [field]: value } : threshold
    ));
  };

  const saveThresholds = async () => {
    try {
      setSaving(true);
      
      const updates = thresholds.map(threshold => ({
        id: threshold.id,
        threshold_value: threshold.threshold_value,
        severity_level: threshold.severity_level,
        escalation_level: threshold.escalation_level,
        description: threshold.description,
        is_active: threshold.is_active,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('escalation_thresholds')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

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
    } finally {
      setSaving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
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
            <span>Chargement des seuils d'escalade...</span>
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
            Configuration des Seuils d'Escalade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configurez les seuils qui déclenchent les alertes et les actions d'escalade automatiques.
            Ces valeurs remplacent les seuils codés en dur dans l'application.
          </p>
          
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm">
              <span className="font-medium">Total des seuils configurés:</span>
              <Badge variant="outline" className="ml-2">{thresholds.length}</Badge>
            </div>
            <Button onClick={saveThresholds} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
            </Button>
          </div>

          <Tabs defaultValue="project_delay" className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
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
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom du Seuil</TableHead>
                          <TableHead>Valeur</TableHead>
                          <TableHead>Unité</TableHead>
                          <TableHead>Sévérité</TableHead>
                          <TableHead>Niveau</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actif</TableHead>
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
                                {threshold.threshold_unit === 'percentage' ? '%' : 
                                 threshold.threshold_unit === 'days' ? 'jours' : threshold.threshold_unit}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <select
                                value={threshold.severity_level}
                                onChange={(e) => updateThreshold(threshold.id, 'severity_level', e.target.value)}
                                className="border rounded px-2 py-1 text-xs"
                              >
                                <option value="low">Faible</option>
                                <option value="medium">Moyen</option>
                                <option value="high">Élevé</option>
                                <option value="critical">Critique</option>
                              </select>
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
                                checked={threshold.is_active}
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
                        <p>Aucun seuil configuré pour cette catégorie</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Seuils d'Escalade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['project_delay', 'insurance_expiry', 'payment_validation', 'inspection_overdue'].map(type => {
              const typeThresholds = getThresholdsByType(type);
              const activeThresholds = typeThresholds.filter(t => t.is_active);
              const criticalThresholds = typeThresholds.filter(t => t.severity_level === 'critical');
              
              return (
                <div key={type} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">
                    {thresholdTypes.find(t => t.key === type)?.label}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div>Total: <Badge variant="outline">{typeThresholds.length}</Badge></div>
                    <div>Actifs: <Badge variant="secondary">{activeThresholds.length}</Badge></div>
                    <div>Critiques: <Badge className="bg-red-500 text-white">{criticalThresholds.length}</Badge></div>
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