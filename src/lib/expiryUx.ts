/**
 * expiryUx
 * Helpers de présentation (couche UI uniquement) pour les échéances contractuelles :
 * garanties bancaires, certificats d'assurance…
 *
 * ⚠️ Aucune persistance, aucune règle métier : tout est dérivé de la date
 * d'expiration déjà présente dans les données.
 */

export type ExpiryTone = 'ok' | 'soon' | 'critical' | 'expired' | 'unknown';

export interface ExpiryInfo {
  tone: ExpiryTone;
  /** Jours restants (négatif si dépassé), null si date absente/invalide. */
  daysRemaining: number | null;
  label: string;
  /** Avancement 0-100 de la fenêtre de suivi (90 jours) pour la barre de progression. */
  progress: number;
  badgeClass: string;
  barClass: string;
}

const WINDOW_DAYS = 90;

export function getExpiryInfo(expiryDate?: string | null): ExpiryInfo {
  const time = expiryDate ? new Date(expiryDate).getTime() : NaN;

  if (!expiryDate || Number.isNaN(time)) {
    return {
      tone: 'unknown',
      daysRemaining: null,
      label: 'Date inconnue',
      progress: 0,
      badgeClass: 'bg-muted text-muted-foreground',
      barClass: 'bg-muted-foreground/40',
    };
  }

  const days = Math.ceil((time - Date.now()) / 86_400_000);

  if (days < 0) {
    return {
      tone: 'expired',
      daysRemaining: days,
      label: `Expiré depuis ${Math.abs(days)} j`,
      progress: 100,
      badgeClass: 'bg-destructive/10 text-destructive',
      barClass: 'bg-destructive',
    };
  }

  const progress = Math.min(100, Math.max(0, Math.round(((WINDOW_DAYS - days) / WINDOW_DAYS) * 100)));

  if (days <= 7) {
    return {
      tone: 'critical',
      daysRemaining: days,
      label: `${days} j restants`,
      progress,
      badgeClass: 'bg-destructive/10 text-destructive',
      barClass: 'bg-destructive',
    };
  }

  if (days <= 30) {
    return {
      tone: 'soon',
      daysRemaining: days,
      label: `${days} j restants`,
      progress,
      badgeClass: 'bg-warning/15 text-warning-foreground',
      barClass: 'bg-warning',
    };
  }

  return {
    tone: 'ok',
    daysRemaining: days,
    label: `${days} j restants`,
    progress,
    badgeClass: 'bg-success/10 text-success',
    barClass: 'bg-success',
  };
}

/** Filtre rapide partagé entre les pages Garanties et Assurances. */
export type ExpiryFilter = 'all' | 'active' | 'expiring' | 'expired';

export function matchesExpiryFilter(expiryDate: string | null | undefined, filter: ExpiryFilter): boolean {
  if (filter === 'all') return true;
  const { tone } = getExpiryInfo(expiryDate);
  if (filter === 'expired') return tone === 'expired';
  if (filter === 'expiring') return tone === 'soon' || tone === 'critical';
  return tone === 'ok' || tone === 'soon' || tone === 'critical';
}
