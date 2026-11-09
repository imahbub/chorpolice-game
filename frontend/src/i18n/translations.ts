export type Language = 'en' | 'bn';

export const TRANSLATIONS = {
  en: {
    gameTitle: "CHOR POLICE",
    gameSubtitle: "Royal Deduction Tabletop",
    tagline: "Unfold the slips. Find the thief.",
    
    // Roles
    role_RAJA: "King",
    role_MONTRI: "Minister",
    role_POLICE: "Police",
    role_CHOR: "Thief",
    role_SIPAHI: "Soldier",
    role_BABU: "Citizen",
    
    roleDesc_RAJA: "1,000 pts • Rules the court, orders the police",
    roleDesc_MONTRI: "800 pts • Innocent dignitary, prove your honesty",
    roleDesc_POLICE: "500 pts • Find and arrest the thief",
    roleDesc_CHOR: "500 pts (if free) • Bluff or frame innocent suspects",
    roleDesc_SIPAHI: "300 pts • Royal guard, defend your loyalty",
    roleDesc_BABU: "100 pts • Honest citizen, evade wrongful arrest",
    
    // Actions & Buttons
    ready: "Ready",
    notReady: "Not Ready",
    startGame: "Deal Chits",
    holdToPeek: "Hold to Peek Slip",
    peeking: "Peeking Slip...",
    slipSecret: "Keep this secret from your peers!",
    releaseToHide: "Release to conceal",
    callPolice: "Summon the Police",
    stepUpPolice: "I Am The Police!",
    accuse: "Lock In Arrest",
    nextRound: "Next Round",
    playAgain: "New Match",
    switchPlayer: "Switch Perspective",
    devMode: "Dev / Multi-Player Test Mode",
    bilingualToggle: "বাং / EN",
    
    // Sabotage Phase
    sabotageTitle: "The Syndicate: Thief's Turn",
    sabotageDesc: "The Thief is covertly manipulating evidence...",
    frameAction: "Frame a Suspect",
    frameDesc: "Inflicts suspicious visual jitter on an innocent player's card.",
    bribeAction: "Bribe Minister",
    bribeDesc: "Offer 50% split bounty in secret. If Police guesses wrong, both profit!",
    bribePrompt: "The Thief secretly offers a 50/50 bounty split. Accept the bribe?",
    acceptBribe: "Accept Deal 🤝",
    declineBribe: "Refuse & Stay Honest 🛡️",
    kingDecree: "Royal Decree",
    kingDecreeDesc: "Force suspects to answer an oath question!",
    
    // Interrogation Phase
    interrogationTitle: "Police Interrogation",
    interrogationDesc: "Inspect the suspects. Who is deceiving the Crown?",
    timeRemaining: "Time remaining",
    selectToInspect: "Tap a suspect to examine",
    sendReaction: "Bluff / Reaction",
    
    // Reactions
    bluff1: "I swear on the Crown, I'm innocent!",
    bluff2: "Look at his hands shaking!",
    bluff3: "Sir, I've served honestly for 20 years!",
    bluff4: "Why are you looking at me?!",
    bluff5: "Trust my eyes, Inspector!",
    
    // Result
    caughtTitle: "Arrest Successful!",
    escapedTitle: "The Thief Escaped!",
    arrestSummaryCorrect: "The Police rightly identified the Thief! Law & Order prevails.",
    arrestSummaryWrong: "An innocent citizen was arrested! The Thief stole the bounty.",
    finalScores: "Scoreboard",
    roundRecap: "Round Summary",
    
    // Lobby
    lobbyTitle: "Royal Game Table",
    lobbySeatWait: "Waiting for seats to fill...",
    tableCode: "Room Code",
    playerCount: "Table Capacity",
    playersJoined: "Seats Filled",
    inviteFriends: "Share Telegram Link",
    copied: "Invite link copied to clipboard!",
    addBotPlayer: "+ Add AI Seat",
  },
  bn: {
    gameTitle: "চোর পুলিশ",
    gameSubtitle: "ঐতিহ্যবাহী সামাজিক আড্ডা ও গোয়েন্দা খেলা",
    tagline: "চিট খুলুন। চোর শনাক্ত করুন।",
    
    // Roles
    role_RAJA: "রাজা",
    role_MONTRI: "মন্ত্রী",
    role_POLICE: "পুলিশ",
    role_CHOR: "চোর",
    role_SIPAHI: "সিপাহী",
    role_BABU: "বাবু",
    
    roleDesc_RAJA: "১,০০০ পয়েন্ট • রাজদরবারের প্রধান, পুলিশকে তলব করবেন",
    roleDesc_MONTRI: "৮০০ পয়েন্ট • সম্মানীয় মন্ত্রী, নির্দোষিতা প্রমাণ করুন",
    roleDesc_POLICE: "৫০০ পয়েন্ট • সন্দেহভাজনদের জেরা করে চোর গ্রেপ্তার করুন",
    roleDesc_CHOR: "৫০০ পয়েন্ট (পালালে) • ধোঁকা দিন অথবা নির্দোষকে ফাঁসিয়ে দিন",
    roleDesc_SIPAHI: "৩০০ পয়েন্ট • রাজকীয় প্রহরী, সততা বজায় রাখুন",
    roleDesc_BABU: "১০০ পয়েন্ট • নিরীহ প্রজা, ভুল গ্রেপ্তারি থেকে বাঁচুন",
    
    // Actions & Buttons
    ready: "প্রস্তুত",
    notReady: "অপ্রস্তুত",
    startGame: "চিট বণ্টন করুন",
    holdToPeek: "চিট দেখতে চেপে ধরে রাখুন",
    peeking: "চিট দেখা হচ্ছে...",
    slipSecret: "কারো কাছে আপনার ভূমিকা প্রকাশ করবেন না!",
    releaseToHide: "লুকাতে আঙুল সরান",
    callPolice: "পুলিশ তলব করুন",
    stepUpPolice: "আমিই পুলিশ!",
    accuse: "গ্রেপ্তার নিশ্চিত করুন",
    nextRound: "পরবর্তী রাউন্ড",
    playAgain: "নতুন ম্যাচ",
    switchPlayer: "খেলোয়াড় পরিবর্তন",
    devMode: "টেস্টিং ও বহু-খেলোয়াড় মোড",
    bilingualToggle: "EN / বাং",
    
    // Sabotage Phase
    sabotageTitle: "সিন্ডিকেট চাল: চোরের গোপন ষড়যন্ত্র",
    sabotageDesc: "চোর গোপনে তদন্ত বিভ্রান্ত করার ফাঁদ পাতছে...",
    frameAction: "নির্দোষকে ফাঁসানো",
    frameDesc: "সন্দেহভাজন নিরীহ ব্যক্তির কার্ডে ভীতি ও কাঁপুনি তৈরি করে।",
    bribeAction: "মন্ত্রীকে ঘুষ প্রস্তাব",
    bribeDesc: "৫০% পয়েন্ট ভাগের চুক্তি! পুলিশ ভুল করলে দুজনেই লাভবান।",
    bribePrompt: "চোর আপনাকে ৫০% পয়েন্ট ভাগাভাগির ঘুষ প্রস্তাব করেছে। গ্রহণ করবেন?",
    acceptBribe: "ঘুষ গ্রহণ করুন 🤝",
    declineBribe: "প্রত্যাখ্যান ও সততা 🛡️",
    kingDecree: "রাজার রাজকীয় ফরমান",
    kingDecreeDesc: "সন্দেহভাজনদের সরাসরি শপথ বাক্যের মুখোমুখি করুন!",
    
    // Interrogation Phase
    interrogationTitle: "পুলিশি জেরা ও তদন্ত",
    interrogationDesc: "সন্দেহভাজনদের ভালো করে পরখ করুন। আসল চোর কে?",
    timeRemaining: "বাকি সময়",
    selectToInspect: "পরীক্ষা করতে কার্ডে ট্যাপ করুন",
    sendReaction: "সংলাপ / প্রতিক্রিয়া",
    
    // Reactions
    bluff1: "রাজার কসম, আমি সম্পূর্ণ নির্দোষ হুজুর!",
    bluff2: "ওর হাতের কাঁপুনিটা একবার দেখুন!",
    bluff3: "স্যার, ২০ বছর ধরে রাজদরবারে বিশ্বস্ত সেবা দিচ্ছি!",
    bluff4: "আমার দিকে এভাবে দেখছেন কেন?!",
    bluff5: "আমার চোখের দিকে তাকান, কোনো অপরাধ পাবেন না!",
    
    // Result
    caughtTitle: "চোর ধরা পড়েছে!",
    escapedTitle: "চোর পালিয়ে গেছে!",
    arrestSummaryCorrect: "পুলিশ সঠিক চোরকে চিহ্নিত করেছে! সত্য ও ন্যায়ের জয়।",
    arrestSummaryWrong: "হায়! নির্দোষ ব্যক্তি গ্রেপ্তার হয়েছে, চোর সব পয়েন্ট হাতিয়ে নিলো!",
    finalScores: "সর্বশেষ স্কোরবোর্ড",
    roundRecap: "রাউন্ড সারসংক্ষেপ",
    
    // Lobby
    lobbyTitle: "রাজকীয় চত্বর ও টেবিল",
    lobbySeatWait: "অন্যান্য খেলোয়াড়দের অপেক্ষায়...",
    tableCode: "টেবিল কোড",
    playerCount: "খেলোয়াড় সংখ্যা",
    playersJoined: "আসন পূর্ণ",
    inviteFriends: "টেলিগ্রাম লিংক শেয়ার করুন",
    copied: "আমন্ত্রণ লিংক কপি করা হয়েছে!",
    addBotPlayer: "+ এআই আসন যোগ করুন",
  }
};
