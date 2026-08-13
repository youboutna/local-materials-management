/**
 * Regulatory Compliance Checklist
 * Questionnaire de conformité réglementaire (marchés publics) piloté par référentiel.
 * Chaque item = une question + une pièce justificative attendue + une action document.
 *
 * ✅ Hexagonal : UI → Services (ComplianceService / DocumentService via ProjectDocumentUpload)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileCheck, Info, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/use-auth';
import { getComplianceService } from '@/application/services/ComplianceService';
import ProjectDocumentUpload from '@/components/project/ProjectDocumentUpload';
import { getDocumentTypeLabel } from '@/config/referentials/documents/document-types.referential';
import {
  REGULATORY_COMPLIANCE_DOMAINS,
  REGULATORY_ANSWER_LABELS,
  REGULATORY_TOTAL_ITEMS,
  answerToComplianceStatus,
  type RegulatoryAnswer,
  type RegulatoryCheckItem,
  type RegulatoryDomain,
} from '@/config/referentials/compliance/regulatory-compliance.referential';
import type { ComplianceItemDTO } from '@/dtos/entities/ComplianceDTO';

interface Props {
  projectId?: string | null;
  /** false en mode création (projet non persisté) : le questionnaire reste consultable */
  canPersist?: boolean;
  onChanged?: () => void;
}

const ANSWER_COLORS: Record<RegulatoryAnswer, string> = {
  compliant: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  non_compliant: 'bg-red-100 text-red-800',
  not_applicable: 'bg-gray-100 text-gray-700',
};

function statusToAnswer(status?: string): RegulatoryAnswer {
  switch (status) {
    case 'approved':
      return 'compliant';
    case 'in_progress':
      return 'in_progress';
    case 'rejected':
    case 'requires_action':
      return 'non_compliant';
    default:
      return 'not_applicable';
  }
}

function itemCodeOf(item: ComplianceItemDTO): string | undefined {
  return item.subcategory || item.externalReferences?.[0] || item.external_references?.[0];
}

