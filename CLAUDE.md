# MyOffer — AI 留学申请平台

## 项目概述

MyOffer 是一个 AI 驱动的留学申请平台，**专为双非学生打造**。核心价值：真 AI 能力（非规则匹配）、透明定价（MVP 阶段全免费）、全流程在线。

- **目标用户**：中国双非院校本科生，申请海外硕士/博士
- **核心功能**：AI 对话式信息录入 → AI 智能选校 → 申请管家 → AI 文书创作
- **上线目标**：2026-06-24（12周开发周期）
- **月运营成本**：¥0（所有服务使用免费额度）
- **生产地址**：https://myoffer-taupe.vercel.app
- **GitHub**：https://github.com/sainasidike/myoffer
- **最后更新**：2026-04-10（第三次更新，含交互修复 + 选校渲染修复 + Profile 实时刷新）

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18.3.1 + TypeScript 5.8.3 + Vite 5.4.19 | SPA 架构 |
| UI | shadcn/ui (Radix) + Tailwind CSS 3.4.17 | 浅色主题，蓝色主色调 |
| 路由 | react-router-dom v6.30.1 | 6 个页面路由 |
| 数据请求 | @tanstack/react-query v5.83.0 | 缓存 + 自动刷新 |
| 表单 | react-hook-form 7.61.1 + zod 3.25.76 | 验证 |
| 动画 | framer-motion 12.38.0 | 页面过渡 |
| Markdown | react-markdown 10.1.0 | 聊天消息渲染 |
| 图标 | lucide-react 0.462.0 | 全站图标 |
| 后端 | Supabase (PostgreSQL + Auth + Edge Functions + Storage) | 已部署 |
| AI 对话/选校 | 智谱 GLM-4-Flash（免费无限） | OpenAI 兼容格式 |
| AI 文档解析（图片） | 智谱 GLM-4V（多模态） | 免费额度充足 |
| AI 文档解析（PDF/Word） | 智谱 GLM-4-Flash + unpdf | PDF文本提取后送AI分析 |
| AI 文书 | 通义千问 qwen-plus（免费 1M tokens/月） | **QWEN_API_KEY 待配置** |
| 部署 | Vercel（免费） | 已部署生产环境 |
| 测试 | Vitest 3.2.4 + Playwright 1.57.0 + Testing Library | 已安装 |

## Supabase 配置

