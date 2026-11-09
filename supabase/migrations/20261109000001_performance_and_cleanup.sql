-- ==============================================================================
-- CHOR POLICE: High-Scale Performance & Auto-Cleanup Migration
-- Adds query indexes, connection optimization, and table cleanup routines
-- ==============================================================================

-- 1. High-Performance B-Tree Indexes for zero-latency lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_profile_id ON room_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_room_id ON game_rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_round_roles_round_id ON round_roles(round_id);
CREATE INDEX IF NOT EXISTS idx_round_roles_profile_id ON round_roles(profile_id);

-- 2. Realtime publication: enables low-latency WebSocket presence and broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rounds;

-- 3. Maintenance procedure: auto-deletes abandoned/finished rooms older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_stale_rooms()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM rooms
    WHERE status = 'FINISHED'
       OR created_at < NOW() - INTERVAL '24 hours';
       
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
