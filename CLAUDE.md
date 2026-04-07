# MyOffer — AI 留学申请平台

## 项目概述

MyOffer 是一个 AI 驱动的留学申请平台，**专为双非学生打造**。核心价值：真 AI 能力（非规则匹配）、透明定价（MVP 阶段全免费）、全流程在线。

- **目标用户**：中国双非院校本科生，申请海外硕士/博士
- **核心功能**：AI 对话式信息录入 → AI 智能选校 → 申请管家 → AI 文书创作
- **上线目标**：2026-06-24（12周开发周期）
- **月运营成本**：¥0（所有服务使用免费额度）

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript + Vite | 已有完整骨架 |
| UI | shadcn/ui (Radix) + Tailwind CSS | 已安装全套组件 |
| 路由 | react-router-dom v6 | 路由结构已定义 |
| 数据请求 | @tanstack/react-query | 已配置 |
| 表单 | react-hook-form + zod | 已安装 |
| 后端 | Supabase (PostgreSQL + Auth + Edge Functions + Storage) | 项目已创建 |
| AI 对话/选校 | 智谱 GLM-4-Flash（免费无限） | OpenAI 兼容格式 |
| AI 文档 OCR | 智谱 GLM-4V（多模态） | 免费额度充足 |
| AI 文书 | 通义千问 qwen-plus（免费 1M tokens/月） | OpenAI 兼容格式 |
| 部署 | Vercel（免费） | 尚未配置 |

## Supabase 配置

- **项目 URL**: `https://aljmasuwwsipaurhqtiv.supabase.co`
- **项目 ID**: `umiacfouyfamwvplhjrj`
- **Publishable Key**: 在 `src/integrations/supabase/client.ts` 中
- **Edge Functions Secrets 需配置**:
  - `ZHIPU_API_KEY` — 智谱 API Key（从 https://open.bigmodel.cn 获取）
  - `QWEN_API_KEY` — 千问 API Key（从 https://dashscope.aliyuncs.com 获取）

## 数据库 Schema

### 现有表
- `profiles` — 用户档案（已有基础字段 + 待扩展留学申请字段）

### 待创建表（见迁移文件 `supabase/migrations/20260402000001_extend_schema.sql`）
- `programs` — 院校项目库（初始 50+ 热门项目）
- `applications` — 用户申请记录
- `application_materials` — 每个申请的材料清单
- `essays` — 文书内容 + 版本管理
- `essay_conversations` — 文书创作对话历史

### RLS 策略
- 所有用户数据表：`auth.uid() = user_id`
- `programs` 表：所有认证用户可读

## AI 集成架构

### 3 个 Edge Functions

1. **`onboarding-chat`**（已有，需迁移）
   - API: 智谱 GLM-4-Flash
   - 端点: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
   - 功能: 对话式信息采集 + 文档 OCR
   - 关键模式: `<<<PROFILE_UPDATE:{"field":"value"}>>>` 标记提取

2. **`school-matching`**（待创建）
   - API: 智谱 GLM-4-Flash
   - 功能: 数据库预筛选 + AI 评分 + 流式思考过程
   - 输出: `{type: "thinking"/"result"/"error", ...}`

3. **`essay-generation`**（待创建）
   - API: 通义千问 qwen-plus
   - 端点: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
   - 功能: 多轮对话文书创作 + 版本管理

### PROFILE_UPDATE 提取模式

AI 在回复末尾嵌入标记，前端自动提取并隐藏：
```
用户回复内容...
<<<PROFILE_UPDATE:{"school":"北京工商大学","gpa":"3.5"}>>>
```
前端用正则 `/<<<PROFILE_UPDATE:(.*?)>>>/g` 提取，清理后显示干净文本。

### 两个 AI API 均为 OpenAI 兼容格式

```typescript
// 智谱和千问的请求格式完全相同
{
  model: "glm-4-flash", // 或 "qwen-plus"
  messages: [{ role: "system", content: "..." }, ...],
  stream: true,
  temperature: 0.8,
  max_tokens: 2048,
}
```

## 项目结构

```
myoffer/
├── src/
│   ├── components/ui/        # shadcn 基础组件（已有）
│   ├── components/chat/      # 对话组件（待创建）
│   ├── components/school/    # 选校组件（待创建）
│   ├── components/essay/     # 文书组件（待创建）
│   ├── components/application/ # 申请组件（待创建）
│   ├── contexts/AuthContext.tsx # 认证上下文（已有）
│   ├── hooks/
│   │   ├── useGeminiChat.ts  # 旧版对话 hook（待替换为 useOnboardingChat.ts）
│   │   ├── useProfile.ts     # 档案 CRUD（待创建）
│   │   ├── useSchools.ts     # 选校 + AI 匹配（待创建）
│   │   ├── useEssays.ts      # 文书 CRUD（待创建）
│   │   └── useApplications.ts # 申请管理（待创建）
│   ├── lib/
│   │   ├── utils.ts          # cn() 工具函数（已有）
│   │   └── ai.ts             # Edge Function 流式调用封装（待创建）
│   ├── pages/                # 6 个页面（已有骨架，使用 mock 数据）
│   ├── integrations/supabase/
│   │   ├── client.ts         # Supabase 客户端（已有）
│   │   └── types.ts          # 类型定义（需按新 schema 更新）
│   └── App.tsx               # 路由配置（已有，保持不变）
├── supabase/
│   ├── migrations/           # 数据库迁移
│   ├── seed/                 # 种子数据（院校项目）
│   └── functions/            # Edge Functions (Deno)
│       ├── onboarding-chat/  # 已有，需迁移 Gemini → 智谱
│       ├── school-matching/  # 待创建
│       └── essay-generation/ # 待创建
└── docs/superpowers/
    ├── specs/                # 设计文档
    └── plans/                # 实施计划
```

