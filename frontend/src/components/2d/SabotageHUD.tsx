import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, SabotageType } from '../../types/game';
import { sound } from '../../utils/audio';
import { haptic } from '../../utils/telegram';
import { Flame, Coins, ShieldCheck, Crown, AlertTriangle, Clock } from 'lucide-react';

interface SabotageHUDProps {
  isThief: boolean;
  isKing: boolean;
  hasBribeOffer: boolean;
  players: Player[];
  activePlayerId: string;
  timerSeconds: number;
  onExecuteSabotage: (type: SabotageType, targetId: string) => void;
  onRespondBribe: (accepted: boolean) => void;
  onTriggerKingDecree?: () => void;
  kingDecreeUsed: boolean;
  language?: 'en' | 'bn';
}

export const SabotageHUD: React.FC<SabotageHUDProps> = ({
  isThief,
  isKing,
  hasBribeOffer,
  players,
  activePlayerId,
  timerSeconds,
  onExecuteSabotage,
  onRespondBribe,
  onTriggerKingDecree,
  kingDecreeUsed,
  language = 'en',
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<SabotageType>('NONE');

  // Filter suspects the thief can target (cannot target self or public King)
  const availableTargets = players.filter(
    (p) => p.id !== activePlayerId && !p.isRolePublic
  );

  const handleFrame = (targetId: string) => {
    sound.playSabotageStinger();
    haptic.impact('heavy');
    onExecuteSabotage('FRAME', targetId);
    setActiveAction('NONE');
    setSelectedTarget(null);
  };

  const handleBribe = (targetId: string) => {
    sound.playSabotageStinger();
    haptic.impact('heavy');
    onExecuteSabotage('BRIBE', targetId);
    setActiveAction('NONE');
    setSelectedTarget(null);
  };

  return (
    <div className="w-full max-w-md mx-auto my-2 p-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border-2 border-purple-500/50 shadow-2xl text-white">
      {/* Timer Bar */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-500/20 text-xs">
        <div className="flex items-center gap-1.5 text-purple-300 font-black">
          <Clock className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>
            {language === 'bn' ? 'সিন্ডিকেট চাল পর্ব' : 'THE SYNDICATE PHASE'}
          </span>
        </div>
        <div className="px-2.5 py-0.5 bg-purple-950 text-purple-200 rounded-full font-bold border border-purple-800">
          {timerSeconds}s
        </div>
      </div>

      {/* 1. THIEF CONTROLS */}
      {isThief && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-purple-200 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {language === 'bn'
                ? 'আপনি চোর! পুলিশকে ধোঁকা দিতে নিচের যেকোনো একটি কৌশল বেছে নিন:'
                : 'You are the Thief! Choose an active sabotage before the Police interrogates:'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Action 1: Frame */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveAction(activeAction === 'FRAME' ? 'NONE' : 'FRAME');
                haptic.selection();
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                activeAction === 'FRAME'
                  ? 'bg-red-600 border-red-300 shadow-lg text-white'
                  : 'bg-slate-800 border-slate-700 hover:border-red-400 text-slate-200'
              }`}
            >
              <Flame className="w-6 h-6 text-red-400" />
              <span className="font-black text-xs">
                {language === 'bn' ? 'নির্দোষকে ফাঁসানো' : 'Frame Suspect'}
              </span>
              <span className="text-[10px] opacity-80 text-center">
                {language === 'bn' ? 'কার্ডে নার্ভাস কাঁপুনি আনুন' : 'Visual jitter on victim'}
              </span>
            </motion.button>

            {/* Action 2: Bribe */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveAction(activeAction === 'BRIBE' ? 'NONE' : 'BRIBE');
                haptic.selection();
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                activeAction === 'BRIBE'
                  ? 'bg-amber-600 border-amber-300 shadow-lg text-white'
                  : 'bg-slate-800 border-slate-700 hover:border-amber-400 text-slate-200'
              }`}
            >
              <Coins className="w-6 h-6 text-amber-400" />
              <span className="font-black text-xs">
                {language === 'bn' ? 'গোপন ঘুষ চুক্তি' : 'Offer Secret Bribe'}
              </span>
              <span className="text-[10px] opacity-80 text-center">
                {language === 'bn' ? '৫০% পয়েন্ট ভাগাভাগি' : '50/50 bounty split'}
              </span>
            </motion.button>
          </div>

          {/* Suspect Target Selector */}
          <AnimatePresence>
            {activeAction !== 'NONE' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-purple-500/30"
              >
                <p className="text-[11px] font-bold text-amber-300 mb-2">
                  {language === 'bn' ? 'টার্গেট খেলোয়াড় নির্বাচন করুন:' : 'Select Target Suspect:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableTargets.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => {
                        setSelectedTarget(target.id);
                        if (activeAction === 'FRAME') handleFrame(target.id);
                        if (activeAction === 'BRIBE') handleBribe(target.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                        selectedTarget === target.id
                          ? 'bg-purple-600 border-white text-white'
                          : 'bg-slate-800 border-slate-600 hover:border-purple-400'
                      }`}
                    >
                      <span>{target.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. BRIBE RECIPIENT POPUP (e.g. Minister or Citizen) */}
      {hasBribeOffer && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-3 bg-amber-950/80 rounded-xl border-2 border-amber-500 text-center"
        >
          <div className="flex items-center justify-center gap-1.5 text-amber-400 font-black text-sm mb-1">
            <Coins className="w-5 h-5" />
            <span>{language === 'bn' ? 'গোপন ঘুষের প্রস্তাব!' : 'Secret Bribe Offer!'}</span>
          </div>
          <p className="text-xs text-amber-200 mb-3">
            {language === 'bn'
              ? 'চোর আপনাকে ৫০% পয়েন্ট ভাগাভাগির লোভনীয় প্রস্তাব পাঠিয়েছে। পুলিশ ভুল করলে দুজনেই জিতবেন!'
              : 'The Thief offers you a 50/50 bounty split. If the Police guesses wrong, both profit!'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                sound.playVictory();
                haptic.impact('medium');
                onRespondBribe(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
            >
              {language === 'bn' ? 'ঘুষ গ্রহণ করুন 🤝' : 'Accept Deal 🤝'}
            </button>
            <button
              onClick={() => {
                sound.playLockIn();
                haptic.impact('light');
                onRespondBribe(false);
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold"
            >
              {language === 'bn' ? 'প্রত্যাখ্যান করুন 🛡️' : 'Decline 🛡️'}
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. KING ROYAL DECREE */}
      {isKing && !kingDecreeUsed && (
        <div className="mt-2 p-2.5 bg-amber-900/30 rounded-xl border border-amber-500/40 flex items-center justify-between">
          <div className="text-left">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
              <Crown className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'রাজকীয় ফরমান' : 'Royal Decree'}</span>
            </div>
            <p className="text-[10px] text-amber-200/80">
              {language === 'bn' ? 'সন্দেহভাজনদের সরাসরি শপথ বাক্যের মুখোমুখি করুন' : 'Force suspects to take an oath!'}
            </p>
          </div>
          <button
            onClick={() => {
              sound.playGavel();
              haptic.impact('heavy');
              onTriggerKingDecree?.();
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-lg text-xs shadow"
          >
            {language === 'bn' ? 'ফরমান জারি' : 'Issue Decree'}
          </button>
        </div>
      )}

      {/* 4. OTHER PLAYERS SPECTATING */}
      {!isThief && !hasBribeOffer && (!isKing || kingDecreeUsed) && (
        <div className="py-2 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>
            {language === 'bn'
              ? 'চোর অন্ধকারে ফাঁদ পাতছে... পুলিশি জেরার জন্য প্রস্তুত হোন!'
              : 'The Thief is plotting in the shadows... Stand by for interrogation!'}
          </span>
        </div>
      )}
    </div>
  );
};
