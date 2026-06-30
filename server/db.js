import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI

let client = null
let db = null
let useMemory = false

// 内存存储（fallback）
const memoryStore = {
  users: [],
  dramas: [],
  characters: [],
  chat_history: [],
  user_progress: []
}

export async function connectDB() {
  if (db) return db

  // 如果没有配置 MongoDB URI，使用内存存储
  if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/afterline') {
    console.log('⚠️  Using in-memory storage (MongoDB not configured)')
    useMemory = true
    return null
  }

  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    db = client.db('afterline')
    console.log('✅ Connected to MongoDB')
    return db
  } catch (err) {
    console.error('❌ MongoDB connection error:', err)
    console.log('⚠️  Falling back to in-memory storage')
    useMemory = true
    return null
  }
}

export function getDB() {
  if (useMemory) return null
  if (!db) throw new Error('Database not connected')
  return db
}

export function isMemoryMode() {
  return useMemory
}

export function getMemoryStore() {
  return memoryStore
}

export async function closeDB() {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
