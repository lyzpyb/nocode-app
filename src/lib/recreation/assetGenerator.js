/**
 * assetGenerator.js
 * 互动故事树素材批量生成编排模块
 *
 * 职责：
 *  1. generateAllAssets(gameData, options) — 遍历节点，并发生成图片/视频 + TTS
 *  2. buildImagePrompt(visualMeta, character) — visualMeta → 图片 prompt
 *  3. buildVideoPrompt(visualMeta, character) — visualMeta → Seedance 视频 prompt
 *  4. generateVideo(prompt, refImages, refAudioUrl) — Seedance 2.0 异步提交+轮询
 *  5. VOICE_MAP — 角色 → 音色名映射
 */

// ─── Agnes 图片生成 API 配置 ──────────────────────────────────────────────────
const AGNES_API_KEY = 'sk-Q6tUbM2bxOsKkQb7bTHPlfJglji5XOpA5BomqJSFGDOqXFu6';
const AGNES_IMAGE_ENDPOINT = 'https://apihub.agnes-ai.com/v1/images/generations';

// ─── 豆包 Seedream 图片生成 API 配置（支持参考图图生图）─────────────────────────
const DOUBAO_API_KEY = 'ark-7d45285f-7256-428d-8116-e2175751945e-597b5';
// Supabase Edge Function 代理（解决 CORS）
const DOUBAO_IMAGE_PROXY = '/api/ark/images/generations';
const DOUBAO_IMAGE_DIRECT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const DOUBAO_IMAGE_ENDPOINT = DOUBAO_IMAGE_DIRECT;
const DOUBAO_IMAGE_MODEL = 'doubao-seedream-5-0-260128';
const SUPABASE_ANON_KEY_IMG = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2OTc5MjAwLCJleHAiOjE5MDQ3NDU2MDB9.E5xjt6-66Y9Ld82GQFeBSXTLdvrUnRTCzIwYTcMfgKU';

// ─── Seedance 2.0 视频生成 API 配置 ─────────────────────────────────────────
const SEEDANCE_API_KEY = 'ark-775c4542-84ea-4bf4-983e-87adc130abf2-0e803';
const SEEDANCE_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';
const SEEDANCE_MODEL = 'doubao-seedance-2-0-260128';

// ─── Seedance 角色参考图（通过审核）─────────────────────────────────────────
const SEEDANCE_REF_SHENYANXI = 'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/tqqtbs5yecz2xqzjb1hiwowixyy3w8/shenyanxi_body_yukata.png';
const SEEDANCE_REF_SUMIAN = 'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/4vinzkb68e5nkp6tx4prly5b2mnxkg/sumian_body_yukata.png';
const SEEDANCE_REF_SHENYANXI2 = 'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/q1o8z2w88bvrl0gkkpjn25jpp5nyao/shenyanxi_body_casual.png';

// ─── Seedance 参考音频（沈彦希音色，用于 @音频1 音色克隆）────────────────────
const SEEDANCE_REF_AUDIO = 'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/h785vg56gsi76xzh69p7ogy2bql8g8/xdjq_shenyanxi_candidate.wav';

// ─── MiMo V2.5 TTS API 配置 ─────────────────────────────────────────────────
const MIMO_TTS_API_KEY = 'tp-coj66arkt5dcivacopcniii0v2azdxhbh9gbuyzld6wmdfxh';
const MIMO_TTS_BASE_URL = 'https://token-plan-cn.xiaomimimo.com/v1';
const MIMO_TTS_MODEL = 'mimo-v2.5-tts';
const MIMO_TTS_MODEL_VOICEDESIGN = 'mimo-v2.5-tts-voicedesign'; // 文本描述设计音色（无预置音色）
const MIMO_TTS_VOICE = '冰糖'; // 中文女声预置音色
const MIMO_TTS_VOICE_MALE = '苏打'; // 中文男声预置音色（沈彦希）

// ─── 图片模型选项 ─────────────────────────────────────────────────────────────
export const IMAGE_MODELS = {
  agnes: { label: 'Agnes Image 2.1 Flash', value: 'agnes', supportRefImage: false },
  doubao: { label: '豆包 Seedream 5.0（支持参考图）', value: 'doubao', supportRefImage: true },
};

// ─── 角色三视图参考图（上传至 Supabase Storage）──────────────────────────────
const CHARACTER_REF_SHENYANXI = '/characters/character_shenyanxi.jpg';
const CHARACTER_REF_SUYAN     = '/characters/character_suyan.jpg';

// ─── 参考图配置（按集数）─────────────────────────────────────────────────────
// 每集：角色三视图（沈彦希 + 苏颜）放最前，作为人物外貌基准；后接场景截图参考风格/光影
const SCENE_FRAMES = [
  'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/4vbiloxy1ho2gscfb2m5pas6qwgqr4/frame_ep1_30s.jpg',
  'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/eyfqo9w0bemignxwm1nef722bxboy0/frame_ep1_60s.jpg',
  'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/v3hz0bcxs6vsit5h81lnwaipiuh5yx/frame_ep2_20s.jpg',
  'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/7g6bdhbkqo6sqajgjymyndkbyo8ajy/frame_ep3_40s.jpg',
  'https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/c6njkcmdk4t8m51jyw8ie8eg1whgo0/frame_ep5_30s.jpg',
];

