import cloudbase from '@cloudbase/node-sdk'
import dotenv from 'dotenv'

// cloudbase.js 在 ESM 中会先于 index.js 的 dotenv.config() 执行，
// 因此这里必须自己加载 .env，否则 init 时环境变量为空。
dotenv.config()

const ENV_ID = process.env.CLOUDBASE_ENV_ID
const SECRET_ID = process.env.CLOUDBASE_SECRET_ID
const SECRET_KEY = process.env.CLOUDBASE_SECRET_KEY

if (!ENV_ID || !SECRET_ID || !SECRET_KEY) {
  throw new Error('Missing CloudBase credentials in environment (CLOUDBASE_ENV_ID / CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY)')
}

// 初始化 CloudBase（EnvId 显式传入，不依赖隐式默认）
const app = cloudbase.init({
  env: ENV_ID,
  secretId: SECRET_ID,
  secretKey: SECRET_KEY
})

const db = app.database()

// 使用统一的 afterline 集合
const COLLECTION = 'afterline'

export { db, app }

// ============ 用户操作 ============

export async function getOrCreateUser(deviceId) {
  const { data } = await db.collection(COLLECTION)
    .where({ type: 'user', device_id: deviceId })
    .get()
  
  if (data.length > 0) {
    return data[0]
  }
  
  // 创建新用户
  const result = await db.collection(COLLECTION).add({
    type: 'user',
    device_id: deviceId,
    nickname: '用户' + deviceId.slice(-6),
    created_at: new Date(),
    updated_at: new Date()
  })
  
  return { _id: result.id, type: 'user', device_id: deviceId, nickname: '用户' + deviceId.slice(-6) }
}

// ============ 剧本操作 ============

export async function getDramas() {
  const { data } = await db.collection(COLLECTION)
    .where({ type: 'drama', status: 'published' })
    .orderBy('created_at', 'desc')
    .get()
  return data
}

export async function getDramaById(dramaId) {
  const { data } = await db.collection(COLLECTION).doc(dramaId).get()
  return data
}

// ============ 角色操作 ============

export async function getCharactersByDramaId(dramaId) {
  const { data } = await db.collection(COLLECTION)
    .where({ type: 'character', drama_id: dramaId })
    .get()
  return data
}

export async function getCharacterById(characterId) {
  const { data } = await db.collection(COLLECTION).doc(characterId).get()
  return data
}

// ============ 聊天记录操作 ============

export async function getChatHistory(userId, dramaId, characterId) {
  const { data } = await db.collection(COLLECTION)
    .where({
      type: 'chat_history',
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId
    })
    .get()
  return data.length > 0 ? data[0].messages : []
}

export async function addChatMessage(userId, dramaId, characterId, message) {
  // 查询是否已有记录
  const { data } = await db.collection(COLLECTION)
    .where({
      type: 'chat_history',
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId
    })
    .get()
  
  if (data.length > 0) {
    // 更新现有记录
    await db.collection(COLLECTION).doc(data[0]._id).update({
      messages: db.command.push(message),
      updated_at: new Date()
    })
  } else {
    // 创建新记录
    await db.collection(COLLECTION).add({
      type: 'chat_history',
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId,
      messages: [message],
      created_at: new Date(),
      updated_at: new Date()
    })
  }
}

export async function clearChatHistory(userId, dramaId, characterId) {
  const { data } = await db.collection(COLLECTION)
    .where({
      type: 'chat_history',
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId
    })
    .get()
  
  if (data.length > 0) {
    await db.collection(COLLECTION).doc(data[0]._id).remove()
  }
}

// ============ 用户进度操作 ============

export async function getUserProgress(userId, dramaId, characterId) {
  const { data } = await db.collection(COLLECTION)
    .where({
      type: 'user_progress',
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId
    })
    .get()
  return data.length > 0 ? data[0] : null
}

export async function updateUserProgress(userId, dramaId, characterId, progress) {
  const { data } = await db.collection(COLLECTION)
    .where({
      type: 'user_progress',
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId
    })
    .get()
  
  if (data.length > 0) {
    // 更新现有记录
    await db.collection(COLLECTION).doc(data[0]._id).update({
      ...progress,
      updated_at: new Date()
    })
  } else {
    // 创建新记录
    await db.collection(COLLECTION).add({
      type: 'user_progress',
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId,
      ...progress,
      created_at: new Date(),
      updated_at: new Date()
    })
  }
}

export async function getAllUserProgress(userId) {
  const { data } = await db.collection(COLLECTION)
    .where({ type: 'user_progress', user_id: userId })
    .get()
  return data
}
