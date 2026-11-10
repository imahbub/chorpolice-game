# Chor Police (চোর পুলিশ) — Bot & Player Guide

Welcome to **`@chorpolicegamebot`**, the Telegram bot and Mini App for playing **Chor Police (চোর পুলিশ)**—the classic Bangladeshi tabletop deduction game with **"The Syndicate"** sabotage twist, supporting **4 to 6 players** in both **English** and **বাংলা**.

---

## 1. Bot Commands

| Command | Where It Works | Description |
| :--- | :--- | :--- |
| `/start` | Private Chat / Groups | Sends the welcome card with a button to launch the Chor Police Mini App Hub. Also accepts an optional room code payload (`/start CP-7K9X2M`). |
| `/play` | Groups / Topics / Private | Creates a new **4-player** table in the database and posts an interactive **Join Table** card in the exact chat or Supergroup Topic where it was sent. |
| `/play 5` | Groups / Topics / Private | Creates a **5-player** table (adds **Soldier / সিপাহী**). |
| `/play 6` | Groups / Topics / Private | Creates a **6-player** table (adds **Soldier / সিপাহী** and **Citizen / বাবু**). |

> **Note:** `/play` has a 3-second cooldown per chat to prevent accidental group spam.

---

## 2. Three Ways to Play

### Way A: Play Inside a Telegram Group or Supergroup Topic
1. Add **`@chorpolicegamebot`** to your Telegram group.
2. In the group chat—or inside any specific **Topic** thread—send `/play` (or `/play 5` / `/play 6`).
3. The bot replies inside that **exact Topic** with a unique 6-character room code (e.g., `#CP-7K9X2M`) and a **`🎮 Join Table`** button.
4. Every player in the group taps **`🎮 Join Table`**. The Mini App opens automatically and seats everyone at the same table.
5. The first player to join becomes the **Host** (👑). Once 4–6 players are seated (or empty seats are filled with **+ AI Bot**), the Host taps **Deal Chits & Start**.
6. At the end of each round, the bot automatically posts the **Round Scorecard** back into that same Group or Topic!

### Way B: Custom Room & Join with Code (Across Any Chats)
1. Open **`@chorpolicegamebot`** in private chat and tap **`👑 Play Chor Police`** (next to the text bar) or send `/start`.
2. In the **Home Hub**, under **Create Custom Room**:
   * Pick table capacity (**4, 5, or 6** players).
   * Pick match length (**3, 5, or 10** rounds).
   * Tap **Create Room & Get Code**.
3. In the lobby, tap **Copy** to copy the room code (e.g., `CP-7K9X2M`) or tap **Share** to send a direct join link to any friend or group.
4. Friends open the Mini App, enter the code under **Join with Room Code** (with or without the `CP-` prefix), and tap **JOIN**.

### Way C: Solo Practice vs AI Bots
1. On the **Home Hub**, tap **Practice Solo vs AI Bots (Offline Mode)** to play an instant match offline against AI seats.
2. In any online lobby with fewer than 4 human players, the Host can also tap **+ AI Bot** to fill empty seats and start playing right away.

---

## 3. Roles & Scoring

| Role (EN / বাং) | Players | Base Points | Objective |
| :--- | :---: | :---: | :--- |
| **King (রাজা)** | 4–6 | **1,000 pts** | Revealed first; summons the Police. Holds a single-use **Royal Decree** and an **Emergency Verdict** power if the Police goes inactive. |
| **Minister (মন্ত্রী)** | 4–6 | **800 pts** | Innocent court official. Must convince the Police of their innocence (or secretly decide whether to accept a Thief's bribe). |
| **Police (পুলিশ)** | 4–6 | **500 pts** | Steps forward when summoned, interrogates suspects, and arrests the Thief. Earns **0 pts** if the wrong suspect is arrested. |
| **Thief (চোর)** | 4–6 | **0 / 500 pts** | Bluffs and uses **Syndicate Sabotage** skills. Earns **500 pts** if the Police arrests someone else (or **250 pts** each if a secret bribe was accepted). |
| **Soldier (সিপাহী)** | 5–6 | **300 pts** | Loyal royal guard. Must avoid wrongful arrest. |
| **Citizen (বাবু)** | 6 | **100 pts** | Honest townsfolk caught in the royal investigation. |

---

## 4. Round Flow Inside the Mini App

1. **Lobby:** Players toggle **Ready**. Host taps **DEAL CHITS & START**.
2. **Deal & Hold to Peek:** Each player receives a folded 2D paper chit with a wax seal. **Press and hold** the chit to secretly unfold and view your role; release your finger to fold it back so nearby people cannot peek.
3. **Royal Proclamation:** The **King** reveals themselves and taps **Summon the Police**.
4. **Police Step-Up:** The **Police** steps forward (`I Am The Police!`).
5. **The Syndicate Phase (10 seconds):**
   * The **Thief** can covertly trigger **Frame Suspect** (causes a nervous visual jitter on an innocent player's card) or **Offer Secret Bribe** (proposes a 50/50 point split to another suspect).
   * The **King** can trigger a one-time **Royal Decree**.
6. **Police Interrogation:**
   * Suspects can tap quick defense/bluff dialogue buttons (`I swear on the Crown, I'm innocent!`, etc.), popping speech bubbles above their table seats in real time.
   * The **Police** taps a suspect card to inspect and presses **LOCK IN ARREST**.
   * *(If the Police disconnects or goes inactive when the timer runs low, the King receives a **Royal Emergency Verdict** button so the table never freezes).*
7. **Resolution:** All cards flip open, points are tallied, and the bot posts the round summary back to the Telegram group chat.

---

## 5. App Controls & Features

* **Bilingual Toggle (`EN` / `বাংলা`):** Switch the entire UI, role names, and dialogue lines between English and Bengali anytime from the top header.
* **Sound Effects (`🔊` / `🔇`):** Toggle synthesized game audio (paper rustles, gavel thuds, police whistle, tension ticks, and victory chimes).
* **Rules Guide (`📖`):** View all role descriptions and point values mid-game.
* **Health Endpoint (For Hosting):** The bot service exposes `/health` returning JSON status (`status`, `bot`, `supabaseConnected`, `uptime`). Keep-alive monitors (e.g., UptimeRobot every 5 minutes) can ping `/health` on free hosting tiers like Render to prevent sleeping.
