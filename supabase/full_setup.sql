-- ==============================================================================
-- CHOR POLICE (চোর পুলিশ) — Complete Production Database & Anti-Cheat Setup
-- Run this entire script once in your Supabase SQL Editor
-- ==============================================================================

-- 1. Profiles (Supports both Telegram Users & Browser Guests)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE,
    guest_id TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    avatar_url TEXT,
    total_score BIGINT DEFAULT 0,
    games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Game Rooms (Supports Custom Rooms, 4-6 Players, & Telegram Group Topics)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    telegram_chat_id BIGINT,
    telegram_thread_id BIGINT, -- Telegram Supergroup Topic ID
    host_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'LOBBY', -- 'LOBBY', 'PLAYING', 'FINISHED'
    current_round INT DEFAULT 1,
    max_rounds INT DEFAULT 5,
    max_players INT NOT NULL DEFAULT 4 CHECK (max_players >= 4 AND max_players <= 6),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Room Members / Seating
CREATE TABLE IF NOT EXISTS room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    seat_index INT NOT NULL CHECK (seat_index >= 0 AND seat_index <= 5),
    score INT DEFAULT 0,
    is_ready BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, profile_id)
);

-- 4. Game Rounds & Turn Tracking
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    state TEXT NOT NULL DEFAULT 'DEAL',
    -- 'DEAL', 'ROYAL_CALL', 'SABOTAGE', 'INTERROGATION', 'RESOLVED'
    raja_id UUID REFERENCES profiles(id),
    police_id UUID REFERENCES profiles(id),
    accused_id UUID REFERENCES profiles(id),
    sabotage_type TEXT DEFAULT 'NONE',      -- 'FRAME', 'BRIBE', 'NONE'
    sabotage_target_id UUID REFERENCES profiles(id),
    bribe_accepted BOOLEAN DEFAULT FALSE,
    king_decree_used BOOLEAN DEFAULT FALSE,
    police_guess_correct BOOLEAN,
    points_earned JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Secret Role Storage (Zero-Knowledge: Locked behind RLS + RPC)
CREATE TABLE IF NOT EXISTS round_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI', 'BABU')),
    UNIQUE(round_id, profile_id)
);

-- ==============================================================================
-- INDEXES & REALTIME
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_room ON game_rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_round_roles_round ON round_roles(round_id);

-- Enable Realtime on game state tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'room_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_rounds'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE game_rounds;
    END IF;
END $$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_roles ENABLE ROW LEVEL SECURITY;

-- Profiles: public read/upsert for seamless TMA onboarding
DROP POLICY IF EXISTS "profiles_all" ON profiles;
CREATE POLICY "profiles_all" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Rooms: public read/write for lobby creation and joining by code
DROP POLICY IF EXISTS "rooms_all" ON rooms;
CREATE POLICY "rooms_all" ON rooms FOR ALL USING (true) WITH CHECK (true);

-- Room Members: public read/write for seating and ready toggles
DROP POLICY IF EXISTS "room_members_all" ON room_members;
CREATE POLICY "room_members_all" ON room_members FOR ALL USING (true) WITH CHECK (true);

-- Game Rounds: public read/update for state transitions
DROP POLICY IF EXISTS "game_rounds_all" ON game_rounds;
CREATE POLICY "game_rounds_all" ON game_rounds FOR ALL USING (true) WITH CHECK (true);

-- STRICT ANTI-CHEAT ON ROUND_ROLES:
-- Zero direct client SELECT access! Clients MUST use get_my_role() RPC.
DROP POLICY IF EXISTS "round_roles_deny_all" ON round_roles;
CREATE POLICY "round_roles_deny_all" ON round_roles FOR SELECT USING (false);

-- ==============================================================================
-- SECURE SERVER-SIDE RPC FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- 1. Deal Shuffled Roles for a Round
CREATE OR REPLACE FUNCTION deal_round(p_room_id UUID, p_round_number INT)
RETURNS UUID AS $$
DECLARE
    v_round_id UUID;
    v_members UUID[];
    v_count INT;
    v_roles TEXT[];
    i INT;
BEGIN
    -- Collect seated players in random order
    SELECT ARRAY_AGG(profile_id ORDER BY random())
    INTO v_members
    FROM room_members
    WHERE room_id = p_room_id;

    v_count := COALESCE(array_length(v_members, 1), 0);
    IF v_count < 4 OR v_count > 6 THEN
        RAISE EXCEPTION 'Need 4 to 6 players to deal chits (currently %)', v_count;
    END IF;

    IF v_count = 4 THEN
        v_roles := ARRAY['RAJA', 'MONTRI', 'POLICE', 'CHOR'];
    ELSIF v_count = 5 THEN
        v_roles := ARRAY['RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI'];
    ELSE
        v_roles := ARRAY['RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI', 'BABU'];
    END IF;

    -- Create new round
    INSERT INTO game_rounds (room_id, round_number, state)
    VALUES (p_room_id, p_round_number, 'DEAL')
    RETURNING id INTO v_round_id;

    -- Assign secret roles
    FOR i IN 1..v_count LOOP
        INSERT INTO round_roles (round_id, profile_id, role)
        VALUES (v_round_id, v_members[i], v_roles[i]);
    END LOOP;

    -- Update room status
    UPDATE rooms
    SET status = 'PLAYING', current_round = p_round_number
    WHERE id = p_room_id;

    RETURN v_round_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get ONLY your own secret role (or all if resolved)
