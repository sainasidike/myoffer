import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Step 1: School Coefficient ───────────────────────────────────────────────

const C9_SCHOOLS = new Set([
  "清华大学", "北京大学", "复旦大学", "上海交通大学", "浙江大学",
  "南京大学", "中国科学技术大学", "哈尔滨工业大学", "西安交通大学",
]);

const OTHER_985_SCHOOLS = new Set([
  "中山大学", "武汉大学", "华中科技大学", "天津大学", "北京理工大学",
  "东南大学", "大连理工大学", "吉林大学", "四川大学", "电子科技大学",
  "华南理工大学", "湖南大学", "重庆大学", "山东大学", "厦门大学",
  "北京航空航天大学", "北京师范大学", "中南大学", "兰州大学", "同济大学",
  "中国人民大学", "中国农业大学", "西北工业大学", "国防科技大学",
  "东北大学", "中国海洋大学", "中央民族大学",
]);

const SCHOOLS_211_ONLY = new Set([
  "上海大学", "苏州大学", "南京理工大学", "南京航空航天大学", "华东理工大学",
  "暨南大学", "北京交通大学", "北京工业大学", "郑州大学", "合肥工业大学",
  "西南交通大学", "武汉理工大学", "华中农业大学", "南昌大学", "太原理工大学",
  "河海大学", "江南大学", "东华大学", "西南大学", "中国矿业大学",
  "中国地质大学", "中国石油大学", "长安大学", "福州大学", "广西大学",
  "海南大学", "贵州大学", "新疆大学", "石河子大学", "宁夏大学",
  "延边大学", "内蒙古大学", "西藏大学", "青海大学",
]);

function getSchoolTier(school: string): "c9" | "985" | "211" | "shuangfei_yiben" | "shuangfei_erben" | "unknown" {
  if (!school) return "unknown";
  const s = school.trim();
  if (C9_SCHOOLS.has(s)) return "c9";
  if (OTHER_985_SCHOOLS.has(s)) return "985";
  if (SCHOOLS_211_ONLY.has(s)) return "211";
  // Simple heuristic for overseas QS top 100 — treat same as C9
  // Keywords that suggest a well-known overseas university
  const overseasKeywords = ["University", "College", "Institut", "大学"];
  const looksOverseas = /[a-zA-Z]/.test(s) && overseasKeywords.some(k => s.includes(k));
  if (looksOverseas) return "c9"; // generous assumption for overseas
  // For Chinese schools not in any list, default heuristic
  if (s.includes("一本")) return "shuangfei_yiben";
  if (s.includes("二本") || s.includes("三本")) return "shuangfei_erben";
  return "unknown";
}

function getSchoolCoefficient(school: string): number {
  const tier = getSchoolTier(school);
  switch (tier) {
    case "c9": return 1.05;
    case "985": return 1.00;
    case "211": return 0.95;
    case "shuangfei_yiben": return 0.88;
    case "shuangfei_erben": return 0.80;
    case "unknown": return 0.85;
  }
}

// ─── Step 2: Region Weights ───────────────────────────────────────────────────

interface Weights {
  gpa: number;
  lang: number;
  gre: number;
  soft: number;
}

function normalizeCountry(country: string): string {
  const c = (country || "").trim();
  const upper = c.toUpperCase();
  const map: Record<string, string> = {
    "US": "United States", "USA": "United States", "美国": "United States", "UNITED STATES": "United States",
    "UK": "United Kingdom", "英国": "United Kingdom", "UNITED KINGDOM": "United Kingdom", "ENGLAND": "United Kingdom",
    "AU": "Australia", "澳大利亚": "Australia", "澳洲": "Australia", "AUSTRALIA": "Australia",
    "CA": "Canada", "加拿大": "Canada", "CANADA": "Canada",
    "HK": "Hong Kong", "香港": "Hong Kong", "HONG KONG": "Hong Kong",
    "SG": "Singapore", "新加坡": "Singapore", "SINGAPORE": "Singapore",
    "JP": "Japan", "日本": "Japan", "JAPAN": "Japan",
    "NZ": "New Zealand", "新西兰": "New Zealand", "NEW ZEALAND": "New Zealand",
    "DE": "Germany", "德国": "Germany", "GERMANY": "Germany",
    "NL": "Netherlands", "荷兰": "Netherlands", "NETHERLANDS": "Netherlands",
    "FR": "France", "法国": "France", "FRANCE": "France",
    "SE": "Sweden", "瑞典": "Sweden", "SWEDEN": "Sweden",
    "DK": "Denmark", "丹麦": "Denmark", "DENMARK": "Denmark",
    "CH": "Switzerland", "瑞士": "Switzerland", "SWITZERLAND": "Switzerland",
    "IE": "Ireland", "爱尔兰": "Ireland", "IRELAND": "Ireland",
    "FI": "Finland", "芬兰": "Finland", "FINLAND": "Finland",
    "IT": "Italy", "意大利": "Italy", "ITALY": "Italy",
    "ES": "Spain", "西班牙": "Spain", "SPAIN": "Spain",
    "NO": "Norway", "挪威": "Norway", "NORWAY": "Norway",
    "BE": "Belgium", "比利时": "Belgium", "BELGIUM": "Belgium",
    "欧洲": "Europe", "EUROPE": "Europe",
  };
  return map[c] || map[upper] || c;
}

