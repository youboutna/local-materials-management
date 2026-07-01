/**
 * EvaluationPanelTabs
 * Panneau d'évaluation avec 3 sous-onglets (Admin / Technique / Financier).
 * Critères pondérés depuis le référentiel `evaluation-criteria.referential`.
 * Score global auto-calculé.
 *
 * @see .lovable/plan.md — Lot 1
 */

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  DEFAULT_EVALUATION_CRITERIA,
  DEFAULT_CATEGORY_WEIGHTS,
  computeCategoryScore,
  computeGlobalScore,
  checkCategoryCompleteness,
  type EvaluationCategory,
} from '@/config/referentials/tender';

export interface EvaluationPanelTabsProps {
  submissionId: string;
  supplierName?: string;
  initialScores?: Record<string, number>;
  locked?: boolean;
  onSave?: (scores: Record<string, number>, global: number) => void;
}

export function EvaluationPanelTabs({
  supplierName,
  initialScores = {},
  locked = false,
  onSave,
}: EvaluationPanelTabsProps) {
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [activeCategory, setActiveCategory] = useState<EvaluationCategory>('administrative');

  const setScore = (code: string, val: number) => {
    if (locked) return;
    setScores((prev) => ({ ...prev, [code]: Math.max(0, Math.min(100, val)) }));
  };

  const global = useMemo(() => computeGlobalScore(scores), [scores]);
  const completeness = useMemo(() => ({
    administrative: checkCategoryCompleteness(scores, 'administrative'),
    technical: checkCategoryCompleteness(scores, 'technical'),
    financial: checkCategoryCompleteness(scores, 'financial'),
  }), [scores]);

  const criteriaByCat = useMemo(() => ({
    administrative: DEFAULT_EVALUATION_CRITERIA.filter((c) => c.category === 'administrative'),
    technical: DEFAULT_EVALUATION_CRITERIA.filter((c) => c.category === 'technical'),
    financial: DEFAULT_EVALUATION_CRITERIA.filter((c) => c.category === 'financial'),
  }), []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            Évaluation {supplierName ? `— ${supplierName}` : ''}
            {locked && <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Verrouillée</Badge>}
          </CardTitle>
          <div className="flex items-center gap-4">
            <ScoreBadge label="Global" value={global.global} highlighted />
            <ScoreBadge label="Admin" value={global.byCategory.administrative} />
            <ScoreBadge label="Tech" value={global.byCategory.technical} />
            <ScoreBadge label="Fin" value={global.byCategory.financial} />
          </div>
        </div>
        <Progress value={global.global} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as EvaluationCategory)}>
          <TabsList className="grid grid-cols-3 w-full">
            {DEFAULT_CATEGORY_WEIGHTS.map((w) => {
              const done = completeness[w.category].complete;
              return (
                <TabsTrigger key={w.category} value={w.category} className="gap-2">
                  {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                  {w.label}
                  <Badge variant="outline" className="ml-1 h-5 text-[10px]">{w.globalWeight}%</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(['administrative', 'technical', 'financial'] as EvaluationCategory[]).map((cat) => (
            <TabsContent key={cat} value={cat} className="space-y-2 pt-3">
              {criteriaByCat[cat].map((c) => (
                <div key={c.code} className="flex items-center gap-3 rounded border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.label}</span>
                      {c.required && <Badge variant="outline" className="h-4 text-[10px]">Requis</Badge>}
                      <Badge variant="secondary" className="h-4 text-[10px]">Poids {c.weight}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={c.maxScore}
                      value={scores[c.code] ?? ''}
                      onChange={(e) => setScore(c.code, Number(e.target.value))}
                      disabled={locked}
                      className="w-24 h-8 text-right"
                      placeholder="0-100"
                    />
                    <span className="text-xs text-muted-foreground w-6">/{c.maxScore}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
                <span>Score {cat} pondéré :</span>
                <span className="font-semibold">{computeCategoryScore(scores, cat).toFixed(2)} / 100</span>
              </div>
              {!completeness[cat].complete && (
                <p className="text-xs text-amber-600">
                  Critères manquants : {completeness[cat].missing.join(', ')}
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {!locked && (
          <div className="flex justify-end mt-4">
            <Button onClick={() => onSave?.(scores, global.global)}>Enregistrer l'évaluation</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ label, value, highlighted }: { label: string; value: number; highlighted?: boolean }) {
  return (
    <div className={`flex flex-col items-end ${highlighted ? 'text-primary' : 'text-muted-foreground'}`}>
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
      <span className={`font-semibold ${highlighted ? 'text-lg' : 'text-sm'}`}>{value.toFixed(1)}</span>
    </div>
  );
}

export default EvaluationPanelTabs;
