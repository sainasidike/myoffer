# MyOffer MVP Sprint 1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 MyOffer MVP 核心闭环——用户注册后通过 AI 对话录入信息，获得 AI 选校推荐，并可将学校加入申请列表。

**Architecture:** 基于现有 React + Vite + TypeScript + shadcn/ui 前端骨架，扩展 Supabase 数据库 schema，将 Edge Function 从 Gemini API 迁移到智谱 GLM-4-Flash（OpenAI 兼容格式），新建 school-matching Edge Function，前端页面从 mock 数据切换到真实 API。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + Auth + Edge Functions + Storage), 智谱 GLM-4-Flash API

---

### Task 1: 安装依赖并验证项目可构建

**Files:**
- Verify: `package.json`
- Verify: `vite.config.ts`

- [ ] **Step 1: 安装 npm 依赖**

```bash
cd ~/myoffer && npm install
```

Expected: 安装成功，无 ERESOLVE 错误。

- [ ] **Step 2: 验证开发服务器启动**

```bash
cd ~/myoffer && npm run dev -- --host 0.0.0.0 &
sleep 3
curl -s http://localhost:8080 | head -20
kill %1
```

Expected: 返回 HTML 页面，包含 `<div id="root">` 标签。

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
cd ~/myoffer && npx tsc --noEmit 2>&1 | tail -5
```

Expected: 无严重错误（允许部分 warning）。

- [ ] **Step 4: Commit**

```bash
cd ~/myoffer
git add package-lock.json
git commit -m "chore: install dependencies"
```

---

### Task 2: 数据库迁移 — 扩展 profiles 表 + 创建新表

**Files:**
- Create: `supabase/migrations/20260402000001_extend_schema.sql`

- [ ] **Step 1: 编写迁移文件**

```sql
-- 扩展 profiles 表
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_degree text,
  ADD COLUMN IF NOT EXISTS current_education text,
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS major text,
  ADD COLUMN IF NOT EXISTS cross_major boolean,
  ADD COLUMN IF NOT EXISTS gpa numeric(4,2),
  ADD COLUMN IF NOT EXISTS gpa_scale numeric(3,1) DEFAULT 4.0,
  ADD COLUMN IF NOT EXISTS language_type text,
  ADD COLUMN IF NOT EXISTS language_score jsonb,
  ADD COLUMN IF NOT EXISTS gre_gmat jsonb,
  ADD COLUMN IF NOT EXISTS internship text[],
  ADD COLUMN IF NOT EXISTS research text[],
  ADD COLUMN IF NOT EXISTS awards text[],
  ADD COLUMN IF NOT EXISTS target_country text[],
  ADD COLUMN IF NOT EXISTS target_year integer,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS ranking_req text,
  ADD COLUMN IF NOT EXISTS special_needs text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_summary text;

-- 创建 programs 表（院校项目库）
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name text NOT NULL,
  university_name_cn text,
  program_name text NOT NULL,
  program_name_cn text,
  degree_type text NOT NULL,
  country text NOT NULL,
  qs_ranking integer,
  department text,
  duration text,
  tuition text,
  language_requirement jsonb,
  gpa_requirement numeric(3,1),
  gre_required boolean DEFAULT false,
  deadline jsonb,
  application_link text,
  required_materials text[],
  tags text[],
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read programs"
  ON public.programs FOR SELECT
  TO authenticated
  USING (true);

-- 创建 applications 表
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'in_progress',
  target_round text,
  deadline date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 创建 essays 表
CREATE TABLE IF NOT EXISTS public.essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  essay_type text NOT NULL,
  title text,
  content text,
  version integer DEFAULT 1,
  status text DEFAULT 'draft',
  ai_model text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own essays"
  ON public.essays FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 创建 application_materials 表
CREATE TABLE IF NOT EXISTS public.application_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  material_type text NOT NULL,
  material_name text NOT NULL,
  status text DEFAULT 'pending',
  file_url text,
  essay_id uuid REFERENCES public.essays(id) ON DELETE SET NULL,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.application_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own application materials"
  ON public.application_materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_materials.application_id
      AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_materials.application_id
      AND a.user_id = auth.uid()
    )
  );

-- 创建 essay_conversations 表
CREATE TABLE IF NOT EXISTS public.essay_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid REFERENCES public.essays(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.essay_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own essay conversations"
  ON public.essay_conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.essays e
      WHERE e.id = essay_conversations.essay_id
      AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.essays e
      WHERE e.id = essay_conversations.essay_id
      AND e.user_id = auth.uid()
    )
  );

-- 创建 Supabase Storage bucket 用于用户文件上传
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 2: 推送迁移到 Supabase**

```bash
cd ~/myoffer && npx supabase db push --linked
```

Expected: 迁移成功应用，所有表创建完成。

如果 `supabase` CLI 未安装或未链接，改用 Supabase Dashboard SQL Editor 手动执行 SQL。

- [ ] **Step 3: 验证表创建**

在 Supabase Dashboard → Table Editor 中确认以下表存在：
- `profiles`（含新增列）
- `programs`
- `applications`
- `essays`
- `application_materials`
- `essay_conversations`

- [ ] **Step 4: Commit**

```bash
cd ~/myoffer
git add supabase/migrations/20260402000001_extend_schema.sql
git commit -m "feat: add database schema for programs, applications, essays, and materials"
```

---

### Task 3: 更新 TypeScript 类型定义

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: 重写 types.ts 以匹配新 schema**

将 `src/integrations/supabase/types.ts` 中 `public.Tables` 部分替换为包含所有新表的完整类型定义。

`profiles` 表的 Row 类型新增以下字段：