- **项目 URL**: `https://evumyskbzakiatiagmpq.supabase.co`
- **项目 ID**: `evumyskbzakiatiagmpq`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dW15c2tiemFraWF0aWFnbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDQ3MDMsImV4cCI6MjA5MTEyMDcwM30.w8P3scSa3AtA0TqryqYHW42ONRXLKcSdIUgYT4TH1G8`
- **Edge Functions Secrets 已配置**:
  - `ZHIPU_API_KEY` — 智谱 API Key（已配置，工作正常）
  - `QWEN_API_KEY` — 千问 API Key（**待配置**，文书生成功能需要）

### Edge Functions 部署注意

所有 Edge Functions 必须使用 `--no-verify-jwt` 部署（ES256 JWT 兼容性）：

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

### 核心表（9张）

#### profiles — 用户档案
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK, FK→auth.users) | 用户 ID |
| user_display_id | string | 展示 ID (U-YYYYMMDD-XXXX) |
| username | string | 用户名 |
| school | string | 院校名 |
| major | string | 专业 |
| gpa | number | GPA |
| gpa_scale | number | GPA 满分 |
| current_education | string | 当前学历 |
| target_degree | string | 目标学位 |
| target_year | number | 目标入学年份 |
| target_country | string[] | 目标国家 |
| language_type | string | 语言考试类型 |
| language_score | json | 语言成绩详情 |
| gre_gmat | json | GRE/GMAT 成绩 |
| budget | string | 预算 |
| ranking_req | string | 排名要求 |
| cross_major | boolean | 是否跨专业 |
| awards | string[] | 获奖 |
| research | string[] | 科研 |
| internship | string[] | 实习 |
| special_needs | string | 特殊需求 |
| profile_summary | string | 档案摘要 |
| onboarding_completed | boolean | 是否完成引导 |

#### programs — 院校项目库（50+ 热门项目）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | |
| university_name / university_name_cn | string | 英文/中文校名 |
| program_name / program_name_cn | string | 英文/中文项目名 |
| country | string | 国家 |
| degree_type | string | 学位类型 |
| department | string | 院系 |
| qs_ranking | number | QS 排名 |
| gpa_requirement | number | GPA 要求 |
| language_requirement | json | 语言要求 |
| gre_required | boolean | 是否需要 GRE |
| deadline | json | 截止日期（多轮次） |
| tuition | string | 学费 |
| duration | string | 学制 |
| required_materials | string[] | 所需材料 |
| tags | string[] | 标签 |
| description | string | 项目描述 |
| application_link | string | 申请链接 |

#### applications — 用户申请记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid (FK→profiles) | |
| program_id | uuid (FK→programs) | |
| status | string | in_progress/submitted/accepted/rejected |
| target_round | string | 目标轮次 |
| deadline | timestamp | 截止日期 |
| notes | string | 备注 |

#### application_materials — 材料清单
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | |
| application_id | uuid (FK→applications) | |
| material_name | string | 材料名称 |
| material_type | string | sop/ps/cv/recommendation/transcript 等 |
| status | string | pending/in_progress/submitted |
| essay_id | uuid (FK→essays, nullable) | 关联文书 |
| file_url | string | 上传文件路径 |

#### essays — 文书内容 + 版本管理
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid | |
| application_id | uuid (nullable) | 关联申请 |
| essay_type | string | sop/ps/cv/recommendation/diversity |
| title | string | 标题 |
| content | text | 正文 |
| version | number | 版本号 |
| status | string | 状态 |

#### essay_conversations — 文书创作对话历史
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | |
| essay_id | uuid (FK→essays) | |
| role | string | user/assistant |
| content | text | 消息内容 |

#### chat_messages — Onboarding 聊天记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | |
| user_id | uuid | |
| role | string | user/assistant |
| content | text | 消息内容（parse-result 用 `[PARSE:filename]` 前缀） |

### RLS 策略
- 所有用户数据表：`auth.uid() = user_id`
- `programs` 表：所有认证用户可读

### 迁移文件（9个）
- `20260326*.sql` × 2 — 初始 schema
- `20260327*.sql` × 2 — 早期扩展
- `20260402000001_extend_schema.sql` — 核心 schema（6张表 + Storage + RLS）
- `20260408000001_chat_messages.sql` — 聊天记录持久化
- `20260409000001_enhance_programs.sql` — 项目字段增强
- `20260409000002_seed_programs_v2.sql` — 项目种子数据 v2

## AI 集成架构

### 5 个 Edge Functions（全部已部署）

1. **`onboarding-chat`** — AI 对话式信息采集
   - API: 智谱 GLM-4-Flash
   - 端点: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
   - 功能: 对话式信息采集，SSE 流式输出
   - 关键模式: `<<<PROFILE_UPDATE:{"field":"value"}>>>` 标记提取
   - **动态文件上传引导**：统计 assistant 回复轮次，第2-3轮在 system prompt 末尾注入 `uploadGuidanceBlock`
   - **动态已收集/缺失字段**：system prompt 中注入 `filledFields` 和 `missingFields`
   - 部署: `--no-verify-jwt`

2. **`parse-document`** — 文档解析（PDF/Word/图片）
   - **图片** (PNG/JPG/WEBP): 智谱 GLM-4V 多模态（直接 base64）
   - **PDF**: `unpdf` (npm:unpdf@0.12.1) 提取文本 → GLM-4-Flash 分析
   - **Word** (DOC/DOCX): XML `<w:t>` 标签提取 → GLM-4-Flash 分析
   - **重要**: GLM-4V **不能传 `temperature` 和 `max_tokens` 参数**
   - **AI 输出格式**：中文标签 + Markdown 分节，前端用 `ParseResultCard` 渲染
   - 接收 FormData（非 JSON），前端不传 Content-Type 头
   - 部署: `--no-verify-jwt`

3. **`school-matching`** — AI 智能选校
   - API: 智谱 GLM-4-Flash
   - 功能: 数据库预筛选 + AI 评分 + 流式思考过程
   - SSE 输出格式: `{type: "thinking"/"result"/"error", ...}`
   - 前端通过 `callEdgeFunctionSSE()` 消费
   - AI 返回字段: `program_id, probability, tier, reason, risk_flags, advantage_tags, weakness_tags, improvement_tips`
   - 部署: `--no-verify-jwt`

4. **`essay-generation`** — AI 文书创作
   - API: 优先 Qwen-plus，fallback 到 GLM-4-Flash
   - 端点: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
   - 功能: 多轮对话文书创作 + 版本管理
   - **直接生成模式**：有学生背景时，第一轮直接输出完整文书初稿
   - 支持 5 种文书类型：SOP、PS、CV、推荐信、多元化文书
   - 每种类型有详细的写作指南和结构模板
   - 部署: `--no-verify-jwt`

5. **`signup`** — 用户注册（自动确认邮箱）
   - 使用 `supabase.auth.admin.createUser` + `email_confirm: true`
   - 部署: `--no-verify-jwt`

### AI 调用封装 (`src/lib/ai.ts`)

四个核心函数：
- `callEdgeFunction(functionName, body, callbacks)` — OpenAI 兼容 SSE 格式（用于 onboarding-chat, essay-generation）
- `callEdgeFunctionSSE(functionName, body, onEvent, onError, onComplete)` — 自定义 SSE 事件格式（用于 school-matching）
- `callParseDocument(file: File): Promise<string>` — FormData 文件上传（用于 parse-document）
- `extractProfileUpdates(text): { cleanText, updates }` — 提取 `<<<PROFILE_UPDATE:...>>>` 标记

**注意**：`src/lib/ai.ts` 在 `.gitignore` 中，提交时需 `git add -f src/lib/ai.ts`

### PROFILE_UPDATE 提取模式

AI 在回复末尾嵌入标记，前端自动提取并隐藏：
```
用户回复内容...
<<<PROFILE_UPDATE:{"school":"北京工商大学","gpa":"3.5"}>>>
```
前端用正则 `/<<<PROFILE_UPDATE:(.*?)>>>/g` 提取，清理后显示干净文本。
处理逻辑在 `src/lib/ai.ts` 的 `extractProfileUpdates()` 和 `src/hooks/useOnboardingChat.ts` 的 `applyProfileUpdates()`。

**重要**：`applyProfileUpdates()` 在写入 DB 后会调用 `queryClient.invalidateQueries({ queryKey: ["profile"] })` 刷新缓存，确保右侧栏实时更新。

## 项目结构

```
myoffer/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn 基础组件
│   │   ├── school/             # 选校组件（ProgramCard, StatsBar, ThinkingVisualizer）
│   │   ├── onboarding/         # 信息录入组件
│   │   │   ├── StepIndicator.tsx    # 步骤指示器
│   │   │   └── ParseResultCard.tsx  # 文档解析结果美化卡片（分节+图标+Markdown渲染）
│   │   ├── AppLayout.tsx       # 主布局（含移动端抽屉侧边栏）
│   │   ├── AppSidebar.tsx      # 侧边栏导航（5项 + 退出确认）
│   │   ├── NavLink.tsx         # 导航链接
│   │   └── ProtectedRoute.tsx  # 路由守卫
│   ├── contexts/
│   │   └── AuthContext.tsx     # 认证上下文（session + profile）
│   ├── hooks/
│   │   ├── useOnboardingChat.ts  # AI 对话 hook（含文件上传、DB 持久化、PROFILE_UPDATE 提取 + 缓存刷新）
│   │   ├── useProfile.ts        # 档案 CRUD + 完成度计算（10个字段）
│   │   ├── useSchools.ts        # 选校 + AI 匹配 + localStorage 缓存
│   │   ├── useApplications.ts   # 申请管理 CRUD + 文件上传/下载
│   │   ├── useEssays.ts         # 文书 CRUD + 对话 + 自动保存
│   │   ├── useSchoolMatching.ts  # ⚠️ 旧版选校（待清理）
│   │   ├── useGeminiChat.ts     # ⚠️ 废弃（待清理）
│   │   ├── useClaudeChat.ts     # ⚠️ 废弃（待清理）
│   │   └── useGroqChat.ts       # ⚠️ 废弃（待清理）
│   ├── lib/
│   │   ├── utils.ts            # cn() 工具函数
│   │   ├── renderMarkdown.tsx  # Markdown 渲染组件（聊天消息用）
│   │   └── ai.ts               # Edge Function 流式调用封装（⚠️ 在 .gitignore 中）
│   ├── pages/
│   │   ├── AuthPage.tsx        # 登录/注册（分屏布局）
│   │   ├── OnboardingChat.tsx  # AI 对话式信息录入 + 文件上传 + 档案侧栏
│   │   ├── SchoolMatching.tsx  # AI 智能选校（三列：冲刺/匹配/保底）
│   │   ├── ApplicationTracker.tsx # 申请管家（材料清单 + 进度 + 删除确认）
│   │   ├── EssayWriting.tsx    # AI 文书创作（左右分栏 + 自动保存 + 版本管理）
│   │   ├── SettingsPage.tsx    # 用户设置
│   │   ├── Index.tsx           # 重定向到 /onboarding
│   │   └── NotFound.tsx        # 404
│   ├── integrations/supabase/
│   │   ├── client.ts           # Supabase 客户端
│   │   └── types.ts            # TypeScript 类型定义
│   └── App.tsx                 # 路由配置
├── supabase/
│   ├── migrations/             # 数据库迁移（9个文件）
│   ├── seed/programs.sql       # 院校项目种子数据 v1
│   ├── seed/programs_v2.sql    # 院校项目种子数据 v2（增强字段）
│   └── functions/              # Edge Functions (Deno)
│       ├── onboarding-chat/    # AI 对话
│       ├── school-matching/    # AI 选校
│       ├── essay-generation/   # AI 文书（Qwen/GLM-4-Flash）
│       ├── signup/             # 用户注册
│       ├── parse-document/     # 文档解析（PDF/Word/图片）
│       ├── claude-chat/        # ⚠️ 废弃
│       └── deepseek-chat/      # ⚠️ 废弃
├── vercel.json                 # Vercel 部署配置（SPA rewrite + Vite 框架）
├── index.html                  # 入口 HTML（中文标题）
└── docs/superpowers/
    ├── specs/                  # 设计文档
    └── plans/                  # 实施计划
