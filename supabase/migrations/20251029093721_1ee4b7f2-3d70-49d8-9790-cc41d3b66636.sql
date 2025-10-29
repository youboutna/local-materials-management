-- Add missing foreign key constraints

-- Add foreign key from bank_guarantees to projects
ALTER TABLE public.bank_guarantees
ADD CONSTRAINT fk_bank_guarantees_project
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add foreign key from payment_blocks to projects
ALTER TABLE public.payment_blocks
ADD CONSTRAINT fk_payment_blocks_project
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add comments for clarity
COMMENT ON CONSTRAINT fk_bank_guarantees_project ON public.bank_guarantees IS 'Links bank guarantees to their associated projects';
COMMENT ON CONSTRAINT fk_payment_blocks_project ON public.payment_blocks IS 'Links payment blocks to their associated projects';