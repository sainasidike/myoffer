import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { essay_id, application_id, messages, essay_type, current_content } =
      await req.json();

    // Try Qwen first, fall back to Zhipu
    const QWEN_API_KEY = Deno.env.get("QWEN_API_KEY");
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");

    if (!QWEN_API_KEY && !ZHIPU_API_KEY) {
      throw new Error("No AI API key configured (QWEN_API_KEY or ZHIPU_API_KEY)");
    }

    const useQwen = !!QWEN_API_KEY;
    const apiKey = useQwen ? QWEN_API_KEY : ZHIPU_API_KEY;
    const apiUrl = useQwen
      ? "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
      : "https://open.bigmodel.cn/api/paas/v4/chat/completions";
    const model = useQwen ? "qwen-plus" : "glm-4-flash";

    // Fetch context: user profile + program info
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let profileContext = "";
    let programContext = "";

    // Get user profile from auth header
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile) {
          profileContext = `
学生背景：
- 学校：${profile.school || "未知"}
- 专业：${profile.major || "未知"}
- GPA：${profile.gpa || "未知"}
- 实习：${(profile.internship || []).join("；") || "无"}
- 科研：${(profile.research || []).join("；") || "无"}
- 获奖：${(profile.awards || []).join("；") || "无"}
- 档案摘要：${profile.profile_summary || "无"}`;
        }
      }
    }

    // Get program info if application_id provided
    if (application_id) {
      const { data: app } = await supabase
        .from("applications")
        .select("*, programs(*)")
        .eq("id", application_id)
        .single();
      if (app?.programs) {
        const p = app.programs as Record<string, unknown>;
        programContext = `
目标院校项目：
- 学校：${p.university_name_cn || p.university_name}
- 项目：${p.program_name_cn || p.program_name}
- 国家：${p.country}
- QS排名：${p.qs_ranking || "未知"}
- 项目简介：${p.description || "无"}`;
      }
    }

    const essayTypeNames: Record<string, string> = {
      sop: "Statement of Purpose（个人陈述）",
      ps: "Personal Statement（个人陈述）",
      diversity: "Diversity Essay（多元化文书）",
      cv: "CV/Resume（简历）",
      recommendation: "推荐信草稿",
    };

    const typeName = essayTypeNames[essay_type] || essay_type || "文书";

    const systemPrompt = `你是一位资深的留学文书顾问，擅长为中国学生撰写高质量的英文留学申请文书。

你的工作方式：
1. 先通过对话了解学生的独特经历和亮点
2. 帮助学生构建叙事框架，标注【闪光点】
3. 生成符合目标院校风格的文书初稿
4. 根据反馈迭代修改

当前任务：撰写 ${typeName}

${profileContext}
${programContext}

写作原则：
- 用真实故事和具体细节打动人，避免空泛描述
- 展现申请者的独特性和成长历程
- 适配目标院校的偏好和文化
- 对双非背景学生，重点突出个人实力和发展潜力
- 结构清晰：开头吸引注意 → 核心故事 → 未来规划 → 与项目匹配
- 用中文与学生交流，文书正文用英文撰写
- 当输出完整文书时，用 Markdown 格式

${current_content ? `\n当前文书内容（用户可能要求修改）：\n\`\`\`\n${current_content}\n\`\`\`\n` : ""}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI 服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pass through the OpenAI-compatible SSE stream
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("essay-generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
