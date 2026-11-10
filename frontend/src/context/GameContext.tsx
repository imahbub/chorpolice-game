import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player, Role, SabotageType } from '../types/game';
import { getTelegramWebApp } from '../utils/telegram';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureUserProfile, ensureBotProfile } from '../lib/identity';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GameContextType {
  state: GameState;
  language: 'en' | 'bn';
  toggleLanguage: () => void;
  createOnlineRoom: (maxPlayers: 4 | 5 | 6, maxRounds: number, customName?: string) => Promise<void>;
  joinOnlineRoom: (code: string, customName?: string) => Promise<void>;
  startLocalPractice: (maxPlayers: 4 | 5 | 6) => void;
  leaveRoom: () => void;
  switchActivePlayer: (playerId: string) => void;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  peekRole: (peeked: boolean) => void;
  triggerRoyalCall: () => Promise<void>;
  triggerPoliceStep: () => Promise<void>;
  executeSabotage: (type: SabotageType, targetId: string) => Promise<void>;
  respondBribe: (accepted: boolean) => Promise<void>;
  triggerKingDecree: () => Promise<void>;
  answerDecree: (yes: boolean) => void;
  sendBluff: (text: string) => void;
  selectSuspect: (suspectId: string) => void;
  lockInArrest: (suspectId: string) => Promise<void>;
  botPoliceGuess: () => void;
  emergencyVerdict: () => void;
  nextRound: () => Promise<void>;
  resetGame: () => Promise<void>;
  changeMaxPlayers: (count: 4 | 5 | 6) => Promise<void>;
  addBotSeat: () => Promise<void>;
}

const DEFAULT_NAMES = [
  'Rahat (রাহাত)',
  'Anika (আনিকা)',
  'Tanvir (তানভীর)',
  'Sumon (সুমন)',
  'Farhan (ফারহান)',
  'Maya (মায়া)',
];

const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return `CP-${code}`;
}

export function normalizeRoomCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('CP-')) return cleaned;
  if (cleaned.startsWith('CP') && cleaned.length === 8) return `CP-${cleaned.slice(2)}`;
  return `CP-${cleaned}`;
}

