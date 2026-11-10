import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GameState } from '../../types/game';
import { RoleBadge } from './RoleBadge';
import { PlayerAvatar } from './PlayerAvatar';
import { sound } from '../../utils/audio';
import { haptic } from '../../utils/telegram';
import { Award, CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';

interface ResolutionModalProps {
  state: GameState;
  onNextRound: () => void;
  onShowFinalRankings: () => void;
  isHost: boolean;
  language?: 'en' | 'bn';
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  state,
  onNextRound,
  onShowFinalRankings,
  isHost,
  language = 'en',
}) => {
  const result = state.roundResult;
  const isCorrect = result?.correctArrest ?? false;

  useEffect(() => {
    if (isCorrect) {
      sound.playVictory();
      haptic.notification('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      sound.playSabotageStinger();
      haptic.notification('error');
    }
  }, [isCorrect]);

  const thiefPlayer = state.players.find((p) => p.id === result?.thiefId);
  const accusedPlayer = state.players.find((p) => p.id === result?.accusedId);
  const policePlayer = state.players.find((p) => p.id === state.policeId);

  const isFinalRound = state.currentRound >= state.maxRounds;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-[#0B0F19] border-2 border-amber-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl text-white text-center relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 ${
            isCorrect ? 'bg-emerald-500' : 'bg-purple-600'
          }`}
        />

        {/* Status Header */}
        <div className="relative z-10 flex flex-col items-center">
          {isCorrect ? (
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center mb-2">
              <XCircle className="w-8 h-8 text-purple-400" />
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow">
            {isCorrect
              ? language === 'bn'
                ? 'চোর ধরা পড়েছে!'
                : 'ARREST SUCCESSFUL!'
              : language === 'bn'
              ? 'চোর পালিয়ে গেছে!'
              : 'THE THIEF ESCAPED!'}
          </h2>

          <p className="text-xs text-slate-300 mt-1 max-w-xs font-medium">
            {language === 'bn' ? result?.summaryBn : result?.summaryEn}
          </p>
        </div>

        {/* Dramatic Suspect Comparison Cards */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 my-3.5">
          {/* Real Thief */}
          <div className="p-2.5 bg-purple-950/50 rounded-2xl border border-purple-500/40 flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 mb-1">
              {language === 'bn' ? 'আসল চোর' : 'REAL THIEF'}
            </span>
            <RoleBadge role="CHOR" size="md" showLabel={false} />
            <span className="mt-1 font-bold text-xs text-white truncate max-w-full">
              {thiefPlayer?.name}
            </span>
          </div>

          {/* Accused Player */}
          <div className="p-2.5 bg-slate-800/60 rounded-2xl border border-slate-700 flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {language === 'bn' ? 'গ্রেপ্তারকৃত' : 'ACCUSED'}
            </span>
            {accusedPlayer?.currentRole && (
              <RoleBadge role={accusedPlayer.currentRole} size="md" showLabel={false} />
            )}
            <span className="mt-1 font-bold text-xs text-white truncate max-w-full">
              {accusedPlayer?.name}
            </span>
          </div>
        </div>

        {/* Round Points Distribution Table */}
        <div className="relative z-10 bg-slate-800/70 rounded-2xl p-3 border border-slate-700 text-left my-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80 text-xs font-black text-amber-300">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {language === 'bn' ? 'রাউন্ডের পয়েন্ট' : 'Round Points'}
            </span>
            <span>{language === 'bn' ? 'মোট' : 'Total'}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {state.players.map((p) => {
              const earned = result?.pointsEarned[p.id] ?? 0;
              const isPolice = p.id === policePlayer?.id;
              const isThief = p.id === thiefPlayer?.id;

              return (
                <div key={p.id} className="flex items-center justify-between py-0.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-full border border-slate-600 shrink-0 overflow-hidden">
                      <PlayerAvatar
                        name={p.name}
                        avatarUrl={p.avatarUrl}
                        isBot={p.isBot}
                        textClassName="text-[10px]"
                      />
                    </div>
                    <span className="font-bold text-slate-200 truncate">{p.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/50 text-slate-400 shrink-0">
                      {isPolice
                        ? language === 'bn' ? 'পুলিশ' : 'Police'
                        : isThief
                        ? language === 'bn' ? 'চোর' : 'Thief'
                        : p.currentRole ?? ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-black text-xs ${
                        earned > 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      +{earned}
                    </span>
                    <span className="font-bold text-amber-300 text-xs w-10 text-right">
                      {p.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 pt-1 flex flex-col gap-2">
          {isHost ? (
            isFinalRound ? (
              <button
                onClick={() => {
                  sound.playVictory();
                  haptic.impact('heavy');
                  onShowFinalRankings();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span>{language === 'bn' ? 'চূড়ান্ত ফলাফল দেখুন 🏆' : 'VIEW FINAL RANKINGS 🏆'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playGavel();
                  haptic.impact('medium');
                  onNextRound();
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-sm rounded-xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>
                  {language === 'bn'
                    ? `পরবর্তী রাউন্ড (${state.currentRound + 1}/${state.maxRounds})`
                    : `NEXT ROUND (${state.currentRound + 1}/${state.maxRounds})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )
          ) : (
            <span className="text-[11px] text-slate-400 py-1 font-semibold">
              {language === 'bn' ? 'হোস্টের নির্দেশের অপেক্ষায়...' : 'Waiting for host to continue...'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
