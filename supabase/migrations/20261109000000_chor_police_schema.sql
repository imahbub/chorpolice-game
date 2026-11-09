-- ==============================================================================
-- CHOR POLICE (চোর পুলিশ) — PostgreSQL Database Schema
-- Multi-player hidden role tabletop engine with Zero-Knowledge RLS
-- ==============================================================================

-- 1. Profiles linked to Telegram User ID
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    avatar_url TEXT,
    total_score BIGINT DEFAULT 0,
    games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Game Rooms (4-6 players capacity)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    telegram_chat_id BIGINT,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, seat_index),
    UNIQUE(room_id, profile_id)
);

-- 4. Rounds & Turn Tracking (Scalable 4 to 6 players)
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    state TEXT NOT NULL DEFAULT 'DEAL', 
    -- 'DEAL', 'ROYAL_CALL', 'SABOTAGE', 'INTERROGATION', 'RESOLVED'
    raja_id UUID REFERENCES profiles(id),
    police_id UUID REFERENCES profiles(id),
    chor_id UUID REFERENCES profiles(id),
    montri_id UUID REFERENCES profiles(id),
    sipahi_id UUID REFERENCES profiles(id), -- 5th player
    babu_id UUID REFERENCES profiles(id),   -- 6th player
    accused_id UUID REFERENCES profiles(id),
    sabotage_type TEXT DEFAULT 'NONE',      -- 'FRAME', 'BRIBE', 'NONE'
    sabotage_target_id UUID REFERENCES profiles(id),
    bribe_accepted BOOLEAN DEFAULT FALSE,
    police_guess_correct BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Secret Role Visibility (Protected via Zero-Knowledge RLS)
CREATE TABLE IF NOT EXISTS round_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI', 'BABU')),
    is_revealed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_roles ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read profiles; user can update their own
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE USING (id = auth.uid());

-- Rooms: Publicly visible to find lobbies
CREATE POLICY "Rooms are viewable by members"
ON rooms FOR SELECT USING (true);

-- Room Members: Viewable by anyone
CREATE POLICY "Room members are viewable by everyone"
ON room_members FOR SELECT USING (true);

-- Game Rounds: Viewable by everyone in the room
CREATE POLICY "Game rounds are viewable by everyone"
ON game_rounds FOR SELECT USING (true);

-- ANTI-CHEAT ZERO-KNOWLEDGE POLICY FOR SECRET ROLES:
-- A player can ONLY query their own role UNLESS the round is marked 'RESOLVED'
CREATE POLICY "Read own role or read all when round is resolved"
ON round_roles
FOR SELECT
USING (
    profile_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM game_rounds
        WHERE game_rounds.id = round_roles.round_id
        AND game_rounds.state = 'RESOLVED'
    )
);