```typescript
target_degree: string | null
current_education: string | null
school: string | null
major: string | null
cross_major: boolean | null
gpa: number | null
gpa_scale: number | null
language_type: string | null
language_score: Json | null
gre_gmat: Json | null
internship: string[] | null
research: string[] | null
awards: string[] | null
target_country: string[] | null
target_year: number | null
budget: string | null
ranking_req: string | null
special_needs: string | null
onboarding_completed: boolean | null
profile_summary: string | null
```

新增 `programs` 表类型（Row/Insert/Update），字段包括：
`id`, `university_name`, `university_name_cn`, `program_name`, `program_name_cn`, `degree_type`, `country`, `qs_ranking`, `department`, `duration`, `tuition`, `language_requirement`, `gpa_requirement`, `gre_required`, `deadline`, `application_link`, `required_materials`, `tags`, `description`, `created_at`

新增 `applications` 表类型：
`id`, `user_id`, `program_id`, `status`, `target_round`, `deadline`, `notes`, `created_at`, `updated_at`

新增 `essays` 表类型：
`id`, `user_id`, `application_id`, `essay_type`, `title`, `content`, `version`, `status`, `ai_model`, `created_at`, `updated_at`

新增 `application_materials` 表类型：
`id`, `application_id`, `material_type`, `material_name`, `status`, `file_url`, `essay_id`, `due_date`, `created_at`, `updated_at`

新增 `essay_conversations` 表类型：
`id`, `essay_id`, `role`, `content`, `created_at`

或者更好的方式：如果 Supabase CLI 已链接，运行 `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts` 自动生成。

- [ ] **Step 2: 验证类型编译**

```bash
cd ~/myoffer && npx tsc --noEmit 2>&1 | grep -i "error" | head -10
```

Expected: 无与 types.ts 相关的编译错误。

- [ ] **Step 3: Commit**

```bash
cd ~/myoffer
git add src/integrations/supabase/types.ts
git commit -m "feat: update TypeScript types for extended database schema"
```

---

### Task 4: 创建 AI Edge Function 调用封装

**Files:**
- Create: `src/lib/ai.ts`

- [ ] **Step 1: 创建 ai.ts 工具库**

```typescript
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://aljmasuwwsipaurhqtiv.supabase.co";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * Call a Supabase Edge Function with SSE streaming support.
 * Used by onboarding-chat, school-matching, and essay-generation.
 */
export async function callEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errorData = await resp.json().catch(() => ({ error: "AI 服务暂时不可用" }));
    callbacks.onError(errorData.error || `HTTP ${resp.status}`);
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        callbacks.onDone(fullText);
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          callbacks.onToken(content);
        }
      } catch {
        // partial JSON, put back in buffer
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  callbacks.onDone(fullText);
}

/**
 * Extract <<<PROFILE_UPDATE:{...}>>> markers from AI response text.
 * Returns the extracted data and the cleaned text without markers.
 */
export function extractProfileUpdates(text: string): {
  cleanText: string;
  updates: Record<string, unknown>;
} {
  let updates: Record<string, unknown> = {};
  const matches = text.match(/<<<PROFILE_UPDATE:(.*?)>>>/g);

  if (matches) {
    for (const match of matches) {
      try {
        const json = match.replace("<<<PROFILE_UPDATE:", "").replace(">>>", "");
        const data = JSON.parse(json);
        updates = { ...updates, ...data };
      } catch { /* ignore parse errors */ }
    }
  }

  const cleanText = text.replace(/<<<PROFILE_UPDATE:.*?>>>/g, "").trim();
  return { cleanText, updates };
}
```

- [ ] **Step 2: 验证导入无错误**

```bash
cd ~/myoffer && npx tsc --noEmit src/lib/ai.ts 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
cd ~/myoffer
git add src/lib/ai.ts
git commit -m "feat: add Edge Function streaming client and profile extraction utils"
```

---

### Task 5: 迁移 onboarding-chat Edge Function 到智谱 API

**Files:**
- Modify: `supabase/functions/onboarding-chat/index.ts`

- [ ] **Step 1: 在 Supabase Dashboard 添加 Secret**

在 Supabase Dashboard → Settings → Edge Functions → Secrets 中添加：
- `ZHIPU_API_KEY` = 你的智谱 API Key（从 https://open.bigmodel.cn 获取）

- [ ] **Step 2: 重写 Edge Function 使用智谱 API**

替换 `supabase/functions/onboarding-chat/index.ts` 的全部内容：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, profileData, file_url } = await req.json();
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");
    if (!ZHIPU_API_KEY) throw new Error("ZHIPU_API_KEY is not configured");

    const filledFields = Object.entries(profileData || {})
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `你是MyOffer平台的专业留学申请顾问，正在帮助中国学生整理留学申请所需信息。

你的工作方式：
- 每次只提问1个问题，等用户回答后再继续
- 已经知道的信息不重复询问
- 语气亲切自然，像朋友一样交流，适当使用emoji
- 用户上传文件时，你会收到文件相关信息，根据信息更新已知内容并继续追问缺失内容
- 当用户想跳过某个问题时，礼貌接受并继续下一个
- 收集完足够信息后，主动提出生成档案摘要
- 始终用中文回复

当前已收集的信息：
${filledFields || "（暂无）"}

需要收集的信息字段（按优先级顺序追问）：
1. 学术背景：当前学历、目标学历、就读学校、专业方向、是否有意向跨专业申请、GPA/均分
2. 标准化成绩：语言成绩类型（托福/雅思）及分数、GRE/GMAT分数
3. 软实力经历：实习经历、科研经历（含论文发表）、竞赛获奖、创业经历、志愿服务、海外经历、其他课外经历
4. 申请偏好：目标国家/地区、留学预算、申请学年、奖学金要求、目标院校排名要求、特殊需求

重要规则：
- 当用户回答问题时，在你的回复末尾（另起一行）用以下格式标注提取到的信息：
  <<<PROFILE_UPDATE:{"字段名":"值"}>>>
- 可用字段名：targetDegree, currentEducation, school, major, crossMajor, gpa, languageType, languageScore, greGmat, internship, research, awards, entrepreneurship, volunteer, overseas, otherActivities, targetCountry, budget, targetYear, scholarship, rankingReq, specialNeeds
- 每次只提取本轮新获得的信息
- 用户看不到<<<PROFILE_UPDATE>>>标记，它会被前端自动隐藏
- 当用户上传文件时，尽可能从文件描述中提取信息并用同样格式标注`;

    // Build messages array for OpenAI-compatible API
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // If a file was uploaded, add context about it
    if (file_url) {
      apiMessages.push({
        role: "user",
        content: `[系统提示：用户上传了一个文件，URL为 ${file_url}，请根据对话上下文推断文件内容并提取相关信息]`,
      });
    }

    const response = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model: "glm-4-flash",
          messages: apiMessages,
          stream: true,
          temperature: 0.8,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zhipu API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI 服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Zhipu API returns OpenAI-compatible SSE stream, pass through directly
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();

            if (jsonStr === "[DONE]") {
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                const chunk = {
                  choices: [{ delta: { content } }],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {
              // skip unparseable lines
            }
          }
        }

        // Ensure [DONE] is sent
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 3: 部署 Edge Function**

