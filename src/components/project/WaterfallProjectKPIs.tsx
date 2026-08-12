import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  DollarSign, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BarChart3
} from 'lucide-react';

import { useProjectManager } from "@/hooks/useProjectManager";

interface WaterfallProjectKPIsProps {}

/** Vues typées des indicateurs calculés exposés par le pilotage projet */
interface EvmView {
  costPerformanceIndex: number;
  schedulePerformanceIndex: number;
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  estimateAtCompletion: number;
  varianceAtCompletion: number;
  estimateToComplete: number;
}
interface PertView {
  totalExpectedDuration: number;
  criticalPath: unknown[];
}
interface GanttView {
  tasks: Array<{ text: string; progress: number }>;
}

const EMPTY_EVM: EvmView = {
  costPerformanceIndex: 0,
  schedulePerformanceIndex: 0,
  earnedValue: 0,
  plannedValue: 0,
  actualCost: 0,
  estimateAtCompletion: 0,
  varianceAtCompletion: 0,
  estimateToComplete: 0,
};

const WaterfallProjectKPIs: React.FC<WaterfallProjectKPIsProps> = () => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const { data, runChecks, acknowledgeAlert } = useProjectManager();

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  if (!data) {
    return (
      <div className="p-4">
        <span className="text-gray-500">Chargement des indicateurs...</span>
      </div>
    );
  }

  const { alerts } = data;
  const progress: number = data.progress ?? 0;
  const evmData: EvmView = { ...EMPTY_EVM, ...((data.evmData as Partial<EvmView>) ?? {}) };
  const pertData: PertView = {
    totalExpectedDuration: 0,
    criticalPath: [],
    ...((data.pertData as Partial<PertView>) ?? {}),
  };
  const ganttData: GanttView = { tasks: [], ...((data.ganttData as Partial<GanttView>) ?? {}) };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="text-green-500" />
            <span>{progress.toFixed(2)}%</span>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardContent>
      </Card>

      {/* Valeur acquise (EVM) */}
      <Card>
        <CardHeader>
          <CardTitle>Valeur acquise (EVM)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              {evmData.costPerformanceIndex >= 1 ? (
                <TrendingUp className="text-green-500" />
              ) : (
                <TrendingDown className="text-red-500" />
              )}
              <span>
                CPI: {evmData.costPerformanceIndex.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="text-blue-500" />
              <span>SPI: {evmData.schedulePerformanceIndex.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>EV: {evmData.earnedValue.toFixed(0)}</div>
              <div>PV: {evmData.plannedValue.toFixed(0)}</div>
              <div>AC: {evmData.actualCost.toFixed(0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyse PERT */}
      <Card>
        <CardHeader>
          <CardTitle>PERT</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div>Durée attendue : {pertData.totalExpectedDuration.toFixed(1)} j</div>
            <div className="text-sm text-gray-600 mt-2">
              Chemin critique: {pertData.criticalPath.length} tâches
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <Badge variant="outline" className="bg-green-100 text-green-700">
              Aucune alerte
            </Badge>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <li
                  key={alert.id}
                  className="flex items-center justify-between bg-red-50 p-2 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="text-red-500" size={18} />
                    <span className="text-sm">
                      [{alert.severity.toUpperCase()}] {alert.title}
                    </span>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() =>
                        acknowledgeAlert(alert.id, "user123", "Ack via KPIs")
                      }
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                    >
                      Ack
                    </button>
                  )}
                </li>
              ))}
              {alerts.length > 3 && (
                <div className="text-sm text-gray-500 text-center">
                  +{alerts.length - 3} autres alertes
                </div>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Indicateurs financiers */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Indicateurs financiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Estimation à l'achèvement</div>
              <div className="text-lg font-semibold">
                {evmData.estimateAtCompletion.toLocaleString()} €
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Variance à l'achèvement</div>
              <div className={`text-lg font-semibold ${evmData.varianceAtCompletion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {evmData.varianceAtCompletion.toLocaleString()} €
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Coût restant estimé</div>
              <div className="text-lg font-semibold">
                {evmData.estimateToComplete.toLocaleString()} €
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Valeur acquise</div>
              <div className="text-lg font-semibold text-blue-600">
                {evmData.earnedValue.toLocaleString()} €
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagramme de Gantt (résumé) */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Tâches Gantt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ganttData.tasks.length > 0 ? (
              ganttData.tasks.slice(0, 5).map((task, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{task.text}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-blue-500 rounded" 
                        style={{ width: `${task.progress * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {Math.round(task.progress * 100)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Aucune tâche Gantt disponible
              </div>
            )}
            {ganttData.tasks.length > 5 && (
              <div className="text-sm text-gray-500 text-center">
                +{ganttData.tasks.length - 5} autres tâches
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterfallProjectKPIs;