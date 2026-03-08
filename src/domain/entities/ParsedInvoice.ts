/**
 * Parsed Invoice Entity
 * Represents a parsed invoice document following hexagonal architecture
 */

export type InvoiceStatus = 
  | 'pending'
  | 'processing'
  | 'validated'
  | 'rejected'
  | 'archived';

export type InvoiceType = 
  | 'tender'
  | 'supplier_invoice'
  | 'client_invoice'
  | 'expense'
  | 'other';

export interface ParsedInvoice {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  amount?: number | null;
  currency?: string | null;
  supplierId?: string | null;
  projectId?: string | null;
  tenderId?: string | null;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  extractedData?: Record<string, any> | null;
  parsingErrors?: string[] | null;
  validationErrors?: string[] | null;
  processedAt?: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Props interface for ParsedInvoiceEntity factory
export interface ParsedInvoiceProps {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  amount?: number | null;
  currency?: string | null;
  supplierId?: string | null;
  projectId?: string | null;
  tenderId?: string | null;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  extractedData?: Record<string, any> | null;
  parsingErrors?: string[] | null;
  validationErrors?: string[] | null;
  processedAt?: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export class ParsedInvoiceEntity implements ParsedInvoice {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly originalFileName: string,
    public readonly filePath: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly invoiceNumber: string | null,
    public readonly invoiceDate: string | null,
    public readonly dueDate: string | null,
    public readonly amount: number | null,
    public readonly currency: string | null,
    public readonly supplierId: string | null,
    public readonly projectId: string | null,
    public readonly tenderId: string | null,
    public readonly invoiceType: InvoiceType,
    public readonly status: InvoiceStatus,
    public readonly extractedData: Record<string, any> | null,
    public readonly parsingErrors: string[] | null,
    public readonly validationErrors: string[] | null,
    public readonly processedAt: string | null,
    public readonly uploadedBy: string,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // ============= Factory Method =============
  static create(props: ParsedInvoiceProps): ParsedInvoiceEntity {
    return new ParsedInvoiceEntity(
      props.id,
      props.fileName,
      props.originalFileName,
      props.filePath,
      props.fileSize,
      props.mimeType,
      props.invoiceNumber ?? null,
      props.invoiceDate ?? null,
      props.dueDate ?? null,
      props.amount ?? null,
      props.currency ?? null,
      props.supplierId ?? null,
      props.projectId ?? null,
      props.tenderId ?? null,
      props.invoiceType,
      props.status,
      props.extractedData ?? null,
      props.parsingErrors ?? null,
      props.validationErrors ?? null,
      props.processedAt ?? null,
      props.uploadedBy,
      props.createdAt,
      props.updatedAt
    );
  }

  // Business logic methods
  isPending(): boolean {
    return this.status === 'pending';
  }

  isProcessed(): boolean {
    return ['validated', 'rejected', 'archived'].includes(this.status);
  }

  hasErrors(): boolean {
    return Boolean(this.parsingErrors && this.parsingErrors.length > 0) ||
           Boolean(this.validationErrors && this.validationErrors.length > 0);
  }

  canBeValidated(): boolean {
    return this.status === 'processing' && !this.hasErrors();
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date(this.dueDate) < new Date();
  }

  getDisplayAmount(): string {
    if (!this.amount) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency || 'EUR'
    }).format(this.amount);
  }

  getDisplayName(): string {
    return this.originalFileName || this.fileName;
  }

  getFileExtension(): string {
    return this.fileName.split('.').pop()?.toLowerCase() || '';
  }

  isImageFile(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(this.getFileExtension());
  }

  isPdfFile(): boolean {
    return this.getFileExtension() === 'pdf';
  }

  getProcessingStatus(): string {
    if (this.isPending()) return 'En attente';
    if (this.status === 'processing') return 'En cours';
    if (this.status === 'validated') return 'Validé';
    if (this.status === 'rejected') return 'Rejeté';
    if (this.status === 'archived') return 'Archivé';
    return 'Inconnu';
  }
}
