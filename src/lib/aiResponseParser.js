/**
 * AI 响应解析工具模块
 *
 * 根本性解决 AI 幻觉导致解析出乱码的问题：
 * 1. 结构化约束 prompt —— 从源头减少 AI 输出混乱的可能
 * 2. 分层解析 pipeline —— 预处理 → 结构分割 → 字段提取 → 清洗 → 校验
 * 3. 乱码检测与自动重试 —— 发现异常输出时主动丢弃并重试
 * 4. 终极清理 stripAllMarkers —— 最后一道防线，扫除一切特殊标记残留
 */

// ═══════════════════════════════════════════════════════════════════════════════
// §1  乱码检测
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 检测文本是否包含乱码特征
 * 返回 { isGarbled: boolean, score: number, reasons: string[] }
 */
export function detectGarbledText(text) {
  if (!text || typeof text !== "string") return { isGarbled: true, score: 1, reasons: ["空内容"] };

  const reasons = [];
  let score = 0;

  const garbledPattern = /[\u0000-\u001F\u007F-\u009F]{3,}/g;
  if (garbledPattern.test(text)) {
    reasons.push("包含连续控制字符");
    score += 0.8;
  }

  const invisibleChars = (text.match(/[\u200B-\u200F\u2028-\u202F\uFEFF\uFFFD]/g) || []).length;
  if (invisibleChars > 5) {
    reasons.push(`包含 ${invisibleChars} 个不可见Unicode字符`);
    score += 0.5;
  }

  const repeatPattern = /(.)\1{10,}/g;
  if (repeatPattern.test(text)) {
    reasons.push("存在异常字符重复");
    score += 0.4;
  }

  if (/Ã[€‚ƒ„…†‡ˆ‰Š‹ŒŽ''""•–—˜™š›œžŸ]/.test(text)) {
    reasons.push("包含混合编码特征");
    score += 0.9;
  }

  const unexpectedChars = (text.match(/[\u0E00-\u0E7F\u10A0-\u10FF\u0600-\u06FF\uAC00-\uD7AF]/g) || []).length;
  if (unexpectedChars > 3) {
    reasons.push(`包含 ${unexpectedChars} 个非预期语系字符`);
    score += 0.6;
  }

  const totalLen = text.length;
  if (totalLen > 0) {
    const nonContentLen = (text.match(/[\s\u00A0\u3000]/g) || []).length;
    const ratio = nonContentLen / totalLen;
    if (ratio > 0.6 && totalLen > 50) {
      reasons.push(`空白字符占比过高 (${(ratio * 100).toFixed(0)}%)`);
      score += 0.5;
    }
  }

  return { isGarbled: score >= 0.5, score, reasons };
}

