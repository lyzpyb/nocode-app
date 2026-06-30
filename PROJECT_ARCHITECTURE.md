# Afterline 项目架构

> AI 互动短剧 App。React 前端 + Express 后端 + 腾讯云 CloudBase（Serverless 文档数据库）。
> 部署在腾讯云服务器，Caddy 反代。GitHub: lyzpyb/nocode-app（master 分支）。

---

## 📁 项目结构

```
nocode/
├── server/                       # 后端服务（Express + CloudBase SDK）
│   ├── index.js                  # 服务器主入口，所有 API 路由
│   ├── cloudbase.js              # CloudBase SDK 封装（用户/聊天/进度/内容读写）
│   ├── .env                      # 环境变量（凭证，gitignore）
│   ├── .env.example              # 环境变量模板（可提交）
│   └── package.json              # 后端依赖
│
├── scripts/                      # 运维/迁移脚本
│   ├── init-cloudbase.js         # 初始化数据（读 server/.env，不硬编码密钥）
│   └── migrate-content.js        # 内容迁移：前端 i18n 剧情 → CloudBase（幂等）
│
├── src/                          # 前端源码
│   ├── main.jsx                  # 入口（AfterlineProvider + UserProvider）
│   ├── App.jsx                   # 路由
│   ├── contexts/
│   │   ├── AfterlineContext.jsx  # SDK 就绪标记（空壳）
│   │   └── UserContext.jsx       # 用户登录 + 进度（设备 ID，调用后端 API）
│   ├── lib/
│   │   ├── aiClient.js           # AI API 客户端
│   │   └── api.js                # 后端 API 调用封装
│   ├── i18n/
│   │   ├── index.jsx             # LocaleProvider + useLocale（含远端内容 overlay）
│   │   ├── contentAdapter.js     # 把后端扁平内容还原成静态 i18n 结构 + 完整度校验
│   │   ├── zh/ , en/             # 中英文静态数据（strings/dramas/chat）
│   ├── pages/                    # 页面组件
│   └── components/               # UI 组件
│
├── dist/                         # 前端构建产物（Caddy 直接服务此目录）
└── vite.config.js                # Vite 配置（@ 别名）
```

> 注：Caddyfile 实际生效的是 `/etc/caddy/Caddyfile`，root 指向 `/home/ubuntu/nocode/dist`。
> 项目根目录下的 `Caddyfile` 只是副本，不生效——改配置要改 `/etc/caddy/`。

---

## 🔧 后端 API（server/index.js，端口 3000）

### 代理 / 健康
| 路径 | 方法 | 功能 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/ark/*` | POST | Ark API 代理（字节 AI） |
| `/api/coze-agent` | POST | Coze Bot 代理（stream_run，多轮对话） |

### 用户 / 聊天 / 进度（运行时数据，CloudBase 读写）
| 路径 | 方法 | 功能 |
|------|------|------|
| `/api/user/login` | POST | 登录/创建用户（设备 ID，返回含 user_id） |
| `/api/chat/history` | GET / DELETE | 读取 / 清空聊天记录 |
| `/api/chat/message` | POST | 追加聊天消息 |
| `/api/progress` | GET / POST | 读取 / 更新单条进度 |
| `/api/progress/all` | GET | 读取用户全部进度 |

### 内容 API（只读，按 locale，数据由 migrate-content.js 灌入）
| 路径 | 方法 | 功能 |
|------|------|------|
| `/api/content/all` | GET | 一次拿齐某 locale 全部内容（前端 overlay 接入点） |
| `/api/content/meta` | GET | drama_order / 角色卡 / 推荐位 / 热榜 / char_bio |
| `/api/content/dramas` | GET | 短剧列表（含视频 URL） |
| `/api/content/episodes` | GET | 剧集（梗概 + 互动开场） |
| `/api/content/scenes` | GET | 分支剧情树 |
| `/api/content/chat-chars` | GET | 聊天角色态（好感度/等级） |

> `/api/dramas`、`/api/dramas/:id`、`/api/characters/:id` 也存在（早期单条读取），
> 但当前内容主链路走 `/api/content/*`。

---

## 🗄️ 数据库（CloudBase 单集合 `afterline`，按 type 区分）

| type | 用途 | 来源 |
|------|------|------|
| `user` | 用户（设备 ID） | 运行时 |
| `chat_history` | 聊天记录 | 运行时 |
| `user_progress` | 用户进度 | 运行时 |
| `content_meta` | 全局列表（每 locale 一条） | migrate-content.js |
| `content_drama` | 短剧 + 视频 URL | migrate-content.js |
| `content_episode` | 剧集梗概 + 开场 | migrate-content.js |
| `content_scene_set` | 分支剧情树 | migrate-content.js |
| `content_chat_char` | 聊天角色态 | migrate-content.js |

环境: `cyb-cloudbase-d5g19w0dac2e94bfa`。凭证从 `server/.env` 读取，不硬编码。

> 中英文是两套**不同的剧本**（中文沈彦希校园线 / 英文 Kane 奇幻线），
> 各自完整，并非同一故事的两种翻译。集数/角色不对称是设计如此，不是缺数据。

---

## 🎨 前端内容加载策略（渐进式 overlay + 静态兜底）

```
组件 useLocale().dramas / .chat
        │
        ▼
LocaleProvider
  ├── 首屏：静态 i18n 数据（src/i18n/zh|en）── 立即可用，绝不退化
  └── 后台：fetch /api/content/all
            → contentAdapter 还原成静态结构 + 完整度校验
            → 校验通过才覆盖；失败/数据不全 → 保持静态兜底
```

核心红线：**API 数据完整度 < 静态数据时一律回落**，最坏情况等于纯静态现状。
已验证：手动停后端后前端仍正常渲染（控制台打回落警告）。

---

## 🌐 部署架构

```
浏览器
  │
  ▼
Caddy (端口 80)  ── /etc/caddy/Caddyfile
  ├── 静态文件: /home/ubuntu/nocode/dist
  ├── /storage/* → server/storage（外部 CDN 资源除外）
  └── /api/*, /health, /functions/* → localhost:3000
  │
  ▼
Node.js Express (端口 3000) ── PM2 守护（进程名 afterline-api，已 pm2 save）
  │
  ▼
腾讯云 CloudBase（集合 afterline）
```

视频/图片走外部 CDN（s3plus.meituan.net 等），不在部署包内，URL 硬编码在数据里——不要随意改。

---

## ✅ 已完成

1. CloudBase 接入（用户/聊天/进度 CRUD）
2. 用户登录（设备 ID）+ 进度持久化（UserProvider）
3. Coze Bot 多轮对话
4. 前端 API 接入（剧情 overlay + 静态回落）
5. 剧情内容迁移到 CloudBase（5 剧 / 32 集 / 剧情树 / 中英文）
6. 只读内容 API
7. 后端 PM2 守护 + 前端部署

## 🚧 待完成

1. 生产日志/监控（PM2 日志轮转、错误告警）
2. 内容后台编辑能力（目前改剧情需跑 migrate 脚本）
