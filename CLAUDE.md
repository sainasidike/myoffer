# MyOffer — AI 留学申请平台

## 项目概述

MyOffer 是一个 AI 驱动的留学申请平台，**专为双非学生打造**。核心价值：真 AI 能力（非规则匹配）、透明定价（MVP 阶段全免费）、全流程在线。

- **目标用户**：中国双非院校本科生，申请海外硕士/博士
- **核心功能**：AI 对话式信息录入 → AI 智能选校 → 申请管家 → AI 文书创作
- **上线目标**：2026-06-24（12周开发周期）
- **月运营成本**：¥0（所有服务使用免费额度）
- **生产地址**：https://myoffer-taupe.vercel.app
- **GitHub**：https://github.com/sainasidike/myoffer

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript + Vite | 已完成 |
| UI | shadcn/ui (Radix) + Tailwind CSS | 浅色主题，蓝色主色调 |
| 路由 | react-router-dom v6 | 已配置 |
| 数据请求 | @tanstack/react-query | 已配置 |
| 表单 | react-hook-form + zod | 已安装 |
| 后端 | Supabase (PostgreSQL + Auth + Edge Functions + Storage) | 已部署 |
| AI 对话/选校 | 智谱 GLM-4-Flash（免费无限） | OpenAI 兼容格式 |
| AI 文档 OCR | 智谱 GLM-4V（多模态） | 免费额度充足 |
| AI 文书 | 通义千问 qwen-plus（免费 1M tokens/月） | OpenAI 兼容格式，QWEN_API_KEY 待配置 |
| 部署 | Vercel（免费） | 已部署生产环境 |

## Supabase 配置

