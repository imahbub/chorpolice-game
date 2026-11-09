import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, ROLE_CONFIGS } from '../../types/game';
import { RoleBadge } from './RoleBadge';
import { Crown, CheckCircle2, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

interface TableSeatsProps {
  players: Player[];
  activePlayerId: string;
  selectedSuspectId: string | null;
  onSelectSuspect?: (playerId: string) => void;
  canSelectSuspect?: boolean;
  language?: 'en' | 'bn';
  roundResolved?: boolean;
}

export const TableSeats: React.FC<TableSeatsProps> = ({
  players,
  activePlayerId,
  selectedSuspectId,
  onSelectSuspect,
  canSelectSuspect = false,
  language = 'en',
  roundResolved = false,
}) => {
  const total = players.length;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square p-4 flex items-center justify-center">
      {/* 2D Table Surface (Wood border & Slate felt) */}
      <div className="absolute inset-4 rounded-full table-felt wood-border border-8 flex items-center justify-center shadow-2xl overflow-hidden">
        {/* Felt circular grain & emblem */}
        <div className="absolute inset-8 rounded-full border-2 border-dashed border-amber-500/20 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-20">
            <span className="font-black text-2xl tracking-widest text-amber-300 block">
              CHOR POLICE
            </span>
            <span className="text-sm font-bold text-amber-200">
              চোর পুলিশ
            </span>
          </div>
        </div>
      </div>

      {/* Render Player Seats positioned in a circle */}
      {players.map((player, index) => {
        // Calculate angle for seat layout
        const angle = (index * (360 / total) - 90) * (Math.PI / 180);
        // Distance radius from center (percent)
        const radius = 38; // 38% from center
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        const isMe = player.id === activePlayerId;
        const isSelected = selectedSuspectId === player.id;
        const isFramed = player.isFramed;
        const isSelectable = canSelectSuspect && !player.isRolePublic && player.id !== activePlayerId;

        // Role details if revealed
        const isRoleRevealed = player.isRolePublic || roundResolved;
        const roleConfig = player.currentRole && isRoleRevealed ? ROLE_CONFIGS[player.currentRole] : null;

        return (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="z-20 flex flex-col items-center"
          >
            {/* Speech bubble popup */}
            <AnimatePresence>
              {player.speechBubble && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-12 z-30 max-w-[140px] px-2.5 py-1.5 bg-amber-100 text-amber-950 rounded-xl rounded-bl-none text-[11px] font-bold shadow-xl border border-amber-800/30 flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3 text-amber-700 shrink-0" />
                  <span className="truncate">{player.speechBubble}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Seat Container */}
            <motion.div
              onClick={() => {
                if (isSelectable && onSelectSuspect) {
                  onSelectSuspect(player.id);
                }
              }}
              whileHover={isSelectable ? { scale: 1.1 } : {}}
              whileTap={isSelectable ? { scale: 0.95 } : {}}
              className={`relative flex flex-col items-center cursor-pointer transition-all ${
                isFramed ? 'framed-jitter' : ''
              }`}
            >
              {/* Suspicion Aura if Framed */}
              {isFramed && (
                <div className="absolute -inset-2 rounded-full bg-red-600/30 blur-sm animate-pulse pointer-events-none" />
              )}

              {/* Selection Halo */}
              {isSelected && (
                <div className="absolute -inset-2.5 rounded-full border-2 border-red-500 animate-ping pointer-events-none" />
              )}

              {/* Avatar circle */}
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all border-3 ${
                  isSelected
                    ? 'border-red-500 ring-4 ring-red-500/50 bg-red-950'
                    : isMe
                    ? 'border-amber-400 ring-2 ring-amber-400/40 bg-slate-800'
                    : 'border-slate-600 bg-slate-800'
                }`}
              >
                {/* 2D Avatar graphic / Role Badge if revealed */}
                {isRoleRevealed && player.currentRole ? (
                  <RoleBadge
                    role={player.currentRole}
                    size="sm"
                    showLabel={false}
                    language={language}
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center font-black text-lg bg-gradient-to-tr from-slate-700 to-slate-900 text-amber-300">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Host Crown */}
                {player.isHost && (
                  <div className="absolute -top-2 -left-1 p-1 bg-amber-500 rounded-full shadow border border-amber-200">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Ready status */}
                {player.isReady && !player.currentRole && (
                  <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full shadow border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Framed warning marker */}
                {isFramed && (
                  <div className="absolute -top-2 -right-1 p-1 bg-red-600 rounded-full shadow border border-red-200 animate-bounce">
                    <ShieldAlert className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Player Name & Tag */}
              <div className="mt-1 flex flex-col items-center">
                <span className={`text-[11px] font-bold tracking-tight px-1.5 py-0.5 rounded-md max-w-[85px] truncate text-center ${
                  isMe ? 'bg-amber-500 text-black font-black' : 'bg-slate-900/80 text-white'
                }`}>
                  {player.name} {isMe && `(${language === 'bn' ? 'আপনি' : 'You'})`}
                </span>

                {/* Score badge */}
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  {player.score} {language === 'bn' ? 'পয়েন্ট' : 'pts'}
                </span>

                {/* Role text pill if revealed */}
                {isRoleRevealed && roleConfig && (
                  <span
                    className={`mt-0.5 text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${roleConfig.borderColor} border bg-black/70 text-white`}
                  >
                    {language === 'bn' ? roleConfig.nameBn : roleConfig.nameEn}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};