export const REFERENCE_IMAGES = {
  1: [CHARACTER_REF_SHENYANXI, CHARACTER_REF_SUYAN, ...SCENE_FRAMES],
  2: [CHARACTER_REF_SHENYANXI, CHARACTER_REF_SUYAN, ...SCENE_FRAMES],
  3: [CHARACTER_REF_SHENYANXI, CHARACTER_REF_SUYAN, ...SCENE_FRAMES],
  4: [CHARACTER_REF_SHENYANXI, CHARACTER_REF_SUYAN, ...SCENE_FRAMES],
  5: [CHARACTER_REF_SHENYANXI, CHARACTER_REF_SUYAN, ...SCENE_FRAMES],
  6: [CHARACTER_REF_SHENYANXI, CHARACTER_REF_SUYAN, ...SCENE_FRAMES],
};

// ─── 1. 音色映射（保留但不再用于 TTS 选音，统一用 MiMo 冰糖）────────────────────

/**
 * 角色/类型 → TTS 音色名（仅做记录，实际统一使用 MIMO_TTS_VOICE）
 */
export const VOICE_MAP = {
  沈彦希: "苏打",
  彦希: "苏打",
  林夏: "冰糖",
  苏颜: "茉莉",
  旁白: "冰糖",
  内心独白: "茉莉",
  default: "冰糖",
};

/**
 * 根据 speaker 字段解析音色（MiMo 预置音色 ID）
 */
function resolveVoice(speaker) {
  if (!speaker) return VOICE_MAP.default;
  if (VOICE_MAP[speaker]) return VOICE_MAP[speaker];
  for (const [key, voice] of Object.entries(VOICE_MAP)) {
    if (speaker.includes(key)) return voice;
  }
  return VOICE_MAP.default;
}

// ─── 2. buildImagePrompt ──────────────────────────────────────────────────────

/**
 * 主要角色的固定视觉描述，用于防止图片生成时出现性别/年龄不匹配问题
 * key: 角色名关键词（用于 includes 匹配）
 */
const CHARACTER_VISUAL_DESC = {
  沈彦希: "沈彦希（男，20岁左右，银灰色蓬松碎短发自然微卷带凌乱感，深棕色细框方形眼镜镜片微带反光，狭长眼型眼尾微挑深色瞳孔眼神慵懒戏谑，高挺鼻梁鼻翼窄，薄唇唇色偏淡嘴角微压，左下唇偏外侧细小伤痕，左耳黑色小耳钉，下颌线清晰锐利，身形高挑偏瘦修长肩线窄但挺拔，皮肤冷白瓷质光泽）",
  林夏: "林夏（女，19岁，清秀圆脸，短黑发，女扮男装穿酒红校服，娇小身材，邻家少女感）",
  苏颜: "苏颜（女，20岁，知性气质，利落短发，眼神强势）",
  希辰: "希辰（男，20岁，阳光帅气，笑起来有酒窝，运动系男生）",
};

/** 默认角色组合描述（当 mainCharacter 未指定时使用） */
const DEFAULT_CHAR_DESC =
  "沈彦希（男，20岁，银灰色蓬松碎短发自然微卷带凌乱感，深棕色细框方形眼镜镜片微带反光，狭长眼型眼尾微挑深色瞳孔眼神慵懒戏谑，高挺鼻梁鼻翼窄，薄唇唇色偏淡嘴角微压，左下唇偏外侧细小伤痕，左耳黑色小耳钉，下颌线清晰锐利，身形高挑偏瘦修长肩线窄但挺拔，皮肤冷白瓷质光泽）与林夏（女，19岁，短黑发，酒红校服，娇小身材，邻家少女）";

/**
 * 将 mainCharacter 字符串解析为视觉描述
 * 若包含已知角色名则替换为详细描述，否则原样保留
 */
function resolveCharacterDesc(mainCharacter) {
  if (!mainCharacter) return DEFAULT_CHAR_DESC;
  let desc = mainCharacter;
  for (const [name, visual] of Object.entries(CHARACTER_VISUAL_DESC)) {
    if (mainCharacter.includes(name)) {
      desc = desc.replace(name, visual);
    }
  }
  return desc;
}

/**
 * 将节点 visualMeta 转为图片生成 prompt
 *
 * @param {Object} visualMeta  { scene, mood, lighting, keyAction, cameraAngle }
 * @param {string} [character] 可选，主体角色描述（用于镜头主体）；会被解析为详细人物外貌
 * @returns {string}
 */
export function buildImagePrompt(visualMeta, character) {
  const {
    scene = "",
    mood = "",
    lighting = "",
    keyAction = "",
    cameraAngle = "中景",
  } = visualMeta || {};

  const stylePrefix = "半写实半动漫风格，电影感构图，光影精细，竖屏9:16";

  const parts = [stylePrefix];

  // 人物描述放在最前面，确保模型优先保证人物正确性
  const charDesc = resolveCharacterDesc(character);
  parts.push(`人物：${charDesc}`);

  if (scene) parts.push(`场景：${scene}`);
  if (mood) parts.push(`氛围：${mood}`);
  if (lighting) parts.push(`光线：${lighting}`);
  if (keyAction) parts.push(`核心动作：${keyAction}`);
  if (cameraAngle) parts.push(`镜头：${cameraAngle}`);

  // 追加质量关键词
  parts.push("高细节，电影质感，无文字水印");

  return parts.join("，");
}

