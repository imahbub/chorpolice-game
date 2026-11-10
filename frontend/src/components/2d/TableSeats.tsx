import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, ROLE_CONFIGS } from '../../types/game';
import { RoleBadge } from './RoleBadge';
import { PlayerAvatar } from './PlayerAvatar';
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
    <div className="relative w-full max-w-[340px] sm:max-w-[390px] mx-auto aspect-square p-3 flex items-center justify-center">
      {/* 2D Table Surface (Wood border & Slate felt) */}
      <div className="absolute inset-5 rounded-full table-felt wood-border border-[6px] flex items-center justify-center shadow-2xl overflow-hidden">
        <div className="absolute inset-6 rounded-full border-2 border-dashed border-amber-500/20 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-20">
            <span className="font-black text-xl sm:text-2xl tracking-widest text-amber-300 block">
              CHOR POLICE
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-200">
              চোর পুলিশ
            </span>
          </div>
        </div>
      </div>

      {/* Render Player Seats positioned in a circle */}
      {players.map((player, index) => {
        const angle = (index * (360 / total) - 90) * (Math.PI / 180);
        const radius = total >= 5 ? 36 : 37;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        const isMe = player.id === activePlayerId;
        const isSelected = selectedSuspectId === player.id;
        const isFramed = player.isFramed;
        const isSelectable = canSelectSuspect && !player.isRolePublic && player.id !== activePlayerId;

        const isRoleRevealed = player.isRolePublic || roundResolved;
        const roleConfig = player.currentRole && isRoleRevealed ? ROLE_CONFIGS[player.currentRole] : null;

        // Keep speech bubbles within mobile screen bounds
        const bubbleAlignClass =
          x < 35 ? 'left-0' : x > 65 ? 'right-0' : 'left-1/2 -translate-x-1/2';

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
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className={`absolute -top-11 z-30 ${bubbleAlignClass} max-w-[130px] px-2 py-1 bg-amber-100 text-amber-950 rounded-xl text-[10px] font-bold shadow-xl border border-amber-800/30 flex items-center gap-1`}
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
              whileHover={isSelectable ? { scale: 1.08 } : {}}
              whileTap={isSelectable ? { scale: 0.94 } : {}}
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
                <div className="absolute -inset-2 rounded-full border-2 border-red-500 animate-ping pointer-events-none" />
              )}

              {/* Avatar circle */}
              <div
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all border-2 ${
                  isSelected
                    ? 'border-red-500 ring-4 ring-red-500/40 bg-red-950'
                    : isMe
                    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-800'
                    : 'border-slate-500 bg-slate-800'
                }`}
              >
                {isRoleRevealed && player.currentRole ? (
                  <RoleBadge
                    role={player.currentRole}
                    size="sm"
                    showLabel={false}
                    language={language}
                  />
                ) : (
                  <PlayerAvatar
                    name={player.name}
                    avatarUrl={player.avatarUrl}
                    isBot={player.isBot}
                    textClassName="text-base"
                  />
                )}

                {/* Host Crown */}
                {player.isHost && (
                  <div className="absolute -top-2 -left-1.5 p-0.5 bg-amber-500 rounded-full shadow border border-amber-200">
                    <Crown className="w-2.5 h-2.5 text-slate-950" />
                  </div>
                )}

                {/* Ready status */}
                {player.isReady && !player.currentRole && (
                  <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full shadow border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Framed warning marker */}
                {isFramed && (
                  <div className="absolute -top-2 -right-1.5 p-0.5 bg-red-600 rounded-full shadow border border-red-200 animate-bounce">
                    <ShieldAlert className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* Player Name & Tag */}
              <div className="mt-1 flex flex-col items-center">
                <span
                  className={`text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-md max-w-[78px] truncate text-center shadow ${
                    isMe ? 'bg-amber-500 text-black font-black' : 'bg-slate-900/90 text-white border border-slate-700/70'
                  }`}
                >
                  {player.name}
                </span>

                <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  {player.score}
                </span>

                {isRoleRevealed && roleConfig && (
                  <span
                    className={`mt-0.5 text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${roleConfig.borderColor} border bg-black/80 text-white`}
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
