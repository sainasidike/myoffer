import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Extract text from PDF using basic stream parsing.
 * Works for text-based PDFs, not scanned images.
 */
function extractTextFromPDF(buffer: ArrayBuffer): string {
  try {
    const uint8 = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const text = decoder.decode(uint8);
    const textChunks: string[] = [];

    const parenMatch = text.match(/\(([^)]+)\)/g);
    if (parenMatch) {
      for (const match of parenMatch) {
        const content = match.slice(1, -1);
        if (content.length > 1 && /[a-zA-Z0-9\u4e00-\u9fa5]/.test(content)) {
          textChunks.push(content);
        }
      }
    }

    const streamMatch = text.match(/stream\s*([\s\S]*?)\s*endstream/g);
    if (streamMatch) {
      for (const stream of streamMatch) {
        const content = stream.replace(/stream\s*/, "").replace(/\s*endstream/, "");
        const clean = content.replace(/[^\x20-\x7E\u4e00-\u9fa5\n]/g, " ").trim();
        if (clean.length > 5) {
          textChunks.push(clean);
        }
      }
    }

    return textChunks.join(" ").slice(0, 15000);
  } catch (e) {
    console.error("PDF text extraction error:", e);
    return "";
  }
}

/**
 * Extract text from DOCX (which is a ZIP of XML files).
 */
async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    // DOCX files are ZIP archives; look for the XML content directly
    const uint8 = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(uint8);

    // Extract text between XML tags in word/document.xml
    const textMatches = rawText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches) {
      return textMatches
        .map((m) => m.replace(/<[^>]+>/g, ""))
        .join(" ")
        .slice(0, 15000);
    }

    // Fallback: extract any readable text
    const readable = rawText.replace(/[^\x20-\x7E\u4e00-\u9fa5\n]/g, " ");
    const words = readable.split(/\s+/).filter((w) => w.length > 1);
    return words.join(" ").slice(0, 15000);
  } catch (e) {
    console.error("DOCX text extraction error:", e);
    return "";
  }
}

const ANALYSIS_PROMPT = `你是一个专业的留学申请顾问，擅长从文档中提取留学申请相关信息。

请仔细分析以下文档内容，尽可能提取以下类别的信息：

## 提取类别

1. **学术背景**
   - 目前学历和要申请的学历
   - 就读的学校
   - 专业方向（&是否有意向跨专业申请）
   - GPA/均分

2. **标准化成绩**
   - 语言成绩（托福/雅思，总分及小分）
   - GRE/GMAT（总分及小分）

3. **其他信息**
   - 实习经历（公司、职位、时长）
   - 科研经历（课题、论文发表）
   - 课外经历（创业、志愿服务、竞赛获奖、课外才艺、海外经历）
   - 其他留学申请可加分项

## 输出要求

1. 第一部分：用结构化的格式列出你提取到的所有信息，每个字段单独一行
2. 第二部分：指出文档中你无法确定或需要用户确认的信息
3. 第三部分：在回复末尾，用以下格式输出可自动保存的字段（用户看不到这些标记）：
   <<<PROFILE_UPDATE:{"字段名":"值"}>>>

可用的字段名：
- school: 学校名称
- major: 专业
- gpa: GPA数值
- currentEducation: 当前学历（如"本科"、"硕士"）
- targetDegree: 目标学历（如"硕士"、"博士"）
- languageType: 语言考试类型（"TOEFL"或"IELTS"）
- languageScore: 语言成绩（JSON格式，如{"total":100,"reading":25,"listening":25,"speaking":25,"writing":25}）
- greGmat: GRE/GMAT成绩（如"GRE 320 (V155+Q165+AW4.0)"）
- internship: 实习经历（数组格式）
- research: 科研经历（数组格式）
- awards: 获奖经历（数组格式）

只提取你有信心的信息，不确定的不要自动填充。
不要编造任何信息。如果文档中没有某类信息，就说"未提及"。`;

/**
 * Use GLM-4V multimodal API to analyze an image.
 */