// ─── 2b. buildVideoPrompt（Seedance 2.0 视频 prompt）─────────────────────────

/**
 * Seedance 角色定义模板
 * 基于 test_seedance_ark.py 中跑通的 prompt 结构
 */
const SEEDANCE_CHAR_DEFINITIONS = {
  沈彦希: "将图片1中银灰色蓬松碎短发、戴深棕色细框方形眼镜、左耳有黑色小耳钉、冷白肤色、穿深色浴衣的修长少年定义为<沈彦希>。",
  苏颜: "将图片2中深黑色齐耳短发、大而圆的深棕色眼睛、白皙肤色、穿浅色浴衣的娇小少女定义为<苏颜>。",
  林夏: "将图片2中深黑色齐耳短发、大而圆的深棕色眼睛、白皙肤色、穿浅色浴衣的娇小少女定义为<林夏>。",
};

/**
 * 将 visualMeta 数组（多镜头分镜）转为 Seedance 2.0 视频生成 prompt
 *
 * Seedance prompt 结构：
 *   1. 角色定义（绑定参考图）
 *   2. 风格声明
 *   3. 镜头描述（含动作、字幕）
 *   4. 环境音
 *
 * @param {Array|Object} visualMetaArray  单个或多个 { scene, mood, lighting, keyAction, cameraAngle } 镜头
 * @param {string}       [character]      主角描述（用于判断出场角色）
 * @param {Object}       [dialogueInfo]   可选，{ speaker, text } 对话信息，用于生成字幕
 * @param {string}       [proseText]      可选，旁白文本，用于补充场景描述
 * @returns {string}
 */
export function buildVideoPrompt(visualMetaArray, character, dialogueInfo, proseText) {
  const metaArray = Array.isArray(visualMetaArray) ? visualMetaArray : [visualMetaArray || {}];

  // 1. 角色定义 — 根据 character 中包含的角色名，添加对应的角色绑定
  const charDefs = [];
  const involvedChars = [];
  for (const [name, def] of Object.entries(SEEDANCE_CHAR_DEFINITIONS)) {
    if (!character || character.includes(name) || character.includes("和")) {
      charDefs.push(def);
      involvedChars.push(name);
    }
  }
  // 默认至少包含沈彦希和苏颜/林夏
  if (charDefs.length === 0) {
    charDefs.push(SEEDANCE_CHAR_DEFINITIONS["沈彦希"]);
    charDefs.push(SEEDANCE_CHAR_DEFINITIONS["苏颜"]);
    involvedChars.push("沈彦希", "苏颜");
  }

  const parts = [];
  parts.push(charDefs.join(""));
  parts.push("");  // 空行分隔

  // 2. 风格声明
  parts.push("真人写实短剧风格，电影感光影，竖屏9:16。");
  parts.push("");

  // 3. 镜头描述 — 取前2个镜头（6s视频2个镜头节奏较好）
  const shotsToUse = metaArray.slice(0, 2);
  shotsToUse.forEach((meta, idx) => {
    const {
      scene = "",
      mood = "",
      lighting = "",
      keyAction = "",
      cameraAngle = "中景",
    } = meta;

    let shotDesc = `镜头${idx + 1}：${cameraAngle}，`;

    // 场景
    if (scene) shotDesc += `${scene}。`;

    // 核心动作 — 使用角色标记 <角色名>
    if (keyAction) {
      let actionText = keyAction;
      involvedChars.forEach((name) => {
        // 把纯文本角色名替换为 <角色名> 标记
        if (actionText.includes(name) && !actionText.includes(`<${name}>`)) {
          actionText = actionText.replace(new RegExp(name, 'g'), `<${name}>`);
        }
      });
      shotDesc += actionText;
    }

    // 光线和氛围作为补充
    if (lighting) shotDesc += `${lighting}。`;
    if (mood) shotDesc += `氛围：${mood}。`;

    parts.push(shotDesc);
  });

  // 4. 对话字幕
  if (dialogueInfo && dialogueInfo.text) {
    parts.push("");
    const speaker = dialogueInfo.speaker || "沈彦希";
    // 使用 @音频1 引用参考音频的音色
    parts.push(`<${speaker}>使用@音频1的音色说：{${dialogueInfo.text}}`);
    parts.push(`画面底部居中显示白色描边字幕"${dialogueInfo.text}"`);
  }

  // 5. 旁白作为画面底字幕（如果没有对话）
  if (!dialogueInfo?.text && proseText) {
    const shortProse = proseText.length > 20 ? proseText.slice(0, 20) + "…" : proseText;
    parts.push("");
    parts.push(`画面底部居中显示白色描边字幕"${shortProse}"`);
  }

  // 6. 环境音
  parts.push("");
  // 从场景描述中推断环境音
  const allScenes = metaArray.map((m) => m.scene || "").join(" ");
  let ambientSound = "<环境白噪音>";
  if (allScenes.includes("温泉") || allScenes.includes("浴室")) {
    ambientSound = "<温泉流水声和夏夜虫鸣>";
  } else if (allScenes.includes("雨") || allScenes.includes("下雨")) {
    ambientSound = "<雨声和远处雷声>";
  } else if (allScenes.includes("篮球") || allScenes.includes("操场")) {
    ambientSound = "<篮球拍打声和远处欢呼>";
  } else if (allScenes.includes("教室") || allScenes.includes("课堂")) {
    ambientSound = "<翻书声和低沉的交谈>";
  } else if (allScenes.includes("夜") || allScenes.includes("深夜") || allScenes.includes("晚上")) {
    ambientSound = "<夜晚虫鸣和远处城市低频>";
  } else if (allScenes.includes("走廊") || allScenes.includes("楼道")) {
    ambientSound = "<脚步回声和远处人声>";
  }
  parts.push(ambientSound);

  return parts.join("\n");
}

