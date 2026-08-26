/**
 * PhasePlannedResourcesDTO — vue agrégée « Ressources » d'une phase alimentée
 * par la chaîne DQE → Appel d'offres → Devis accepté.
 *
 * Doctrine :
 *   • Le DQE (et le métré) est le métré parent : il porte les ressources PLANIFIÉES.
 *   • Un devis ACCEPTÉ porte les ressources ENGAGÉES (montant réel contractualisé).
 *   • La phase n'est jamais une saisie de départ : elle affiche le résultat agrégé.
 *
 * Calculé (jamais persisté) par PhaseResourceLinkService.
 */

export type PhaseResourceFamily = 'material' | 'equipment' | 'labor';

/** Origine métier d'une ligne de ressource de phase. */
export type PhaseResourceOrigin = 'dqe' | 'takeoff' | 'quote' | 'manual';

export interface PhaseResourceLineDTO {
  id: string;
  designation: string;
  family: PhaseResourceFamily;
  origin: PhaseResourceOrigin;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalHt: number;
  materialId?: string | null;
  code?: string | null;
  category?: string | null;
  /** Ligne verrouillée (DQE soumis/signé ou devis accepté) : lecture seule. */
  locked: boolean;
}

export interface PhaseResourceBucketDTO {
  family: PhaseResourceFamily;
  lines: PhaseResourceLineDTO[];
  count: number;
  plannedCost: number;
  engagedCost: number;
}

/** État de la chaîne d'approvisionnement observé pour la phase. */
export interface PhaseChainStateDTO {
  hasDqe: boolean;
  dqeValidated: boolean;
  tenderPublished: boolean;
  quotesReceived: number;
  quoteAccepted: boolean;
  /** Montant du devis accepté (réel), sinon 0. */
  acceptedTotalHt: number;
}

export interface PhasePlannedResourcesDTO {
  projectId: string;
  phaseId: string;
  materials: PhaseResourceBucketDTO;
  equipment: PhaseResourceBucketDTO;
  labor: PhaseResourceBucketDTO;
  totals: {
    plannedCost: number;
    engagedCost: number;
    lineCount: number;
  };
  chain: PhaseChainStateDTO;
  /** Vrai si la phase est alimentée par la chaîne DQE/Devis (saisie manuelle superflue). */
  linkedToBoq: boolean;
}
