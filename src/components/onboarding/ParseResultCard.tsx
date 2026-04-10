import {
  FileText,
  CheckCircle2,
  GraduationCap,
  BarChart3,
  Briefcase,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { renderInline } from "@/lib/renderMarkdown";

interface ParseResultCardProps {
  content: string;
  fileName: string;
}

/** Map section title keywords to icon + color */
function getSectionMeta(title: string) {
  const t = title.toLowerCase();
  if (t.includes("学术") || t.includes("教育") || t.includes("学校"))
    return { icon: GraduationCap, color: "text-blue-600 bg-blue-50" };
  if (t.includes("成绩") || t.includes("gpa") || t.includes("语言") || t.includes("标准化"))
    return { icon: BarChart3, color: "text-emerald-600 bg-emerald-50" };
  if (t.includes("实习") || t.includes("科研") || t.includes("软实力") || t.includes("经历"))
    return { icon: Briefcase, color: "text-purple-600 bg-purple-50" };
  if (t.includes("确认") || t.includes("注意") || t.includes("无法"))
    return { icon: AlertCircle, color: "text-amber-600 bg-amber-50" };
  if (t.includes("自动") || t.includes("保存") || t.includes("提取"))
    return { icon: Sparkles, color: "text-primary bg-primary/10" };
  return { icon: FileText, color: "text-gray-600 bg-gray-50" };
}

/** Parse AI-generated text into sections, filtering out "未提及"/"暂无" items */
function parseSections(text: string) {
  const lines = text.split("\n");
  const sections: { title: string; items: string[] }[] = [];
  let currentSection: { title: string; items: string[] } | null = null;
  const preambleLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers: ## Title, **Title**, 1. **Title**
    const headerMatch =
      line.match(/^#{1,3}\s+(.+)/) ||
      line.match(/^\d+\.\s*\*\*(.+?)\*\*/) ||
      line.match(/^\*\*(.+?)\*\*\s*$/);

    if (headerMatch) {
      const title = headerMatch[1].replace(/\*\*/g, "").replace(/[：:]\s*$/, "").trim();
      currentSection = { title, items: [] };
      sections.push(currentSection);
      continue;
    }

    // List items: - item, · item, • item
    const itemMatch = line.match(/^[-·•]\s+(.+)/);
    if (itemMatch && currentSection) {
      const itemText = itemMatch[1];
      // Filter out "未提及" / "暂无" placeholders
      if (itemText.includes("未提及") || itemText.includes("暂无")) continue;
      currentSection.items.push(itemText);
      continue;
    }

    // Regular line goes to current section or preamble
    if (currentSection) {
      if (line.includes("未提及") || line.includes("暂无")) continue;
      currentSection.items.push(line);
    } else {
      preambleLines.push(line);
    }
  }

  // Filter out sections with zero items after filtering
  const filteredSections = sections.filter((s) => s.items.length > 0);

  return { preamble: preambleLines.join("\n"), sections: filteredSections };
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "PDF";
  if (["doc", "docx"].includes(ext)) return "DOC";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "IMG";
  return "FILE";
}

export default function ParseResultCard({ content, fileName }: ParseResultCardProps) {
  const { preamble, sections } = parseSections(content);
  // Only mark as error for actual parse failures, not AI mentioning "无法确定" in its analysis
  const isError =
    (content.includes("解析") && content.includes("失败")) ||
    content.includes("文件解析出错") ||
    content.startsWith("解析") && content.includes("失败");
  const fileTag = getFileIcon(fileName);

  return (
    <div className="max-w-[80%] animate-message-in">
      {/* Card */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card">
        {/* Header */}
        <div
          className={`flex items-center gap-3 px-4 py-3 ${
            isError
              ? "bg-red-50 border-b border-red-100"
              : "bg-gradient-to-r from-primary/5 to-emerald-50 border-b border-border"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isError ? "bg-red-100" : "bg-primary/10"
            }`}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">
              {isError ? "解析遇到问题" : "文档解析完成"}
            </div>
            <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                {fileTag}
              </span>
              {fileName}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          {/* Preamble text */}
          {preamble && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {renderInline(preamble)}
            </p>
          )}

          {/* Sections */}
          {sections.map((section, idx) => {
            const { icon: Icon, color } = getSectionMeta(section.title);
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${color}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {section.title}
                  </span>
                </div>
                <div className="ml-7 space-y-1">
                  {section.items.map((item, j) => (
                    <div
                      key={j}
                      className="text-sm text-foreground/80 leading-relaxed flex gap-1.5"
                    >
                      <span className="text-muted-foreground/40 shrink-0 mt-0.5">·</span>
                      <span>{renderInline(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* No sections - render as plain text with better formatting */}
          {sections.length === 0 && !preamble && (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {renderInline(content)}
            </p>
          )}
        </div>

        {/* Footer - success indicator */}
        {!isError && sections.length > 0 && (
          <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              已自动提取信息并保存到你的档案
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
