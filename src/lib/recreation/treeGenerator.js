/**
 * treeGenerator.js
 * AI 互动故事树生成模块
 *
 * 职责：
 *  1. buildTreePrompt(config)         — 构造一次性生成整棵 JSON 树的 prompt
 *  2. generateStoryTree(config, opts) — 调用 Ark AI，解析并校验树
 *  3. validateTree(nodes, rootNodeId) — 连通性校验
 *  4. VARIANT_SUFFIXES                — A/B/C 差异化追加
 *  5. DEFAULT_CHARACTERS              — 心动禁区角色档案
 *  6. DEFAULT_EPISODES                — 前6集剧情摘要
 */

import { callAI } from "@/lib/aiClient";

// ─── 1. 差异化 Variant ─────────────────────────────────────────────────────────

export const VARIANT_SUFFIXES = {
  A: `
## 差异化策略：A · 角色特质极致化
- 每个节点中沈彦希的行为必须极度贴合人设，辨识度第一
- 用微动作（拇指擦嘴唇/低压帽檐/捏手腕力度变化）替代直接表达情绪
- 他的台词每句≤15字，留白越多张力越大
- 选项对应 3 种女主人格：🐰示弱（触发保护欲）/ 🔥挑衅（触发征服欲）/ 🧊逃跑（触发追逐欲）`,

  B: `
## 差异化策略：B · 剧情张力最大化
- 每个节点必须包含至少一个「意料之外」的转折或信息量爆炸瞬间
- 善用信息差：他知道而她不知道的事、突然暴露的新信息、第三者闯入
- 情绪过山车：甜与虐之间快速切换，不给读者喘息
- 选项要让用户感到「下一秒不得不继续看」`,

  C: `
## 差异化策略：C · 用户吸引力（上瘾机制）
- 第二人称叙事（"你"），读者完全代入女主
- 感官沉浸优先级：触觉 > 嗅觉 > 听觉 > 视觉
- 每个节点末尾留「未解决的悬念」——一个让人过度解读的动作或意味不明的话
- 「差一点就…」机制：亲密感推进到临界点但不突破，永远差一口气
- 间歇性强化：偶尔的冷淡让甜变得更甜`,
};

// ─── 2. 角色档案 ───────────────────────────────────────────────────────────────

export const DEFAULT_CHARACTERS = [
  {
    name: "沈彦希",
    alias: "彦希",
    profile: `沈氏财阀私生子，20岁，篮球队学长，女主的室友。
外表：黑色棒球帽，深色中长发，银色耳环和项链，校服敞开穿，领带永远松垮。
性格：表面慵懒冷漠，有攻击性；内里极度占有欲强，对"你"有超出室友的执念。
说话风格：极简短（≤15字），从不超过两句完整的话，不解释，不哄人，用行动代替语言。
关键特质：力量碾压（身高差/力气差）、危险的温柔（掐下巴/按后脑/捏手腕，但力度恰好不疼）。
他早已察觉林夏女扮男装，从未点破，对她有深藏好感。`,
  },
  {
    name: "林夏",
    alias: "苏颜（真名）",
    profile: `女扮男装的普通女大学生，和沈彦希同住宿舍。
外表：短黑发、酒红校服、娇小身材。
性格：表面嘴硬逞强，实际容易慌乱、容易脸红、容易被他的气场压制。
特殊背景：现代女孩苏眠穿书进入校园小说成为配角「林夏」，必须维持男生身份。`,
  },
];

// ─── 3. 默认剧集摘要（前6集）────────────────────────────────────────────────────

