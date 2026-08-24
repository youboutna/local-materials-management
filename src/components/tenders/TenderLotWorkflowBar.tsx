/**
 * TenderLotWorkflowBar — statut & attribution au niveau lot.
 * Transitions: draft → published → under_evaluation → awarded | cancelled.
 */
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Award, Ban, Gavel, Send } from 'lucide-react';
import type { TenderLotRecord, TenderLotStatus } from '@/dtos/transforms/TenderLotTransformer';
import { useAwardTenderLot, useLotSubmissions, useSetTenderLotStatus } from '@/hooks/hexagonal/useTenderLotsHex';

const STATUS_META: Record<TenderLotStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
  published: { label: 'Publié', className: 'bg-primary text-primary-foreground' },
  under_evaluation: { label: 'En évaluation', className: 'bg-warning text-warning-foreground' },
  awarded: { label: 'Attribué', className: 'bg-success text-success-foreground' },
  cancelled: { label: 'Annulé', className: 'bg-destructive text-destructive-foreground' },
};

const NEXT: Record<TenderLotStatus, TenderLotStatus[]> = {
  draft: ['published', 'cancelled'],
  published: ['under_evaluation', 'cancelled'],
  under_evaluation: ['cancelled'],
  awarded: [],
  cancelled: ['draft'],
};

const ACTION_ICON: Partial<Record<TenderLotStatus, React.ReactNode>> = {
  published: <Send className="h-3.5 w-3.5" />,
  under_evaluation: <Gavel className="h-3.5 w-3.5" />,
  cancelled: <Ban className="h-3.5 w-3.5" />,
};

export const TenderLotStatusBadge: React.FC<{ status?: TenderLotStatus }> = ({ status = 'draft' }) => {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return <Badge className={`text-xs ${meta.className}`}>{meta.label}</Badge>;
};

interface Props {
  tenderId: string;
  lot: Pick<TenderLotRecord, 'id' | 'status' | 'awardedTo' | 'awardedAmount' | 'estimatedAmount'>;
  readOnly?: boolean;
}

const TenderLotWorkflowBar: React.FC<Props> = ({ tenderId, lot, readOnly }) => {
  const status = (lot.status ?? 'draft') as TenderLotStatus;
  const setStatus = useSetTenderLotStatus(tenderId);
  const award = useAwardTenderLot(tenderId);
  const { data: submissions } = useLotSubmissions(status === 'under_evaluation' ? lot.id : undefined);
  const [selectedSubmission, setSelectedSubmission] = useState<string>('');
  const [manualWinner, setManualWinner] = useState('');

  const canAward = status === 'under_evaluation';

  const handleAward = () => {
    const sub = (submissions ?? []).find((s: any) => s.id === selectedSubmission);
    const awardedTo = sub?.supplier_name ?? manualWinner.trim();
    if (!awardedTo) return;
    award.mutate({
      id: lot.id,
      awardedTo,
      awardedSubmissionId: sub?.id ?? null,
      awardedAmount: lot.estimatedAmount ?? null,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
      <TenderLotStatusBadge status={status} />

      {status === 'awarded' && lot.awardedTo && (
        <span className="text-sm text-muted-foreground">
          Attributaire : <span className="font-medium text-foreground">{lot.awardedTo}</span>
        </span>
      )}

      {!readOnly && (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {NEXT[status].map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === 'cancelled' ? 'ghost' : 'outline'}
              className="gap-1"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ id: lot.id, status: next })}
            >
              {ACTION_ICON[next]}
              {next === 'published' ? 'Publier le lot' : next === 'under_evaluation' ? 'Évaluer' : STATUS_META[next].label}
            </Button>
          ))}

          {canAward && (
            <>
              {(submissions ?? []).length > 0 ? (
                <Select value={selectedSubmission} onValueChange={setSelectedSubmission}>
                  <SelectTrigger className="h-9 w-56">
                    <SelectValue placeholder="Soumission retenue" />
                  </SelectTrigger>
                  <SelectContent>
                    {(submissions ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.supplier_name ?? s.supplier_email ?? s.id.slice(0, 8)}
                        {s.total_score != null ? ` — ${s.total_score}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-9 w-56"
                  placeholder="Nom de l'attributaire"
                  value={manualWinner}
                  onChange={(e) => setManualWinner(e.target.value)}
                />
              )}
              <Button
                size="sm"
                className="gap-1"
                disabled={award.isPending || (!selectedSubmission && !manualWinner.trim())}
                onClick={handleAward}
              >
                <Award className="h-3.5 w-3.5" />
                Attribuer
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TenderLotWorkflowBar;
