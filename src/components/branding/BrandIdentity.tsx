/**
 * BrandIdentity — sceau (logo) + nom de l'organisation propriétaire.
 *
 * Données : la table des organisations est la source de vérité (organisation
 * propriétaire de l'ensemble des projets). Le référentiel `BRANDING_PROFILES`
 * ne sert que de repli, et les surcharges client (Paramètres → Apparence)
 * restent prioritaires. Aucun texte métier codé en dur dans ce composant.
 */
import React from 'react';
import { useUiTheme } from '@/contexts/UiThemeContext';
import { useOwnerOrganization } from '@/hooks/useOwnerOrganization';
import { cn } from '@/lib/utils';

interface BrandIdentityProps {
  className?: string;
  /** Taille du sceau. */
  size?: 'sm' | 'md' | 'lg';
  /** Masque le texte (sceau uniquement). */
  hideText?: boolean;
  /** Affiche les bandeaux d'accent en filet vertical accolé à l'identité. */
  withBands?: boolean;
  /** Encadre le sceau dans une pastille de la couleur d'accent (barre de navigation). */
  sealBadge?: boolean;
  /** Rend le nom du propriétaire en couleur d'accent (placement en barre principale). */
  emphasis?: boolean;
  /** Repli rendu lorsqu'aucun sceau ni nom n'est disponible. */
  fallback?: React.ReactNode;
}

const SEAL_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
};

export const BrandIdentity: React.FC<BrandIdentityProps> = ({
  className,
  size = 'sm',
  hideText = false,
  withBands = false,
  sealBadge = false,
  emphasis = false,
  fallback,
}) => {
  const { branding, brandingOverrides } = useUiTheme();
  const { organization } = useOwnerOrganization();

  // Surcharge explicite > donnée réelle (organisation propriétaire) > référentiel
  const ownerName =
    brandingOverrides.ownerName?.trim() || organization?.name || branding.ownerName;
  const ownerSubtitle =
    brandingOverrides.ownerSubtitle?.trim() ||
    branding.ownerSubtitle ||
    undefined;
  const sealUrl =
    brandingOverrides.sealUrl?.trim() || organization?.logoUrl?.trim() || branding.sealUrl;

  const [sealFailed, setSealFailed] = React.useState(false);
  React.useEffect(() => setSealFailed(false), [sealUrl]);
  const showSeal = branding.showSeal && !!sealUrl && !sealFailed;
  if (!showSeal && (hideText || !ownerName)) return <>{fallback ?? null}</>;

  const seal = showSeal ? (
    <img
      src={sealUrl}
      alt={`Sceau ${ownerName}`}
      loading="lazy"
      onError={() => setSealFailed(true)}
      className={cn('shrink-0 object-contain', SEAL_SIZES[size])}
    />
  ) : null;

  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      {withBands && <BrandBands orientation="vertical" className="h-8" />}
      {!seal && sealBadge && ownerName && (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
          style={{ backgroundColor: 'hsl(var(--brand-band-1))' }}
          aria-hidden="true"
        >
          {ownerName.trim().charAt(0).toUpperCase()}
        </span>
      )}
      {seal &&
        (sealBadge ? (
          <span
            className="flex shrink-0 items-center justify-center rounded-lg p-1.5"
            style={{ backgroundColor: 'hsl(var(--brand-band-1))' }}
          >
            {seal}
          </span>
        ) : (
          seal
        ))}
      {!hideText && (
        <div className="min-w-0 text-left leading-tight">
          <p
            className={cn(
              'truncate font-semibold',
              emphasis ? 'text-sm' : 'text-xs',
              emphasis ? '' : 'text-foreground',
            )}
            style={emphasis ? { color: 'hsl(var(--brand-band-1))' } : undefined}
          >
            {ownerName}
          </p>
          {ownerSubtitle && (
            <p
              className={cn(
                'truncate text-muted-foreground',
                emphasis ? 'text-[11px]' : 'text-[10px]',
              )}
            >
              {ownerSubtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};


/**
 * BrandBands — bandeaux d'accent (tokens `--brand-band-*` du thème actif).
 * Pour le thème RIM : vert + or + rouge (charte graphique nationale).
 *
 * - `horizontal` : filet fin (usage ponctuel, ex. aperçu dans les réglages)
 * - `vertical`   : filet inline, accolé à l'identité (usage barre d'en-tête)
 */
export const BrandBands: React.FC<{
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}> = ({ className, orientation = 'horizontal' }) => {
  const { branding } = useUiTheme();
  if (!branding.showBands) return null;
  const vertical = orientation === 'vertical';
  return (
    <div
      className={cn(
        'overflow-hidden rounded-full',
        vertical ? 'flex w-1 flex-col shrink-0' : 'flex h-1 w-full',
        className,
      )}
      aria-hidden="true"
    >
      <span className="flex-[6]" style={{ backgroundColor: 'hsl(var(--brand-band-1))' }} />
      <span className="flex-[1]" style={{ backgroundColor: 'hsl(var(--brand-band-2))' }} />
      <span className="flex-[1]" style={{ backgroundColor: 'hsl(var(--brand-band-3))' }} />
    </div>
  );
};

/**
 * BrandBandsBackground — dégradé de charte très discret, utilisable en fond
 * de bandeau (barre d'en-tête) sans ajouter de ligne de séparation.
 */
export const BrandBandsBackground: React.FC<{ className?: string }> = ({ className }) => {
  const { branding } = useUiTheme();
  if (!branding.showBands) return null;
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 -z-10', className)}
      style={{
        background:
          'linear-gradient(90deg, hsl(var(--brand-band-1) / 0.10) 0%, hsl(var(--brand-band-2) / 0.07) 62%, hsl(var(--brand-band-3) / 0.08) 100%)',
      }}
    />
  );
};

export default BrandIdentity;
