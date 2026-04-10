import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDocumentProxy, extractText } from "npm:unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Extract text from PDF using unpdf (pdf.js wrapper for edge runtimes).
 */
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    const text = typeof result.text === "string" ? result.text : result.text.join("\n");
    return text.slice(0, 15000);
  } catch (e) {
    console.error("PDF text extraction error:", e);
    // Fallback: naive extraction for simple PDFs
    try {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const raw = decoder.decode(new Uint8Array(buffer));
      const chunks: string[] = [];
      const parenMatch = raw.match(/\(([^)]+)\)/g);
      if (parenMatch) {
        for (const m of parenMatch) {
          const c = m.slice(1, -1);
          if (c.length > 1 && /[a-zA-Z0-9\u4e00-\u9fa5]/.test(c)) chunks.push(c);
        }
      }
      return chunks.join(" ").slice(0, 15000);
    } catch {
      return "";
    }
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

请仔细分析以下文档内容，尽可能提取留学申请相关信息。

## 输出格式（严格遵循）

用以下格式输出，使用中文标签和 Markdown 格式：

## 学术背景
- **学校**：xxx
- **专业**：xxx
- **当前学历**：本科/硕士
- **目标学历**：硕士/博士
- **GPA/均分**：x.x/4.0

## 标准化成绩
- **语言考试**：雅思/托福 总分x.x（阅读x.x / 听力x.x / 写作x.x / 口语x.x）
- **GRE/GMAT**：总分xxx（如有）

## 软实力背景
- **实习经历**：公司名-职位-时长
- **科研经历**：课题/论文
- **获奖/课外**：竞赛、志愿、海外经历等

## 待确认信息
- 列出文档中你不确定或需要用户确认的信息

规则：
- 如果某个类别没有信息，整个类别都不要输出（不要写"未提及"）
- 只输出文档中确实包含的信息
- 不要编造任何信息

最后，在回复最末尾用以下格式输出可自动保存的字段（用户看不到这些标记）：
<<<PROFILE_UPDATE:{"字段名":"值"}>>>

可用字段名：school, major, gpa, currentEducation, targetDegree, languageType, languageScore（JSON格式如{"total":7.0,"reading":7.5,"listening":7.0,"writing":6.5,"speaking":6.5}）, greGmat, internship（数组）, research（数组）, awards（数组）

只提取你有信心的信息。`;

/**
 * Use GLM-4V multimodal API to analyze an image.
 */
async function analyzeImage(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  // Try multiple model names for GLM-4V compatibility
  const models = ["glm-4v-flash", "glm-4v", "glm-4v-plus"];
  const errors: string[] = [];

  for (const model of models) {
    console.log(`Trying model: ${model}, image size: ${(base64Data.length / 1024).toFixed(0)}KB base64`);
    const response = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: ANALYSIS_PROMPT + "\n\n请分析这张图片中的内容。" },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
              ],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`Model ${model} succeeded`);
      return data.choices?.[0]?.message?.content || "无法解析图片内容";
    }

    const err = await response.text();
    console.error(`Model ${model} failed (${response.status}):`, err);
    errors.push(`${model}(${response.status}): ${err.slice(0, 200)}`);

    // If it's a model-not-found error, try next model
    if (response.status === 400 || response.status === 404) continue;
    // For other errors (rate limit, auth), stop trying
    break;
  }

  // Return diagnostic info instead of throwing
  const diagnostic = errors.join(" | ");
  throw new Error(`图片解析失败: ${diagnostic}`);
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
      try {
        aiResponse = await analyzeImage(base64, mimeType, ZHIPU_API_KEY);
      } catch (imgErr) {
        console.error("Image analysis failed, all models tried:", imgErr);
        aiResponse = `我收到了图片「${fileName}」，但视觉识别模型暂时不可用。\n\n请尝试以下替代方式：\n• 将图片中的文字内容直接在对话中告诉我\n• 上传 PDF 或 Word 格式的文档\n• 稍后重试`;
      }
    }

    // PDF files → text extraction → GLM-4-Flash
    else if (fileExt === "pdf") {
      console.log("Extracting PDF text");
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractTextFromPDF(arrayBuffer);

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