async function analyzeImage(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4v-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: ANALYSIS_PROMPT + "\n\n请分析这张图片中的内容：" },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("GLM-4V error:", response.status, err);
    throw new Error(`图片解析失败 (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "无法解析图片内容";
}

/**
 * Use GLM-4-Flash to analyze extracted text.
 */
async function analyzeText(
  text: string,
  fileName: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          {
            role: "user",
            content: `以下是从文件「${fileName}」中提取的文本内容，请分析并提取留学申请相关信息：\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("GLM-4-Flash error:", response.status, err);
    throw new Error(`文本分析失败 (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "无法分析文档内容";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");
    if (!ZHIPU_API_KEY) throw new Error("ZHIPU_API_KEY is not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "未收到文件" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = file.name;
    const fileExt = fileName.toLowerCase().split(".").pop() || "";
    const fileSize = file.size;

    console.log(`Processing: ${fileName} (${fileExt}, ${(fileSize / 1024).toFixed(1)}KB)`);

    if (fileSize > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          content: `文件 ${fileName} 太大（${(fileSize / 1024 / 1024).toFixed(1)}MB）。请上传小于 10MB 的文件。`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let aiResponse: string;

    // Image files → GLM-4V multimodal
    if (["png", "jpg", "jpeg", "webp"].includes(fileExt)) {
      console.log("Using GLM-4V for image analysis");
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      const mimeType =
        fileExt === "png"
          ? "image/png"
          : fileExt === "webp"
          ? "image/webp"
          : "image/jpeg";
      aiResponse = await analyzeImage(base64, mimeType, ZHIPU_API_KEY);
    }

    // PDF files → text extraction → GLM-4-Flash
    else if (fileExt === "pdf") {
      console.log("Extracting PDF text");
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = extractTextFromPDF(arrayBuffer);

      if (extractedText.trim().length < 20) {
        // PDF might be scanned/image-based, try as image if small enough
        if (fileSize < 5 * 1024 * 1024) {
          console.log("PDF text extraction failed, trying as base64 image");
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          try {
            aiResponse = await analyzeImage(base64, "application/pdf", ZHIPU_API_KEY);
          } catch {
            aiResponse = `我收到了文件「${fileName}」，但无法从中提取文本。这可能是扫描件。\n\n建议：\n• 将扫描件转换为图片（JPG/PNG）后重新上传\n• 或直接在对话中告诉我文档中的关键信息`;
          }
        } else {
          aiResponse = `我收到了文件「${fileName}」，但无法从中提取文本内容。这可能是扫描件或加密 PDF。\n\n建议：\n• 上传包含可选择文字的 PDF\n• 或截图后以图片格式上传\n• 或直接在对话中告诉我文档中的信息`;
        }
      } else {
        console.log(`Extracted ${extractedText.length} chars, analyzing with AI`);
        aiResponse = await analyzeText(extractedText, fileName, ZHIPU_API_KEY);
      }
    }

    // Word files → text extraction → GLM-4-Flash
    else if (["doc", "docx"].includes(fileExt)) {
      console.log("Extracting Word document text");
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractTextFromDocx(arrayBuffer);

      if (extractedText.trim().length < 20) {
        aiResponse = `我收到了文件「${fileName}」，但无法提取其中的文本。\n\n建议：\n• 将文档转为 PDF 后重新上传\n• 或直接在对话中告诉我文档中的信息`;
      } else {
        console.log(`Extracted ${extractedText.length} chars from DOCX`);
        aiResponse = await analyzeText(extractedText, fileName, ZHIPU_API_KEY);
      }
    }

    // Unsupported format
    else {
      aiResponse = `不支持 ${fileExt.toUpperCase()} 格式。请上传以下格式的文件：\n• 图片：JPG、PNG\n• 文档：PDF、Word（DOC/DOCX）`;
    }

    return new Response(
      JSON.stringify({ content: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Parse document error:", e);
    return new Response(
      JSON.stringify({
        content: `文件解析出错：${e instanceof Error ? e.message : "未知错误"}。请尝试其他格式，或直接在对话中告诉我相关信息。`,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