function getRegionWeights(country: string): Weights {
  const c = normalizeCountry(country);
  if (c === "United States") return { gpa: 35, lang: 20, gre: 15, soft: 30 };
  if (c === "United Kingdom") return { gpa: 50, lang: 25, gre: 5, soft: 20 };
  if (["Hong Kong", "Singapore", "Australia", "Canada"].includes(c))
    return { gpa: 45, lang: 20, gre: 10, soft: 25 };
  // EU and others
  return { gpa: 40, lang: 25, gre: 0, soft: 25 };
}

// ─── Field Relatedness ────────────────────────────────────────────────────────

const FIELD_GROUPS: string[][] = [
  ["计算机", "CS", "Computer Science", "软件", "数据科学", "Data Science", "人工智能", "AI", "机器学习", "信息技术", "IT", "EE", "电子", "电气", "通信", "自动化", "物联网"],
  ["商科", "金融", "Finance", "会计", "Accounting", "MBA", "管理", "Management", "经济", "Economics", "市场营销", "Marketing", "商业分析", "Business"],
  ["机械", "材料", "土木", "建筑", "化工", "环境工程", "工业工程"],
  ["数学", "统计", "物理", "化学", "生物"],
  ["法律", "Law", "法学"],
  ["教育", "Education", "TESOL", "语言学"],
  ["传媒", "新闻", "Media", "Communication"],
  ["设计", "艺术", "Art", "Design", "建筑设计"],
  ["医学", "药学", "公共卫生", "护理"],
];

function fieldsRelated(userMajor: string, programField: string): "exact" | "partial" | "none" {
  if (!userMajor || !programField) return "partial"; // generous fallback
  const u = userMajor.toLowerCase();
  const p = programField.toLowerCase();
  // Direct substring match
  if (u.includes(p) || p.includes(u)) return "exact";
  // Check if in same group
  for (const group of FIELD_GROUPS) {
    const lowerGroup = group.map(g => g.toLowerCase());
    const userIn = lowerGroup.some(g => u.includes(g) || g.includes(u));
    const progIn = lowerGroup.some(g => p.includes(g) || g.includes(p));
    if (userIn && progIn) return "exact";
    if (userIn || progIn) {
      // Check cross-group partial match
      // e.g., math student applying to CS — partially related
    }
  }
  // Check if user is in any group and program is in a different group
  let userGroup = -1;
  let progGroup = -1;
  for (let i = 0; i < FIELD_GROUPS.length; i++) {
    const lowerGroup = FIELD_GROUPS[i].map(g => g.toLowerCase());
    if (lowerGroup.some(g => u.includes(g) || g.includes(u))) userGroup = i;
    if (lowerGroup.some(g => p.includes(g) || g.includes(p))) progGroup = i;
  }
  if (userGroup >= 0 && progGroup >= 0 && userGroup !== progGroup) return "none";
  return "partial"; // default: partially related
}

// ─── Helper: Parse language score ─────────────────────────────────────────────

function parseLanguageScore(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    // Try common keys
    for (const key of ["overall", "total", "score", "总分"]) {
      if (obj[key] != null) {
        const n = typeof obj[key] === "number" ? obj[key] as number : parseFloat(String(obj[key]));
        if (!isNaN(n)) return n;
      }
    }
    // Fallback: first numeric value
    for (const v of Object.values(obj)) {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = parseFloat(v);
        if (!isNaN(n)) return n;
      }
    }
  }
  return null;
}

function parseGreScore(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["gre", "GRE", "total", "score", "gmat", "GMAT"]) {
      if (obj[key] != null) {
        const n = typeof obj[key] === "number" ? obj[key] as number : parseFloat(String(obj[key]));
        if (!isNaN(n)) return n;
      }
    }
  }
  return null;
}

function hasGre(raw: unknown): boolean {
  if (raw == null) return false;
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return obj["gre"] != null || obj["GRE"] != null;
  }
  return false;
}

function parseProgramLangReq(requireLang: unknown): { ieltsMin: number | null; toeflMin: number | null } {
  if (requireLang == null) return { ieltsMin: null, toeflMin: null };
  if (typeof requireLang === "object") {
    const obj = requireLang as Record<string, unknown>;
    const ielts = obj["ielts_min"] != null ? Number(obj["ielts_min"]) : null;
    const toefl = obj["toefl_min"] != null ? Number(obj["toefl_min"]) : null;
    return {
      ieltsMin: ielts != null && !isNaN(ielts) ? ielts : null,
      toeflMin: toefl != null && !isNaN(toefl) ? toefl : null,
    };
  }
  return { ieltsMin: null, toeflMin: null };
}