// ─── 3. 并发池 ────────────────────────────────────────────────────────────────

/**
 * 并发池：限制最多 concurrency 个任务同时运行
 * tasks: Array<() => Promise<any>>
 */
async function runWithConcurrency(tasks, concurrency = 3) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      try {
        results[i] = { ok: true, value: await tasks[i]() };
      } catch (err) {
        results[i] = { ok: false, error: err };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── 4. 单资源生成 ────────────────────────────────────────────────────────────

/**
 * 过滤参考图 URL，去掉 placeholder 或无效链接
 */
function getValidRefs(referenceImages) {
  return (Array.isArray(referenceImages) ? referenceImages : [])
    .filter((url) => url && !url.includes('placeholder') && url.startsWith('https://'));
}

/**
 * 使用 Agnes API 生成图片（纯文生图，不支持参考图）
 */
async function generateImageAgnes(prompt) {
  const requestBody = {
    model: 'agnes-image-2.1-flash',
    prompt,
    size: '768x1024',
  };

  const resp = await fetch(AGNES_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`[Agnes] 图片生成失败: ${resp.status} ${errText}`);
  }
  const json = await resp.json();
  const url = json?.data?.[0]?.url;
  if (!url) throw new Error('[Agnes] 图片生成：返回数据中无 url');
  return url;
}

/**
 * 使用豆包 Seedream API 生成图片（支持参考图图生图）
 *
 * @param {string}   prompt         图片描述
 * @param {string[]} [refImages]    参考图 URL 数组（可选）
 */
async function generateImageDoubao(prompt, refImages) {
  const validRefs = getValidRefs(refImages);
  const hasRefs = validRefs.length > 0;

  // 有参考图时在 prompt 前追加风格说明
  const finalPrompt = hasRefs
    ? `参考图中的画面风格和角色形象，生成同风格新场景：${prompt}`
    : prompt;

  const requestBody = {
    model: DOUBAO_IMAGE_MODEL,
    prompt: finalPrompt,
    size: '1600x2848',  // 9:16 竖屏，2K 级别
    response_format: 'url',
  };

  // 传参考图：支持数组格式
  if (hasRefs) {
    requestBody.image = validRefs.length === 1 ? validRefs[0] : validRefs;
  }

  // watermark 放在 extra_body 里
  requestBody.extra_body = { watermark: false };

  const isImgProxy = DOUBAO_IMAGE_ENDPOINT === DOUBAO_IMAGE_PROXY;
  const imgHeaders = { 'Content-Type': 'application/json' };
  if (isImgProxy) {
    imgHeaders['apikey'] = SUPABASE_ANON_KEY_IMG;
    imgHeaders['Authorization'] = `Bearer ${SUPABASE_ANON_KEY_IMG}`;
  } else {
    imgHeaders['Authorization'] = `Bearer ${DOUBAO_API_KEY}`;
  }
  const resp = await fetch(DOUBAO_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: imgHeaders,
    body: JSON.stringify(requestBody),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`[Doubao] 图片生成失败: ${resp.status} ${errText}`);
  }
  const json = await resp.json();
  const url = json?.data?.[0]?.url;
  if (!url) throw new Error('[Doubao] 图片生成：返回数据中无 url');
  return url;
}

/**
 * 统一图片生成入口
 *
 * @param {string}   prompt
 * @param {string[]} [referenceImages]  参考图 URL 数组
 * @param {string}   [modelChoice]      'agnes' | 'doubao'，默认 'doubao'
 */
export async function generateImage(prompt, referenceImages, modelChoice = 'doubao') {
  const validRefs = getValidRefs(referenceImages);

  if (modelChoice === 'doubao') {
    return generateImageDoubao(prompt, validRefs.length > 0 ? validRefs : null);
  }
  // agnes 不支持参考图，直接纯文生图
  return generateImageAgnes(prompt);
}

// ─── 4b. Seedance 2.0 视频生成 ───────────────────────────────────────────────

/**
 * 延时工具
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 使用 Seedance 2.0 API 生成视频（异步提交 + 轮询）
 *
 * 流程：
 *   1. POST 提交视频生成任务（含 prompt + 参考图 + 可选参考音频）
 *   2. 轮询 GET task 状态，直到 succeeded / failed / expired
 *   3. 返回 video_url
 *
 * @param {string}   prompt        Seedance prompt（由 buildVideoPrompt 生成）
 * @param {string[]} [refImages]   参考图 URL 数组（角色参考图）
 * @param {string}   [refAudioUrl] 参考音频 URL（可选，用于音色克隆）
 * @param {Object}   [options]     可选配置
 * @param {string}   [options.ratio]      画面比例，默认 '9:16'
 * @param {number}   [options.duration]   视频时长(秒)，默认 6
 * @param {string}   [options.resolution] 分辨率，默认 '720p'
 * @param {number}   [options.pollIntervalMs]  轮询间隔(ms)，默认 10000
 * @param {number}   [options.maxPollAttempts]  最大轮询次数，默认 90
 * @param {Function} [options.onPollStatus]    轮询状态回调 (attempt, status) => void
 * @returns {Promise<string>} video_url
 */
