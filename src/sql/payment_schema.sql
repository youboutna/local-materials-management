
-- This is a reference SQL schema for the payment system
-- You would need to run these migrations in your database to support the payment features

-- Add new statuses to projects table
ALTER TYPE project_status ADD VALUE 'payé' AFTER 'terminé';
ALTER TYPE project_status ADD VALUE 'en inspection' AFTER 'payé';

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL,
  amount DECIMAL NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  progress_at_payment INTEGER NOT NULL,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('contract', 'report', 'invoice', 'inspection')),
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_inspections_project_id ON inspections(project_id);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
