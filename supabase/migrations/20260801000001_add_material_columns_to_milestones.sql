-- Additive milestone material tracking fields.
ALTER TABLE btp.project_milestones
  ADD COLUMN IF NOT EXISTS material_usage JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS material_cost_estimate DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS actual_material_cost DECIMAL(15,2);

NOTIFY pgrst, 'reload schema';