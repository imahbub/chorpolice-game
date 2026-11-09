import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player, Role, SabotageType } from '../types/game';
import { getTelegramWebApp } from '../utils/telegram';

interface GameContextType {
  state: GameState;
  language: 'en' | 'bn';
  toggleLanguage: () => void;
  switchActivePlayer: (playerId: string) => void;
  toggleReady: () => void;
  startGame: () => void;
  peekRole: (peeked: boolean) => void;
  triggerRoyalCall: () => void;
  triggerPoliceStep: () => void;
  executeSabotage: (type: SabotageType, targetId: string) => void;
  respondBribe: (accepted: boolean) => void;
  triggerKingDecree: () => void;
  answerDecree: (yes: boolean) => void;
  sendBluff: (text: string) => void;
  selectSuspect: (suspectId: string) => void;
  lockInArrest: (suspectId: string) => void;
  botPoliceGuess: () => void;
  nextRound: () => void;
  resetGame: () => void;
  changeMaxPlayers: (count: 4 | 5 | 6) => void;
  addBotSeat: () => void;
}

const DEFAULT_NAMES = [
  'Rahat (রাহাত)',
  'Anika (আনিকা)',
  'Tanvir (তানভীর)',
  'Sumon (সুমন)',
  'Farhan (ফারহান)',
  'Maya (মায়া)',
];

