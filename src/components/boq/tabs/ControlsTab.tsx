import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ControlResult } from '@/application/services/boq/BoqControlsService';
interface Props { controls: ControlResult[]; }
export function ControlsTab({ controls }: Props) { const failed = controls.filter((control) => !control.passed).length; return <div className="space-y-3"><Alert variant={failed ? 'destructive' : 'default'}><AlertTitle>{failed ? `${failed} contrôle(s) à corriger` : 'Document conforme'}</AlertTitle><AlertDescription>Les contrôles métier et fiscaux sont recalculés à partir des lignes du document.</AlertDescription></Alert><div className="divide-y rounded-md border">{controls.map((control) => <div key={control.code} className="flex items-start gap-3 p-3"><div className="mt-0.5">{control.passed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}</div><div><p className="text-sm font-medium">{control.label}</p><p className="text-xs text-muted-foreground">{control.message}</p></div></div>)}</div></div>; }
