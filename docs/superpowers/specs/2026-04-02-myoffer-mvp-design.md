# MyOffer MVP 技术设计方案

**日期**：2026-04-02
**状态**：已批准
**目标**：12周内完成 MVP 开发并上线

---

## 1. 项目结构

基于现有 `~/myoffer/` 代码库扩展，不从零开始。

```
myoffer/
├── src/
│   ├── components/          # 共享 UI 组件（shadcn/ui）
│   │   ├── ui/              # shadcn 基础组件（已有）
│   │   ├── chat/            # 对话组件（消息气泡、输入框、文件上传）
│   │   ├── school/          # 选校卡片、筛选器、统计摘要
│   │   ├── essay/           # 文书编辑器、版本切换、分栏布局
│   │   └── application/     # 申请卡片、材料清单、状态标签
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx   # 已有，保持不变
│   ├── hooks/               # 自定义 hooks
│   │   ├── useProfile.ts    # 用户档案 CRUD
│   │   ├── useSchools.ts    # 选校数据 + AI 匹配
│   │   ├── useEssays.ts     # 文书 CRUD + AI 生成
│   │   └── useApplications.ts # 申请管理
│   ├── lib/                 # 工具函数
│   │   ├── supabase.ts      # 已有
│   │   └── ai.ts            # Edge Function 调用封装
│   ├── pages/               # 页面组件（已有路由骨架）
│   │   ├── AuthPage.tsx
│   │   ├── OnboardingChat.tsx
│   │   ├── SchoolMatching.tsx
│   │   ├── EssayWriting.tsx
│   │   ├── ApplicationTracker.tsx
│   │   └── SettingsPage.tsx
│   ├── integrations/
│   │   └── supabase/
│   │       └── types.ts     # 需要根据新 schema 重新生成
│   └── App.tsx              # 已有，路由结构保持不变
├── supabase/
│   ├── migrations/          # 数据库迁移文件
│   └── functions/           # Edge Functions（Deno）
│       ├── onboarding-chat/ # 已有，需改 API 到智谱
│       ├── school-matching/ # 新增
│       └── essay-generation/# 新增
└── package.json             # 已有 52 依赖
```

**关键决策**：
- 保留现有路由结构 (`/auth`, `/onboarding`, `/schools`, `/essays`, `/applications`, `/settings`)
- 保留现有依赖（React 18, react-router-dom 6, @supabase/supabase-js, shadcn/ui, @tanstack/react-query）
- 不引入新的状态管理库，用 React Query + Context 足够

---

## 2. 数据库 Schema

### 扩展 profiles 表

在现有 profiles 表上新增留学申请相关字段：

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  target_degree text,          -- 目标学位：master/phd/bachelor
  current_education text,      -- 当前学历层次
  school text,                 -- 本科学校
  major text,                  -- 本科专业
  cross_major boolean,         -- 是否跨专业
  gpa numeric(4,2),            -- GPA
  gpa_scale numeric(3,1),      -- GPA 满分（4.0/5.0/100）
  language_type text,          -- 语言考试类型：toefl/ielts
  language_score jsonb,        -- 语言成绩详情 {"total":100,"reading":25,...}
  gre_gmat jsonb,              -- GRE/GMAT 成绩
  internship text[],           -- 实习经历
  research text[],             -- 科研经历
  awards text[],               -- 获奖经历
  target_country text[],       -- 目标国家
  target_year integer,         -- 目标入学年份
  budget text,                 -- 预算范围
  ranking_req text,            -- 排名要求
  special_needs text,          -- 特殊需求
  onboarding_completed boolean DEFAULT false,
  profile_summary text;        -- AI 生成的档案摘要
