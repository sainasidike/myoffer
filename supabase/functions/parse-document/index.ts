import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function extractTextFromPDF(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const text = decoder.decode(uint8);

  const textChunks: string[] = [];
  const matches = text.match(/\(([^)]+)\)/g);

  if (matches) {
    for (const match of matches) {
      const content = match.slice(1, -1);
      if (content.length > 0 && /[a-zA-Z0-9\u4e00-\u9fa5]/.test(content)) {
        textChunks.push(content);
      }
    }
  }

  return textChunks.join(' ').slice(0, 5000);
}

function analyzeDocument(fileName: string, content: string, profileData: Record<string, any>): {
  summary: string;
  updates: Record<string, string>;
} {
  const lower = content.toLowerCase();
  const updates: Record<string, string> = {};
  let docType = "未知文档";
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
    ? `我识别出这是一份${docType}。从中提取到以下信息：\n${findings.map(f => `• ${f}`).join('\n')}\n\n如果有更多材料，欢迎继续上传！`
    : `收到你上传的 ${fileName}。这看起来是一份${docType}，但我暂时无法从中提取更多结构化信息。如果这是图片格式，建议上传 PDF 文档以获得更好的解析效果。`;

  return { summary, updates };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const profileDataStr = formData.get("profileData") as string | null;
    const profileData = profileDataStr ? JSON.parse(profileDataStr) : {};

    if (!file) {
      return new Response(
        JSON.stringify({ error: "未收到文件" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = file.name;
    const fileExt = fileName.toLowerCase().split('.').pop() || '';

    let extractedText = "";

    if (fileExt === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      extractedText = extractTextFromPDF(arrayBuffer);
    } else if (['txt', 'doc', 'docx'].includes(fileExt)) {
      extractedText = await file.text();
    } else {
      return new Response(
        JSON.stringify({
          content: `收到文件 ${fileName}。目前仅支持 PDF 和文本文档的自动解析。图片文件需要更高级的 OCR 功能，建议上传 PDF 格式的文档以获得最佳解析效果。`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { summary, updates } = analyzeDocument(fileName, extractedText, profileData);

    let content = summary;
    if (Object.keys(updates).length > 0) {
      content += `\n<<<PROFILE_UPDATE:${JSON.stringify(updates)}>>>`;
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Parse error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "文件解析失败",
        content: "抱歉，文件解析遇到问题。请确保上传的是有效的 PDF 或文本文档。"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
