import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════
// REGION WEIGHT TABLES
// ═══════════════════════════════════════════════════
const REGION_WEIGHTS: Record<string, { gpa: number; lang: number; gre: number; soft: number }> = {
  "美国": { gpa: 35, lang: 20, gre: 15, soft: 30 },
  "英国": { gpa: 50, lang: 25, gre: 5, soft: 20 },
  "香港": { gpa: 45, lang: 20, gre: 10, soft: 25 },
  "中国香港": { gpa: 45, lang: 20, gre: 10, soft: 25 },
  "新加坡": { gpa: 45, lang: 20, gre: 10, soft: 25 },
  "澳大利亚": { gpa: 45, lang: 20, gre: 10, soft: 25 },
  "加拿大": { gpa: 45, lang: 20, gre: 10, soft: 25 },
  "欧洲": { gpa: 40, lang: 25, gre: 0, soft: 25 },
  "默认": { gpa: 40, lang: 20, gre: 10, soft: 30 },
};

// School tier coefficients
function getSchoolCoefficient(school: string): number {
  const c9 = ["清华大学","北京大学","浙江大学","复旦大学","上海交通大学","中国科学技术大学","南京大学","哈尔滨工业大学","西安交通大学"];
  const top985 = ["中国人民大学","北京航空航天大学","北京理工大学","中央民族大学","南开大学","天津大学","大连理工大学","吉林大学","同济大学","华东师范大学","东南大学","厦门大学","山东大学","武汉大学","华中科技大学","中南大学","中山大学","华南理工大学","四川大学","电子科技大学","重庆大学","西北工业大学","兰州大学","国防科技大学"];
  const s211 = ["北京交通大学","北京工业大学","北京科技大学","北京化工大学","北京邮电大学","北京林业大学","北京中医药大学","中国传媒大学","中央财经大学","对外经济贸易大学","北京外国语大学","中国政法大学","华北电力大学","河北工业大学","太原理工大学","内蒙古大学","辽宁大学","大连海事大学","东北大学","东北师范大学","延边大学","哈尔滨工程大学","东北农业大学","东北林业大学","华东理工大学","东华大学","上海外国语大学","上海财经大学","上海大学","苏州大学","南京航空航天大学","南京理工大学","中国矿业大学","河海大学","江南大学","南京农业大学","中国药科大学","南京师范大学","安徽大学","合肥工业大学","福州大学","南昌大学","中国海洋大学","中国石油大学","郑州大学","武汉理工大学","华中农业大学","华中师范大学","中南财经政法大学","湖南师范大学","暨南大学","广西大学","海南大学","西南交通大学","西南大学","西南财经大学","贵州大学","云南大学","西藏大学","西北大学","西安电子科技大学","长安大学","陕西师范大学","青海大学","宁夏大学","新疆大学","石河子大学"];
  
  if (c9.includes(school)) return 1.05;
  if (top985.includes(school)) return 1.00;
  if (s211.includes(school)) return 0.95;
  // Check for keywords
  if (school.includes("985") || school.includes("C9")) return 1.00;
  if (school.includes("211")) return 0.95;
  if (school.includes("一本")) return 0.88;
  // Default: assume shuangfei
  return 0.85;
}

function getRegionWeights(country: string) {
  for (const [key, val] of Object.entries(REGION_WEIGHTS)) {
    if (country.includes(key)) return val;
  }
  // Check for Europe
  const euroCountries = ["德国","法国","荷兰","瑞士","瑞典","丹麦","芬兰","挪威","意大利","西班牙"];
  if (euroCountries.some(c => country.includes(c))) return REGION_WEIGHTS["欧洲"];
  return REGION_WEIGHTS["默认"];
}

