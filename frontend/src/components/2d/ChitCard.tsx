import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Role, ROLE_CONFIGS } from '../../types/game';
import { RoleBadge } from './RoleBadge';
import { sound } from '../../utils/audio';
import { haptic } from '../../utils/telegram';
import { Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

interface ChitCardProps {
  role: Role | null;
  isPubliclyRevealed?: boolean;
  onPeek?: (peeked: boolean) => void;
  language?: 'en' | 'bn';
  disabled?: boolean;
  className?: string;
}

export const ChitCard: React.FC<ChitCardProps> = ({
  role,
  isPubliclyRevealed = false,
  onPeek,
  language = 'en',
  disabled = false,
  className = '',
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<number | null>(null);

  const isOpen = isPubliclyRevealed || isHolding;
  const config = role ? ROLE_CONFIGS[role] : null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isPubliclyRevealed || !role) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setIsHolding(true);
    sound.playPaperRustle();
    haptic.impact('medium');
    onPeek?.(true);
  };

  const handlePointerUp = () => {
    if (disabled || isPubliclyRevealed) return;
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
    }
    setIsHolding(false);
    haptic.selection();
  };

  return (
    <div
      className={`relative select-none touch-none flex flex-col items-center justify-center ${className}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <motion.div
        className="relative w-64 h-84 sm:w-72 sm:h-96 rounded-2xl cursor-pointer perspective-1000"
        whileHover={!disabled && !isPubliclyRevealed ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isPubliclyRevealed ? { scale: 0.98 } : {}}
        animate={{
          rotateY: isOpen ? 0 : 0,
          scale: isOpen ? 1.04 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* FOLDED CHIT (CLOSED) */
            <motion.div
              key="folded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full rounded-2xl p-5 flex flex-col justify-between items-center text-center shadow-2xl border-2 border-amber-900/40 relative overflow-hidden bg-gradient-to-br from-[#F5E6CA] via-[#EBD5B3] to-[#DFC19B]"
            >
              {/* Paper Crease Line Effects */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-amber-900/20 shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-amber-900/20 shadow-[1px_0_2px_rgba(0,0,0,0.15)]" />
              
              {/* Corner folds */}
              <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-amber-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-amber-950/20 to-transparent pointer-events-none" />

              {/* Top Header */}
              <div className="z-10 flex items-center gap-1.5 px-3 py-1 bg-amber-950/10 rounded-full border border-amber-900/20 text-amber-950">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-widest uppercase">
                  {language === 'bn' ? 'গোপন কাগজ ভাঁজ' : 'SECRET CHIT SLIP'}
                </span>
              </div>

              {/* Center Royal Wax Seal */}
              <div className="z-10 flex flex-col items-center my-auto">
                <div className="relative group">
                  {/* Wax drip shadow */}
                  <div className="w-24 h-24 rounded-full bg-red-700/80 shadow-[0_4px_16px_rgba(185,28,28,0.5)] flex items-center justify-center border-4 border-red-900">
                    <div className="w-18 h-18 rounded-full border-2 border-dashed border-red-300/40 flex items-center justify-center p-3">
                      <svg viewBox="0 0 100 100" className="w-12 h-12 fill-red-100">
                        <polygon points="50,15 63,40 90,40 68,57 76,82 50,67 24,82 32,57 10,40 37,40" />
                      </svg>
                    </div>
                  </div>
                  {/* Seal Stamp Ribbons */}
                  <div className="absolute -bottom-3 left-3 w-4 h-8 bg-red-800 -rotate-12 rounded-b shadow" />
                  <div className="absolute -bottom-3 right-3 w-4 h-8 bg-red-800 rotate-12 rounded-b shadow" />
                </div>

                <h3 className="mt-5 font-black text-amber-950 text-lg tracking-wider">
                  {language === 'bn' ? 'চোর পুলিশ' : 'CHOR POLICE'}
                </h3>
                <p className="text-[11px] text-amber-900 font-semibold max-w-[200px]">
                  {language === 'bn' ? 'রাজকীয় টেবিল টপ খেলা' : 'Royal Tabletop Game'}
                </p>
              </div>

              {/* Bottom "Hold to Peek" Call to action */}
              <div className="z-10 w-full pt-2">
                <div className="w-full py-2.5 px-4 bg-amber-950 text-amber-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg border border-amber-800/40 animate-pulse">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>
                    {language === 'bn' ? 'দেখতে চেপে ধরে রাখুন' : 'HOLD TO PEEK SLIP'}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* UNFOLDED CHIT (REVEALED) */
            <motion.div
              key="unfolded"
              initial={{ opacity: 0, scale: 0.92, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className={`w-full h-full rounded-2xl p-5 flex flex-col justify-between items-center text-center shadow-2xl border-4 relative overflow-hidden bg-gradient-to-b ${
                config ? config.bgGradient : 'from-slate-800 to-slate-950'
              } ${config ? config.borderColor : 'border-slate-500'}`}
            >
              {/* Background glowing particles/decorations */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />

              {/* Card Header: Role Name & Points */}
              <div className="z-10 w-full flex items-center justify-between border-b border-white/20 pb-2.5">
                <div className="text-left">
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/70">
                    {language === 'bn' ? 'আপনার ভূমিকা' : 'YOUR ROLE'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-black text-white drop-shadow">
                      {language === 'bn' ? config?.nameBn : config?.nameEn}
                    </h2>
                    <span className="text-xs text-white/80 font-bold">
                      ({language === 'bn' ? config?.nameEn : config?.nameBn})
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-right">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{config?.points} {language === 'bn' ? 'পয়েন্ট' : 'pts'}</span>
                  </div>
                </div>
              </div>

              {/* 2D Character Avatar Badge */}
              <div className="z-10 my-auto py-2">
                {role && (
                  <RoleBadge
                    role={role}
                    size="xl"
                    showLabel={false}
                    language={language}
                    className="drop-shadow-2xl"
                  />
                )}
              </div>

              {/* Role Mission Description */}
              <div className="z-10 w-full bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                <p className="text-xs text-white/90 leading-snug font-medium">
                  {language === 'bn' ? config?.descriptionBn : config?.descriptionEn}
                </p>
              </div>

              {/* Peek warning footer */}
              {!isPubliclyRevealed && (
                <div className="z-10 flex items-center gap-1 text-[11px] text-white/70 pt-1 font-semibold">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>
                    {language === 'bn' ? 'লুকাতে আঙুল তুলুন' : 'Release touch to conceal'}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
