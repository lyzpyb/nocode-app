/**
 * aiClient.js
 * 统一 AI 文本生成客户端
 * 已移除 Supabase 依赖，改为调用自建后端
 */

const API_BASE = '';

export async function callAI({ content, system, model, maxTokens, temperature, stream = false }) {
  if (!content) throw new Error('callAI: content is required');

  const fullContent = system ? `${system}\n\n${content}` : content;

  const body = {
    model: model || 'doubao-1-5-pro-32k-250115',
    messages: [{ role: 'user', content: fullContent }],
    stream: stream
  };
  if (maxTokens) body.max_tokens = maxTokens;
  if (temperature !== undefined) body.temperature = temperature;

  const resp = await fetch(`${API_BASE}/api/ark/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI 调用失败: ${resp.status} ${errText}`);
  }

  const json = await resp.json();
  const result = json?.choices?.[0]?.message?.content;
  if (!result) {
    throw new Error('AI 返回数据中无 content');
  }

  return { content: result, raw: json };
}

export async function callCozeAgent({ text, sessionId, signal }) {
  if (!text) throw new Error('callCozeAgent: text is required');
  if (!sessionId) throw new Error('callCozeAgent: sessionId is required');

  const resp = await fetch(`${API_BASE}/api/coze-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_message: text,
    }),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Coze Agent 调用失败: ${resp.status} ${errText}`);
  }

  const data = await resp.json();
  return { content: data.content || '', sessionId };
}

export default { callAI, callCozeAgent };
