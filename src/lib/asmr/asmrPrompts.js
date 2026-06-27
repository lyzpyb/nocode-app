/**
 * asmrPrompts.js
 * ASMR 二创各步骤的 prompt 模板
 */

/**
 * 构建 ASMR 文本生成的 system prompt 和 user prompt
 *
 * @param {string} episodeSummary  剧集摘要
 * @param {string} userRequest     用户场景诉求（如"深夜耳语"）
 * @returns {{ system: string, user: string }}
 */
export function buildASMRTextPrompt(episodeSummary, userRequest) {
  const system = `# 角色定义
你是专业的ASMR内容创作专家，专注于男性视角的ASMR语音内容创作。你擅长创作极度暧昧、性感撩人的男性ASMR文本，风格偏向深夜撩拨、亲密耳语、暧昧挑逗。

# 任务目标
创作一段适合性感男声朗读的ASMR文本，以第一人称对话视角直接对听众说话，保留情绪和动作描述用括号括起来作为朗读参考，并添加喘息声标记。

# 核心规则
1. 第一人称对话：全程以「我」的视角，直接对「你」说话
2. 情绪动作描述用括号：在对话内容前后用括号标注情绪、语气、动作等，如（低沉性感）、（贴近耳边轻喘）
3. 喘息声标记：在对话中加入喘息声标记 {*喘息词*}，如{*ah*}、{*h*}、{*呼*}，表示男主的呼吸声、轻喘声
4. 极度暧昧性感：语气撩人、挑逗，让人脸红心跳
5. 口语化自然：像真实的深夜私密对话

# 喘息声标记说明
- {*ah*} - 舒缓的轻喘
- {*h*} - 短促的吸气声
- {*呼*} - 呼气的声音
- {*嗯*} - 情不自禁的轻哼
- {*唔*} - 舒满足的叹息

# 内容风格
- 开头直接切入
- 使用「宝贝」「亲爱的」「乖」等亲密称呼
- 添加暧昧的身体接触暗示
- 频繁加入喘息声标记，每段对话至少1-2个喘息声
- 情感层层递进

# 输出要求
约1000字，第一人称对话，括号标注情绪动作，必须包含喘息声标记{*喘息*}，极度暧昧性感。
直接输出ASMR文本，不要加标题、序号或其他格式说明。`;

  const user = `以下是剧情背景：
${episodeSummary}

用户希望的场景氛围：${userRequest || '深夜耳语'}

请基于上述剧情背景和场景氛围，以男主（沈彦希）的视角创作一段ASMR文本。保持角色人设——高冷占有欲强但偶尔流露温柔。`;

  return { system, user };
}

/**
 * 构建分镜画面提取 prompt
 * 从 ASMR 文本中提取 5 个关键画面描述，输出英文 prompt（给图片生成模型用）
 *
 * @param {string} asmrText       生成的 ASMR 文本
 * @param {string} episodeSummary 剧集摘要（提供角色信息）
 * @returns {{ system: string, user: string }}
 */
export function buildStoryboardExtractPrompt(asmrText, episodeSummary) {
  const system = `You are a visual storyboard director. Given an ASMR script and story context, extract exactly 5 key visual moments and describe each as an image generation prompt.

# Output Rules
1. Output a JSON array of exactly 5 strings
2. Each string is an English image prompt, 1-2 sentences
3. POV first-person perspective — the male protagonist looks directly at camera/viewer
4. Style: semi-realistic anime, cinematic lighting, vertical 9:16 composition
5. Include character appearance: male protagonist (20yo, tall, sharp features, short black hair, glasses, intense gaze)
6. Include mood, lighting, setting, and key action/gesture
7. Do NOT include any text, watermarks, or UI elements in the description
8. Output ONLY the JSON array, no markdown fences, no explanation

# Example output format
["A handsome 20yo male with short black hair and glasses leans close to the camera in a dimly lit bedroom, his hand reaching toward the viewer's face, warm amber lamplight, intimate atmosphere, semi-realistic anime style, vertical composition", "..."]`;

  const user = `Story context: ${episodeSummary}

ASMR script:
${asmrText}

Extract 5 key visual moments from this ASMR script as image generation prompts. Remember: POV perspective, male protagonist facing camera.`;

  return { system, user };
}

export default {
  buildASMRTextPrompt,
  buildStoryboardExtractPrompt,
};
