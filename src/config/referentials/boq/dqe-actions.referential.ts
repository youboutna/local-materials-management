/**
 * Référentiel des actions du poste de travail DQE (tous contextes).
 *
 * Source unique de vérité pour :
 *  - la clé d'action (`key`) utilisée par les barres d'actions,
 *  - la clé i18n du libellé (`labelKey`) — aucun libellé en clair dans l'UI,
 *  - le groupe d'affichage (`group`) qui pilote le regroupement en menus,
 *  - la capacité `BoqContextService` associée (`capability`) quand elle existe.
 *
 * Objectif : éliminer les boutons dupliqués (ex. « Transférer / Transporter en
 * devis » affichés plusieurs fois) en dérivant toujours l'UI de ce registre.
 */

export type DqeActionGroup =
  /** Menu « Document » : PDF, signature, envoi, téléchargement. */
  | 'document'
  /** Menu « Édition » : ajout de ligne, calcul métré, import. */
  | 'edit'
  /** Menu « Workflow » : étapes secondaires (WBS, décompte, pièces jointes). */
  | 'workflow'
  /** Action principale unique du contexte (transfert vers l'étape suivante). */
  | 'primary'
  /** Action destructive (vider le brouillon). */
  | 'danger';

export interface DqeActionDefinition {
  key: string;
  labelKey: string;
  group: DqeActionGroup;
  /** Capacité BoqContextService requise, si applicable. */
  capability?:
    | 'generatePdf'
    | 'sign'
    | 'email'
    | 'download'
    | 'transfer'
    | 'distribute'
    | 'attachToSubmission'
    | 'submitInvoice'
    | 'publish';
}

export const DQE_ACTIONS_REFERENTIAL: DqeActionDefinition[] = [
  // --- Édition du document ---
  { key: 'addLine', labelKey: 'dqe.action.add_line', group: 'edit' },
  { key: 'takeoff', labelKey: 'dqe.action.takeoff', group: 'edit' },
  { key: 'import', labelKey: 'dqe.action.import', group: 'edit' },

  // --- Document ---
  { key: 'generatePdf', labelKey: 'dqe.action.generate_pdf', group: 'document', capability: 'generatePdf' },
  { key: 'sign', labelKey: 'dqe.action.sign', group: 'document', capability: 'sign' },
  { key: 'email', labelKey: 'dqe.action.email', group: 'document', capability: 'email' },
  { key: 'download', labelKey: 'dqe.action.download', group: 'document', capability: 'download' },
  { key: 'facturx', labelKey: 'dqe.action.facturx', group: 'document' },

  // --- Workflow ---
  { key: 'dispatchWbs', labelKey: 'dqe.action.dispatch_wbs', group: 'workflow' },
  { key: 'validateGate', labelKey: 'dqe.action.validate_gate', group: 'workflow' },
  { key: 'procurementChain', labelKey: 'dqe.action.procurement_chain', group: 'workflow' },
  { key: 'decompte', labelKey: 'dqe.action.create_decompte', group: 'workflow' },
  { key: 'distribute', labelKey: 'dqe.action.distribute', group: 'workflow', capability: 'distribute' },
  { key: 'attachToSubmission', labelKey: 'dqe.action.attach_submission', group: 'workflow', capability: 'attachToSubmission' },
  { key: 'submitInvoice', labelKey: 'dqe.action.submit_invoice', group: 'workflow', capability: 'submitInvoice' },
  { key: 'publish', labelKey: 'dqe.action.publish', group: 'workflow', capability: 'publish' },

  // --- Actions principales / destructives ---
  { key: 'transfer', labelKey: 'dqe.action.transfer', group: 'primary', capability: 'transfer' },
  { key: 'transform', labelKey: 'dqe.action.transform_to', group: 'primary' },
  { key: 'save', labelKey: 'dqe.action.save', group: 'primary' },
  { key: 'clearDraft', labelKey: 'dqe.action.clear_draft', group: 'danger' },
];

const BY_KEY = new Map(DQE_ACTIONS_REFERENTIAL.map((a) => [a.key, a]));

export const getDqeAction = (key: string): DqeActionDefinition | undefined => BY_KEY.get(key);

/** Clé i18n d'une action ; jamais de libellé en clair côté composant. */
export const getDqeActionLabelKey = (key: string): string =>
  BY_KEY.get(key)?.labelKey ?? `dqe.action.${key}`;

/**
 * Clé i18n du libellé de transfert selon le contexte de route — une seule
 * action de transfert par contexte (plus de doublons Transférer/Transporter).
 */
export const DQE_TRANSFER_LABEL_KEYS: Record<
  'project-dqe' | 'tender-estimate' | 'supplier-bid' | 'supplier-invoice',
  string
> = {
  'project-dqe': 'dqe.transfer.project_dqe',
  'tender-estimate': 'dqe.transfer.tender_estimate',
  'supplier-bid': 'dqe.transfer.supplier_bid',
  'supplier-invoice': 'dqe.transfer.supplier_invoice',
};