```

## 路由

| 路径 | 页面 | 状态 |
|------|------|------|
| `/auth` | 登录/注册 | 已完成 |
| `/onboarding` | AI 对话式信息录入 + 档案侧栏 + 文档上传解析 | 已完成 |
| `/schools` | AI 智能选校（三列分级 + 卡片详情） | 已完成 |
| `/applications` | 申请管家（材料清单 + 进度 + 删除确认） | 已完成 |
| `/essays` | AI 文书创作（左右分栏 + 自动保存） | 已完成（QWEN_API_KEY 待配置） |
| `/settings` | 用户设置 | 已完成 |

## 认证

- 使用 Supabase Auth，用户名/密码模式
- 用户名转为假邮箱格式：`username@myoffer.app`
- 注册通过 `signup` Edge Function（`auth.admin.createUser` + `email_confirm: true`）
- 注册后自动登录
- 注册时自动创建 profile（触发器 `on_auth_user_created`）
- 生成用户展示 ID：`U-YYYYMMDD` + 4位随机数
- 退出登录有 AlertDialog 确认弹窗
- 测试账号：`saina_sidike`、`testuser1`（已注册）

## 侧边栏导航

| 导航项 | 路径 | 图标 | 说明 |
|--------|------|------|------|
| AI助手 | /onboarding | ClipboardList | 含在线状态绿点 |
| AI选校 | /schools | GraduationCap | |
| 申请管家 | /applications | Briefcase | |
| 文书创作 | /essays | PenTool | |
| 设置 | /settings | Settings | |

底部显示用户名 + 展示 ID + 退出按钮（含确认弹窗）。

## UI 主题

- **浅色主题**，蓝色主色调（`hsl(221 83% 53%)`）
- 白底 + 灰色边框，干净现代风格
- 移动端响应式：汉堡菜单 + 抽屉式侧边栏
- 聊天气泡：用户蓝底白字，AI 白底灰边卡片
- 使用 Inter 字体
- CSS 变量定义在 `src/index.css`

## 核心 Hooks 详解

### useOnboardingChat
- AI 对话管理（消息收发、流式输出、中断控制）
- PROFILE_UPDATE 标记自动提取 → 写入 DB → **invalidate React Query 缓存**（实时刷新侧栏）
- 安全更新：已有非空字段不被覆盖
- 文件上传：调用 `callParseDocument()` → 解析结果显示为 `ParseResultCard`
- 聊天记录 DB 持久化（`chat_messages` 表）
- parse-result 消息用 `[PARSE:filename]` 前缀标记，加载时自动恢复 `type` 和 `fileName`
- `messagesRef` 始终指向最新 messages（修复闭包过期问题）
- 重置对话：`shouldTriggerOpening` state（无 setTimeout hack）
- 动态上传引导：`assistantTurnCount` 统计 → 第2-3轮注入 `uploadGuidanceBlock`

### useProfile
- React Query 查询 key: `["profile"]`
- `profileCompleteness()` 基于 10 个字段计算百分比（0-100）
  - 检查字段：target_degree, current_education, school, major, gpa, language_type, language_score, target_country, target_year, budget
  - 空值检测：null/undefined/空字符串/空数组/空对象
- `updateProfileAsync()` 异步更新 profile
- Mutation onSuccess 自动 invalidate `["profile"]` 查询

### useSchools
- `MatchedSchool` 接口：program_id, probability, tier, reason, risk_flags, advantage_tags, weakness_tags, improvement_tips, program
- **选校结果分层**：基于 `tier` 字段（"reach"/"match"/"safety"），不是 probability 范围
- Stats 计算和列渲染都用 `s.tier` 字段（已修复一致性 bug）
- localStorage 缓存（key: `myoffer_match_results`）
- `addToApplications()` 自动从 `programs.required_materials` 初始化材料清单

### useApplications
- 申请 CRUD + 材料状态更新
- 文件上传到 Supabase Storage
- Signed URL 查看文件
- 一键导出所有材料

### useEssays
- 文书 CRUD + 对话消息管理
- **自动保存**：3 秒防抖 + 切换文书时保存 + 页面离开时保存 + beforeunload 保存
- `savedContentRef` 跟踪上次保存内容，避免冗余保存
- 保存按钮显示绿色勾 + "已保存" 当内容与已保存一致
- 自动选择最近文书（页面加载时无 URL 参数时）
- 自动应用首次 AI 生成的文书到编辑器
- 从材料清单"去撰写"自动创建文书 + 自动触发 AI 生成初稿

## 页面交互细节

### OnboardingChat（信息录入）
- 右侧档案完整度面板：每个未完成字段可点击 → 自动发送追问消息给 AI
- 移动端：折叠面板，点击字段后自动关闭面板
- 文档解析结果：`ParseResultCard` 组件（绿色/红色头部 + 分节展示 + Markdown 渲染）
- AI 开场白自动触发（新用户无历史消息时）
- 重置对话有 AlertDialog 确认弹窗

### SchoolMatching（AI 选校）
- 顶部 3 统计卡片：综合竞争力分 / 冲刺·匹配·保底分布 / 平均录取概率
- 三列布局：冲刺校 / 匹配校 / 保底校
- 列分组基于 `tier` 字段（reach/match/safety），与统计一致
- SchoolCard 展示：学校名+星级 / 项目名 / 概率% + tier 标签 / 国家·QS·学制·语言 / AI 分析 / 优势·劣势·可优化标签 / 展开详情
- 思考过程动画可视化
- 结果缓存到 localStorage

### ApplicationTracker（申请管家）
- 卡片列表 → 点击进入详情
- 材料 checklist：checkbox 状态切换 / "撰写中" 标签 / "去撰写"/"去修改"/"上传"/"查看" 操作
- 进度条 + 材料数统计（含"进行中"蓝色计数）
- DDL < 7天红色警告
- 状态流转：进行中 → 已申请（100% 材料时可点击）→ 已录取/已拒绝
- 删除申请有 AlertDialog 确认弹窗（显示学校名）
- 一键导出材料按钮

### EssayWriting（文书创作）
- 左右分栏：40% 对话 + 60% 编辑器
- 文书标签切换（最多显示 8 个）
- "应用到编辑器" 按钮（AI 回复 > 200 字时显示）
- 自动保存（3 秒防抖 + 多触发时机）
- 字数统计 + 进度条（目标 800 词）
- 复制 / 手动保存 按钮
- 新建文书按钮

## 关键设计决策

1. **不使用支付系统** — MVP 阶段全免费
2. **智谱 + 千问替代 OpenAI/Claude** — 完全免费，OpenAI 兼容格式
3. **Supabase Edge Functions 作为 API 代理** — API Key 存 Secrets
4. **不引入新状态管理库** — React Query + Context 足够
5. **选校算法 = 数据库预筛选 + AI 评分** — 不做纯规则引擎
6. **文书创作双入口** — 从材料清单「去撰写」或从 AI 助手直接触发
7. **选校结果分层用 tier 字段** — AI 直接分配 reach/match/safety，不依赖概率范围
8. **文书自动保存** — 3 秒防抖 + tab 切换 + 页面离开 + beforeunload
9. **Profile 更新实时刷新** — applyProfileUpdates 写入后 invalidate React Query 缓存
10. **Edge Functions 使用 --no-verify-jwt** — ES256 JWT 兼容性

## 已踩坑记录（重要）

### 1. GLM-4V 不支持 temperature/max_tokens
- **现象**：GLM-4V 返回 400 错误码 1210
- **修复**：`analyzeImage()` 中移除这两个参数

### 2. PDF naive 解析器无法处理真实 PDF
- **修复**：引入 `unpdf`（npm:unpdf@0.12.1）

### 3. Vercel SPA 路由 404
- **修复**：`vercel.json` 添加 SPA rewrite 规则

### 4. GitHub push 网络问题
- **修复**：`git config http.proxy http://127.0.0.1:7890`

