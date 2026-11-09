import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.TELEGRAM_WEBAPP_URL || 'https://chor-police.pages.dev';

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not set. Please provide it in .env');
}

const bot = new Bot(BOT_TOKEN || 'DUMMY_TOKEN');

// Helper to generate a room code
function generateRoomCode() {
  return `CP-${Math.floor(1000 + Math.random() * 9000)}`;
}

// /start command
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('👑 Play Chor Police (চোর পুলিশ)', WEBAPP_URL);

  await ctx.reply(
    `👑 *স্বাগতম চোর পুলিশ খেলায়! (Welcome to Chor Police)*\n\n` +
    `Bangladeshi nostalgic tabletop hidden-role deduction game, now on Telegram!\n\n` +
    `• 4-6 Players\n` +
    `• King (রাজা), Minister (মন্ত্রী), Police (পুলিশ), Thief (চোর), Soldier (সিপাহী), Citizen (বাবু)\n` +
    `• "The Syndicate" Sabotage Twist!\n\n` +
    `Tap below to launch the Mini App:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  );
});

// /play command for groups
bot.command('play', async (ctx) => {
  const roomCode = generateRoomCode();
  const playUrl = `${WEBAPP_URL}?startapp=${roomCode}`;

  const keyboard = new InlineKeyboard()
    .url('🎮 Sit at Table (টেবিলে বসুন)', playUrl);

  await ctx.reply(
    `👑 *Chor Police Table Initialized! (চোর পুলিশ টেবিল প্রস্তুত)*\n\n` +
    `📍 *Table Code:* \`#${roomCode}\`\n` +
    `👥 *Capacity:* 4 - 6 Players\n` +
    `⏱️ *Status:* Waiting for players to sit...\n\n` +
    `Click below to join this table instantly:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  );
});

// Postback scorecard helper function
export async function sendRoundRecapToChat(chatId, roundData) {
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
    await bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Failed to send round recap to chat:', err);
  }
}

if (BOT_TOKEN && BOT_TOKEN !== 'DUMMY_TOKEN') {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Chor Police Bot @${botInfo.username} is running!`);
    },
  });
} else {
  console.log('🤖 Bot ready in placeholder mode (Waiting for TELEGRAM_BOT_TOKEN).');
}
