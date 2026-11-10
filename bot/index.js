import { Bot, InlineKeyboard } from 'grammy';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || 'chorpolicegamebot').replace(/^@/, '');
const APP_SHORT_NAME = process.env.TELEGRAM_APP_SHORT_NAME || ''; // e.g. "game" if created via /newapp
const WEBAPP_URL = process.env.TELEGRAM_WEBAPP_URL || 'https://chorpolice-tabletop.pages.dev';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not set. Please provide it in .env');
}

const bot = new Bot(BOT_TOKEN || 'DUMMY_TOKEN');
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// 6-Character collision-resistant room code generator (Over 1 billion unique rooms)
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return `CP-${code}`;
}

function getDirectMiniAppUrl(roomCode) {
  if (APP_SHORT_NAME) {
    return `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=${roomCode}`;
  }
  return `https://t.me/${BOT_USERNAME}?startapp=${roomCode}`;
}

// In-memory rate-limiter: tracks last sent timestamp per chat to avoid 429
const chatLastMessageTime = new Map();

// /start command (Works in private chats)
bot.command('start', async (ctx) => {
  const isPrivate = ctx.chat.type === 'private';
  const threadId = ctx.message?.message_thread_id;

  // Check if /start has a room payload (deep link fallback)
  const payload = ctx.match?.trim();
  const targetUrl = payload ? `${WEBAPP_URL}?startapp=${payload}` : WEBAPP_URL;

  const keyboard = isPrivate
    ? new InlineKeyboard().webApp('👑 Play Chor Police (চোর পুলিশ)', targetUrl)
    : new InlineKeyboard().url('👑 Open Game Hub', getDirectMiniAppUrl('HUB'));

  await ctx.reply(
    `👑 *স্বাগতম চোর পুলিশ খেলায়! (Welcome to Chor Police)*\n\n` +
    `Bangladeshi nostalgic tabletop hidden-role deduction game, now on Telegram!\n\n` +
    `• *4-6 Players:* King (রাজা), Minister (মন্ত্রী), Police (পুলিশ), Thief (চোর), Soldier (সিপাহী), Citizen (বাবু)\n` +
    `• *"The Syndicate"* Sabotage Twist\n` +
    `• Type \`/play\` inside any Group or Topic to start a shared table!\n\n` +
    `Tap below to launch:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      ...(threadId ? { message_thread_id: threadId } : {}),
    }
  );
});

// /play command (Works in Private, Groups, and Supergroup Topics!)
bot.command('play', async (ctx) => {
  const chatId = ctx.chat.id;
  const threadId = ctx.message?.message_thread_id || null;
  const isPrivate = ctx.chat.type === 'private';
  const now = Date.now();
  const lastTime = chatLastMessageTime.get(chatId) || 0;

  // Rate-limit check: at most 1 /play per 3 seconds per group
  if (now - lastTime < 3000) {
    return;
  }
  chatLastMessageTime.set(chatId, now);

  // Allow optional player count: /play 5 or /play 6
  const arg = parseInt(ctx.match?.trim() || '4', 10);
  const maxPlayers = [4, 5, 6].includes(arg) ? arg : 4;

  const roomCode = generateRoomCode();

  // Persist room in Supabase with Group & Topic IDs
  if (supabase) {
    const { error } = await supabase.from('rooms').insert({
      room_code: roomCode,
      telegram_chat_id: chatId,
      telegram_thread_id: threadId,
      max_players: maxPlayers,
      max_rounds: 5,
      status: 'LOBBY',
    });
    if (error) {
      console.error('Supabase room insert error:', error.message);
    }
  }

  // Telegram strictly requires `url` (Direct Mini App Link) inside groups/topics,
  // while `webApp` works natively in private 1-on-1 chats.
  const keyboard = isPrivate
    ? new InlineKeyboard().webApp(`🎮 Sit at Table #${roomCode}`, `${WEBAPP_URL}?startapp=${roomCode}`)
    : new InlineKeyboard()
        .url(`🎮 Join Table #${roomCode} (টেবিলে বসুন)`, getDirectMiniAppUrl(roomCode));

  const replyOptions = {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    ...(threadId ? { message_thread_id: threadId } : {}),
  };

  await ctx.reply(
    `👑 *Chor Police Table Ready! (চোর পুলিশ টেবিল প্রস্তুত)*\n\n` +
    `📍 *Room Code:* \`${roomCode}\`\n` +
    `👥 *Seats:* Up to ${maxPlayers} Players (4-6 configurable in lobby)\n` +
    `⏱️ *Status:* Waiting for players to sit...\n\n` +
    `Tap below to join this exact room automatically! (Or enter code \`${roomCode}\` inside the app)`,
    replyOptions
  );
});

// Postback scorecard to the original Group / Topic
export async function sendRoundRecapToChat(chatId, threadId, roundData) {
  const { roundNumber, correctArrest, thiefName, accusedName, scores } = roundData;

  const resultEmoji = correctArrest ? '🚨' : '🦹';
  const resultText = correctArrest
    ? '✅ *Arrest Successful! (চোর ধরা পড়েছে)*'
    : '❌ *Thief Escaped! (চোর পালিয়ে গেছে)*';

  let scoreBoardText = '';
  for (const s of scores) {
    scoreBoardText += `• ${s.name} (${s.role}): *${s.score} pts* (+${s.earned})\n`;
  }

  const message =
    `${resultEmoji} *Round ${roundNumber} Concluded!*\n\n` +
    `${resultText}\n` +
    `• *Real Thief (আসল চোর):* ${thiefName}\n` +
    `• *Accused (গ্রেপ্তারকৃত):* ${accusedName}\n\n` +
    `📊 *Current Standings:*\n` +
    scoreBoardText;

  try {
    await bot.api.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...(threadId ? { message_thread_id: threadId } : {}),
    });
  } catch (err) {
    console.error('Failed to send round recap to chat:', err.message);
  }
}

