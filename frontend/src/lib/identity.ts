import { supabase } from './supabase';
import { getTelegramWebApp } from '../utils/telegram';

export interface UserProfile {
  id: string;
  telegram_id?: number | null;
  guest_id?: string | null;
  first_name: string;
  username?: string | null;
  avatar_url?: string | null;
  total_score: number;
}

const GUEST_ID_KEY = 'chor_police_guest_id';
const GUEST_NAME_KEY = 'chor_police_guest_name';

export function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function getSavedGuestName(): string {
  return localStorage.getItem(GUEST_NAME_KEY) || 'Player';
}

export function saveGuestName(name: string) {
  localStorage.setItem(GUEST_NAME_KEY, name);
}

export function getTelegramAvatarUrl(tgUser?: { id: number; photo_url?: string } | null): string | null {
  if (!tgUser) return null;
  if (tgUser.photo_url) return tgUser.photo_url;
  const botServer = (import.meta.env.VITE_BOT_SERVER_URL as string | undefined) || 'https://chorpolice-game.onrender.com';
  return `${botServer.replace(/\/$/, '')}/avatar/${tgUser.id}`;
}

export async function ensureUserProfile(customName?: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const tgUser = getTelegramWebApp()?.initDataUnsafe?.user;

  if (tgUser) {
    const avatarUrl = getTelegramAvatarUrl(tgUser);
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || null,
          username: tgUser.username || null,
          avatar_url: avatarUrl,
        },
        { onConflict: 'telegram_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Telegram profile upsert error:', error);
      return null;
    }
    return data as UserProfile;
  }

  // Fallback to browser guest profile
  const guestId = getOrCreateGuestId();
  const displayName = customName?.trim() || getSavedGuestName();
  if (customName?.trim()) saveGuestName(displayName);

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        guest_id: guestId,
        first_name: displayName,
      },
      { onConflict: 'guest_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Guest profile upsert error:', error);
    return null;
  }
  return data as UserProfile;
}

const BOT_NAMES = [
  'Anika (AI)',
  'Tanvir (AI)',
  'Sumon (AI)',
  'Farhan (AI)',
  'Maya (AI)',
];

export async function ensureBotProfile(seatIndex: number): Promise<UserProfile | null> {
  if (!supabase) return null;
  const botGuestId = `ai_bot_seat_${seatIndex}`;
  const botName = BOT_NAMES[(seatIndex - 1) % BOT_NAMES.length] || `Bot ${seatIndex}`;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        guest_id: botGuestId,
        first_name: botName,
      },
      { onConflict: 'guest_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Bot profile upsert error:', error);
    return null;
  }
  return data as UserProfile;
}
