/**
 * 中文版 UI 文案
 */
const strings = {
  // ── Landing Page ──
  landing: {
    subtitle: "用你的决定，重塑与他的未来",
    features: [
      { text: "沉浸式恋爱" },
      { text: "AI 互动剧情" },
      { text: "多分支结局" },
    ],
    ctaDrama: "观看短剧",
    ctaFull: "互动体验",
    ctaNote: "观看短剧：沉浸式追剧体验\n互动体验：与男主实时对话，你的选择改变剧情走向",
    aiTools: "AI 创作工具",
    dramaCreate: "短剧创作",
    dramaCreateDesc: "AI 生成分镜&短剧",
    comicDemo: "漫剧 Demo",
    comicDemoDesc: "一句话生成漫剧",
  },

  // ── Player Page ──
  player: {
    incomingCall: "来电",
    accept: "接听",
    decline: "拒接",
    callHint: "接听电话，开始和{name}的故事",
    episodePanel: "选集",
    episodePrefix: "第{n}集",
    episodeCount: "{n} 集",
    endOfDrama: "已经是最后一集了",
    startStory: "开始故事",
    share: "分享",
    missedCall: "有一个来自 ",
    missedCallCount: "3个未接来电",
    newVoice: "新语音消息",
    continueStory: "✦ 继续故事",
    voiceMessage: "\u201C我知道你在看。我们需要谈谈\u2014\u2014今晚。别让我等太久。\u201D",
    interactiveStory: "互动故事",
    introText: "开始创作你和{name}的故事",
    introSub1: "和原短剧剧情独立",
    introSub2: "你的每个选择都将改变故事走向",
    storyBeginHeadline: "你和{name}的故事即将开始。",
    beginStory: "✦ 开始你的故事",
    choiceHint: "你的每个选择都将改变故事走向",
    selectChar: "选择角色",
    startAiChat: "开始 AI 对话",
    chat: "聊天",
    epRange: "1–{n}",
  },

  // ── Index Page ──
  index: {
    categories: ["全部", "危险偏爱", "强占有欲", "追妻火葬场", "禁欲失控", "年上诱惑"],
    topBadge: "人气TOP1",
    episodesCount: "{n}集 · 继续",
    hotTitle: "热播榜",
    subtitleDrama: "沉浸追剧，每一帧都心动",
    tabs: {
      home: "首页",
      watch: "追剧",
      crave: "圈子",
      me: "我的",
    },
    community: {
      title: "社区内容",
      interactiveBadge: "互动影游",
      more: "更多 ›",
      interactiveTag: "互动",
      blackoutTitle: "停电夜惊喜",
      blackoutDesc: "沈彦希 · 独家支线",
      fanMadeTag: "二创",
      hotspringTitle: "温泉危机",
      hotspringDesc: "互动影游 · 2条结局",
    },
  },

  // ── Call Page ──
  call: {
    incomingCall: "来电",
    accept: "接听",
    decline: "拒接",
    callHint: "接听电话，开始和{name}的故事",
  },

  // ── HotspringGame Page ──
  hotspringGame: {
    tapHint: "轻触继续",
    skip: "跳过 ▸",
    sweetEnding: "💕 甜蜜结局",
    sadEnding: "💔 遗憾结局",
    restart: "重新开始",
    back: "← 返回",
    start: "开始",
    tag: "心动禁区 · AI互动影游",
    title: "温泉危机",
    subtitle: "「沈彦希和希辰邀请我一起去泡温泉…」",
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
    title: "漫剧创作 Demo",
    subtitle: "AI 自动生成漫剧短视频",
    steps: {
      generateScript: "生成剧本",
      storyboardBreakdown: "分镜拆解",
      videoCompose: "视频合成",
      playback: "完成播放",
    },
    inputIdea: {
      title: "输入你的漫剧创意",
      desc: "描述一个短剧场景或故事创意，AI 将自动生成剧本、分镜和视频。限 50~100 字。",
      label: "创意描述",
      countError: "超出字数限制，请精简描述",
      countMore: "还需要 {n} 个字",
      example: "点击使用示例",
      startBtn: "开始 AI 创作",
      generatingBtn: "AI 创作中…",
    },
    script: {
      title: "AI 剧本",
      done: "生成完成",
      nextStoryboard: "下一步：分镜拆解",
    },
    storyboard: {
      title: "分镜拆解",
      loading: "正在拆解分镜…",
      count: "{n} 个分镜",
      nextCompose: "下一步：合成视频",
    },
    compose: {
      title: "视频合成",
      done: "合成完成",
      stage1: "正在合成视频…",
      stage2: "添加运镜效果…",
      stage3: "叠加字幕…",
      stage4: "渲染完成 ✨",
      playBtn: "播放视频",
    },
    finish: {
      title: "漫剧生成完成",
      prompt: "你的漫剧已生成",
      continueBtn: "继续创作下一集",
      restyleBtn: "换个画风重新生成",
      shareBtn: "分享到社区",
      restartBtn: "重新创作",
      comingSoon: "功能即将上线",
    },
  },

  // ── Discover Page ──
  discover: {
    title: "发现",
    subtitle: "即将上线 — 探索更多好剧",
  },

  // ── Chat Page (shared reset/confirm strings) ──
  chatReset: {
    title: "重新开始",
    confirm: "所有进度将被清除，此操作不可撤销。",
    cancel: "取消",
    confirmBtn: "确认重置",
  },

  // ── Profile Page ──
  profile: {
    myPersona: "我的角色",
    nameField: "你在故事中的名字",
    namePlaceholder: "输入你的名字...",
    taglineField: "角色标签",
    taglinePlaceholder: "描述你的角色...",
    saveBtn: "保存角色",
    defaultName: "读者",
    defaultTag: "点击设置你的角色",
    noTagline: "还没有设置标签",
    watchHistory: "观看历史",
    noHistory: "还没有观看记录",
    browseDramas: "浏览短剧",
    episodes: "集数",
    dramas: "短剧",
    settings: {
      notifications: "通知",
      notificationsSub: "管理提醒",
      language: "语言",
      privacy: "隐私",
      privacySub: "数据与权限",
      about: "关于 AfterLine",
      aboutSub: "v1.0.0",
    },
    presetNames: ["Aria", "Luna", "Vivienne", "Celeste", "Elara", "Nova", "Seraphina", "Iris"],
    presetTags: [
      "错过的那个人",
      "暗恋中",
      "外冷内热",
      "藏着秘密",
      "比看起来更坚强",
      "不容易信任别人",
    ],
    justNow: "刚刚",
    minutesAgo: "{n}分钟前",
    hoursAgo: "{n}小时前",
    daysAgo: "{n}天前",
  },

  // ── Chat Page ──
  chat: {
    modeStory: "故事",
    modeChat: "聊天",
    sendPlaceholder: "输入你的选择...",
    intimacyLabel: "亲密度",
    lockedEpisode: "完成前一集解锁",
    generating: "生成中...",

    // Header
    modeDrama: "剧情推动",
    modeDialogue: "对话推动",
    circleBtn: "圈子",
    menuRestart: "重新开始",
    menuProfile: "角色资料",
    menuEpisodeInfo: "剧集信息",
    menuReport: "举报",
    confirmRestart: "确定要清空对话重新开始吗？",

    // Story area
    yourStory: "与你的故事",
    branchLabel: "选择分支",
    orCustom: "或者，写下你想做的事…",
    customPlaceholderStory: "输入你想做或说的…",
    customPlaceholderChat: "输入你想说的话…",
    writingStory: "正在书写你的故事...",
    intimacyGain: "+{n} 亲密度",

    // End card
    chapterComplete: "章节完成",
    chapterCompleteSubtitle: "你的选择塑造了这个故事。",
    backToEpisode: "返回剧集",

    // AI fallback
    continuingStory: "故事继续...",
    chatting: "你们继续交谈着...",
    connectionError: "「连接好像出了点问题...请稍后再试」",
    retryBtn: "重新尝试",
    retryHint: "点击重新尝试继续故事",
    aiInputHint: "你想做什么或者说什么？",
    aiChatHint: "你想对{name}说什么？",
    continueStoryChoice: "继续故事...",

    // Intimacy level unlock
    intimacyLevelUp: "亲密度等级提升",
    unlockExclusive: "解锁专属心动剧情",

    // Unlock modal
    unlockPOV: "解锁心动 POV",
    unlockTheatreTitle: "《停电夜的越界》",
    unlockTheatreDesc: "亲密度达到 3 级 · 开启专属剧情",
    unlockTheatreStory: "深夜停电，你们独处宿舍…\n选择你的故事走向",
    enterTheatre: "进入小剧场 →",

    // Circle drawer
    circleTitle: "圈子",
    followBtn: "+ 关注",
    justNow: "刚刚",
    interactiveTag: "互动影游",
    post1Username: "沈迷彦希的小橘子",
    post1Content: "沈彦希和希晨两个人一起去洗澡了！！！这段剧情我看哭了，快来看我的二创影游版本 👇",
    exclusiveTitle: "《停电夜的越界》",
    exclusiveHint: "互动影游 · 点击进入",
    post2Username: "小鱼_彦希应援站",
    post2Content: "温泉旅行，彦希突然出现……如果是你，你会选择坦白吗？🌿",
    hotspringTitle: "温泉危机",
    hotspringBranches: "互动影游 · 2条分支结局",
    hotspringStart: "开始体验 →",
    shareBtn: "分享",
    forwardBtn: "转发",
  },

  // ── Crave (圈子) Page ──
  crave: {
    title: "圈子",
    subtitle: "发现玩家创作的互动影游",
    emptyTitle: "圈子还是空的",
    emptySubtitle: "创作一部互动影游并发布，\n让其他玩家也能体验你的故事吧！",
    emptyBtn: "去创作",
    gameTag: "互动影游 · 点击进入",
    followBtn: "+ 关注",
    relatedDrama: "关联剧",
    forwardBtn: "转发",
    footerHint: "更多精彩影游，等你来创作",
    // timeAgo
    justNow: "刚刚",
    minutesAgo: "{n} 分钟前",
    hoursAgo: "{n} 小时前",
    daysAgo: "{n} 天前",
    // seed posts
    seed1Title: "停电夜的越界",
    seed1Promo: "救命啊彦希黑暗里突然牵手那段我反复品了八十遍😭 我按自己想法改了一版二创，结局比原版甜一万倍信我！！快进来嗑😭",
    seed1Drama: "心动禁区",
    seed2Title: "温泉危机",
    seed2Promo: "家人们谁懂啊！温泉那集彦希一转头我直接心脏骤停💀 我魔改了一版如果当时追上去的剧情……结果他居然说了那句话？？？",
    seed2Drama: "心动禁区",
    // user pool
    user1Name: "沈迷彦希的小橘子",
    user2Name: "小鱼_彦希应援站",
    user3Name: "影游创作达人",
    user4Name: "心动禁区铁粉",
    user5Name: "彦希的小跟班_",
    user6Name: "追剧不熬夜",
    user7Name: "甜虐皆宜党",
  },

  // ── VideoCreate Page ──
  videoCreate: {
    // Header
    title: "视频创作",
    sceneCount: "共 {n} 个分镜 · EP{ep}",
    aiAnalyzing: "AI 分析中...",
    episodeLabel: "剧集 {id}",

    // Loading state
    loadingTitle: "AI 正在分析剧情",
    loadingSubtitle: "正在生成分镜脚本...",
    loadingHint: "根据你的互动内容智能编排镜头",

    // Empty state
    emptyTitle: "暂无对话记录",
    emptySubtitle: "请先在对话页面与角色互动超过 3 轮，\n再点击「生成视频」按钮",
    emptyBack: "返回对话",

    // Scene card labels
    sceneCardShot: "镜头 {n}",
    sceneDescLabel: "场景描述",
    sceneActionLabel: "角色动作",
    sceneCameraLabel: "镜头",
    sceneDialogueLabel: "台词",
    sceneVideoPromptLabel: "视频生成 Prompt",
    sceneGenPromptBtn: "生成视频描述",
    sceneGenPromptLoading: "生成中…",
    sceneVideoDescLabel: "视频描述（点击全选复制）",

    // Hint banner
    hintBanner: "AI 已根据你的互动生成分镜脚本，可直接编辑场景描述和角色动作",

    // Add scene
    addScene: "添加分镜",
    newSceneDesc: "新场景描述",
    newSceneAction: "角色动作",

    // Character refs
    charRefTitle: "角色参考",
    charRefSubtitle: "选择角色形象参考，确保视频中人物一致",

    // Video style
    videoStyleTitle: "视频风格",
    videoStyles: ["甜宠", "虐恋", "悬疑", "搞笑"],
    videoStyleDefault: "甜宠",

    // Background music
    bgMusicTitle: "背景音乐",
    bgMusics: ["浪漫钢琴", "紧张弦乐", "无"],
    bgMusicDefault: "浪漫钢琴",

    // Generate button
    generateBtn: "生成视频",
    generatingBtn: "AI 正在生成视频...",

    // Fallback scene data (parseHistoryToScenes)
    fallbackUserScene: "用户互动场景",
    fallbackAiScene: "AI 叙事场景",
    fallbackAction: "场景展开",
    fallbackCameraClose: "近景",
    fallbackCameraMid: "中景",
  },
};

export default strings;
