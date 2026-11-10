# Chor Police (চোর পুলিশ) — Telegram Mini App (TMA)

An online, real-time multiplayer tabletop adaptation of the traditional Bangladeshi game **"Chor Police" (চোর পুলিশ)**, designed for Telegram group chats with authentic paper-chit physics and the new **"Syndicate"** sabotage twist.

> 📖 **Player & Bot Usage Guide:** See [BOT_GUIDE.md](./BOT_GUIDE.md) for full instructions on `/play`, Groups & Topics, Custom Rooms, and gameplay rules.

---

## 🎮 Highlights & Features

1. **Bilingual Everywhere (বাংলা & English):**
   * Instant toggle between **বাংলা** and **English** with dual labels.
   * Roles & Translations:
     * **King (রাজা)** — 1,000 pts: Sovereign with the royal proclamation and Royal Decree.
     * **Minister (মন্ত্রী)** — 800 pts: Innocent dignitary, target of secret bribes.
     * **Police (পুলিশ)** — 500 pts: Interrogator seeking out the Thief.
     * **Thief (চোর)** — 0 base / 500+ pts: Master deceiver who can frame suspects or bribe officials.
     * **Soldier (সিপাহী)** — 300 pts: Royal guard (5-6 player matches).
     * **Citizen (বাবু)** — 100 pts: Honest townsfolk bystander (6 player matches).

2. **Scalable 4 to 6 Players:**
   * Dynamically switch table capacity between **4, 5, or 6 players** at any time.

3. **Rich 2D Game Aesthetics & Audio Feel:**
   * **Paper-Chit 2D Creases & Wax Seal:** Realistic folded paper slip with "Hold to Peek" mechanic to prevent shoulder-surfing.
   * **Procedural Sound Engine (Web Audio API):** Paper rustles, royal gavel thuds, police sirens, clock ticks, and victory chimes without external audio dependencies.
   * **2D Illustrated Avatars & Badges:** Custom SVG emblems for each role.
   * **Framed Jitter Artifacts:** Visual twitch/red smoke on framed innocent suspects.

4. **"The Syndicate" Sabotage Twist:**
   * **Thief's Frame:** Induces nervous visual jitter on an innocent player's card.
   * **Thief's Secret Bribe:** Offers 50/50 bounty split to the Minister/Citizen in secret.
   * **King's Royal Decree:** Forces suspects to answer a rapid loyalty oath!

5. **Built-in Multi-Player Dev Mode (No Multiple Devices Needed):**
   * Switch perspective between **Player 1 (Host), Player 2, Player 3, Player 4, Player 5, Player 6** instantly.
   * Open the app in **multiple browser tabs** — state synchronizes in real time via `BroadcastChannel`!
   * Fill seats with AI Bots with 1 click.

---

## 🚀 Quick Start (Local Development)

### 1. Install & Run
```bash
# Install root dependencies
npm install

# Run the frontend dev server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 2. Testing 4-6 Players Locally
* In the top-right corner, click **"Dev Mode"** to switch between Player perspectives (Player 1..6).
* Click **"+ Fill Seat with AI Player"** or click **"Ready"** on all seats.
* Or open **2 to 4 tabs** at `http://localhost:5173`: pick Player 1 in Tab 1, Player 2 in Tab 2, etc. The game states and actions will synchronize automatically across all tabs!

---

## 📁 Project Architecture

```
minigame/
├── frontend/               # Vite + React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/2d/  # RoleBadge, ChitCard, TableSeats, SabotageHUD, InterrogationHUD, ResolutionModal
│   │   ├── context/        # GameContext (State machine, multi-tab sync, 4-6 player logic)
│   │   ├── i18n/           # English & Bengali (বাংলা) translations
│   │   ├── utils/          # Procedural Web Audio API engine & Telegram Haptics
│   │   └── types/          # Role configurations and Game state definitions
│   └── dist/               # Production build ready for Cloudflare Pages
├── supabase/
│   ├── migrations/         # PostgreSQL schema with Zero-Knowledge RLS policies
│   └── functions/          # Deno Edge Function for Telegram HMAC-SHA256 validation
├── bot/                    # Telegram bot (GrammY) handling /play, deep links & recap scorecards
└── .env.example            # Environment variables template
```

---

## 🔐 Zero-Knowledge Security (Anti-Cheat)
The PostgreSQL database schema inside `supabase/migrations/` enforces Row Level Security (RLS) on `round_roles`:
```sql
CREATE POLICY "Read own role or read all when round is resolved"
ON round_roles FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM game_rounds
        WHERE game_rounds.id = round_roles.round_id
        AND game_rounds.state = 'RESOLVED'
    )
);
```
Clients cannot sniff network packets to see who the Thief is until the round state reaches `'RESOLVED'`.
