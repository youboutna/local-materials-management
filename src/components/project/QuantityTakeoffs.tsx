import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QuantityTakeoffsList from './QuantityTakeoffsList';
import { BoqWorkspace } from '@/components/boq/BoqWorkspace';
import { BoqImportDialog } from '@/components/boq/BoqImportDialog';
import type { ReferentialType } from '@/config/referentials';
import { useLanguage } from '@/contexts/LanguageContext';
import { getQuantityTakeoffService } from '@/application/services/QuantityTakeoffService';
import { getMaterialService } from '@/application/services/MaterialService';
import { useQuantityTakeoffSync } from '@/hooks/hexagonal/useQuantityTakeoffSync';
import { T } from '@/components/i18n/T';

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
  /** Référentiel projet courant — piloté par la page appelante. */
  referentialCode?: ReferentialType;
  /** Contexte phase optionnel : rattache les imports/lignes à la phase. */
  phaseId?: string;
}

const QuantityTakeoffs = ({ projectId, referentialCode, phaseId }: QuantityTakeoffsProps) => {
  const [takeoffs, setTakeoffs] = useState<QuantityTakeoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const { t } = useLanguage();
  const syncToBoq = useQuantityTakeoffSync(projectId);

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card — barre d'actions unique du métré (import + génération + saisie DQE) */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t('projects.tab.takeoffs')}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <BoqImportDialog
                source="quantity_takeoff"
                contextId={projectId}
                phaseId={phaseId}
                title="Importer un BOQ / DQE (PDF, Excel, CSV)"
                trigger={
                  <Button size="sm" variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> <T k="auto.quantitytakeoffs.import_boq" fallback="Import BOQ" />
                  </Button>
                }
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncToBoq.mutate()}
                disabled={syncToBoq.isPending || takeoffs.length === 0}
                title="Créer les lignes DQE et les ressources de phase à partir des métrés"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncToBoq.isPending ? 'animate-spin' : ''}`} />
                <T k="auto.quantitytakeoffs.generer_le_dqe" fallback="Générer le DQE" />
              </Button>
              {/* Saisie manuelle : déléguée au module DQE (moteur de métré unifié :
                  types d'ouvrage, ouvertures déduites, recommandations, WBS, fiscalité). */}
              <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    <T k="auto.quantitytakeoffs.saisir_via_dqe" fallback="Saisir via DQE" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('projects.tab.takeoffs') + ' — ' + t('projects.add')}</DialogTitle>
                    <DialogDescription>
                      Saisie et import des métrés via le module DQE unifié — calcul par type
                      d'ouvrage, déduction des ouvertures et recommandations appliqués
                      automatiquement, puis workflow de validation et dispatching.
                    </DialogDescription>
                  </DialogHeader>
                  <BoqWorkspace
                    source="quantity_takeoff"
                    contextId={projectId}
                    projectId={projectId}
                    mode="planning"
                    referentialCode={referentialCode}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{takeoffs.length}</p>
              <p className="text-sm text-muted-foreground">{t('projects.takeoffs.elements.measured')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-foreground">
                {calculateTotalValue().toLocaleString('fr-FR')} MRU
              </p>
              <p className="text-sm text-muted-foreground">{t('projects.takeoffs.total.value')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {takeoffs.reduce((total, takeoff) => total + takeoff.quantity, 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">{t('projects.takeoffs.total.quantity')}</p>
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
