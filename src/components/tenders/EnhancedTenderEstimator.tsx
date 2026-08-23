import React, { useMemo, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calculator, Upload, Plus, Trash2, FileText, Save, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import AdvancedQuantityCalculator from '@/components/project/AdvancedQuantityCalculator';
import TenderEstimatorForm from '@/components/tenders/TenderEstimatorForm';
import { calculateAdvancedQuantities } from '@/utils/btpCalculations';
import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import type { TenderEstimatorLineInput, TenderCategory } from '@/application/services/boq/TenderEstimatorService';
import {
  getTenderEstimationSteps,
  TENDER_ESTIMATE_TEMPLATES,
  type TenderEstimateTemplate,
  type TenderEstimateTemplateItem,
  type TenderEstimationStepCode,
} from '@/config/referentials/tender/estimation-workflow.referential';
import { BOQ_FISCAL_PROFILES } from '@/config/referentials/boq/default-values.referential';

interface EnhancedTenderEstimatorProps {
  tenderId: string;
  projectId?: string;
}

interface WorkflowStep {
  id: TenderEstimationStepCode;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  progress: number;
}

type EstimateTemplate = TenderEstimateTemplate;
type EstimateTemplateItem = TenderEstimateTemplateItem;

/** Étapes d'estimation dérivées du référentiel (aucune liste codée en dur dans l'UI). */
const buildWorkflowSteps = (): WorkflowStep[] =>
  getTenderEstimationSteps().map((step, index) => ({
    id: step.code,
    title: step.title,
    description: step.description,
    status: index === 0 ? 'in_progress' : 'pending',
    progress: 0,
  }));

const EnhancedTenderEstimator = ({ tenderId, projectId }: EnhancedTenderEstimatorProps) => {
  const [activeTab, setActiveTab] = useState('workflow');
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(() => buildWorkflowSteps());

  const estimateTemplates: EstimateTemplate[] = TENDER_ESTIMATE_TEMPLATES;


  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();
  const [seedLines, setSeedLines] = useState<TenderEstimatorLineInput[] | null>(null);

  // Lignes réelles du devis (source unique : btp.boq_lines via le noyau BOQ)
  const { lines, isLoading } = useBoqDocument({ source: 'tender_estimate', contextId: tenderId });

  const analysis = useMemo(() => {
    const byType = { material: 0, labor: 0, equipment: 0, other: 0 } as Record<string, number>;
    let total = 0;
    for (const l of lines) {
      const ht = Number(l.totalHt ?? (l.quantity ?? 0) * (l.unitPrice ?? 0)) || 0;
      total += ht;
      const key = l.resourceType && byType[l.resourceType] !== undefined ? l.resourceType : 'other';
      byType[key] += ht;
    }
    const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
    return { total, byType, pct, lineCount: lines.length };
  }, [lines]);

  const fmt = (n: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} MRU`;

  const updateWorkflowStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const completeWorkflowStep = (stepId: string) => {
    updateWorkflowStep(stepId, { status: 'completed', progress: 100 });
    
    // Auto-advance to next step
    const currentIndex = workflowSteps.findIndex(s => s.id === stepId);
    if (currentIndex < workflowSteps.length - 1) {
      const nextStep = workflowSteps[currentIndex + 1];
      updateWorkflowStep(nextStep.id, { status: 'in_progress', progress: 10 });
    }
  };

  const applyTemplate = (template: EstimateTemplate) => {
    const mapCategory = (c: EstimateTemplateItem['category']): TenderCategory =>
      c === 'labor' ? 'labour' : c === 'equipment' ? 'equipment' : c === 'overhead' ? 'overhead' : 'material';
    setSeedLines(
      template.items.map((item) => ({
        designation: item.description,
        category: mapCategory(item.category),
        unit: item.unit,
        quantity: item.estimatedQuantity || 1,
        unitPrice: item.estimatedUnitPrice,
        vatRate: 0.2,
      })),
    );
    setActiveTab('devis');
    toast({
      title: 'Template appliqué',
      description: `${template.items.length} ligne(s) ajoutée(s) au brouillon du devis.`,
    });
  };

  const exportEstimate = () => {
    if (!lines.length) {
      toast({ title: 'Aucune ligne', description: 'Le devis ne contient aucune ligne à exporter.', variant: 'destructive' });
      return;
    }
    const header = ['Designation', 'Type', 'Unite', 'Quantite', 'PU', 'Total HT'];
    const rows = lines.map((l) => [
      (l.designation || '').replace(/;/g, ','),
      l.resourceType ?? '',
      l.unit ?? '',
      String(l.quantity ?? 0),
      String(l.unitPrice ?? 0),
      String(l.totalHt ?? (l.quantity ?? 0) * (l.unitPrice ?? 0)),
    ]);
    const csv = [header, ...rows].map((r) => r.join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis-${tenderId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export réussi', description: `${lines.length} ligne(s) exportée(s).` });
  };

  const generateReport = async () => {
    try {
      toast({
        title: 'Génération du rapport',
        description: 'Le rapport d\'estimation est en cours de génération...',
      });

      if (!lines.length) {
        toast({ title: 'Aucune ligne', description: 'Le devis ne contient aucune ligne.', variant: 'destructive' });
        return;
      }
      const { BoqPdfRenderer } = await import('@/application/services/boq/BoqPdfRenderer');
      const blob = BoqPdfRenderer.render(lines, {
        title: 'Devis estimatif',
        docPrefix: 'devis',
        tenderId,
        projectId,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${tenderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Rapport généré',
        description: 'Le rapport d\'estimation a été généré avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération du rapport.',
        variant: 'destructive'
      });
    }
  };

  const getWorkflowProgress = () => {
    const totalSteps = workflowSteps.length;
    const completedSteps = workflowSteps.filter(s => s.status === 'completed').length;
    return (completedSteps / totalSteps) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Estimateur de Tender Avancé
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportEstimate}>
                <FileText className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button onClick={generateReport}>
                <Save className="h-4 w-4 mr-2" />
                Générer Rapport
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-5">
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="calculator">Calculateur</TabsTrigger>
              <TabsTrigger value="devis">Devis</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analysis">Analyse</TabsTrigger>
            </TabsList>

            <TabsContent value="devis" className="space-y-4">
              <TenderEstimatorForm
                tenderId={tenderId}
                projectId={projectId}
                seedLines={seedLines}
                onCommitted={() => queryClient.invalidateQueries({ queryKey: ['boq'] })}
              />
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Workflow d'Estimation</CardTitle>
                    <Badge variant="secondary">
                      {Math.round(getWorkflowProgress())}% Complété
                    </Badge>
                  </div>
                  <Progress value={getWorkflowProgress()} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflowSteps.map((step, index) => (
                      <Card key={step.id} className={`transition-all duration-200 ${
                        step.status === 'completed' ? 'border-success bg-success-soft' :
                        step.status === 'in_progress' ? 'border-primary bg-primary/10' :
                        'border-border'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step.status === 'completed' ? 'bg-success text-white' :
                                step.status === 'in_progress' ? 'bg-primary text-white' :
                                'bg-gray-200 text-muted-foreground'
                              }`}>
                                {step.status === 'completed' ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {step.status === 'in_progress' && (
                                <Progress value={step.progress} className="w-20" />
                              )}
                              {step.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant={step.status === 'in_progress' ? 'default' : 'outline'}
                                  onClick={() => completeWorkflowStep(step.id)}
                                >
                                  {step.status === 'in_progress' ? 'Terminer' : 'Commencer'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calculator" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calculateur Quantitatif Intégré</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdvancedQuantityCalculator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Templates d'Estimation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {estimateTemplates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                            <Badge variant="outline">{template.items.length} éléments</Badge>
                          </div>
                          <div className="space-y-2 mb-4">
                            {template.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="text-sm text-muted-foreground">
                                • {item.description}
                              </div>
                            ))}
                            {template.items.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{template.items.length - 3} autres éléments
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => applyTemplate(template)}
                            className="w-full"
                          >
                            Appliquer ce Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Estimation Totale</p>
                        <p className="text-2xl font-bold">{isLoading ? '…' : fmt(analysis.total)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Lignes main-d'œuvre</p>
                        <p className="text-2xl font-bold">{fmt(analysis.byType.labor)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-8 w-8 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">Éléments Calculés</p>
                        <p className="text-2xl font-bold">{analysis.lineCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Coûts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Matériaux</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysis.pct(analysis.byType.material)} className="w-32" />
                        <span className="font-medium">{fmt(analysis.byType.material)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Main-d'œuvre</span>
                      <div className="flex itemsagit-center gap-2">
                        <Progress value={analysis.pct(analysis.byType.labor)} className="w-32" />
                        <span className="font-medium">{fmt(analysis.byType.labor)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Équipement</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analysis.pct(analysis.byType.equipment)} className="w-32" />
                        <span className="font-medium">{fmt(analysis.byType.equipment)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analyse de Risques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Fluctuation des prix des matériaux</p>
                        <p className="text-sm text-muted-foreground">Impact potentiel sur le budget</p>
                      </div>
                      <Badge variant="destructive">Élevé</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Disponibilité de la main-d'œuvre</p>
                        <p className="text-sm text-muted-foreground">Risque de retard</p>
                      </div>
                      <Badge variant="outline">Moyen</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Conditions météorologiques</p>
                        <p className="text-sm text-muted-foreground">Impact sur le planning</p>
                      </div>
                      <Badge variant="secondary">Faible</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTenderEstimator;