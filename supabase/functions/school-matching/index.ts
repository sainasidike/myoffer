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
    const { profile, filters } = await req.json();
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");
    if (!ZHIPU_API_KEY) throw new Error("ZHIPU_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Database pre-filter
    let query = supabase.from("programs").select("*");

    if (filters?.countries?.length > 0) {
      query = query.in("country", filters.countries);
    }
    if (filters?.degree) {
      query = query.eq("degree_type", filters.degree);
    }

    const { data: programs, error: dbError } = await query;
    if (dbError) throw dbError;

    if (!programs || programs.length === 0) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ type: "error", content: "未找到匹配的项目，请调整筛选条件" })}\n\n`
        )
      );
      writer.write(encoder.encode("data: [DONE]\n\n"));
      writer.close();
      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Step 2: Build AI prompt
    const programList = programs
      .map(
        (p, i) =>
          `${i + 1}. ${p.university_name}${p.university_name_cn ? `(${p.university_name_cn})` : ""} - ${p.program_name}${p.program_name_cn ? `(${p.program_name_cn})` : ""} | ${p.country} | QS排名: ${p.qs_ranking || "未知"} | GPA要求: ${p.gpa_requirement || "未知"} | 学费: ${p.tuition || "未知"} | 学制: ${p.duration || "未知"} | GRE要求: ${p.gre_required ? "是" : "否"} | 标签: ${(p.tags || []).join(",")}`
      )
      .join("\n");

    const profileSummary = `
学校: ${profile.school || "未知"}
专业: ${profile.major || "未知"}
GPA: ${profile.gpa || "未知"}/${profile.gpa_scale || 4.0}
语言: ${profile.language_type || "未知"} ${profile.language_score ? JSON.stringify(profile.language_score) : "未知"}
GRE/GMAT: ${profile.gre_gmat ? JSON.stringify(profile.gre_gmat) : "无"}
实习: ${(profile.internship || []).join("; ") || "无"}
科研: ${(profile.research || []).join("; ") || "无"}
获奖: ${(profile.awards || []).join("; ") || "无"}
目标国家: ${(profile.target_country || []).join(", ") || "未知"}
目标学年: ${profile.target_year || "未知"}
预算: ${profile.budget || "未知"}
排名要求: ${profile.ranking_req || "无"}
特殊需求: ${profile.special_needs || "无"}`.trim();

    const systemPrompt = `你是一个专业的留学选校顾问AI。根据学生背景和候选项目列表，分析每个项目的匹配度。

你的输出必须严格按照以下格式：

第一部分：思考过程（每一步用一行输出，前面加 [THINKING] 标记）
[THINKING]正在分析学生背景...
[THINKING]匹配中，共${programs.length}个候选项目...
[THINKING]计算录取概率...

第二部分：匹配结果（输出一个JSON数组，前面加 [RESULT] 标记）
[RESULT]
[{"program_id":"xxx","probability":75,"tier":"match","reason":"理由..."},...]

匹配规则：
- probability 为 0-100 的录取概率估计
- tier 分三档：reach(冲刺,概率<40), match(匹配,40-70), safety(保底,>70)
- reason 用中文简短说明推荐理由（50字内）
- 对双非学生适当降低概率估计，但要客观公正
- 综合考虑 GPA、语言成绩、软实力、目标排名等因素
- 最多推荐 15 个项目，按 probability 降序排列`;

    const userPrompt = `## 学生背景
${profileSummary}

## 候选项目列表
${programList}

请分析每个项目与该学生的匹配度，按格式输出思考过程和结果。`;

    // Step 3: Call AI with streaming
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
            { role: "user", content: userPrompt },
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
        JSON.stringify({ error: "AI 服务暂时不可用" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Transform AI stream into structured events
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
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
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
              }
            } catch {
              // skip
            }
          }
        }

        // Parse the full text to extract thinking steps and results
        const lines = fullText.split("\n");
        for (const l of lines) {
          if (l.startsWith("[THINKING]")) {
            const thinkContent = l.replace("[THINKING]", "").trim();
            if (thinkContent) {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "thinking", content: thinkContent })}\n\n`
                )
              );
            }
          }
        }

        // Extract result JSON
        const resultMatch = fullText.match(/\[RESULT\]\s*([\s\S]*?)$/);
        if (resultMatch) {
          const jsonMatch = resultMatch[1].match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              const schools = JSON.parse(jsonMatch[0]);
              // Enrich with program details
              const enriched = schools.map((s: { program_id: string; probability: number; tier: string; reason: string }) => {
                const prog = programs.find((p) => p.id === s.program_id);
                return { ...s, program: prog || null };
              });
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "result", schools: enriched })}\n\n`
                )
              );
            } catch {
              // If JSON parse fails, return programs with default scoring
              const fallback = programs.slice(0, 15).map((p) => ({
                program_id: p.id,
                probability: 50,
                tier: "match",
                reason: "AI 评分解析失败，显示默认结果",
                program: p,
              }));
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "result", schools: fallback })}\n\n`
                )
              );
            }
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream error:", e);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: "处理匹配结果时出错" })}\n\n`
          )
        );
        await writer.write(encoder.encode("data: [DONE]\n\n"));
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
