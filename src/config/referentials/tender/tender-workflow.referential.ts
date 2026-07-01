/**
 * Tender Workflow Referential
 * Source de vérité pour les statuts, transitions et gardes métier du cycle DDE.
 * Consommé par : TenderService, EvaluationPanelTabs, AwardedTenderToProjectService.
 *
 * @see docs/ARCHITECTURE_REFERENTIELS.md — Référentiels comme légos métier.
 */

export type TenderStatusCode =
  | 'draft'
  | 'published'
  | 'open'
  | 'under_evaluation'
  | 'awarded'
  | 'contracted'
  | 'closed'
  | 'cancelled';

export interface TenderStatusDefinition {
  code: TenderStatusCode;
  label: string;
  description: string;
  color: 'gray' | 'blue' | 'green' | 'amber' | 'purple' | 'emerald' | 'slate' | 'red';
  isPublic: boolean; // exposé au portail fournisseur ?
  isTerminal: boolean;
}

export interface TenderTransition {
  from: TenderStatusCode;
  to: TenderStatusCode;
  label: string;
  requiredRole?: Array<'admin' | 'project_manager' | 'director'>;
  /** Gardes : renvoient un message d'erreur si non satisfaites (undefined = OK). */
  guards?: Array<(ctx: TenderTransitionContext) => string | undefined>;
}

export interface TenderTransitionContext {
  hasLots: boolean;
  hasDocuments: boolean;
  hasDeadline: boolean;
  submissionsCount: number;
  hasEvaluationScores: boolean;
  hasWinner: boolean;
  contractSigned: boolean;
}

export const TENDER_STATUSES: Record<TenderStatusCode, TenderStatusDefinition> = {
  draft: { code: 'draft', label: 'Brouillon', description: 'En cours de préparation', color: 'gray', isPublic: false, isTerminal: false },
  published: { code: 'published', label: 'Publié', description: 'Visible au portail fournisseur', color: 'blue', isPublic: true, isTerminal: false },
  open: { code: 'open', label: 'Ouvert aux offres', description: 'Dépôt de soumissions actif', color: 'green', isPublic: true, isTerminal: false },
  under_evaluation: { code: 'under_evaluation', label: 'En évaluation', description: 'Analyse des soumissions', color: 'amber', isPublic: false, isTerminal: false },
  awarded: { code: 'awarded', label: 'Attribué', description: 'Lauréat désigné', color: 'purple', isPublic: false, isTerminal: false },
  contracted: { code: 'contracted', label: 'Contractualisé', description: 'Contrat signé, hydratation projet', color: 'emerald', isPublic: false, isTerminal: false },
  closed: { code: 'closed', label: 'Clôturé', description: 'Cycle terminé', color: 'slate', isPublic: false, isTerminal: true },
  cancelled: { code: 'cancelled', label: 'Annulé', description: 'Annulé avant attribution', color: 'red', isPublic: false, isTerminal: true },
};

/** Machine à états — transitions autorisées avec gardes métier. */
export const TENDER_TRANSITIONS: TenderTransition[] = [
  {
    from: 'draft', to: 'published', label: 'Publier',
    requiredRole: ['admin', 'project_manager'],
    guards: [
      (c) => (c.hasLots ? undefined : 'Au moins un lot est requis avant publication.'),
      (c) => (c.hasDocuments ? undefined : 'Le DPAO doit contenir au moins un document.'),
      (c) => (c.hasDeadline ? undefined : 'Une date limite de dépôt doit être définie.'),
    ],
  },
  { from: 'published', to: 'open', label: 'Ouvrir aux offres' },
  { from: 'open', to: 'under_evaluation', label: 'Clôturer et évaluer',
    guards: [(c) => (c.submissionsCount > 0 ? undefined : 'Aucune soumission reçue.')] },
  { from: 'under_evaluation', to: 'awarded', label: 'Attribuer',
    requiredRole: ['admin', 'project_manager', 'director'],
    guards: [(c) => (c.hasEvaluationScores ? undefined : 'Les scores d\'évaluation doivent être complets.')] },
  { from: 'awarded', to: 'contracted', label: 'Signer le contrat',
    requiredRole: ['admin', 'project_manager'],
    guards: [(c) => (c.hasWinner ? undefined : 'Aucun lauréat désigné.')] },
  { from: 'contracted', to: 'closed', label: 'Clôturer' },
  { from: 'draft', to: 'cancelled', label: 'Annuler' },
  { from: 'published', to: 'cancelled', label: 'Annuler' },
  { from: 'open', to: 'cancelled', label: 'Annuler' },
];

/** Étapes UI du wizard gestionnaire. */
export const TENDER_WIZARD_STEPS = [
  { code: 'identification', label: 'Identification', description: 'Titre, référence, projet, catégorie' },
  { code: 'framework_lots', label: 'Cadre & Lots', description: 'Mode passation, type marché, lots' },
  { code: 'dpao_docs', label: 'DPAO & Pièces', description: 'Documents attendus' },
  { code: 'planning', label: 'Planning', description: 'Dates, garanties, comité' },
  { code: 'publication', label: 'Publication', description: 'Checklist, code secret, diffusion' },
] as const;

export type TenderWizardStepCode = typeof TENDER_WIZARD_STEPS[number]['code'];

/** Résout les transitions autorisées depuis un statut donné (après application des gardes). */
export function getAllowedTransitions(
  currentStatus: TenderStatusCode,
  context: TenderTransitionContext,
): Array<TenderTransition & { blockedReason?: string }> {
  return TENDER_TRANSITIONS
    .filter((t) => t.from === currentStatus)
    .map((t) => {
      const blocker = t.guards?.map((g) => g(context)).find(Boolean);
      return { ...t, blockedReason: blocker };
    });
}

export function isPublicStatus(status: TenderStatusCode): boolean {
  return TENDER_STATUSES[status]?.isPublic ?? false;
}
