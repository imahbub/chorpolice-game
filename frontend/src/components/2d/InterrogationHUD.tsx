import React from 'react';
import { motion } from 'framer-motion';
import { Player, Role } from '../../types/game';
import { sound } from '../../utils/audio';
import { haptic } from '../../utils/telegram';
import { ShieldAlert, Search, Clock, MessageSquare, HandMetal, Bot, UserCheck, Crown } from 'lucide-react';

interface InterrogationHUDProps {
  isPolice: boolean;
  policePlayer?: Player;
  activePlayerRole?: Role | null;
  suspects: Player[];
  selectedSuspectId: string | null;
  onSelectSuspect: (suspectId: string) => void;
  onLockInArrest: (suspectId: string) => void;
  onSendBluff: (text: string) => void;
  timerSeconds: number;
  language?: 'en' | 'bn';
  onBotPoliceDecide?: () => void;
  onEmergencyVerdict?: () => void;
}

export const InterrogationHUD: React.FC<InterrogationHUDProps> = ({
  isPolice,
  policePlayer,
  activePlayerRole,
  suspects,
  selectedSuspectId,
  onSelectSuspect,
  onLockInArrest,
  onSendBluff,
  timerSeconds,
  language = 'en',
  onBotPoliceDecide,
  onEmergencyVerdict,
}) => {
  const selectedSuspect = suspects.find((s) => s.id === selectedSuspectId);

  const bluffOptions = language === 'bn'
    ? [
        'রাজার কসম, আমি নির্দোষ!',
        'ওর হাতের কাঁপুনি দেখুন!',
        '২০ বছর বিশ্বস্ত সেবা দিয়েছি!',
        'আমার দিকে তাকাচ্ছেন কেন?!',
        'আমার চোখে তাকান, আমি চোর নই!',
      ]
    : [
        "I swear on the Crown, I'm innocent!",
        'Look at his hands shaking!',
        'Served honestly for 20 years!',
        'Why are you staring at me?!',
        'Trust my eyes, Inspector!',
      ];

  return (
    <div className="w-full max-w-md mx-auto my-2 p-3 bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-blue-500/50 shadow-2xl text-white">
      {/* Timer & Police Indicator Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-500/30 text-xs">
        <div className="flex items-center gap-1.5 text-blue-300 font-black">
          <Search className="w-4 h-4 text-blue-400" />
          <span>
            {language === 'bn' ? 'পুলিশি জেরা ও তদন্ত' : 'POLICE INTERROGATION'}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-950 text-blue-200 rounded-full font-bold border border-blue-700">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{timerSeconds}s</span>
        </div>
      </div>

      {/* Role Banner: Clearly explains WHO is deciding */}
      <div className="mb-3 px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-slate-300 block text-[11px]">
              {language === 'bn' ? 'দায়িত্বপ্রাপ্ত পুলিশ:' : 'Investigating Police:'}{' '}
              <strong className="text-white font-black">{policePlayer?.name || 'Police'}</strong>
            </span>
            <span className="text-amber-300 font-bold text-[10px]">
              {isPolice
                ? language === 'bn'
                  ? '👉 আপনিই পুলিশ! নিচের সন্দেহভাজনদের একজনকে গ্রেপ্তার করুন।'
                  : '👉 You are the Police! Tap a suspect below to arrest.'
                : language === 'bn'
                ? `👀 আপনার ভূমিকা: ${activePlayerRole || 'সন্দেহভাজন'}। পুলিশ সিদ্ধান্ত নেওয়ার আগে নিজের সাফাই দিন!`
                : `👀 Your Role: ${activePlayerRole || 'Suspect'}. Defend yourself while Police investigates!`}
            </span>
          </div>
        </div>
      </div>

      {/* 1. POLICE CONTROLS (Active if the current user is Police) */}
      {isPolice ? (
        <div>
          <div className="text-center mb-2">
            <span className="text-xs text-blue-200 font-semibold">
              {language === 'bn'
                ? 'সন্দেহভাজনদের ভালো করে পরখ করুন এবং একজনকে গ্রেপ্তার করুন:'
                : 'Inspect the suspects and identify the real Thief:'}
            </span>
          </div>

          {/* Suspects Carousel/Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {suspects.map((suspect) => {
              const isSelected = selectedSuspectId === suspect.id;
              const isFramed = suspect.isFramed;

              return (
                <motion.div
                  key={suspect.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onSelectSuspect(suspect.id);
                    sound.playTick();
                    haptic.selection();
                  }}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer flex flex-col items-center text-center transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                      : 'bg-slate-800 border-slate-700 hover:border-blue-400'
                  } ${isFramed ? 'framed-jitter' : ''}`}
                >
                  {isFramed && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}

                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-black text-amber-300 text-sm mb-1 border border-white/20">
                    {suspect.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold truncate max-w-full">
                    {suspect.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'bn' ? 'সন্দেহভাজন' : 'Suspect'}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Lock In Arrest Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!selectedSuspectId}
            onClick={() => {
              if (selectedSuspectId) {
                sound.playLockIn();
                sound.playPoliceAlert();
                haptic.impact('heavy');
                onLockInArrest(selectedSuspectId);
              }
            }}
            className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl border transition-all ${
              selectedSuspectId
                ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border-red-400 text-white cursor-pointer'
                : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span>
              {language === 'bn'
                ? selectedSuspect
                  ? `${selectedSuspect.name}-কে গ্রেপ্তার নিশ্চিত করুন!`
                  : 'গ্রেপ্তার করতে সন্দেহভাজন নির্বাচন করুন'
                : selectedSuspect
                ? `LOCK IN ARREST: ${selectedSuspect.name}`
                : 'Select a suspect to arrest'}
            </span>
          </motion.button>
        </div>
      ) : (
        /* 2. SUSPECT / CIVILIAN CONTROLS (Bluff deck + Bot helper) */
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>
              {language === 'bn'
                ? 'পুলিশের দৃষ্টি আকর্ষণে তাৎক্ষণিক সংলাপ / প্রতিবাদ দিন:'
                : 'Defend your innocence or bluff the Police:'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {bluffOptions.map((text, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sound.playPaperRustle();
                  haptic.impact('light');
                  onSendBluff(text);
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1 transition-colors"
              >
                <HandMetal className="w-3 h-3 text-amber-400" />
                <span>{text}</span>
              </motion.button>
            ))}
          </div>

          {/* If the Police is a bot or you are testing solo: trigger Police decision */}
          {onBotPoliceDecide && (
            <button
              onClick={() => {
                sound.playLockIn();
                haptic.impact('medium');
                onBotPoliceDecide();
              }}
              className="w-full py-2 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/40 rounded-xl text-xs font-bold text-blue-200 flex items-center justify-center gap-1.5 transition-all"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>
                {language === 'bn'
                  ? `পুলিশ (${policePlayer?.name || 'AI'})-কে সিদ্ধান্ত নিতে বলুন`
                  : `Let Police (${policePlayer?.name || 'AI'}) decide now`}
              </span>
            </button>
          )}
          {/* Emergency Royal Verdict if Police drops out (available after 45s) */}
          {onEmergencyVerdict && activePlayerRole === 'RAJA' && timerSeconds <= 15 && (
            <button
              onClick={() => {
                sound.playGavel();
                haptic.impact('heavy');
                onEmergencyVerdict();
              }}
              className="w-full mt-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-xl text-xs font-black text-amber-300 flex items-center justify-center gap-1.5 transition-all shadow"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>
                {language === 'bn'
                  ? 'রাজকীয় ফরমান জারি (পুলিশ নিষ্ক্রিয়)'
                  : 'Royal Emergency Verdict (Police Inactive)'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