```

### 新增 programs 表

```sql
CREATE TABLE programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name text NOT NULL,
  university_name_cn text,
  program_name text NOT NULL,
  program_name_cn text,
  degree_type text NOT NULL,       -- master/phd/bachelor
  country text NOT NULL,
  qs_ranking integer,
  department text,
  duration text,                    -- 学制
  tuition text,                     -- 学费
  language_requirement jsonb,       -- {"toefl_min":100,"ielts_min":7.0}
  gpa_requirement numeric(3,1),
  gre_required boolean DEFAULT false,
  deadline jsonb,                   -- {"round1":"2026-11-01","round2":"2027-01-15"}
  application_link text,
  required_materials text[],        -- ['transcript','sop','cv','recommendation_2','toefl']
  tags text[],                      -- 标签：['stem','双非友好','奖学金多']
  description text,
  created_at timestamptz DEFAULT now()
);
```

### 新增 applications 表

```sql
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  program_id uuid REFERENCES programs NOT NULL,
  status text DEFAULT 'in_progress', -- in_progress/submitted/accepted/rejected
  target_round text,                  -- 申请轮次
  deadline date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 新增 application_materials 表

```sql
CREATE TABLE application_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications NOT NULL,
  material_type text NOT NULL,  -- transcript/sop/ps/cv/recommendation/toefl/gre/other
  material_name text NOT NULL,
  status text DEFAULT 'pending', -- pending/in_progress/submitted
  file_url text,                 -- Supabase Storage URL
  essay_id uuid REFERENCES essays, -- 如果是文书类材料
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 新增 essays 表

```sql
CREATE TABLE essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  application_id uuid REFERENCES applications,
  essay_type text NOT NULL,     -- sop/ps/diversity/cv/recommendation
  title text,                    -- 对话名，如 "CMU MISM - SOP"
  content text,                  -- 文书正文（Markdown）
  version integer DEFAULT 1,
  status text DEFAULT 'draft',   -- draft/review/final
  ai_model text,                 -- 使用的 AI 模型
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 新增 essay_conversations 表

```sql
CREATE TABLE essay_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid REFERENCES essays NOT NULL,
  role text NOT NULL,            -- user/assistant
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### RLS 策略

所有用户数据表启用 RLS，策略统一：用户只能访问自己的数据。

```sql
-- 对 applications, application_materials, essays, essay_conversations 表
CREATE POLICY "Users can CRUD own data" ON {table}
  FOR ALL USING (auth.uid() = user_id);

-- programs 表：所有认证用户可读
CREATE POLICY "Authenticated users can read programs" ON programs
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 3. AI 集成架构

### 3 个 Edge Functions

所有 AI 调用通过 Supabase Edge Functions 代理，API Key 存在 Supabase Secrets 中，前端零接触。

#### 3.1 onboarding-chat（智谱 GLM-4-Flash）

**现有基础**：已有 Edge Function，使用 Gemini API，系统提示词和 `<<<PROFILE_UPDATE>>>` 提取模式完善。

**改造点**：
- API 端点改为 `https://open.bigmodel.cn/api/paas/v4/chat/completions`
- 模型改为 `glm-4-flash`（免费无限调用）
- 请求格式无需改动（OpenAI 兼容）
- 保留现有系统提示词和 profile 字段提取逻辑
- 新增：支持图片输入（成绩单等文档的 OCR 解析），使用 GLM-4V 多模态能力

**文档上传 + OCR 流程**：
1. 用户在对话中上传文件 → 前端上传到 Supabase Storage
2. 前端将文件 URL 传给 Edge Function
3. Edge Function 调用智谱 GLM-4V（多模态）识别文档内容
4. AI 提取已知字段（GPA、学校、专业等），告知用户结果
5. AI 继续追问文档未覆盖的信息

**档案摘要**：对话结束时，AI 生成结构化档案摘要，用户确认后写入 profiles 的 `profile_summary` 字段。

