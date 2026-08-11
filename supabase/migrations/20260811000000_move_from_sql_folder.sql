
-- This is a reference SQL schema for the payment system
-- You would need to run these migrations in your database to support the payment features
-- ============================
-- EXTENSIONS
-- ============================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    -- project_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('en cours', 'terminé', 'en attente', 'en inspection', 'suspendu', 'annulé');
    END IF;

    -- inspection_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status') THEN
        CREATE TYPE inspection_status AS ENUM ('approved', 'requires_changes', 'rejected', 'pending');
    END IF;

    -- task_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
    END IF;

    -- task_priority
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;

    -- notification_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('task_assignment', 'project_update', 'inspection_required', 'payment_due', 'document_review', 'system');
    END IF;

    -- task_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
        CREATE TYPE task_type AS ENUM ('project', 'inspection', 'document', 'payment', 'material', 'general');
    END IF;

    -- user_role
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'director', 'agent', 'supplier', 'user');
    END IF;

    -- document_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'archived');
    END IF;
END $$;

-- Create inspections table
CREATE TABLE IF NOT EXISTS btp.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes')),
  inspector VARCHAR(255) NOT NULL,
  comments TEXT,
  progress_at_inspection INTEGER NOT NULL,
  documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS btp.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES btp.projects(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL,
  amount DECIMAL NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  progress_at_payment INTEGER NOT NULL,
  inspection_id UUID REFERENCES btp.inspections(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS btp.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES btp.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('contract', 'report', 'invoice', 'inspection')),
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new statuses to projects btp.payments table
ALTER TABLE btp.payments ADD COLUMN IF NOT EXISTS project_status VARCHAR(20) CHECK (project_status IN ('pending', 'approved', 'rejected', 'requires_changes', 'payé', 'en inspection'));
-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON btp.inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON btp.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON btp.project_documents(project_id);
