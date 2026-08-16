-- Supprimer l'ancienne contrainte
ALTER TABLE btp.payments DROP CONSTRAINT payments_phase_id_fkey;

-- Ajouter la nouvelle contrainte référençant project_phases
ALTER TABLE btp.payments ADD CONSTRAINT payments_phase_id_fkey
    FOREIGN KEY (phase_id) REFERENCES btp.project_phases(id) ON DELETE SET NULL;