const createLocalPlayers = (maxPlayers: 4 | 5 | 6): Player[] => {
  const tgUser = getTelegramWebApp()?.initDataUnsafe?.user;
  const initialName = tgUser ? `${tgUser.first_name}` : DEFAULT_NAMES[0];

  return Array.from({ length: maxPlayers }, (_, i) => ({
    id: `player_${i + 1}`,
    name: i === 0 ? initialName : DEFAULT_NAMES[i] || `Player ${i + 1}`,
    username: i === 0 ? tgUser?.username : `player_${i + 1}`,
    avatarSeed: `avatar_${i + 1}`,
    seatIndex: i,
    isHost: i === 0,
    isReady: i === 0 ? true : true,
    score: 0,
    currentRole: null,
    isPeeked: false,
    isRolePublic: false,
    isBot: i !== 0,
    isOnline: true,
  }));
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  const [state, setState] = useState<GameState>(() => ({
    mode: 'HUB',
    roomId: '',
    roomCode: '',
    currentRoundId: null,
    isLoading: false,
    errorMessage: null,
    phase: 'LOBBY',
    currentRound: 1,
    maxRounds: 5,
    maxPlayers: 4,
    players: [],
    activePlayerId: 'player_1',
    kingId: null,
    policeId: null,
    accusedId: null,
    sabotageType: 'NONE',
    sabotageTargetId: null,
    timerSeconds: 10,
    kingDecreeUsed: false,
    decreeQuestion: null,
    decreeAnswers: {},
  }));

  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const supaChannelRef = useRef<RealtimeChannel | null>(null);
  const activeModeRef = useRef(state.mode);
  const activePlayerIdRef = useRef(state.activePlayerId);
  const currentRoundIdRef = useRef(state.currentRoundId);

  useEffect(() => {
    activeModeRef.current = state.mode;
    activePlayerIdRef.current = state.activePlayerId;
    currentRoundIdRef.current = state.currentRoundId;
  }, [state.mode, state.activePlayerId, state.currentRoundId]);

  // Helper: Refresh entire room state from Supabase Postgres
  const syncOnlineRoomFromDb = useCallback(async (roomId: string, myProfileId: string) => {
    if (!supabase) return;

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room) return;

    const { data: members } = await supabase
      .from('room_members')
      .select('*, profiles(first_name, username, guest_id)')
      .eq('room_id', roomId)
      .order('seat_index', { ascending: true });

    const { data: latestRound } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('room_id', roomId)
      .eq('round_number', room.current_round)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let myRole: Role | null = null;
    let resolvedRolesMap: Record<string, Role> = {};

    if (latestRound) {
      if (latestRound.state === 'RESOLVED') {
        const { data: allRoles } = await supabase.rpc('get_resolved_roles', {
          p_round_id: latestRound.id,
        });
        if (Array.isArray(allRoles)) {
          for (const r of allRoles) {
            resolvedRolesMap[r.profile_id] = r.role as Role;
          }
        }
        myRole = resolvedRolesMap[myProfileId] || null;
      } else {
        const { data: roleData } = await supabase.rpc('get_my_role', {
          p_round_id: latestRound.id,
          p_profile_id: myProfileId,
        });
        myRole = (roleData as Role) || null;
      }
    }

    const mappedPlayers: Player[] = (members || []).map((m: any) => {
      const pid = m.profile_id;
      const isBot = Boolean(m.profiles?.guest_id?.startsWith('ai_bot_'));
      const isKing = latestRound?.raja_id === pid;
      const isPolice = latestRound?.police_id === pid;
      const isResolved = latestRound?.state === 'RESOLVED';

      let assignedRole: Role | null = null;
      if (isResolved) {
        assignedRole = resolvedRolesMap[pid] || null;
      } else if (pid === myProfileId) {
        assignedRole = myRole;
      } else if (isKing) {
        assignedRole = 'RAJA';
      } else if (isPolice) {
        assignedRole = 'POLICE';
      }

      return {
        id: pid,
        name: m.profiles?.first_name || `Seat ${m.seat_index + 1}`,
        username: m.profiles?.username || undefined,
        avatarSeed: `avatar_${m.seat_index + 1}`,
        seatIndex: m.seat_index,
        isHost: room.host_id === pid,
        isReady: m.is_ready,
        score: m.score,
        currentRole: assignedRole,
        isPeeked: isBot || pid === myProfileId ? Boolean(assignedRole) : false,
        isRolePublic: Boolean(isKing || isPolice || isResolved),
        isBot,
        isOnline: m.is_online,
        isFramed: latestRound?.sabotage_type === 'FRAME' && latestRound?.sabotage_target_id === pid,
        hasBribeOffer:
          latestRound?.sabotage_type === 'BRIBE' &&
          latestRound?.sabotage_target_id === pid &&
          !latestRound?.bribe_accepted &&
          latestRound?.state === 'SABOTAGE',
        bribeAccepted:
          latestRound?.bribe_accepted &&
          (latestRound?.sabotage_target_id === pid || assignedRole === 'CHOR'),
      };
    });

    // Map DB state to frontend phase
    let phase: GameState['phase'] = 'LOBBY';
    if (room.status === 'PLAYING' && latestRound) {
      phase = latestRound.state as GameState['phase'];
    }

    let roundResult: GameState['roundResult'] = undefined;
    if (latestRound?.state === 'RESOLVED') {
      const thiefEntry = Object.entries(resolvedRolesMap).find(([, r]) => r === 'CHOR');
      const correct = Boolean(latestRound.police_guess_correct);
      roundResult = {
        correctArrest: correct,
        thiefId: thiefEntry?.[0] || '',
        accusedId: latestRound.accused_id || '',
        pointsEarned: (latestRound.points_earned as Record<string, number>) || {},
        summaryEn: correct
          ? 'The Police successfully identified the Thief! Full points awarded.'
          : 'Wrong arrest! The Thief deceived the Police and stole the bounty!',
        summaryBn: correct
          ? 'পুলিশ নির্ভুলভাবে চোর শনাক্ত করেছে! রাজদরবারে ন্যায় প্রতিষ্ঠিত হলো।'
          : 'ভুল গ্রেপ্তার! আসল চোর পালিয়ে গেল এবং পয়েন্ট ছিনিয়ে নিলো!',
      };
    }

    setState((prev) => ({
      ...prev,
      mode: 'ONLINE',
      isLoading: false,
      errorMessage: null,
      roomId: room.id,
      roomCode: room.room_code,
      currentRoundId: latestRound?.id || null,
      telegramChatId: room.telegram_chat_id,
      telegramThreadId: room.telegram_thread_id,
      phase,
      currentRound: room.current_round,
      maxRounds: room.max_rounds,
      maxPlayers: room.max_players as 4 | 5 | 6,
      players: mappedPlayers,
      activePlayerId: myProfileId,
      kingId: latestRound?.raja_id || null,
      policeId: latestRound?.police_id || null,
      accusedId: latestRound?.accused_id || prev.accusedId,
      sabotageType: (latestRound?.sabotage_type as SabotageType) || 'NONE',
      sabotageTargetId: latestRound?.sabotage_target_id || null,
      kingDecreeUsed: Boolean(latestRound?.king_decree_used),
      timerSeconds:
        prev.phase !== phase
          ? phase === 'SABOTAGE'
            ? 10
            : phase === 'INTERROGATION'
            ? 25
            : prev.timerSeconds
          : prev.timerSeconds,
      roundResult,
    }));
  }, []);

  // Subscribe to Supabase Realtime channel for a room
  const subscribeToRoom = useCallback(
    (roomId: string, roomCode: string, myProfileId: string) => {
      if (!supabase) return;

      if (supaChannelRef.current) {
        supabase.removeChannel(supaChannelRef.current);
      }

      const channel = supabase
        .channel(`room:${roomCode}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
          () => syncOnlineRoomFromDb(roomId, myProfileId)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
          () => syncOnlineRoomFromDb(roomId, myProfileId)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_rounds', filter: `room_id=eq.${roomId}` },
          () => syncOnlineRoomFromDb(roomId, myProfileId)
        )
        .on('broadcast', { event: 'bluff' }, ({ payload }) => {
          if (!payload?.playerId || !payload?.text) return;
          setState((prev) => ({
            ...prev,
            players: prev.players.map((p) =>
              p.id === payload.playerId ? { ...p, speechBubble: payload.text } : p
            ),
          }));
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              players: prev.players.map((p) =>
                p.id === payload.playerId ? { ...p, speechBubble: undefined } : p
              ),
            }));
          }, 4000);
        })
        .on('broadcast', { event: 'suspect_hover' }, ({ payload }) => {
          if (payload?.suspectId) {
            setState((prev) => ({ ...prev, accusedId: payload.suspectId }));
          }
        })
        .subscribe();

      supaChannelRef.current = channel;
    },
    [syncOnlineRoomFromDb]
  );

  // Join existing Online Room by code
  const joinOnlineRoom = useCallback(
    async (rawCode: string, customName?: string) => {
      const code = normalizeRoomCode(rawCode);
      if (!code || code === 'CP-HUB') return;

      if (!isSupabaseConfigured || !supabase) {
        setState((prev) => ({
          ...prev,
          errorMessage: 'Supabase is not configured. Please use Offline Practice mode.',
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));

      try {
        const profile = await ensureUserProfile(customName);
        if (!profile) {
          throw new Error('Could not initialize player profile.');
        }

        const { data: room, error: roomErr } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_code', code)
          .maybeSingle();

        if (roomErr || !room) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            errorMessage: `Room #${code} not found! Check the code and try again.`,
          }));
          return;
        }

        // Check existing members
        const { data: members } = await supabase
          .from('room_members')
          .select('*')
          .eq('room_id', room.id)
          .order('seat_index', { ascending: true });

        const existingMember = (members || []).find((m) => m.profile_id === profile.id);

        if (!existingMember) {
          if ((members || []).length >= room.max_players) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              errorMessage: `Room #${code} is already full (${room.max_players}/${room.max_players}).`,
            }));
            return;
          }

          if (room.status !== 'LOBBY') {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              errorMessage: `Room #${code} is already in progress.`,
            }));
            return;
          }

          // Find next free seat index
          const takenSeats = new Set((members || []).map((m) => m.seat_index));
          let freeSeat = 0;
          while (takenSeats.has(freeSeat)) freeSeat++;

          // If room was created by Telegram Bot (/play), first player to join becomes Host
          if (!room.host_id) {
            await supabase
              .from('rooms')
              .update({ host_id: profile.id })
              .eq('id', room.id);
          }

          const { error: joinErr } = await supabase.from('room_members').insert({
            room_id: room.id,
            profile_id: profile.id,
            seat_index: freeSeat,
            is_ready: !room.host_id || freeSeat === 0,
            is_online: true,
          });

          if (joinErr) throw joinErr;
        }

        await syncOnlineRoomFromDb(room.id, profile.id);
        subscribeToRoom(room.id, room.room_code, profile.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to join room';
        setState((prev) => ({ ...prev, isLoading: false, errorMessage: msg }));
      }
    },
    [subscribeToRoom, syncOnlineRoomFromDb]
  );

  // Create a new Custom Room in Supabase
  const createOnlineRoom = async (maxPlayers: 4 | 5 | 6, maxRounds: number, customName?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      startLocalPractice(maxPlayers);
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));

    try {
      const profile = await ensureUserProfile(customName);
      if (!profile) throw new Error('Could not initialize player profile.');

      const roomCode = generateRoomCode();
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .insert({
          room_code: roomCode,
          host_id: profile.id,
          max_players: maxPlayers,
          max_rounds: maxRounds,
          status: 'LOBBY',
        })
        .select()
        .single();

      if (roomErr || !room) throw roomErr || new Error('Room creation failed');

      await supabase.from('room_members').insert({
        room_id: room.id,
        profile_id: profile.id,
        seat_index: 0,
        is_ready: true,
        is_online: true,
      });

      await syncOnlineRoomFromDb(room.id, profile.id);
      subscribeToRoom(room.id, room.room_code, profile.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      setState((prev) => ({ ...prev, isLoading: false, errorMessage: msg }));
    }
  };

  // Detect Telegram deep-link start_param on mount (e.g. ?startapp=CP-7K9X2M)
  useEffect(() => {
    const tgStartParam = getTelegramWebApp()?.initDataUnsafe?.start_param;
    const urlStartParam =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('startapp') : null;
    const param = tgStartParam || urlStartParam;

    if (param && param.toUpperCase() !== 'HUB') {
      joinOnlineRoom(param);
    }
  }, [joinOnlineRoom]);

  // Local BroadcastChannel for offline multi-tab dev practice
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('chor_police_sync');
      localChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_STATE' && activeModeRef.current === 'LOCAL') {
          setState((prev) => ({
            ...event.data.payload,
            activePlayerId: prev.activePlayerId,
          }));
        }
      };

      return () => channel.close();
    }
  }, []);

  const broadcastLocalState = useCallback((newState: GameState) => {
    try {
      localChannelRef.current?.postMessage({ type: 'SYNC_STATE', payload: newState });
    } catch {
      // Ignore
    }
  }, []);

  // Start Solo / Offline Practice Mode
  const startLocalPractice = (maxPlayers: 4 | 5 | 6) => {
    const roomCode = generateRoomCode();
    setState({
      mode: 'LOCAL',
      roomId: `local_${roomCode}`,
      roomCode,
      currentRoundId: null,
      isLoading: false,
      errorMessage: null,
      phase: 'LOBBY',
      currentRound: 1,
      maxRounds: 5,
      maxPlayers,
      players: createLocalPlayers(maxPlayers),
      activePlayerId: 'player_1',
      kingId: null,
      policeId: null,
      accusedId: null,
      sabotageType: 'NONE',
      sabotageTargetId: null,
      timerSeconds: 10,
      kingDecreeUsed: false,
      decreeQuestion: null,
      decreeAnswers: {},
    });
  };

  // Leave current room back to HomeHub
  const leaveRoom = () => {
    if (supaChannelRef.current && supabase) {
      supabase.removeChannel(supaChannelRef.current);
      supaChannelRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      mode: 'HUB',
      roomId: '',
      roomCode: '',
      currentRoundId: null,
      players: [],
      errorMessage: null,
      phase: 'LOBBY',
      roundResult: undefined,
    }));
  };

  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));

  const switchActivePlayer = (playerId: string) => {
    setState((prev) => ({ ...prev, activePlayerId: playerId }));
  };

  const changeMaxPlayers = async (count: 4 | 5 | 6) => {
    if (state.mode === 'ONLINE' && supabase && state.roomId) {
      await supabase.from('rooms').update({ max_players: count }).eq('id', state.roomId);
      return;
    }

    setState((prev) => {
      const currentCount = prev.players.length;
      let newPlayers = [...prev.players];
      if (count > currentCount) {
        for (let i = currentCount; i < count; i++) {
          newPlayers.push({
            id: `player_${i + 1}`,
            name: DEFAULT_NAMES[i] || `Player ${i + 1}`,
            avatarSeed: `avatar_${i + 1}`,
            seatIndex: i,
            isHost: false,
            isReady: true,
            score: 0,
            currentRole: null,
            isPeeked: false,
            isRolePublic: false,
            isBot: true,
            isOnline: true,
          });
        }
      } else {
        newPlayers = newPlayers.slice(0, count);
      }
      const updated = { ...prev, maxPlayers: count, players: newPlayers };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const addBotSeat = async () => {
    if (state.mode === 'ONLINE' && supabase && state.roomId) {
      const takenSeats = new Set(state.players.map((p) => p.seatIndex));
      let freeSeat = 0;
      while (takenSeats.has(freeSeat) && freeSeat < state.maxPlayers) freeSeat++;
      if (freeSeat >= state.maxPlayers) return;

      const botProfile = await ensureBotProfile(freeSeat + 1);
      if (!botProfile) return;

      await supabase.from('room_members').insert({
        room_id: state.roomId,
        profile_id: botProfile.id,
        seat_index: freeSeat,
        is_ready: true,
        is_online: true,
      });
      return;
    }

    setState((prev) => {
      const unready = prev.players.find((p) => !p.isReady);
      if (unready) {
        const updated = {
          ...prev,
          players: prev.players.map((p) =>
            p.id === unready.id ? { ...p, isReady: true, isBot: true } : p
          ),
        };
        broadcastLocalState(updated);
        return updated;
      }
      return prev;
    });
  };

  const toggleReady = async () => {
    if (state.mode === 'ONLINE' && supabase && state.roomId) {
      const me = state.players.find((p) => p.id === state.activePlayerId);
      if (!me) return;
      await supabase
        .from('room_members')
        .update({ is_ready: !me.isReady })
        .eq('room_id', state.roomId)
        .eq('profile_id', state.activePlayerId);
      return;
    }

    setState((prev) => {
      const updated = {
        ...prev,
        players: prev.players.map((p) =>
          p.id === prev.activePlayerId ? { ...p, isReady: !p.isReady } : p
        ),
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const startGame = async () => {
    if (state.mode === 'ONLINE' && supabase && state.roomId) {
      if (state.players.length < 4) {
        setState((prev) => ({
          ...prev,
          errorMessage: 'Need at least 4 players seated to deal chits (add AI bots or invite friends).',
        }));
        return;
      }
      const { error } = await supabase.rpc('deal_round', {
        p_room_id: state.roomId,
        p_round_number: state.currentRound,
      });
      if (error) {
        setState((prev) => ({ ...prev, errorMessage: error.message }));
      }
      return;
    }

    setState((prev) => {
      let rolePool: Role[] = ['RAJA', 'MONTRI', 'POLICE', 'CHOR'];
      if (prev.maxPlayers === 5) rolePool = ['RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI'];
      else if (prev.maxPlayers === 6) rolePool = ['RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI', 'BABU'];

      for (let i = rolePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
      }

      let kingId: string | null = null;
      let policeId: string | null = null;

      const newPlayers = prev.players.map((p, idx) => {
        const assignedRole = rolePool[idx];
        if (assignedRole === 'RAJA') kingId = p.id;
        if (assignedRole === 'POLICE') policeId = p.id;
        return {
          ...p,
          currentRole: assignedRole,
          isPeeked: p.isBot ? true : false,
          isRolePublic: false,
          isFramed: false,
          hasBribeOffer: false,
          bribeAccepted: false,
          speechBubble: undefined,
        };
      });

      const updated: GameState = {
        ...prev,
        phase: 'DEAL',
        kingId,
        policeId,
        accusedId: null,
        sabotageType: 'NONE',
        sabotageTargetId: null,
        kingDecreeUsed: false,
        players: newPlayers,
        roundResult: undefined,
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const peekRole = (peeked: boolean) => {
    setState((prev) => {
      const updated = {
        ...prev,
        players: prev.players.map((p) =>
          p.id === prev.activePlayerId ? { ...p, isPeeked: peeked } : p
        ),
      };
      if (prev.mode === 'LOCAL') broadcastLocalState(updated);
      return updated;
    });
  };

  const triggerRoyalCall = async () => {
    if (state.mode === 'ONLINE' && supabase && state.currentRoundId) {
      await supabase.rpc('reveal_king', { p_round_id: state.currentRoundId });
      return;
    }

    setState((prev) => {
      const updated: GameState = {
        ...prev,
        phase: 'ROYAL_CALL',
        players: prev.players.map((p) =>
          p.id === prev.kingId ? { ...p, isRolePublic: true } : p
        ),
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const triggerPoliceStep = async () => {
    if (state.mode === 'ONLINE' && supabase && state.currentRoundId) {
      await supabase.rpc('reveal_police', { p_round_id: state.currentRoundId });
      return;
    }

    setState((prev) => {
      const updated: GameState = {
        ...prev,
        phase: 'SABOTAGE',
        timerSeconds: 10,
        players: prev.players.map((p) =>
          p.id === prev.policeId ? { ...p, isRolePublic: true } : p
        ),
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const executeSabotage = async (type: SabotageType, targetId: string) => {
    if (state.mode === 'ONLINE' && supabase && state.currentRoundId) {
      await supabase
        .from('game_rounds')
        .update({ sabotage_type: type, sabotage_target_id: targetId })
        .eq('id', state.currentRoundId);
      return;
    }

    setState((prev) => {
      let newPlayers = [...prev.players];
      if (type === 'FRAME') {
        newPlayers = newPlayers.map((p) => (p.id === targetId ? { ...p, isFramed: true } : p));
      } else if (type === 'BRIBE') {
        newPlayers = newPlayers.map((p) => (p.id === targetId ? { ...p, hasBribeOffer: true } : p));
      }
      const updated: GameState = {
        ...prev,
        sabotageType: type,
        sabotageTargetId: targetId,
        players: newPlayers,
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const respondBribe = async (accepted: boolean) => {
    if (state.mode === 'ONLINE' && supabase && state.currentRoundId) {
      await supabase
        .from('game_rounds')
        .update({ bribe_accepted: accepted })
        .eq('id', state.currentRoundId);
      return;
    }

    setState((prev) => {
      const updated = {
        ...prev,
        players: prev.players.map((p) =>
          p.id === prev.activePlayerId ? { ...p, bribeAccepted: accepted, hasBribeOffer: false } : p
        ),
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const triggerKingDecree = async () => {
    if (state.mode === 'ONLINE' && supabase && state.currentRoundId) {
      await supabase
        .from('game_rounds')
        .update({ king_decree_used: true })
        .eq('id', state.currentRoundId);
      return;
    }

    setState((prev) => {
      const updated: GameState = {
        ...prev,
        kingDecreeUsed: true,
        decreeQuestion: {
          en: 'Did you swear eternal fealty to the Crown?',
          bn: 'আপনি কি রাজমুকুটের প্রতি চিরন্তন আনুগত্যের শপথ গ্রহণ করেছেন?',
          yesTextEn: 'I Swear!',
          yesTextBn: 'শপথ করছি!',
          noTextEn: 'No...',
          noTextBn: 'না...',
        },
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const answerDecree = (yes: boolean) => {
    setState((prev) => {
      const updated: GameState = {
        ...prev,
        decreeAnswers: { ...prev.decreeAnswers, [prev.activePlayerId]: yes },
      };
      if (prev.mode === 'LOCAL') broadcastLocalState(updated);
      return updated;
    });
  };

  const sendBluff = (text: string) => {
    if (state.mode === 'ONLINE' && supaChannelRef.current) {
      supaChannelRef.current.send({
        type: 'broadcast',
        event: 'bluff',
        payload: { playerId: state.activePlayerId, text },
      });
    }

    setState((prev) => {
      const updated = {
        ...prev,
        players: prev.players.map((p) =>
          p.id === prev.activePlayerId ? { ...p, speechBubble: text } : p
        ),
      };
      if (prev.mode === 'LOCAL') broadcastLocalState(updated);
      return updated;
    });

    setTimeout(() => {
      setState((prev) => {
        const updated = {
          ...prev,
          players: prev.players.map((p) =>
            p.id === prev.activePlayerId ? { ...p, speechBubble: undefined } : p
          ),
        };
        if (prev.mode === 'LOCAL') broadcastLocalState(updated);
        return updated;
      });
    }, 4000);
  };

  const selectSuspect = (suspectId: string) => {
    if (state.mode === 'ONLINE' && supaChannelRef.current) {
      supaChannelRef.current.send({
        type: 'broadcast',
        event: 'suspect_hover',
        payload: { suspectId },
      });
    }

    setState((prev) => {
      const updated = { ...prev, accusedId: suspectId };
      if (prev.mode === 'LOCAL') broadcastLocalState(updated);
      return updated;
    });
  };

  const lockInArrest = async (accusedId: string) => {
    if (state.mode === 'ONLINE' && supabase && state.currentRoundId) {
      await supabase.rpc('resolve_round', {
        p_round_id: state.currentRoundId,
        p_accused_id: accusedId,
      });
      return;
    }

    setState((prev) => {
      const thiefPlayer = prev.players.find((p) => p.currentRole === 'CHOR');
      const correctArrest = thiefPlayer?.id === accusedId;
      const pointsEarned: Record<string, number> = {};

      const newPlayers = prev.players.map((p) => {
        let earned = 0;
        if (p.currentRole === 'RAJA') earned = 1000;
        else if (p.currentRole === 'MONTRI') earned = 800;
        else if (p.currentRole === 'POLICE') earned = correctArrest ? 500 : 0;
        else if (p.currentRole === 'CHOR') {
          earned = !correctArrest ? (p.bribeAccepted ? 250 : 500) : 0;
        } else if (p.currentRole === 'SIPAHI') earned = 300;
        else if (p.currentRole === 'BABU') earned = 100;

        if (!correctArrest && p.bribeAccepted && p.currentRole !== 'CHOR') earned += 250;

        pointsEarned[p.id] = earned;
        return { ...p, score: p.score + earned, isRolePublic: true };
      });

      const updated: GameState = {
        ...prev,
        phase: 'RESOLUTION',
        accusedId,
        players: newPlayers,
        roundResult: {
          correctArrest,
          thiefId: thiefPlayer?.id || '',
          accusedId,
          pointsEarned,
          summaryEn: correctArrest
            ? 'The Police successfully identified the Thief! Full points awarded.'
            : 'Wrong arrest! The Thief deceived the Police and stole the bounty!',
          summaryBn: correctArrest
            ? 'পুলিশ নির্ভুলভাবে চোর শনাক্ত করেছে! রাজদরবারে ন্যায় প্রতিষ্ঠিত হলো।'
            : 'ভুল গ্রেপ্তার! আসল চোর পালিয়ে গেল এবং পয়েন্ট ছিনিয়ে নিলো!',
        },
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const nextRound = async () => {
    if (state.mode === 'ONLINE' && supabase && state.roomId) {
      await supabase
        .from('rooms')
        .update({ status: 'LOBBY', current_round: state.currentRound + 1 })
        .eq('id', state.roomId);
      return;
    }

    setState((prev) => {
      const updated: GameState = {
        ...prev,
        phase: 'LOBBY',
        currentRound: prev.currentRound + 1,
        kingId: null,
        policeId: null,
        accusedId: null,
        sabotageType: 'NONE',
        sabotageTargetId: null,
        roundResult: undefined,
        players: prev.players.map((p) => ({
          ...p,
          currentRole: null,
          isPeeked: false,
          isRolePublic: false,
          isFramed: false,
          hasBribeOffer: false,
          bribeAccepted: false,
          speechBubble: undefined,
        })),
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  const resetGame = async () => {
    if (state.mode === 'ONLINE' && supabase && state.roomId) {
      await supabase.from('room_members').update({ score: 0 }).eq('room_id', state.roomId);
      await supabase
        .from('rooms')
        .update({ status: 'LOBBY', current_round: 1 })
        .eq('id', state.roomId);
      return;
    }

    setState((prev) => {
      const updated: GameState = {
        ...prev,
        phase: 'LOBBY',
        currentRound: 1,
        kingId: null,
        policeId: null,
        accusedId: null,
        sabotageType: 'NONE',
        sabotageTargetId: null,
        roundResult: undefined,
        players: prev.players.map((p) => ({
          ...p,
          score: 0,
          currentRole: null,
          isPeeked: false,
          isRolePublic: false,
          isFramed: false,
          hasBribeOffer: false,
          bribeAccepted: false,
          speechBubble: undefined,
        })),
      };
      broadcastLocalState(updated);
      return updated;
    });
  };

  // Phase timers handling (Sabotage 10s -> Interrogation 25s)
  useEffect(() => {
    if (state.phase === 'SABOTAGE') {
      const interval = setInterval(() => {
        setState((prev) => {
          if (prev.timerSeconds <= 1) {
            clearInterval(interval);
            if (prev.mode === 'ONLINE' && supabase && prev.currentRoundId) {
              // Host transitions DB round state to INTERROGATION
              const host = prev.players.find((p) => p.isHost);
              if (host?.id === prev.activePlayerId) {
                supabase
                  .from('game_rounds')
                  .update({ state: 'INTERROGATION' })
                  .eq('id', prev.currentRoundId);
              }
            }
            const updated: GameState = {
              ...prev,
              phase: 'INTERROGATION',
              timerSeconds: 25,
            };
            if (prev.mode === 'LOCAL') broadcastLocalState(updated);
            return updated;
          }
          return { ...prev, timerSeconds: prev.timerSeconds - 1 };
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    if (state.phase === 'INTERROGATION') {
      const interval = setInterval(() => {
        setState((prev) => {
          if (prev.timerSeconds <= 0) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, timerSeconds: prev.timerSeconds - 1 };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.phase, broadcastLocalState]);

  const botPoliceGuess = () => {
    const suspects = state.players.filter((p) => !p.isRolePublic && p.id !== state.policeId);
    if (suspects.length === 0) return;
    const framed = suspects.find((s) => s.isFramed);
    const chosen =
      framed && Math.random() < 0.65
        ? framed
        : suspects[Math.floor(Math.random() * suspects.length)];

    setTimeout(() => {
      lockInArrest(chosen.id);
    }, 400);
  };

  const emergencyVerdict = () => {
    const suspects = state.players.filter((p) => !p.isRolePublic && p.id !== state.policeId);
    if (suspects.length === 0) return;
    const target = state.accusedId
      ? suspects.find((s) => s.id === state.accusedId) || suspects[0]
      : suspects[0];

    setTimeout(() => {
      lockInArrest(target.id);
    }, 300);
  };

  return (
    <GameContext.Provider
      value={{
        state,
        language,
        toggleLanguage,
        createOnlineRoom,
        joinOnlineRoom,
        startLocalPractice,
        leaveRoom,
        switchActivePlayer,
        toggleReady,
        startGame,
        peekRole,
        triggerRoyalCall,
        triggerPoliceStep,
        executeSabotage,
        respondBribe,
        triggerKingDecree,
        answerDecree,
        sendBluff,
        selectSuspect,
        lockInArrest,
        botPoliceGuess,
        emergencyVerdict,
        nextRound,
        resetGame,
        changeMaxPlayers,
        addBotSeat,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
