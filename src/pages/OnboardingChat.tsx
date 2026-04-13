import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paperclip,
  FileText,
  ArrowRight,
  Loader2,
  Bot,
  CheckCircle2,
  Circle,
  Upload,
  X,
  RotateCcw,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOnboardingChat } from "@/hooks/useOnboardingChat";
import { useProfile } from "@/hooks/useProfile";
import ParseResultCard from "@/components/onboarding/ParseResultCard";
import { renderMarkdown } from "@/lib/renderMarkdown";

// Map profile DB fields to display labels, check functions, and prompt hints
const profileFieldChecks = [
  {
    label: "学校 / 学历",
    check: (p: Record<string, unknown>) => !!(p.school && p.current_education),
    prompt: "我还没填学校和学历信息，请帮我补充这部分。",
  },
  {
    label: "专业方向",
    check: (p: Record<string, unknown>) => !!p.major,
    prompt: "我想补充我的专业方向信息。",
  },
  {
    label: "GPA / 均分",
    check: (p: Record<string, unknown>) => p.gpa !== null && p.gpa !== undefined && p.gpa !== "",
    prompt: "我想补充我的GPA/均分信息。",
  },
  {
    label: "语言成绩",
    check: (p: Record<string, unknown>) => !!(p.language_type && p.language_score),
    prompt: "我想补充我的语言考试成绩（雅思/托福等）。",
  },
  {
    label: "GRE / GMAT",
    check: (p: Record<string, unknown>) => {
      const v = p.gre_gmat;
      if (!v) return false;
      if (typeof v === "object" && Object.keys(v as object).length === 0) return false;
      return true;
    },
    prompt: "我想补充我的GRE/GMAT成绩。如果没考可以跳过。",
  },
  {
    label: "实习 / 科研",
    check: (p: Record<string, unknown>) => {
      const intern = p.internship as unknown[] | null;
      const research = p.research as unknown[] | null;
      return (intern && intern.length > 0) || (research && research.length > 0);
    },
    prompt: "我想补充我的实习和科研经历。",
  },
  {
    label: "目标国家 / 预算",
    check: (p: Record<string, unknown>) => {
      const country = p.target_country as unknown[] | null;
      return (country && country.length > 0) || !!p.budget;
    },
    prompt: "我想补充我的目标留学国家和预算信息。",
  },
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";

export default function OnboardingChat() {
  const { messages, isStreaming, isParsing, isLoaded, parsedFileNames, sendMessage, uploadFiles, resetChat } =
    useOnboardingChat();
  const { profile, profileCompleteness } = useProfile();
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const completionPct = profileCompleteness();
  const isBusy = isStreaming || isParsing;
  const profileData = (profile || {}) as Record<string, unknown>;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const readyKeywords = ["开始吧", "没有其他信息", "没有补充", "差不多了", "可以选校", "选校", "开始选校", "没有了", "就这些"];
  const [showMatchingCTA, setShowMatchingCTA] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isBusy) return;
    const text = input;
    setInput("");
    sendMessage(text);
    // 检测"准备就绪"意图，显示选校入口
    if (completionPct >= 60 && readyKeywords.some((kw) => text.includes(kw))) {
      setShowMatchingCTA(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setPendingFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0 || isBusy) return;
    const files = [...pendingFiles];
    setPendingFiles([]);
    await uploadFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      return ["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"].includes(ext);
    });
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-white/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground tracking-tight">
                小M · AI 留学顾问
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {isParsing
                  ? "正在解析文档..."
                  : isStreaming
                  ? "正在输入..."
                  : !isLoaded
                  ? "连接中..."
                  : "随时为你解答"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    disabled={isBusy}
                    aria-label="重新开始对话"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>重新开始对话？</AlertDialogTitle>
                    <AlertDialogDescription>
                      这将清除所有聊天记录和已收集的档案信息，从头开始录入。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={resetChat}>确认重置</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-default">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isBusy ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {isBusy ? "处理中" : "在线"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBusy ? "AI 正在处理你的请求" : "AI 顾问已就绪，可以开始对话"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Mobile profile summary */}
          <div className="lg:hidden">
            <Collapsible open={mobileProfileOpen} onOpenChange={setMobileProfileOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full px-6 py-2 border-b border-border bg-card/50 text-sm hover:bg-accent/50 transition-colors">
                  <span className="text-muted-foreground">档案完整度: <span className="font-semibold text-primary">{completionPct}%</span></span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${mobileProfileOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 py-3 border-b border-border bg-card/30 space-y-2">
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completionPct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {profileFieldChecks.map((f) => {
                      const done = f.check(profileData);
                      return (
                        <div
                          key={f.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            !done ? "cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 transition-colors" : ""
                          }`}
                          onClick={() => {
                            if (!done && !isBusy) {
                              setMobileProfileOpen(false);
                              sendMessage(f.prompt);
                            }
                          }}
                        >
                          {done ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className={done ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {completionPct >= 60 && (
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      onClick={() => navigate("/schools?auto=1")}
                    >
                      <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                      开始 AI 智能选校
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
            style={{ background: "linear-gradient(180deg, hsl(220 20% 98%) 0%, hsl(220 14% 96%) 100%)" }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {!isLoaded && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {messages.map((msg) => {
              // Document parse result — special card
              if (msg.type === "parse-result" && msg.role === "ai") {
                return (
                  <div key={msg.id} className="flex gap-3 justify-start animate-message-in">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 ring-2 ring-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    {msg.content ? (
                      <ParseResultCard
                        content={msg.content}
                        fileName={msg.fileName || "文件"}
                      />
                    ) : (
                      <div className="max-w-[70%] rounded-2xl px-4 py-3 text-sm bg-card text-foreground border border-border rounded-bl-md shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>正在解析 {msg.fileName || "文件"}...</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Regular message
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-message-in ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 ring-2 ring-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-primary to-blue-600 text-white rounded-br-md whitespace-pre-wrap shadow-soft-sm"
                        : "bg-white text-foreground border border-border/60 rounded-bl-md shadow-soft-sm"
                    }`}
                  >
                    {msg.content ? (
                      msg.role === "ai" ? renderMarkdown(msg.content) : msg.content
                    ) : (
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-[11px] font-bold text-white">
                        我
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Inline school matching CTA */}
            {showMatchingCTA && !isStreaming && (
              <div className="flex justify-center animate-message-in py-2">
                <Button
                  className="gap-2 h-11 px-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-soft text-white"
                  onClick={() => navigate("/schools?auto=1")}
                >
                  <GraduationCap className="w-4 h-4" />
                  开始 AI 智能选校
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Pending files preview */}
          {pendingFiles.length > 0 && (
            <div className="px-6 py-3 border-t border-border bg-card/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  待上传文件（{pendingFiles.length}）
                </span>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isBusy}
                  className="h-7 text-xs"
                >
                  {isParsing ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3 mr-1" />
                  )}
                  开始解析
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, i) => (
                  <Badge
                    key={`${file.name}-${i}`}
                    variant="secondary"
                    className="text-xs flex items-center gap-1 pr-1"
                  >
                    <FileText className="w-3 h-3" />
                    {file.name}
                    <button
                      onClick={() => removePendingFile(i)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="px-6 py-4 border-t border-border/40 bg-white">
            <div className="flex items-center gap-2 max-w-4xl mx-auto bg-muted/50 rounded-2xl px-2 py-1.5 border border-border/50 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl h-9 w-9"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                title="上传文件（PDF、Word、图片）"
                aria-label="上传文件"
              >
                <Paperclip className="w-[18px] h-[18px]" />
              </Button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  isParsing
                    ? "文档解析中，请稍候..."
                    : "输入你的回复..."
                }
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60 h-9 px-1"
                disabled={isBusy}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isBusy}
                aria-label="发送消息"
                className="shrink-0 rounded-xl h-9 w-9 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 disabled:from-muted disabled:to-muted shadow-none"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[280px] border-l border-border/60 bg-white/60 backdrop-blur-sm p-5 space-y-5 overflow-y-auto hidden lg:block">
          {/* Profile completeness */}
          <div className="rounded-2xl border border-border/60 p-5 space-y-4 shadow-soft-sm bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-foreground">档案完整度</div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="url(#progressGradient)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${completionPct * 1.256} 125.6`} className="transition-all duration-700 ease-out" />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(221 83% 53%)" />
                      <stop offset="100%" stopColor="hsl(258 90% 66%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">{completionPct}%</span>
              </div>
            </div>
            <div className="space-y-2.5 pt-1">
              {profileFieldChecks.map((f) => {
                const done = f.check(profileData);
                return (
                  <div
                    key={f.label}
                    className={`flex items-center gap-2.5 text-sm ${
                      !done ? "cursor-pointer hover:bg-accent/50 -mx-1 px-1 py-0.5 rounded transition-colors" : ""
                    }`}
                    onClick={() => {
                      if (!done && !isBusy) {
                        sendMessage(f.prompt);
                      }
                    }}
                    title={!done ? `点击补充${f.label}` : undefined}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span
                      className={
                        done ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {f.label}
                    </span>
                    {!done && (
                      <span className="ml-auto text-xs text-primary opacity-0 group-hover:opacity-100">补充</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start school matching CTA */}
          {completionPct >= 60 && (
            <Button
              className="w-full"
              onClick={() => navigate("/schools?auto=1")}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              开始 AI 智能选校
            </Button>
          )}

          {/* Uploaded materials */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground">
              已解析材料
            </div>
            {parsedFileNames.length > 0 ? (
              <div className="space-y-2">
                {parsedFileNames.map((name, i) => (
                  <div
                    key={i}
                    className="text-xs text-foreground bg-muted rounded-lg px-3 py-2 truncate flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    {name}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">点击上传文件</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 PDF、Word、图片
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