function parseNumber(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    // Handle strings like "£15,000" or "30000 AUD/year" — extract first number
    const cleaned = val.replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }
  return null;
}

// ─── Degree mapping ───────────────────────────────────────────────────────────

function mapDegree(deg: string): string {
  if (!deg) return "";
  const d = deg.toLowerCase().trim();
  if (d === "硕士" || d.includes("master") || d === "msc" || d === "ma" || d === "meng") return "master";
  if (d === "博士" || d.includes("phd") || d.includes("doctor")) return "phd";
  if (d === "本科" || d.includes("bachelor")) return "bachelor";
  return d;
}

// ─── Step 3 & 4: Filtering ────────────────────────────────────────────────────

interface RiskFlag {
  type: string;
  message: string;
}

// deno-lint-ignore no-explicit-any
function hardFilter(program: any, profile: any, now: Date): boolean {
  // Country filter
  const targetCountries = (profile.target_country || []).map((c: string) => normalizeCountry(c));
  if (targetCountries.length > 0) {
    const pc = normalizeCountry(program.country || "");
    // Expand "Europe" to all European countries
    const europeanCountries = ["Germany", "Netherlands", "Sweden", "Denmark", "Switzerland", "France", "Ireland", "Finland", "Italy", "Spain", "Norway", "Belgium"];
    const expandedTargets = new Set(targetCountries);
    if (expandedTargets.has("Europe")) {
      expandedTargets.delete("Europe");
      europeanCountries.forEach(c => expandedTargets.add(c));
    }
    if (!expandedTargets.has(pc)) return false;
  }

  // Degree filter
  const targetDegree = mapDegree(profile.target_degree || "master");
  const programDegree = mapDegree(program.degree_type || "");
  if (programDegree && targetDegree && programDegree !== targetDegree) return false;

  // Field relatedness
  const rel = fieldsRelated(profile.major || "", program.field || program.program_name || "");
  if (rel === "none" && !profile.cross_major) return false;

  // Accept list check
  if (program.accept_list) {
    const acceptList = String(program.accept_list).toLowerCase();
    const schoolTier = getSchoolTier(profile.school || "");
    if (acceptList.includes("985") && !["c9", "985"].includes(schoolTier)) return false;
    if (acceptList.includes("211") && !["c9", "985", "211"].includes(schoolTier)) return false;
  }

  // Deadline check: at least one deadline is in the future
  // deadline is jsonb like {"round1":"2026-12-01","round2":"2027-03-01"}
  if (program.deadline && typeof program.deadline === "object") {
    try {
      const dateValues = Object.values(program.deadline as Record<string, string>);
      const hasFuture = dateValues.some((d) => {
        if (!d) return true;
        const date = new Date(String(d));
        return isNaN(date.getTime()) || date > now;
      });
      if (!hasFuture) return false;
    } catch {
      // If we can't parse deadline, don't filter out
    }
  }

  return true;
}

// deno-lint-ignore no-explicit-any
function elasticFilter(program: any, profile: any): { pass: boolean; riskFlags: RiskFlag[] } {
  const riskFlags: RiskFlag[] = [];

  // GPA check
  if (program.gpa_requirement && profile.gpa) {
    const req = parseNumber(program.gpa_requirement);
    let userGpa = parseNumber(profile.gpa);
    if (req != null && userGpa != null) {
      // Normalize both to same scale
      const scale = parseNumber(profile.gpa_scale) || 4.0;
      // Convert user GPA to 百分制 for comparison
      if (scale <= 5) userGpa = userGpa * (100 / scale);
      // Assume requirement is on same scale as listed (likely 百分制 or 4.0)
      let reqNorm = req;
      if (req <= 5) reqNorm = req * 25; // 4.0 scale → 百分制

      if (userGpa < reqNorm * 0.8) return { pass: false, riskFlags };
      if (userGpa < reqNorm) {
        riskFlags.push({ type: "gpa_low", message: `GPA略低于要求(要求${program.gpa_requirement})` });
      }
    }
  }

  // Language check
  const userLangScore = parseLanguageScore(profile.language_score);
  const { ieltsMin, toeflMin } = parseProgramLangReq(program.require_lang);
  const langType = (profile.language_type || "").toLowerCase();
  if (userLangScore != null) {
    let minReq: number | null = null;
    if (langType.includes("ielts") || langType.includes("雅思")) {
      minReq = ieltsMin;
    } else if (langType.includes("toefl") || langType.includes("托福")) {
      minReq = toeflMin;
    } else {
      // Guess based on score magnitude
      minReq = userLangScore <= 9 ? ieltsMin : toeflMin;
    }
    if (minReq != null) {
      if (userLangScore < minReq * 0.8) return { pass: false, riskFlags };
      if (userLangScore < minReq) {
        riskFlags.push({ type: "lang_low", message: `语言成绩略低于要求(要求${minReq})` });
      }
    }
  }

  // Budget check
  if (profile.budget) {
    const budget = parseNumber(profile.budget);
    const tuition = parseNumber(program.tuition);
    const living = parseNumber(program.living_cost);
    if (budget != null && tuition != null) {
      const totalCost = tuition + (living || 0);
      if (totalCost > budget * 1.2) return { pass: false, riskFlags };
      if (totalCost > budget) {
        riskFlags.push({ type: "budget_tight", message: `费用略超预算` });
      }
    }
  }

  return { pass: true, riskFlags };
}

