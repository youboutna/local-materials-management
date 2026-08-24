-- Décompte (facture acceptée) ↔ Facture ↔ Paiement : liens explicites
ALTER TABLE btp.progress_invoices
  ADD COLUMN IF NOT EXISTS phase_id uuid,
  ADD COLUMN IF NOT EXISTS invoice_document_id uuid,
  ADD COLUMN IF NOT EXISTS validated_amount numeric,
  ADD COLUMN IF NOT EXISTS paid_amount numeric;

CREATE INDEX IF NOT EXISTS idx_progress_invoices_phase_id ON btp.progress_invoices(phase_id);
CREATE INDEX IF NOT EXISTS idx_progress_invoices_project_status ON btp.progress_invoices(project_id, status);

ALTER TABLE btp.payments
  ADD COLUMN IF NOT EXISTS decompte_id uuid REFERENCES btp.progress_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric;

CREATE INDEX IF NOT EXISTS idx_payments_decompte_id ON btp.payments(decompte_id);