const createInitialPlayers = (maxPlayers: 4 | 5 | 6): Player[] => {
  const tgUser = getTelegramWebApp()?.initDataUnsafe?.user;
  const initialName = tgUser ? `${tgUser.first_name}` : DEFAULT_NAMES[0];

  return Array.from({ length: maxPlayers }, (_, i) => ({
    id: `player_${i + 1}`,
    name: i === 0 ? initialName : DEFAULT_NAMES[i] || `Player ${i + 1}`,
    username: i === 0 ? tgUser?.username : `player_${i + 1}`,
    avatarSeed: `avatar_${i + 1}`,
    seatIndex: i,
    isHost: i === 0,
    isReady: i === 0 ? true : false,
    score: 0,
    currentRole: null,
    isPeeked: false,
    isRolePublic: false,
    isBot: i !== 0,
  }));
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [activePlayerId, setActivePlayerId] = useState<string>('player_1');

  const [state, setState] = useState<GameState>(() => ({
    roomId: 'room_dev_1',
    roomCode: 'CP-8492',
    phase: 'LOBBY',
    currentRound: 1,
    maxRounds: 5,
    maxPlayers: 4,
    players: createInitialPlayers(4),
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

  // Synchronize across tabs using BroadcastChannel
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('chor_police_sync');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_STATE') {
          setState((prev) => ({
            ...event.data.payload,
            activePlayerId: prev.activePlayerId, // retain local tab's chosen perspective
          }));
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  const broadcastState = useCallback((newState: GameState) => {
    try {
      channelRef.current?.postMessage({
        type: 'SYNC_STATE',
        payload: newState,
      });
    } catch {
      // Ignore
    }
  }, []);

  // Update max players count
  const changeMaxPlayers = (count: 4 | 5 | 6) => {
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
          });
        }
      } else {
        newPlayers = newPlayers.slice(0, count);
      }

      const updated = {
        ...prev,
        maxPlayers: count,
        players: newPlayers,
      };
      broadcastState(updated);
      return updated;
    });
  };

  // Add AI Seat
  const addBotSeat = () => {
    setState((prev) => {
      const unready = prev.players.find((p) => !p.isReady);
      if (unready) {
        const newPlayers = prev.players.map((p) =>
          p.id === unready.id ? { ...p, isReady: true, isBot: true } : p
        );
        const updated = { ...prev, players: newPlayers };
        broadcastState(updated);
        return updated;
      }
      return prev;
    });
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const switchActivePlayer = (playerId: string) => {
    setActivePlayerId(playerId);
    setState((prev) => ({ ...prev, activePlayerId: playerId }));
  };

  const toggleReady = () => {
    setState((prev) => {
      const newPlayers = prev.players.map((p) =>
        p.id === activePlayerId ? { ...p, isReady: !p.isReady } : p
      );
      const updated = { ...prev, players: newPlayers };
      broadcastState(updated);
      return updated;
    });
  };

  // Fisher-Yates role deal
  const startGame = () => {
    setState((prev) => {
      let rolePool: Role[] = ['RAJA', 'MONTRI', 'POLICE', 'CHOR'];
      if (prev.maxPlayers === 5) {
        rolePool = ['RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI'];
      } else if (prev.maxPlayers === 6) {
        rolePool = ['RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI', 'BABU'];
      }

      // Shuffle
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

      broadcastState(updated);
      return updated;
    });
  };

  const peekRole = (peeked: boolean) => {
    setState((prev) => {
      const newPlayers = prev.players.map((p) =>
        p.id === activePlayerId ? { ...p, isPeeked: peeked } : p
      );
      const updated = { ...prev, players: newPlayers };
      broadcastState(updated);
      return updated;
    });
  };

  // King royal call: reveals Raja publicly
  const triggerRoyalCall = () => {
    setState((prev) => {
      const newPlayers = prev.players.map((p) =>
        p.id === prev.kingId ? { ...p, isRolePublic: true } : p
      );
      const updated: GameState = {
        ...prev,
        phase: 'ROYAL_CALL',
        players: newPlayers,
      };
      broadcastState(updated);
      return updated;
    });
  };

  // Police steps up
  const triggerPoliceStep = () => {
    setState((prev) => {
      const newPlayers = prev.players.map((p) =>
        p.id === prev.policeId ? { ...p, isRolePublic: true } : p
      );
      const updated: GameState = {
        ...prev,
        phase: 'SABOTAGE',
        timerSeconds: 10,
        players: newPlayers,
      };
      broadcastState(updated);
      return updated;
    });
  };

  // Sabotage: Frame or Bribe
  const executeSabotage = (type: SabotageType, targetId: string) => {
    setState((prev) => {
      let newPlayers = [...prev.players];
      if (type === 'FRAME') {
        newPlayers = newPlayers.map((p) =>
          p.id === targetId ? { ...p, isFramed: true } : p
        );
      } else if (type === 'BRIBE') {
        newPlayers = newPlayers.map((p) =>
          p.id === targetId ? { ...p, hasBribeOffer: true } : p
        );
      }

      const updated: GameState = {
        ...prev,
        sabotageType: type,
        sabotageTargetId: targetId,
        players: newPlayers,
      };
      broadcastState(updated);
      return updated;
    });
  };

  const respondBribe = (accepted: boolean) => {
    setState((prev) => {
      const newPlayers = prev.players.map((p) =>
        p.id === activePlayerId
          ? { ...p, bribeAccepted: accepted, hasBribeOffer: false }
          : p
      );
      const updated = { ...prev, players: newPlayers };
      broadcastState(updated);
      return updated;
    });
  };

  const triggerKingDecree = () => {
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
      broadcastState(updated);
      return updated;
    });
  };

  const answerDecree = (yes: boolean) => {
    setState((prev) => {
      const updated: GameState = {
        ...prev,
        decreeAnswers: {
          ...prev.decreeAnswers,
          [activePlayerId]: yes,
        },
      };
      broadcastState(updated);
      return updated;
    });
  };

  const sendBluff = (text: string) => {
    setState((prev) => {
      const newPlayers = prev.players.map((p) =>
        p.id === activePlayerId ? { ...p, speechBubble: text } : p
      );
      const updated = { ...prev, players: newPlayers };
      broadcastState(updated);
      return updated;
    });

    // Auto clear speech bubble after 4 seconds
    setTimeout(() => {
      setState((prev) => {
        const newPlayers = prev.players.map((p) =>
          p.id === activePlayerId ? { ...p, speechBubble: undefined } : p
        );
        const updated = { ...prev, players: newPlayers };
        broadcastState(updated);
        return updated;
      });
    }, 4000);
  };

  const selectSuspect = (suspectId: string) => {
    setState((prev) => {
      const updated = { ...prev, accusedId: suspectId };
      broadcastState(updated);
      return updated;
    });
  };

  // Lock In Arrest & Calculate Points
  const lockInArrest = (accusedId: string) => {
    setState((prev) => {
      const thiefPlayer = prev.players.find((p) => p.currentRole === 'CHOR');
      const correctArrest = thiefPlayer?.id === accusedId;

      const pointsEarned: Record<string, number> = {};

      const newPlayers = prev.players.map((p) => {
        let earned = 0;
        if (p.currentRole === 'RAJA') {
          earned = 1000;
        } else if (p.currentRole === 'MONTRI') {
          earned = 800;
        } else if (p.currentRole === 'POLICE') {
          earned = correctArrest ? 500 : 0;
        } else if (p.currentRole === 'CHOR') {
          if (!correctArrest) {
            // Thief escaped! Check bribe
            if (p.bribeAccepted) {
              earned = 250;
            } else {
              earned = 500;
            }
          } else {
            earned = 0;
          }
        } else if (p.currentRole === 'SIPAHI') {
          earned = 300;
        } else if (p.currentRole === 'BABU') {
          earned = 100;
        }

        // Bribe split bonus
        if (!correctArrest && p.bribeAccepted && p.currentRole !== 'CHOR') {
          earned += 250;
        }

        pointsEarned[p.id] = earned;

        return {
          ...p,
          score: p.score + earned,
          isRolePublic: true, // reveal all at resolution
        };
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
            ? `The Police successfully identified the Thief! Full points awarded.`
            : `Wrong arrest! The Thief deceived the Police and stole the bounty!`,
          summaryBn: correctArrest
            ? `পুলিশ নির্ভুলভাবে চোর শনাক্ত করেছে! রাজদরবারে ন্যায় প্রতিষ্ঠিত হলো।`
            : `ভুল গ্রেপ্তার! আসল চোর পালিয়ে গেল এবং পয়েন্ট ছিনিয়ে নিলো!`,
        },
      };

      broadcastState(updated);
      return updated;
    });
  };

  // Next round
  const nextRound = () => {
    setState((prev) => {
      const nextRoundNum = prev.currentRound + 1;
      const updated: GameState = {
        ...prev,
        phase: 'LOBBY',
        currentRound: nextRoundNum,
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
      broadcastState(updated);
      return updated;
    });
  };

  // Reset entire game
  const resetGame = () => {
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
      broadcastState(updated);
      return updated;
    });
  };

  // Phase timers handling (Sabotage 10s, Interrogation 25s)
  useEffect(() => {
    if (state.phase === 'SABOTAGE') {
      const interval = setInterval(() => {
        setState((prev) => {
          if (prev.timerSeconds <= 1) {
            clearInterval(interval);
            const updated: GameState = {
              ...prev,
              phase: 'INTERROGATION',
              timerSeconds: 25,
            };
            broadcastState(updated);
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
            return prev; // Hold at 0 without auto-guessing
          }
          return { ...prev, timerSeconds: prev.timerSeconds - 1 };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.phase]);

  // AI Police deliberate decision
  const botPoliceGuess = () => {
    setState((prev) => {
      const suspects = prev.players.filter(
        (p) => !p.isRolePublic && p.id !== prev.policeId
      );
      if (suspects.length === 0) return prev;
      // If a suspect is framed, AI has higher suspicion on them, or pick random
      const framed = suspects.find((s) => s.isFramed);
      const chosen = framed && Math.random() < 0.65
        ? framed
        : suspects[Math.floor(Math.random() * suspects.length)];

      setTimeout(() => {
        lockInArrest(chosen.id);
      }, 500);

      return prev;
    });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        language,
        toggleLanguage,
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
