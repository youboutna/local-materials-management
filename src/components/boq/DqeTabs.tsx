/**
 * DqeTabs — navigation principale du document DQE.
 * Les vues métier sont injectées par DqeWorkspace afin de conserver un seul
 * chargement et une seule source de vérité pour les lignes.
 */
import React, { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, BarChart3, DollarSign, FileSpreadsheet, FolderOpen, GitCompare, LayoutDashboard, ListChecks, Ruler, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SummaryTab } from './tabs/SummaryTab';
import { LinesTab } from './tabs/LinesTab';
import { PerimeterTab } from './tabs/PerimeterTab';
import { TotalsTab } from './tabs/TotalsTab';
import { ControlsTab } from './tabs/ControlsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { BoqControlsService, type ControlResult } from '@/application/services/boq/BoqControlsService';
import type { ReferentialType } from '@/config/referentials';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import type { WbsScopeValue } from './WbsSelector';

interface DqeTabsProps {
  documentId: string;
  projectId: string;
  lines: BoqLineDTO[];
  totals?: ReturnType<typeof BoqCalculatorService.aggregate>;
  controls?: ControlResult[];
  onLinesChange?: (lines: BoqLineDTO[]) => void;
  onPerimeterChange?: (perimeter: WbsScopeValue) => void;
  locked?: boolean;
  referentialCode?: ReferentialType;
  phases?: WbsPhase[];
  perimeter?: WbsScopeValue;
  workspace?: React.ReactNode;
  comparison?: React.ReactNode;
  budget?: React.ReactNode;
}

const tabClass = 'relative flex min-w-max items-center gap-2 rounded-none border-b-2 border-transparent px-3 py-3 text-sm font-medium transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary sm:px-4';

export const DqeTabs: React.FC<DqeTabsProps> = ({
  documentId, projectId, lines, totals, controls, onLinesChange, onPerimeterChange,
  locked = false, referentialCode, phases = [], perimeter, workspace,
  comparison, budget,
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const calculatedTotals = useMemo(() => totals ?? BoqCalculatorService.aggregate(lines), [lines, totals]);
  const evaluatedControls = useMemo(() => controls ?? BoqControlsService.evaluate(lines), [controls, lines]);
  const failedControls = evaluatedControls.filter((control) => !control.passed).length;
  

  const tabs = [
    { id: 'summary', label: 'Résumé', icon: LayoutDashboard },
    { id: 'lines', label: 'Lignes DQE', icon: FileSpreadsheet, count: lines.length },
    { id: 'perimeter', label: 'Périmètre', icon: Ruler },
    { id: 'totals', label: 'Totaux', icon: DollarSign },
    { id: 'controls', label: 'Contrôles', icon: ShieldCheck, alert: failedControls > 0, count: failedControls },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'comparison', label: 'Comparaison', icon: GitCompare, emphasis: Boolean(comparison) },
    { id: 'budget', label: 'Suivi budget', icon: BarChart3, emphasis: Boolean(budget) },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="overflow-x-auto px-2 sm:px-4">
          <TabsList className="h-12 w-max min-w-full justify-start gap-0 bg-transparent p-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className={`${tabClass} ${tab.emphasis ? 'font-semibold' : ''}`}>
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 ? <Badge variant="secondary" className="ml-0.5 px-1.5 text-[11px]">{tab.count}</Badge> : null}
                  {tab.alert ? <AlertCircle className="h-3 w-3 text-destructive" aria-label="Contrôles à corriger" /> : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <TabsContent value="summary" className="mt-0"><SummaryTab lines={lines} totals={calculatedTotals} controls={evaluatedControls} /></TabsContent>
        <TabsContent value="lines" className="mt-0"><LinesTab lines={lines} workspace={workspace} onLinesChange={onLinesChange} locked={locked} referentialCode={referentialCode} /></TabsContent>
        <TabsContent value="perimeter" className="mt-0"><PerimeterTab phases={phases} value={perimeter} onChange={onPerimeterChange} locked={locked} /></TabsContent>
        <TabsContent value="totals" className="mt-0"><TotalsTab lines={lines} totals={calculatedTotals} controls={evaluatedControls} /></TabsContent>
        <TabsContent value="controls" className="mt-0"><ControlsTab controls={evaluatedControls} /></TabsContent>
        <TabsContent value="documents" className="mt-0"><DocumentsTab documentId={documentId} /></TabsContent>
        <TabsContent value="comparison" className="mt-0">{comparison ?? <EmptyTab label="Comparaison indisponible pour ce contexte" />}</TabsContent>
        <TabsContent value="budget" className="mt-0">{budget ?? <EmptyTab label="Suivi budget indisponible pour ce contexte" />}</TabsContent>
      </div>
    </Tabs>
  );
};

function EmptyTab({ label }: { label: string }) {
  return <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground"><ListChecks className="mx-auto mb-2 h-5 w-5" />{label}</div>;
}

export default DqeTabs;
