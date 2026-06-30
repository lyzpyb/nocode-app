import { getDB, isMemoryMode, getMemoryStore } from './db.js'
import { ObjectId } from 'mongodb'

// 生成内存存储的 ID
let memoryIdCounter = 0
function generateMemoryId() {
  return `mem_${++memoryIdCounter}_${Date.now()}`
}

// ============ 用户相关 ============

export async function createUser(userData) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    const user = {
      _id: generateMemoryId(),
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    }
    store.users.push(user)
    return user
  }

  const db = getDB()
  const user = {
    ...userData,
    created_at: new Date(),
    updated_at: new Date()
  }
  const result = await db.collection('users').insertOne(user)
  return { ...user, _id: result.insertedId }
}

export async function getUserById(userId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.users.find(u => u._id === userId)
  }

  const db = getDB()
  return await db.collection('users').findOne({ _id: new ObjectId(userId) })
}

export async function getUserByDeviceId(deviceId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.users.find(u => u.device_id === deviceId)
  }

  const db = getDB()
  return await db.collection('users').findOne({ device_id: deviceId })
}

// ============ 剧本相关 ============

export async function getDramas(filter = {}) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.dramas.filter(d => d.status === 'published' || filter.status === d.status)
  }

  const db = getDB()
  return await db.collection('dramas')
    .find({ status: 'published', ...filter })
    .sort({ created_at: -1 })
    .toArray()
}

export async function getDramaById(dramaId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.dramas.find(d => d._id === dramaId)
  }

  const db = getDB()
  return await db.collection('dramas').findOne({ _id: new ObjectId(dramaId) })
}

export async function createDrama(dramaData) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    const drama = {
      _id: generateMemoryId(),
      ...dramaData,
      status: dramaData.status || 'draft',
      created_at: new Date(),
      updated_at: new Date()
    }
    store.dramas.push(drama)
    return drama
  }

  const db = getDB()
  const drama = {
    ...dramaData,
    status: dramaData.status || 'draft',
    created_at: new Date(),
    updated_at: new Date()
  }
  const result = await db.collection('dramas').insertOne(drama)
  return { ...drama, _id: result.insertedId }
}

export async function updateDrama(dramaId, updateData) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    const index = store.dramas.findIndex(d => d._id === dramaId)
    if (index !== -1) {
      store.dramas[index] = { ...store.dramas[index], ...updateData, updated_at: new Date() }
      return store.dramas[index]
    }
    return null
  }

  const db = getDB()
  const result = await db.collection('dramas').findOneAndUpdate(
    { _id: new ObjectId(dramaId) },
    { $set: { ...updateData, updated_at: new Date() } },
    { returnDocument: 'after' }
  )
  return result
}

// ============ 角色相关 ============

export async function getCharactersByDramaId(dramaId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.characters.filter(c => c.drama_id === dramaId)
  }

  const db = getDB()
  return await db.collection('characters')
    .find({ drama_id: dramaId })
    .toArray()
}

export async function getCharacterById(characterId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.characters.find(c => c._id === characterId)
  }

  const db = getDB()
  return await db.collection('characters').findOne({ _id: new ObjectId(characterId) })
}

export async function createCharacter(characterData) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    const character = {
      _id: generateMemoryId(),
      ...characterData,
      created_at: new Date(),
      updated_at: new Date()
    }
    store.characters.push(character)
    return character
  }

  const db = getDB()
  const character = {
    ...characterData,
    created_at: new Date(),
    updated_at: new Date()
  }
  const result = await db.collection('characters').insertOne(character)
  return { ...character, _id: result.insertedId }
}

// ============ 聊天记录相关 ============

export async function getChatHistory(userId, dramaId, characterId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.chat_history.find(
      h => h.user_id === userId && h.drama_id === dramaId && h.character_id === characterId
    )
  }

  const db = getDB()
  return await db.collection('chat_history').findOne({
    user_id: userId,
    drama_id: dramaId,
    character_id: characterId
  })
}

export async function addChatMessage(userId, dramaId, characterId, message) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    let history = store.chat_history.find(
      h => h.user_id === userId && h.drama_id === dramaId && h.character_id === characterId
    )
    
    if (!history) {
      history = {
        _id: generateMemoryId(),
        user_id: userId,
        drama_id: dramaId,
        character_id: characterId,
        session_id: message.session_id,
        messages: [],
        created_at: new Date(),
        updated_at: new Date()
      }
      store.chat_history.push(history)
    }

    history.messages.push({
      ...message,
      timestamp: new Date()
    })
    history.updated_at = new Date()
    return history
  }

  const db = getDB()
  const result = await db.collection('chat_history').updateOne(
    {
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId
    },
    {
      $push: {
        messages: {
          ...message,
          timestamp: new Date()
        }
      },
      $set: { updated_at: new Date() },
      $setOnInsert: {
        user_id: userId,
        drama_id: dramaId,
        character_id: characterId,
        session_id: message.session_id,
        created_at: new Date()
      }
    },
    { upsert: true }
  )
  return result
}

export async function clearChatHistory(userId, dramaId, characterId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    const index = store.chat_history.findIndex(
      h => h.user_id === userId && h.drama_id === dramaId && h.character_id === characterId
    )
    if (index !== -1) {
      store.chat_history.splice(index, 1)
    }
    return { deletedCount: index !== -1 ? 1 : 0 }
  }

  const db = getDB()
  return await db.collection('chat_history').deleteOne({
    user_id: userId,
    drama_id: dramaId,
    character_id: characterId
  })
}

// ============ 用户进度相关 ============

export async function getUserProgress(userId, dramaId, characterId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.user_progress.find(
      p => p.user_id === userId && p.drama_id === dramaId && p.character_id === characterId
    )
  }

  const db = getDB()
  return await db.collection('user_progress').findOne({
    user_id: userId,
    drama_id: dramaId,
    character_id: characterId
  })
}

export async function updateUserProgress(userId, dramaId, characterId, progress) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    let existing = store.user_progress.find(
      p => p.user_id === userId && p.drama_id === dramaId && p.character_id === characterId
    )
    
    if (!existing) {
      existing = {
        _id: generateMemoryId(),
        user_id: userId,
        drama_id: dramaId,
        character_id: characterId,
        created_at: new Date()
      }
      store.user_progress.push(existing)
    }

    Object.assign(existing, progress, { updated_at: new Date() })
    return existing
  }

  const db = getDB()
  const result = await db.collection('user_progress').updateOne(
    {
      user_id: userId,
      drama_id: dramaId,
      character_id: characterId
    },
    {
      $set: {
        ...progress,
        updated_at: new Date()
      },
      $setOnInsert: {
        user_id: userId,
        drama_id: dramaId,
        character_id: characterId,
        created_at: new Date()
      }
    },
    { upsert: true }
  )
  return result
}

export async function getAllUserProgress(userId) {
  if (isMemoryMode()) {
    const store = getMemoryStore()
    return store.user_progress.filter(p => p.user_id === userId)
  }

  const db = getDB()
  return await db.collection('user_progress')
    .find({ user_id: userId })
    .toArray()
}