export async function generateVideo(prompt, refImages, refAudioUrl, options = {}) {
  const {
    ratio = '9:16',
    duration = 6,
    resolution = '720p',
    pollIntervalMs = 10000,
    maxPollAttempts = 90,
    onPollStatus = null,
    onTaskId = null,
  } = options;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SEEDANCE_API_KEY}`,
  };

  // 构建 content 数组
  const content = [
    { type: 'text', text: prompt },
  ];

  // 添加参考图
  const validRefs = getValidRefs(refImages);
  for (const refUrl of validRefs) {
    content.push({
      type: 'image_url',
      image_url: { url: refUrl },
      role: 'reference_image',
    });
  }

  // 添加参考音频（如果有）
  if (refAudioUrl) {
    content.push({
      type: 'audio_url',
      audio_url: { url: refAudioUrl },
      role: 'reference_audio',
    });
  }

  // 提交任务
  const submitBody = {
    model: SEEDANCE_MODEL,
    content,
    generate_audio: true,
    ratio,
    duration,
    resolution,
    watermark: false,
  };

  const submitResp = await fetch(SEEDANCE_BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(submitBody),
  });

  if (!submitResp.ok) {
    const errText = await submitResp.text();
    throw new Error(`[Seedance] 任务提交失败: ${submitResp.status} ${errText}`);
  }

  const submitResult = await submitResp.json();
  const taskId = submitResult?.id;

  if (submitResult?.error) {
    throw new Error(`[Seedance] 任务提交错误: ${JSON.stringify(submitResult.error)}`);
  }
  if (!taskId) {
    throw new Error('[Seedance] 任务提交：返回数据中无 task id');
  }

  // 提交成功后回调 taskId（用于持久化）
  if (typeof options.onTaskId === 'function') {
    try { options.onTaskId(taskId); } catch (_) {}
  }

  return pollVideoTask(taskId, { pollIntervalMs, maxPollAttempts, onPollStatus });
}

/**
 * 轮询 Seedance 视频任务直到完成
 *
 * @param {string} taskId            任务 ID
 * @param {Object} [options]
 * @param {number} [options.pollIntervalMs=10000]   轮询间隔(ms)
 * @param {number} [options.maxPollAttempts=90]     最大轮询次数
 * @param {Function} [options.onPollStatus]         (attempt, status) => void
 * @returns {Promise<string>} video_url
 */
export async function pollVideoTask(taskId, options = {}) {
  const {
    pollIntervalMs = 10000,
    maxPollAttempts = 90,
    onPollStatus = null,
  } = options;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SEEDANCE_API_KEY}`,
  };

  for (let i = 0; i < maxPollAttempts; i++) {
    await sleep(pollIntervalMs);

    const pollResp = await fetch(`${SEEDANCE_BASE_URL}/${taskId}`, {
      method: 'GET',
      headers,
    });

    if (!pollResp.ok) {
      console.warn(`[Seedance] 轮询请求失败: ${pollResp.status}, 继续重试...`);
      continue;
    }

    const pollResult = await pollResp.json();
    const status = pollResult?.status || 'unknown';

    if (typeof onPollStatus === 'function') {
      try { onPollStatus(i + 1, status); } catch (_) {}
    }

    if (status === 'succeeded') {
      const videoUrl = pollResult?.content?.video_url;
      if (!videoUrl) {
        throw new Error('[Seedance] 任务完成但未返回 video_url');
      }
      return videoUrl;
    }

    if (status === 'failed') {
      const failReason = JSON.stringify(pollResult?.error || pollResult);
      throw new Error(`[Seedance] 视频生成失败: ${failReason}`);
    }

    if (status === 'expired') {
      throw new Error('[Seedance] 视频生成任务过期');
    }

    // status 为 processing / queued / 其他，继续等待
  }

  throw new Error(`[Seedance] 轮询超时（${maxPollAttempts * pollIntervalMs / 1000}s），任务可能仍在运行`);
}

/**
 * 生成单段 TTS（MiMo V2.5 TTS），返回 audioUrl（base64 blob URL）
 *
 * 调用方式：POST /chat/completions
 * - messages[0].role = "user"，content 为风格指令（可选）
 * - messages[1].role = "assistant"，content 为要合成的文本
 * - audio.format = "wav"
 * - audio.voice = 预置音色 ID
 *
 * 返回：choices[0].message.audio.data（base64 编码的音频）
 */