## 路由

| 路径 | 页面 | 状态 |
|------|------|------|
| `/auth` | 登录/注册 | 已完成 |
| `/onboarding` | AI 对话式信息录入 | 骨架已有，需连真实 API |
| `/schools` | AI 智能选校 | 骨架已有，使用 mock 数据 |
| `/applications` | 申请管家 | 骨架已有，使用 mock 数据 |
| `/essays` | AI 文书创作 | 骨架已有，使用 mock 数据 |
| `/settings` | 用户设置 | 骨架已有 |

## 认证

- 使用 Supabase Auth，用户名/密码模式
- 用户名转为假邮箱格式：`username@myoffer.app`
- 注册时自动创建 profile（触发器 `on_auth_user_created`）
- 生成用户展示 ID：`U-YYYYMMDD` + 4位随机数

## 关键设计决策

1. **不使用支付系统** — MVP 阶段全免费，降低开发复杂度
2. **智谱 + 千问替代 OpenAI/Claude** — 完全免费，OpenAI 兼容格式切换成本低
3. **Supabase Edge Functions 作为 API 代理** — API Key 存 Secrets，前端零接触
4. **不引入新状态管理库** — React Query + Context 足够
5. **保留现有代码骨架** — 不从零开始，扩展已有页面
6. **选校算法 = 数据库预筛选 + AI 评分** — 不做纯规则引擎
7. **文书创作双入口** — 从材料清单「去撰写」或从 AI 助手直接触发
8. **双向联动 MVP 简化** — 文书保存时自动更新材料清单状态

## 用户流程（四阶段）

### 阶段 1：信息录入
注册 → AI 开场对话 → 引导上传材料（成绩单/简历/奖状）→ AI OCR 解析 → 对话式追问 → 生成档案摘要 → 用户确认

### 阶段 2：AI 智能选校
查询 programs 数据库 → 匹配与过滤 → AI 计算录取概率（思考过程可视化）→ 分级展示结果（冲刺/匹配/保底）→ 加入申请列表

### 阶段 3：申请管家
自动初始化材料清单（从 programs.required_materials）→ 项目状态卡片 → 材料 checklist（待完成/进行中/已提交）→ DDL < 7天标红 → 点击「去撰写」跳转文书

### 阶段 4：文书创作
自动新建对话（项目+文书类型）→ AI 读取用户 profile + 院校偏好 → 多轮对话挖掘细节 → 左右分栏（对话+编辑器）→ 版本管理 → 保存联动材料清单

## 开发文档

- **设计规格**: `docs/superpowers/specs/2026-04-02-myoffer-mvp-design.md`
- **Sprint 1 计划**: `docs/superpowers/plans/2026-04-02-myoffer-mvp-sprint1.md`
- **竞品调研**: `~/myoffer-mvp-docs/竞品调研报告.md`
- **完整产品方案**: `~/MyOffer完整产品方案.html`

## 开发命令

```bash
# 安装依赖（node_modules 尚未安装）
npm install

# 启动开发服务器（端口 8080）
npm run dev

# TypeScript 类型检查
npx tsc --noEmit

# 部署 Edge Function
npx supabase functions deploy <function-name> --linked

# 生成 Supabase 类型
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts

# 推送数据库迁移
npx supabase db push --linked
```

## Sprint 1 任务概览（12 个 Task）

| # | 任务 | 状态 |
|---|------|------|
| 1 | npm install + 验证构建 | 待开始 |
| 2 | 数据库迁移（6张表 + Storage + RLS） | 待开始 |
| 3 | TypeScript 类型更新 | 待开始 |
| 4 | AI Edge Function 调用封装 (lib/ai.ts) | 待开始 |
| 5 | onboarding-chat 迁移到智谱 | 待开始 |
| 6 | useProfile hook | 待开始 |
| 7 | useOnboardingChat 重写 | 待开始 |
| 8 | school-matching Edge Function | 待开始 |
| 9 | 种子数据（50个院校项目） | 待开始 |
| 10 | useSchools hook | 待开始 |
| 11 | SchoolMatching 页面连接真实数据 | 待开始 |
| 12 | 清理旧代码 + 最终验证 | 待开始 |

## 注意事项

- `node_modules/` 尚未安装，开发前需先 `npm install`
- Supabase CLI 可能未链接，部分操作需在 Dashboard SQL Editor 手动执行
- 智谱和千问 API Key 需在 Supabase Secrets 中配置后 Edge Function 才能工作
- 现有 `useGeminiChat.ts` 使用 Gemini API，需替换为智谱（Task 5-7）
- `src/integrations/supabase/types.ts` 只有 profiles 表类型，扩展 schema 后需重新生成