### 5. ai.ts 在 .gitignore 中
- **修复**：每次提交需 `git add -f src/lib/ai.ts`

### 6. GLM-4-Flash 对 system prompt 中间指令遵循度低
- **修复**：上传引导指令动态拼接到 system prompt **最末尾**（recency bias）

### 7. 文档解析结果的错误检测误判
- **修复**：收窄错误检测条件，只匹配真正错误模式

### 8. 选校结果统计与列渲染不一致（2026-04-10 修复）
- **现象**：统计显示 3/0/0 但三列全显示"暂无此类院校"
- **原因**：统计用 `s.tier` 字段，列渲染用 `s.probability` 范围过滤（15-40%/40-70%/70%+），不一致
- **修复**：列渲染改为 `s.tier === cat.tier`，与统计逻辑一致
- **文件**：`src/pages/SchoolMatching.tsx`

### 9. Profile 侧栏不实时更新（2026-04-10 修复）
- **现象**：AI 对话中提取到新信息写入 DB 后，右侧档案完整度不更新
- **原因**：`applyProfileUpdates()` 调用 `updateProfileAsync()` 后没有 invalidate React Query 缓存
- **修复**：写入后添加 `queryClient.invalidateQueries({ queryKey: ["profile"] })`
- **文件**：`src/hooks/useOnboardingChat.ts`

### 10. 文书内容丢失（2026-04-10 修复）
- **现象**：编辑文书后切换页面或切换文书，内容丢失
- **修复**：添加完整的自动保存系统（3 秒防抖 + tab 切换 + SPA 导航 + beforeunload）
- **文件**：`src/pages/EssayWriting.tsx`

### 11. 删除申请无确认（2026-04-10 修复）
- **修复**：删除按钮包裹 AlertDialog，显示学校名
- **文件**：`src/pages/ApplicationTracker.tsx`

## 用户流程（四阶段）

### 阶段 1：信息录入
注册 → AI 开场对话 → 引导上传材料（成绩单/简历/奖状）→ AI 解析 → 对话式追问（可点击右侧未完成字段触发）→ 生成档案摘要 → 用户确认

### 阶段 2：AI 智能选校
查询 programs 数据库 → 匹配与过滤 → AI 计算录取概率 + 分层（思考过程可视化）→ 分级展示（冲刺/匹配/保底）→ 加入申请列表

### 阶段 3：申请管家
自动初始化材料清单 → 项目状态卡片 → 材料 checklist → DDL < 7天标红 → 点击「去撰写」跳转文书 → 100% 材料时可标记已申请

### 阶段 4：文书创作
自动新建对话 → AI 读取 profile + 院校偏好 → 直接生成初稿 → 左右分栏修改 → 自动保存 + 版本管理 → 保存联动材料清单

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

