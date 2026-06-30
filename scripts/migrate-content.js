/**
 * migrate-content.js
 *
 * 将前端硬编码的剧情数据（i18n/zh、i18n/en）迁移进 CloudBase。
 *
 * 设计要点：
 * - 直接 import 数据文件（纯数据、无外部依赖），不做正则解析。
 * - 幂等：每次运行先按 content_* type 清空旧数据，再重新插入，可反复跑。
 * - 同时迁移 zh / en 两套，用 locale 字段区分。
 * - 不触碰 user / chat_history / user_progress 等运行时数据。
 * - 顺带清掉早期初始化脚本塞进去的脏数据（type='drama' / 'character'）。
 *
 * 运行：node scripts/migrate-content.js          （执行迁移）
 *       node scripts/migrate-content.js --dry     （只打印将写入的统计，不写库）
 */
import cloudbase from '@cloudbase/node-sdk'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ---- 凭证：从 server/.env 读取，不硬编码 ----
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../server/.env') })

const ENV_ID = process.env.CLOUDBASE_ENV_ID
const SECRET_ID = process.env.CLOUDBASE_SECRET_ID
const SECRET_KEY = process.env.CLOUDBASE_SECRET_KEY

if (!ENV_ID || !SECRET_ID || !SECRET_KEY) {
  throw new Error('Missing CloudBase credentials in server/.env')
}

const DRY = process.argv.includes('--dry')
const COLLECTION = 'afterline'

// content_* type 列表（迁移目标），外加要清理的脏数据 type
const CONTENT_TYPES = ['content_meta', 'content_drama', 'content_episode', 'content_scene_set', 'content_chat_char']
const STALE_TYPES = ['drama', 'character'] // 早期 init 脚本留下的脏数据

// ---- 数据源 ----
import zhDramas from '../src/i18n/zh/dramas.js'
import enDramas from '../src/i18n/en/dramas.js'
import zhChat from '../src/i18n/zh/chat.js'
import enChat from '../src/i18n/en/chat.js'

const SOURCES = {
  zh: { dramas: zhDramas, chat: zhChat },
  en: { dramas: enDramas, chat: enChat },
}

const app = cloudbase.init({ env: ENV_ID, secretId: SECRET_ID, secretKey: SECRET_KEY })
const db = app.database()
const _ = db.command

/** 把一个 locale 的数据展开成待写入的文档数组 */
function buildDocs(locale) {
  const { dramas, chat } = SOURCES[locale]
  const docs = []
  const now = new Date()

  // 1) 全局 meta（per locale）：drama_order + 各种列表
  docs.push({
    type: 'content_meta',
    locale,
    drama_order: dramas.DRAMA_ORDER || [],
    characters: dramas.CHARACTERS || [],
    featured_roles: dramas.FEATURED_ROLES || [],
    trending: dramas.TRENDING || [],
    caller_info: dramas.CALLER_INFO || null,
    char_bio: dramas.CHAR_BIO || {},
    story_features: dramas.STORY_FEATURES || [],
    created_at: now,
    updated_at: now,
  })

  // 2) 每部短剧一条（VIDEO_MAP: dramaId -> {title, cover, episodes}）
  for (const [dramaId, v] of Object.entries(dramas.VIDEO_MAP || {})) {
    docs.push({
      type: 'content_drama',
      locale,
      drama_id: String(dramaId),
      title: v.title || '',
      cover: v.cover || '',
      episodes: v.episodes || [],
      created_at: now,
      updated_at: now,
    })
  }

  // 3) 每集一条（合并 EPISODE_SUMMARIES + EPISODE_OPENINGS）
  const summaries = chat.EPISODE_SUMMARIES || {}
  const openings = chat.EPISODE_OPENINGS || {}
  const epKeys = new Set([...Object.keys(summaries), ...Object.keys(openings)])
  for (const ep of epKeys) {
    docs.push({
      type: 'content_episode',
      locale,
      ep: Number(ep),
      summary: summaries[ep] || '',
      opening: openings[ep] || null,
      created_at: now,
      updated_at: now,
    })
  }

  // 4) 每个角色的剧情场景集（STORY_SCENES: charId -> [scenes]）
  for (const [charId, scenes] of Object.entries(chat.STORY_SCENES || {})) {
    docs.push({
      type: 'content_scene_set',
      locale,
      char_id: String(charId),
      scenes: scenes || [],
      created_at: now,
      updated_at: now,
    })
  }

  // 5) 聊天角色态（chat.CHARACTERS: charId -> {name, role, level, ...}）
  for (const [charId, info] of Object.entries(chat.CHARACTERS || {})) {
    docs.push({
      type: 'content_chat_char',
      locale,
      char_id: String(charId),
      info: info || {},
      created_at: now,
      updated_at: now,
    })
  }

  return docs
}

/** 删除指定 type 的全部文档（分批，绕过单次 limit） */
async function deleteByTypes(types) {
  let total = 0
  for (const type of types) {
    // 循环删，直到该 type 没有剩余
    while (true) {
      const { data } = await db.collection(COLLECTION).where({ type }).limit(100).get()
      if (!data.length) break
      for (const doc of data) {
        await db.collection(COLLECTION).doc(doc._id).remove()
        total++
      }
      if (data.length < 100) break
    }
  }
  return total
}

async function main() {
  const allDocs = [...buildDocs('zh'), ...buildDocs('en')]

  // 统计
  const stats = {}
  for (const d of allDocs) {
    const k = `${d.type}/${d.locale}`
    stats[k] = (stats[k] || 0) + 1
  }
  console.log('=== 待写入文档统计 ===')
  for (const [k, n] of Object.entries(stats).sort()) console.log(`  ${k}: ${n}`)
  console.log(`  TOTAL: ${allDocs.length}`)

  if (DRY) {
    console.log('\n[DRY RUN] 不写库。')
    return
  }

  console.log('\n=== 清理旧数据 ===')
  const delContent = await deleteByTypes(CONTENT_TYPES)
  const delStale = await deleteByTypes(STALE_TYPES)
  console.log(`  删除 content_* 旧文档: ${delContent}`)
  console.log(`  删除脏数据(drama/character): ${delStale}`)

  console.log('\n=== 写入新数据 ===')
  let written = 0
  for (const doc of allDocs) {
    await db.collection(COLLECTION).add(doc)
    written++
  }
  console.log(`  写入: ${written}`)

  // 验证
  console.log('\n=== 写入后核对 ===')
  for (const type of CONTENT_TYPES) {
    const { total } = await db.collection(COLLECTION).where({ type }).count()
    console.log(`  ${type}: ${total}`)
  }
  console.log('\n✅ 迁移完成')
}

main().catch((e) => {
  console.error('迁移失败:', e)
  process.exit(1)
})
