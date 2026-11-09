// Follows Supabase Edge Function Deno runtime
// Cryptographically verifies Telegram initData using HMAC-SHA256

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function verifyTelegramWebAppData(telegramInitData: string, botToken: string): Promise<boolean> {
  const urlParams = new URLSearchParams(telegramInitData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  if (!hash) return false;

  const dataCheckString = Array.from(urlParams.entries())
    .map(([key, val]) => `${key}=${val}`)
    .sort()
    .join('\n');

  // secret_key = HMAC_SHA256("WebAppData", botToken)
  const encoder = new TextEncoder();
  const secretKeyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const secretKey = await crypto.subtle.sign('HMAC', secretKeyMaterial, encoder.encode(botToken));

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(dataCheckString));
  const hexHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hexHash === hash;
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { initData } = await req.json();

    if (!initData) {
      return new Response(JSON.stringify({ error: 'Missing initData' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyTelegramWebAppData(initData, BOT_TOKEN);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid HMAC signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    const tgUser = userRaw ? JSON.parse(userRaw) : null;

    if (!tgUser) {
      return new Response(JSON.stringify({ error: 'Missing user in initData' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upsert profile in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(
        {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || null,
          username: tgUser.username || null,
          avatar_url: tgUser.photo_url || null,
        },
        { onConflict: 'telegram_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        profile,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
