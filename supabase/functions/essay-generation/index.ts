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

    // ── Fetch context ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let profileContext = "";
    let programContext = "";
    // deno-lint-ignore no-explicit-any
    let programData: Record<string, any> | null = null;
    // deno-lint-ignore no-explicit-any
    let profileData: Record<string, any> | null = null;

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
          profileData = profile;
          profileContext = buildProfileContext(profile);
        }
      }
    }

    if (application_id) {
      const { data: app } = await supabase
        .from("applications")
        .select("*, programs(*)")
        .eq("id", application_id)
        .single();
      if (app?.programs) {
        programData = app.programs as Record<string, unknown>;
        programContext = buildProgramContext(programData);
      }
    }

    const systemPrompt = buildSystemPrompt(
      essay_type,
      profileContext,
      programContext,
      profileData,
      programData,
      current_content
    );

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
        temperature: 0.75,
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

// ─── Context Builders ────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
function buildProfileContext(p: Record<string, any>): string {
  const lines: string[] = [];
  if (p.school) lines.push(`院校：${p.school}`);
  if (p.major) lines.push(`专业：${p.major}`);
  if (p.gpa) lines.push(`GPA：${p.gpa}${p.gpa_scale ? "/" + p.gpa_scale : ""}`);
  if (p.language_type && p.language_score) {
    const s = p.language_score;
    lines.push(`语言：${p.language_type} 总分${s.overall || s.total || "?"}（阅读${s.reading || "?"}，写作${s.writing || "?"}，口语${s.speaking || "?"}，听力${s.listening || "?"}）`);
  }
  if (p.gre_gmat) lines.push(`GRE/GMAT：${typeof p.gre_gmat === "object" ? JSON.stringify(p.gre_gmat) : p.gre_gmat}`);
  if (p.internship?.length) lines.push(`实习经历：\n${p.internship.map((i: string) => `  - ${i}`).join("\n")}`);
  if (p.research?.length) lines.push(`科研经历：\n${p.research.map((r: string) => `  - ${r}`).join("\n")}`);
  if (p.awards?.length) lines.push(`获奖荣誉：\n${p.awards.map((a: string) => `  - ${a}`).join("\n")}`);
  if (p.profile_summary) lines.push(`档案摘要：${p.profile_summary}`);
  if (p.special_needs) lines.push(`特殊需求：${p.special_needs}`);
  return lines.length > 0 ? "【学生背景】\n" + lines.join("\n") : "";
}

// deno-lint-ignore no-explicit-any
function buildProgramContext(p: Record<string, any>): string {
  const lines: string[] = [];
  lines.push(`学校：${p.university_name_cn || p.university_name}`);
  lines.push(`项目：${p.program_name_cn || p.program_name}`);
  if (p.country) lines.push(`国家：${p.country}`);
  if (p.qs_ranking) lines.push(`QS排名：#${p.qs_ranking}`);
  if (p.department) lines.push(`院系：${p.department}`);
  if (p.duration) lines.push(`学制：${p.duration}`);
  if (p.program_type) lines.push(`类型：${p.program_type}`);
  if (p.description) lines.push(`项目简介：${p.description}`);
  if (p.notes) lines.push(`项目特点：${p.notes}`);
  if (p.tags?.length) lines.push(`标签：${p.tags.join("、")}`);
  return "【目标院校项目】\n" + lines.join("\n");
}

// ─── System Prompt Builder ───────────────────────────────────────────────────