```bash
cd ~/myoffer && npx supabase functions deploy onboarding-chat --linked
```

- [ ] **Step 4: 测试对话**

在浏览器中访问 `http://localhost:8080`，登录后进入 onboarding 页面，输入"我想申请硕士"，验证 AI 正常流式响应。

- [ ] **Step 5: Commit**

```bash
cd ~/myoffer
git add supabase/functions/onboarding-chat/index.ts
git commit -m "feat: migrate onboarding-chat from Gemini to Zhipu GLM-4-Flash"
```

---

### Task 6: 创建 useProfile hook — 将档案数据持久化到 Supabase

**Files:**
- Create: `src/hooks/useProfile.ts`

- [ ] **Step 1: 创建 useProfile hook**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Profile field mapping: AI response keys → database column names
const FIELD_MAP: Record<string, string> = {
  targetDegree: "target_degree",
  currentEducation: "current_education",
  school: "school",
  major: "major",
  crossMajor: "cross_major",
  gpa: "gpa",
  languageType: "language_type",
  languageScore: "language_score",
  greGmat: "gre_gmat",
  internship: "internship",
  research: "research",
  awards: "awards",
  targetCountry: "target_country",
  targetYear: "target_year",
  budget: "budget",
  rankingReq: "ranking_req",
  specialNeeds: "special_needs",
  entrepreneurship: "special_needs", // stored in special_needs as text
  volunteer: "special_needs",
  overseas: "special_needs",
  otherActivities: "special_needs",
};

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Convert AI field names to DB column names
      const dbUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = FIELD_MAP[key] || key;
        // Handle array fields
        if (["internship", "research", "awards", "target_country"].includes(dbKey)) {
          const current = (profile as any)?.[dbKey] || [];
          if (Array.isArray(value)) {
            dbUpdates[dbKey] = value;
          } else if (typeof value === "string") {
            dbUpdates[dbKey] = [...current, value];
          }
        } else {
          dbUpdates[dbKey] = value;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async (summary: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true, profile_summary: summary })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    completeOnboarding: completeOnboarding.mutate,
  };
}
```

- [ ] **Step 2: 验证编译**

```bash
cd ~/myoffer && npx tsc --noEmit src/hooks/useProfile.ts 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
cd ~/myoffer
git add src/hooks/useProfile.ts
git commit -m "feat: add useProfile hook for profile persistence to Supabase"
```

---

### Task 7: 重写 useGeminiChat → useOnboardingChat 连接真实 API + 档案持久化

**Files:**
- Modify: `src/hooks/useGeminiChat.ts` → rename to `src/hooks/useOnboardingChat.ts`
- Modify: `src/pages/OnboardingChat.tsx` (update import)

- [ ] **Step 1: 创建 useOnboardingChat.ts**

```typescript
import { useState, useCallback } from "react";
import { callEdgeFunction, extractProfileUpdates } from "@/lib/ai";
import { useProfile } from "./useProfile";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content: "你好！我是你的留学申请顾问，很高兴认识你 😊 我会一步步帮你整理申请材料。先从基本情况开始——请问你想申请本科、硕士还是博士项目呢？",
  },
  {
    id: "2",
    role: "ai",
    content: "在开始之前，你也可以先把手头的材料上传给我——比如成绩单、简历、获奖证书或其他任何文件，我来帮你自动识别信息 📎",
  },
];

export function useOnboardingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const { profile, updateProfile } = useProfile();

  const sendMessage = useCallback(async (text: string, fileUrl?: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

    // Build API messages (skip initial static messages)
    const allMessages = [...messages, userMsg];
    const apiMessages = allMessages
      .filter((m) => m.id !== "1" && m.id !== "2")
      .map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

    // Include initial context for first message
    if (apiMessages.filter((m) => m.role === "user").length === 1) {
      apiMessages.unshift(
        { role: "assistant", content: INITIAL_MESSAGES[0].content },
        { role: "assistant", content: INITIAL_MESSAGES[1].content }
      );
    }

    // Build profileData from current profile
    const profileData: Record<string, string> = {};
    if (profile) {
      if (profile.school) profileData.school = profile.school;
      if (profile.major) profileData.major = profile.major;
      if (profile.gpa) profileData.gpa = String(profile.gpa);
      if (profile.target_degree) profileData.targetDegree = profile.target_degree;
      if (profile.language_type) profileData.languageType = profile.language_type;
      if (profile.target_country) profileData.targetCountry = profile.target_country.join(", ");
    }

    let fullText = "";

    try {
      await callEdgeFunction(
        "onboarding-chat",
        {
          messages: apiMessages,
          profileData,
          ...(fileUrl ? { file_url: fileUrl } : {}),
        },
        {
          onToken: (token) => {
            fullText += token;
            const captured = fullText;
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: captured } : m))
            );
          },
          onDone: (text) => {
            const { cleanText, updates } = extractProfileUpdates(text);
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: cleanText } : m))
            );
            // Persist profile updates to Supabase
            if (Object.keys(updates).length > 0) {
              updateProfile(updates);
            }
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, content: `抱歉，AI 服务暂时不可用：${error}` }
                  : m
              )
            );
          },
        }
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: `抱歉，出现错误：${err.message || "未知错误"}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, profile, updateProfile]);

  return { messages, isLoading, sendMessage };
}
```

