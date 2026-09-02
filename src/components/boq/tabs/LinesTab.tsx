import React from 'react';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BoqLineTable } from '../BoqLineTable';

interface Props { lines: BoqLineDTO[]; workspace?: React.ReactNode; onLinesChange?: (lines: BoqLineDTO[]) => void; locked?: boolean; referentialCode?: string; }
export function LinesTab({ lines, workspace, onLinesChange, locked, referentialCode }: Props) {
  if (workspace) return <>{workspace}</>;
  return <BoqLineTable lines={lines} editable={!locked} referentialCode={referentialCode as never} onChange={(index, patch) => onLinesChange?.(lines.map((line, i) => i === index ? { ...line, ...patch } : line))} />;
}