// ─── Step 5: Score Calculation ────────────────────────────────────────────────

interface ScoreResult {
  gpaScore: number;
  langScore: number;
  greScore: number;
  softScore: number;
  totalScore: number;
  langMet: boolean;
}

// deno-lint-ignore no-explicit-any
function calculateScores(profile: any, program: any, weights: Weights): ScoreResult {
  const schoolCoeff = getSchoolCoefficient(profile.school || "");

  // ── GPA Score ──
  let gpaScore = 0;
  const userGpa = parseNumber(profile.gpa);
  if (userGpa != null) {
    const scale = parseNumber(profile.gpa_scale) || 4.0;
    let baifen: number;
    if (userGpa > 10) {
      baifen = userGpa; // already 百分制
    } else if (scale <= 4.0) {
      baifen = userGpa * 25;
    } else {
      baifen = userGpa * 20; // 5.0 scale
    }
    const adjustedGpa = baifen * schoolCoeff;
    gpaScore = adjustedGpa * (weights.gpa / 100);
  }

  // ── Language Score ──
  let langScore = 0;
  let langMet = false;
  const userLangScore = parseLanguageScore(profile.language_score);
  const { ieltsMin, toeflMin } = parseProgramLangReq(program.require_lang);
  const langType = (profile.language_type || "").toLowerCase();
  const isIelts = langType.includes("ielts") || langType.includes("雅思") ||
    (userLangScore != null && userLangScore <= 9);

  let langReq: number | null = null;
  if (isIelts) {
    langReq = ieltsMin;
  } else {
    langReq = toeflMin;
  }

  if (userLangScore != null && langReq != null) {
    const threshold = isIelts ? 1.0 : 10;
    const halfThreshold = isIelts ? 0.5 : 5;
    let base: number;
    let bonus = 0;
    if (userLangScore >= langReq + threshold) {
      base = 80; bonus = 10; langMet = true;
    } else if (userLangScore >= langReq) {
      base = 80; bonus = 0; langMet = true;
    } else if (userLangScore >= langReq - halfThreshold) {
      base = 60; bonus = 0;
    } else {
      base = 40; bonus = 0;
    }
    langScore = (base + bonus) * (weights.lang / 100);
  } else if (userLangScore != null) {
    // No requirement info — assume moderate
    langScore = 60 * (weights.lang / 100);
    langMet = true;
  } else {
    langScore = 40 * (weights.lang / 100);
  }

  // ── GRE Score ──
  let greScore = 0;
  const greRequired = !!program.gre_required;
  const userGreScore = parseGreScore(profile.gre_gmat);
  const userHasGre = userGreScore != null || hasGre(profile.gre_gmat);

  if (greRequired) {
    if (userGreScore != null) {
      greScore = Math.min((userGreScore / 340) * 100, 100) * (weights.gre / 100);
    } else {
      greScore = 0; // penalty
    }
  } else {
    if (userGreScore != null) {
      greScore = 60 * (weights.gre / 100); // small bonus
    } else {
      greScore = 50 * (weights.gre / 100); // neutral
    }
  }

  // ── Soft Power Score ──
  let softRaw = 0;
  const internships = Array.isArray(profile.internship) ? profile.internship : [];
  const researches = Array.isArray(profile.research) ? profile.research : [];
  const awards = Array.isArray(profile.awards) ? profile.awards : [];

  // Internship: +3 each, max 3
  softRaw += Math.min(internships.length, 3) * 3;

  // Research: +5 if top, else +3, max 3
  const topKeywords = ["顶会", "SCI", "top", "CCF", "Nature", "Science", "IEEE"];
  for (let i = 0; i < Math.min(researches.length, 3); i++) {
    const r = String(researches[i]).toLowerCase();
    const isTop = topKeywords.some(k => r.includes(k.toLowerCase()));
    softRaw += isTop ? 5 : 3;
  }

  // Awards: +3 each, max 3
  softRaw += Math.min(awards.length, 3) * 3;

  // Relevance coefficient: assume 0.7 (partially related) for simplicity
  softRaw *= 0.7;

  // Cap at 15
  const cappedSoft = Math.min(softRaw, 15);
  const softScore = cappedSoft * (weights.soft / 100);

  const totalScore = gpaScore + langScore + greScore + softScore;

  return { gpaScore, langScore, greScore, softScore, totalScore, langMet };
}

