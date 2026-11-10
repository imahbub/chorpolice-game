import React, { useState } from 'react';
import { Bot } from 'lucide-react';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  isBot?: boolean;
  className?: string;
  textClassName?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  avatarUrl,
  isBot = false,
  className = 'w-full h-full',
  textClassName = 'text-base',
}) => {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-black bg-gradient-to-tr ${
        isBot ? 'from-indigo-800 to-slate-900 text-cyan-300' : 'from-slate-700 to-slate-900 text-amber-300'
      } ${textClassName}`}
    >
      {isBot ? <Bot className="w-1/2 h-1/2" /> : (name || 'P').charAt(0).toUpperCase()}
    </div>
  );
};
