ALTER TABLE btp.project_milestones ADD COLUMN IF NOT EXISTS phase_id uuid;
ALTER TABLE public.project_milestones ADD COLUMN IF NOT EXISTS phase_id uuid;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='btp' AND table_name='project_phases') THEN
    BEGIN
      ALTER TABLE btp.project_milestones
        ADD CONSTRAINT project_milestones_phase_id_fkey
        FOREIGN KEY (phase_id) REFERENCES btp.project_phases(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_btp_project_milestones_phase_id ON btp.project_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_phase_id ON public.project_milestones(phase_id);