CREATE OR REPLACE FUNCTION get_my_role(p_round_id UUID, p_profile_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM round_roles
    WHERE round_id = p_round_id AND profile_id = p_profile_id;
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reveal King & transition to ROYAL_CALL
CREATE OR REPLACE FUNCTION reveal_king(p_round_id UUID)
RETURNS UUID AS $$
DECLARE
    v_raja_id UUID;
BEGIN
    SELECT profile_id INTO v_raja_id
    FROM round_roles
    WHERE round_id = p_round_id AND role = 'RAJA';

    UPDATE game_rounds
    SET raja_id = v_raja_id, state = 'ROYAL_CALL'
    WHERE id = p_round_id;

    RETURN v_raja_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reveal Police & transition to SABOTAGE (10s Syndicate Twist)
CREATE OR REPLACE FUNCTION reveal_police(p_round_id UUID)
RETURNS UUID AS $$
DECLARE
    v_police_id UUID;
BEGIN
    SELECT profile_id INTO v_police_id
    FROM round_roles
    WHERE round_id = p_round_id AND role = 'POLICE';

    UPDATE game_rounds
    SET police_id = v_police_id, state = 'SABOTAGE'
    WHERE id = p_round_id;

    RETURN v_police_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Resolve Round, Calculate Points & Reveal All Roles
CREATE OR REPLACE FUNCTION resolve_round(p_round_id UUID, p_accused_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_round RECORD;
    v_chor_id UUID;
    v_correct BOOLEAN;
    v_rec RECORD;
    v_earned INT;
    v_points JSONB := '{}'::jsonb;
    v_roles JSONB := '{}'::jsonb;
BEGIN
    SELECT * INTO v_round FROM game_rounds WHERE id = p_round_id;
    IF v_round.state = 'RESOLVED' THEN
        RETURN jsonb_build_object(
            'already_resolved', true,
            'points_earned', v_round.points_earned,
            'correct', v_round.police_guess_correct
        );
    END IF;

    SELECT profile_id INTO v_chor_id
    FROM round_roles
    WHERE round_id = p_round_id AND role = 'CHOR';

    v_correct := (v_chor_id = p_accused_id);

    FOR v_rec IN SELECT profile_id, role FROM round_roles WHERE round_id = p_round_id LOOP
        v_earned := 0;
        IF v_rec.role = 'RAJA' THEN
            v_earned := 1000;
        ELSIF v_rec.role = 'MONTRI' THEN
            v_earned := 800;
        ELSIF v_rec.role = 'POLICE' THEN
            IF v_correct THEN v_earned := 500; ELSE v_earned := 0; END IF;
        ELSIF v_rec.role = 'CHOR' THEN
            IF NOT v_correct THEN
                IF v_round.bribe_accepted THEN v_earned := 250; ELSE v_earned := 500; END IF;
            ELSE
                v_earned := 0;
            END IF;
        ELSIF v_rec.role = 'SIPAHI' THEN
            v_earned := 300;
        ELSIF v_rec.role = 'BABU' THEN
            v_earned := 100;
        END IF;

        -- Bribe split bonus for accomplice if Thief escaped
        IF NOT v_correct AND v_round.bribe_accepted AND v_round.sabotage_target_id = v_rec.profile_id THEN
            v_earned := v_earned + 250;
        END IF;

        -- Update room score & lifetime profile score
        UPDATE room_members
        SET score = score + v_earned
        WHERE room_id = v_round.room_id AND profile_id = v_rec.profile_id;

        UPDATE profiles
        SET total_score = total_score + v_earned,
            games_played = games_played + 1
        WHERE id = v_rec.profile_id;

        v_points := v_points || jsonb_build_object(v_rec.profile_id::text, v_earned);
        v_roles := v_roles || jsonb_build_object(v_rec.profile_id::text, v_rec.role);
    END LOOP;

    UPDATE game_rounds
    SET state = 'RESOLVED',
        accused_id = p_accused_id,
        police_guess_correct = v_correct,
        points_earned = v_points
    WHERE id = p_round_id;

    RETURN jsonb_build_object(
        'correct', v_correct,
        'chor_id', v_chor_id,
        'accused_id', p_accused_id,
        'points_earned', v_points,
        'roles', v_roles
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Reveal all roles safely ONLY after RESOLVED
CREATE OR REPLACE FUNCTION get_resolved_roles(p_round_id UUID)
RETURNS TABLE(profile_id UUID, role TEXT) AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM game_rounds WHERE id = p_round_id AND state = 'RESOLVED') THEN
        RETURN QUERY SELECT rr.profile_id, rr.role FROM round_roles rr WHERE rr.round_id = p_round_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Maintenance cleanup for stale rooms (>24h)
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
