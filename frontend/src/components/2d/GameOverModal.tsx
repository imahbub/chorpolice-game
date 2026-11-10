import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GameState } from '../../types/game';
import { PlayerAvatar } from './PlayerAvatar';
import { sound } from '../../utils/audio';
import { haptic } from '../../utils/telegram';
import { Trophy, Crown, RotateCcw, Home, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  state: GameState;
  isHost: boolean;
  onRematch: () => void;
  onLeaveRoom: () => void;
  language?: 'en' | 'bn';
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  isHost,
  onRematch,
  onLeaveRoom,
  language = 'en',
}) => {
  const rankedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = rankedPlayers[0];

  useEffect(() => {
    sound.playVictory();
    haptic.notification('success');
    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.55 },
    });
  }, []);

  const getRankBadge = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `#${idx + 1}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-[#111827] to-[#0B0F19] border-2 border-amber-400/70 rounded-3xl p-4 sm:p-5 shadow-2xl text-white text-center relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Golden Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-amber-500/25 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg mb-2 border border-yellow-200">
            <Trophy className="w-7 h-7 text-slate-950" />
          </div>
          <span className="text-[11px] font-black tracking-widest uppercase text-amber-400">
            {language === 'bn' ? 'ম্যাচ সমাপ্ত' : 'MATCH COMPLETE'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            {language === 'bn' ? 'চূড়ান্ত ফলাফল ও র‍্যাংকিং' : 'FINAL RANKINGS'}
          </h2>
        </div>

        {/* Champion Spotlight */}
        {winner && (
          <div className="relative z-10 my-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/20 border-2 border-amber-400/60 flex items-center gap-3 text-left shadow-xl">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full border-2 border-amber-300 p-0.5 bg-slate-900">
                <PlayerAvatar
                  name={winner.name}
                  avatarUrl={winner.avatarUrl}
                  isBot={winner.isBot}
                />
              </div>
              <div className="absolute -top-2 -right-1 p-1 bg-amber-400 rounded-full shadow">
                <Crown className="w-3 h-3 text-slate-950" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                {language === 'bn' ? '🏆 ম্যাচ চ্যাম্পিয়ন' : '🏆 MATCH CHAMPION'}
              </span>
              <h3 className="text-base font-black text-white truncate">{winner.name}</h3>
              <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {winner.score} {language === 'bn' ? 'পয়েন্ট' : 'pts'}
              </span>
            </div>
          </div>
        )}

        {/* Full Ranked Leaderboard */}
        <div className="relative z-10 bg-slate-900/90 rounded-2xl p-3 border border-slate-700/80 text-left space-y-2 mb-4">
          {rankedPlayers.map((p, idx) => {
            const isMe = p.id === state.activePlayerId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl border ${
                  idx === 0
                    ? 'bg-amber-500/15 border-amber-400/50'
                    : isMe
                    ? 'bg-blue-500/10 border-blue-400/40'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 text-center font-black text-sm shrink-0">
                    {getRankBadge(idx)}
                  </span>
                  <div className="w-8 h-8 rounded-full border border-slate-600 shrink-0 overflow-hidden">
                    <PlayerAvatar
                      name={p.name}
                      avatarUrl={p.avatarUrl}
                      isBot={p.isBot}
                      textClassName="text-xs"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white truncate block">
                      {p.name} {isMe && <span className="text-amber-300">({language === 'bn' ? 'আপনি' : 'You'})</span>}
                    </span>
                  </div>
                </div>

                <span className="font-black text-xs sm:text-sm text-amber-300 shrink-0 ml-2">
                  {p.score} {language === 'bn' ? 'পয়েন্ট' : 'pts'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 flex flex-col gap-2">
          {isHost ? (
            <button
              onClick={() => {
                sound.playGavel();
                haptic.impact('heavy');
                onRematch();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন ম্যাচ শুরু করুন' : 'PLAY REMATCH'}</span>
            </button>
          ) : (
            <div className="py-1.5 text-[11px] text-slate-400 font-semibold">
              {language === 'bn' ? 'হোস্টের নতুন ম্যাচের অপেক্ষায়...' : 'Waiting for host to start a rematch...'}
            </div>
          )}

          <button
            onClick={() => {
              sound.playPaperRustle();
              haptic.selection();
              onLeaveRoom();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 border-b-4 border-b-slate-950 active:border-b active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{language === 'bn' ? 'হোম মেনুতে ফিরুন' : 'Back to Home Hub'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
