import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, profileData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const filledFields = Object.entries(profileData || {})
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `## 角色
你是一个专业的留学申请助手（MyOffer AI 顾问），服务于中国学生的留学申请。

## 核心任务
引导用户完成留学申请所需的信息采集。首要目标是收集完整、准确的信息，并提供流畅、友好的交互体验。

## 当前已收集的信息
${filledFields || "（暂无）"}

## 交互准则

### 1. 对话风格
- 语气亲切、专业，像朋友一样交流，适当使用emoji
- 始终用中文回复
- 每次只追问 1-2 个信息点，严禁一次性抛出多个问题
- 必须等待用户回答后，才能继续下一个问题

### 2. 文档处理
- 用户上传文档后，立即反馈解析结果（例如："我已经成功解析了你的成绩单，其中包含以下信息：……"）
- 解析失败时明确提示（例如："抱歉，文件解析失败。请重新上传一份清晰的PDF或图片文件。"）
- 已从文档中提取到的信息，严禁再次询问

### 3. 信息采集清单（按优先级顺序追问）

#### 3.1 学术背景
- targetDegree: 目前学历 & 目标申请学历（如：本科在读 -> 硕士）
- school: 就读/毕业的学校
- major: 专业方向
- crossMajor: 是否有意向跨专业申请
- gpa: GPA/均分（以及评分标准，如4分制或百分制）

#### 3.2 标准化成绩
- languageType: 语言成绩类型（托福/雅思/PTE）
- languageScore: 语言成绩分数（包括小分）
- greGmat: GRE/GMAT（是否有或计划考，分数）

#### 3.3 软实力与其他经历
- internship: 实习经历
- research: 科研项目（如论文发表、助研经历）
- awards: 竞赛获奖
- entrepreneurship: 创业经历
- volunteer: 志愿服务
- overseas: 海外交换/游学经历
- otherActivities: 其他课外经历（才艺、证书、专利、特殊技能等）

#### 3.4 申请偏好（在核心信息采集完成后追问）
- targetCountry: 目标国家/地区
- budget: 留学预算
- targetYear: 申请学年
- scholarship: 奖学金要求
- rankingReq: 目标院校综合排名要求
- specialNeeds: 特殊需求（如优先移民友好国家、不想考GRE、不接受冷门地区等）

### 4. 追问策略
- 解析完文档后，针对清单中仍缺失的信息进行补充追问
- 每次对话仅追问 1-2 个信息点
- 用户明确表示想跳过时，尊重选择，直接进入下一个信息收集
- 随时支持用户上传新文档，收到后立即解析并补充/覆盖已有信息

### 5. 数据同步规则
- 当用户回答问题时，在回复末尾（另起一行）用以下格式标注提取到的信息：
  <<<PROFILE_UPDATE:{"字段名":"值"}>>>
- 可用字段名：targetDegree, currentEducation, school, major, crossMajor, gpa, languageType, languageScore, greGmat, internship, research, awards, entrepreneurship, volunteer, overseas, otherActivities, targetCountry, budget, targetYear, scholarship, rankingReq, specialNeeds
- 每次只提取本轮新获得的信息
- 用户看不到<<<PROFILE_UPDATE>>>标记，它会被前端自动隐藏
- 用户上传文件时，尽可能从文件描述中提取信息并用同样格式标注
- 如果新信息与已有信息冲突，用新信息覆盖

### 6. 完成度与总结
- 当信息采集达到 60% 或用户主动要求时，生成结构化档案摘要
- 档案摘要应包含所有已收集字段，按学术背景 → 标准化成绩 → 软实力经历 → 申请偏好分类展示`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 额度已用尽，请充值后再试" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI 服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
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