# 运行测试
npm test
npm run test:watch

# 部署单个 Edge Function（必须 --no-verify-jwt）
npx supabase functions deploy <function-name> --no-verify-jwt --project-ref evumyskbzakiatiagmpq

# 部署所有 Edge Functions
for fn in onboarding-chat school-matching essay-generation signup parse-document; do
  npx supabase functions deploy $fn --no-verify-jwt --project-ref evumyskbzakiatiagmpq
done

# 部署到 Vercel
vercel --prod --yes

# 推送到 GitHub（需要代理）
git config http.proxy http://127.0.0.1:7890
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
- Sprint 1：数据库 schema、AI 集成、选校匹配
- Sprint 2：文书生成、申请追踪、文书创作页面
- Edge Functions 部署（5个活跃）
- Vercel 部署：生产环境上线
- UI 优化：浅色主题、移动端响应式
- 文档解析：PDF（unpdf）、Word（XML提取）、图片（GLM-4V）
- 对话流程优化（2026-04-08）：开场白自动触发、实时保存、聊天记录持久化、上传引导
- 文档解析 UI 美化（2026-04-08）：ParseResultCard 组件
- **交互修复（2026-04-10）**：
  - 文书自动保存（3 秒防抖 + 多触发时机）
  - 申请删除确认弹窗
  - 档案未完成字段可点击触发 AI 追问
  - 选校结果列渲染与统计一致（tier 字段）
  - Profile 更新后实时刷新侧栏（React Query invalidation）
  - 文书页面自动选择最近文书
  - AI 首次生成文书自动应用到编辑器