export async function generateTTS(text, voiceName, stylePrompt, opts = {}) {
  if (!text || !text.trim()) throw new Error("TTS：文本为空");

  const useVoiceDesign = opts.useVoiceDesign === true;
  const model = useVoiceDesign ? MIMO_TTS_MODEL_VOICEDESIGN : MIMO_TTS_MODEL;
  const audioParams = useVoiceDesign
    ? { format: 'wav' }
    : { format: 'wav', voice: voiceName || MIMO_TTS_VOICE };
  const style = stylePrompt || "用温柔自然的语调朗读，语速稍快，节奏紧凑流畅，像在讲述一个引人入胜的故事。";

  const requestBody = {
    model,
    messages: [
      {
        role: "user",
        content: style
      },
      {
        role: "assistant",
        content: text.trim()
      }
    ],
    audio: audioParams
  };

  const resp = await fetch(`${MIMO_TTS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'api-key': MIMO_TTS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`[MiMo TTS] 生成失败: ${resp.status} ${errText}`);
  }

  const json = await resp.json();
  const audioBase64 = json?.choices?.[0]?.message?.audio?.data;
  if (!audioBase64) {
    throw new Error('[MiMo TTS] 返回数据中无 audio.data');
  }

  // 将 base64 音频转为 Blob URL，供浏览器播放
  const byteChars = atob(audioBase64);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([byteArray], { type: 'audio/wav' });
  const blobUrl = URL.createObjectURL(blob);
  return blobUrl;
}

// ─── 5. generateAllAssets ─────────────────────────────────────────────────────

/**
 * 遍历 gameData.nodes，为所有 slideshow/mixed 节点批量生成图片/视频和 TTS
 *
 * @param {Object}   gameData              包含 nodes 对象的故事树
 * @param {Object}   [options]
 * @param {number}   [options.concurrency=3] 并发数
 * @param {string}   [options.mode='image']  生成模式：'image'=图片+TTS / 'video'=Seedance视频 / 'asmr'=仅TTS
 * @param {boolean}  [options.skipImage=false]  跳过图片生成（image 模式下）
 * @param {boolean}  [options.skipTTS=false]    跳过 TTS 生成（image 模式下）
 * @param {string}   [options.mainCharacter]    主角描述（追加到图片/视频 prompt）
 * @param {string[]} [options.referenceImages]  参考图 URL 数组（可选，传给 generateImage）
 * @param {string}   [options.imageModel]       图片模型选择 'agnes' | 'doubao'，默认 'doubao'
 * @param {string}   [options.refAudioUrl]      Seedance 参考音频 URL（可选，video 模式下用于音色克隆）
 * @param {Function} [options.onProgress]       (current, total, nodeId, type) => void
 *
 * @returns {Promise<{ success: number, failed: number, errors: Array<{nodeId,type,message}> }>}
 */
export async function generateAllAssets(gameData, options = {}) {
  const {
    concurrency = 3,
    mode = 'image',
    skipImage = false,
    skipTTS = false,
    singleImagePerNode = false,
    mainCharacter = "",
    referenceImages = null,
    imageModel = "doubao",
    refAudioUrl = null,
    onProgress = null,
    onVideoTaskId = null,
  } = options;

  const isVideoMode = mode === 'video';
  const isAsmrMode = mode === 'asmr';

  const nodes = gameData?.nodes;
  if (!nodes || typeof nodes !== "object") {
    return { success: 0, failed: 0, errors: [{ nodeId: "root", type: "init", message: "gameData.nodes 不存在" }] };
  }

  const errors = [];
  let successCount = 0;
  let failedCount = 0;

  // 收集所有任务
  const tasks = [];
  let videoCollected = null;

  for (const [nodeId, node] of Object.entries(nodes)) {
    // 兼容旧版 slides 结构和故事树 prose/visualMeta 结构
    const nodeType = node.type || "tree";
    if (nodeType !== "slideshow" && nodeType !== "mixed" && nodeType !== "tree") continue;

    const hasSlides = Array.isArray(node.slides) && node.slides.length > 0;

    // ── 视频模式：收集所有节点数据，后续合并生成一个视频 ──
    if (isVideoMode && node.visualMeta) {
      const metaArray = Array.isArray(node.visualMeta) ? node.visualMeta : [node.visualMeta];
      if (!videoCollected) {
        videoCollected = { metaArrays: [], dialogueInfo: null, proseParts: [], firstNodeId: nodeId, firstNode: node };
      }
      videoCollected.metaArrays.push(...metaArray);
      if (!videoCollected.dialogueInfo && Array.isArray(node.dialogue) && node.dialogue.length > 0) {
        videoCollected.dialogueInfo = { speaker: node.dialogue[0].speaker, text: node.dialogue[0].text };
      }
      if (Array.isArray(node.prose) && node.prose.length > 0) {
        videoCollected.proseParts.push(...node.prose.filter(Boolean));
      }
      continue;
    }

    // ── ASMR 模式：只处理第一个节点（1张图+1段完整男声TTS）──
    if (isAsmrMode) {
      // 跳过非第一个节点（ASMR 模式只需一个节点的图片）
      // 在循环外收集所有文本，这里只处理图片
      continue;
    }

    // ── 图片任务（仅 image 模式） ──
    if (!skipImage) {
      if (hasSlides) {
        node.slides.forEach((slide, slideIdx) => {
          const meta = slide.visualMeta || (Array.isArray(node.visualMeta) ? node.visualMeta[0] : node.visualMeta) || {};
          const prompt = buildImagePrompt(meta, mainCharacter);
          tasks.push({
            nodeId,
            type: "image",
            label: `${nodeId}.slides[${slideIdx}]`,
            run: async () => {
              const url = await generateImage(prompt, referenceImages, imageModel);
              slide.imageUrl = url;
            },
          });
        });
      } else if (node.visualMeta) {
        const metaArray = Array.isArray(node.visualMeta) ? node.visualMeta : [node.visualMeta];
        if (!node.images) node.images = [];

        if (singleImagePerNode) {
          // 图文模式：每节点只生成1张主图
          const meta = metaArray[0] || {};
          const prompt = buildImagePrompt(meta, mainCharacter);
          tasks.push({
            nodeId,
            type: "image",
            label: `${nodeId}.image[0]`,
            run: async () => {
              const url = await generateImage(prompt, referenceImages, imageModel);
              node.images[0] = url;
              node.imageUrl = url;
            },
          });
        } else {
          // 多镜头分镜
          metaArray.forEach((meta, metaIdx) => {
            const prompt = buildImagePrompt(meta, mainCharacter);
            tasks.push({
              nodeId,
              type: "image",
              label: `${nodeId}.image[${metaIdx}]`,
              run: async () => {
                const url = await generateImage(prompt, referenceImages, imageModel);
                node.images[metaIdx] = url;
                if (metaIdx === 0) node.imageUrl = url;
              },
            });
          });
        }
      }
    }

    // ── TTS 任务（仅 image 模式；视频模式由 Seedance 自带音频）──
    if (!skipTTS && !isVideoMode) {
      let narrationText = "";

      if (hasSlides) {
        narrationText = (node.slides || [])
          .map((s) => s.subtitle || s.ttsText || "")
          .filter(Boolean)
          .join("　");
      } else if (Array.isArray(node.prose) && node.prose.length > 0) {
        narrationText = node.prose
          .filter(Boolean)
          .map((p) => p.replace(/。$/, ""))
          .join("。");
        if (narrationText) narrationText += "。";
      }

      if (narrationText.trim()) {
        const voiceName = MIMO_TTS_VOICE;

        tasks.push({
          nodeId,
          type: "tts",
          label: `${nodeId}.audio`,
          run: async () => {
            const url = await generateTTS(narrationText, voiceName);
            if (!node.audio) node.audio = {};
            node.audio.ttsUrl = url;
            node.audio.voice = voiceName;
          },
        });
      }
    }
  }

  // ── ASMR 模式：在循环外统一处理 ──
  if (isAsmrMode) {
    // 1. 找到第一个有 visualMeta 的节点，为其生成1张图片
    const firstVisualEntry = Object.entries(nodes).find(([, n]) => n.visualMeta);
    if (firstVisualEntry) {
      const [asmrNodeId, asmrNode] = firstVisualEntry;
      const metaArray = Array.isArray(asmrNode.visualMeta) ? asmrNode.visualMeta : [asmrNode.visualMeta];
      const meta = metaArray[0] || {};
      const sceneHint = [meta.scene, meta.mood, meta.lighting].filter(Boolean).join('，');
      const asmrImagePrompt = `写实风数字绘画质感，光影柔和偏暖，背景模糊暖棕色调自然光晕，皮肤冷白瓷质光泽，柔焦散景电影感景深，半写实二次元2.5D质感。人物严格参照图2立绘——银灰色蓬松碎短发自然微卷凌乱，深棕色细框方形眼镜微带反光，狭长眼型眼尾微挑深色瞳孔眼神慵懒，高挺鼻梁，薄唇唇色偏淡，左下唇细小伤痕，左耳黑色耳钉，下颌线锐利，身形高挑修长。宽松深色T恤露出锁骨，灰色运动短裤，赤脚踩在宿舍床上。竖屏9:16近景特写，宿舍单人床，暖黄床头灯侧光，被褥微皱柔软，半躺靠枕头，一手搭膝盖，另一手摘下眼镜搁床头，微低头侧脸看镜头，表情温柔松弛带困意。${sceneHint ? `场景补充：${sceneHint}。` : ''}高细节，电影质感，无水印`;
      if (!asmrNode.images) asmrNode.images = [];

      tasks.push({
        nodeId: asmrNodeId,
        type: "image",
        label: `${asmrNodeId}.asmr-image`,
        description: '正在生成封面图…',
        estimatedMs: 12000,
        run: async () => {
          const url = await generateImage(asmrImagePrompt, referenceImages, imageModel);
          asmrNode.images[0] = url;
          asmrNode.imageUrl = url;
        },
      });
    }

    // 2. 收集所有节点的 prose + dialogue，合并成一段完整的 ASMR 独白文本
    const allTextParts = [];
    for (const [, n] of Object.entries(nodes)) {
      // 旁白部分
      if (Array.isArray(n.prose) && n.prose.length > 0) {
        const proseText = n.prose.filter(Boolean).join("。");
        if (proseText) allTextParts.push('[气声]' + proseText);
      }
      // 对话部分（融入叙事）
      if (Array.isArray(n.dialogue) && n.dialogue.length > 0) {
        n.dialogue.forEach((d) => {
          if (d.text) allTextParts.push(d.text);
        });
      }
    }

    const fullAsmrText = allTextParts.filter(Boolean).join('[呼吸]');
    const taggedAsmrText = '(慵懒 磁性)' + fullAsmrText;
    if (fullAsmrText.trim()) {
      // 将 TTS 结果存到第一个有 visualMeta 的节点上
      const targetEntry = firstVisualEntry || Object.entries(nodes)[0];
      if (targetEntry) {
        const [ttsNodeId, ttsNode] = targetEntry;
        tasks.push({
          nodeId: ttsNodeId,
          type: "tts",
          label: `${ttsNodeId}.asmr-audio`,
          description: '正在合成 ASMR 语音…',
          estimatedMs: 15000,
          run: async () => {
            const asmrVoiceDesign = `Young male, early 20s, extreme close-up with a binaural, ear-to-ear ASMR feel. Deep, magnetic baritone with a naturally husky, breathy quality — like warm whiskey poured over velvet. He speaks very slowly, almost lazily, each word lingering on his lips before being released in a soft exhale. Audible breathing between phrases, subtle lip sounds, and occasional gentle sighs. The voice sits impossibly close, as if his mouth is right beside the listener's ear. Intimate, seductive, yet tender — the voice of someone who could break your heart with a whisper but chooses to hold you instead.`;
            const url = await generateTTS(taggedAsmrText, null, asmrVoiceDesign, { useVoiceDesign: true });
            if (!ttsNode.audio) ttsNode.audio = {};
            ttsNode.audio.ttsUrl = url;
            ttsNode.audio.voice = 'voicedesign-asmr-male';
          },
        });
      }
    }
  }

  // ── 视频模式：合并所有节点数据，创建单个视频 task ──
  if (isVideoMode && videoCollected) {
    const { metaArrays, dialogueInfo, proseParts, firstNodeId, firstNode } = videoCollected;
    const mergedProse = proseParts.join('。');
    const videoPrompt = buildVideoPrompt(metaArrays, mainCharacter, dialogueInfo, mergedProse);
    const seedanceRefs = [
      SEEDANCE_REF_SHENYANXI,
      SEEDANCE_REF_SUMIAN,
      SEEDANCE_REF_SHENYANXI2,
    ];
    tasks.push({
      nodeId: firstNodeId,
      type: 'video',
      label: `${firstNodeId}.video-merged`,
      description: '正在生成视频…',
      estimatedMs: 180000,
      run: async () => {
        const videoUrl = await generateVideo(videoPrompt, seedanceRefs, SEEDANCE_REF_AUDIO, {
          ratio: '9:16',
          duration: 6,
          resolution: '720p',
          pollIntervalMs: 10000,
          maxPollAttempts: 120,
          onTaskId: (tid) => {
            if (typeof onVideoTaskId === 'function') {
              try { onVideoTaskId(tid); } catch (_) {}
            }
          },
          onPollStatus: (attempt, status) => {
            const statusMap = {
              queued: '排队中',
              processing: '生成中',
              running: '生成中',
              submitted: '已提交',
            };
            const statusText = statusMap[status] || status;
            const elapsedS = attempt * 10;
            mergedTask.description = `视频：${statusText}（已等待 ${elapsedS}s）`;
            if (typeof onProgress === 'function') {
              try {
                onProgress(0, tasks.length, firstNodeId, 'video', {
                  phase: 'polling',
                  description: mergedTask.description,
                  estimatedMs: 180000,
                  totalEstimatedMs: tasks.reduce((s, t) => s + (t.estimatedMs || 8000), 0),
                  elapsedMs: elapsedS * 1000,
                });
              } catch (_) {}
            }
          },
        });
        if (!firstNode.video) firstNode.video = {};
        firstNode.video.url = videoUrl;
        firstNode.video.prompt = videoPrompt;
        firstNode.videoUrl = videoUrl;
      },
    });
    const mergedTask = tasks[tasks.length - 1];
  }

  const total = tasks.length;
  const totalEstimatedMs = tasks.reduce((sum, t) => sum + (t.estimatedMs || 8000), 0);
  let current = 0;
  let elapsedMs = 0;

  // 包装每个任务，加入进度回调和错误捕获
  const wrappedTasks = tasks.map((task) => async () => {
    const startTime = Date.now();
    if (typeof onProgress === "function") {
      try {
        onProgress(current, total, task.nodeId, task.type, {
          phase: 'start',
          description: task.description || '正在处理...',
          estimatedMs: task.estimatedMs || 8000,
          totalEstimatedMs,
          elapsedMs,
        });
      } catch (_) {}
    }
    try {
      await task.run();
      successCount++;
    } catch (err) {
      failedCount++;
      const errMsg = err?.message || String(err);
      errors.push({ nodeId: task.nodeId, type: task.type, message: errMsg });
      const node = nodes[task.nodeId];
      if (node) {
        if (!node.errors) node.errors = [];
        node.errors.push({ type: task.type, message: errMsg });
      }
    } finally {
      const taskDuration = Date.now() - startTime;
      elapsedMs += taskDuration;
      current++;
      if (typeof onProgress === "function") {
        try {
          onProgress(current, total, task.nodeId, task.type, {
            phase: 'done',
            description: task.description,
            estimatedMs: task.estimatedMs || 8000,
            actualMs: taskDuration,
            totalEstimatedMs,
            elapsedMs,
          });
        } catch (_) {}
      }
    }
  });

  // 视频模式并发数降低（Seedance API 有速率限制）
  const effectiveConcurrency = isVideoMode ? Math.min(concurrency, 2) : concurrency;
  await runWithConcurrency(wrappedTasks, effectiveConcurrency);

  return { success: successCount, failed: failedCount, errors };
}

export default {
  generateAllAssets,
  buildImagePrompt,
  buildVideoPrompt,
  generateVideo,
  VOICE_MAP,
  IMAGE_MODELS,
};
