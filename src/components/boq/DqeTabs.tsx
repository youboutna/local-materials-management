/**src/components/boq/DqeTabs.tsx */
/**
 * DqeTabs — Onglets principaux du module DQE
 * 
 * Structure en 6 onglets pour une meilleure organisation :
 * - 📊 Résumé : KPIs, Alertes, Répartition par phase, Chaîne approvisionnement
 * - 📝 Lignes DQE : Tableau CRUD avec colonnes adaptatives
 * - 📐 Périmètre : Multi-sélection Phases/Jalons/Tâches
 * - 💰 Totaux : Récapitulatif financier + Fiscalité
 * - 📋 Contrôles : Contrôles LFR 2026 par ligne
 * - 📎 Documents : Historique, PDF, Factur-X
 * 
 * Architecture hexagonale : Aucun accès Supabase direct.
 * Toutes les données passent par les DTOs et services.
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Ruler, 
  DollarSign, 
  ShieldCheck, 
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SummaryTab } from './tabs/SummaryTab';
import { LinesTab } from './tabs/LinesTab';
import { PerimeterTab } from './tabs/PerimeterTab';
import { TotalsTab } from './tabs/TotalsTab';
import { ControlsTab } from './tabs/ControlsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqTotals } from '@/application/services/boq/BoqCalculatorService';
import type { ControlResult } from '@/application/services/boq/BoqControlsService';
import type { WbsScopeValue } from './DocumentPerimeter';

interface DqeTabsProps {
  /** Identifiant du document DQE */
  documentId: string;
  /** Identifiant du projet */
  projectId: string;
  /** Lignes du DQE */
  lines: BoqLineDTO[];
  /** Totaux calculés */
  totals: BoqTotals;
  /** Résultats des contrôles LFR 2026 */
  controls: ControlResult[];
  /** Callback pour mise à jour des lignes */
  onLinesChange?: (lines: BoqLineDTO[]) => void;
  /** Callback pour mise à jour du périmètre */
  onPerimeterChange?: (perimeter: WbsScopeValue) => void;
  /** Callback pour mise à jour des totaux */
  onTotalsUpdate?: (totals: BoqTotals) => void;
  /** État de verrouillage */
  locked?: boolean;
  /** Référentiel actif */
  referentialCode?: string;
}

export const DqeTabs: React.FC<DqeTabsProps> = ({
  documentId,
  projectId,
  lines,
  totals,
  controls,
  onLinesChange,
  onPerimeterChange,
  onTotalsUpdate,
  locked = false,
  referentialCode,
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const failedControls = controls.filter(c => !c.passed).length;

  const tabs = [
    { id: 'summary', label: 'Résumé', icon: LayoutDashboard },
    { id: 'lines', label: 'Lignes DQE', icon: FileSpreadsheet, count: lines.length },
    { id: 'perimeter', label: 'Périmètre', icon: Ruler },
    { id: 'totals', label: 'Totaux', icon: DollarSign },
    { 
      id: 'controls', 
      label: 'Contrôles', 
      icon: ShieldCheck, 
      alert: failedControls > 0, 
      count: failedControls 
    },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Barre d'onglets - Scroll horizontal sur mobile */}
      <div className="border-b bg-muted/10">
        <div className="overflow-x-auto px-4">
          <TabsList className="h-12 w-full justify-start gap-0 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.count}
                  </Badge>
                )}
                {tab.alert && (
                  <AlertCircle className="h-3 w-3 text-red-500 ml-0.5" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="p-4">
        <TabsContent value="summary" className="mt-0">
          <SummaryTab 
            lines={lines} 
            totals={totals} 
            controls={controls}
            onTotalsUpdate={onTotalsUpdate}
          />
        </TabsContent>
        
        <TabsContent value="lines" className="mt-0">
          <LinesTab 
            lines={lines} 
            onLinesChange={onLinesChange}
            locked={locked}
            referentialCode={referentialCode}
          />
        </TabsContent>
        
        <TabsContent value="perimeter" className="mt-0">
          <PerimeterTab 
            documentId={documentId} 
            projectId={projectId}
            onPerimeterChange={onPerimeterChange}
            locked={locked}
            referentialCode={referentialCode}
          />
        </TabsContent>
        
        <TabsContent value="totals" className="mt-0">
          <TotalsTab 
            totals={totals} 
            controls={controls}
          />
        </TabsContent>
        
        <TabsContent value="controls" className="mt-0">
          <ControlsTab controls={controls} />
        </TabsContent>
        
        <TabsContent value="documents" className="mt-0">
          <DocumentsTab documentId={documentId} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default DqeTabs;