export const DEFAULT_EPISODES = [
  {
    ep: 1,
    title: "穿书入住",
    summary:
      "苏眠穿书成为林夏，被迫女扮男装入住302男生宿舍。室友沈彦希银灰色头发、黑框眼镜，颓废又危险。阳台场景：他把林夏逼至栏杆边，拇指压住她嘴唇，带着警告意味低声问话。两人关系：第一次见面，危险试探。",
  },
  {
    ep: 2,
    title: "吃醋床咚",
    summary:
      "林夏与其他男生普通互动，触发沈彦希情绪反应。他冷脸靠近，将林夏从人群中「捞」回来。宿舍场景：以某个借口将林夏压制在床沿，单手撑在她头侧，距离近到能感受彼此呼吸。关系：第一次吃醋，床咚。",
  },
  {
    ep: 3,
    title: "浴室危机",
    summary:
      "银发室友（银发短发、性格外向）搬入，自来熟勾肩搭背。浴室门锁失灵，林夏差点暴露真实性别。沈彦希看到，表情成谜。关系：身份第一次险些暴露。",
  },
  {
    ep: 4,
    title: "深夜额头吻",
    summary:
      "林夏深夜高烧，意识模糊，伪装防线崩塌。沈彦希独自照顾：湿毛巾敷额头、倒水、找药。林夏半梦半醒，感受到他俯身，嘴唇轻触额头——克制、温柔。第二天只剩床头的水杯。关系：第一次柔软，额头吻。",
  },
  {
    ep: 5,
    title: "篮球场三角",
    summary:
      "邹辰（银灰发、眼镜、清冷学神，7号）正式出场。训练中林夏被篮球撞倒，沈彦希（10号，慵懒）走过来扶她。三角关系初现。关系：邹辰登场，三角感诞生。",
  },
  {
    ep: 6,
    title: "体检危机",
    summary:
      "银发室友当众对沈彦希说「你爱上男的了」，沈彦希回击。闪回：沈彦希已发现林夏「性别不对劲」，心存疑惑未点破。全体男生体检通知来临——身份暴露最大危机。关系：体检危机，悬念升至顶点。",
  },
];

// ─── 4. buildTreePrompt ────────────────────────────────────────────────────────

/**
 * 构造「一次性生成整棵故事树 JSON」的 prompt
 *
 * @param {Object} config
 * @param {Array}  config.characters       角色数组，每项 { name, alias, profile }
 * @param {string} config.episodeSummary   当集剧情摘要（作为前情背景）
 * @param {string} config.startingScene    续写起点场景描述
 * @param {Array}  config.keyDialogues     关键台词数组（字符串）
 * @param {string} config.emotionalArc     续写方向/用户自定义设定
 * @param {number} [config.totalNodes=8]   总节点数目标
 * @param {number} [config.branchPoints=2] 分支点数量
 * @param {number} [config.endings=2]      结局数量
 * @returns {string}
 */
