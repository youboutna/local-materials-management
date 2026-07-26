-- Fix query issues and improve workflow tables

-- First, let's check if tender_steps table exists and create it if not
CREATE TABLE IF NOT EXISTS btp.tender_steps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tender_id UUID NOT NULL,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    procurement_phase TEXT,
    procurement_stage TEXT,
    required_documents TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'approved'))
);

-- Create tender_step_documents table if not exists
CREATE TABLE IF NOT EXISTS btp.tender_step_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id UUID NOT NULL,
    document_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_document_status CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    UNIQUE(step_id, document_id)
);

-- Create workflow_status table for unified workflow management
CREATE TABLE IF NOT EXISTS btp.workflow_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    phase_code TEXT NOT NULL,
    stage_code TEXT NOT NULL,
    task_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('project', 'tender')),
    CONSTRAINT valid_workflow_status CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    UNIQUE(entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, ''))
);

-- Enable RLS on all workflow tables
ALTER TABLE btp.tender_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_step_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.workflow_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tender_steps
CREATE POLICY "Users can view tender steps for accessible tenders" ON btp.tender_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM btp.tenders t
            WHERE t.id = tender_steps.tender_id
        )
    );

CREATE POLICY "Users can manage tender steps" ON btp.tender_steps
    FOR ALL USING (true);

-- Create RLS policies for tender_step_documents
CREATE POLICY "Users can view step documents" ON btp.tender_step_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM btp.tender_steps ts
            WHERE ts.id = tender_step_documents.step_id
        )
    );

CREATE POLICY "Users can manage step documents" ON btp.tender_step_documents
    FOR ALL USING (true);

-- Create RLS policies for workflow_status
CREATE POLICY "Users can view workflow status" ON btp.workflow_status
    FOR SELECT USING (true);

CREATE POLICY "Users can manage workflow status" ON btp.workflow_status
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tender_steps_tender_id ON btp.tender_steps(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_steps_status ON btp.tender_steps(status);
CREATE INDEX IF NOT EXISTS idx_tender_step_documents_step_id ON btp.tender_step_documents(step_id);
CREATE INDEX IF NOT EXISTS idx_tender_step_documents_document_id ON btp.tender_step_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status_entity ON btp.workflow_status(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_status_phase ON btp.workflow_status(phase_code, stage_code);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION btp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tender_steps_updated_at
    BEFORE UPDATE ON btp.tender_steps
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_updated_at_column();

CREATE TRIGGER update_tender_step_documents_updated_at
    BEFORE UPDATE ON btp.tender_step_documents
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_updated_at_column();

CREATE TRIGGER update_workflow_status_updated_at
    BEFORE UPDATE ON btp.workflow_status
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_updated_at_column();