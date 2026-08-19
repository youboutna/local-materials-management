/**
 * BrandIdentity — sceau (logo) + nom de l'organisation propriétaire.
 * 100 % paramétrable via le référentiel `BRANDING_PROFILES` + surcharges client.
 */
import React from 'react';
import { useUiTheme } from '@/contexts/UiThemeContext';
import { cn } from '@/lib/utils';

interface BrandIdentityProps {
  className?: string;
  /** Taille du sceau. */
  size?: 'sm' | 'md';
  /** Masque le texte (sceau uniquement). */
  hideText?: boolean;
}

export const BrandIdentity: React.FC<BrandIdentityProps> = ({
  className,
  size = 'sm',
  hideText = false,
}) => {
  const { branding } = useUiTheme();
  const showSeal = branding.showSeal && !!branding.sealUrl;
  if (!showSeal && hideText) return null;

  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      {showSeal && (
        <img
          src={branding.sealUrl}
          alt={`Sceau ${branding.ownerName}`}
          loading="lazy"
          className={cn('shrink-0 object-contain', size === 'md' ? 'h-10 w-10' : 'h-7 w-7')}
        />
      )}
      {!hideText && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-semibold text-foreground">{branding.ownerName}</p>
          {branding.ownerSubtitle && (
            <p className="truncate text-[10px] text-muted-foreground">{branding.ownerSubtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * BrandBands — bandeaux d'accent (tokens `--brand-band-*` du thème actif).
 * Pour le thème RIM : vert + or + rouge (charte graphique nationale).
 */
export const BrandBands: React.FC<{ className?: string }> = ({ className }) => {
  const { branding } = useUiTheme();
  if (!branding.showBands) return null;
  return (
    <div className={cn('flex h-1 w-full overflow-hidden', className)} aria-hidden="true">
      <span className="flex-[6]" style={{ backgroundColor: 'hsl(var(--brand-band-1))' }} />
      <span className="flex-[1]" style={{ backgroundColor: 'hsl(var(--brand-band-2))' }} />
      <span className="flex-[1]" style={{ backgroundColor: 'hsl(var(--brand-band-3))' }} />
    </div>
  );
};

export default BrandIdentity;
