import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuantityTakeoffForm from './QuantityTakeoffForm';
import QuantityTakeoffsList from './QuantityTakeoffsList';
import AdvancedQuantityCalculator from './AdvancedQuantityCalculator';
import { useLanguage } from '@/contexts/LanguageContext';
import { getQuantityTakeoffService } from '@/application/services/QuantityTakeoffService';
import { getMaterialService } from '@/application/services/MaterialService';

interface QuantityTakeoff {
  id: string;
  element_type: string;
  unit: string;
  length: number;
  width?: number;
  height?: number;
  quantity: number;
  unit_price?: number;
  total_value?: number;
  note?: string;
  material: {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
  };
}

interface QuantityTakeoffsProps {
  projectId: string;
}

const QuantityTakeoffs = ({ projectId }: QuantityTakeoffsProps) => {
  const [takeoffs, setTakeoffs] = useState<QuantityTakeoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { t } = useLanguage();

  const fetchQuantityTakeoffs = async () => {
    try {
      const service = getQuantityTakeoffService();
      const rows = await service.getByProject(projectId);
      const transformedTakeoffs: QuantityTakeoff[] = (rows || [])
        .filter((item: any) => item?.id)
        .map((item: any) => ({
          id: item.id,
          element_type: item.element_type || '',
          unit: item.unit || '',
          length: item.length || 0,
          width: item.width || undefined,
          height: item.height || undefined,
          quantity: item.quantity || 0,
          unit_price: item.unit_price || undefined,
          total_value: item.total_value || undefined,
          note: item.note || undefined,
          material: {
            id: item.material?.id || '',
            name: item.material?.name || '',
            unit: item.material?.unit || '',
            price_per_unit: item.material?.price_per_unit || 0,
          },
        }));
      setTakeoffs(transformedTakeoffs);
    } catch (error) {
      console.error('Error fetching quantity takeoffs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les métrés.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate takeoffs from project materials (through services only)
  const fetchProjectMaterials = async () => {
    try {
      const projectMaterials = await getMaterialService().getProjectMaterials(projectId);
      if (!projectMaterials?.length) return;

      const service = getQuantityTakeoffService();
      const existing = await service.getByProject(projectId);
      const existingMaterialIds = new Set(
        (existing || []).map((t: any) => t.material_id).filter(Boolean),
      );

      const newTakeoffs = projectMaterials
        .map((pm: any) => {
          const mat = pm.material ?? pm;
          const unit = mat?.unit || 'unité';
          return {
            projectId,
            materialId: mat?.id || pm.materialId || pm.material_id || '',
            elementType: mat?.category || 'Material',
            unit,
            length: 1,
            width: unit === 'm²' || unit === 'm³' ? 1 : null,
            height: unit === 'm³' ? 1 : null,
            quantity: Number(pm.quantity ?? 0),
            note: 'Auto-généré depuis les matériaux du projet',
          };
        })
        .filter((t) => t.materialId && !existingMaterialIds.has(t.materialId));

      if (newTakeoffs.length > 0) {
        await service.createMany(newTakeoffs);
        toast({
          title: "Métrés générés",
          description: `${newTakeoffs.length} métrés automatiques créés depuis les matériaux du projet.`,
        });
      }
    } catch (error) {
      console.error('Error generating automatic takeoffs:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchProjectMaterials();
      await fetchQuantityTakeoffs();
    };
    loadData();

    // Auto-refresh KPIs when a BOQ / DQE import completes for this project
    const onImported = (e: Event) => {
      const detail = (e as CustomEvent<{ contextId?: string; projectId?: string }>).detail;
      if (!detail?.contextId || detail.contextId === projectId || detail.projectId === projectId) {
        fetchQuantityTakeoffs();
      }
    };
    window.addEventListener('boq-imported', onImported as EventListener);
    window.addEventListener('boq-kpi-refresh', onImported as EventListener);
    window.addEventListener('project-referential-changed', onImported as EventListener);
    return () => {
      window.removeEventListener('boq-imported', onImported as EventListener);
      window.removeEventListener('boq-kpi-refresh', onImported as EventListener);
      window.removeEventListener('project-referential-changed', onImported as EventListener);
    };
  }, [projectId]);

  const handleTakeoffAdded = () => {
    fetchQuantityTakeoffs();
    setIsFormDialogOpen(false);
  };

  const handleTakeoffDeleted = () => {
    fetchQuantityTakeoffs();
  };

  const calculateTotalValue = () => {
    return takeoffs.reduce((total, takeoff) => {
      return total + (takeoff.total_value ?? (takeoff.quantity * (takeoff.unit_price ?? takeoff.material.price_per_unit ?? 0)));
    }, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t('projects.tab.takeoffs')}
            </CardTitle>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('projects.tab.takeoffs') + ' ' + t('projects.add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('projects.tab.takeoffs') + ' ' + t('projects.add')}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">{t('projects.takeoffs.form.basic_info')}</TabsTrigger>
                    <TabsTrigger value="advanced">{t('projects.takeoffs.form.advanced')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <QuantityTakeoffForm
                      projectId={projectId}
                      onSubmitSuccess={handleTakeoffAdded}
                    />
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <AdvancedQuantityCalculator projectId={projectId} onPersisted={() => { handleTakeoffAdded(); setIsFormDialogOpen(false); }} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-adrar-600">{takeoffs.length}</p>
              <p className="text-sm text-gray-600">{t('projects.takeoffs.elements.measured')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-terracotta-600">
                {calculateTotalValue().toLocaleString('fr-FR')} MRU
              </p>
              <p className="text-sm text-gray-600">{t('projects.takeoffs.total.value')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {takeoffs.reduce((total, takeoff) => total + takeoff.quantity, 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">{t('projects.takeoffs.total.quantity')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Takeoffs List */}
      <QuantityTakeoffsList
        projectId={projectId}
      />
    </div>
  );
};

export default QuantityTakeoffs;