// ═══════════════════════════════════════════════════
// SCORE CALCULATION
// ═══════════════════════════════════════════════════
function parseGPA(gpaStr: string): { value: number; scale: number } {
  if (!gpaStr) return { value: 0, scale: 100 };
  const num = parseFloat(gpaStr.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return { value: 0, scale: 100 };
  if (num <= 4.5) return { value: (num / 4.0) * 100, scale: 4 };
  return { value: num, scale: 100 };
}

function parseLangScore(scoreStr: string): number {
  if (!scoreStr) return 0;
  const num = parseFloat(scoreStr.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

function calcGpaScore(userGpa: string, userSchool: string, weights: { gpa: number }): number {
  const { value: gpaPercent } = parseGPA(userGpa);
  const coeff = getSchoolCoefficient(userSchool);
  const adjusted = gpaPercent * coeff;
  return adjusted * (weights.gpa / 100);
}

function calcLangScore(langScore: string, langType: string, requireLang: string, weights: { lang: number }): number {
  const score = parseLangScore(langScore);
  if (score === 0) return 0;

  // Parse requirement
  let reqScore = 0;
  if (requireLang) {
    const reqNum = parseFloat(requireLang.replace(/[^0-9.]/g, ""));
    if (!isNaN(reqNum)) reqScore = reqNum;
  }

  let base = 0;
  if (reqScore > 0) {
    if (score >= reqScore + 10) base = 80;
    else if (score >= reqScore) base = 60;
    else if (score >= reqScore - 5) base = 40;
    else base = 0;
  } else {
    // No requirement, score based on absolute
    const isIelts = langType?.toLowerCase().includes("ielts") || langType?.includes("雅思");
    if (isIelts) {
      base = score >= 7.5 ? 80 : score >= 7.0 ? 70 : score >= 6.5 ? 60 : score >= 6.0 ? 40 : 20;
    } else {
      base = score >= 110 ? 80 : score >= 100 ? 70 : score >= 90 ? 60 : score >= 80 ? 40 : 20;
    }
  }

  // Bonus for high scores
  const bonus = score >= (reqScore > 0 ? reqScore + 15 : 110) ? 10 : score >= (reqScore > 0 ? reqScore + 5 : 100) ? 5 : 0;
  return (base + bonus) * (weights.lang / 100);
}

function calcGreScore(greStr: string, requireGre: boolean, weights: { gre: number }): number {
  if (weights.gre === 0) return 0;
  const score = parseLangScore(greStr);
  if (score === 0) {
    return requireGre ? -5 : 0; // penalty if required but missing
  }
  let base = 0;
  if (score > 500) {
    // GRE scale (260-340)
    base = score >= 330 ? 80 : score >= 325 ? 70 : score >= 320 ? 60 : score >= 315 ? 40 : 20;
  } else {
    // GMAT scale (200-800)
    base = score >= 750 ? 80 : score >= 720 ? 70 : score >= 700 ? 60 : score >= 680 ? 40 : 20;
  }
  return base * (weights.gre / 100);
}

function calcSoftScore(profile: any, targetField: string, weights: { soft: number }): number {
  let raw = 0;
  
  const relevance = (desc: string, field: string): number => {
    // Simple relevance check based on field overlap
    if (!desc || !field) return 0.7;
    const fieldLower = field.toLowerCase();
    const descLower = desc.toLowerCase();
    const highRelevanceKeywords: Record<string, string[]> = {
      "cs": ["计算机","软件","编程","code","算法","ai","机器学习","深度学习","数据结构"],
      "数据": ["数据","data","统计","分析","analytics","machine learning"],
      "金融": ["金融","finance","投资","银行","证券","量化","交易"],
      "商科": ["商业","管理","marketing","mba","咨询","consulting"],
      "教育": ["教育","教学","teaching","教师","课程"],
      "电子": ["电子","电气","embedded","硬件","信号","通信"],
    };
    for (const [key, keywords] of Object.entries(highRelevanceKeywords)) {
      if (fieldLower.includes(key) && keywords.some(k => descLower.includes(k))) return 1.0;
    }
    return 0.7;
  };

  // Internship
  if (profile.internship) {
    const entries = profile.internship.split(/[;；\n]/);
    raw += entries.length * 3 * relevance(profile.internship, targetField);
  }
  // Research
  if (profile.research) {
    const hasTopPub = /顶会|sci|ssci|nature|science|top/i.test(profile.research);
    const hasPub = /论文|paper|发表|publish/i.test(profile.research);
    if (hasTopPub) raw += 10 * relevance(profile.research, targetField);
    else if (hasPub) raw += 5 * relevance(profile.research, targetField);
    else raw += 3 * relevance(profile.research, targetField);
  }
  // Awards
  if (profile.awards) raw += 3;
  // Entrepreneurship
  if (profile.entrepreneurship) raw += 3;
  // Overseas
  if (profile.overseas) raw += 3;
  // Volunteer
  if (profile.volunteer) raw += 2;
  // Other
  if (profile.other_activities) raw += 2;

  const capped = Math.min(raw, 15);
  return capped * (weights.soft / 100);
}

// ═══════════════════════════════════════════════════
// PROJECT-SPECIFIC BONUSES
// ═══════════════════════════════════════════════════
function calcProjectBonus(notes: string | null, profile: any): number {
  if (!notes) return 0;
  let bonus = 0;
  const notesLower = notes.toLowerCase();
  
  if (notesLower.includes("重视科研") || notesLower.includes("research")) {
    const hasTopPub = /顶会|sci|ssci|nature|science|top/i.test(profile.research || "");
    const hasPub = /论文|paper|发表|publish/i.test(profile.research || "");
    if (hasTopPub) bonus += 5;
    else if (hasPub) bonus += 3;
  }
  if ((notesLower.includes("co-op") || notesLower.includes("实习")) && profile.internship) bonus += 3;
  if (notesLower.includes("工作经验") && (profile.entrepreneurship || profile.internship)) bonus += 3;
  if (notesLower.includes("中国学生友好") || notesLower.includes("对中国学生友好")) bonus += 2;

  return Math.min(bonus, 10);
}

// ═══════════════════════════════════════════════════
// PROBABILITY CALCULATION
// ═══════════════════════════════════════════════════
function calcProbability(diff: number): number {
  let prob: number;
  if (diff >= 10) {
    prob = 75 + diff * 0.5;
  } else if (diff >= 0) {
    prob = 50 + diff * 2.5;
  } else if (diff >= -10) {
    prob = 30 + diff * 2;
  } else {
    prob = 30 + (-10) * 2 + (diff + 10) * 1.5;
  }
  return Math.max(3, Math.min(95, Math.round(prob)));
}

// ═══════════════════════════════════════════════════
// AI-GENERATED ANALYSIS
// ═══════════════════════════════════════════════════
function generateAnalysis(profile: any, program: any, prob: number): { text: string; advantages: string[]; disadvantages: string[]; tips: string[] } {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const tips: string[] = [];

  // GPA analysis
  const { value: gpaPercent } = parseGPA(profile.gpa);
  const coeff = getSchoolCoefficient(profile.school || "");
  const adjGpa = gpaPercent * coeff;
  
  if (program.require_gpa) {
    const reqGpa = parseFloat(program.require_gpa.replace(/[^0-9.]/g, ""));
    if (!isNaN(reqGpa)) {
      const reqPercent = reqGpa <= 4.5 ? (reqGpa / 4.0) * 100 : reqGpa;
      if (adjGpa >= reqPercent + 5) advantages.push("GPA 优势明显");
      else if (adjGpa >= reqPercent) advantages.push("GPA 达标");
      else { disadvantages.push("GPA 略低于要求"); tips.push(`提升 GPA 至 ${program.require_gpa} 可提高 5-8% 概率`); }
    }
  }

  // Language
  if (profile.language_score && program.require_lang) {
    const userLang = parseLangScore(profile.language_score);
    const reqLang = parseLangScore(program.require_lang);
    if (userLang >= reqLang + 5) advantages.push("语言成绩优秀");
    else if (userLang >= reqLang) advantages.push("语言成绩达标");
    else { disadvantages.push("语言成绩未达标"); tips.push(`提升语言成绩至 ${program.require_lang} 可提高 3-5% 概率`); }
  }

  // Soft power
  if (profile.research && /顶会|sci/i.test(profile.research)) advantages.push("科研背景突出");
  if (profile.internship) advantages.push("有实习经历");
  if (!profile.research && !profile.internship) { disadvantages.push("软实力待加强"); tips.push("增加实习或科研经历可提升竞争力"); }

  const text = prob >= 70
    ? "综合条件匹配度高，建议作为保底选择"
    : prob >= 40
    ? "条件基本匹配，有较好的录取机会"
    : "挑战性较大，需要突出亮点来弥补短板";

  return { text, advantages, disadvantages, tips };
}

// ═══════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get auth token for user identification
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Decode JWT to get user ID
    let userId: string | null = null;
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          userId = payload?.sub;
        }
      } catch {}
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "请先登录" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get user profile
    const { data: profileData } = await supabase
      .from("user_onboarding_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profileData) {
      return new Response(JSON.stringify({ error: "请先完善个人档案", code: "NO_PROFILE" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profileData;

    // Calculate profile completeness
    const importantFields = ["target_degree", "school", "major", "gpa", "language_score", "target_country"];
    const filledImportant = importantFields.filter(f => profile[f]).length;
    const completeness = Math.round((filledImportant / importantFields.length) * 100);

    if (completeness < 50) {
      return new Response(JSON.stringify({
        error: "档案信息不足，请至少完善学校、GPA、目标国家等核心信息",
        code: "INCOMPLETE_PROFILE",
        completeness,
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check existing programs in DB
    let query = supabase.from("school_programs").select("*");
    if (profile.target_country) {
      // Match country - handle comma-separated values
      const countries = profile.target_country.split(/[,，、]/);
      if (countries.length === 1) {
        query = query.ilike("country", `%${countries[0].trim()}%`);
      } else {
        const orFilter = countries.map((c: string) => `country.ilike.%${c.trim()}%`).join(",");
        query = query.or(orFilter);
      }
    }
    if (profile.target_degree) {
      query = query.ilike("degree", `%${profile.target_degree}%`);
    }

    const { data: existingPrograms } = await query;

    let programs = existingPrograms || [];

    // 3. If not enough programs, use AI to generate
    if (programs.length < 15) {
      console.log("Not enough programs in DB, generating with AI...");

      const profileSummary = `
学校: ${profile.school || "未知"}
专业: ${profile.major || "未知"}
GPA: ${profile.gpa || "未知"}
目标学位: ${profile.target_degree || "硕士"}
目标国家: ${profile.target_country || "未指定"}
语言成绩: ${profile.language_type || ""} ${profile.language_score || "未知"}
GRE/GMAT: ${profile.gre_gmat || "无"}
预算: ${profile.budget || "未指定"}
目标年份: ${profile.target_year || "2025-2026"}
排名要求: ${profile.ranking_req || "无特殊要求"}
`.trim();

      const aiPrompt = `你是一个留学申请数据库专家。请根据以下学生档案，生成25-35个真实存在的留学项目数据。

学生档案：
${profileSummary}

要求：
1. 必须是真实存在的大学和项目，不要编造
2. 项目要覆盖不同录取难度（从顶尖到安全校）
3. 必须匹配学生的目标国家和学位层次
4. 包含QS排名前10到前300不同层次的学校
5. 数据要尽量准确（学费、截止日期、语言要求等）
6. 申请截止日期应为 2025-2026 申请季
7. 每个项目的 avg_score 应该是该项目通常录取学生的综合实力分数（0-100），考虑GPA、标化、软实力等

请以JSON数组格式返回，每个对象包含以下字段：
{
  "school": "学校中文名",
  "country": "国家",
  "program": "项目英文全称",
  "degree": "硕士/博士/本科",
  "field": "专业大类",
  "duration": "学制",
  "type": "授课型/研究型/Co-op",
  "avg_score": 75,
  "require_gpa": "GPA要求（如3.5/4.0或85/100）",
  "require_lang": "语言要求（如TOEFL 100/IELTS 7.0）",
  "tuition": "年学费",
  "living_cost": "年生活费",
  "link": "项目官网URL",
  "scholarship": "可用奖学金",
  "deadline": "2025-XX-XX",
  "rolling_admission": false,
  "application_materials": "成绩单、PS、CV、2封推荐信",
  "prestige": 4,
  "qs_ranking": 50,
  "accept_list": "985/211" 或 null,
  "notes": "项目特点描述"
}

只返回JSON数组，不要其他文字。`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "你是留学数据专家，只返回准确的JSON数据，不添加任何额外文字或markdown标记。" },
            { role: "user", content: aiPrompt },
          ],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        let content = aiData.choices?.[0]?.message?.content || "";
        
        // Clean markdown code blocks if present
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        try {
          const generatedPrograms = JSON.parse(content);
          if (Array.isArray(generatedPrograms) && generatedPrograms.length > 0) {
            // Insert into DB (ignore conflicts)
            const toInsert = generatedPrograms.map((p: any) => ({
              school: p.school,
              country: p.country,
              program: p.program,
              degree: p.degree,
              field: p.field,
              duration: p.duration,
              type: p.type,
              avg_score: p.avg_score,
              require_gpa: p.require_gpa,
              require_lang: p.require_lang,
              tuition: p.tuition,
              living_cost: p.living_cost,
              link: p.link,
              scholarship: p.scholarship,
              deadline: p.deadline,
              rolling_admission: p.rolling_admission || false,
              application_materials: p.application_materials,
              prestige: Math.min(5, Math.max(1, p.prestige || 3)),
              qs_ranking: p.qs_ranking,
              accept_list: p.accept_list,
              notes: p.notes,
            }));

            const { data: inserted } = await supabase
              .from("school_programs")
              .insert(toInsert)
              .select();

            if (inserted) programs = [...programs, ...inserted];
          }
        } catch (e) {
          console.error("Failed to parse AI response:", e, content.substring(0, 200));
        }
      }
    }

    if (programs.length === 0) {
      return new Response(JSON.stringify({
        error: "未找到匹配的项目，请尝试调整目标国家或专业",
        code: "NO_PROGRAMS",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Run matching algorithm
    const weights = getRegionWeights(profile.target_country || "");
    const gpaScore = calcGpaScore(profile.gpa || "", profile.school || "", weights);
    const langScore = calcLangScore(profile.language_score || "", profile.language_type || "", "", weights);

    const results = programs.map((prog: any) => {
      const programLangScore = calcLangScore(
        profile.language_score || "", 
        profile.language_type || "",
        prog.require_lang || "",
        weights
      );
      const greRequired = prog.application_materials?.toLowerCase().includes("gre") || 
                          prog.application_materials?.toLowerCase().includes("gmat") || false;
      const greScore = calcGreScore(profile.gre_gmat || "", greRequired, weights);
      const softScore = calcSoftScore(profile, prog.field || "", weights);

      const baseScore = gpaScore + programLangScore + greScore + softScore;
      const projectBonus = calcProjectBonus(prog.notes, profile);
      const totalScore = baseScore + projectBonus;

      const diff = totalScore - (prog.avg_score || 60);
      const probability = calcProbability(diff);

      // Elastic filtering
      let excluded = false;
      let riskFlags: string[] = [];

      // GPA elastic check
      if (prog.require_gpa) {
        const { value: userGpaPercent } = parseGPA(profile.gpa || "");
        const { value: reqGpaPercent } = parseGPA(prog.require_gpa);
        if (reqGpaPercent > 0 && userGpaPercent > 0) {
          const gap = (reqGpaPercent - userGpaPercent) / reqGpaPercent;
          if (gap > 0.2) excluded = true;
          else if (gap > 0) riskFlags.push("GPA 略低于最低要求");
        }
      }

      // Language elastic check
      if (prog.require_lang) {
        const userLang = parseLangScore(profile.language_score || "");
        const reqLang = parseLangScore(prog.require_lang);
        if (reqLang > 0 && userLang > 0) {
          const gap = (reqLang - userLang) / reqLang;
          if (gap > 0.2) excluded = true;
          else if (gap > 0) riskFlags.push("语言成绩略低于要求");
        }
      }

      // Accept list check
      if (prog.accept_list && profile.school) {
        const acceptList = prog.accept_list.toLowerCase();
        const userSchool = (profile.school || "").toLowerCase();
        if (acceptList.includes("985") && !acceptList.includes("211")) {
          const coeff = getSchoolCoefficient(profile.school);
          if (coeff < 1.0) excluded = true;
        }
      }

      // Deadline check
      let deadlineWarning = false;
      if (prog.deadline) {
        try {
          const dl = new Date(prog.deadline);
          const now = new Date();
          const weeksLeft = (dl.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000);
          if (dl < now && !prog.rolling_admission) excluded = true;
          if (weeksLeft > 0 && weeksLeft < 4) deadlineWarning = true;
        } catch {}
      }

      // Budget elastic check
      if (profile.budget && prog.tuition) {
        // Simple check - just flag, don't exclude
        const budgetNum = parseFloat(profile.budget.replace(/[^0-9.]/g, ""));
        // This is a rough check, actual currency conversion would be needed
      }

      const analysis = generateAnalysis(profile, prog, probability);

      return {
        ...prog,
        probability,
        totalScore: Math.round(totalScore * 10) / 10,
        excluded,
        riskFlags,
        deadlineWarning,
        analysis,
      };
    });

    // Filter and sort
    const validResults = results.filter((r: any) => !r.excluded);

    // Categorize
    const reach = validResults
      .filter((r: any) => r.probability >= 15 && r.probability < 40)
      .sort((a: any, b: any) => b.probability - a.probability)
      .slice(0, 4);
    
    const match = validResults
      .filter((r: any) => r.probability >= 40 && r.probability < 70)
      .sort((a: any, b: any) => b.probability - a.probability)
      .slice(0, 5);
    
    const safety = validResults
      .filter((r: any) => r.probability >= 70)
      .sort((a: any, b: any) => b.probability - a.probability)
      .slice(0, 4);

    // If any category is empty, borrow from adjacent
    if (reach.length === 0 && match.length > 2) {
      reach.push(...match.splice(0, 2));
    }
    if (safety.length === 0 && match.length > 2) {
      safety.push(...match.splice(-2));
    }

    const allDisplayed = [...reach, ...match, ...safety];
    const avgProb = allDisplayed.length > 0
      ? Math.round(allDisplayed.reduce((s, r) => s + r.probability, 0) / allDisplayed.length)
      : 0;

    // Calculate user's composite score
    const compositeScore = Math.round(gpaScore + langScore + calcGreScore(profile.gre_gmat || "", false, weights) + calcSoftScore(profile, profile.major || "", weights));

    return new Response(JSON.stringify({
      compositeScore: Math.min(100, compositeScore),
      totalMatched: validResults.length,
      avgProbability: avgProb,
      completeness,
      reach,
      match,
      safety,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("school-matching error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