// Listen to Supabase Realtime for resolved rounds to auto-post scorecards back to Group Topics
if (supabase) {
  supabase
    .channel('bot-round-recaps')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_rounds', filter: 'state=eq.RESOLVED' },
      async (payload) => {
        const round = payload.new;
        if (!round || round.state !== 'RESOLVED') return;

        try {
          const { data: room } = await supabase
            .from('rooms')
            .select('telegram_chat_id, telegram_thread_id')
            .eq('id', round.room_id)
            .single();

          if (!room?.telegram_chat_id) return;

          const { data: members } = await supabase
            .from('room_members')
            .select('profile_id, score, profiles(first_name)')
            .eq('room_id', round.room_id);

          const { data: roles } = await supabase.rpc('get_resolved_roles', { p_round_id: round.id });

          if (!members || !roles) return;

          const roleMap = {};
          for (const r of roles) roleMap[r.profile_id] = r.role;

          const thiefMember = members.find((m) => roleMap[m.profile_id] === 'CHOR');
          const accusedMember = members.find((m) => m.profile_id === round.accused_id);
          const pointsMap = round.points_earned || {};

          const scores = members.map((m) => ({
            name: m.profiles?.first_name || 'Player',
            role: roleMap[m.profile_id] || 'Unknown',
            score: m.score,
            earned: pointsMap[m.profile_id] || 0,
          }));

          await sendRoundRecapToChat(room.telegram_chat_id, room.telegram_thread_id, {
            roundNumber: round.round_number,
            correctArrest: Boolean(round.police_guess_correct),
            thiefName: thiefMember?.profiles?.first_name || 'Unknown',
            accusedName: accusedMember?.profiles?.first_name || 'Unknown',
            scores,
          });
        } catch (err) {
          console.error('Error posting round recap:', err.message);
        }
      }
    )
    .subscribe();
}

// Lightweight HTTP Health Check server (for Render, Railway, Fly.io, or VPS)
const PORT = process.env.PORT || 3000;
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bot: `@${BOT_USERNAME}`, uptime: process.uptime() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(PORT, () => {
  console.log(`🌐 Health check server listening on port ${PORT}`);
});

if (BOT_TOKEN && BOT_TOKEN !== 'DUMMY_TOKEN') {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Chor Police Bot @${botInfo.username} is running!`);
    },
  });
} else {
  console.log('🤖 Bot ready in placeholder mode (Waiting for TELEGRAM_BOT_TOKEN).');
}
