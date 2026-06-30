# Nocode 项目代码梳理

## 📁 项目结构

```
nocode/
├── server/                      # 后端服务
│   ├── index.js                 # Express 服务器主入口
│   ├── cloudbase.js             # CloudBase SDK 数据库操作模块
│   ├── .env                     # 环境变量（API keys）
│   └── package.json             # 后端依赖
│
├── src/                         # 前端源码
│   ├── App.jsx                  # 主应用组件（路由）
│   ├── main.jsx                 # 入口文件
│   ├── nav-items.jsx            # 路由配置
│   ├── contexts/
│   │   └── AfterlineContext.jsx # 全局状态
│   ├── lib/
│   │   └── aiClient.js          # AI API 客户端
│   ├── pages/                   # 页面组件
│   │   ├── Index.jsx            # 首页（短剧展示）
│   │   ├── Chat.jsx             # 聊天页面
│   │   ├── Player.jsx           # 播放器
│   │   └── ...
│   ├── components/              # UI 组件
│   └── i18n/                    # 国际化
│
├── dist/                        # 前端构建产物
├── Caddyfile                    # Caddy 反代配置
├── package.json                 # 前端依赖
└── vite.config.js               # Vite 配置
```

---

## 🔧 后端架构

### 服务器 (server/index.js)
- **框架**: Express
- **端口**: 3000
- **数据库**: 腾讯云 CloudBase (Serverless MongoDB)

### API 端点

| 路径 | 方法 | 功能 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/user/login` | POST | 用户登录（设备ID） |
| `/api/dramas` | GET | 获取剧本列表 |
| `/api/dramas/:id` | GET | 获取剧本详情 |
| `/api/characters/:id` | GET | 获取角色详情 |
| `/api/chat/history` | GET | 获取聊天历史 |
| `/api/chat/message` | POST | 保存聊天消息 |
| `/api/chat/history` | DELETE | 清空聊天历史 |
| `/api/progress` | GET | 获取用户进度 |
| `/api/progress` | POST | 更新用户进度 |
| `/api/progress/all` | GET | 获取用户所有进度 |
| `/api/coze-agent` | POST | Coze AI Agent 代理 |
| `/api/ark/*` | POST | Ark API 代理（字节 AI） |

### 数据库模块 (server/cloudbase.js)
- **集合**: `afterline`（统一集合）
- **数据类型**: 
  - `drama` - 剧本
  - `character` - 角色
  - `user` - 用户
  - `chat_history` - 聊天记录
  - `user_progress` - 用户进度

---

## 🎨 前端架构

### 路由结构

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Landing | 展示页/落地页 |
| `/drama` | Player | A版（短剧版） |
| `/full` | Index | B版（完整版首页） |
| `/discover` | Discover | 追剧 |
| `/crave` | Crave | 圈子 |
| `/community` | Community | 社区 |
| `/profile` | Profile | 我的 |
| `/player/:id` | Player | 播放器 |
| `/chat/:dramaId/:charId` | Chat | 聊天 |
| `/gallery/:dramaId` | Gallery | 图库 |
| `/call/:dramaId` | Call | 通话 |
| `/video-create/:dramaId/:ep` | VideoCreate | 视频创作 |
| `/interactive-player` | InteractivePlayer | 互动播放器 |
| `/comic-demo` | ComicDemo | 漫剧Demo |
| `/recreation` | RecreationPlayer | 互动影游 |
| `/create-hub` | CreateHub | 创作中心 |
| `/hotspring` | HotspringGame | 温泉危机游戏 |

### 核心模块

1. **AfterlineContext** - 全局状态管理
2. **aiClient.js** - AI API 统一调用
3. **Chat.jsx** - 聊天页面（核心功能）
4. **Index.jsx** - 首页（剧本展示）

---

## 🌐 部署架构

```
用户浏览器
    │
    ▼
┌─────────────────────────────────────┐
│  Caddy (端口 80)                    │
│  - 静态文件服务 (前端 dist/)         │
│  - API 反向代理 → localhost:3000    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Node.js (端口 3000)                │
│  - Express 服务器                   │
│  - CloudBase SDK                    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  腾讯云 CloudBase                   │
│  环境: cyb-cloudbase-d5g19w0dac2e94bfa │
│  集合: afterline                    │
└─────────────────────────────────────┘
```

---

## 📊 数据流

### 聊天功能
```
用户输入 → Chat.jsx → aiClient.callCozeAgent()
    → /api/coze-agent → Coze Bot API
    → 返回 AI 回复 → 显示在聊天界面
    → 保存到 CloudBase (chat_history)
```

### 剧本加载
```
首页加载 → /api/dramas → CloudBase 查询
    → 返回剧本列表 → 渲染 RoleCard 组件
    → 点击进入 → /chat/:dramaId/:charId
```

---

## ⚙️ 配置文件

### 环境变量 (server/.env)
```
CLOUDBASE_ENV_ID=cyb-cloudbase-d5g19w0dac2e94bfa
CLOUDBASE_SECRET_ID=AKIDxxxxx
CLOUDBASE_SECRET_KEY=xxxxx
COZE_TOKEN=xxxxx
ARK_CHAT_KEY=xxxxx
```

### Caddy 配置
- 前端静态文件: `/home/ubuntu/afterline/dist`
- API 代理: `/api/*` → `localhost:3000`

---

## 🔍 关键文件

| 文件 | 用途 |
|------|------|
| `server/index.js` | 后端入口，所有 API 路由 |
| `server/cloudbase.js` | 数据库操作封装 |
| `src/App.jsx` | 前端路由配置 |
| `src/pages/Chat.jsx` | 核心聊天页面 |
| `src/lib/aiClient.js` | AI API 调用封装 |
| `Caddyfile` | 反向代理配置 |

---

## ✅ 已完成功能

1. ✅ CloudBase 数据库接入
2. ✅ 剧本和角色数据初始化
3. ✅ Coze Bot 多轮对话修复
4. ✅ 用户登录（设备ID）
5. ✅ 聊天记录保存
6. ✅ 用户进度保存
7. ✅ 前端部署到服务器

## 🚧 待完成

1. 前端调用后端 API（目前使用硬编码数据）
2. 用户进度同步到数据库
3. 生产环境优化（PM2、日志）