function buildSystemPrompt(
  essayType: string | undefined,
  profileContext: string,
  programContext: string,
  // deno-lint-ignore no-explicit-any
  profileData: Record<string, any> | null,
  // deno-lint-ignore no-explicit-any
  programData: Record<string, any> | null,
  currentContent: string | undefined
): string {
  const typeKey = (essayType || "sop").toLowerCase();
  const hasProfile = !!profileContext;
  const hasProgram = !!programContext;
  const hasCurrentContent = !!currentContent?.trim();

  // Determine if we have enough info to generate directly
  const canDirectGenerate = hasProfile && profileData?.school && profileData?.major;

  // Type-specific writing instructions
  const typeInstructions = getTypeInstructions(typeKey, programData);

  let prompt = `你是一位顶级留学文书顾问，曾帮助数百位中国学生（包括大量双非背景学生）成功获得世界名校录取。

## 你的核心能力
- 善于从普通经历中挖掘独特价值和叙事角度
- 熟悉各国名校的招生偏好和文书评审标准
- 擅长将中国学生的经历转化为国际化叙事
- 对双非学生，你知道如何用个人实力和发展潜力弥补院校背景

## 工作规则

### 直接生成模式
当你拥有学生背景信息时，**第一轮回复就直接输出完整文书初稿**。不要先问问题再写，用户点击"去撰写"就是要看到文书。

生成文书后，简要说明你的写作思路（3-5句中文），然后询问用户想修改哪里。

### 修改模式
当用户在后续对话中提出修改意见时，直接输出修改后的完整版本，不要只给片段。

### 输出格式
- 文书正文**必须用英文**撰写
- 用 \`\`\`markdown 代码块包裹完整文书，方便用户一键应用到编辑器
- 对话交流用中文

${profileContext ? "\n" + profileContext + "\n" : ""}
${programContext ? "\n" + programContext + "\n" : ""}

## 当前任务：${typeInstructions.typeName}

${typeInstructions.guide}
`;

  if (hasCurrentContent) {
    prompt += `\n## 当前文书内容（用户可能要求修改）\n\`\`\`\n${currentContent}\n\`\`\`\n`;
  }

  // If this is the first message and we can generate directly, add a nudge
  if (canDirectGenerate && !hasCurrentContent) {
    prompt += `\n## 重要提示
用户接下来的第一条消息可能很简短（如"帮我写"、"开始"、"写一篇SOP"），你应该直接根据以上学生背景和目标院校信息，输出一篇完整的${typeInstructions.typeName}初稿。

不要回复"好的，我先了解一下你的情况"之类的话。直接写。`;
  }

  return prompt;
}

