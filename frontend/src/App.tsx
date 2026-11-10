import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import { HomeHub } from './components/HomeHub';
import { ChitCard } from './components/2d/ChitCard';
import { TableSeats } from './components/2d/TableSeats';
import { SabotageHUD } from './components/2d/SabotageHUD';
import { InterrogationHUD } from './components/2d/InterrogationHUD';
import { ResolutionModal } from './components/2d/ResolutionModal';
import { GameOverModal } from './components/2d/GameOverModal';
import { DevModeSwitcher } from './components/DevModeSwitcher';
import { RoleBadge } from './components/2d/RoleBadge';
import { sound } from './utils/audio';
import { haptic, getTelegramWebApp } from './utils/telegram';
import {
  Crown,
  Sparkles,
  Share2,
  Play,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Volume2,
  VolumeX,
  Globe,
  LogOut,
  Copy,
  Bot,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { Role, ROLE_CONFIGS } from './types/game';

export const App: React.FC = () => {
  const {
    state,
    language,
    toggleLanguage,
    createOnlineRoom,
    joinOnlineRoom,
    startLocalPractice,
    leaveRoom,
    switchActivePlayer,
    toggleReady,
    startGame,
    peekRole,
    triggerRoyalCall,
    triggerPoliceStep,
    executeSabotage,
    respondBribe,
    triggerKingDecree,
    sendBluff,
    selectSuspect,
    lockInArrest,
    botPoliceGuess,
    emergencyVerdict,
    showFinalRankings,
    endGameByHost,
    nextRound,
    resetGame,
    changeMaxPlayers,
    addBotSeat,
  } = useGame();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const activePlayer = state.players.find((p) => p.id === state.activePlayerId);
  const isHost = activePlayer?.isHost ?? false;
  const isKing = activePlayer?.currentRole === 'RAJA';
  const isPolice = activePlayer?.currentRole === 'POLICE';
  const isThief = activePlayer?.currentRole === 'CHOR';

  const suspects = state.players.filter(
    (p) => !p.isRolePublic && p.id !== state.policeId
  );

  const botUsername = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'chorpolicegamebot').replace(/^@/, '');
  const getInviteUrl = () => {
    // Uses Telegram Mini App direct link when inside Telegram ecosystem
    return `https://t.me/${botUsername}?startapp=${state.roomCode}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(state.roomCode).catch(() => {});
    setCopiedCode(true);
    sound.playPaperRustle();
    haptic.notification('success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareTelegram = () => {
    const inviteUrl = getInviteUrl();
    const shareText = `👑 Join my Chor Police (চোর পুলিশ) table! Code: ${state.roomCode}`;
    const tgShare = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;

    sound.playPaperRustle();
    haptic.impact('medium');

    const tgWebApp = getTelegramWebApp();
    if (tgWebApp?.openTelegramLink) {
      tgWebApp.openTelegramLink(tgShare);
    } else {
      window.open(tgShare, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between relative selection:bg-amber-500 selection:text-black">
      {/* Dev Mode Testing Panel (Only visible with ?dev=true or in local dev) */}
      {state.mode !== 'HUB' && (
        <DevModeSwitcher
          players={state.players}
          activePlayerId={state.activePlayerId}
          onSwitchPlayer={switchActivePlayer}
          maxPlayers={state.maxPlayers}
          onChangeMaxPlayers={changeMaxPlayers}
          onAddBotSeat={addBotSeat}
        />
      )}

      {/* Compact Header Bar */}
      <header className="w-full max-w-md mx-auto pt-2 pb-1 px-3 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 shadow flex items-center justify-center">
            <Crown className="w-4 h-4 text-slate-950" />
          </div>

          {state.mode === 'HUB' ? (
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-white whitespace-nowrap">
                {language === 'bn' ? 'চোর পুলিশ' : 'CHOR POLICE'}
              </h1>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-black whitespace-nowrap">
              <span className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                R{state.currentRound}/{state.maxRounds}
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                {state.players.length}/{state.maxPlayers}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-full font-bold text-[10px] text-amber-300 border border-slate-700 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="Toggle Language"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          <button
            onClick={handleToggleSound}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 border border-slate-700 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setShowRules(!showRules)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 border border-slate-700 cursor-pointer"
            title="Game Rules"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          {state.mode !== 'HUB' && isHost && (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="p-1.5 bg-red-950/70 hover:bg-red-800/80 rounded-full text-red-300 border border-red-500/40 cursor-pointer"
              title={language === 'bn' ? 'ম্যাচ শেষ করুন' : 'End Game'}
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}

          {state.mode !== 'HUB' && (
            <button
              onClick={leaveRoom}
              className="p-1.5 bg-slate-800 hover:bg-red-900/60 rounded-full text-slate-300 hover:text-red-300 border border-slate-700 cursor-pointer"
              title="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Host End Game Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-red-500/50 rounded-3xl p-5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center mx-auto mb-3">
              <Flag className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-black text-white">
              {language === 'bn' ? 'খেলা শেষ করবেন?' : 'End Match Now?'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              {state.players.some((p) => p.score > 0)
                ? language === 'bn'
                  ? 'বর্তমান স্কোরের ভিত্তিতে চূড়ান্ত ফলাফল ও র‍্যাংকিং সবার কাছে দেখানো হবে।'
                  : 'This will end the match for everyone and show final rankings.'
                : language === 'bn'
                ? 'এতে রুমটি বন্ধ হয়ে যাবে এবং সবাই হোম মেনুতে ফিরে যাবে।'
                : 'This will drop the room and return all players to the Hub.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  sound.playGavel();
                  haptic.impact('heavy');
                  endGameByHost();
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl border-b-4 border-red-900 active:border-b-0 active:translate-y-0.5 cursor-pointer"
              >
                {language === 'bn' ? 'হ্যাঁ, শেষ করুন' : 'End Match'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 text-white max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-amber-300">
                {language === 'bn' ? 'খেলার নিয়মাবলী ও ভূমিকা' : 'Game Rules & Roles'}
              </h3>
              <button
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-white font-black text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                {language === 'bn'
                  ? 'কাগজের চিটের ঐতিহ্যবাহী বাঙালি খেলা এবার ডিজিটাল রূপে! সাথে নতুন "সিন্ডিকেট চাল" (The Syndicate Twist)।'
                  : 'The nostalgic Bangladeshi paper-chit tabletop social game in modern digital form with "The Syndicate" sabotage twist!'}
              </p>

              <div className="space-y-2">
                {(['RAJA', 'MONTRI', 'POLICE', 'CHOR', 'SIPAHI', 'BABU'] as Role[]).map((r) => {
                  const cfg = ROLE_CONFIGS[r];
                  return (
                    <div key={r} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                      <RoleBadge role={r} size="sm" showLabel={false} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white">
                            {language === 'bn' ? `${cfg.nameBn} (${cfg.nameEn})` : `${cfg.nameEn} (${cfg.nameBn})`}
                          </span>
                          <span className="font-bold text-amber-400">{cfg.points} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {language === 'bn' ? cfg.descriptionBn : cfg.descriptionEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="w-full max-w-md mx-auto my-auto px-4 py-2 flex flex-col items-center justify-center flex-1 z-10">
        {/* HUB MODE: Create Custom Room / Join by Code */}
        {state.mode === 'HUB' && (
          <HomeHub
            language={language}
            isLoading={state.isLoading}
            errorMessage={state.errorMessage}
            onCreateRoom={createOnlineRoom}
            onJoinRoom={joinOnlineRoom}
            onStartLocalPractice={startLocalPractice}
          />
        )}

        {/* PHASE 1: LOBBY */}
        {state.mode !== 'HUB' && state.phase === 'LOBBY' && (
          <div className="w-full flex flex-col items-center">
            {/* Compact Room Code Bar */}
            <div className="w-full mb-4 px-3 py-1.5 bg-slate-900/80 border border-amber-500/25 rounded-xl flex items-center justify-between shadow">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {language === 'bn' ? 'কোড' : 'CODE'}
                </span>
                <span className="text-xs font-black tracking-widest text-amber-300">
                  {state.roomCode}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-amber-400" />
                  <span>{copiedCode ? (language === 'bn' ? 'কপি!' : 'Copied') : (language === 'bn' ? 'কপি' : 'Copy')}</span>
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-[11px] font-bold flex items-center gap-1 text-white shadow cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  <span>{language === 'bn' ? 'শেয়ার' : 'Share'}</span>
                </button>
              </div>
            </div>

            {state.errorMessage && (
              <div className="w-full mb-2 p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{state.errorMessage}</span>
              </div>
            )}

            {/* 2D Table with Player Seats */}
            <TableSeats
              players={state.players}
              activePlayerId={state.activePlayerId}
              selectedSuspectId={null}
              language={language}
            />

            {/* Lobby Actions */}
            <div className="w-full mt-2 space-y-2">
              <div className="flex gap-2">
                {/* Ready Button */}
                <button
                  onClick={() => {
                    toggleReady();
                    sound.playPaperRustle();
                    haptic.impact('medium');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePlayer?.isReady
                      ? 'bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-0.5 text-white shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 border-b-4 border-b-slate-950 active:border-b active:translate-y-0.5 text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {activePlayer?.isReady
                      ? language === 'bn' ? 'প্রস্তুত ✓' : 'Ready ✓'
                      : language === 'bn' ? 'প্রস্তুত হন' : 'Get Ready'}
                  </span>
                </button>

                {/* Add AI Bot Button */}
                {isHost && state.players.length < state.maxPlayers && (
                  <button
                    onClick={() => {
                      addBotSeat();
                      sound.playPaperRustle();
                      haptic.selection();
                    }}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 border-b-4 border-b-slate-950 active:border-b active:translate-y-0.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-amber-300 cursor-pointer shrink-0 transition-all"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{language === 'bn' ? '+ এআই' : '+ AI Bot'}</span>
                  </button>
                )}
              </div>

              {/* Host Start Game Button */}
              {isHost ? (
                <button
                  disabled={state.players.length < 4}
                  onClick={() => {
                    startGame();
                    sound.playGavel();
                    haptic.impact('heavy');
                  }}
                  className={`w-full py-3 font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all ${
                    state.players.length >= 4
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 cursor-pointer'
                      : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span>
                    {state.players.length < 4
                      ? language === 'bn'
                        ? `আরও ${4 - state.players.length} জন প্রয়োজন`
                        : `Need ${4 - state.players.length} more to start`
                      : language === 'bn'
                      ? 'চিট বণ্টন করুন ও শুরু'
                      : 'DEAL CHITS & START'}
                  </span>
                </button>
              ) : (
                <div className="py-2 text-center text-xs text-slate-400 font-medium">
                  {language === 'bn' ? 'হোস্টের খেলা শুরুর অপেক্ষায়...' : 'Waiting for host to deal chits...'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: DEAL & PEEK */}
        {state.mode !== 'HUB' && state.phase === 'DEAL' && (
          <div className="w-full flex flex-col items-center text-center">
            <div className="mb-3">
              <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">
                {language === 'bn' ? 'চিট খোলা পর্ব' : 'CHIT DRAW PHASE'}
              </span>
              <p className="text-xs text-slate-400">
                {language === 'bn'
                  ? 'স্ক্রিন চেপে ধরে নিজের গোপন ভূমিকা দেখে নিন'
                  : 'Hold the slip firmly to inspect your secret role'}
              </p>
            </div>

            <ChitCard
              role={activePlayer?.currentRole ?? null}
              onPeek={peekRole}
              language={language}
            />

            {isKing && (
              <div className="mt-4 w-full">
                <button
                  onClick={() => {
                    triggerRoyalCall();
                    sound.playGavel();
                    haptic.impact('heavy');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Crown className="w-5 h-5 fill-slate-950 shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'রাজকীয় ঘোষণা: পুলিশ তলব!'
                      : 'SUMMON THE POLICE!'}
                  </span>
                </button>
              </div>
            )}

            {!isKing && (
              <div className="mt-4 text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'bn'
                    ? 'রাজার রাজকীয় ঘোষণার অপেক্ষায়...'
                    : 'Waiting for the King to summon the Police...'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: ROYAL CALL */}
        {state.mode !== 'HUB' && state.phase === 'ROYAL_CALL' && (
          <div className="w-full flex flex-col items-center text-center">
            <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-3xl w-full mb-3 shadow-2xl flex flex-col items-center">
              <RoleBadge role="RAJA" size="lg" language={language} />
              <h2 className="text-lg font-black text-amber-300 mt-2">
                {language === 'bn' ? 'রাজা আত্মপ্রকাশ করেছেন!' : 'THE KING HAS SPOKEN!'}
              </h2>
              <p className="text-xs text-amber-100 max-w-xs mt-1">
                {language === 'bn'
                  ? 'রাজার আদেশ: "আমার দরবারে চোর ঢুকেছে! পুলিশ কোথায়? সামনে এসে চোর গ্রেপ্তার করো!"'
                  : '"A thief lurks in my court! Where is my Inspector? Step forth and arrest the culprit!"'}
              </p>
            </div>

            {isPolice ? (
              <button
                onClick={() => {
                  triggerPoliceStep();
                  sound.playPoliceAlert();
                  haptic.impact('heavy');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-black text-sm rounded-xl border-b-4 border-blue-900 active:border-b-0 active:translate-y-0.5 shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>
                  {language === 'bn' ? 'আমিই পুলিশ! তদন্ত শুরু করুন' : 'I AM THE POLICE! STEP FORTH'}
                </span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5 py-3">
                <ShieldCheck className="w-4 h-4 text-blue-400 animate-spin" />
                <span>
                  {language === 'bn'
                    ? 'পুলিশের আত্মপ্রকাশের অপেক্ষায়...'
                    : 'Waiting for the Police inspector to step forward...'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4: SABOTAGE */}
        {state.mode !== 'HUB' && state.phase === 'SABOTAGE' && (
          <div className="w-full flex flex-col items-center">
            <TableSeats
              players={state.players}
              activePlayerId={state.activePlayerId}
              selectedSuspectId={null}
              language={language}
            />

            <SabotageHUD
              isThief={isThief}
              isKing={isKing}
              hasBribeOffer={Boolean(activePlayer?.hasBribeOffer)}
              players={state.players}
              activePlayerId={state.activePlayerId}
              timerSeconds={state.timerSeconds}
              onExecuteSabotage={executeSabotage}
              onRespondBribe={respondBribe}
              onTriggerKingDecree={triggerKingDecree}
              kingDecreeUsed={state.kingDecreeUsed}
              language={language}
            />
          </div>
        )}

        {/* PHASE 5: INTERROGATION */}
        {state.mode !== 'HUB' && state.phase === 'INTERROGATION' && (
          <div className="w-full flex flex-col items-center">
            <TableSeats
              players={state.players}
              activePlayerId={state.activePlayerId}
              selectedSuspectId={state.accusedId}
              onSelectSuspect={selectSuspect}
              canSelectSuspect={isPolice}
              language={language}
            />

            <InterrogationHUD
              isPolice={isPolice}
              policePlayer={state.players.find((p) => p.id === state.policeId)}
              activePlayerRole={activePlayer?.currentRole}
              suspects={suspects}
              selectedSuspectId={state.accusedId}
              onSelectSuspect={selectSuspect}
              onLockInArrest={lockInArrest}
              onSendBluff={sendBluff}
              timerSeconds={state.timerSeconds}
              language={language}
              onBotPoliceDecide={botPoliceGuess}
              onEmergencyVerdict={emergencyVerdict}
            />
          </div>
        )}

        {/* PHASE 6: RESOLUTION */}
        {state.mode !== 'HUB' && (state.phase === 'RESOLUTION' || state.phase === 'RESOLVED') && (
          <ResolutionModal
            state={state}
            onNextRound={nextRound}
            onShowFinalRankings={showFinalRankings}
            isHost={isHost}
            language={language}
          />
        )}

        {/* PHASE 7: FINAL GAME OVER PODIUM & RANKINGS */}
        {state.mode !== 'HUB' && state.phase === 'GAME_OVER' && (
          <GameOverModal
            state={state}
            isHost={isHost}
            onRematch={resetGame}
            onLeaveRoom={leaveRoom}
            language={language}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-lg mx-auto py-2 px-4 flex items-center justify-between text-[11px] text-slate-500 z-10 border-t border-slate-800/80">
        <span>Chor Police TMA</span>
        <span className="flex items-center gap-1">
          {state.mode !== 'HUB' && activePlayer ? (
            <>
              <span>{activePlayer.name}</span>
              {activePlayer.currentRole && (
                <span className="px-1.5 py-0.5 bg-slate-800 text-amber-300 font-bold rounded">
                  {activePlayer.currentRole}
                </span>
              )}
            </>
          ) : (
            <span>{state.mode === 'HUB' ? 'Lobby Hub' : ''}</span>
          )}
        </span>
      </footer>
    </div>
  );
};