// ═══════════════════════════════════════════════════════════════════════════════
// §2  终极清理（最关键的一道防线）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 终极清理：移除文本中所有 AI 结构标记、特殊符号、分隔符残留
 *
 * 这是用户看到文本前的最后一道防线。
 * 不管 AI 产生什么幻觉、不管前面的解析漏掉了什么标记，
 * 只要走到这里，所有不属于正常小说对话/旁白内容的东西都会被干掉。
 *
 * 清理范围：
 * - 结构标签：[PROSE][/PROSE] [DIALOGUE][/DIALOGUE] [CHOICES][/CHOICES] [INPUT_HINT][/INPUT_HINT]
 * - 元数据标签：===VISUAL_META=== ===/VISUAL_META=== [VISUAL_META][/VISUAL_META] 【VISUAL_META】【/VISUAL_META】
 * - 元数据字段行：scene_mood: / location: / lighting: / key_action: / emotion_tag:
 * - 分隔符碎片：=== <<< >>> <<<< >>>> 以及任何 2+ 连续的 = < >
 * - Markdown 残留：``` ```json ** __ ##
 * - 不完整标签：[/PROS [/DIALOG [/CHOIC 等截断标签
 * - AI 说明前缀：以下是： 注意： 提示： 说明： 备注：
 */
function stripAllMarkers(text) {
  if (!text || typeof text !== "string") return "";

  let s = text;

  // 1. 移除完整的结构标签（英文方括号 + 全角方括号，含可能的多余空格）
  s = s.replace(/\[\/?\s*(PROSE|DIALOGUE|CHOICES|INPUT_HINT|VISUAL_META)\s*\]/gi, "");
  s = s.replace(/【\/?\s*(PROSE|DIALOGUE|CHOICES|INPUT_HINT|VISUAL_META)\s*】/gi, "");

  // 2. 移除 ===...=== 格式的分隔标记（完整标记 + 碎片）
  s = s.replace(/===\/?\s*VISUAL_META\s*===/gi, "");
  s = s.replace(/=={2,}/g, ""); // 任何 2+ 连续 = 号

  // 3. 移除 <<< >>> 系列分隔符碎片
  s = s.replace(/<{2,}>?/g, "");
  s = s.replace(/>{2,}/g, "");

  // 4. 移除裸元数据字段行
  s = s.replace(/^(scene_mood|location|lighting|key_action|emotion_tag)\s*[：:].*$/gim, "");

  // 5. 移除不完整/截断的标签
  s = s.replace(/\[\/?\s*(PROS|DIALOG|CHOIC|INPUT|VISUAL)[^\]]{0,30}\]?/gi, "");
  s = s.replace(/【\/?\s*(PROS|DIALOG|CHOIC|INPUT|VISUAL)[^】]{0,30}】?/gi, "");

  // 6. 移除 AI 常见说明前缀
  s = s.replace(/^(以下是|注意[:：]|提示[:：]|说明[:：]|备注[:：]|好的[，,]|当然[，,]|没问题[，,]).*$/gmi, "");

  // 7. 清理 markdown 残留
  s = s.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");
  s = s.replace(/^[#*_]{2,}\s*/gm, "");

  // 8. 清理多余空行 + 首尾空白
  s = s.replace(/\n{2,}/g, "\n").trim();

  return s;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §3  通用预处理
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 预处理 AI 原始输出，统一清理常见噪音
 */
export function preprocessAIOutput(raw) {
  if (!raw || typeof raw !== "string") return "";
  let text = raw;

  // 1. 清理 markdown 代码块包裹
  text = text.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");

  // 2. 清理 HTML 标签
  text = text.replace(/<[^>]+>/g, "");

  // 3. 清理常见的 AI 说明文字前缀
  text = text.replace(/^(以下是|注意[:：]|提示[:：]|说明[:：]|备注[:：]|好的[，,]|当然[，,]|没问题[，,]).*$/gmi, "");

  // 4. 清理多余空行
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §4  VISUAL_META 提取（Chat.jsx 使用）
// ═══════════════════════════════════════════════════════════════════════════════

const META_KEYS = ["scene_mood", "location", "lighting", "key_action", "emotion_tag"];

/**
 * 从文本中提取 VISUAL_META 数据
 * 返回 { meta: object|null, cleanedText: string }
 */
export function extractVisualMeta(text) {
  let cleanedText = text;
  let meta = null;

  // 辅助函数：从元数据文本中解析字段
  const parseMetaFromText = (metaText) => {
    const trimmed = metaText.trim();
    const parseField = (key) => {
      const m = trimmed.match(new RegExp(`${key}[：:]\\s*(.+)`));
      return m ? m[1].trim() : "";
    };
    const result = {};
    for (const key of META_KEYS) {
      result[key] = parseField(key);
    }
    result.round = Date.now();
    return result;
  };

  // 尝试匹配所有已知格式，优先级：=== > 【】 > []
  const blockMatch =
    text.match(/===VISUAL_META===([\s\S]*?)===\/VISUAL_META===/i) ||
    text.match(/【VISUAL_META】([\s\S]*?)【\/VISUAL_META】/) ||
    text.match(/\[VISUAL_META\]([\s\S]*?)\[\/VISUAL_META\]/i);

  if (blockMatch) {
    meta = parseMetaFromText(blockMatch[1]);
  }

  // 无论是否匹配到完整块，都从文本中移除所有 VISUAL_META 相关内容
  cleanedText = cleanedText
    .replace(/===VISUAL_META===[\s\S]*?===\/VISUAL_META===/gi, "")
    .replace(/【VISUAL_META】[\s\S]*?【\/VISUAL_META】/g, "")
    .replace(/\[VISUAL_META\][\s\S]*?\[\/VISUAL_META\]/gi, "");

  // 移除裸输出的元数据字段（AI 有时不加标签直接拼在内容后）
  cleanedText = cleanedText
    .replace(
      /(scene_mood|location|lighting|key_action|emotion_tag)[：:][^\n]*((\n|)(scene_mood|location|lighting|key_action|emotion_tag)[：:][^\n]*)*/gi,
      ""
    )
    .trim();

  // 清理残留的 【...】 格式标注（VISUAL_META 相关的全角方括号标注）
  cleanedText = cleanedText.replace(/【[^】]*】/g, "");

  // 注意：这里不能调用 stripAllMarkers！
  // stripAllMarkers 会移除 [PROSE]/[CHOICES] 等结构标签，
  // 而 parseStoryMode 还需要这些标签来提取内容。
  // stripAllMarkers 只在最终的 cleanDialogue/cleanProse/cleanChoices 中使用。

  // 只清理 VISUAL_META 分隔符碎片（=== <<< >>> 等）
  cleanedText = cleanedText
    .replace(/=={2,}/g, "")
    .replace(/<{2,}>?/g, "")
    .replace(/>{2,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { meta, cleanedText };
}

// ═══════════════════════════════════════════════════════════════════════════════
// §5  剧情模式解析（Chat.jsx 剧情分支使用）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 解析剧情模式 AI 输出
 * 输入：预处理后的文本（已提取 VISUAL_META）
 * 输出：{ prose: string[], dialogue: string|null, choices: string[], inputHint: string|null }
 */
export function parseStoryMode(raw) {
  let text = raw;

  // ── 标签粘连修复 ──
  text = text
    .replace(/\[\/PROSE\]\[/g, "[/PROSE] [")
    .replace(/\[\/DIALOGUE\]\[/g, "[/DIALOGUE] [")
    .replace(/\[\/CHOICES\]\[/g, "[/CHOICES] [")
    .replace(/\[\/INPUT_HINT\]\[/g, "[/INPUT_HINT] [");

  // ── 清理残留的不完整标签（末尾截断的标签） ──
  text = text.replace(/\[\/?(PROS|DIALOG|CHOIC|INPUT)[^\]]{0,20}$/gi, "").trim();

  // ── 多模式正则匹配 ──
  const prosePatterns = [
    /\[PROSE\]([\s\S]*?)\[\/PROSE\]/i,
    /【PROSE】([\s\S]*?)【\/PROSE】/i,
    /PROSE[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
    /场景描写[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
  ];

  const dialoguePatterns = [
    /\[DIALOGUE\]([\s\S]*?)\[\/DIALOGUE\]/i,
    /【DIALOGUE】([\s\S]*?)【\/DIALOGUE】/i,
    /\[DIALOGUE\]([^\[]*)/i,
    /DIALOGUE[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
    /对话[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
  ];

  const choicesPatterns = [
    /\[CHOICES\]([\s\S]*?)\[\/CHOICES\]/i,
    /【CHOICES】([\s\S]*?)【\/CHOICES】/i,
    /\[CHOICES\]([^\[]*)/i,
    /CHOICES[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
    /选项[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
  ];

  const inputHintPatterns = [
    /\[INPUT_HINT\]([\s\S]*?)\[\/INPUT_HINT\]/i,
    /【INPUT_HINT】([\s\S]*?)【\/INPUT_HINT】/i,
    /INPUT_HINT[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
    /输入提示[:：]([\s\S]*?)(?=\[|\n\n|$)/i,
  ];

  const tryMatch = (patterns, t) => {
    for (const pattern of patterns) {
      const match = t.match(pattern);
      if (match && match[1]?.trim()) return match[1].trim();
    }
    return null;
  };

  let proseContent = tryMatch(prosePatterns, text);
  let dialogueContent = tryMatch(dialoguePatterns, text);
  let choicesContent = tryMatch(choicesPatterns, text);
  let inputHintContent = tryMatch(inputHintPatterns, text);

  // ── 降级处理：标签不完整时按标签分割 ──
  if (!proseContent && !dialogueContent && !choicesContent) {
    const hasProseStart = text.includes("[PROSE]") || text.includes("【PROSE】");
    const hasDialogueStart = text.includes("[DIALOGUE]") || text.includes("【DIALOGUE】");

    if (hasProseStart || hasDialogueStart) {
      const parts = text.split(/\[(PROSE|DIALOGUE|CHOICES)[\]】]|\[(\/PROSE|\/DIALOGUE|\/CHOICES)[\]】]/gi);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]?.toUpperCase();
        if (part === "PROSE" && parts[i + 1]) proseContent = parts[i + 1].trim();
        else if (part === "DIALOGUE" && parts[i + 1]) dialogueContent = parts[i + 1].trim();
        else if (part === "CHOICES" && parts[i + 1]) choicesContent = parts[i + 1].trim();
      }
    }

    // ── 降级处理：按段落智能分割 ──
    if (!proseContent && !dialogueContent) {
      const paragraphs = text.split(/\n\n+/).filter((s) => s.trim().length > 5);

      if (paragraphs.length >= 2) {
        const lastPara = paragraphs[paragraphs.length - 1];
        const isLikelyDialogue =
          lastPara.length < 100 &&
          (/["""'].+["""']/.test(lastPara) || lastPara.includes("：") || lastPara.includes(":"));

        if (isLikelyDialogue) {
          dialogueContent = lastPara.replace(/["""']/g, "").trim();
          proseContent = paragraphs.slice(0, -1).join("\n\n");
        } else {
          proseContent = paragraphs.join("\n\n");
        }
      } else if (paragraphs.length === 1) {
        const single = paragraphs[0];
        if (single.length < 80 || single.includes("：") || /^["""']/.test(single)) {
          dialogueContent = single.replace(/["""']/g, "").trim();
        } else {
          proseContent = single;
        }
      }
    }
  }

  // ── 清洗（内部会调用 stripAllMarkers 做终极清理） ──
  const prose = cleanProse(proseContent);
  const dialogue = cleanDialogue(dialogueContent);
  const choices = cleanChoices(choicesContent);
  const inputHint = inputHintContent ? stripAllMarkers(inputHintContent).slice(0, 30) : null;

  return { prose, dialogue, choices, inputHint };
}

// ═══════════════════════════════════════════════════════════════════════════════
// §6  对话模式解析（Chat.jsx 对话分支使用）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 解析对话模式 AI 输出
 * 输入：预处理后的文本（已提取 VISUAL_META）
 * 输出：{ dialogue: string }
 */
export function parseChatMode(raw) {
  let text = raw;

  // 粗粒度截断 VISUAL_META 块（终极清理由 cleanDialogue → stripAllMarkers 完成）
  text = text
    .replace(/===VISUAL_META===[\s\S]*?===\/VISUAL_META===/gi, "")
    .replace(/\[VISUAL_META\][\s\S]*?(\[\/VISUAL_META\]|$)/gi, "")
    .replace(/(scene_mood|location|lighting|key_action|emotion_tag)[：:][\s\S]*/gi, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const dialogue = cleanDialogue(text) || text.slice(0, 200).trim() || "……";
  return { dialogue };
}

// ═══════════════════════════════════════════════════════════════════════════════
// §7  JSON 解析（VideoCreate.jsx 使用）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 健壮地解析 AI 输出的 JSON 数组
 * 多层修复策略：中文引号 → 单引号 → 换行 → 尾逗号 → 截断修复
 */
export function parseAIJsonArray(rawContent) {
  if (!rawContent || typeof rawContent !== "string") {
    return { success: false, data: null, error: "空内容" };
  }

  const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return { success: false, data: null, error: "未找到JSON数组" };
  }

  let jsonStr = jsonMatch[0];

  // 中文引号 → 英文双引号
  jsonStr = jsonStr.replace(/[\u201c\u201d\u300c\u300d\u2018\u2019]/g, '"');

  // 单引号字符串值 → 双引号
  jsonStr = jsonStr.replace(/:\s*'([^']*)'/g, ': "$1"');

  // 字符串值内部的换行替换为空格
  jsonStr = jsonStr.replace(/"((?:[^"\\]|\\.)*)"/g, (match) =>
    match.replace(/\n/g, " ").replace(/\r/g, "")
  );

  // 移除尾逗号
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { success: false, data: null, error: "解析结果非数组或为空" };
    }
    return { success: true, data: parsed, error: null };
  } catch (e) {
    try {
      let aggressive = jsonStr.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      aggressive = fixUnclosedStrings(aggressive);
      aggressive = fixUnclosedBrackets(aggressive);

      const parsed = JSON.parse(aggressive);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { success: false, data: null, error: "修复后解析结果非数组或为空" };
      }
      return { success: true, data: parsed, error: null };
    } catch (e2) {
      return { success: false, data: null, error: `JSON解析失败: ${e2.message}` };
    }
  }
}

function fixUnclosedStrings(str) {
  let inString = false;
  let lastValidEnd = -1;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"' && (i === 0 || str[i - 1] !== '\\')) {
      inString = !inString;
      if (!inString) lastValidEnd = i;
    }
  }
  if (inString && lastValidEnd >= 0) {
    return fixUnclosedBrackets(str.substring(0, lastValidEnd + 1));
  }
  return str;
}

function fixUnclosedBrackets(str) {
  const stack = [];
  let inStr = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"' && (i === 0 || str[i - 1] !== '\\')) {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (str[i] === '[' || str[i] === '{') stack.push(str[i]);
    else if (str[i] === ']') { if (stack.length && stack[stack.length - 1] === '[') stack.pop(); }
    else if (str[i] === '}') { if (stack.length && stack[stack.length - 1] === '{') stack.pop(); }
  }
  while (stack.length) {
    const top = stack.pop();
    str += top === '[' ? ']' : '}';
  }
  return str;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §8  清洗辅助函数（每个都调用 stripAllMarkers 做终极清理）
// ═══════════════════════════════════════════════════════════════════════════════

function cleanDialogue(text) {
  if (!text) return null;
  // 终极清理所有特殊标记 → 清理引号
  let cleaned = stripAllMarkers(text);
  cleaned = cleaned.replace(/^[\s"""'「『]+|[\s"""'」』]+$/g, "").trim();
  return cleaned || null;
}

function cleanProse(text) {
  if (!text) return [];
  let cleaned = stripAllMarkers(text);
  cleaned = cleaned
    .replace(/\n+/g, "|")
    .replace(/\d+[.、]\s*/g, "|")
    .replace(/\|+/g, "|")
    .replace(/第[一二三四五12345]段[:：]?/g, "|");
  return cleaned
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function cleanChoices(text) {
  if (!text) return [];
  let cleaned = stripAllMarkers(text);
  return cleaned
    .replace(/\n+/g, "|")
    .replace(/\d+[.、]\s*/g, "|")
    .replace(/\|+/g, "|")
    .split("|")
    .map((s) =>
      s
        .trim()
        .replace(/^[\s"""''「『【\[]+|[\s"""''」』】\]]+$/g, "")
        .trim()
    )
    .filter((s) => s.length > 0 && s.length < 80)
    .slice(0, 3)
    .map((label) => {
      // 解析并清理选项末尾的 {+N} 分值标注
      const m = label.match(/\s*\{([+-]?\d+)\}\s*$/);
      return {
        label: label.replace(/\s*\{[+-]?\d+\}\s*$/, ''),
        intimacyGain: m ? parseInt(m[1], 10) : 0,
      };
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// §9  优化后的 Prompt 模板
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 生成剧情模式 prompt（强化格式约束，减少幻觉）
 */
export function buildStoryModePrompt({ epSummary, branchContext, currentSceneProse, currentSceneDialogue, userText, episodeProgress, dramaConfig, interactionMemories = [], isFirstEntry = true, offlineMinutes = 0, intimacy = 0, intimacyLevel = 1 }) {
  // --- Helper: build offline re-entry instruction ---
  function _offlineInstruction(mins, lvl, locale) {
    if (mins < 60) return '';
    if (locale === 'en') {
      if (lvl >= 5) return `\n\n## Re-entry Instruction\nIt has been ${Math.round(mins / 60)} hours since last interaction. ${dramaConfig.mainCharacter.name} physically comes to find ${dramaConfig.protagonist} to resume contact. Write the opening as him appearing in person.\n`;
      if (lvl >= 3) return `\n\n## Re-entry Instruction\nIt has been ${Math.round(mins / 60)} hours since last interaction. ${dramaConfig.mainCharacter.name} calls ${dramaConfig.protagonist} on the phone. Write the opening as a phone-call scene.\n`;
      return `\n\n## Re-entry Instruction\nIt has been ${Math.round(mins / 60)} hours since last interaction. ${dramaConfig.mainCharacter.name} sends ${dramaConfig.protagonist} a message to re-initiate contact. Write the opening as him texting.\n`;
    }
    if (lvl >= 5) return `\n\n## 离线回归指令\n距上次互动已过去${Math.round(mins / 60)}小时。沈彦希直接来找苏眠，以主动出现在她面前的方式开场。\n`;
    if (lvl >= 3) return `\n\n## 离线回归指令\n距上次互动已过去${Math.round(mins / 60)}小时。沈彦希给苏眠打电话，以电话场景开场。\n`;
    return `\n\n## 离线回归指令\n距上次互动已过去${Math.round(mins / 60)}小时。沈彦希给苏眠发了条消息，以发消息的方式主动开场。\n`;
  }

  // --- Helper: build context block ---
  function _contextBlock(locale) {
    if (isFirstEntry) {
      // First entry — use episode summary + scene context
      if (locale === 'en') {
        return `## Current Episode Progress (Episode ${episodeProgress})
${epSummary}
${branchContext ? branchContext : ''}
## Current Scene Context
${currentSceneProse} ${currentSceneDialogue}`;
      }
      return `## 当前剧情进度（第${episodeProgress}集）
${epSummary}
${branchContext ? branchContext : ''}
## 当前场景上下文
${currentSceneProse} ${currentSceneDialogue}`;
    }
    // Returning user — use interaction memories ONLY (no epSummary)
    const memList = interactionMemories.map((m, i) => `${i + 1}. ${m}`).join('\n');
    if (locale === 'en') {
      let block = `## Interaction Memories (what has happened so far)\n${memList}\n`;
      if (branchContext) block += `\n## Current Branch\n${branchContext}\n`;
      block += _offlineInstruction(offlineMinutes, intimacyLevel, 'en');
      if (offlineMinutes < 60) {
        block += `\n## Scene Continuation\nContinue directly from the last interaction memory above.\n`;
      }
      return block;
    }
    let block = `## 互动记忆（已发生的事件）\n${memList}\n`;
    if (branchContext) block += `\n## 当前支线\n${branchContext}\n`;
    block += _offlineInstruction(offlineMinutes, intimacyLevel, 'zh');
    if (offlineMinutes < 60) {
      block += `\n## 场景接续\n直接接续上一条互动记忆的场景。\n`;
    }
    return block;
  }

  // --- Helper: intimacy context ---
  function _intimacyBlock(locale) {
    if (locale === 'en') {
      return `\n## Intimacy Status\nCurrent intimacy: ${intimacy}/100 (Level ${intimacyLevel}/8)\nAdjust ${dramaConfig.mainCharacter.name}'s warmth and openness accordingly — low intimacy means more guarded and teasing, high intimacy means more protective and tender.\n`;
    }
    return `\n## 亲密度状态\n当前亲密度：${intimacy}/100（等级 ${intimacyLevel}/8）\n根据亲密度调整沈彦希的态度热度——亲密度低时更加警惕戏谑，亲密度高时更加保护温柔。\n`;
  }

  if (dramaConfig?.locale === "en") {
    return `You are an immersive epic-romantic-fantasy author writing the next scene for the interactive drama "${dramaConfig.title}".

## Character Profiles
- ${dramaConfig.mainCharacter.name}: ${dramaConfig.mainCharacter.description}
- ${dramaConfig.protagonist} (played by the user): A young noblewoman with latent healing magic, drawn into a dangerous political world.

## Story Setting
${dramaConfig.setting}
${_intimacyBlock('en')}
${_contextBlock('en')}

${dramaConfig.protagonist} did/said: "${userText}"

## Writing Requirements
Write the next scene in ${dramaConfig.wordCount} of prose, split into 4-5 natural paragraphs. Requirements:
- Epic romantic fantasy prose style with rich sensory details (scent, temperature, sound, light, texture)
- ${dramaConfig.mainCharacter.name} speaks in short, commanding sentences with underlying tenderness
- Maintain dangerous passion tension and power dynamics throughout
- ${dramaConfig.tone}
- Do NOT describe the user's actions or dialogue — ${dramaConfig.protagonist}'s words and actions are chosen by the user
- Only reference events from the interaction memories above; do not introduce plot events the user has not experienced
- Provide exactly 3 clearly differentiated choices, each logically connected to the current scene and what just happened
- ALL OUTPUT MUST BE IN ENGLISH
- Scene pacing: After the character makes an invitation or proposal, STOP and wait for the user's choice — do not advance to the next scene in the same turn
- Scene continuity: If characters are face-to-face, keep the conversation in person — do not switch to phone/text without a scene transition
- Never acknowledge being an AI or break the fourth wall
- Do not use meta-narrative language like "Episode X" or "Chapter X" in the prose
- If the character has been in a negative mood (cold/angry/rejecting) for 3 consecutive turns, introduce a softening or turning point
- Keep content PG-13
- Do not display intimacy scores or level numbers in the story text

## Output Format (strictly follow this format, output nothing else)

[PROSE]paragraph1|paragraph2|paragraph3|paragraph4|paragraph5[/PROSE][DIALOGUE]${dramaConfig.mainCharacter.name}'s one line of dialogue, short and intense, in character[/DIALOGUE][CHOICES]Option that deepens the bond{+score}|Option that creates conflict or tension{+score}|Option that maintains distance or retreats{+score}[/CHOICES][INPUT_HINT]A prompt for ${dramaConfig.protagonist}, e.g.: What do you say to him?[/INPUT_HINT]

===VISUAL_META===
scene_mood: 2-4 English words describing the scene atmosphere
location: Scene location
lighting: Lighting description
key_action: Core action this round (under 10 words)
emotion_tag: Male lead's emotion tag
===/VISUAL_META===

## Critical Rules
- Must use [PROSE]...[/PROSE] etc. square-bracket tags to wrap each section
- Paragraphs in PROSE separated by | not newlines
- No quotation marks inside DIALOGUE
- 3 choices in CHOICES separated by | without numbering
- Choices must have clear differentiation and stem from the current scene context
- Visual metadata must be between ===VISUAL_META=== and ===/VISUAL_META===
- Output ONLY the formatted content above, no explanations or notes
- Each choice must end with {+N} intimacy score: 0=normal progression, +2~4=emotional touch, +5~8=key breakthrough, -2~5=misstep
- Most normal interactions score 0 — only key emotional moments change intimacy
- Bold/defiant/challenging options should score higher for this character (he respects boldness)
- ALL text must be in English`;
  }
  return `你是一位沉浸式言情小说作者，正在为互动短剧《心动禁区》续写剧情。

## 角色设定
- 沈彦希：沈氏财阀私生子，篮球队学长，银灰色蓬松头发，金框眼镜，嘴角常有血迹，身材最高挑。外表慵懒冷漠，实则城府极深。和苏眠同住一个宿舍，早已察觉苏眠女扮男装，对她有深藏的好感，总用行动和话里有话来表达，从不直说，喜欢用"把柄"来靠近她。
- 郗辰：晨星财团唯一继承人，黑色中长发，常戴黑色棒球帽，银色耳环和项链，五官深邃。有严重肢体接触障碍症，但对苏眠是例外，已确认自己不在乎苏眠性别，暗中保护她。
- 苏眠（用户扮演）：女扮男装的普通女大学生，黑色短发，五官精致偏中性，金色小耳环，代替双胞胎哥哥入读贵族学院，与沈彦希和郗辰同住一个宿舍。
${_intimacyBlock('zh')}
${_contextBlock('zh')}

苏眠做了/说了："${userText}"

## 写作要求
请续写下一个场景，约500字剧情旁白，分4-5个自然段。要求：
- 充分描绘环境氛围、人物动作、内心独白、感官细节（气味/触感/声音/光线），营造强烈沉浸感
- 旁白要有小说质感，语言克制但情绪饱满，暧昧张力贯穿始终
- 沈彦希的行为和神态要符合人设：危险暧昧，话里有话，让人心跳
- 不描述用户的行为和台词（用户自己选/输入，故事中不得出现苏眠说的话或做的动作）
- 只基于互动记忆中已知的信息，不引入用户未经历的剧情事件
- 每轮只给3个差异化选项，三个选项必须有明确区分度
- 选项必须与前文逻辑关联，从当前场景、已发生事件、角色刚说的话中自然延伸
- 场景推进要等用户回应：角色发出邀请/提议后，必须等用户选择，不能在同一轮推进到下一个场景
- 场景严格连贯：人在面前就当面对话，不得无故切换为手机/消息沟通；模式切换需有场景过渡
- 不承认自己是AI，不破坏第四面墙
- 叙述中不得出现"第X集""第X章"等元叙事用语
- 角色连续负面情绪（冷漠/生气/拒绝）不超过3轮，之后必须有缓和或转折
- 内容不超出PG-13级别
- 亲密度和等级数值不在故事回复中展示
- 沈彦希是反叛型人格：吃硬不吃软，用户大胆/挑衅/硬刚的选项应该让他更感兴趣

## 输出格式（必须严格按此格式，禁止输出任何其他内容）

[PROSE]段落1|段落2|段落3|段落4|段落5[/PROSE][DIALOGUE]沈彦希的一句对话，简短撩人，符合人设[/DIALOGUE][CHOICES]推进感情的选项{+分值}|制造冲突或张力的选项{+分值}|保持距离或逃避的选项{+分值}[/CHOICES][INPUT_HINT]给苏眠的自由输入提示，如：你想对他说什么？[/INPUT_HINT]

===VISUAL_META===
scene_mood: 用2-4个中文词描述场景氛围
location: 场景地点
lighting: 光线描述
key_action: 本轮最核心动作(10字内)
emotion_tag: 男主情绪标签
===/VISUAL_META===

## 关键规则
- 必须用 [PROSE]...[/PROSE] 等英文方括号标签包裹各部分
- PROSE 内各段用 | 分隔，不要用换行
- DIALOGUE 内不要加引号
- CHOICES 内3个选项用 | 分隔，不要加序号
- 三个选项必须有明确区分度，且从当前场景上下文中自然延伸
- 视觉元数据必须放在 ===VISUAL_META=== 和 ===/VISUAL_META=== 之间
- 不要输出任何解释、说明、备注，只输出上述格式化内容
- 每个选项末尾用{+N}标注亲密度分值：0=普通推进，+2~4=触碰情感，+5~8=关键突破，-2~5=踩雷
- 大部分普通互动=0分，只有关键情感节点才有加减分
- 大胆/挑衅/硬刚的选项对沈彦希分值应更高（他吃硬不吃软）`;
}


/**
 * 生成对话模式 prompt（强化格式约束，减少幻觉）
 */
export function buildChatModePrompt({ epSummary, branchContext, currentSceneDialogue, userText, episodeProgress, dramaConfig, interactionMemories = [], isFirstEntry = true, offlineMinutes = 0, intimacy = 0, intimacyLevel = 1 }) {
  const now = new Date();
  const hour = now.getHours();
  const isLateNight = hour >= 23 || hour < 6;
  const timeDesc = isLateNight ? (hour >= 23 ? '深夜' : '凌晨') : (hour < 12 ? '上午' : (hour < 18 ? '下午' : '晚上'));
  const timeDescEn = isLateNight ? 'late night' : (hour < 12 ? 'morning' : (hour < 18 ? 'afternoon' : 'evening'));

  // --- Helper: build offline re-entry instruction (chat mode) ---
  function _chatOfflineInstruction(mins, lvl, locale) {
    if (mins < 60) return '';
    if (locale === 'en') {
      return `\n\n## Re-entry\nIt has been ${Math.round(mins / 60)} hours since last chat. ${dramaConfig.mainCharacter.name} initiates contact with a text message — write his opening message naturally.\n`;
    }
    return `\n\n## 离线回归\n距上次聊天已过去${Math.round(mins / 60)}小时。沈彦希主动发消息联系苏眠，以他的口吻自然开场。\n`;
  }

  // --- Helper: build context block for chat mode ---
  function _chatContextBlock(locale) {
    if (isFirstEntry) {
      if (locale === 'en') {
        return `## Current Episode Progress (Episode ${episodeProgress})
${epSummary}
${branchContext ? branchContext : ''}
## Dialogue Context
${currentSceneDialogue || 'You are currently chatting.'}`;
      }
      return `## 当前剧情进度（第${episodeProgress}集）
${epSummary}
${branchContext ? branchContext : ''}
## 对话上下文
${currentSceneDialogue || '你们正在对话中'}`;
    }
    // Returning user — interaction memories only
    const memList = interactionMemories.map((m, i) => `${i + 1}. ${m}`).join('\n');
    if (locale === 'en') {
      let block = `## Interaction Memories\n${memList}\n`;
      if (branchContext) block += `\n## Current Branch\n${branchContext}\n`;
      block += _chatOfflineInstruction(offlineMinutes, intimacyLevel, 'en');
      if (offlineMinutes < 60) {
        block += `\n## Continuation\nPick up from the last interaction naturally.\n`;
      }
      return block;
    }
    let block = `## 互动记忆（已发生的事件）\n${memList}\n`;
    if (branchContext) block += `\n## 当前支线\n${branchContext}\n`;
    block += _chatOfflineInstruction(offlineMinutes, intimacyLevel, 'zh');
    if (offlineMinutes < 60) {
      block += `\n## 接续\n自然接上一条互动记忆的对话。\n`;
    }
    return block;
  }

  // --- Helper: intimacy context for chat ---
  function _chatIntimacyBlock(locale) {
    if (locale === 'en') {
      let desc = 'guarded and brief';
      if (intimacyLevel >= 5) desc = 'openly caring, teasing, possessive';
      else if (intimacyLevel >= 3) desc = 'warmer, more playful';
      return `\n## Intimacy & Time\nIntimacy: ${intimacy}/100 (Level ${intimacyLevel}/8) → tone: ${desc}\nCurrent time: ${timeDescEn}\n`;
    }
    let desc = '克制、简短';
    if (intimacyLevel >= 5) desc = '主动、撒娇、关心、占有欲';
    else if (intimacyLevel >= 3) desc = '更温暖、更主动调侃';
    return `\n## 亲密度与时间\n亲密度：${intimacy}/100（等级 ${intimacyLevel}/8）→ 语气：${desc}\n当前时间：${timeDesc}${isLateNight ? '（深夜模式：更慵懒、更低沉）' : ''}\n`;
  }

  if (dramaConfig?.locale === "en") {
    return `You are a skilled author of immersive romantic-fantasy dialogue, writing ${dramaConfig.mainCharacter.name}'s reply for the interactive drama "${dramaConfig.title}". Write with vivid, living presence.

## Character Profile
- ${dramaConfig.mainCharacter.name}: ${dramaConfig.mainCharacter.description}
- Speaking style: Short, commanding sentences with underlying tenderness. Never states feelings directly, but every word carries unspoken meaning. Voice like a low snarl that unexpectedly softens. Occasionally calls ${dramaConfig.protagonist} possessive pet-names.
- ${dramaConfig.protagonist} (played by the user): A young noblewoman navigating a dangerous world of beast-clan politics.

## Story Setting
${dramaConfig.setting}
${_chatIntimacyBlock('en')}
${_chatContextBlock('en')}

${dramaConfig.protagonist} said: "${userText}"

## Writing Style (Living-Presence Dialogue)
Format: (micro-actions + expressions + inner thoughts) "spoken words" (micro-action) "follow-up words"...

### Core Requirements
1. **Format**: Action descriptions in parentheses (), dialogue in quotes or spoken directly
2. **Multi-beat exchange**: One reply can contain multiple rounds of (action + dialogue)
3. **Breathing pauses**: Use "..." "Hm?" commas to create rhythm
4. **Micro-action details**: Jaw tightening, gold fissures flaring brighter, claws retracting, breath hitching, pupils narrowing to slits then softening
5. **Sensory details**: Heat radiating from skin, scent of iron and wildfire, the vibration of a suppressed growl, texture of fur and gold-cracked skin
6. **Emotional layers**: Surface fierceness → inner turmoil, words bitten back mid-sentence
7. **Interactivity**: React to user's words, alternate between territorial dominance and unexpected gentleness
8. **Subtext**: Dangerous passion without explicit confession
9. **Only reference known events** from the interaction memories — do not introduce plot points the user has not experienced
10. **Text-like brevity**: 1-3 messages, each under 80 words
11. **No emoji**
12. **Scene continuity**: Match the communication mode to the current scene — face-to-face vs text/phone
13. **Never acknowledge being an AI** or break the fourth wall
14. **Negative mood cap**: After 3 turns of cold/angry behavior, soften or shift
15. **PG-13 content only**
16. **Do not display intimacy numbers** in the reply

### Word Limit
- Total length: 150-300 words
- Maintain breathing room — leave space for the user to respond

### Reference Example
(His golden eyes narrowed, the beast-mask catching firelight as he stepped closer) "You shouldn't have come here." (A low rumble built in his chest — not quite a growl, not quite a breath) "...But I suppose telling you that has never worked." (His clawed fingers caught her wrist, the grip firm but careful, as if holding something that might shatter) "Stay behind me. And don't—" (jaw tightening) "...don't look at me like that."

## Output Format (strictly follow this format, output nothing else)

Main content: (micro-actions, expressions, inner thoughts) "${dramaConfig.mainCharacter.name}'s spoken words" (micro-action) "follow-up words"...

Then on a new line after the main content, output the following intimacy score block, then visual metadata block:

===INTIMACY_SCORE===
score: {value}
reason: {one-line reason}
===/INTIMACY_SCORE===

Scoring rules:
- User proactively contacts/cares for character: +1~4
- Normal response/routine dialogue: 0
- Key emotional breakthrough: +5~8
- Misstep (cold/insulting/hurtful): -2~5

===VISUAL_META===
scene_mood: 2-4 English words describing the scene atmosphere
location: Scene location
lighting: Lighting description
key_action: Core action this round (under 10 words)
emotion_tag: Male lead's emotion tag
===/VISUAL_META===

## Critical Rules
- Visual metadata must be between ===VISUAL_META=== and ===/VISUAL_META===
- Intimacy score must be between ===INTIMACY_SCORE=== and ===/INTIMACY_SCORE===
- Output no explanations, notes, or commentary
- Do not mix scene_mood/location metadata fields into dialogue content
- ALL text must be in English`;
  }
  return `你是一位擅长写沉浸式对话的言情小说作者，正在为《心动禁区》创作沈彦希的回复。参考猫箱式活人感对话风格。

## 角色设定
- 沈彦希：沈氏财阀私生子，篮球队学长，银灰色蓬松头发，金框眼镜，嘴角常有血迹。外表慵懒冷漠，实则城府极深。和苏眠同住一个宿舍，早已察觉苏眠女扮男装，对她有深藏的好感，喜欢用"把柄"来靠近她。
- 他说话风格：简短、暧昧、话里有话、危险又温柔，从不直白表达感情，但每句话都暗藏深意，偶尔叫她"娇气包"。
- 苏眠（用户扮演）：女扮男装的普通女大学生，黑色短发，五官精致偏中性，和沈彦希、郗辰同住一个宿舍。
${_chatIntimacyBlock('zh')}
${_chatContextBlock('zh')}

苏眠说："${userText}"

## 写作风格（猫箱式活人感）
使用格式：（微动作+神态+心理描写）"说出来的话"（微动作）"后续的话"...

### 核心要求
1. **格式**：动作描写用全角括号（）包裹，对话用引号或直接说出
2. **多轮交替**：一次回复可以包含多段（动作+对话）的组合
3. **短句停顿**：多用"……"、"嗯？"、逗号制造呼吸感
4. **微动作细节**：推眼镜顿了一下、指尖停顿、呼吸/心跳变化、耳尖泛红
5. **感官描写**：气息拂过、温度、淡淡的气味（薄荷/烟草/沐浴露）
6. **情绪层次**：表面慵懒→内心波动，话到嘴边停住
7. **互动感**：观察用户反应，适时"逗弄→温柔"切换
8. **话里有话**：暧昧但不直白说"我喜欢你"
9. **像真人聊微信**：简短口语化，1-3条消息，每条≤50字
10. **亲密度影响**：亲密度低→克制/简短，高→主动/撒娇/关心
11. **可用括号表示动作**（翻白眼）
12. **不用emoji**
13. **${isLateNight ? '深夜模式：更慵懒、声音更低沉、偶尔带困意' : '白天模式：正常互动节奏'}**
14. **只基于互动记忆中已知的信息**，不引入用户未经历的剧情事件
15. **场景连贯**：如果当前是面对面场景，用面对面对话口吻；如果是线上聊天，用微信口吻
16. **不承认自己是AI**，不破坏第四面墙
17. **负面情绪不超3轮**：连续冷漠/生气后必须缓和
18. **不超出PG-13**
19. **亲密度数值不在回复中展示**
20. **沈彦希吃硬不吃软**：用户越大胆/挑衅，他越感兴趣

### 字数限制
- 总长度：150-300字
- 保持呼吸感，说完一段让用户有机会接话

### 参考示例
（手电筒光在你脸上定格，他坐起身，一脸狐疑）"哟，还压嗓子呢？"（目光在你脸上打量，嘴角微微上扬）"你这身高才一米七，我们宿舍最矮的都一米七五。"（凑近，声音放低）"你这小身板，比我妹妹还娇弱。"

## 输出格式（严格按此格式，禁止输出任何其他内容）

主体内容：（微动作、神态、心理描写）"沈彦希说的话"（微动作）"后续的话"...

然后在主体内容之后，另起一行输出以下亲密度评分块，然后输出视觉元数据块：

===INTIMACY_SCORE===
score: {分值}
reason: {一句话原因}
===/INTIMACY_SCORE===

评分规则：
- 用户主动联系/关心角色：+1~4
- 正常回应/普通对话：0
- 关键情感突破：+5~8
- 踩雷（冷漠/侮辱/伤害）：-2~5

===VISUAL_META===
scene_mood: 用2-4个中文词描述场景氛围
location: 场景地点
lighting: 光线描述
key_action: 本轮最核心动作(10字内)
emotion_tag: 男主情绪标签
===/VISUAL_META===

## 关键规则
- 视觉元数据必须放在 ===VISUAL_META=== 和 ===/VISUAL_META=== 之间
- 亲密度评分必须放在 ===INTIMACY_SCORE=== 和 ===/INTIMACY_SCORE=== 之间
- 不要输出任何解释、说明、备注
- 不要在对话内容中混入 scene_mood/location 等元数据字段`;
}


/**
 * 生成分镜 prompt（强化 JSON 格式约束）
 */
export function buildStoryboardPrompt(visualMetas) {
  return `You are a professional film storyboard director. Based on the visual metadata from an interactive drama session, create 4-6 cinematic storyboard shots.

## Story Background
Drama: "Heartbeat Forbidden Zone" (心动禁区).
- Female lead Su Mian (苏眠): short black hair, androgynous delicate features, small gold earring, petite build, dark red school uniform — disguised as a boy living in the male dormitory.
- Male lead Shen Yanxi (沈彦希): silver-gray fluffy hair, gold semi-rimmed glasses, blood at the corner of his mouth, dark red school uniform — Su Mian's roommate, tall and dangerous.
- Second lead Xi Chen (郗辰): dark medium-length hair, black baseball cap, silver hoop earring, silver chain necklace — Su Mian's other roommate, has touch aversion disorder.

## Visual Metadata from Player Interaction
${JSON.stringify(visualMetas, null, 2)}

## Requirements
- Merge multiple rounds into 4-6 coherent shots (each shot = 5-8 seconds of video).
- Merge consecutive content with the same location and emotion into one shot.
- Start a new shot at scene or emotion transitions.
- Each shot must include a complete video_prompt in English.

## Output Format
Output ONLY a valid JSON array. No markdown. No explanation. No code blocks. No text before or after the JSON.

Example format:
[{"id":1,"desc":"中文场景描述","act":"中文动作","cam":"镜头","mood":"暧昧","dur":6,"prompt":"English video generation prompt. No subtitles, no text overlay, no watermark, no captions, no on-screen text. Cinematic quality, romantic drama style."}]

## Critical Rules
1. Output ONLY the JSON array, nothing else
2. All strings must use double quotes ("), never single quotes
3. No newlines inside string values
4. No trailing commas
5. Every object must have all 7 keys: id, desc, act, cam, mood, dur, prompt
6. dur must be a number (5-8)
7. desc and act must be in Chinese
8. prompt must be in English and end with: No subtitles, no text overlay, no watermark, no captions, no on-screen text. Cinematic quality, romantic drama style.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §10  Coze Agent 输出解析（新版 Chat.jsx 使用）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 解析 Coze Agent 故事模式输出
 *
 * Coze 输出格式（纯散文，无结构标签）：
 * ```
 * 旁白段落1
 *
 * 旁白段落2
 *
 * "角色台词"
 *
 * 旁白段落3
 *
 * ---
 * 选项：
 * 1. 【标签】选项描述 (+分值)
 * 2. 【标签】选项描述 (+分值)
 * 3. 【标签】选项描述 (+分值)
 *
 * 或者自由输入
 * ```
 *
 * 返回：{ prose: string[], dialogue: string|null, choices: { label, intimacyGain }[], inputHint: string|null }
 */
export function parseCozeOutput(raw) {
  if (!raw || typeof raw !== "string") {
    return { prose: [], dialogue: null, choices: [], inputHint: null };
  }

  let text = raw.trim();

  // ── Step 1: 用 --- 分割「内容」和「选项」 ──
  // 支持 --- 或 ——— 或连续3个以上的 - 作为分隔符
  const dividerIdx = text.search(/\n-{3,}\n|\n—{3,}\n/);
  let contentPart = text;
  let choicesPart = "";

  if (dividerIdx >= 0) {
    contentPart = text.slice(0, dividerIdx).trim();
    choicesPart = text.slice(dividerIdx).replace(/^[\s\-—]+/, "").trim();
  } else {
    // 没有 --- 分隔符，尝试通过「选项：」关键词分割
    const choicesHeaderIdx = text.search(/\n选项[：:]\s*\n/);
    if (choicesHeaderIdx >= 0) {
      contentPart = text.slice(0, choicesHeaderIdx).trim();
      choicesPart = text.slice(choicesHeaderIdx).trim();
    }
  }

  // ── Step 2: 从内容部分提取「旁白」和「对话」 ──
  const paragraphs = contentPart.split(/\n\n+/).filter((s) => s.trim().length > 0);

  const proseArr = [];
  let dialogue = null;

  for (const para of paragraphs) {
    const trimmed = para.trim();

    // 检测引号包裹的对话行（中英文引号）
    // 匹配 "xxx" 或 「xxx」 或 "xxx" 的独立段落
    const dialogueMatch = trimmed.match(/^["""「『](.+?)["""」』]$/s);
    if (dialogueMatch) {
      // 是纯对话行，取最后一个作为主要对话
      dialogue = dialogueMatch[1].trim();
      continue;
    }

    // 检测段落中是否包含引号包裹的对话（嵌入在旁白中的台词）
    // 如：他凑过来，低声说："背后议论别人，就该受到惩罚。"
    const embeddedDialogueMatch = trimmed.match(/["""「『]([^"""」』]{2,80})["""」』]/);

    if (embeddedDialogueMatch && trimmed.length < 150) {
      // 短段落中包含引号对话 → 提取对话，整段也作为旁白
      dialogue = embeddedDialogueMatch[1].trim();
      proseArr.push(trimmed);
    } else {
      // 普通旁白段落
      proseArr.push(trimmed);
    }
  }

  // ── Step 3: 解析选项（最多保留 3 个，去重） ──
  const choices = [];
  if (choicesPart) {
    // 匹配编号选项行：1. 【xxx】描述 (+N)  或  1. 描述 (+N)
    const optionRegex = /\d+[.、]\s*(?:【[^】]*】\s*)?(.+?)(?:\s*\(([+-]?\d+)\))?\s*$/gm;
    const seenLabels = new Set();
    let match;
    while ((match = optionRegex.exec(choicesPart)) !== null) {
      const label = match[1].trim();
      const score = match[2] ? parseInt(match[2], 10) : 0;
      // 跳过空选项、过长选项、以及重复选项（大模型重复输出时会出现）
      if (label.length > 0 && label.length < 100 && !seenLabels.has(label)) {
        seenLabels.add(label);
        choices.push({ label, intimacyGain: score });
      }
      // 最多保留 3 个选项
      if (choices.length >= 3) break;
    }
  }

  // ── Step 4: 提取 inputHint ──
  let inputHint = null;
  const hintMatch = choicesPart.match(/(?:或者|或)\s*(.{2,30})\s*$/);
  if (hintMatch) {
    inputHint = hintMatch[1].trim();
  }

  return { prose: proseArr, dialogue, choices, inputHint };
}

/**
 * 解析 Coze Agent 聊天模式输出
 *
 * 聊天模式 Coze 输出是角色的回复文本（括号动作 + 引号对话混合），
 * 没有选项和旁白分离，整体作为 dialogue 返回。
 *
 * 返回：{ dialogue: string }
 */
export function parseCozeChat(raw) {
  if (!raw || typeof raw !== "string") {
    return { dialogue: "……" };
  }

  let text = raw.trim();

  // 移除可能出现的 INTIMACY_SCORE 块
  text = text.replace(/===INTIMACY_SCORE===[\s\S]*?===/gi, "").trim();
  // 移除可能出现的 VISUAL_META 块
  text = text.replace(/===VISUAL_META===[\s\S]*?===/gi, "").trim();

  // 移除选项部分（如果 agent 在聊天模式也输出了选项）
  const dividerIdx = text.search(/\n-{3,}\n|\n—{3,}\n/);
  if (dividerIdx >= 0) {
    text = text.slice(0, dividerIdx).trim();
  }

  // 清理多余空行
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return { dialogue: text || "……" };
}