- [ ] **Step 2: 更新 OnboardingChat.tsx 导入**

在 `src/pages/OnboardingChat.tsx` 中：

将 `import { useGeminiChat } from "@/hooks/useGeminiChat";` 改为：
```typescript
import { useOnboardingChat } from "@/hooks/useOnboardingChat";
```

将 `const { messages, isLoading, sendMessage } = useGeminiChat();` 改为：
```typescript
const { messages, isLoading, sendMessage } = useOnboardingChat();
```

- [ ] **Step 3: 更新文件上传处理**

在 `OnboardingChat.tsx` 的 `handleFileUpload` 函数中，增加 Supabase Storage 上传逻辑：

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  const names = Array.from(files).map((f) => f.name);
  setUploadedFiles((prev) => [...prev, ...names]);

  // Upload to Supabase Storage
  for (const file of Array.from(files)) {
    const path = `${user?.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("user-documents")
      .upload(path, file);
    if (error) {
      console.error("Upload error:", error);
    }
  }

  sendMessage(`我上传了以下文件：${names.join(", ")}，请帮我解析其中的信息。`);
};
```

需要在文件顶部添加导入：
```typescript
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
```

并在组件内获取 user：
```typescript
const { user } = useAuth();
```

- [ ] **Step 4: 验证编译 + 手动测试**

```bash
cd ~/myoffer && npx tsc --noEmit 2>&1 | grep -c "error"
```

Expected: 0 errors。启动 dev server 测试对话流程。

- [ ] **Step 5: Commit**

```bash
cd ~/myoffer
git add src/hooks/useOnboardingChat.ts src/pages/OnboardingChat.tsx
git commit -m "feat: replace Gemini chat with Zhipu-powered onboarding, persist profile to DB"
```

---

### Task 8: 创建 school-matching Edge Function

**Files:**
- Create: `supabase/functions/school-matching/index.ts`

- [ ] **Step 1: 在 Supabase Dashboard 确认 ZHIPU_API_KEY Secret 已添加**

（Task 5 中已添加，此处确认即可）

- [ ] **Step 2: 创建 school-matching Edge Function**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { profile, filters } = await req.json();
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");
    if (!ZHIPU_API_KEY) throw new Error("ZHIPU_API_KEY is not configured");

    // Create Supabase client to query programs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Pre-filter programs from database
    let query = supabase.from("programs").select("*");

    if (filters?.countries?.length) {
      query = query.in("country", filters.countries);
    }
    if (filters?.degree) {
      query = query.eq("degree_type", filters.degree);
    }

    const { data: programs, error: dbError } = await query;
    if (dbError) throw dbError;

    if (!programs || programs.length === 0) {
      return new Response(
        JSON.stringify({ schools: [], message: "暂无匹配的项目，请尝试放宽筛选条件" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Build prompt for AI scoring
    const profileSummary = `
学生背景：
- 学校：${profile.school || "未知"}
- 专业：${profile.major || "未知"}
- GPA：${profile.gpa || "未知"}/${profile.gpa_scale || 4.0}
- 语言成绩：${profile.language_type || "未知"} ${JSON.stringify(profile.language_score) || "未知"}
- GRE/GMAT：${JSON.stringify(profile.gre_gmat) || "无"}
- 目标学位：${profile.target_degree || "硕士"}
- 目标国家：${(profile.target_country || []).join(", ") || "未指定"}
- 实习经历：${(profile.internship || []).join("; ") || "无"}
- 科研经历：${(profile.research || []).join("; ") || "无"}
- 获奖经历：${(profile.awards || []).join("; ") || "无"}
- 预算：${profile.budget || "未指定"}
- 排名要求：${profile.ranking_req || "未指定"}
`.trim();

    const programsList = programs.map((p: any, i: number) =>
      `${i + 1}. ${p.university_name}(${p.university_name_cn || ""}) - ${p.program_name}
   国家：${p.country} | QS：${p.qs_ranking || "N/A"} | GPA要求：${p.gpa_requirement || "N/A"} | 学费：${p.tuition || "N/A"}
   标签：${(p.tags || []).join(", ")}`
    ).join("\n");

    const systemPrompt = `你是一个专业的留学选校顾问AI。根据学生的背景信息和候选院校列表，为每个院校给出录取概率评估和推荐理由。

评估规则：
1. 综合考虑学生的 GPA、语言成绩、科研/实习、本科院校背景
2. 录取概率分三档：冲刺校(15-40%)、匹配校(40-70%)、保底校(70%+)
3. 双非学生相比985/211，同等条件下概率降低10-15个百分点
4. 每个学校给出2-3句推荐理由，包含优劣势

你必须按以下JSON格式输出，不要输出其他内容：
{"schools":[{"program_index":1,"probability":65,"tier":"match","reason":"匹配度高，该项目..."},...]}

program_index 是候选列表中的序号（从1开始）。`;

    const response = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model: "glm-4-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${profileSummary}\n\n候选院校列表：\n${programsList}` },
          ],
          stream: true,
          temperature: 0.3,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zhipu API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI 选校服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response with thinking steps
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        // Send thinking steps first
        const thinkingSteps = [
          `正在分析你的背景信息...`,
          `在 ${programs.length} 个项目中进行匹配...`,
          `正在计算录取概率...`,
        ];
        for (const step of thinkingSteps) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "thinking", content: step })}\n\n`)
          );
        }

        // Read AI response
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);

            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch { /* skip */ }
          }
        }

        // Parse AI response and merge with program data
        try {
          // Extract JSON from response (AI might wrap it in markdown code blocks)
          const jsonMatch = fullText.match(/\{[\s\S]*"schools"[\s\S]*\}/);
          if (!jsonMatch) throw new Error("Invalid AI response format");

          const aiResult = JSON.parse(jsonMatch[0]);
          const enrichedSchools = aiResult.schools.map((s: any) => {
            const program = programs[s.program_index - 1];
            if (!program) return null;
            return {
              program_id: program.id,
              university_name: program.university_name,
              university_name_cn: program.university_name_cn,
              program_name: program.program_name,
              country: program.country,
              qs_ranking: program.qs_ranking,
              tuition: program.tuition,
              deadline: program.deadline,
              required_materials: program.required_materials,
              tags: program.tags,
              application_link: program.application_link,
              probability: s.probability,
              tier: s.tier,
              reason: s.reason,
            };
          }).filter(Boolean);

          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "result", schools: enrichedSchools })}\n\n`)
          );
        } catch (parseErr) {
          console.error("Parse error:", parseErr, "Raw:", fullText);
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: "error", content: "选校结果解析失败，请重试" })}\n\n`)
          );
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("school-matching error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 3: 部署 Edge Function**

```bash
cd ~/myoffer && npx supabase functions deploy school-matching --linked
```

- [ ] **Step 4: Commit**

```bash
cd ~/myoffer
git add supabase/functions/school-matching/index.ts
git commit -m "feat: add school-matching Edge Function with Zhipu AI scoring"
```

---

### Task 9: 种子数据 — 填充 programs 表（50个热门项目）

**Files:**
- Create: `supabase/seed/programs.sql`

- [ ] **Step 1: 创建种子数据文件**

创建 `supabase/seed/programs.sql`，包含约 50 个热门留学项目。示例格式：

```sql
INSERT INTO public.programs (university_name, university_name_cn, program_name, program_name_cn, degree_type, country, qs_ranking, department, duration, tuition, language_requirement, gpa_requirement, gre_required, deadline, application_link, required_materials, tags, description)
VALUES
-- 英国
('University College London', 'UCL', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 9, 'Computer Science', '1年', '£35,000/年',
 '{"toefl_min": 92, "ielts_min": 7.0}', 3.3, false,
 '{"round1": "2027-03-01"}',
 'https://www.ucl.ac.uk/prospective-students/',
 ARRAY['transcript', 'sop', 'cv', 'recommendation_2'],
 ARRAY['G5', 'STEM', '双非友好', '数据科学'],
 'UCL计算机系的数据科学硕士项目，涵盖机器学习、统计建模和大数据分析。'),

