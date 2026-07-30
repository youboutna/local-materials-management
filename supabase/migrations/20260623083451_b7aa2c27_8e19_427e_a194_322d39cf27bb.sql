/*
    Migration: 20260623083451_b7aa2c27_8e19_427e_a194_322d39cf27bb
    Generated at: 2026-06-23T08:34:51.000Z
    Version: 1.0.0

COMMENT ON COLUMN btp.projects.localisation IS 'InterventionZone JSON: { type: polygon|rectangle|circle|point, coordinates: [{lat,lng}], radiusMeters?, label?, address?, areaSqm? }';
COMMENT ON COLUMN btp.projects.forme IS 'Short label for the intervention zone shape (polygon | rectangle | circle | point), mirrors localisation.type';
*/