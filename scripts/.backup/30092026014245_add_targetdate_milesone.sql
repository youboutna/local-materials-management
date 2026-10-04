-- ============================================================
-- MIGRATION: Align project_milestones schema with import payload
-- Adds camelCase columns + missing snake_case columns
-- Idempotent — safe to re-run
-- ============================================================

-- 1. First, inspect what columns exist
-- (run this alone to see the current schema)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'project_milestones'
-- ORDER BY ordinal_position;

-- 2. Add camelCase column (matches your JSON)
ALTER TABLE btp.project_milestones
  ADD COLUMN IF NOT EXISTS "targetDate" TIMESTAMPTZ;

-- 3. Ensure snake_case also exists (some old imports use it)
ALTER TABLE btp.project_milestones
  ADD COLUMN IF NOT EXISTS target_date TIMESTAMPTZ;

-- 4. Other columns from your JSON that might be missing
ALTER TABLE btp.project_milestones
  ADD COLUMN IF NOT EXISTS "completionDate" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "progressPercent" NUMERIC,
  ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isCritical" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "externalRef" TEXT,
  ADD COLUMN IF NOT EXISTS external_ref TEXT,
  ADD COLUMN IF NOT EXISTS "stageType" TEXT,
  ADD COLUMN IF NOT EXISTS stage_type TEXT,
  ADD COLUMN IF NOT EXISTS "orderIndex" INTEGER,
  ADD COLUMN IF NOT EXISTS order_index INTEGER,
  ADD COLUMN IF NOT EXISTS "materialUsage" JSONB,
  ADD COLUMN IF NOT EXISTS material_usage JSONB,
  ADD COLUMN IF NOT EXISTS "materialCostEstimate" NUMERIC,
  ADD COLUMN IF NOT EXISTS material_cost_estimate NUMERIC,
  ADD COLUMN IF NOT EXISTS "actualMaterialCost" NUMERIC,
  ADD COLUMN IF NOT EXISTS actual_material_cost NUMERIC;

-- 5. Backfill snake_case from camelCase (if camelCase got populated)
UPDATE btp.project_milestones
SET target_date = "targetDate"
WHERE target_date IS NULL AND "targetDate" IS NOT NULL;

UPDATE btp.project_milestones
SET completion_date = "completionDate"
WHERE completion_date IS NULL AND "completionDate" IS NOT NULL;

UPDATE btp.project_milestones
SET progress_percentage = "progressPercent"
WHERE progress_percentage IS NULL AND "progressPercent" IS NOT NULL;

UPDATE btp.project_milestones
SET is_critical = "isCritical"
WHERE is_critical IS NULL AND "isCritical" IS NOT NULL;

UPDATE btp.project_milestones
SET external_ref = "externalRef"
WHERE external_ref IS NULL AND "externalRef" IS NOT NULL;

-- 6. Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';