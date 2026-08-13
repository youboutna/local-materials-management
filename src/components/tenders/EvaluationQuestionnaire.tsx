/**
 * EvaluationQuestionnaire
 * Questionnaire d'évaluation d'offre piloté par référentiel (critères pondérés).
 * Réutilisable : soumissions d'appel d'offres, pré-qualification fournisseur, audit conformité.
 *
 * Le composant est purement présentationnel : il calcule les scores via le référentiel
 * et remonte les résultats au parent (aucun accès données).
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, AlertCircle } from 'lucide-react';
import {
  DEFAULT_CATEGORY_WEIGHTS,
  DEFAULT_EVALUATION_CRITERIA,
  computeGlobalScore,
  checkCategoryCompleteness,
  type CategoryWeighting,
  type EvaluationCategory,
  type EvaluationCriterion,
} from '@/config/referentials/tender/evaluation-criteria.referential';

export interface EvaluationQuestionnaireResult {
  scores: Record<string, number>;
  global: number;
  byCategory: Record<EvaluationCategory, number>;
}

interface EvaluationQuestionnaireProps {
  /** Scores par code de critère */
  value: Record<string, number>;
  onChange: (result: EvaluationQuestionnaireResult) => void;
  criteria?: EvaluationCriterion[];
  weights?: CategoryWeighting[];
  readOnly?: boolean;
  title?: string;
}

export const EvaluationQuestionnaire: React.FC<EvaluationQuestionnaireProps> = ({
  value,
  onChange,
  criteria = DEFAULT_EVALUATION_CRITERIA,
  weights = DEFAULT_CATEGORY_WEIGHTS,
  readOnly = false,
  title = "Questionnaire d'évaluation",
}) => {
  const result = useMemo(() => computeGlobalScore(value, weights, criteria), [value, weights, criteria]);

  const handleScoreChange = (code: string, score: number) => {
    const next = { ...value, [code]: score };
    const computed = computeGlobalScore(next, weights, criteria);
    onChange({ scores: next, global: computed.global, byCategory: computed.byCategory });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {title}
          </span>
          <Badge variant="secondary">Score global : {result.global}/100</Badge>
        </CardTitle>
        <CardDescription>
          Notation par critère (0-100). Les pondérations proviennent du référentiel et sont appliquées automatiquement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {weights.map((weighting) => {
          const catCriteria = criteria.filter((c) => c.category === weighting.category);
          if (catCriteria.length === 0) return null;
          const completeness = checkCategoryCompleteness(value, weighting.category, criteria);

          return (
            <div key={weighting.category} className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold">{weighting.label}</h4>
                  <p className="text-xs text-muted-foreground">
                    Pondération globale : {weighting.globalWeight}%
                  </p>
                </div>
                <Badge variant="outline">{result.byCategory[weighting.category] ?? 0}/100</Badge>
              </div>

              <Progress value={result.byCategory[weighting.category] ?? 0} className="h-2" />

              {!completeness.complete && (
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  Critères obligatoires non notés : {completeness.missing.join(', ')}
                </p>
              )}

              <div className="space-y-4">
                {catCriteria.map((criterion) => (
                  <div key={criterion.code} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-sm">
                        {criterion.label}
                        {criterion.required && <span className="ml-1 text-destructive">*</span>}
                        <span className="ml-2 text-xs text-muted-foreground">({criterion.weight}%)</span>
                      </Label>
                      <Badge variant="outline">{value[criterion.code] ?? 0}/{criterion.maxScore}</Badge>
                    </div>
                    <Slider
                      value={[value[criterion.code] ?? 0]}
                      min={0}
                      max={criterion.maxScore}
                      step={1}
                      disabled={readOnly}
                      onValueChange={(v) => handleScoreChange(criterion.code, v[0])}
                    />
                    <p className="text-xs text-muted-foreground">{criterion.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EvaluationQuestionnaire;