export function buildTreePrompt(config) {
  const {
    characters = DEFAULT_CHARACTERS,
    episodeSummary = "",
    startingScene = "",
    keyDialogues = [],
    emotionalArc = "",
    totalNodes = 5,  // 默认 5 个节点，减少 JSON 体积
    branchPoints = 2,
    endings = 2,
  } = config;

  const charBlock = characters
    .map((c) => `【${c.name}${c.alias ? `（${c.alias}）` : ""}】\n${c.profile}`)
    .join("\n\n");

  const dialogueBlock = keyDialogues.length
    ? keyDialogues.map((d, i) => `${i + 1}. "${d}"`).join("\n")
    : "（无指定台词，自由发挥）";

  return `你是一位顶尖沉浸式言情互动小说设计师，正在为《心动禁区》互动影游设计一棵完整的故事节点树。
你的任务是**续写**本集之后发生的全新剧情，而非复述或改编已有剧情。

## 角色档案
${charBlock}

## 前情回顾（已发生的剧情，仅作背景参考，不要重复讲述）
${episodeSummary}

## 续写起点（故事从这里开始，紧接在上述剧情结束之后）
${startingScene || "（紧接前情结尾，自由设计开场）"}

## 关键台词参考
${dialogueBlock}

## 续写方向
${emotionalArc || "（自由发挥，在前情基础上发展全新的剧情冲突与甜蜜互动）"}

## 重要：续写规则
- 你必须编写发生在「前情回顾」之后的全新剧情，绝对不要重新讲述已有的情节
- 以「续写起点」作为故事的开篇场景，发展全新的情节线
- 保持角色性格一致，但可以在新场景中展现角色的新面貌
- 新故事应有完整的起承转合，情节要有新鲜感和意外性

## 树结构要求
- 总节点数（含结局）：约 ${totalNodes} 个
- 分支点数量：${branchPoints} 个
- 结局数量：${endings} 个（至少一个甜蜜结局，至少一个遗憾/苦涩结局）
- 每个非结局节点必须有 nextNodeId 或 branch，不允许死路
- 所有 targetNodeId 必须指向树中存在的节点 id
- 树必须连通：从 rootNodeId 出发，每条路径最终可达至少一个带 ending 的节点

## 节点写作规范

### 旁白（prose）
- 字符串数组，**每个节点必须有至少1段非空旁白**，每段15-30字
- 极简白描，点到为止
- 结局节点和分支节点也必须有 prose，不允许空数组

### 对话（dialogue）
- 每节点0-1句，沈彦希台词不超过10字

### 视觉元数据（visualMeta）
- visualMeta 必须是**数组**，包含 5 个镜头对象（5 shots / 5 panels），每个对象包含 scene, mood, lighting, keyAction, cameraAngle
- 5 个镜头应覆盖该节点剧情的不同时刻/角度（如：远景建立→中景对话→特写表情→动作镜头→氛围收尾）
- 每个字段用2-5个字即可

### 分支选项（branch.options）
- 每分支2个选项（不要3个）
- label不超过8字，description不超过12字

### 结局节点（ending）
- description不超过30字

## 输出格式
输出紧凑的单行JSON（无换行、无缩进），示例结构：
{"title":"...","rootNodeId":"node_opening","nodes":{"node_opening":{"id":"node_opening","title":"...","prose":["一段话"],"dialogue":[{"speaker":"沈彦希","text":"..."}],"visualMeta":[{"scene":"...","mood":"...","lighting":"...","keyAction":"...","cameraAngle":"远景"},{"scene":"...","mood":"...","lighting":"...","keyAction":"...","cameraAngle":"中景"},{"scene":"...","mood":"...","lighting":"...","keyAction":"...","cameraAngle":"特写"},{"scene":"...","mood":"...","lighting":"...","keyAction":"...","cameraAngle":"动作"},{"scene":"...","mood":"...","lighting":"...","keyAction":"...","cameraAngle":"氛围"}],"branch":{"question":"...","options":[{"id":"opt_a","label":"...","description":"...","targetNodeId":"node_x","affinityChange":10,"unlockCondition":null}]},"ending":null}}}

## 关键规则
1. 输出必须是可被 JSON.parse() 直接解析的合法 JSON，不得包含 markdown 代码块
2. 所有字符串值必须在同一行内，绝对不能包含换行符（\\n也不要用）
3. 节点 id 格式：node_{英文描述}，如 node_opening / node_chase / node_ending_sweet
4. 选项 id 格式：opt_{英文描述}
5. 每条从 rootNodeId 出发的路径长度（节点数）在 3-6 之间
6. 不要输出任何解释、说明、备注，只输出 JSON
7. 整个 JSON 输出必须紧凑（不要美化格式），总长度控制在6000字符以内。如果内容太长宁可缩短 prose 文字和 visualMeta 描述`;
}

// ─── 5. validateTree ──────────────────────────────────────────────────────────