('Imperial College London', '帝国理工学院', 'MSc Computing', '计算机硕士', 'master', 'UK', 6, 'Computing', '1年', '£38,900/年',
 '{"toefl_min": 92, "ielts_min": 7.0}', 3.5, false,
 '{"round1": "2027-01-15"}',
 'https://www.imperial.ac.uk/computing/',
 ARRAY['transcript', 'sop', 'recommendation_2'],
 ARRAY['G5', 'STEM', '顶尖理工'],
 '帝国理工计算机硕士，英国顶尖CS项目之一。'),

('University of Edinburgh', '爱丁堡大学', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 22, 'Informatics', '1年', '£36,700/年',
 '{"toefl_min": 92, "ielts_min": 7.0}', 3.3, false,
 '{"round1": "2027-04-01"}',
 'https://www.ed.ac.uk/studying/postgraduate/',
 ARRAY['transcript', 'sop', 'recommendation_2'],
 ARRAY['罗素集团', 'STEM', 'AI研究强', '双非友好'],
 '爱丁堡大学信息学院数据科学项目，AI研究实力强劲。'),

('University of Manchester', '曼彻斯特大学', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 32, 'Computer Science', '1年', '£32,000/年',
 '{"toefl_min": 87, "ielts_min": 6.5}', 3.0, false,
 '{"round1": "2027-06-30"}',
 'https://www.manchester.ac.uk/study/',
 ARRAY['transcript', 'sop', 'recommendation_2'],
 ARRAY['罗素集团', 'STEM', '性价比高', '双非友好'],
 '曼大数据科学硕士，性价比高，认可度好。'),

('King''s College London', '伦敦国王学院', 'MSc Data Science', '数据科学硕士', 'master', 'UK', 40, 'Informatics', '1年', '£33,660/年',
 '{"toefl_min": 92, "ielts_min": 7.0}', 3.3, false,
 '{"round1": "2027-07-31"}',
 'https://www.kcl.ac.uk/study/postgraduate/',
 ARRAY['transcript', 'sop', 'cv', 'recommendation_2'],
 ARRAY['罗素集团', 'STEM', '伦敦位置', '双非友好'],
 'KCL数据科学硕士，位于伦敦市中心，就业资源丰富。'),

-- 美国
('Carnegie Mellon University', '卡内基梅隆大学', 'MISM - Business Intelligence', '信息系统管理硕士', 'master', 'US', 52, 'Information Systems', '1.5年', '$54,000/年',
 '{"toefl_min": 100, "ielts_min": 7.5}', 3.5, false,
 '{"round1": "2027-01-10", "round2": "2027-03-01"}',
 'https://www.cmu.edu/ini/admissions/',
 ARRAY['transcript', 'sop', 'cv', 'recommendation_3', 'gre'],
 ARRAY['CS强校', 'STEM', '就业极强'],
 'CMU MISM-BIDA方向，结合技术和商业分析。'),

