import React from 'react';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import type { WbsScopeValue } from '../WbsSelector';
import { DocumentPerimeter } from '../DocumentPerimeter';
import { T } from '@/components/i18n/T';

interface Props { phases?: WbsPhase[]; value?: WbsScopeValue; onChange?: (value: WbsScopeValue) => void; locked?: boolean; content?: React.ReactNode; }
export function PerimeterTab({ phases = [], value, onChange, locked, content }: Props) {
  if (content) return <>{content}</>;
  if (!value || !onChange) return <p className="text-sm text-muted-foreground"><T k="auto.perimetertab.le_perimetre_est_configure_dans_le_contexte_du_d" fallback="Le périmètre est configuré dans le contexte du document." /></p>;
  return <DocumentPerimeter phases={phases} value={value} onChange={onChange} disabled={locked} />;
}
