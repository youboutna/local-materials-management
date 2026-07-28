-- =============================================================================
-- MIGRATION: add_scheduled_calls_indexes
-- Description: Ajoute des index supplémentaires pour btp.scheduled_calls
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_scheduled_calls_action_type ON btp.scheduled_calls(action_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_created_at ON btp.scheduled_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_recipient_status ON btp.scheduled_calls(recipient_id, status);

DO $$
BEGIN
    RAISE NOTICE '✅ Index supplémentaires créés pour btp.scheduled_calls';
END $$;