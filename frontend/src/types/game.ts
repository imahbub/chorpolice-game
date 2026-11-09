export type Role = 'RAJA' | 'MONTRI' | 'POLICE' | 'CHOR' | 'SIPAHI' | 'BABU';

export interface RoleConfig {
  id: Role;
  nameEn: string;
  nameBn: string;
  points: number;
  descriptionEn: string;
  descriptionBn: string;
  color: string;
  bgGradient: string;
  borderColor: string;
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  RAJA: {
    id: 'RAJA',
    nameEn: 'King',
    nameBn: 'রাজা',
    points: 1000,
    descriptionEn: 'The Royal Sovereign. Always revealed first with the Royal Gavel.',
    descriptionBn: 'সর্বোচ্চ শাসক। রাজকীয় ঘোষণার সাথে সবার আগে প্রকাশিত হয়।',
    color: '#F59E0B',
    bgGradient: 'from-amber-600 to-amber-900',
    borderColor: 'border-amber-400',
  },
  MONTRI: {
    id: 'MONTRI',
    nameEn: 'Minister',
    nameBn: 'মন্ত্রী',
    points: 800,
    descriptionEn: 'High Crown Official. Must convince the Police of their innocence.',
    descriptionBn: 'প্রধান রাজকর্মকর্তা। পুলিশকে নিজের নির্দোষিতার প্রমাণ দিতে হবে।',
    color: '#10B981',
    bgGradient: 'from-emerald-600 to-emerald-900',
    borderColor: 'border-emerald-400',
  },
  POLICE: {
    id: 'POLICE',
    nameEn: 'Police',
    nameBn: 'পুলিশ',
    points: 500,
    descriptionEn: 'Crown Inspector. Must interrogate suspects and arrest the Thief.',
    descriptionBn: 'আইনশৃঙ্খলা রক্ষাকারী। সন্দেহভাজনদের জিজ্ঞাসাবাদ করে চোর শনাক্ত করতে হবে।',
    color: '#3B82F6',
    bgGradient: 'from-blue-600 to-blue-900',
    borderColor: 'border-blue-400',
  },
  CHOR: {
    id: 'CHOR',
    nameEn: 'Thief',
    nameBn: 'চোর',
    points: 0, // 500 if escapes
    descriptionEn: 'The Deceiver. Bluffs the Police or frames innocent suspects to steal points.',
    descriptionBn: 'ধূর্ত প্রতারক। পুলিশকে ধোঁকা দিয়ে বা নির্দোষকে ফাঁসিয়ে পয়েন্ট লুট করে।',
    color: '#8B5CF6',
    bgGradient: 'from-purple-600 to-purple-950',
    borderColor: 'border-purple-400',
  },
  SIPAHI: {
    id: 'SIPAHI',
    nameEn: 'Soldier',
    nameBn: 'সিপাহী',
    points: 300,
    descriptionEn: 'Royal Guard (5+ players). Loyal suspect who must evade wrongful arrest.',
    descriptionBn: 'রাজকীয় প্রহরী (৫+ খেলোয়াড়)। ভুল গ্রেপ্তারি এড়িয়ে নিজের সততা প্রমাণ করবে।',
    color: '#F97316',
    bgGradient: 'from-orange-600 to-orange-900',
    borderColor: 'border-orange-400',
  },
  BABU: {
    id: 'BABU',
    nameEn: 'Citizen',
    nameBn: 'বাবু',
    points: 100,
    descriptionEn: 'Honest Townsfolk (6 players). Innocent bystander caught in royal crossfire.',
    descriptionBn: 'সাধারণ নাগরিক (৬ খেলোয়াড়)। পুলিশি তদন্তে নির্দোষ হিসেবে বেঁচে থাকার লড়াই।',
    color: '#6B7280',
    bgGradient: 'from-slate-600 to-slate-900',
    borderColor: 'border-slate-400',
  },
};

export type GamePhase =
  | 'LOBBY'
  | 'DEAL'
  | 'PEEK'
  | 'ROYAL_CALL'
  | 'POLICE_STEP'
  | 'SABOTAGE'
  | 'INTERROGATION'
  | 'ARREST'
  | 'RESOLUTION'
  | 'RECAP';

export interface Player {
  id: string;
  name: string;
  username?: string;
  avatarSeed: string;
  seatIndex: number;
  isHost: boolean;
  isReady: boolean;
  score: number;
  currentRole: Role | null;
  isPeeked: boolean;
  isRolePublic: boolean;
  isBot?: boolean;
  // Syndicate state
  isFramed?: boolean;
  hasBribeOffer?: boolean;
  bribeAccepted?: boolean;
  bribeAmount?: number;
  speechBubble?: string;
  lastReaction?: string;
}

export type SabotageType = 'FRAME' | 'BRIBE' | 'NONE';

export interface GameState {
  roomId: string;
  roomCode: string;
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
  maxPlayers: 4 | 5 | 6;
  players: Player[];
  activePlayerId: string; // Current client's perspective
  kingId: string | null;
  policeId: string | null;
  accusedId: string | null;
  sabotageType: SabotageType;
  sabotageTargetId: string | null;
  timerSeconds: number;
  kingDecreeUsed: boolean;
  decreeQuestion?: {
    en: string;
    bn: string;
    yesTextEn: string;
    yesTextBn: string;
    noTextEn: string;
    noTextBn: string;
  } | null;
  decreeAnswers: Record<string, boolean>; // playerId -> answer
  roundResult?: {
    correctArrest: boolean;
    thiefId: string;
    accusedId: string;
    pointsEarned: Record<string, number>;
    summaryEn: string;
    summaryBn: string;
  };
}
