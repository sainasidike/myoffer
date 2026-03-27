import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function extractTextFromPDF(buffer: ArrayBuffer): string {
  try {
    const uint8 = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(uint8);

    const textChunks: string[] = [];

    const streamMatch = text.match(/stream\s*(.*?)\s*endstream/gs);
    if (streamMatch) {
      for (const stream of streamMatch) {
        const content = stream.replace(/stream\s*/, '').replace(/\s*endstream/, '');
        const cleanText = content.replace(/[^\x20-\x7E\u4e00-\u9fa5]/g, ' ');
        if (cleanText.trim().length > 0) {
          textChunks.push(cleanText);
        }
      }
    }

    const parenMatch = text.match(/\(([^)]+)\)/g);
    if (parenMatch) {
      for (const match of parenMatch) {
        const content = match.slice(1, -1);
        if (content.length > 0 && /[a-zA-Z0-9\u4e00-\u9fa5]/.test(content)) {
          textChunks.push(content);
        }
      }
    }

    return textChunks.join(' ').slice(0, 10000);
  } catch (e) {
    console.error("PDF extraction error:", e);
    return "";
  }
}

function analyzeDocument(fileName: string, content: string, profileData: Record<string, any>): {
  summary: string;
  updates: Record<string, string>;
} {
  const lower = content.toLowerCase();
  const updates: Record<string, string> = {};
  let docType = "文档";
  const findings: string[] = [];

  if (lower.includes("transcript") || lower.includes("成绩单") || lower.includes("grade")) {
    docType = "成绩单";

    const gpaMatch = content.match(/GPA[:\s]*([0-9.]+)/i);
    if (gpaMatch && !profileData.gpa) {
      updates.gpa = gpaMatch[1];
      findings.push(`GPA: ${gpaMatch[1]}`);
    }

    const schoolMatch = content.match(/(?:学校|University|College)[:\s]*([^\n]+)/i);
    if (schoolMatch && !profileData.school) {
      const schoolName = schoolMatch[1].trim().slice(0, 50);
      updates.school = schoolName;
      findings.push(`就读学校: ${schoolName}`);
    }

    const majorMatch = content.match(/(?:专业|Major)[:\s]*([^\n]+)/i);
    if (majorMatch && !profileData.major) {
      const majorName = majorMatch[1].trim().slice(0, 50);
      updates.major = majorName;
      findings.push(`专业: ${majorName}`);
    }
  }

  else if (lower.includes("toefl") || lower.includes("ielts") || lower.includes("托福") || lower.includes("雅思")) {
    docType = "语言成绩单";

    const toeflMatch = content.match(/(?:TOEFL|托福)[:\s]*([0-9]+)/i);
    const ieltsMatch = content.match(/(?:IELTS|雅思)[:\s]*([0-9.]+)/i);

    if (toeflMatch && !profileData.languageScore) {
      updates.languageType = "TOEFL";
      updates.languageScore = toeflMatch[1];
      findings.push(`TOEFL: ${toeflMatch[1]}`);
    } else if (ieltsMatch && !profileData.languageScore) {
      updates.languageType = "IELTS";
      updates.languageScore = ieltsMatch[1];
      findings.push(`IELTS: ${ieltsMatch[1]}`);
    }
  }

  else if (lower.includes("gre") || lower.includes("gmat")) {
    docType = "GRE/GMAT 成绩单";

    const greMatch = content.match(/(?:GRE)[:\s]*([0-9]+)/i);
    const gmatMatch = content.match(/(?:GMAT)[:\s]*([0-9]+)/i);

    if (greMatch && !profileData.greGmat) {
      updates.greGmat = `GRE ${greMatch[1]}`;
      findings.push(`GRE: ${greMatch[1]}`);
    } else if (gmatMatch && !profileData.greGmat) {
      updates.greGmat = `GMAT ${gmatMatch[1]}`;
      findings.push(`GMAT: ${gmatMatch[1]}`);
    }
  }

  else if (lower.includes("resume") || lower.includes("cv") || lower.includes("简历")) {
    docType = "个人简历";
    findings.push("包含个人背景和经历信息");

    if ((lower.includes("intern") || lower.includes("实习")) && !profileData.internship) {
      updates.internship = "有实习经历";
      findings.push("发现实习经历");
    }

    if ((lower.includes("research") || lower.includes("科研")) && !profileData.research) {
      updates.research = "有科研经历";
      findings.push("发现科研经历");
    }
  }

  else if (lower.includes("award") || lower.includes("certificate") || lower.includes("获奖") || lower.includes("证书")) {
    docType = "获奖证书";
    findings.push("包含获奖信息");

    if (!profileData.awards) {
      updates.awards = "有获奖经历";
    }
  }

  const summary = findings.length > 0
    ? `我识别出这是一份${docType}。从中提取到以下信息：\n\n${findings.map(f => `• ${f}`).join('\n')}\n\n如果有更多材料，欢迎继续上传！`
    : `收到你上传的 ${fileName}。我已经接收到这份${docType}。由于文档解析的局限性，我可能无法提取所有信息。如果这是扫描件或图片，建议上传包含可选择文本的 PDF 文档，或者你可以直接在对话中告诉我关键信息。`;

  return { summary, updates };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("Parse document request received");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const profileDataStr = formData.get("profileData") as string | null;

    console.log("File received:", file?.name, "Size:", file?.size);

    const profileData = profileDataStr ? JSON.parse(profileDataStr) : {};

    if (!file) {
      return new Response(
        JSON.stringify({ error: "未收到文件" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = file.name;
    const fileExt = fileName.toLowerCase().split('.').pop() || '';
    const fileSize = file.size;

    console.log("Processing file:", fileName, "Extension:", fileExt, "Size:", fileSize);

    if (fileSize > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          content: `文件 ${fileName} 太大（${(fileSize / 1024 / 1024).toFixed(2)} MB）。请上传小于 10MB 的文件。`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extractedText = "";

    if (fileExt === 'pdf') {
      console.log("Extracting PDF text");
      const arrayBuffer = await file.arrayBuffer();
      extractedText = extractTextFromPDF(arrayBuffer);
      console.log("Extracted text length:", extractedText.length);
    } else if (fileExt === 'txt') {
      extractedText = await file.text();
      console.log("Read text file, length:", extractedText.length);
    } else if (['doc', 'docx', 'png', 'jpg', 'jpeg'].includes(fileExt)) {
      return new Response(
        JSON.stringify({
          content: `收到文件 ${fileName}。目前仅支持 PDF 和纯文本文档的自动解析。对于 ${fileExt.toUpperCase()} 格式，建议：\n\n• 将文档转换为 PDF 格式后上传\n• 或直接在对话中告诉我文档中的关键信息\n\n我随时准备为你提供帮助！`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          content: `收到文件 ${fileName}。不支持 ${fileExt.toUpperCase()} 格式。请上传 PDF 或 TXT 文件，或者直接在对话中告诉我相关信息。`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return new Response(
        JSON.stringify({
          content: `我已收到 ${fileName}，但未能从中提取到文本内容。可能的原因：\n\n• PDF 是扫描件或图片格式\n• 文档加密或受保护\n• 文档格式不标准\n\n建议你直接在对话中告诉我文档的关键信息，或者上传包含可选择文本的 PDF 文档。`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing document");
    const { summary, updates } = analyzeDocument(fileName, extractedText, profileData);

    let content = summary;
    if (Object.keys(updates).length > 0) {
      content += `\n<<<PROFILE_UPDATE:${JSON.stringify(updates)}>>>`;
      console.log("Profile updates:", updates);
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Parse error:", e);
    const errorMessage = e instanceof Error ? e.message : "未知错误";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        content: `抱歉，文件解析遇到问题：${errorMessage}。请尝试上传其他格式的文档，或直接在对话中告诉我相关信息。`
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
