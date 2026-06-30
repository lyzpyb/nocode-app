import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  getOrCreateUser,
  getDramas,
  getDramaById,
  getCharactersByDramaId,
  getCharacterById,
  getChatHistory,
  addChatMessage,
  clearChatHistory,
  getUserProgress,
  updateUserProgress,
  getAllUserProgress,
} from './cloudbase.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info', 'x-ark-key']
}));

app.use(express.json({ limit: '50mb' }));

// 静态文件
app.use('/storage', express.static(join(__dirname, 'storage'), {
  maxAge: '30d',
  setHeaders: (res) => res.set('Access-Control-Allow-Origin', '*')
}));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ============ 用户 API ============
app.post('/api/user/login', async (req, res) => {
  try {
    const { device_id } = req.body;
    if (!device_id) return res.status(400).json({ error: 'Missing device_id' });
    const user = await getOrCreateUser(device_id);
    // UserContext 期望 user_id 字段
    res.json({ ...user, user_id: user._id });
  } catch (err) {
    console.error('[user/login] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ 剧本 API ============
app.get('/api/dramas', async (req, res) => {
  try {
    const dramas = await getDramas();
    res.json({ dramas });
  } catch (err) {
    console.error('[dramas] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/dramas/:id', async (req, res) => {
  try {
    const data = await getDramaById(req.params.id);
    res.json(Array.isArray(data) ? data[0] || null : data);
  } catch (err) {
    console.error('[dramas/:id] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ 角色 API ============
app.get('/api/characters/:id', async (req, res) => {
  try {
    const data = await getCharacterById(req.params.id);
    const character = Array.isArray(data) ? data[0] || null : data;
    res.json({ character });
  } catch (err) {
    console.error('[characters/:id] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ 聊天记录 API ============
app.get('/api/chat/history', async (req, res) => {
  try {
    const { user_id, drama_id, character_id } = req.query;
    if (!user_id || !drama_id || !character_id) {
      return res.status(400).json({ error: 'Missing query params' });
    }
    const history = await getChatHistory(user_id, drama_id, character_id);
    res.json({ history });
  } catch (err) {
    console.error('[chat/history GET] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/chat/message', async (req, res) => {
  try {
    const { user_id, drama_id, character_id, message } = req.body;
    if (!user_id || !drama_id || !character_id || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    await addChatMessage(user_id, drama_id, character_id, message);
    res.json({ ok: true });
  } catch (err) {
    console.error('[chat/message] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/chat/history', async (req, res) => {
  try {
    const { user_id, drama_id, character_id } = req.body;
    if (!user_id || !drama_id || !character_id) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    await clearChatHistory(user_id, drama_id, character_id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[chat/history DELETE] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ============ 用户进度 API ============
app.get('/api/progress', async (req, res) => {
  try {
    const { user_id, drama_id, character_id } = req.query;
    if (!user_id || !drama_id || !character_id) {
      return res.status(400).json({ error: 'Missing query params' });
    }
    const progress = await getUserProgress(user_id, drama_id, character_id);
    res.json({ progress });
  } catch (err) {
    console.error('[progress GET] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const { user_id, drama_id, character_id, progress } = req.body;
    if (!user_id || !drama_id || !character_id) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    await updateUserProgress(user_id, drama_id, character_id, progress || {});
    res.json({ ok: true });
  } catch (err) {
    console.error('[progress POST] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/progress/all', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
    const progress = await getAllUserProgress(user_id);
    res.json({ progress });
  } catch (err) {
    console.error('[progress/all] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Ark API 代理
app.post('/api/ark/*', async (req, res) => {
  try {
    const subPath = req.path.replace('/api/ark', '');
    const apiKey = req.headers['x-ark-key'] || process.env.ARK_CHAT_KEY;
    
    const arkResp = await fetch(`https://ark.cn-beijing.volces.com/api/v3${subPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await arkResp.text();
    res.status(arkResp.status).set('Content-Type', 'application/json').send(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Coze Agent 代理（使用 stream_run + 新格式）
app.post('/api/coze-agent', async (req, res) => {
  try {
    const { session_id, user_message, project_id } = req.body;
    
    if (!session_id || !user_message) {
      return res.status(400).json({ error: 'Missing session_id or user_message' });
    }

    const COZE_TOKEN = process.env.COZE_TOKEN;
    const COZE_API_URL = 'https://tgc9jrb524.coze.site/stream_run';
    
    console.log(`[Coze-Agent] Session: ${session_id}, Message: ${user_message.substring(0, 50)}...`);

    // 使用新格式发送请求
    const cozeResp = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [
              {
                type: 'text',
                content: {
                  text: user_message
                }
              }
            ]
          }
        },
        type: 'query',
        session_id: session_id,
        project_id: project_id || 7655610175763791914
      }),
    });

    if (!cozeResp.ok) {
      const errText = await cozeResp.text();
      console.error(`[Coze-Agent] API error: ${cozeResp.status}`, errText);
      return res.status(cozeResp.status).json({ 
        error: `Coze API error: ${cozeResp.status}`,
        detail: errText 
      });
    }

    // 读取 SSE 流并拼接 answer
    const reader = cozeResp.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'answer' && data.content?.answer) {
              fullAnswer += data.content.answer;
            }
          } catch (e) {}
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        if (data.type === 'answer' && data.content?.answer) {
          fullAnswer += data.content.answer;
        }
      } catch (e) {}
    }

    console.log(`[Coze-Agent] Answer length: ${fullAnswer.length}`);

    if (!fullAnswer) {
      console.warn('[Coze-Agent] No answer content in response');
      return res.status(500).json({ error: 'Coze Agent 未返回有效内容' });
    }

    res.json({ content: fullAnswer, session_id });

  } catch (err) {
    console.error('[Coze-Agent] Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// OPTIONS 预检
app.options('*', (req, res) => {
  res.status(204).end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
