/**
 * English UI strings
 */
const strings = {
  // ── Landing Page ──
  landing: {
    subtitle: "Your choices reshape the story with him",
    features: [
      { text: "Immersive Romance" },
      { text: "AI Interactive Story" },
      { text: "Multiple Endings" },
    ],
    ctaDrama: "Watch Drama",
    ctaFull: "Interactive Mode",
    ctaNote: "Watch Drama: Binge the story\nInteractive Mode: Chat with the lead, your choices change the plot",
    aiTools: "AI Creation Tools",
    dramaCreate: "Drama Creator",
    dramaCreateDesc: "AI-generated storyboards",
    comicDemo: "Comic Demo",
    comicDemoDesc: "One-line comic generation",
  },

  // ── Player Page ──
  player: {
    incomingCall: "Incoming Call",
    accept: "Accept",
    decline: "Decline",
    callHint: "Answer and begin your story with {name}",
    episodePanel: "Episodes",
    episodePrefix: "EP {n}",
    episodeCount: "{n} eps",
    endOfDrama: "No more episodes",
    startStory: "Story",
    share: "Share",
    missedCall: "Missed call from ",
    missedCallCount: "3 missed calls",
    newVoice: "New voice message",
    continueStory: "✦ Continue Story",
    voiceMessage: "\u201CI know you\u2019re watching. We need to talk \u2014 tonight. Don\u2019t keep me waiting.\u201D",
    interactiveStory: "Interactive Story",
    introText: "Your story with {name} begins now",
    introSub1: "Separate from the original drama",
    introSub2: "Every choice shapes your destiny",
    storyBeginHeadline: "Your story with {name} is about to begin.",
    beginStory: "✦ Begin Your Story",
    choiceHint: "Every choice shapes your destiny",
    selectChar: "Select Character",
    startAiChat: "Start AI Chat",
    chat: "Chat",
    epRange: "EP 1–{n}",
  },

  // ── Index Page ──
  index: {
    categories: ["All", "Dangerous Love", "Possessive", "Chase & Regret", "Forbidden", "Age Gap"],
    topBadge: "TOP 1",
    episodesCount: "{n} eps · Continue",
    hotTitle: "Trending",
    subtitleDrama: "Every frame makes your heart skip",
    tabs: {
      home: "Home",
      watch: "Watch",
      crave: "Circle",
      me: "Me",
    },
    community: {
      title: "Community",
      interactiveBadge: "Interactive",
      more: "More ›",
      interactiveTag: "Interactive",
      blackoutTitle: "Blackout Surprise",
      blackoutDesc: "Shen Yanxi · Side Story",
      fanMadeTag: "Fan-made",
      hotspringTitle: "Hot Spring Crisis",
      hotspringDesc: "Interactive · 2 endings",
    },
  },

  // ── Call Page ──
  call: {
    incomingCall: "Incoming Call",
    accept: "Accept",
    decline: "Decline",
    callHint: "Answer and begin your story with {name}",
  },

  // ── HotspringGame Page ──
  hotspringGame: {
    tapHint: "Tap to continue",
    skip: "Skip ▸",
    sweetEnding: "💕 Sweet Ending",
    sadEnding: "💔 Sad Ending",
    restart: "Restart",
    back: "← Back",
    start: "Start",
    tag: "Heart Zone · AI Interactive Drama",
    title: "Hotspring Crisis",
    subtitle: "Shen Yanxi and Xichen invited me to the hotspring...",
  },

  // ── EnglishChat Page ──
  englishChat: {
    choosePath: "Choose your path",
    orWriteAction: "Or write what you want to do…",
    typeSay: "Type what you want to say…",
    typeAction: "Type your action or words…",
    episodes: "Episodes",
    episodeLabel: "Episode {n}",
    resetConfirm: "Reset all progress? This cannot be undone.",
    resetTitle: "Reset Chat",
    resetBtn: "Reset",
    storyContinues: "The story continues…",
    storyUnfolds: "The story unfolds…",
    continueStory: "Continue the story…",
    sayPrompt: "What would you like to say?",
    doPrompt: "What do you do?",
    connectionError: "「Connection seems unstable… Please try again later」",
    tryAgain: "Try again",
    clickContinue: "Click to continue the story",
    episodeComplete: "Episode Complete",
    shapedStory: "Your choices have shaped this story.",
    returnDrama: "Return to Drama",
  },

  // ── ComicDemo Page ──
  comicDemo: {
    title: "Comic Demo",
    subtitle: "AI auto-generates comic shorts",
    steps: {
      generateScript: "Script",
      storyboardBreakdown: "Storyboard",
      videoCompose: "Compose",
      playback: "Play",
    },
    inputIdea: {
      title: "Enter your comic idea",
      desc: "Describe a short scene or story idea. AI will auto-generate script, storyboard, and video. 50–100 chars.",
      label: "Idea",
      countError: "Exceeds limit, please shorten",
      countMore: "Need {n} more chars",
      example: "Tap to use example",
      startBtn: "Start AI Creation",
      generatingBtn: "Creating…",
    },
    script: {
      title: "AI Script",
      done: "Done",
      nextStoryboard: "Next: Storyboard",
    },
    storyboard: {
      title: "Storyboard",
      loading: "Breaking down shots…",
      count: "{n} shots",
      nextCompose: "Next: Compose Video",
    },
    compose: {
      title: "Video Compose",
      done: "Done",
      stage1: "Composing video…",
      stage2: "Adding camera work…",
      stage3: "Overlaying subtitles…",
      stage4: "Render complete ✨",
      playBtn: "Play Video",
    },
    finish: {
      title: "Comic Ready",
      prompt: "Your comic is ready",
      continueBtn: "Continue Next Episode",
      restyleBtn: "Regenerate with New Style",
      shareBtn: "Share to Community",
      restartBtn: "Create Again",
      comingSoon: "Coming soon",
    },
  },

  // ── Discover Page ──
  discover: {
    title: "Discover",
    subtitle: "Coming soon — explore more stories",
  },

  // ── Chat Page (shared reset/confirm strings) ──
  chatReset: {
    title: "Reset Progress",
    confirm: "All progress will be lost. This cannot be undone.",
    cancel: "Cancel",
    confirmBtn: "Reset",
  },

  // ── Profile Page ──
  profile: {
    myPersona: "My Persona",
    nameField: "Your name in the story",
    namePlaceholder: "Enter your name...",
    taglineField: "Character tagline",
    taglinePlaceholder: "Describe your character...",
    saveBtn: "Save Persona",
    defaultName: "Reader",
    defaultTag: "Tap to set your persona",
    noTagline: "No tagline set yet",
    watchHistory: "Watch History",
    noHistory: "No episodes watched yet",
    browseDramas: "Browse dramas",
    episodes: "Episodes",
    dramas: "Dramas",
    settings: {
      notifications: "Notifications",
      notificationsSub: "Manage alerts",
      language: "Language",
      privacy: "Privacy",
      privacySub: "Data & permissions",
      about: "About AfterLine",
      aboutSub: "v1.0.0",
    },
    presetNames: ["Aria", "Luna", "Vivienne", "Celeste", "Elara", "Nova", "Seraphina", "Iris"],
    presetTags: [
      "The one who got away",
      "Secretly in love",
      "Cold on the outside",
      "Hiding a secret",
      "Stronger than she looks",
      "Doesn't trust easily",
    ],
    justNow: "Just now",
    minutesAgo: "{n}m ago",
    hoursAgo: "{n}h ago",
    daysAgo: "{n}d ago",
  },

  // ── Chat Page ──
  chat: {
    modeStory: "Story",
    modeChat: "Chat",
    sendPlaceholder: "Type your choice...",
    intimacyLabel: "Intimacy",
    lockedEpisode: "Complete previous episode to unlock",
    generating: "Generating...",

    // Header
    modeDrama: "Story Mode",
    modeDialogue: "Chat Mode",
    circleBtn: "Circle",
    menuRestart: "Restart",
    menuProfile: "Character Profile",
    menuEpisodeInfo: "Episode Info",
    menuReport: "Report",
    confirmRestart: "Reset the conversation and start over?",

    // Story area
    yourStory: "Your Story with",
    branchLabel: "Choose a Path",
    orCustom: "Or, write what you want to do…",
    customPlaceholderStory: "Type what you want to do or say…",
    customPlaceholderChat: "Type what you want to say…",
    writingStory: "Writing your story...",
    intimacyGain: "+{n} Intimacy",

    // End card
    chapterComplete: "Chapter Complete",
    chapterCompleteSubtitle: "Your choices shaped this story.",
    backToEpisode: "Back to Episodes",

    // AI fallback
    continuingStory: "Story continues...",
    chatting: "The conversation goes on...",
    connectionError: "“Something went wrong… Please try again later.”",
    retryBtn: "Try Again",
    retryHint: "Tap to retry and continue the story",
    aiInputHint: "What do you want to do or say?",
    aiChatHint: "What do you want to say to {name}?",
    continueStoryChoice: "Continue story...",

    // Intimacy level unlock
    intimacyLevelUp: "Intimacy Level Up",
    unlockExclusive: "Exclusive story unlocked",

    // Unlock modal
    unlockPOV: "Unlock Exclusive POV",
    unlockTheatreTitle: "\u300cBlackout Crossing\u300d",
    unlockTheatreDesc: "Intimacy Lv.3 · Exclusive story unlocked",
    unlockTheatreStory: "Late night power outage, alone in the dorm…\nChoose your story path",
    enterTheatre: "Enter Story →",

    // Circle drawer
    circleTitle: "Circle",
    followBtn: "+ Follow",
    justNow: "Just now",
    interactiveTag: "Interactive",
    post1Username: "YanxiObsessed",
    post1Content: "Yanxi and Xichen went to the bath together!!! This scene made me cry. Check out my fan-made interactive version \ud83d\udc47",
    exclusiveTitle: "\u300cBlackout Crossing\u300d",
    exclusiveHint: "Interactive Story · Tap to enter",
    post2Username: "Yanxi_FanStation",
    post2Content: "Hot spring trip, and Yanxi suddenly shows up… Would you confess if it were you? \ud83c\udf3f",
    hotspringTitle: "Hot Spring Crisis",
    hotspringBranches: "Interactive · 2 endings",
    hotspringStart: "Start →",
    shareBtn: "Share",
    forwardBtn: "Repost",
  },

  // ── Crave (Circle) Page ──
  crave: {
    title: "Circle",
    subtitle: "Discover interactive stories from players",
    emptyTitle: "The Circle is empty",
    emptySubtitle: "Create and publish an interactive story,\nso other players can experience it too!",
    emptyBtn: "Start Creating",
    gameTag: "Interactive · Tap to enter",
    followBtn: "+ Follow",
    relatedDrama: "Related Drama",
    forwardBtn: "Repost",
    footerHint: "More amazing stories await your creation",
    // timeAgo
    justNow: "Just now",
    minutesAgo: "{n}m ago",
    hoursAgo: "{n}h ago",
    daysAgo: "{n}d ago",
    // seed posts
    seed1Title: "Blackout Crossing",
    seed1Promo: "Omg the part where he grabs her hand in the dark... I watched it 80 times 😭 I made my own version with a way sweeter ending, trust me!! Come play 😭",
    seed1Drama: "Forbidden Heartbeat",
    seed2Title: "Hotspring Crisis",
    seed2Promo: "Guys who gets it!! The hot spring scene where he turns around I literally died 💀 I remade the what-if version where you chase after him... and he said THAT???",
    seed2Drama: "Forbidden Heartbeat",
    // user pool
    user1Name: "YanxiObsessed",
    user2Name: "Yanxi_FanStation",
    user3Name: "StoryCreator",
    user4Name: "HeartbeatFanatic",
    user5Name: "YanxiSidekick_",
    user6Name: "NoLateNightBinge",
    user7Name: "SweetAndAngst",
  },

  // ── VideoCreate Page ──
  videoCreate: {
    // Header
    title: "Video Creator",
    sceneCount: "{n} shots · EP{ep}",
    aiAnalyzing: "AI analyzing...",
    episodeLabel: "Episode {id}",

    // Loading state
    loadingTitle: "AI is analyzing your story",
    loadingSubtitle: "Generating storyboard script...",
    loadingHint: "Intelligently arranging shots from your interactions",

    // Empty state
    emptyTitle: "No conversation found",
    emptySubtitle: "Chat with a character for at least 3 rounds first,\nthen tap \"Generate Video\"",
    emptyBack: "Back to Chat",

    // Scene card labels
    sceneCardShot: "Shot {n}",
    sceneDescLabel: "Scene Description",
    sceneActionLabel: "Character Action",
    sceneCameraLabel: "Camera",
    sceneDialogueLabel: "Dialogue",
    sceneVideoPromptLabel: "Video Generation Prompt",
    sceneGenPromptBtn: "Generate Video Description",
    sceneGenPromptLoading: "Generating…",
    sceneVideoDescLabel: "Video Description (tap to select all)",

    // Hint banner
    hintBanner: "AI has generated a storyboard from your interactions — feel free to edit the scene descriptions and character actions",

    // Add scene
    addScene: "Add Shot",
    newSceneDesc: "New scene description",
    newSceneAction: "Character action",

    // Character refs
    charRefTitle: "Character References",
    charRefSubtitle: "Select character references to ensure consistent appearance in the video",

    // Video style
    videoStyleTitle: "Video Style",
    videoStyles: ["Sweet Romance", "Heartbreak", "Thriller", "Comedy"],
    videoStyleDefault: "Sweet Romance",

    // Background music
    bgMusicTitle: "Background Music",
    bgMusics: ["Romantic Piano", "Tense Strings", "None"],
    bgMusicDefault: "Romantic Piano",

    // Generate button
    generateBtn: "Generate Video",
    generatingBtn: "AI is generating your video...",

    // Fallback scene data (parseHistoryToScenes)
    fallbackUserScene: "User interaction scene",
    fallbackAiScene: "AI narrative scene",
    fallbackAction: "Scene unfolds",
    fallbackCameraClose: "Close-up",
    fallbackCameraMid: "Medium shot",
  },
};

export default strings;
