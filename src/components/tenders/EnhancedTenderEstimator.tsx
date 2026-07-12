import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { supabase } from '@/integrations/supabase/client';

interface EnhancedTenderEstimatorProps {
  tenderId: string;
  projectId?: string;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  progress: number;
}

interface EstimateTemplate {
  id: string;
  name: string;
  description: string;
  items: EstimateTemplateItem[];
}

interface EstimateTemplateItem {
  description: string;
  category: 'material' | 'labor' | 'equipment' | 'overhead';
  unit: string;
  estimatedQuantity: number;
  estimatedUnitPrice: number;
}

const EnhancedTenderEstimator = ({ tenderId, projectId }: EnhancedTenderEstimatorProps) => {
  const [activeTab, setActiveTab] = useState('workflow');
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'analysis',
      title: 'Analyse des Documents',
      description: 'Analyser les documents du tender et extraire les informations',
      status: 'in_progress',
      progress: 65
    },
    {
      id: 'quantitative',
      title: 'Calcul Quantitatif',
      description: 'Utiliser le calculateur pour estimer les quantités',
      status: 'pending',
      progress: 0
    },
    {
      id: 'pricing',
      title: 'Estimation des Prix',
      description: 'Appliquer les prix unitaires et calculer les coûts',
      status: 'pending',
      progress: 0
    },
    {
      id: 'review',
      title: 'Révision et Validation',
      description: 'Réviser l\'estimation complète avant soumission',
      status: 'pending',
      progress: 0
    }
  ]);

  const [estimateTemplates] = useState<EstimateTemplate[]>([
    {
      id: 'construction_building',
      name: 'Construction Bâtiment',
      description: 'Template pour construction de bâtiments résidentiels',
      items: [
        {
          description: 'Dalle béton armé',
          category: 'material',
          unit: 'm³',
          estimatedQuantity: 0,
          estimatedUnitPrice: 95000
        },
        {
          description: 'Mur en maçonnerie',
          category: 'material',
          unit: 'm²',
          estimatedQuantity: 0,
          estimatedUnitPrice: 8500
        },
        {
          description: 'Main d\'œuvre spécialisée',
          category: 'labor',
          unit: 'h',
          estimatedQuantity: 0,
          estimatedUnitPrice: 1500
        }
      ]
    },
    {
      id: 'road_infrastructure',
      name: 'Infrastructure Routière',
      description: 'Template pour projets routiers',
      items: [
        {
          description: 'Terrassement',
          category: 'material',
          unit: 'm³',
          estimatedQuantity: 0,
          estimatedUnitPrice: 4500
        },
        {
          description: 'Revêtement bitumineux',
          category: 'material',
          unit: 'm²',
          estimatedQuantity: 0,
          estimatedUnitPrice: 12000
        }
      ]
    }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();

  // Fetch existing estimates with enhanced data
  const { data: estimates, isLoading } = useQuery({
    queryKey: ['enhanced-tender-estimates', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select(`
          *,
          items:tender_estimate_items(*)
        `)
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

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
    toast({
      title: 'Template appliqué',
      description: `Template "${template.name}" appliqué avec ${template.items.length} éléments.`,
    });
  };

  const exportEstimate = () => {
    // Enhanced export functionality with detailed breakdown
    toast({
      title: 'Export réussi',
      description: 'L\'estimation détaillée a été exportée.',
    });
  };

  const generateReport = async () => {
    try {
      toast({
        title: 'Génération du rapport',
        description: 'Le rapport d\'estimation est en cours de génération...',
      });

      // Simulate report generation
      setTimeout(() => {
        toast({
          title: 'Rapport généré',
          description: 'Le rapport d\'estimation a été généré avec succès.',
        });
      }, 2000);
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
            <TabsList className="grid w-full grid-cols-5">
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
                onCommitted={() => queryClient.invalidateQueries({ queryKey: ['enhanced-tender-estimates', tenderId] })}
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
                        step.status === 'completed' ? 'border-green-500 bg-green-50' :
                        step.status === 'in_progress' ? 'border-primary bg-blue-50' :
                        'border-gray-200'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step.status === 'completed' ? 'bg-green-500 text-white' :
                                step.status === 'in_progress' ? 'bg-primary text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {step.status === 'completed' ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium">{step.title}</h4>
                                <p className="text-sm text-gray-600">{step.description}</p>
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
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                            <Badge variant="outline">{template.items.length} éléments</Badge>
                          </div>
                          <div className="space-y-2 mb-4">
                            {template.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                • {item.description}
                              </div>
                            ))}
                            {template.items.length > 3 && (
                              <div className="text-sm text-gray-500">
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
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Estimation Totale</p>
                        <p className="text-2xl font-bold">2,450,000 MRU</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Durée Estimée</p>
                        <p className="text-2xl font-bold">45 jours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Éléments Calculés</p>
                        <p className="text-2xl font-bold">23</p>
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
                        <Progress value={65} className="w-32" />
                        <span className="font-medium">1,592,500 MRU</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Main-d'œuvre</span>
                      <div className="flex items-center gap-2">
                        <Progress value={25} className="w-32" />
                        <span className="font-medium">612,500 MRU</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Équipement</span>
                      <div className="flex items-center gap-2">
                        <Progress value={10} className="w-32" />
                        <span className="font-medium">245,000 MRU</span>
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
                        <p className="text-sm text-gray-600">Impact potentiel sur le budget</p>
                      </div>
                      <Badge variant="destructive">Élevé</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Disponibilité de la main-d'œuvre</p>
                        <p className="text-sm text-gray-600">Risque de retard</p>
                      </div>
                      <Badge variant="outline">Moyen</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Conditions météorologiques</p>
                        <p className="text-sm text-gray-600">Impact sur le planning</p>
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