### 待完成
- **高优先级**：
  - 配置 QWEN_API_KEY（文书生成功能需要）
  - Git push 到 GitHub（大量本地改动未提交）
- **中优先级**：
  - 清理废弃代码（useGeminiChat, useClaudeChat, useGroqChat, claude-chat/, deepseek-chat/）
  - 性能优化（代码分割）
  - AI 选校系统重构为确定性算法（计划已写：`docs/superpowers/plans/wise-launching-clock.md`）
- **低优先级**：
  - 自定义域名绑定 Vercel
  - 内测和用户反馈收集

### 未提交的本地改动（重要）
| 文件 | 改动内容 |
|------|---------|
| src/hooks/useOnboardingChat.ts | PROFILE_UPDATE 后 invalidate 缓存 + messagesRef 修复 |
| src/hooks/useSchools.ts | 选校结果 localStorage 缓存 |
| src/hooks/useEssays.ts | 文书 hook 优化 |
| src/hooks/useProfile.ts | 完成度计算优化 |
| src/pages/OnboardingChat.tsx | 可点击字段 + ParseResultCard 集成 |
| src/pages/SchoolMatching.tsx | 列渲染用 tier 字段 + 卡片详情 |
| src/pages/ApplicationTracker.tsx | 删除确认 + 进行中计数 |
| src/pages/EssayWriting.tsx | 自动保存 + 自动选择 + 自动应用 |
| src/pages/SettingsPage.tsx | 设置页优化 |
| src/components/AppSidebar.tsx | 退出确认弹窗 |
| src/components/onboarding/ParseResultCard.tsx | 新组件 |
| supabase/functions/* | Edge Function 优化（4个） |
| supabase/migrations/2026040*.sql | 新迁移（3个） |

## 注意事项（交接必读）

1. **`src/lib/ai.ts` 在 `.gitignore` 中** — Git 操作时需 `git add -f src/lib/ai.ts`
2. **Edge Functions 必须 `--no-verify-jwt` 部署** — 否则 JWT 验证失败
3. **前端调 Edge Functions 需双头** — `apikey` + `Authorization`
4. **`vercel.json` 必须有 SPA rewrite 规则** — 否则客户端路由 404
5. **GLM-4V 视觉模型禁止传 temperature/max_tokens** — 错误码 1210
6. **GitHub push 需要代理** — `git config http.proxy http://127.0.0.1:7890`
7. **parse-document 接收 FormData** — 前端不要设置 Content-Type 头
8. **Vercel 部署可以跳过 GitHub** — 直接 `vercel --prod --yes`
9. **ChatMessage 的 type 字段不存在于 DB** — `type` 和 `fileName` 仅内存中使用，DB 通过 `[PARSE:filename]` 前缀标记
10. **onboarding-chat 的 uploadGuidanceBlock 是动态的** — 只在 `assistantTurnCount` 为 1-2 时注入
11. **parse-document 的 AI 提示要求中文标签输出** — ParseResultCard 的 `getSectionMeta` 依赖此格式
12. **选校结果分层用 `tier` 字段** — stats 和列渲染都用 `s.tier`，不用 probability 范围
13. **Profile 更新必须 invalidate 缓存** — `queryClient.invalidateQueries({ queryKey: ["profile"] })`
14. **文书自动保存用 `savedContentRef`** — 避免和 `saveEssay` mutation 的 onSuccess 冲突

## 开发文档

- **设计规格**: `docs/superpowers/specs/2026-04-02-myoffer-mvp-design.md`
- **Sprint 1 计划**: `docs/superpowers/plans/2026-04-02-myoffer-mvp-sprint1.md`
- **选校重构计划**: `.claude/plans/wise-launching-clock.md`
- **竞品调研**: `~/myoffer-mvp-docs/竞品调研报告.md`
- **完整产品方案**: `~/MyOffer完整产品方案.html`
