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

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 额度不足，请联系管理员" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
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
