/**
 * api.js
 * 后端 API 调用封装
 */

const API_BASE = '';

// ============ 用户 API ============

export async function loginOrCreateUser(deviceId) {
  const resp = await fetch(`${API_BASE}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  });
  
  if (!resp.ok) {
    throw new Error(`Login failed: ${resp.status}`);
  }
  
  return resp.json();
}

// ============ 剧本 API ============

export async function getDramas() {
  const resp = await fetch(`${API_BASE}/api/dramas`);
  if (!resp.ok) throw new Error(`Get dramas failed: ${resp.status}`);
  const data = await resp.json();
  return data.dramas;
}

export async function getDramaById(dramaId) {
  const resp = await fetch(`${API_BASE}/api/dramas/${dramaId}`);
  if (!resp.ok) throw new Error(`Get drama failed: ${resp.status}`);
  return resp.json();
}

// ============ 角色 API ============

export async function getCharacterById(characterId) {
  const resp = await fetch(`${API_BASE}/api/characters/${characterId}`);
  if (!resp.ok) throw new Error(`Get character failed: ${resp.status}`);
  const data = await resp.json();
  return data.character;
}

// ============ 聊天记录 API ============

export async function getChatHistory(userId, dramaId, characterId) {
  const params = new URLSearchParams({
    user_id: userId,
    drama_id: dramaId,
    character_id: characterId,
  });
  const resp = await fetch(`${API_BASE}/api/chat/history?${params}`);
  if (!resp.ok) throw new Error(`Get chat history failed: ${resp.status}`);
  const data = await resp.json();
  return data.history;
}

export async function saveChatMessage(userId, dramaId, characterId, message) {
  const resp = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId,
      message,
    }),
  });
  if (!resp.ok) throw new Error(`Save chat message failed: ${resp.status}`);
  return resp.json();
}

export async function clearChatHistory(userId, dramaId, characterId) {
  const resp = await fetch(`${API_BASE}/api/chat/history`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId,
    }),
  });
  if (!resp.ok) throw new Error(`Clear chat history failed: ${resp.status}`);
  return resp.json();
}

// ============ 用户进度 API ============

export async function getUserProgress(userId, dramaId, characterId) {
  const params = new URLSearchParams({
    user_id: userId,
    drama_id: dramaId,
    character_id: characterId,
  });
  const resp = await fetch(`${API_BASE}/api/progress?${params}`);
  if (!resp.ok) throw new Error(`Get progress failed: ${resp.status}`);
  const data = await resp.json();
  return data.progress;
}

export async function updateUserProgress(userId, dramaId, characterId, progress) {
  const resp = await fetch(`${API_BASE}/api/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId,
      progress,
    }),
  });
  if (!resp.ok) throw new Error(`Update progress failed: ${resp.status}`);
  return resp.json();
}

export async function getAllUserProgress(userId) {
  const params = new URLSearchParams({ user_id: userId });
  const resp = await fetch(`${API_BASE}/api/progress/all?${params}`);
  if (!resp.ok) throw new Error(`Get all progress failed: ${resp.status}`);
  const data = await resp.json();
  return data.progress;
}

export default {
  loginOrCreateUser,
  getDramas,
  getDramaById,
  getCharacterById,
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
  getUserProgress,
  updateUserProgress,
  getAllUserProgress,
};
