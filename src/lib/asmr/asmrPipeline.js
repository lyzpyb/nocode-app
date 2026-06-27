/**
 * asmrPipeline.js
 * ASMR 二创工作流编排引擎
 *
 * 步骤：
 *  1. 生成 ASMR 文本（callAI）
 *  2. 提取 5 个分镜描述（callAI）
 *  3. 生成语音（MiMo TTS）
 *  4. 生成 5 张分镜图片（Seedream 并发）
 *  5. 返回完整结果
 */

import { callAI } from "@/lib/aiClient";
import { generateTTS, generateImage } from "@/lib/recreation/assetGenerator";
import { buildASMRTextPrompt, buildStoryboardExtractPrompt } from "./asmrPrompts";

/**
 * 检查 AbortSignal 是否已取消
 */
function checkAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException("Pipeline cancelled", "AbortError");
  }
}

/**
 * 从 AI 返回中解析 JSON 数组
 * 容忍 markdown 代码块包裹
 */
function parseJSONArray(text) {
  // 去掉可能的 markdown 代码块标记
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    throw new Error("Parsed result is not an array");
  } catch (e) {
    // 尝试从文本中提取第一个 JSON 数组
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Failed to parse storyboard prompts: ${e.message}`);
  }
}

/**
 * 运行 ASMR 二创生成流水线
 *
 * @param {Object} params
 * @param {string} params.episodeSummary   剧情摘要文本
 * @param {string} params.userRequest      用户的场景诉求
 * @param {string} [params.characterCard]  角色卡图片 URL
 * @param {string[]} [params.styleReferences] 风格参考图 URL 数组
 * @param {string} [params.voiceName]      TTS 音色名（默认 '苏打'，男声）
 * @param {Function} params.onProgress     进度回调 (step, percent, message)
 * @param {AbortSignal} [signal]           取消信号
 *
 * @returns {Promise<{
 *   asmrText: string,
 *   audioUrl: string,
 *   storyboardPrompts: string[],
 *   storyboardImages: string[]
 * }>}
 */
export async function runASMRPipeline({
  episodeSummary,
  userRequest,
  characterCard,
  styleReferences,
  voiceName = "苏打",
  onProgress,
}, signal) {
  const progress = (step, percent, message) => {
    try {
      if (typeof onProgress === "function") {
        onProgress(step, percent, message);
      }
    } catch (_) {}
  };

  // ── Step 1: 生成 ASMR 文本 ──────────────────────────────────────────────
  checkAborted(signal);
  progress("text", 0, "正在生成 ASMR 文本...");

  const textPrompt = buildASMRTextPrompt(episodeSummary, userRequest);
  const textResult = await callAI({
    content: textPrompt.user,
    system: textPrompt.system,
    maxTokens: 4096,
    temperature: 0.9,
  });
  const asmrText = textResult.content;

  checkAborted(signal);
  progress("text", 100, "ASMR 文本生成完成");

  // ── Step 2: 提取分镜描述 ────────────────────────────────────────────────
  checkAborted(signal);
  progress("prompts", 0, "正在生成分镜描述...");

  const sbPrompt = buildStoryboardExtractPrompt(asmrText, episodeSummary);
  const sbResult = await callAI({
    content: sbPrompt.user,
    system: sbPrompt.system,
    maxTokens: 2048,
    temperature: 0.7,
  });
  const storyboardPrompts = parseJSONArray(sbResult.content);

  // 确保恰好 5 个
  while (storyboardPrompts.length < 5) {
    storyboardPrompts.push(storyboardPrompts[storyboardPrompts.length - 1] || "A cinematic scene");
  }
  const finalPrompts = storyboardPrompts.slice(0, 5);

  checkAborted(signal);
  progress("prompts", 100, "分镜描述生成完成");

  // ── Step 3: 生成语音 ────────────────────────────────────────────────────
  checkAborted(signal);
  progress("voice", 0, "正在生成语音...");

  // 清理 ASMR 文本中的括号标注和喘息标记，得到纯朗读文本
  const cleanTextForTTS = asmrText
    .replace(/（[^）]*）/g, "")     // 移除中文括号内容
    .replace(/\([^)]*\)/g, "")      // 移除英文括号内容
    .replace(/\{\*[^}]*\*\}/g, "")  // 移除喘息标记
    .replace(/\n{2,}/g, "\n")       // 合并多余空行
    .trim();

  const audioUrl = await generateTTS(cleanTextForTTS, voiceName);

  checkAborted(signal);
  progress("voice", 100, "语音生成完成");

  // ── Step 4: 生成分镜图片（5 张并发）─────────────────────────────────────
  checkAborted(signal);
  progress("images", 0, "正在生成分镜图片...");

  // 构建参考图列表
  const refImages = [];
  if (characterCard) refImages.push(characterCard);
  if (Array.isArray(styleReferences)) {
    refImages.push(...styleReferences.filter(Boolean));
  }

  let completedImages = 0;
  const storyboardImages = await Promise.all(
    finalPrompts.map(async (prompt) => {
      checkAborted(signal);
      try {
        const url = await generateImage(
          prompt,
          refImages.length > 0 ? refImages : null,
          "doubao"
        );
        completedImages++;
        progress("images", Math.round((completedImages / 5) * 100),
          `分镜图片 ${completedImages}/5 完成`);
        return url;
      } catch (err) {
        completedImages++;
        progress("images", Math.round((completedImages / 5) * 100),
          `分镜图片 ${completedImages}/5（失败: ${err.message}）`);
        return null;  // 失败的图片返回 null
      }
    })
  );

  checkAborted(signal);
  progress("done", 100, "全部生成完成！");

  // ── Step 5: 返回结果 ────────────────────────────────────────────────────
  return {
    asmrText,
    audioUrl,
    storyboardPrompts: finalPrompts,
    storyboardImages,
  };
}

export default { runASMRPipeline };