const RegulatoryComplianceChecklist: React.FC<Props> = ({ projectId, canPersist = false, onChanged }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const complianceService = useMemo(() => getComplianceService(), []);

  const [answers, setAnswers] = useState<Record<string, RegulatoryAnswer>>({});
  const [existing, setExisting] = useState<Record<string, ComplianceItemDTO>>({});
  const [loading, setLoading] = useState(false);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{ domain: RegulatoryDomain; item: RegulatoryCheckItem } | null>(null);

  const loadItems = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const items = await complianceService.getComplianceByProject(projectId);
      const map: Record<string, ComplianceItemDTO> = {};
      const nextAnswers: Record<string, RegulatoryAnswer> = {};
      items.forEach((it) => {
        const code = itemCodeOf(it);
        if (!code) return;
        map[code] = it;
        nextAnswers[code] = statusToAnswer(it.status);
      });
      setExisting(map);
      setAnswers((prev) => ({ ...nextAnswers, ...prev }));
    } catch (error) {
      console.warn('[RegulatoryComplianceChecklist] load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, complianceService]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const answeredCount = REGULATORY_COMPLIANCE_DOMAINS.reduce(
    (sum, d) => sum + d.items.filter((i) => answers[i.code] && answers[i.code] !== 'not_applicable').length,
    0
  );
  const compliantCount = REGULATORY_COMPLIANCE_DOMAINS.reduce(
    (sum, d) => sum + d.items.filter((i) => answers[i.code] === 'compliant').length,
    0
  );
  const completion = Math.round((compliantCount / REGULATORY_TOTAL_ITEMS) * 100);

  const handleAnswer = async (
    domain: RegulatoryDomain,
    item: RegulatoryCheckItem,
    answer: RegulatoryAnswer
  ) => {
    setAnswers((prev) => ({ ...prev, [item.code]: answer }));

    if (!canPersist || !projectId) return;

    setSavingCode(item.code);
    try {
      const status = answerToComplianceStatus(answer);
      const current = existing[item.code];
      if (current) {
        const updated = await complianceService.updateComplianceItem(current.id, {
          status,
          description: item.question,
        } as never);
        setExisting((prev) => ({ ...prev, [item.code]: updated }));
      } else {
        const created = await complianceService.createComplianceItem({
          type: domain.complianceType,
          title: item.question,
          description: item.hint || item.legalRef || item.question,
          status,
          priority: item.mandatory ? 'high' : 'medium',
          responsible: user?.id || 'unassigned',
          projectId,
          category: domain.key,
          subcategory: item.code,
          externalReferences: item.legalRef ? [item.code, item.legalRef] : [item.code],
          riskLevel: item.mandatory ? 'high' : 'low',
          mitigationRequired: answer === 'non_compliant',
          createdBy: user?.id || 'system',
        });
        setExisting((prev) => ({ ...prev, [item.code]: created }));
      }
      onChanged?.();
    } catch (error) {
      console.error('[RegulatoryComplianceChecklist] save failed:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Enregistrement du contrôle impossible.',
        variant: 'destructive',
      });
    } finally {
      setSavingCode(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-5 w-5" />
            Questionnaire de conformité réglementaire
            <Badge variant="outline" className="ml-auto">
              {compliantCount}/{REGULATORY_TOTAL_ITEMS} conformes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={completion} />
          <p className="text-xs text-muted-foreground">
            {answeredCount} contrôle(s) renseigné(s) — référentiel marchés publics (administratif, procédure,
            études, environnement, HSE, garanties).
          </p>
          {!canPersist && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Mode création : les réponses sont conservées localement et enregistrées après la sauvegarde du projet.
              </AlertDescription>
            </Alert>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des contrôles…
            </div>
          )}
        </CardContent>
      </Card>

      {REGULATORY_COMPLIANCE_DOMAINS.map((domain) => (
        <Card key={domain.key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{domain.label}</CardTitle>
            <p className="text-xs text-muted-foreground">{domain.description}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {domain.items.map((item) => {
              const answer = answers[item.code];
              return (
                <div key={item.code} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-[240px] flex-1">
                      <p className="text-sm font-medium">
                        {item.question}
                        {item.mandatory && <span className="text-destructive"> *</span>}
                      </p>
                      {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
                      {item.legalRef && (
                        <p className="text-xs text-muted-foreground italic">Réf. : {item.legalRef}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Pièce attendue : {getDocumentTypeLabel(item.expectedDocumentType)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {answer && <Badge className={ANSWER_COLORS[answer]}>{REGULATORY_ANSWER_LABELS[answer]}</Badge>}
                      {savingCode === item.code && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={answer ?? undefined}
                      onValueChange={(value) => handleAnswer(domain, item, value as RegulatoryAnswer)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Réponse au contrôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(REGULATORY_ANSWER_LABELS) as RegulatoryAnswer[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {REGULATORY_ANSWER_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadTarget({ domain, item })}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Ajouter la pièce
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!uploadTarget} onOpenChange={(open) => !open && setUploadTarget(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pièce justificative réglementaire</DialogTitle>
            <DialogDescription>{uploadTarget?.item.question}</DialogDescription>
          </DialogHeader>
          {uploadTarget && (
            <ProjectDocumentUpload
              projectId={projectId ?? null}
              context="compliance"
              contextLabel={`${uploadTarget.domain.label} — ${uploadTarget.item.code}`}
              defaultDocumentType={uploadTarget.item.expectedDocumentType}
              onDocumentUploaded={() => {
                setUploadTarget(null);
                onChanged?.();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {canPersist && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Save className="h-3 w-3" />
          Chaque réponse est enregistrée automatiquement.
        </div>
      )}
    </div>
  );
};

export default RegulatoryComplianceChecklist;
