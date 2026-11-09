import React from 'react';
import { Role } from '../../types/game';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  language?: 'en' | 'bn';
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showLabel = true,
  language = 'en',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }[size];

  const renderIcon = () => {
    switch (role) {
      case 'RAJA':
        // Royal Crown & Gavel
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#991B1B" />
              </linearGradient>
            </defs>
            {/* Crown base */}
            <circle cx="50" cy="50" r="46" fill="#1e1b4b" stroke="url(#goldGrad)" strokeWidth="4" />
            <path
              d="M26 65 L74 65 L70 42 L58 54 L50 32 L42 54 L30 42 Z"
              fill="url(#goldGrad)"
              stroke="#78350F"
              strokeWidth="2"
            />
            {/* Rubies */}
            <circle cx="50" cy="32" r="4" fill="url(#rubyGrad)" />
            <circle cx="30" cy="42" r="3.5" fill="url(#rubyGrad)" />
            <circle cx="70" cy="42" r="3.5" fill="url(#rubyGrad)" />
            <circle cx="50" cy="65" r="3" fill="#60A5FA" />
            <circle cx="38" cy="65" r="2.5" fill="#34D399" />
            <circle cx="62" cy="65" r="2.5" fill="#34D399" />
            {/* Royal sash base */}
            <rect x="25" y="69" width="50" height="6" rx="3" fill="#DC2626" />
          </svg>
        );

      case 'MONTRI':
        // Minister's Turban & Scroll
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="scrollGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="#064E3B" stroke="url(#emeraldGrad)" strokeWidth="4" />
            {/* Turban folds */}
            <ellipse cx="50" cy="42" rx="26" ry="18" fill="url(#emeraldGrad)" />
            <ellipse cx="50" cy="38" rx="20" ry="12" fill="#34D399" opacity="0.4" />
            {/* Feather gem */}
            <path d="M50 22 C52 14 56 12 58 10 C54 18 52 24 50 26 Z" fill="#FDE047" />
            <circle cx="50" cy="27" r="3.5" fill="#DC2626" />
            {/* Rolled Advisory Scroll */}
            <rect x="28" y="58" width="44" height="14" rx="4" fill="url(#scrollGrad)" stroke="#78350F" strokeWidth="1.5" />
            <line x1="34" y1="63" x2="66" y2="63" stroke="#92400E" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="34" y1="67" x2="58" y2="67" stroke="#92400E" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Royal Ribbon */}
            <circle cx="50" cy="65" r="4" fill="#B91C1C" />
          </svg>
        );

      case 'POLICE':
        // Inspector Cap & Golden Badge
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93C5FD" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="#172554" stroke="url(#blueGrad)" strokeWidth="4" />
            {/* Cap */}
            <path d="M22 46 C22 30 78 30 78 46 L82 52 L18 52 Z" fill="url(#blueGrad)" />
            {/* Visor */}
            <path d="M20 52 C35 59 65 59 80 52 C72 61 28 61 20 52 Z" fill="#0F172A" />
            {/* 7-Point Police Star Badge */}
            <polygon
              points="50,48 54,58 65,58 56,65 59,75 50,69 41,75 44,65 35,58 46,58"
              fill="url(#badgeGold)"
              stroke="#92400E"
              strokeWidth="1"
            />
            {/* Whistle at side */}
            <circle cx="68" cy="68" r="4" fill="#E2E8F0" />
            <rect x="68" y="65" width="8" height="3" rx="1" fill="#94A3B8" />
          </svg>
        );

      case 'CHOR':
        // Thief Mask & Dagger
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="50%" stopColor="#7E22CE" />
                <stop offset="100%" stopColor="#3B0764" />
              </linearGradient>
              <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="#2E1065" stroke="url(#purpleGrad)" strokeWidth="4" />
            {/* Bandit eye mask */}
            <path
              d="M20 44 C32 40 44 45 50 45 C56 45 68 40 80 44 C84 48 82 58 72 58 C62 58 56 50 50 50 C44 50 38 58 28 58 C18 58 16 48 20 44 Z"
              fill="#18181B"
              stroke="#52525B"
              strokeWidth="1.5"
            />
            {/* Cunning glowing eyes */}
            <ellipse cx="36" cy="49" rx="4" ry="2.5" fill="#FDE047" />
            <circle cx="37" cy="49" r="1.5" fill="#000" />
            <ellipse cx="64" cy="49" rx="4" ry="2.5" fill="#FDE047" />
            <circle cx="63" cy="49" r="1.5" fill="#000" />
            {/* Stealth dagger */}
            <path d="M48 64 L52 64 L54 78 L50 83 L46 78 Z" fill="url(#bladeGrad)" stroke="#334155" strokeWidth="1" />
            <rect x="44" y="62" width="12" height="3" rx="1.5" fill="#D97706" />
            <rect x="48" y="58" width="4" height="4" rx="1" fill="#78350F" />
          </svg>
        );

      case 'SIPAHI':
        // Soldier Shield & Crossed Spears
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="soldierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="50%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#7C2D12" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="#431407" stroke="url(#soldierGrad)" strokeWidth="4" />
            {/* Crossed spears */}
            <line x1="22" y1="22" x2="78" y2="78" stroke="#9CA3AF" strokeWidth="3" />
            <polygon points="18,18 26,20 20,26" fill="#E5E7EB" />
            <line x1="78" y1="22" x2="22" y2="78" stroke="#9CA3AF" strokeWidth="3" />
            <polygon points="82,18 74,20 80,26" fill="#E5E7EB" />
            {/* Bronze Round Shield */}
            <circle cx="50" cy="52" r="22" fill="url(#soldierGrad)" stroke="#78350F" strokeWidth="2.5" />
            <circle cx="50" cy="52" r="14" fill="#9A3412" stroke="#FED7AA" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="50" cy="52" r="5" fill="#FED7AA" />
          </svg>
        );

      case 'BABU':
        // Citizen / Townsfolk Hat & Pocket Watch
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="citizenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="#1E293B" stroke="url(#citizenGrad)" strokeWidth="4" />
            {/* Bowler Hat */}
            <ellipse cx="50" cy="46" rx="26" ry="6" fill="#334155" />
            <path d="M34 44 C34 28 66 28 66 44 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
            <rect x="34" y="42" width="32" height="3" fill="#DC2626" />
            {/* Golden Pocket Watch */}
            <circle cx="50" cy="68" r="12" fill="#FEF08A" stroke="#B45309" strokeWidth="2" />
            <line x1="50" y1="68" x2="50" y2="60" stroke="#78350F" strokeWidth="1.5" />
            <line x1="50" y1="68" x2="55" y2="68" stroke="#78350F" strokeWidth="1.5" />
            <circle cx="50" cy="54" r="2" fill="#B45309" />
          </svg>
        );
    }
  };

  const roleLabels: Record<Role, { en: string; bn: string }> = {
    RAJA: { en: 'King', bn: 'রাজা' },
    MONTRI: { en: 'Minister', bn: 'মন্ত্রী' },
    POLICE: { en: 'Police', bn: 'পুলিশ' },
    CHOR: { en: 'Thief', bn: 'চোর' },
    SIPAHI: { en: 'Soldier', bn: 'সিপাহী' },
    BABU: { en: 'Citizen', bn: 'বাবু' },
  };

  const label = roleLabels[role];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses} transition-transform duration-200 hover:scale-105`}>
        {renderIcon()}
      </div>
      {showLabel && (
        <div className="mt-1 text-center font-bold tracking-wide">
          <span className="text-white text-xs sm:text-sm drop-shadow">
            {language === 'bn' ? `${label.bn} (${label.en})` : `${label.en} (${label.bn})`}
          </span>
        </div>
      )}
    </div>
  );
};
