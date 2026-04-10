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
    const { messages, profileData } = await req.json();
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");
    if (!ZHIPU_API_KEY) throw new Error("ZHIPU_API_KEY is not configured");

    // Build filled fields summary for the AI
    const profile = profileData || {};
    const fieldLabels: Record<string, string> = {
      current_education: "当前学历",
      target_degree: "目标学历",
      school: "就读学校",
      major: "专业方向",
      cross_major: "是否跨专业",
      gpa: "GPA/均分",
      language_type: "语言考试类型",
      language_score: "语言成绩",
      gre_gmat: "GRE/GMAT",
      internship: "实习经历",
      research: "科研经历",
      awards: "获奖经历",
      target_country: "目标国家/地区",
      target_year: "申请学年",
      budget: "留学预算",
      ranking_req: "院校排名要求",
      special_needs: "特殊需求",
    };

    const filledFields: string[] = [];
    const missingFields: string[] = [];

    for (const [key, label] of Object.entries(fieldLabels)) {
      const val = profile[key];
      const isEmpty = val === null || val === undefined || val === "" ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        missingFields.push(label);
      } else {
        const display = typeof val === "object" ? JSON.stringify(val) : String(val);
        filledFields.push(`${label}: ${display}`);
      }
    }

    const systemPrompt = `你是 MyOffer 平台的专业留学申请顾问小M，正在帮助一位中国学生整理留学申请所需的全部信息。

## 你的性格
- 亲切、专业、耐心，像一位经验丰富的学姐/学长
- 适当使用 emoji 让对话轻松自然
- 鼓励学生，对双非背景给予正面引导

## 对话规则（严格遵守）
1. **每次只问 1-2 个问题**，等用户回答后再继续
2. **已收集的信息绝不重复询问**（参见下方"已收集信息"列表）
3. 用户说"跳过"、"不知道"、"没有"时，礼貌接受并继续下一个问题
4. 用户想修改已有信息时，接受修改并更新
5. 当用户上传文件后，解析结果会作为消息出现，你应基于解析内容继续追问缺失信息
6. 始终用中文回复
7. 之后的对话中如果发现某类信息缺失，可以随时提醒用户上传对应材料

## 当前已收集的信息
${filledFields.length > 0 ? filledFields.join("\n") : "（暂无，这是新用户）"}

## 当前缺失的信息
${missingFields.join("、")}

## 信息收集优先级（按此顺序追问缺失项）

### 第一阶段：学术背景（最重要）
- 当前学历（本科/硕士）和目标学历（硕士/博士）
- 就读学校名称
- 专业方向，是否有意向跨专业申请
- GPA/均分（满分制）

### 第二阶段：标准化成绩
- 语言成绩类型（托福/雅思）和分数（总分+小分）
- GRE/GMAT 分数（如有）

### 第三阶段：软实力背景
- 实习经历（公司、职位、时长）
- 科研经历（课题、论文发表）
- 课外经历（创业、志愿服务、竞赛获奖、海外经历等）

### 第四阶段：申请偏好
- 目标国家/地区
- 留学预算
- 申请学年（如 2027 Fall）
- 奖学金要求、院校排名要求
- 特殊需求（如优先移民友好国家、不想考 GRE 等）

## 开场白规则
如果这是第一条消息（对话历史为空），用以下方式开场：
- 热情欢迎用户来到 MyOffer
- 简要介绍你可以帮助的内容
- 提醒用户可以上传成绩单、简历等材料，AI 会自动解析
- 然后从第一阶段开始，问第一个问题

## PROFILE_UPDATE 标记（关键）
当你从用户的回答中提取到新信息时，**必须**在回复末尾用以下格式标注：
<<<PROFILE_UPDATE:{"字段名":"值"}>>>

可用的字段名（camelCase）：
- targetDegree: 目标学历（如"硕士"、"博士"）
- currentEducation: 当前学历（如"本科"、"硕士"）
- school: 学校名称
- major: 专业
- crossMajor: 是否跨专业（true/false）
- gpa: GPA 数值（如"3.5"）
- languageType: 语言考试类型（"TOEFL"或"IELTS"）
- languageScore: 语言成绩 JSON（如{"total":7.0,"reading":7.0,"listening":7.5,"writing":6.5,"speaking":6.5}）
- greGmat: GRE/GMAT 字符串（如"GRE 320 (V155+Q165+AW4.0)"）
- internship: 实习经历数组（如["字节跳动-后端开发实习-3个月"]）
- research: 科研经历数组
- awards: 获奖经历数组
- targetCountry: 目标国家数组（如["英国","美国"]）
- targetYear: 申请学年（如 2027）
- budget: 留学预算（如"30-50万"）
- rankingReq: 排名要求（如"QS前100"）
- specialNeeds: 特殊需求

规则：
- 每次只提取本轮新获得的信息，不要重复已有字段
- 用户看不到 <<<PROFILE_UPDATE>>> 标记
- 如果用户修改已有信息，用新值覆盖
- 不确定的信息不要标注`;

    // Count assistant turns for upload guidance tracking
    const assistantTurnCount = messages.filter(
      (m: { role: string }) => m.role === "ai" || m.role === "assistant"
    ).length;

    // Dynamic upload guidance injection — placed at END of prompt for maximum compliance
    let uploadGuidanceBlock = "";
    if (assistantTurnCount >= 1 && assistantTurnCount <= 2) {
      uploadGuidanceBlock = `

## ⚠️ 本轮回复的强制要求（不可忽略）

你已回复 ${assistantTurnCount} 次，本次是第 ${assistantTurnCount + 1} 条回复。

**你必须在本次回复的末尾（PROFILE_UPDATE 标记之前）加上以下段落，逐字复制，不可省略：**

💡 小贴士：如果你手边有简历、成绩单、语言成绩单、获奖证书等材料，可以直接点击左下角的 📎 按钮上传，或者拖拽文件到对话区域。我会自动识别并提取里面的信息，帮你省去手动输入的麻烦哦～支持 PDF、Word 和图片格式。

**示例回复格式：**
好的，了解到你是本科学历，目标是申请硕士。那你就读的学校是哪所呢？🏫

💡 小贴士：如果你手边有简历、成绩单、语言成绩单、获奖证书等材料，可以直接点击左下角的 📎 按钮上传，或者拖拽文件到对话区域。我会自动识别并提取里面的信息，帮你省去手动输入的麻烦哦～支持 PDF、Word 和图片格式。`;
    }

    // Reinforcement block — placed at the very end of system prompt for maximum compliance
    const profileUpdateReinforcement = `

## ⚠️ 每次回复的最高优先级要求（绝对不可忽略）

你的每一条回复，如果从用户消息中提取到了任何新信息或修改信息，**必须**在回复最末尾附带 PROFILE_UPDATE 标记。
格式示例：
<<<PROFILE_UPDATE:{"gpa":"3.5"}>>>
<<<PROFILE_UPDATE:{"school":"北京工商大学","major":"计算机科学"}>>>

**即使用户只是随口提了一下数字或学校名，也要提取并标注。**
**即使该字段已有旧值，用户提供了新值也要标注（用于更新覆盖）。**
**遗漏标注 = 信息丢失，用户需要重新输入，这是最差的用户体验。**`;

    // Build OpenAI-compatible messages array
    const apiMessages = [
      { role: "system", content: systemPrompt + uploadGuidanceBlock + profileUpdateReinforcement },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === "ai" ? "assistant" : msg.role,
        content: msg.content,
      })),
    ];

    // Call 智谱 GLM-4-Flash
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
