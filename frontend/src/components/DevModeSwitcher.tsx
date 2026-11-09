import React, { useState } from 'react';
import { Player } from '../types/game';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Globe, ChevronDown, ChevronUp, Bot, Sparkles } from 'lucide-react';

interface DevModeSwitcherProps {
  players: Player[];
  activePlayerId: string;
  onSwitchPlayer: (playerId: string) => void;
  language: 'en' | 'bn';
  onToggleLanguage: () => void;
  maxPlayers: 4 | 5 | 6;
  onChangeMaxPlayers: (count: 4 | 5 | 6) => void;
  onAddBotSeat: () => void;
}

export const DevModeSwitcher: React.FC<DevModeSwitcherProps> = ({
  players,
  activePlayerId,
  onSwitchPlayer,
  language,
  onToggleLanguage,
  maxPlayers,
  onChangeMaxPlayers,
  onAddBotSeat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const activePlayer = players.find((p) => p.id === activePlayerId);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed top-2 right-2 z-40 flex flex-col items-end">
      {/* Top Quick Bar */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700 shadow-xl text-xs">
        {/* Language switch */}
        <button
          onClick={onToggleLanguage}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-full font-bold text-[11px] text-amber-300 border border-slate-600 flex items-center gap-1"
          title="Toggle Language"
        >
          <Globe className="w-3 h-3" />
          <span>{language === 'bn' ? 'বাংলা' : 'EN'}</span>
        </button>

        {/* Audio mute switch */}
        <button
          onClick={handleToggleSound}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 border border-slate-600"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Dev Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-full font-bold text-[11px] border border-amber-500/40"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Dev Mode:</span>
          <span className="font-black truncate max-w-[60px]">{activePlayer?.name ?? 'Seat'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded Dev Panel */}
      {isOpen && (
        <div className="mt-2 w-72 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-2xl p-3 shadow-2xl text-xs text-slate-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 text-amber-300 font-bold">
            <span>Multi-Player Testing Deck</span>
            <span className="text-[10px] text-slate-400">4-6 Seats</span>
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
                    onClick={() => {
                      onSwitchPlayer(p.id);
                    }}
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
            Tip: Open this page in multiple browser tabs to test multi-player sync!
          </div>
        </div>
      )}
    </div>
  );
};