('Columbia University', '哥伦比亚大学', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 23, 'Computer Science', '1.5年', '$58,000/年',
 '{"toefl_min": 101, "ielts_min": 7.0}', 3.5, true,
 '{"round1": "2027-02-15"}',
 'https://www.cs.columbia.edu/admissions/',
 ARRAY['transcript', 'sop', 'cv', 'recommendation_3', 'gre'],
 ARRAY['藤校', 'STEM', '纽约位置'],
 '哥大CS硕士，藤校背景+纽约资源。'),

('University of Southern California', '南加州大学', 'MS Computer Science', '计算机科学硕士', 'master', 'US', 134, 'Computer Science', '2年', '$62,000/年',
 '{"toefl_min": 90, "ielts_min": 6.5}', 3.3, true,
 '{"round1": "2026-12-15"}',
 'https://www.cs.usc.edu/admissions/',
 ARRAY['transcript', 'sop', 'cv', 'recommendation_3', 'gre'],
 ARRAY['STEM', '洛杉矶', '双非友好', '就业好'],
 'USC CS硕士，洛杉矶科技中心，对国际生友好。'),

-- 香港
('The University of Hong Kong', '香港大学', 'MSc Computer Science', '计算机科学硕士', 'master', 'HK', 26, 'Computer Science', '1-2年', 'HK$198,000/年',
 '{"toefl_min": 80, "ielts_min": 6.0}', 3.3, false,
 '{"round1": "2027-01-31"}',
 'https://www.cs.hku.hk/programmes/',
 ARRAY['transcript', 'sop', 'cv', 'recommendation_2'],
 ARRAY['亚洲顶尖', '性价比高', '双非友好', '离家近'],
 '港大CS硕士，亚洲顶尖，离内地近。'),

('The Chinese University of Hong Kong', '香港中文大学', 'MSc Information Engineering', '信息工程硕士', 'master', 'HK', 36, 'Information Engineering', '1年', 'HK$180,000/年',
 '{"toefl_min": 79, "ielts_min": 6.5}', 3.0, false,
 '{"round1": "2027-02-28"}',
 'https://www.ie.cuhk.edu.hk/',
 ARRAY['transcript', 'sop', 'recommendation_2'],
 ARRAY['亚洲名校', '双非友好', '性价比高'],
 '港中文信息工程硕士，双非友好，性价比高。'),

-- 新加坡
('National University of Singapore', '新加坡国立大学', 'MSc Business Analytics', '商业分析硕士', 'master', 'SG', 8, 'Business', '1年', 'S$58,000/年',
 '{"toefl_min": 85, "ielts_min": 6.0}', 3.3, false,
 '{"round1": "2027-03-15"}',
 'https://scale.nus.edu.sg/programmes/',
 ARRAY['transcript', 'sop', 'cv', 'recommendation_2', 'gmat'],
 ARRAY['亚洲第一', '就业强', 'STEM'],
 'NUS商业分析硕士，亚洲排名第一。'),

-- 澳大利亚
('The University of Sydney', '悉尼大学', 'Master of Data Science', '数据科学硕士', 'master', 'AU', 19, 'Computer Science', '2年', 'A$50,000/年',
 '{"toefl_min": 85, "ielts_min": 6.5}', 3.0, false,
 '{"round1": "2027-07-31"}',
 'https://www.sydney.edu.au/courses/',
 ARRAY['transcript', 'sop', 'cv'],
 ARRAY['双非友好', 'PSW签证', '录取友好', '2年制'],
 '悉尼大学数据科学硕士，对双非友好，毕业后可申请PSW工签。'),

('The University of Melbourne', '墨尔本大学', 'Master of Information Technology', '信息技术硕士', 'master', 'AU', 14, 'Information Technology', '2年', 'A$47,000/年',
 '{"toefl_min": 79, "ielts_min": 6.5}', 3.0, false,
 '{"round1": "2027-10-31"}',
 'https://study.unimelb.edu.au/',
 ARRAY['transcript', 'sop', 'cv'],
 ARRAY['双非友好', 'PSW签证', '澳洲第一', '2年制'],
 '墨尔本大学IT硕士，澳洲第一，双非友好。');
```

注意：这只是示例的 13 个项目。实际需要填充约 50 个，覆盖英国、美国、香港、新加坡、澳大利亚、加拿大的热门 CS/DS/商科/金融项目。可以后续通过 AI 辅助批量生成更多数据。

- [ ] **Step 2: 在 Supabase Dashboard 执行种子数据**

将 SQL 粘贴到 Supabase Dashboard → SQL Editor 中执行。

- [ ] **Step 3: 验证数据**

在 Supabase Dashboard → Table Editor → programs 表中确认数据已插入。

- [ ] **Step 4: Commit**

```bash
cd ~/myoffer
mkdir -p supabase/seed
git add supabase/seed/programs.sql
git commit -m "feat: add seed data for 50 popular study abroad programs"
```

---

### Task 10: 创建 useSchools hook

**Files:**
- Create: `src/hooks/useSchools.ts`

- [ ] **Step 1: 创建 useSchools hook**

```typescript
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";

export interface MatchedSchool {
  program_id: string;
  university_name: string;
  university_name_cn: string | null;
  program_name: string;
  country: string;
  qs_ranking: number | null;
  tuition: string | null;
  deadline: Record<string, string> | null;
  required_materials: string[] | null;
  tags: string[] | null;
  application_link: string | null;
  probability: number;
  tier: "reach" | "match" | "safety";
  reason: string;
}

export interface ThinkingStep {
  content: string;
}

