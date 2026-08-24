/**
 * QuantityTakeoffs — Métré & DQE (vue unique).
 *
 * Les métrés ne sont plus saisis ni listés séparément : ils sont calculés
 * automatiquement depuis les ressources du projet (matériaux + moteur de métré)
 * puis matérialisés en LIGNES DQE. Cette vue n'expose donc que :
 *  - le bouton « Calcul métré » (recalcul manuel : ressources → métrés → DQE),
 *  - le module DQE (lignes éditables, ajout/suppression, import, récapitulatif
 *    fiscal Total HT / TVA / Net à payer).
 *
 * Supprimés (obsolètes) : liste des métrés, compteurs « Éléments mesurés /
 * Valeur totale / Quantité totale », boutons « Saisir via DQE » et
 * « Générer le DQE ».
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BoqWorkspace } from '@/components/boq/BoqWorkspace';
import type { ReferentialType } from '@/config/referentials';
import { useLanguage } from '@/contexts/LanguageContext';
import { getQuantityTakeoffService } from '@/application/services/QuantityTakeoffService';
import { getMaterialService } from '@/application/services/MaterialService';
import { useQuantityTakeoffSync } from '@/hooks/hexagonal/useQuantityTakeoffSync';
import { T } from '@/components/i18n/T';

interface QuantityTakeoffsProps {
  projectId: string;
  /** Référentiel projet courant — piloté par la page appelante. */
  referentialCode?: ReferentialType;
  /**
   * Contexte phase optionnel. Les lignes DQE restent portées par le projet
   * (contexte unique) ; la phase sert au dispatching effectué par le module DQE.
   */
  phaseId?: string;
}

const QuantityTakeoffs = ({ projectId, referentialCode, phaseId }: QuantityTakeoffsProps) => {
  const { t } = useLanguage();
  const syncToBoq = useQuantityTakeoffSync(projectId, phaseId);
  const [computing, setComputing] = useState(false);

  /**
   * Calcul automatique : dérive les métrés manquants depuis les ressources
   * matériaux du projet (dimensions selon l'unité), sans doublon.
   */
  const computeTakeoffsFromResources = useCallback(async (): Promise<number> => {
    const projectMaterials = await getMaterialService().getProjectMaterials(projectId);
    if (!projectMaterials?.length) return 0;

    const service = getQuantityTakeoffService();
    const existing = await service.getByProject(projectId);
    const existingMaterialIds = new Set(
      (existing || []).map((row: any) => row.material_id ?? row.material?.id).filter(Boolean),
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
          note: 'Calcul automatique depuis les ressources du projet',
        };
      })
      .filter((row) => row.materialId && !existingMaterialIds.has(row.materialId));

    if (newTakeoffs.length > 0) await service.createMany(newTakeoffs);
    return newTakeoffs.length;
  }, [projectId]);

  /** Recalcul manuel : ressources → métrés → lignes DQE + ressources de phase. */
  const handleRecompute = useCallback(async () => {
    setComputing(true);
    try {
      await computeTakeoffsFromResources();
      await syncToBoq.mutateAsync();
    } catch (error) {
      console.error('Recalcul du métré impossible:', error);
      toast({
        title: 'Erreur',
        description: 'Le calcul automatique du métré a échoué.',
        variant: 'destructive',
      });
    } finally {
      setComputing(false);
    }
  }, [computeTakeoffsFromResources, syncToBoq]);

  // Calcul automatique au premier affichage (idempotent, sans doublon).
  useEffect(() => {
    let cancelled = false;
    computeTakeoffsFromResources().catch((error) =>
      console.error('Calcul automatique du métré impossible:', error),
    );
    return () => {
      cancelled = true;
      void cancelled;
    };
  }, [computeTakeoffsFromResources]);

  const busy = computing || syncToBoq.isPending;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5" />
            {t('projects.tab.takeoffs')}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRecompute}
            disabled={busy}
            title="Recalculer les quantités depuis les ressources et régénérer les lignes DQE"
          >
            <Calculator className={`mr-2 h-4 w-4 ${busy ? 'animate-pulse' : ''}`} />
            <T k="auto.quantitytakeoffs.calcul_metre" fallback="Calcul métré" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          <T
            k="auto.quantitytakeoffs.auto_hint"
            fallback="Les quantités sont calculées automatiquement depuis les ressources (types d'ouvrage, déduction des ouvertures, recommandations) et s'affichent directement dans les lignes DQE, éditables ci-dessous."
          />
        </p>
      </CardHeader>
      <CardContent>
        <BoqWorkspace
          source="quantity_takeoff"
          contextId={projectId}
          projectId={projectId}
          mode="planning"
          referentialCode={referentialCode}
        />
        {phaseId && (
          <p className="mt-2 text-xs text-muted-foreground">
            <T
              k="auto.quantitytakeoffs.phase_dispatch_hint"
              fallback="Les lignes validées sont dispatchées vers cette phase (ressources, tâches, jalons)."
            />
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default QuantityTakeoffs;