- **项目 URL**: `https://evumyskbzakiatiagmpq.supabase.co`
- **项目 ID**: `evumyskbzakiatiagmpq`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dW15c2tiemFraWF0aWFnbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDQ3MDMsImV4cCI6MjA5MTEyMDcwM30.w8P3scSa3AtA0TqryqYHW42ONRXLKcSdIUgYT4TH1G8`
- **Publishable Key**: 同上，也在 `src/integrations/supabase/client.ts` 中
- **Edge Functions Secrets 已配置**:
  - `ZHIPU_API_KEY` — 智谱 API Key（已配置，工作正常）
  - `QWEN_API_KEY` — 千问 API Key（**待配置**，文书生成功能需要）

### Edge Functions 部署注意

所有 Edge Functions 必须使用 `--no-verify-jwt` 部署，因为新版 Supabase Auth 使用 ES256 JWT，而 Edge Functions 内置验证期望 HS256：

```bash
npx supabase functions deploy <function-name> --no-verify-jwt --project-ref evumyskbzakiatiagmpq
```

前端请求 Edge Functions 时需同时发送 `apikey` 和 `Authorization` 头：
```typescript
headers: {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${session.access_token}`,
}
```

## 数据库 Schema

### 已创建的表
- `profiles` — 用户档案（含留学申请字段：school, major, gpa, language_score, target_country 等）
- `programs` — 院校项目库（50+ 热门项目已导入）
- `applications` — 用户申请记录
- `application_materials` — 每个申请的材料清单
- `essays` — 文书内容 + 版本管理
- `essay_conversations` — 文书创作对话历史

### RLS 策略
- 所有用户数据表：`auth.uid() = user_id`
- `programs` 表：所有认证用户可读

### 迁移文件
- `supabase/migrations/20260402000001_extend_schema.sql` — 扩展 schema（6张表 + Storage + RLS）
- `supabase/seed/programs.sql` — 院校项目种子数据

## AI 集成架构

### 4 个 Edge Functions（全部已部署）

1. **`onboarding-chat`** — AI 对话式信息采集
   - API: 智谱 GLM-4-Flash
   - 端点: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
   - 功能: 对话式信息采集 + 文档 OCR
   - 关键模式: `<<<PROFILE_UPDATE:{"field":"value"}>>>` 标记提取
   - 部署: `--no-verify-jwt`

2. **`school-matching`** — AI 智能选校
   - API: 智谱 GLM-4-Flash
   - 功能: 数据库预筛选 + AI 评分 + 流式思考过程
   - SSE 输出格式: `{type: "thinking"/"result"/"error", ...}`
   - 前端通过 `callEdgeFunctionSSE()` 消费（非 OpenAI delta 格式）
   - AI 提示中使用 `[ID:uuid]` 格式传递真实数据库 UUID
   - 部署: `--no-verify-jwt`

3. **`essay-generation`** — AI 文书创作
   - API: 通义千问 qwen-plus（**QWEN_API_KEY 待配置**）
   - 端点: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
   - 功能: 多轮对话文书创作 + 版本管理
   - 部署: `--no-verify-jwt`

4. **`signup`** — 用户注册（自动确认邮箱）
   - 使用 `supabase.auth.admin.createUser` + `email_confirm: true`
   - 绕过 Supabase 邮箱确认流程
   - 部署: `--no-verify-jwt`

### AI 调用封装 (`src/lib/ai.ts`)

两个核心函数：
- `callEdgeFunction()` — OpenAI 兼容 SSE 格式（用于 onboarding-chat, essay-generation）
- `callEdgeFunctionSSE()` — 自定义 SSE 事件格式（用于 school-matching）

**注意**：`src/lib/ai.ts` 在 `.gitignore` 中，提交时需 `git add -f src/lib/ai.ts`

### PROFILE_UPDATE 提取模式

AI 在回复末尾嵌入标记，前端自动提取并隐藏：
```
用户回复内容...
<<<PROFILE_UPDATE:{"school":"北京工商大学","gpa":"3.5"}>>>
```
前端用正则 `/<<<PROFILE_UPDATE:(.*?)>>>/g` 提取，清理后显示干净文本。

## 项目结构

```
myoffer/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn 基础组件
│   │   ├── school/             # 选校组件（ProgramCard, StatsBar, ThinkingVisualizer）
│   │   ├── cyber/              # 废弃的赛博朋克组件（未使用）
│   │   ├── AppLayout.tsx       # 主布局（含移动端抽屉侧边栏）
│   │   ├── AppSidebar.tsx      # 侧边栏导航
│   │   ├── NavLink.tsx         # 导航链接
│   │   └── ProtectedRoute.tsx  # 路由守卫
│   ├── contexts/
│   │   └── AuthContext.tsx     # 认证上下文（session + profile）
│   ├── hooks/
│   │   ├── useOnboardingChat.ts  # AI 对话 hook
│   │   ├── useProfile.ts        # 档案 CRUD + 完成度计算
│   │   ├── useSchools.ts        # 选校 + AI 匹配（使用 callEdgeFunctionSSE）
│   │   ├── useApplications.ts   # 申请管理 CRUD
│   │   ├── useEssays.ts         # 文书 CRUD + 对话
│   │   ├── useSchoolMatching.ts  # 选校匹配（旧版，可能未使用）
│   │   ├── useGeminiChat.ts     # 废弃（Gemini API）
│   │   ├── useClaudeChat.ts     # 废弃
│   │   └── useGroqChat.ts       # 废弃
│   ├── lib/
│   │   ├── utils.ts            # cn() 工具函数
│   │   └── ai.ts               # Edge Function 流式调用封装（在 .gitignore 中）
│   ├── pages/
│   │   ├── AuthPage.tsx        # 登录/注册（分屏布局）
│   │   ├── OnboardingChat.tsx  # AI 对话式信息录入
│   │   ├── SchoolMatching.tsx  # AI 智能选校（三列：冲刺/匹配/保底）
│   │   ├── ApplicationTracker.tsx # 申请管家（材料清单 + 进度）
│   │   ├── EssayWriting.tsx    # AI 文书创作（左右分栏：对话+编辑器）
│   │   ├── SettingsPage.tsx    # 用户设置
│   │   ├── Index.tsx           # 重定向到 /onboarding
│   │   └── NotFound.tsx        # 404
│   ├── integrations/supabase/
│   │   ├── client.ts           # Supabase 客户端
│   │   └── types.ts            # TypeScript 类型定义
│   └── App.tsx                 # 路由配置
├── supabase/
│   ├── migrations/             # 数据库迁移（6个文件）
│   ├── seed/programs.sql       # 院校项目种子数据
│   └── functions/              # Edge Functions (Deno)
│       ├── onboarding-chat/    # AI 对话
│       ├── school-matching/    # AI 选校
│       ├── essay-generation/   # AI 文书
│       ├── signup/             # 用户注册
│       ├── claude-chat/        # 废弃
│       ├── deepseek-chat/      # 废弃
│       └── parse-document/     # 文档解析
├── vercel.json                 # Vercel 部署配置（framework: vite）
├── index.html                  # 入口 HTML（中文标题）
└── docs/superpowers/
    ├── specs/                  # 设计文档
    └── plans/                  # 实施计划
```

## 路由

| 路径 | 页面 | 状态 |
|------|------|------|
| `/auth` | 登录/注册 | 已完成 ✅ |
| `/onboarding` | AI 对话式信息录入 | 已完成 ✅ |
| `/schools` | AI 智能选校 | 已完成 ✅ |
| `/applications` | 申请管家 | 已完成 ✅ |
| `/essays` | AI 文书创作 | 已完成 ✅（QWEN_API_KEY 待配置） |
| `/settings` | 用户设置 | 已完成 ✅ |

## 认证

- 使用 Supabase Auth，用户名/密码模式
- 用户名转为假邮箱格式：`username@myoffer.app`
- 注册通过 `signup` Edge Function（`auth.admin.createUser` + `email_confirm: true`）
- 注册后自动登录
- 注册时自动创建 profile（触发器 `on_auth_user_created`）
- 生成用户展示 ID：`U-YYYYMMDD` + 4位随机数

## UI 主题

- **浅色主题**，蓝色主色调（`hsl(221 83% 53%)`）
- 白底 + 灰色边框，干净现代风格
- 移动端响应式：汉堡菜单 + 抽屉式侧边栏
- 聊天气泡：用户蓝底白字，AI 白底灰边卡片
- 使用 Inter 字体

## 关键设计决策

1. **不使用支付系统** — MVP 阶段全免费，降低开发复杂度
2. **智谱 + 千问替代 OpenAI/Claude** — 完全免费，OpenAI 兼容格式切换成本低
3. **Supabase Edge Functions 作为 API 代理** — API Key 存 Secrets，前端零接触
4. **不引入新状态管理库** — React Query + Context 足够
5. **选校算法 = 数据库预筛选 + AI 评分** — 不做纯规则引擎
6. **文书创作双入口** — 从材料清单「去撰写」或从 AI 助手直接触发
7. **双向联动 MVP 简化** — 文书保存时自动更新材料清单状态
8. **Edge Functions 使用 --no-verify-jwt** — ES256 JWT 兼容性

## 用户流程（四阶段）

### 阶段 1：信息录入
注册 → AI 开场对话 → 引导上传材料（成绩单/简历/奖状）→ AI OCR 解析 → 对话式追问 → 生成档案摘要 → 用户确认

### 阶段 2：AI 智能选校
查询 programs 数据库 → 匹配与过滤 → AI 计算录取概率（思考过程可视化）→ 分级展示结果（冲刺/匹配/保底）→ 加入申请列表

### 阶段 3：申请管家
自动初始化材料清单（从 programs.required_materials）→ 项目状态卡片 → 材料 checklist（待完成/进行中/已提交）→ DDL < 7天标红 → 点击「去撰写」跳转文书

### 阶段 4：文书创作
自动新建对话（项目+文书类型）→ AI 读取用户 profile + 院校偏好 → 多轮对话挖掘细节 → 左右分栏（对话+编辑器）→ 版本管理 → 保存联动材料清单

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 8080）
npm run dev

# 构建生产版本
npm run build

# TypeScript 类型检查
npx tsc --noEmit

# 部署 Edge Function（必须 --no-verify-jwt）
npx supabase functions deploy <function-name> --no-verify-jwt --project-ref evumyskbzakiatiagmpq

# 部署所有 Edge Functions
for fn in onboarding-chat school-matching essay-generation signup; do
  npx supabase functions deploy $fn --no-verify-jwt --project-ref evumyskbzakiatiagmpq
done

# 部署到 Vercel
vercel --prod --yes

# 推送到 GitHub
git push origin main

# 生成 Supabase 类型
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts

# 推送数据库迁移
npx supabase db push --linked

# 强制添加 ai.ts（在 .gitignore 中）
git add -f src/lib/ai.ts
```

## 开发进度

### 已完成
- ✅ Sprint 1：数据库 schema、AI 集成、选校匹配
- ✅ Sprint 2：文书生成、申请追踪、文书创作页面
- ✅ QA 测试：全流程 CDP 浏览器自动化测试
- ✅ Edge Functions 部署：onboarding-chat, school-matching, essay-generation, signup
- ✅ Vercel 部署：生产环境上线
- ✅ UI 优化：浅色主题、移动端响应式、全页面视觉优化

### 待完成
- ⬜ 配置 QWEN_API_KEY（文书生成需要）
- ⬜ Git push 到 GitHub（网络问题待解决，本地有未推送 commit）
- ⬜ 自定义域名绑定 Vercel
- ⬜ 清理废弃代码（useGeminiChat, useClaudeChat, useGroqChat, claude-chat, deepseek-chat, cyber/）
- ⬜ 性能优化（代码分割，当前 JS 包 176KB gzipped）
- ⬜ 内测和用户反馈收集

## 开发文档

- **设计规格**: `docs/superpowers/specs/2026-04-02-myoffer-mvp-design.md`
- **Sprint 1 计划**: `docs/superpowers/plans/2026-04-02-myoffer-mvp-sprint1.md`
- **竞品调研**: `~/myoffer-mvp-docs/竞品调研报告.md`
- **完整产品方案**: `~/MyOffer完整产品方案.html`

## 注意事项

- `src/lib/ai.ts` 在 `.gitignore` 中，Git 操作时需 `git add -f`
- Edge Functions 必须 `--no-verify-jwt` 部署
- 前端调 Edge Functions 需 `apikey` + `Authorization` 双头
- `vercel.json` 必须指定 `"framework": "vite"` 否则 Vercel 会误检测为 Python
- GitHub 网络连接偶尔不稳定，可用 `vercel --prod --yes` 直接从本地部署