export function useSchools() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [matchedSchools, setMatchedSchools] = useState<MatchedSchool[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const startMatching = useCallback(async () => {
    if (!profile || isMatching) return;

    setIsMatching(true);
    setMatchedSchools([]);
    setThinkingSteps([]);
    setMatchError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(
        `https://aljmasuwwsipaurhqtiv.supabase.co/functions/v1/school-matching`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            profile: {
              school: profile.school,
              major: profile.major,
              gpa: profile.gpa,
              gpa_scale: profile.gpa_scale,
              language_type: profile.language_type,
              language_score: profile.language_score,
              gre_gmat: profile.gre_gmat,
              target_degree: profile.target_degree,
              target_country: profile.target_country,
              internship: profile.internship,
              research: profile.research,
              awards: profile.awards,
              budget: profile.budget,
              ranking_req: profile.ranking_req,
            },
            filters: {
              countries: profile.target_country || [],
              degree: profile.target_degree || "master",
            },
          }),
        }
      );

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({ error: "选校服务不可用" }));
        setMatchError(errorData.error || "选校服务不可用");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "thinking") {
              setThinkingSteps((prev) => [...prev, { content: parsed.content }]);
            } else if (parsed.type === "result") {
              setMatchedSchools(parsed.schools || []);
            } else if (parsed.type === "error") {
              setMatchError(parsed.content);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setMatchError(err.message || "选校失败");
    } finally {
      setIsMatching(false);
    }
  }, [profile, isMatching]);

  // Add a school to applications
  const addToApplications = useMutation({
    mutationFn: async (school: MatchedSchool) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create application
      const { data: app, error: appError } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          program_id: school.program_id,
          status: "in_progress",
          deadline: school.deadline?.round1 || null,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Auto-initialize material checklist from required_materials
      if (school.required_materials?.length && app) {
        const materialNames: Record<string, string> = {
          transcript: "成绩单",
          sop: "SOP动机信",
          ps: "PS个人陈述",
          cv: "CV简历",
          recommendation_2: "推荐信 x2",
          recommendation_3: "推荐信 x3",
          gre: "GRE成绩",
          gmat: "GMAT成绩",
          toefl: "托福成绩",
          ielts: "雅思成绩",
        };

        const materials = school.required_materials.map((type) => ({
          application_id: app.id,
          material_type: type,
          material_name: materialNames[type] || type,
          status: "pending" as const,
        }));

        const { error: matError } = await supabase
          .from("application_materials")
          .insert(materials);

        if (matError) console.error("Material init error:", matError);
      }

      return app;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  return {
    matchedSchools,
    thinkingSteps,
    isMatching,
    matchError,
    startMatching,
    addToApplications: addToApplications.mutate,
    isAddingToApps: addToApplications.isPending,
  };
}
```

- [ ] **Step 2: 验证编译**

```bash
cd ~/myoffer && npx tsc --noEmit src/hooks/useSchools.ts 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
cd ~/myoffer
git add src/hooks/useSchools.ts
git commit -m "feat: add useSchools hook for AI school matching and application creation"
```

---

### Task 11: 重写 SchoolMatching 页面连接真实数据

**Files:**
- Modify: `src/pages/SchoolMatching.tsx`

- [ ] **Step 1: 重写 SchoolMatching.tsx**

替换整个文件，将 mock 数据替换为真实 AI 匹配结果。保留现有的 UI 结构（三档分类、卡片样式、统计栏）。

关键变化：
1. 导入 `useSchools` 和 `useProfile`
2. 页面加载时，如果 `profile.onboarding_completed`，自动触发 `startMatching()`
3. 如果 onboarding 未完成，显示引导去完成信息录入
4. 思考过程可视化：显示 `thinkingSteps` 列表
5. 将 `MatchedSchool` 按 `tier` 分组（reach/match/safety）
6. "加入申请列表"按钮调用 `addToApplications`
7. 统计栏显示真实数据

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Target, BarChart3, ChevronDown, ChevronUp,
  ExternalLink, MapPin, DollarSign, Award, Loader2, ArrowLeft, RefreshCw,
} from "lucide-react";
import { useSchools, MatchedSchool } from "@/hooks/useSchools";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const categories = [
  { title: "冲刺校", tier: "reach" as const, range: "15-40%", color: "warning" },
  { title: "匹配校", tier: "match" as const, range: "40-70%", color: "info" },
  { title: "保底校", tier: "safety" as const, range: "70%+", color: "purple" },
];

function SchoolCard({
  school,
  onAdd,
  isAdding,
}: {
  school: MatchedSchool;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const probColor =
    school.probability < 40 ? "text-warning" : school.probability < 70 ? "text-info" : "text-success";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm">
              {school.university_name_cn || school.university_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{school.program_name}</p>
          </div>
          <span className={`text-lg font-bold ${probColor}`}>{school.probability}%</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{school.country}</span>
          {school.qs_ranking && (
            <span className="flex items-center gap-1"><Award className="w-3 h-3" />QS #{school.qs_ranking}</span>
          )}
          {school.tuition && (
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{school.tuition}</span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{school.reason}</p>

        {school.tags && (
          <div className="flex flex-wrap gap-1">
            {school.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {expanded ? "收起详情" : "展开详情"}
        </Button>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border animate-message-in">
            <div className="text-xs space-y-1">
              {school.deadline && (
                <p><span className="text-muted-foreground">截止日期：</span>
                  {Object.entries(school.deadline).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                </p>
              )}
              {school.required_materials && (
                <p><span className="text-muted-foreground">所需材料：</span>
                  {school.required_materials.join("、")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs" onClick={onAdd} disabled={isAdding}>
                {isAdding ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                加入申请列表
              </Button>
              {school.application_link && (
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <a href={school.application_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />官网
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchoolMatching() {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useProfile();
  const {
    matchedSchools, thinkingSteps, isMatching, matchError,
    startMatching, addToApplications, isAddingToApps,
  } = useSchools();

  useEffect(() => {
    if (profile?.onboarding_completed && matchedSchools.length === 0 && !isMatching) {
      startMatching();
    }
  }, [profile?.onboarding_completed]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.onboarding_completed) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">请先完成信息录入，AI 才能为你匹配学校</p>
        <Button onClick={() => navigate("/onboarding")}>
          去完成信息录入
        </Button>
      </div>
    );
  }

  const totalSchools = matchedSchools.length;
  const avgProb = totalSchools > 0
    ? Math.round(matchedSchools.reduce((s, c) => s + c.probability, 0) / totalSchools)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">AI 智能选校</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/onboarding")}>
            <ArrowLeft className="w-4 h-4 mr-1" />修改信息
          </Button>
          <Button variant="outline" size="sm" onClick={startMatching} disabled={isMatching}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isMatching ? "animate-spin" : ""}`} />
            重新匹配
          </Button>
        </div>
      </div>

      {/* Thinking Process */}
      {isMatching && (
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              AI 正在分析...
            </div>
            {thinkingSteps.map((step, i) => (
              <p key={i} className="text-xs text-muted-foreground ml-6">✓ {step.content}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {matchError && (
        <Card className="border-destructive">
          <CardContent className="p-5 text-sm text-destructive">{matchError}</CardContent>
        </Card>
      )}

      {/* Stats */}
      {totalSchools > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">匹配项目数</p>
                  <p className="text-2xl font-bold">{totalSchools}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">平均录取概率</p>
                  <p className="text-2xl font-bold">{avgProb}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-11 h-11 rounded-xl bg-purple/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">冲/匹/保 分布</p>
                  <p className="text-2xl font-bold">
                    {matchedSchools.filter((s) => s.tier === "reach").length}/
                    {matchedSchools.filter((s) => s.tier === "match").length}/
                    {matchedSchools.filter((s) => s.tier === "safety").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* School Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const schools = matchedSchools.filter((s) => s.tier === cat.tier);
              const headerColor =
                cat.color === "warning"
                  ? "bg-warning/10 text-warning"
                  : cat.color === "info"
                  ? "bg-primary/10 text-primary"
                  : "bg-purple/10 text-purple";

              return (
                <div key={cat.title} className="space-y-3">
                  <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${headerColor}`}>
                    <span className="font-semibold text-sm">{cat.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {schools.length} 个 · {cat.range}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {schools.length > 0 ? (
                      schools.map((s) => (
                        <SchoolCard
                          key={s.program_id}
                          school={s}
                          onAdd={() => {
                            addToApplications(s);
                            toast.success(`${s.university_name_cn || s.university_name} 已加入申请列表`);
                          }}
                          isAdding={isAddingToApps}
                        />
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">暂无{cat.title}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证编译**

```bash
cd ~/myoffer && npx tsc --noEmit 2>&1 | grep -c "error"
```

Expected: 0 errors。

- [ ] **Step 3: 手动测试**

1. 启动 dev server：`npm run dev`
2. 登录 → 完成 onboarding 对话
3. 进入 `/schools` 页面
4. 验证思考过程动画显示
5. 验证选校结果三档展示
6. 点击"加入申请列表"按钮
7. 在 Supabase Dashboard 的 `applications` 和 `application_materials` 表中确认数据写入

- [ ] **Step 4: Commit**

```bash
cd ~/myoffer
git add src/pages/SchoolMatching.tsx
git commit -m "feat: replace mock school data with AI-powered school matching"
```

---

### Task 12: 清理旧代码 + 最终验证

**Files:**
- Delete: `src/hooks/useGeminiChat.ts` (如果 Task 7 中未删除)
- Verify: 全项目编译和运行

- [ ] **Step 1: 删除旧的 useGeminiChat.ts**

```bash
rm ~/myoffer/src/hooks/useGeminiChat.ts
```

- [ ] **Step 2: 确认无引用残留**

```bash
cd ~/myoffer && grep -r "useGeminiChat" src/ --include="*.ts" --include="*.tsx"
```

Expected: 无输出。如果有残留引用，更新为 `useOnboardingChat`。

- [ ] **Step 3: 全项目编译验证**

```bash
cd ~/myoffer && npx tsc --noEmit 2>&1 | tail -3
```

Expected: 无错误。

- [ ] **Step 4: 启动开发服务器验证**

```bash
cd ~/myoffer && npm run dev
```

在浏览器中走通完整流程：
1. 注册/登录
2. AI 对话录入信息
3. 进入选校页面，AI 匹配生成结果
4. 点击"加入申请列表"

- [ ] **Step 5: Commit**

```bash
cd ~/myoffer
git add -A
git commit -m "chore: remove legacy Gemini chat hook, clean up Sprint 1"
```

---

## Sprint 2 概要（Task 13-20）

Sprint 2 的详细实施计划将在 Sprint 1 完成后单独编写。以下是概要：

| Task | 描述 | 文件 |
|------|------|------|
| 13 | 创建 essay-generation Edge Function（千问 API） | `supabase/functions/essay-generation/index.ts` |
| 14 | 创建 useEssays hook | `src/hooks/useEssays.ts` |
| 15 | 重写 EssayWriting 页面（连接真实 AI） | `src/pages/EssayWriting.tsx` |
| 16 | 创建 useApplications hook | `src/hooks/useApplications.ts` |
| 17 | 重写 ApplicationTracker 页面（连接真实数据） | `src/pages/ApplicationTracker.tsx` |
| 18 | 文件上传组件（Supabase Storage） | `src/components/chat/FileUpload.tsx` |
| 19 | SettingsPage 连接真实 profile 数据 | `src/pages/SettingsPage.tsx` |
| 20 | 文书保存联动材料清单状态 | `src/hooks/useEssays.ts` + `useApplications.ts` |

## Sprint 3 概要（Task 21-25）

| Task | 描述 |
|------|------|
| 21 | UI 打磨：移动端适配、加载骨架屏、空状态 |
| 22 | 错误处理：全局错误边界、API 重试、离线提示 |
| 23 | QA 测试：全流程走通、边界情况 |
| 24 | Vercel 部署 + 域名配置 |
| 25 | AI 提示词调优 + 种子用户内测 |
