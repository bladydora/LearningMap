# LearningMap · 代码文件说明

## 文件结构（复制到 Cursor 项目的对应位置）

```
learningmap/                      ← 你的 Cursor 项目根目录
├── src/
│   ├── middleware.ts              ← 路由保护（拦截未登录）
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         ← 浏览器端 Supabase 客户端
│   │   │   └── server.ts         ← 服务端 Supabase 客户端
│   │   ├── llm.ts                ← Gemini API 调用封装
│   │   ├── parseAIResponse.ts    ← 解析 <response>/<update> 标签
│   │   └── getProfile.ts         ← 拉取并格式化用户档案
│   └── app/
│       ├── page.tsx              ← 首页（对话界面）
│       ├── login/
│       │   └── page.tsx          ← 登录页
│       └── api/
│           ├── chat/
│           │   └── route.ts      ← 核心路由（主链路）
│           └── profile/
│               └── route.ts      ← 档案读取路由
└── .env.local                    ← 按 .env.local.example 填写
```

## 安装步骤

### 1. 安装依赖

在 Cursor 终端运行：

```bash
npm install @google/generative-ai
npm install @supabase/ssr @supabase/supabase-js
```

### 2. 配置环境变量

把 `.env.local.example` 复制为 `.env.local`，填入：
- Supabase URL 和 anon key（Supabase 控制台 Settings > API）
- Gemini API Key（https://aistudio.google.com/app/apikey）

### 3. 把代码文件复制到 Cursor 项目

按上方文件结构，把每个文件复制到 Cursor 项目的对应位置。
（需要手动创建 src/lib/supabase/ 和 src/app/login/ 等子目录）

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000，会自动跳转到登录页。

### 5. 登录测试

用 Supabase 里创建的 BD 账号登录，然后在对话框里发一条消息测试。

---

## 数据流说明

```
用户输入
  ↓
/api/chat (route.ts)
  ↓ 1. 验证登录
  ↓ 2. 拉取档案 (getProfile.ts)
  ↓ 3. 注入 Prompt + 调用 Gemini (llm.ts)
  ↓ 4. 解析 <response>/<update> (parseAIResponse.ts)
  ↓ 5. 写入 Supabase (profile_assessments + evidence_logs + conversations)
  ↓
返回 { response, updates } 给前端
```