// ─── Step 6: Project Bonus ────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
function getProjectBonus(program: any, profile: any): number {
  const notes = String(program.notes || "").toLowerCase();
  const tags = ((program.tags || []) as string[]).map((t: string) => t.toLowerCase()).join(" ");
  const text = notes + " " + tags;
  const hasResearch = Array.isArray(profile.research) && profile.research.length > 0;
  const hasInternship = Array.isArray(profile.internship) && profile.internship.length > 0;
  const topKeywords = ["顶会", "sci", "top", "ccf"];
  const hasTopResearch = hasResearch && profile.research.some((r: string) =>
    topKeywords.some(k => String(r).toLowerCase().includes(k))
  );

  let bonus = 0;

  if (text.includes("重视科研") || text.includes("研究导向")) {
    if (hasTopResearch) bonus += 5;
    else if (hasResearch) bonus += 3;
  }

  if (text.includes("co-op") || text.includes("含实习") || text.includes("实习")) {
    if (hasInternship) bonus += 3;
  }

  if (text.includes("偏好工作经验") || text.includes("工作经验")) {
    if (hasInternship) bonus += 3;
  }

  if (text.includes("对中国学生友好") || text.includes("中国学生")) {
    bonus += 2;
  }

  return Math.min(bonus, 10);
}

// ─── Step 7: Calculate Probability ────────────────────────────────────────────

function calculateProbability(totalScore: number, bonus: number, avgScore: number): number {
  const diff = (totalScore + bonus) - avgScore;
  let prob: number;

  if (diff >= 10) {
    prob = 75 + diff * 0.5;
    prob = Math.min(prob, 95);
  } else if (diff >= 0) {
    prob = 50 + diff * 2.5;
  } else if (diff >= -10) {
    prob = 30 + diff * 2;
  } else {
    prob = Math.max(10 - (Math.abs(diff) - 10) * 1.5, 3);
  }

  return Math.max(3, Math.min(95, Math.round(prob)));
}

// ─── Step 10: Generate Tags ───────────────────────────────────────────────────

interface Tags {
  advantage_tags: string[];
  weakness_tags: string[];
  improvement_tips: string[];
}

// deno-lint-ignore no-explicit-any
function generateTags(profile: any, program: any, scores: ScoreResult, riskFlags: RiskFlag[], probability: number): Tags {
  const advantage_tags: string[] = [];
  const weakness_tags: string[] = [];
  const improvement_tips: string[] = [];

  // GPA
  const userGpa = parseNumber(profile.gpa);
  const gpaReq = parseNumber(program.gpa_requirement);
  if (userGpa != null && gpaReq != null) {
    const scale = parseNumber(profile.gpa_scale) || 4.0;
    const normalizedUser = userGpa > 10 ? userGpa : userGpa * (scale <= 4 ? 25 : 20);
    const normalizedReq = gpaReq > 10 ? gpaReq : gpaReq * 25;
    if (normalizedUser >= normalizedReq) {
      advantage_tags.push("GPA高于要求");
    } else {
      weakness_tags.push("GPA略低");
      const gap = normalizedReq - normalizedUser;
      improvement_tips.push(`提升GPA ${(gap / 25).toFixed(1)} 分可显著提高录取率`);
    }
  }

  // Language
  if (scores.langMet) {
    advantage_tags.push("语言达标");
  } else {
    weakness_tags.push("语言未达标");
    const isIelts = (profile.language_type || "").toLowerCase().includes("ielts") ||
      (profile.language_type || "").includes("雅思");
    if (isIelts) {
      improvement_tips.push("再考一次雅思提升0.5→录取概率+5%");
    } else {
      improvement_tips.push("再考一次托福提升5分→录取概率+5%");
    }
  }

  // GRE
  const greRequired = !!program.gre_required;
  const userGreScore = parseGreScore(profile.gre_gmat);
  if (greRequired && userGreScore == null) {
    weakness_tags.push("无GRE");
    improvement_tips.push("考取GRE 320+→录取概率+10%");
  } else if (userGreScore != null) {
    advantage_tags.push("有GRE/GMAT成绩");
  }

  // Soft power
  const internships = Array.isArray(profile.internship) ? profile.internship : [];
  const researches = Array.isArray(profile.research) ? profile.research : [];
  if (internships.length > 0) {
    advantage_tags.push("有实习经历");
  } else {
    weakness_tags.push("缺少实习");
    improvement_tips.push("补一段实习→录取概率+3%");
  }
  if (researches.length > 0) {
    advantage_tags.push("有科研经历");
  } else {
    if (probability < 50) {
      improvement_tips.push("增加科研经历→录取概率+5%");
    }
  }

  // Risk flags
  for (const flag of riskFlags) {
    if (flag.type === "budget_tight") weakness_tags.push("费用略超预算");
  }

  // School tier
  const tier = getSchoolTier(profile.school || "");
  if (["c9", "985"].includes(tier)) {
    advantage_tags.push("院校背景优秀");
  } else if (tier === "211") {
    advantage_tags.push("211院校背景");
  }

  return { advantage_tags, weakness_tags, improvement_tips };
}

