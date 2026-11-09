import React, { useState } from 'react';
import { Player } from '../types/game';
import { ChevronDown, ChevronUp, Bot, Sparkles, Wrench } from 'lucide-react';

interface DevModeSwitcherProps {
  players: Player[];
  activePlayerId: string;
  onSwitchPlayer: (playerId: string) => void;
  maxPlayers: 4 | 5 | 6;
  onChangeMaxPlayers: (count: 4 | 5 | 6) => void;
  onAddBotSeat: () => void;
}

export const DevModeSwitcher: React.FC<DevModeSwitcherProps> = ({
  players,
  activePlayerId,
  onSwitchPlayer,
  maxPlayers,
  onChangeMaxPlayers,
  onAddBotSeat,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Hidden in public production unless explicitly enabled via ?dev=true or local dev
  const isDevVisible = Boolean(
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).has('dev') || import.meta.env.DEV)
  );

  if (!isDevVisible) {
    return null; // Completely removed from public app
  }

  const activePlayer = players.find((p) => p.id === activePlayerId);

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end">
      {/* Dev Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/90 hover:bg-purple-800 text-purple-200 rounded-full font-bold text-xs border border-purple-500/50 shadow-2xl backdrop-blur-md cursor-pointer"
      >
        <Wrench className="w-3.5 h-3.5 text-amber-400" />
        <span>Dev Tools:</span>
        <span className="font-black text-amber-300 truncate max-w-[70px]">
          {activePlayer?.name ?? 'Seat'}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Dev Testing Panel */}
      {isOpen && (
        <div className="mb-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-3 shadow-2xl text-xs text-slate-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 text-amber-300 font-bold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Player Testing Deck</span>
            </span>
            <span className="text-[10px] text-slate-400">Owner Only</span>
          </div>

          {/* Seat Capacity selector */}
          <div className="mb-3">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Table Capacity:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {([4, 5, 6] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => onChangeMaxPlayers(count)}
                  className={`py-1 rounded-lg font-bold text-center border transition-all ${
                    maxPlayers === count
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {count} Players
                </button>
              ))}
            </div>
          </div>

          {/* Perspective Switcher */}
          <div className="mb-3">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Switch Active Perspective:
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {players.map((p) => {
                const isCurrent = p.id === activePlayerId;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSwitchPlayer(p.id)}
                    className={`p-1.5 rounded-lg text-left border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300 font-medium'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.currentRole && (
                      <span className="text-[9px] px-1 bg-black/40 rounded text-slate-400">
                        {p.currentRole}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bot Helper */}
          {players.length < maxPlayers && (
            <button
              onClick={onAddBotSeat}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-amber-300 font-bold flex items-center justify-center gap-1.5 shadow"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Fill Seat with AI Player</span>
            </button>
          )}

          <div className="mt-2 text-[10px] text-slate-400 text-center italic">
            Tip: Hidden on public app. Access with ?dev=true in URL.
          </div>
        </div>
      )}
    </div>
  );
};
