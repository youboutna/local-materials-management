/**
 * DocumentPerimeter — périmètre WBS contrôlé d'un document DQE.
 * Le composant reste agnostique de la persistance : son parent fournit le DTO.
 */
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { WbsScopeSelector, type WbsScopeValue } from './WbsScopeSelector';

interface Props {
  phases: WbsPhase[];
  value: WbsScopeValue;
  onChange: (value: WbsScopeValue) => void;
  disabled?: boolean;
}

export function DocumentPerimeter({ phases, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Périmètre documentaire</h3>
        <p className="text-xs text-muted-foreground">
          Sélectionnez les phases, jalons et tâches couverts par ce document.
        </p>
      </div>
      <WbsScopeSelector phases={phases} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
