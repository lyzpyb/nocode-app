import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Coze Agent 代理
app.post('/api/coze-agent', async (req, res) => {
  try {
    const { session_id, user_message, project_id } = req.body;
    
    if (!session_id || !user_message) {
      return res.status(400).json({ error: 'Missing session_id or user_message' });
    }

    const COZE_TOKEN = process.env.COZE_TOKEN;
    const COZE_API_URL = 'https://tgc9jrb524.coze.site/stream_run';
    
    console.log(`[Coze-Agent] Session: ${session_id}, Message: ${user_message.substring(0, 50)}...`);

    const cozeResp = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: project_id || 7655610175763791914,
        session_id: session_id,
        user_message: user_message,
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
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    // 处理 buffer 中剩余的数据
    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        if (data.type === 'answer' && data.content?.answer) {
          fullAnswer += data.content.answer;
        }
      } catch (e) {}
    }

    if (!fullAnswer) {
      console.warn('[Coze-Agent] No answer content in response');
      return res.status(500).json({ error: 'Coze Agent 未返回有效内容' });
    }

    console.log(`[Coze-Agent] Answer length: ${fullAnswer.length}`);
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