// ─── Type-Specific Instructions ──────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
function getTypeInstructions(typeKey: string, programData: Record<string, any> | null): { typeName: string; guide: string } {
  const schoolName = programData?.university_name_cn || programData?.university_name || "目标院校";
  const programName = programData?.program_name_cn || programData?.program_name || "目标项目";

  switch (typeKey) {
    case "sop":
      return {
        typeName: "Statement of Purpose（个人陈述）",
        guide: `### SOP 写作指南
**目标**：向招生委员会展示你为什么适合${programName}，你能带来什么，以及这个项目如何帮助你实现目标。

**结构**（800-1000词）：
1. **Opening Hook**（100词）— 用一个具体事件或领悟开头，展现对这个领域的热情。避免"从小我就对XX感兴趣"的套路。
2. **Academic & Research Journey**（250词）— 描述学术背景中与${programName}最相关的经历。课程项目、研究、论文，用具体成果说话（数据、结果、发现）。
3. **Professional Experience**（200词）— 实习/工作中获得的技能和视角，如何改变了你对这个领域的理解。
4. **Why This Program**（200词）— 具体提到${schoolName}的2-3个独特优势（教授、实验室、课程、产业合作），说明为什么这些对你特别重要。不要写通用的赞美。
5. **Future Goals & Closing**（150词）— 清晰的职业规划，以及这个项目如何作为关键跳板。

**关键技巧**：
- 每段都要有具体细节（项目名、技术、数字、结果）
- "Show, don't tell" — 用故事展示品质，而不是直接说"我很勤奋"
- 对于双非背景，强调个人主动性：自学、竞赛、实习中超越背景限制的表现`,
      };

    case "ps":
      return {
        typeName: "Personal Statement（动机信）",
        guide: `### PS 写作指南
**目标**：比 SOP 更个人化。展示你是谁、你的价值观、以及驱动你走向${programName}的内在动力。

**结构**（600-800词）：
1. **Personal Narrative**（200词）— 一个定义你学术方向的关键时刻或经历。具体场景、感受、转折。
2. **Intellectual Growth**（200词）— 从那个起点到现在的成长轨迹。关键课程、项目、导师的影响。
3. **Motivation for This Program**（200词）— 为什么是${schoolName}的${programName}？具体到课程设置、研究方向、校园文化。
4. **What You'll Contribute**（100词）— 你的独特视角和经历如何丰富课堂讨论和校园社区。

**关键技巧**：
- PS 的灵魂是真实性——招生官每年读上千篇，只有真实的故事才令人印象深刻
- 可以适当展示脆弱性（困难、失败）和从中的成长
- 展示跨文化视角是中国申请者的天然优势`,
      };

    case "cv":
      return {
        typeName: "Academic CV（学术简历）",
        guide: `### CV 写作指南
**目标**：一页或两页结构化简历，突出与${programName}最相关的经历。

**格式**：
1. **Education** — 学校、专业、GPA、相关课程（选3-5门核心课）
2. **Research Experience** — 项目名、角色、方法、成果（有论文标注发表状态）
3. **Professional Experience** — 实习/工作，用动词开头的要点描述成果（Developed, Analyzed, Led...）
4. **Skills** — 编程语言、工具、语言能力
5. **Awards & Honors** — 按时间倒序
6. **Publications** （如有）— 标准学术引用格式

**关键技巧**：
- 每个要点以强动词开头 + 量化结果（increased by 30%, processed 10K+ records）
- 与${programName}最相关的经历放在显眼位置
- 简洁精准，不写段落文字`,
      };

    case "recommendation":
      return {
        typeName: "推荐信草稿",
        guide: `### 推荐信写作指南
**目标**：以推荐人（教授或上司）的视角，撰写一封有说服力的推荐信。

**结构**（400-600词）：
1. **Opening** — 推荐人自我介绍、与申请者的关系（课程/项目/工作）、认识多久
2. **Academic/Professional Performance** — 具体事例说明申请者的能力（课堂表现、项目贡献、解决问题的能力）
3. **Personal Qualities** — 通过观察到的行为展示品质（主动性、团队合作、求知欲）
4. **Comparison & Endorsement** — "In my X years of teaching, she is among the top Y%..." 式的评价
5. **Closing** — 强烈推荐，愿意进一步沟通

**关键技巧**：
- 用推荐人的口吻，不是申请者的自述
- 具体故事 > 抽象评价（"她在课程项目中主动提出了XX方案" > "她很优秀"）
- 适当提及申请者克服困难的表现（间接回应双非背景）`,
      };

    case "diversity":
      return {
        typeName: "Diversity Essay（多元化文书）",
        guide: `### Diversity Essay 写作指南
**目标**：展示你的独特背景和视角如何为校园社区带来多样性。

**结构**（400-600词）：
1. **Your Unique Background**（150词）— 成长环境、文化背景、特殊经历中塑造你世界观的部分
2. **Challenges & Growth**（200词）— 因身份或背景面临的挑战，以及你如何应对和成长
3. **Contribution to Community**（150词）— 你计划如何将这些独特视角带入${schoolName}的课堂和社区

**关键技巧**：
- 中国学生的跨文化经历本身就是多样性——不同教育体系、思维方式、社会观察
- 双非背景可以转化为"在资源有限环境中的自我驱动力"的叙事
- 避免受害者叙事，聚焦成长和贡献`,
      };

    default:
      return {
        typeName: essay_type || "留学文书",
        guide: `直接根据学生背景和目标院校信息撰写高质量文书。文书正文用英文，800词左右。用 \`\`\`markdown 代码块包裹。`,
      };
  }
}
