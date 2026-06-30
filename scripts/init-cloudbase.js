import cloudbase from '@cloudbase/node-sdk'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 从 server/.env 读取凭证，不硬编码密钥
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../server/.env') })

const ENV_ID = process.env.CLOUDBASE_ENV_ID
const SECRET_ID = process.env.CLOUDBASE_SECRET_ID
const SECRET_KEY = process.env.CLOUDBASE_SECRET_KEY

if (!ENV_ID || !SECRET_ID || !SECRET_KEY) {
  throw new Error('Missing CloudBase credentials in server/.env (CLOUDBASE_ENV_ID / CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY)')
}

// 初始化 CloudBase（EnvId 显式传入）
const app = cloudbase.init({
  env: ENV_ID,
  secretId: SECRET_ID,
  secretKey: SECRET_KEY
})

const db = app.database()

async function initData() {
  console.log('🚀 开始初始化数据...')

  try {
    // ============ 创建剧本 ============
    console.log('\n📚 创建剧本...')
    const dramaResult = await db.collection('afterline').add({
      type: 'drama',
      title: '甜蜜校园',
      description: '一个关于青春恋爱的故事，你将扮演女主角，在校园中与各种性格的男生相遇...',
      cover_url: 'https://s3plus.meituan.net/mcopilot-pub/nocode-task/chenyanbo/ujnj6kjw27ro1feytk76v2lr4ztv2r/ep1_60s.jpg',
      status: 'published',
      metadata: {
        genre: '校园',
        episodes: 5,
        tags: ['恋爱', '校园', '青春']
      },
      created_at: new Date(),
      updated_at: new Date()
    })
    console.log('✅ 剧本创建成功:', dramaResult.id)

    // ============ 创建角色 ============
    console.log('\n👤 创建角色...')
    const characterResult = await db.collection('afterline').add({
      type: 'character',
      drama_id: dramaResult.id,
      name: '沈彦希',
      avatar_url: 'https://s3plus.meituan.net/mcopilot-pub/nocode-task/chenyanbo/ujnj6kjw27ro1feytk76v2lr4ztv2r/ep1_60s.jpg',
      personality: '傲娇、外冷内热、校霸、银灰色头发、桃花眼',
      config: {
        coze_bot_id: 'tgc9jrb524',
        system_prompt: '你是沈彦希，一个傲娇的校霸，银灰色头发，桃花眼。你喜欢女主角但总是嘴硬心软。'
      },
      created_at: new Date()
    })
    console.log('✅ 角色创建成功:', characterResult.id)

    // ============ 创建示例用户 ============
    console.log('\n👤 创建示例用户...')
    const userResult = await db.collection('afterline').add({
      type: 'user',
      device_id: 'demo-device-001',
      nickname: '测试用户',
      avatar_url: '',
      created_at: new Date(),
      updated_at: new Date()
    })
    console.log('✅ 用户创建成功:', userResult.id)

    // ============ 创建示例进度 ============
    console.log('\n📊 创建示例进度...')
    const progressResult = await db.collection('afterline').add({
      type: 'user_progress',
      user_id: userResult.id,
      drama_id: dramaResult.id,
      character_id: characterResult.id,
      current_scene: 'scene_1',
      intimacy_level: 0,
      unlocked_scenes: ['scene_1'],
      choices_made: [],
      created_at: new Date(),
      updated_at: new Date()
    })
    console.log('✅ 进度创建成功:', progressResult.id)

    // ============ 创建示例聊天记录 ============
    console.log('\n💬 创建示例聊天记录...')
    const chatResult = await db.collection('afterline').add({
      type: 'chat_history',
      user_id: userResult.id,
      drama_id: dramaResult.id,
      character_id: characterResult.id,
      session_id: 'demo-session-001',
      messages: [
        {
          role: 'assistant',
          content: '（手机屏幕亮了一下，沈彦希的消息跳出来）\n娇气包，躲哪去了？\n楼下等你十分钟，再不起我就上去掀你被子。',
          timestamp: new Date(),
          metadata: {
            options: [
              '掀开被子爬起来，冲到阳台往下看',
              '回消息怼他，「谁要你等了」',
              '故意慢腾腾收拾，耗够十分钟再下去'
            ]
          }
        }
      ],
      created_at: new Date(),
      updated_at: new Date()
    })
    console.log('✅ 聊天记录创建成功:', chatResult.id)

    console.log('\n🎉 数据初始化完成！')
    console.log('\n📋 使用集合：afterline')
    console.log('  - type: drama (剧本)')
    console.log('  - type: character (角色)')
    console.log('  - type: user (用户)')
    console.log('  - type: user_progress (用户进度)')
    console.log('  - type: chat_history (聊天记录)')

  } catch (err) {
    console.error('❌ 初始化失败:', err)
  }
}

initData()
