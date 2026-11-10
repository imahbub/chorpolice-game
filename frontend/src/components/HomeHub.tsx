import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RoleBadge } from './2d/RoleBadge';
import { getTelegramWebApp } from '../utils/telegram';
import { getSavedGuestName } from '../lib/identity';
import { sound } from '../utils/audio';
import { haptic } from '../utils/telegram';
import { Crown, KeyRound, PlusCircle, Bot, Users, Sparkles, AlertCircle } from 'lucide-react';

interface HomeHubProps {
  language: 'en' | 'bn';
  isLoading?: boolean;
  errorMessage?: string | null;
  onCreateRoom: (maxPlayers: 4 | 5 | 6, maxRounds: number, customName?: string) => void;
  onJoinRoom: (code: string, customName?: string) => void;
  onStartLocalPractice: (maxPlayers: 4 | 5 | 6) => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  language,
  isLoading = false,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
  onStartLocalPractice,
}) => {
  const tgUser = getTelegramWebApp()?.initDataUnsafe?.user;
  const [guestName, setGuestName] = useState<string>(tgUser?.first_name || getSavedGuestName());
  const [joinCode, setJoinCode] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<4 | 5 | 6>(4);
  const [maxRounds, setMaxRounds] = useState<number>(5);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    sound.playPaperRustle();
    haptic.impact('medium');
    onJoinRoom(joinCode.trim().toUpperCase(), guestName);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 flex flex-col gap-4">
      {/* Hero 2D Emblem Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center flex flex-col items-center"
      >
        <div className="flex items-center justify-center -space-x-3 mb-2">
          <RoleBadge role="RAJA" size="sm" showLabel={false} className="-rotate-12" />
          <RoleBadge role="POLICE" size="md" showLabel={false} className="z-10 scale-110" />
          <RoleBadge role="CHOR" size="sm" showLabel={false} className="rotate-12" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          {language === 'bn' ? 'চোর পুলিশ — রয়্যাল টেবিল' : 'CHOR POLICE'}
        </h2>
        <p className="text-xs text-slate-400">
          {language === 'bn'
            ? 'কাস্টম রুম তৈরি করুন অথবা রুম কোড দিয়ে বন্ধুদের সাথে যোগ দিন'
            : 'Create a custom table or join friends with a room code'}
        </p>
      </motion.div>

      {/* Player Identity Badge (Editable if not inside Telegram) */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center font-black text-black text-base shadow">
            {(tgUser?.first_name || guestName || 'P').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              {tgUser
                ? language === 'bn' ? 'টেলিগ্রাম প্রোফাইল' : 'Telegram Account'
                : language === 'bn' ? 'আপনার নাম' : 'Display Name'}
            </span>
            {tgUser ? (
              <span className="text-sm font-black text-white">
                {tgUser.first_name} {tgUser.username ? `(@${tgUser.username})` : ''}
              </span>
            ) : (
              <input
                type="text"
                value={guestName}
                maxLength={20}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-400 mt-0.5"
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* CARD 1: JOIN WITH ROOM CODE */}
      <form
        onSubmit={handleJoinSubmit}
        className="bg-slate-900/90 border-2 border-blue-500/40 rounded-2xl p-4 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-2 text-blue-300 font-black text-sm">
          <KeyRound className="w-4 h-4 text-blue-400" />
          <span>{language === 'bn' ? 'কোড দিয়ে রুমে যোগ দিন' : 'Join with Room Code'}</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="CP-7K9X2M"
            maxLength={9}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm font-black tracking-widest text-amber-300 placeholder:text-slate-500 uppercase focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={isLoading || !joinCode.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {isLoading ? '...' : language === 'bn' ? 'যোগ দিন' : 'JOIN'}
          </button>
        </div>
      </form>

      {/* CARD 2: CREATE CUSTOM ROOM */}
      <div className="bg-slate-900/90 border-2 border-amber-500/40 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3 text-amber-300 font-black text-sm">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>{language === 'bn' ? 'নতুন কাস্টম রুম তৈরি করুন' : 'Create Custom Room'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Player Capacity */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
              <Users className="w-3 h-3" />
              {language === 'bn' ? 'খেলোয়াড় সংখ্যা' : 'Players'}
            </span>
            <div className="grid grid-cols-3 gap-1">
              {([4, 5, 6] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setMaxPlayers(n);
                    haptic.selection();
                  }}
                  className={`py-1.5 rounded-lg text-xs font-black border transition-all ${
                    maxPlayers === n
                      ? 'bg-amber-500 text-black border-amber-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Max Rounds */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3" />
              {language === 'bn' ? 'রাউন্ড' : 'Rounds'}
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[3, 5, 10].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setMaxRounds(r);
                    haptic.selection();
                  }}
                  className={`py-1.5 rounded-lg text-xs font-black border transition-all ${
                    maxRounds === r
                      ? 'bg-amber-500 text-black border-amber-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            sound.playGavel();
            haptic.impact('heavy');
            onCreateRoom(maxPlayers, maxRounds, guestName);
          }}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
        >
          <PlusCircle className="w-4 h-4" />
          <span>
            {isLoading
              ? language === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating...'
              : language === 'bn' ? 'রুম তৈরি করুন ও কোড পান' : 'CREATE ROOM & GET CODE'}
          </span>
        </button>
      </div>

      {/* CARD 3: SOLO PRACTICE VS AI */}
      <button
        type="button"
        onClick={() => {
          sound.playPaperRustle();
          haptic.impact('medium');
          onStartLocalPractice(maxPlayers);
        }}
        className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Bot className="w-4 h-4 text-emerald-400" />
        <span>
          {language === 'bn'
            ? 'একাকী এআই বটের সাথে অনুশীলন করুন (অফলাইন)'
            : 'Practice Solo vs AI Bots (Offline Mode)'}
        </span>
      </button>

      {/* Group Tip */}
      <p className="text-[10px] text-center text-slate-500 px-2">
        {language === 'bn'
          ? '💡 টিপস: টেলিগ্রাম গ্রুপ বা টপিকে /play লিখলে সবাই এক ট্যাপে একই রুমে যোগ দিতে পারবে!'
          : '💡 Tip: Type /play inside any Telegram Group or Topic so everyone can join the same table with 1 tap!'}
      </p>
    </div>
  );
};
