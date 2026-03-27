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

## 重要：你已经完成了以下步骤，严禁重复
1. 你已经问过用户想申请的阶段（本科/硕士/博士），用户已回答。
2. 你已经提示过用户可以上传材料（成绩单、简历等），严禁再次提示。
3. 现在你应该直接进入信息采集的下一步。

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
- 解析失败时明确提示
- 已从文档中提取到的信息，严禁再次询问

### 3. 信息采集清单（按优先级顺序追问，跳过已收集的）

#### 3.1 学术背景
- school: 就读/毕业的学校
- major: 专业方向（& 是否跨专业申请）
- gpa: GPA/均分（以及评分标准）

#### 3.2 标准化成绩
- languageType + languageScore: 语言成绩类型和分数（含小分）
- greGmat: GRE/GMAT

#### 3.3 软实力与经历
- internship: 实习经历
- research: 科研项目
- awards: 竞赛获奖
- entrepreneurship: 创业经历
- volunteer: 志愿服务
- overseas: 海外交换/游学
- otherActivities: 其他课外经历

#### 3.4 申请偏好（核心信息采集完成后追问）
- targetCountry: 目标国家/地区
- budget: 留学预算
- targetYear: 申请学年
- scholarship: 奖学金要求
- rankingReq: 目标院校排名要求
- specialNeeds: 特殊需求

### 4. 追问策略
- 每次仅追问 1-2 个信息点
- 用户跳过时尊重选择，直接下一个
- 用户上传文件时立即解析并补充

### 5. 数据同步规则
- 当用户回答问题时，在回复末尾另起一行用以下格式标注：
  <<<PROFILE_UPDATE:{"字段名":"值"}>>>
- 可用字段名：targetDegree, currentEducation, school, major, crossMajor, gpa, languageType, languageScore, greGmat, internship, research, awards, entrepreneurship, volunteer, overseas, otherActivities, targetCountry, budget, targetYear, scholarship, rankingReq, specialNeeds
- 每次只提取本轮新获得的信息
- 用户看不到<<<PROFILE_UPDATE>>>标记

### 6. 完成度与总结
- 信息采集达到 60% 或用户要求时，生成结构化档案摘要`;

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