// ─── Main Server ──────────────────────────────────────────────────────────────

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

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (data: unknown) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    (async () => {
      try {
        // ── SSE Step 1: Thinking ──
        await sendEvent({ type: "thinking", content: "正在读取你的档案信息..." });

        // ── Database pre-filter ──
        let query = supabase.from("programs").select("*");
        if (filters?.countries?.length > 0) {
          // Normalize to full English names matching DB values
          const normalizedCountries = filters.countries.map(
            (c: string) => normalizeCountry(c)
          );
          // Also include "Europe" expansion if user selected 欧洲
          const europeanCountries = ["Germany", "Netherlands", "Sweden", "Denmark", "Switzerland", "France", "Ireland", "Finland", "Italy", "Spain", "Norway", "Belgium"];
          const expanded = new Set(normalizedCountries);
          if (expanded.has("Europe")) {
            expanded.delete("Europe");
            europeanCountries.forEach(c => expanded.add(c));
          }
          query = query.in("country", [...expanded]);
        }
        if (filters?.degree) {
          // Normalize Chinese degree names to English
          const degreeMap: Record<string, string> = {
            "硕士": "master", "研究生": "master", "master": "master",
            "博士": "phd", "phd": "phd",
            "本科": "bachelor", "bachelor": "bachelor",
          };
          const normalizedDegree = degreeMap[filters.degree.toLowerCase()] || filters.degree;
          query = query.eq("degree_type", normalizedDegree);
        }
        const { data: programs, error: dbError } = await query;
        if (dbError) throw dbError;

        if (!programs || programs.length === 0) {
          await sendEvent({ type: "error", content: "未找到匹配的项目，请调整筛选条件" });
          await writer.write(encoder.encode("data: [DONE]\n\n"));
          await writer.close();
          return;
        }

        // ── Step 3: Hard Filtering ──
        const now = new Date();
        let hardFiltered = programs.filter((p) => hardFilter(p, profile, now));

        await sendEvent({ type: "thinking", content: `已筛选出 ${hardFiltered.length} 个候选项目...` });

        if (hardFiltered.length === 0) {
          // Fallback: relax filter and take some programs anyway
          await sendEvent({ type: "thinking", content: "硬筛选结果为空，放宽条件中..." });
          // Use all programs from DB as candidates (sorted by QS ranking)
          const byRanking = [...programs].sort((a, b) => (a.qs_ranking || 9999) - (b.qs_ranking || 9999));
          hardFiltered = byRanking.slice(0, 30);
        }

        // ── Step 4: Elastic Filtering ──
        const candidates: Array<{
          // deno-lint-ignore no-explicit-any
          program: any;
          riskFlags: RiskFlag[];
        }> = [];

        for (const prog of hardFiltered) {
          const { pass, riskFlags } = elasticFilter(prog, profile);
          if (pass) {
            candidates.push({ program: prog, riskFlags });
          }
        }

        // If elastic filter removed too many, add back with risk flags
        if (candidates.length < 5 && hardFiltered.length > candidates.length) {
          for (const prog of hardFiltered) {
            if (!candidates.some(c => c.program.id === prog.id)) {
              const { riskFlags } = elasticFilter(prog, profile);
              candidates.push({ program: prog, riskFlags });
              if (candidates.length >= 15) break;
            }
          }
        }

        // ── ULTIMATE FALLBACK: If still 0 candidates, bypass all filters ──
        if (candidates.length === 0) {
          await sendEvent({ type: "thinking", content: "条件筛选无结果，正在推荐热门项目..." });
          // Take top programs by QS ranking from ALL DB programs
          const fallbackPrograms = [...programs]
            .sort((a, b) => (a.qs_ranking || 9999) - (b.qs_ranking || 9999))
            .slice(0, 10);
          for (const prog of fallbackPrograms) {
            candidates.push({ program: prog, riskFlags: [{ type: "fallback", message: "该项目为推荐热门项目，建议完善档案后重新匹配" }] });
          }
        }

        await sendEvent({ type: "thinking", content: "正在计算各项目录取概率..." });

        // ── Step 5-7: Score & Probability ──
        const scored = candidates.map(({ program: prog, riskFlags }) => {
          const weights = getRegionWeights(prog.country || "");
          const scores = calculateScores(profile, prog, weights);
          const bonus = getProjectBonus(prog, profile);
          const avgScore = parseNumber(prog.avg_score) || 55; // default avg
          const probability = calculateProbability(scores.totalScore, bonus, avgScore);
          const tags = generateTags(profile, prog, scores, riskFlags, probability);

          return {
            program: prog,
            program_id: prog.id,
            probability,
            scores,
            bonus,
            riskFlags,
            ...tags,
          };
        });

        // Sort by probability descending
        scored.sort((a, b) => b.probability - a.probability);

        // ── Step 8: Tier Assignment & Selection ──
        // Primary tier assignment by probability ranges
        const reach = scored.filter(s => s.probability >= 15 && s.probability < 40);
        const match = scored.filter(s => s.probability >= 40 && s.probability < 70);
        const safety = scored.filter(s => s.probability >= 70);

        let selectedReach = reach.slice(0, 3).map(s => ({ ...s, tier: "reach" as const }));
        let selectedMatch = match.slice(0, 4).map(s => ({ ...s, tier: "match" as const }));
        let selectedSafety = safety.slice(0, 3).map(s => ({ ...s, tier: "safety" as const }));

        // ── FALLBACK: Force distribution when all tiers are empty ──
        // This handles weak profiles where ALL probabilities < 15%
        const allEmpty = selectedReach.length === 0 && selectedMatch.length === 0 && selectedSafety.length === 0;

        if (allEmpty && scored.length > 0) {
          // Force-distribute: sorted is descending by probability
          // Highest prob → safety (best chance), middle → match, lowest → reach (hardest)
          const total = scored.length;
          if (total === 1) {
            selectedMatch = [{ ...scored[0], tier: "match" as const }];
          } else if (total === 2) {
            selectedReach = [{ ...scored[1], tier: "reach" as const }];
            selectedSafety = [{ ...scored[0], tier: "safety" as const }];
          } else if (total <= 5) {
            // Split: top 1 safety, bottom 1 reach, rest match
            selectedSafety = [{ ...scored[0], tier: "safety" as const }];
            selectedMatch = scored.slice(1, total - 1).map(s => ({ ...s, tier: "match" as const }));
            selectedReach = [{ ...scored[total - 1], tier: "reach" as const }];
          } else {
            // Enough items: top ~30% safety, middle ~40% match, bottom ~30% reach
            const safetyEnd = Math.max(1, Math.round(total * 0.3));
            const matchEnd = Math.max(safetyEnd + 1, Math.round(total * 0.7));
            selectedSafety = scored.slice(0, Math.min(safetyEnd, 3)).map(s => ({ ...s, tier: "safety" as const }));
            selectedMatch = scored.slice(safetyEnd, Math.min(matchEnd, safetyEnd + 4)).map(s => ({ ...s, tier: "match" as const }));
            selectedReach = scored.slice(matchEnd, Math.min(total, matchEnd + 3)).map(s => ({ ...s, tier: "reach" as const }));
          }
        } else {
          // Normal borrow logic for partially empty tiers
          if (selectedReach.length === 0 && scored.length > 0) {
            const lowProb = scored.filter(s => s.probability < 40 && !selectedMatch.some(m => m.program_id === s.program_id));
            if (lowProb.length > 0) {
              selectedReach = lowProb.slice(0, 3).map(s => ({ ...s, tier: "reach" as const }));
            } else {
              // Take from the lowest probability items not already selected
              const usedIds = new Set([...selectedMatch, ...selectedSafety].map(s => s.program_id));
              const remaining = scored.filter(s => !usedIds.has(s.program_id));
              selectedReach = remaining.slice(-3).reverse().map(s => ({ ...s, tier: "reach" as const }));
            }
          }

          if (selectedMatch.length === 0 && scored.length > 0) {
            const usedIds = new Set([...selectedReach, ...selectedSafety].map(s => s.program_id));
            const remaining = scored.filter(s => !usedIds.has(s.program_id));
            if (remaining.length > 0) {
              selectedMatch = remaining.slice(0, 4).map(s => ({ ...s, tier: "match" as const }));
            }
          }

          if (selectedSafety.length === 0 && scored.length > 0) {
            const usedIds = new Set([...selectedReach, ...selectedMatch].map(s => s.program_id));
            const remaining = scored.filter(s => !usedIds.has(s.program_id));
            if (remaining.length > 0) {
              selectedSafety = remaining.slice(0, 3).map(s => ({ ...s, tier: "safety" as const }));
            } else if (selectedMatch.length > 1) {
              // Redistribute: move highest-probability match items to safety
              // Sort match by probability descending, move top 1-2 to safety
              const sortedMatch = [...selectedMatch].sort((a, b) => b.probability - a.probability);
              const moveCount = Math.min(Math.max(1, Math.floor(sortedMatch.length / 2)), 2);
              const movedToSafety = sortedMatch.slice(0, moveCount);
              const movedIds = new Set(movedToSafety.map(s => s.program_id));
              selectedSafety = movedToSafety.map(s => ({ ...s, tier: "safety" as const }));
              selectedMatch = selectedMatch.filter(s => !movedIds.has(s.program_id));
            } else if (selectedReach.length > 1) {
              // Move lowest-probability reach item to safety (least bad option)
              const sortedReach = [...selectedReach].sort((a, b) => b.probability - a.probability);
              selectedSafety = [{ ...sortedReach[0], tier: "safety" as const }];
              selectedReach = selectedReach.filter(s => s.program_id !== sortedReach[0].program_id);
            }
          }
        }

        const allSelected = [...selectedReach, ...selectedMatch, ...selectedSafety];

        // Deduplicate by program_id
        const seen = new Set<string>();
        const uniqueSelected = allSelected.filter(s => {
          if (seen.has(s.program_id)) return false;
          seen.add(s.program_id);
          return true;
        });

        // Overall competitiveness
        const competitiveness = uniqueSelected.length > 0
          ? Math.round(uniqueSelected.reduce((sum, s) => sum + s.scores.totalScore, 0) / uniqueSelected.length)
          : 50;

        // ── Step 9: AI Reason Generation ──
        await sendEvent({ type: "thinking", content: "正在生成个性化分析..." });

        // deno-lint-ignore no-explicit-any
        let withReasons: any[] = uniqueSelected;

        try {
          const programSummaries = uniqueSelected.map(s =>
            `[${s.program_id}] ${s.program.university_name || ""}(${s.program.university_name_cn || ""}) - ${s.program.program_name || ""} | 概率:${s.probability}% | 档次:${s.tier}`
          ).join("\n");

          const profileSummary = `学校:${profile.school || "未知"} 专业:${profile.major || "未知"} GPA:${profile.gpa || "N/A"}/${profile.gpa_scale || 4.0} 语言:${profile.language_type || ""} ${parseLanguageScore(profile.language_score) ?? "未知"}`;

          const aiResponse = await fetch(
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
                  {
                    role: "system",
                    content: "你是留学选校顾问。为每个项目生成一句话个性化分析（30字内），说明为什么推荐或需要注意什么。输出严格JSON数组格式: [{\"id\":\"xxx\",\"reason\":\"分析...\"}]，不要输出其他内容。",
                  },
                  {
                    role: "user",
                    content: `学生背景: ${profileSummary}\n\n项目列表:\n${programSummaries}\n\n请为每个项目生成一句话分析。`,
                  },
                ],
                temperature: 0.3,
                max_tokens: 2048,
              }),
            }
          );

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            // Extract JSON array from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const reasons = JSON.parse(jsonMatch[0]) as Array<{ id: string; reason: string }>;
              const reasonMap = new Map(reasons.map(r => [r.id, r.reason]));
              withReasons = uniqueSelected.map(s => ({
                ...s,
                reason: reasonMap.get(s.program_id) || generateFallbackReason(s),
              }));
            } else {
              withReasons = uniqueSelected.map(s => ({ ...s, reason: generateFallbackReason(s) }));
            }
          } else {
            console.error("Zhipu reason generation failed:", aiResponse.status);
            withReasons = uniqueSelected.map(s => ({ ...s, reason: generateFallbackReason(s) }));
          }
        } catch (aiErr) {
          console.error("AI reason generation error:", aiErr);
          withReasons = uniqueSelected.map(s => ({ ...s, reason: generateFallbackReason(s) }));
        }

        // ── Step 10: Final output ──
        // deno-lint-ignore no-explicit-any
        const schools = withReasons.map((s: any) => ({
          program_id: s.program_id,
          probability: s.probability,
          tier: s.tier,
          reason: s.reason || "",
          risk_flags: (s.riskFlags || []).map((f: RiskFlag) => f.message),
          advantage_tags: s.advantage_tags || [],
          weakness_tags: s.weakness_tags || [],
          improvement_tips: s.improvement_tips || [],
          program: s.program,
        }));

        await sendEvent({
          type: "result",
          competitiveness,
          schools,
        });

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream processing error:", e);
        await sendEvent({ type: "error", content: "处理匹配结果时出错: " + (e instanceof Error ? e.message : "未知错误") });
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

// ─── Fallback Reason Generator ────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
function generateFallbackReason(s: any): string {
  const gpaStrong = s.scores?.gpaScore > 30;
  const langMet = s.scores?.langMet;
  const prob = s.probability;
  return `GPA ${gpaStrong ? "竞争力强" : "需提升"}，${langMet ? "语言达标" : "语言需加强"}，综合录取概率 ${prob}%`;
}
