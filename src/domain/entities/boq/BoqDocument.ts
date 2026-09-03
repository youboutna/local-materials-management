/**
 * src/domain/entities/boq/BoqDocument.ts
 * BoqDocument — Aggregate root du module DQE
 *
 * ⚠️ DOMAINE PUR — Aucune dépendance vers les DTOs, Supabase ou React
 */
import { BoqLine, BoqSource } from './BoqLine';

// ============================================================================
// VALUE OBJECTS (Domain)
// ============================================================================

export interface DocumentIdentity {
  reference: string;
  issueDate: string;
  currency: string;
  validityDays: number;
  facturxTypeCode: string;
  title: string;
  version: number;
}

export interface DocumentParty {
  id?: string | null;
  name: string;
  kind?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface DocumentParties {
  sender: DocumentParty;
  recipient: DocumentParty;
  extraRecipients: DocumentParty[];
  exchangeContext: {
    source: BoqSource;
    workflowStage: 'draft' | 'submitted' | 'validated' | 'published' | 'accepted' | 'rejected';
    exchangeType: 'dqe' | 'estimate' | 'bid' | 'invoice';
    validationStatus: 'pending' | 'approved' | 'rejected' | null;
    validationComment?: string | null;
  };
}

export interface DocumentSignature {
  signedBy: string;
  signedAt: string;
  role: 'sender' | 'recipient' | 'validator';
}

export interface DocumentTraceability {
  sourceDocumentId?: string;
  sourceDocumentType?: 'dqe' | 'estimate' | 'contract' | 'invoice';
  nextDocumentId?: string;
  nextDocumentType?: 'dqe' | 'estimate' | 'contract' | 'invoice';
  stagesHistory: Array<{
    stage: string;
    at: string;
    by: string;
    comment?: string;
  }>;
  workflowInstanceId?: string;
}

// ============================================================================
// AGGREGATE ROOT
// ============================================================================

export interface BoqDocumentProps {
  id?: string;
  source: BoqSource;
  contextId: string;
  lines: BoqLine[];
  identity: DocumentIdentity;
  parties: DocumentParties;
  signature: DocumentSignature | null;
  traceability: DocumentTraceability | null;
  deletedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
}

export class BoqDocument {
  private constructor(private readonly props: Readonly<BoqDocumentProps>) {}

  static create(props: BoqDocumentProps): BoqDocument {
    if (!props.lines || props.lines.length === 0) {
      throw new Error('BoqDocument must have at least one line');
    }
    if (!props.identity.title?.trim()) {
      throw new Error('BoqDocument must have a title');
    }
    if (!props.parties.sender.name?.trim()) {
      throw new Error('BoqDocument must have a sender');
    }
    if (!props.parties.recipient.name?.trim()) {
      throw new Error('BoqDocument must have a recipient');
    }
    return new BoqDocument(props);
  }

  get id() { return this.props.id; }
  get source() { return this.props.source; }
  get contextId() { return this.props.contextId; }
  get lines() { return this.props.lines; }
  get identity() { return this.props.identity; }
  get parties() { return this.props.parties; }
  get signature() { return this.props.signature; }
  get traceability() { return this.props.traceability; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  getSender(): DocumentParty { return this.props.parties.sender; }
  getPrimaryRecipient(): DocumentParty { return this.props.parties.recipient; }
  getAllRecipients(): DocumentParty[] {
    return [this.props.parties.recipient, ...this.props.parties.extraRecipients];
  }
  hasRecipientEmail(): boolean {
    return this.getAllRecipients().some(r => r.email?.trim());
  }

  isSigned(): boolean { return !!this.props.signature; }
  isDraft(): boolean { return this.props.parties.exchangeContext.workflowStage === 'draft'; }
  isSubmitted(): boolean { return this.props.parties.exchangeContext.workflowStage === 'submitted'; }
  isValidated(): boolean { return this.props.parties.exchangeContext.workflowStage === 'validated'; }
  isPublished(): boolean { return this.props.parties.exchangeContext.workflowStage === 'published'; }
  isHeaderComplete(): boolean {
    const { sender, recipient } = this.props.parties;
    return !!sender.name?.trim() && !!recipient.name?.trim();
  }

  totalHt(): number {
    return this.props.lines.reduce((acc, l) => acc + (l.totalHt || 0), 0);
  }
  totalTtc(): number {
    return this.props.lines.reduce((acc, l) => acc + (l.totalHt || 0) * (1 + (l.vatRate || 0) / 100), 0);
  }
  totalVat(): number { return this.totalTtc() - this.totalHt(); }
  lineCount(): number { return this.props.lines.length; }
}