/**
 * 校验故事树的连通性
 *
 * @param {Object} nodes       nodes 对象（key = nodeId）
 * @param {string} rootNodeId
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTree(nodes, rootNodeId) {
  const errors = [];
  const warnings = [];

  if (!nodes || typeof nodes !== "object") {
    return { valid: false, errors: ["nodes 不是合法对象"], warnings };
  }
  if (!rootNodeId || !nodes[rootNodeId]) {
    errors.push(`rootNodeId "${rootNodeId}" 不存在于 nodes 中`);
    return { valid: false, errors, warnings };
  }

  // ── 预处理 Step 1：自动补 ending 字段 ──
  // 遍历所有节点，如果 id 包含 ending/end 且没有 ending 字段，自动补上
  const ENDING_ID_RE = /ending|end/i;
  const ENDING_TITLE_RE = /结局|ending|end|sweet|bittersweet|bad/i;

  for (const [id, node] of Object.entries(nodes)) {
    if (!node.ending && ENDING_ID_RE.test(id)) {
      // 推断类型
      let type = "unknown";
      const titleLower = (node.title || id).toLowerCase();
      if (titleLower.includes("sweet") || titleLower.includes("甜蜜")) type = "sweet";
      else if (titleLower.includes("bittersweet") || titleLower.includes("苦涩") || titleLower.includes("遗憾")) type = "bittersweet";
      else if (titleLower.includes("bad") || titleLower.includes("悲剧")) type = "bad";

      node.ending = { type, description: node.title || id };
      warnings.push(`节点 ${id} 疑似结局节点但缺少 ending 字段，已自动补全（type: ${type}）`);
    }
  }

  const allIds = new Set(Object.keys(nodes));

  // ── 预处理 Step 2：找到所有结局节点（预先扫描，用于修正 targetNodeId） ──
  const endingNodeIds = Object.keys(nodes).filter((id) => nodes[id].ending);
  // 找 fallback：优先 sweet 结局，否则第一个结局，否则 rootNodeId
  const fallbackTargetId =
    endingNodeIds.find((id) => nodes[id].ending?.type === "sweet") ||
    endingNodeIds[0] ||
    rootNodeId;

  // ── Step 3：修复 targetNodeId 指向不存在节点的情况 ──
  for (const node of Object.values(nodes)) {
    if (node.branch?.options) {
      for (const opt of node.branch.options) {
        if (!opt.targetNodeId) {
          // 缺少 targetNodeId，补上 fallback
          opt.targetNodeId = fallbackTargetId;
          warnings.push(`节点 ${node.id} 的选项 ${opt.id || "?"} 缺少 targetNodeId，已修正为 ${fallbackTargetId}`);
        } else if (!allIds.has(opt.targetNodeId)) {
          const original = opt.targetNodeId;
          opt.targetNodeId = fallbackTargetId;
          warnings.push(`节点 ${node.id} 的选项 ${opt.id || "?"} 的 targetNodeId "${original}" 不存在，已修正为 ${fallbackTargetId}`);
        }
      }
    }
    if (node.nextNodeId && !allIds.has(node.nextNodeId)) {
      const original = node.nextNodeId;
      node.nextNodeId = fallbackTargetId;
      warnings.push(`节点 ${node.id} 的 nextNodeId "${original}" 不存在，已修正为 ${fallbackTargetId}`);
    }
  }

  // ── Step 4：BFS 从 root 出发，验证可达性 ──
  const visited = new Set();
  const queue = [rootNodeId];
  const reachedEndingNodes = new Set();

  while (queue.length > 0) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodes[id];
    if (!node) continue;

    if (node.ending) {
      reachedEndingNodes.add(id);
      continue; // 结局节点不继续遍历
    }

    // 死路检测：非结局节点既无 branch 又无 nextNodeId
    if (!node.branch && !node.nextNodeId) {
      // 推断结局类型
      const titleText = (node.title || "") + " " + (id || "");
      let type = "unknown";
      const t = titleText.toLowerCase();
      if (t.includes("sweet") || t.includes("甜蜜")) type = "sweet";
      else if (t.includes("bittersweet") || t.includes("苦涩") || t.includes("遗憾")) type = "bittersweet";
      else if (t.includes("bad") || t.includes("悲剧")) type = "bad";

      // 自动修复：将死路节点标记为结局节点
      node.ending = { type, description: node.title || id };
      reachedEndingNodes.add(id);
      warnings.push(`节点 ${id} 无 branch 也无 nextNodeId，已自动标记为结局节点（type: ${type}）`);
    }

    if (node.nextNodeId && nodes[node.nextNodeId]) {
      queue.push(node.nextNodeId);
    }
    if (node.branch?.options) {
      for (const opt of node.branch.options) {
        if (opt.targetNodeId && nodes[opt.targetNodeId]) {
          queue.push(opt.targetNodeId);
        }
      }
    }
  }

  if (reachedEndingNodes.size === 0) {
    errors.push("树中不存在任何可达的结局节点（ending 字段）");
  }

  // ── Step 5：孤立节点检测（从 root 不可达，降级为 warning） ──
  for (const id of allIds) {
    if (!visited.has(id)) {
      warnings.push(`节点 ${id} 从 rootNodeId 不可达（孤立节点）`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── 6. generateStoryTree ─────────────────────────────────────────────────────

/**
 * 调用 AI 生成完整故事树，解析 JSON，校验树结构
 *
 * @param {Object}  config           同 buildTreePrompt 的 config
 * @param {Object}  [opts]
 * @param {string}  [opts.variant]   "A" | "B" | "C"，追加差异化策略
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function generateStoryTree(config, opts = {}) {
  const MAX_ATTEMPTS = 3;
  let prompt = buildTreePrompt(config);

  if (opts.variant && VARIANT_SUFFIXES[opts.variant]) {
    prompt += "\n" + VARIANT_SUFFIXES[opts.variant];
  }

  // ── JSON 修复工具（共享，所有尝试复用）──

  // 状态机：修复字符串值内部未转义的双引号
  function fixUnescapedQuotesInValues(s) {
    let result = '';
    let i = 0;
    let inString = false;

    while (i < s.length) {
      const ch = s[i];

      // 遇到反斜杠：跳过转义序列
      if (ch === '\\') {
        result += ch + (s[i + 1] || '');
        i += 2;
        continue;
      }

      // 遇到双引号
      if (ch === '"') {
        if (!inString) {
          // 进入字符串
          inString = true;
          result += ch;
          i++;
          continue;
        }
        // 在字符串内部：前瞻下一个有意义字符
        let j = i + 1;
        while (j < s.length && s[j] === ' ') j++; // 跳过空格
        const nextMeaningful = s[j];
        // 如果下一个有意义字符是结构字符，认为是字符串结束符
        if (nextMeaningful === ',' || nextMeaningful === '}' || nextMeaningful === ']' ||
            nextMeaningful === ':' || j >= s.length) {
          inString = false;
          result += ch;
        } else {
          // 内容中的引号，转义
          result += '\\"';
        }
        i++;
        continue;
      }

      result += ch;
      i++;
    }

    return result;
  }

  function repairJSON(str) {
    let s = str;
    s = s.replace(/[\r\n]+/g, ' ');                        // 1. 真实换行 → 空格
    s = s.replace(/(\\n)/g, ' ');                           // 2. 字面 \n → 空格
    s = s.replace(/[\u201c\u201d]/g, "'");                  // 3. 中文双引号 "" → 英文单引号
    s = s.replace(/[\u2018\u2019]/g, "'");                  // 4. 中文单引号 '' → 英文单引号
    s = s.replace(/,\s*([}\]])/g, '$1');                    // 5. 删除尾随逗号
    s = s.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');    // 6. 给未加引号的属性名加双引号
    s = s.replace(/:\s*'([^']*)'/g, ': "$1"');              // 7. 单引号值 → 双引号值
    s = fixUnescapedQuotesInValues(s);                      // 8. 修复值内部未转义的双引号
    return s;
  }

  /**
   * 截断修复：补全被 token limit 截断的 JSON
   * 策略：回退到最后一个完整节点的结束位置，然后补全所有未闭合的括号
   */
  function repairTruncated(str) {
    // 先做基础修复
    let s = repairJSON(str);

    // 找到最后一个完整节点（以 ,"node_xxx":{ 或 "node_xxx":{ 开头，以 } 结尾）
    // 策略：从末尾往前找最后一个能让 JSON 合法的截断点
    // 方法：逐步缩短字符串并尝试补全括号解析

    // 统计未闭合的括号和引号
    function getUnclosed(src) {
      let braces = 0;   // {
      let brackets = 0; // [
      let inStr = false;
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === '\\' && inStr) { i++; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === '{') braces++;
        else if (c === '}') braces--;
        else if (c === '[') brackets++;
        else if (c === ']') brackets--;
      }
      return { braces, brackets, inStr };
    }

    // 从末尾向前截断，找到最后一个干净的截断点（逗号前）
    // 最多回退 500 字符
    let candidate = s;
    const maxBacktrack = Math.min(500, s.length);
    for (let trim = 0; trim <= maxBacktrack; trim++) {
      const sub = s.slice(0, s.length - trim);
      const { braces, brackets, inStr } = getUnclosed(sub);
      // 如果当前在字符串中，继续回退
      if (inStr) continue;
      // 去掉末尾的悬挂逗号和空格
      const clean = sub.replace(/,\s*$/, '');
      // 补全未闭合的括号
      const closing = ']'.repeat(Math.max(0, brackets)) + '}'.repeat(Math.max(0, braces));
      candidate = clean + closing;
      try {
        JSON.parse(candidate);
        return candidate; // 成功！
      } catch (_) {
        // 继续回退
      }
    }

    // 实在无法修复，返回原始 repairJSON 结果
    return s;
  }

  /**
   * 单次尝试：调用 AI → 解析 JSON → 校验树结构
   * @returns {{ success: boolean, data, error, warnings? }}
   */
  async function attemptOnce() {
    // ── 调用 AI ──
    let rawContent = "";
    try {
      const result = await callAI({ content: prompt, maxTokens: 16384 });
      if (!result?.content) {
        return { success: false, data: null, error: "AI 返回内容为空" };
      }
      rawContent = result.content.replace(/[\uFFFD\uFFFE\uFFFF]/g, "");
    } catch (err) {
      return { success: false, data: null, error: `网络异常: ${err.message}` };
    }

    // ── 解析 JSON（4 层 fallback）──
    let parsed = null;
    try {
      parsed = JSON.parse(repairJSON(rawContent));
    } catch (_) {
      const stripped = rawContent
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      try {
        parsed = JSON.parse(repairJSON(stripped));
      } catch (e2) {
        const firstBrace = stripped.indexOf("{");
        const lastBrace = stripped.lastIndexOf("}");
        const sliced = firstBrace !== -1
          ? stripped.slice(firstBrace, lastBrace !== -1 ? lastBrace + 1 : undefined)
          : stripped;
        try {
          parsed = JSON.parse(repairJSON(sliced));
        } catch (_e3) {
          try {
            const truncFixed = repairTruncated(firstBrace !== -1 ? stripped.slice(firstBrace) : stripped);
            parsed = JSON.parse(truncFixed);
          } catch (_e4) {
            return {
              success: false,
              data: null,
              error: `JSON 解析失败: ${e2.message}\n原始内容前200字符: ${stripped.slice(0, 200)}`,
            };
          }
        }
      }
    }

    // ── 基础结构校验 ──
    if (!parsed || typeof parsed !== "object") {
      return { success: false, data: null, error: "解析结果不是对象" };
    }
    if (!parsed.nodes || typeof parsed.nodes !== "object") {
      return { success: false, data: null, error: "缺少 nodes 字段" };
    }
    if (!parsed.rootNodeId) {
      return { success: false, data: null, error: "缺少 rootNodeId 字段" };
    }

    // ── 树连通性校验（含自动修复） ──
    const validation = validateTree(parsed.nodes, parsed.rootNodeId);
    if (!validation.valid) {
      return {
        success: false,
        data: parsed,
        error: `树结构校验失败:\n${validation.errors.join("\n")}`,
        warnings: validation.warnings || [],
      };
    }

    const warnings = validation.warnings || [];
    if (warnings.length > 0) {
      parsed._warnings = warnings;
    }
    return { success: true, data: parsed, error: null, warnings };
  }

  // ── 重试循环：最多 MAX_ATTEMPTS 次 ──
  let lastResult = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    lastResult = await attemptOnce();
    if (lastResult.success) {
      if (attempt > 1) {
        // 附带重试次数信息，方便调用方感知
        lastResult.retries = attempt - 1;
      }
      return lastResult;
    }
    // 最后一次失败不再等待
    if (attempt < MAX_ATTEMPTS) {
      // 指数退避：1s、2s
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  // 全部失败，返回最后一次的错误，并标注已重试次数
  return {
    ...lastResult,
    error: `[重试${MAX_ATTEMPTS}次均失败] ${lastResult.error}`,
    retries: MAX_ATTEMPTS - 1,
  };
}

export default {
  buildTreePrompt,
  generateStoryTree,
  validateTree,
  VARIANT_SUFFIXES,
  DEFAULT_CHARACTERS,
  DEFAULT_EPISODES,
};