```typescript
// 请求格式
POST /functions/v1/onboarding-chat
{
  "messages": [...],          // 对话历史
  "profile": {...},           // 当前 profile 数据
  "file_url": "optional"      // 上传的文档 URL（触发 OCR）
}

// 响应格式（流式）
data: {"content": "你的GPA是3.5/4.0，本科就读于...<<<PROFILE_UPDATE:{\"gpa\":3.5}>>>"}
```

#### 3.2 school-matching（智谱 GLM-4-Flash）

**功能**：接收用户 profile，结合 programs 表数据，返回匹配推荐。

**算法逻辑**：
1. **数据库预筛选**：按目标国家、学历层次、专业大类从 programs 表过滤
2. **AI 评分**：将用户 profile + 候选项目列表发给 AI，要求返回结构化评分
3. **输出格式**：每个项目包含匹配度百分比 + 分类（冲刺/匹配/保底）+ 推荐理由

**思考过程可视化**：
- Edge Function 返回流式响应
- AI 先输出思考过程（"正在分析你的背景..."、"正在匹配英国院校..."）
- 前端实时展示思考步骤，减少用户等待焦虑
- 最后输出结构化的选校结果 JSON

**支持重新生成**：用户修改 profile 后可重新触发选校，前端提供"返回修改信息"入口。

```typescript
POST /functions/v1/school-matching
{
  "profile": {...},
  "filters": {
    "countries": ["UK", "US"],
    "degree": "master"
  }
}

// 流式响应
data: {"type": "thinking", "content": "正在分析你的背景..."}
data: {"type": "thinking", "content": "在 85 个项目中匹配..."}
data: {"type": "result", "schools": [
  {"program_id": "...", "probability": 72, "tier": "match", "reason": "..."},
  ...
]}
```

#### 3.3 essay-generation（通义千问 Qwen）

**功能**：基于用户 profile + 目标院校信息，通过多轮对话生成个性化文书。

**API 配置**：
- 端点：`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- 模型：`qwen-plus`（免费 1M tokens/月）
- 格式：OpenAI 兼容

**文书创作流程**：
1. **自动读取数据**：Edge Function 接收 application_id，自动拉取用户 profile + 目标项目信息
2. **多轮深度对话**：AI 追问挖掘细节、构建叙事框架、标注【闪光点】、适配院校风格
3. **生成初稿**：AI 输出完整文书，支持 Markdown 格式
4. **迭代修改**：用户在编辑工作台直接修改或通过对话指示修改方向
5. **版本管理**：每次修改生成新版本号

```typescript
POST /functions/v1/essay-generation
{
  "essay_id": "...",           // 关联的 essay 记录
  "application_id": "...",     // 目标申请（自动拉取院校信息）
  "messages": [...],           // 对话历史
  "essay_type": "sop",
  "current_content": "..."     // 当前文书内容（修改模式）
}
```

### AI 成本

| 服务 | 用途 | 免费额度 | 月预估用量 |
|------|------|---------|-----------|
| 智谱 GLM-4-Flash | 信息采集 + 选校 | 无限免费 | 不限 |
| 智谱 GLM-4V | 文档 OCR | 免费额度充足 | 200次/月 |
| 千问 qwen-plus | 文书创作 | 1M tokens/月 | ~500K tokens/月 |
| **总计** | | | **¥0/月** |

---

## 4. 前端页面改造

### 4.1 OnboardingChat（信息录入）

**现状**：已有对话式 UI + Edge Function
**改造**：API 从 Gemini → 智谱，新增文档上传

**完整流程**（基于流程图）：
1. 注册账号 → 信息录入阶段开始
2. AI 开场对话：自我介绍，询问申请学历
3. 对话引导上传材料：成绩单、简历、奖状、其他文档
4. AI 自动解析文档：OCR 识别 → 提取已知字段 → 告知用户结果
5. AI 对话式追问：补充材料未覆盖的信息 + 额外要求
6. AI 生成档案摘要：向用户确认信息，支持当场修正
7. 确认后 → 进入选校阶段

**技术实现**：
- 文件上传组件：支持图片/PDF 拖拽上传
- 上传到 Supabase Storage，获取 URL 传给 Edge Function
- 档案摘要确认 UI：卡片式展示所有提取的字段，支持逐项修改
- `onboarding_completed = true` 后跳转 `/schools`

### 4.2 SchoolMatching（AI 智能选校）

**现状**：10 个硬编码 mock 数据，三档分类 UI
**改造**：连接真实数据 + AI 匹配

**完整流程**（基于流程图）：
1. 进入智能选校阶段
2. 从 programs 表按用户申请学年搜索数据
3. 匹配与过滤：目标国家、学历层次、专业大类、硬性要求
4. 录取概率：读取用户数据，按算法动态计算
5. 选校结果展示：项目卡片分级展示 + 统计信息
6. 进入下一阶段：申请管理

**UI 要素**：
- 顶部统计栏：推荐总数、冲刺/匹配/保底分布
- 思考过程可视化：AI 分析步骤实时展示（流式）
- 三档卡片列表（复用现有 UI，替换数据源）
- "返回修改信息"按钮 → 跳回 profile 编辑或 onboarding
- "加入申请列表"→ 写入 applications 表 + 自动初始化材料清单

### 4.3 ApplicationTracker（申请管家）

**现状**：页面空
**改造**：完整的申请管理系统

**完整流程**（基于流程图）：
1. 进入申请管理阶段
2. 自动初始化每所学校的任务流：拉取 required_materials → 生成专属材料清单 → DDL 写入时间轴
3. 项目申请状态：每所项目独立卡片；状态：进行中/已申请/被录取/被拒绝；DDL < 7天标红
4. 材料清单追踪：每所学校独立清单；每项状态：待完成/进行中/已提交；支持上传材料；支持一键导出
5. 文书入口：清单内点击「去撰写」跳 AI 文书助手
6. AI 助手双向联动：对话更新 → 看板同步；看板事件 → AI 助手推送

**UI 结构**：
- 左侧：申请列表（按 DDL 排序，紧急标红）
- 右侧：选中申请的详情面板（状态、材料清单、时间轴）
- 材料清单 checklist：每项可展开，显示状态、上传按钮、「去撰写」按钮
- MVP 简化：双向联动简化为文书保存时自动更新材料清单状态

### 4.4 EssayWriting（文书创作）

**现状**：页面空
**改造**：AI 驱动的文书创作工作台

**完整流程**（基于流程图）：
1. 两个入口：材料清单「去撰写」/ AI 助手直接触发
2. 跳转 AI 助手，自动新建对话，对话名：「项目+文书类型」
3. AI 自动读取用户 profile + 目标院校偏好
4. AI 多轮深度对话：追问挖掘细节、构建叙事框架、标注【闪光点】、院校风格适配、支持跳过
5. 文书生成 + 编辑工作台：左侧对话框 + 右侧文稿区分栏布局
6. 用户可在文稿区直接编辑，支持富文本、复制
7. 每次修改生成新版本号（多轮迭代）
8. 保存：自动保存至材料清单对应项，「去撰写」变为「去修改」

**UI 结构**：
- 左侧面板（40%）：对话界面，AI 追问 + 用户回答
- 右侧面板（60%）：文书编辑区，Markdown 编辑 + 实时预览
- 顶部：文书类型选择、版本切换、目标院校信息
- 底部工具栏：保存、导出、复制

### 4.5 SettingsPage

**优先级最低**：显示/编辑 profile 信息、退出登录即可。

### 页面优先级

| 优先级 | 页面 | 原因 |
|--------|------|------|
| P0 | OnboardingChat | 用户入口，数据采集核心 |
| P0 | SchoolMatching | 核心价值主张 |
| P1 | ApplicationTracker | 用户留存关键 |
| P1 | EssayWriting | 第二大卖点 |
| P2 | SettingsPage | 基础功能 |

---

## 5. 开发阶段与优先级

### Sprint 1（第1-4周）：核心基础

| 周次 | 任务 | 产出 |
|------|------|------|
| W1 | `npm install`、Supabase schema 迁移（profiles 扩展 + programs + applications + application_materials + essays + essay_conversations）、RLS 策略、Supabase Storage bucket | 数据库就绪 |
| W2 | onboarding-chat Edge Function 改造（Gemini → 智谱 GLM-4-Flash）、文档上传 + OCR（GLM-4V）、档案摘要确认 UI | 信息采集可用 |
| W3 | school-matching Edge Function、院校评分算法 + 智谱 API、programs 表填充初始数据（50个热门项目）、思考过程可视化 | 选校 API 就绪 |
| W4 | SchoolMatching 页面连接真实数据、统计摘要、"加入申请列表"+ 自动初始化材料清单 | **里程碑：核心闭环可演示** |

### Sprint 2（第5-8周）：功能扩展

| 周次 | 任务 | 产出 |
|------|------|------|
| W5 | essay-generation Edge Function（千问 API）、系统提示词设计、多轮对话存储 | 文书 API 就绪 |
| W6 | EssayWriting 页面：左右分栏布局、对话面板 + Markdown 编辑器、版本管理 | 文书创作可用 |
| W7 | ApplicationTracker 页面：申请列表 + 详情面板、材料清单 checklist、DDL 提醒、文件上传 | 申请管理可用 |
| W8 | programs 表扩充至 150+ 项目、SettingsPage 基础功能、文书保存联动材料清单 | **里程碑：全功能 MVP** |

### Sprint 3（第9-12周）：打磨上线

| 周次 | 任务 | 产出 |
|------|------|------|
| W9 | UI 打磨：移动端适配、加载状态、错误处理、空状态 | 体验优化 |
| W10 | QA 测试：全流程走通、边界情况、AI 输出质量调优 | 质量保障 |
| W11 | Vercel 部署、域名配置、性能优化 | 线上环境就绪 |
| W12 | 种子用户内测、Bug 修复、最终调优 | **里程碑：正式上线** |

### 风险与应对

| 风险 | 概率 | 应对 |
|------|------|------|
| 智谱/千问 API 限流 | 中 | 两者互为备选，切换成本低（OpenAI 兼容格式） |
| AI 选校质量不达预期 | 高 | 初期人工审核 + 提示词迭代 |
| 院校数据不全 | 中 | 先覆盖热门 50 项目，用户反馈驱动扩充 |
| OCR 解析准确率低 | 中 | 先支持标准成绩单格式，用户确认环节兜底 |
| Supabase 免费额度用尽 | 低 | 500MB 数据库 + 5GB 带宽 + 1GB Storage，MVP 够用 |

### 成功标准

- 全流程可完成：注册 → 对话式信息录入（含文档上传）→ AI 选校推荐 → 加入申请 → 材料清单管理 → AI 文书创作 → 保存联动
- 全流程耗时 < 30 分钟
- AI 选校推荐合理性 > 75%
- 月运营成本 = ¥0

---

## 6. 技术栈确认

| 类别 | 技术 | 备注 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | 已有 |
| 构建工具 | Vite | 已有 |
| UI 组件 | shadcn/ui (Radix) + Tailwind CSS | 已有 |
| 路由 | react-router-dom v6 | 已有 |
| 数据请求 | @tanstack/react-query | 已有 |
| 表单 | react-hook-form + zod | 已有 |
| 动画 | framer-motion | 已有 |
| 图表 | recharts | 已有 |
| 后端 | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | 已有 |
| AI 对话/选校 | 智谱 GLM-4-Flash / GLM-4V | 免费 |
| AI 文书 | 通义千问 qwen-plus | 免费 1M tokens/月 |
| 部署 | Vercel | 免费 |
| **月成本** | | **¥0** |
