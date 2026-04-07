import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOnboardingChat } from "@/hooks/useOnboardingChat";
import { useProfile } from "@/hooks/useProfile";

const profileFields = [
  { key: "school", label: "学校 / 学历" },
  { key: "major", label: "专业方向" },
  { key: "gpa", label: "GPA / 均分" },
  { key: "lang", label: "语言成绩" },
  { key: "gre", label: "GRE / GMAT" },
  { key: "intern", label: "实习 / 科研" },
  { key: "country", label: "目标国家 / 预算" },
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";

export default function OnboardingChat() {
  const { messages, isStreaming, isParsing, sendMessage, uploadFiles } =
    useOnboardingChat();
  const { profileCompleteness } = useProfile();
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completionPct = profileCompleteness();
  const isBusy = isStreaming || isParsing;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isBusy) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setPendingFiles((prev) => [...prev, ...newFiles]);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0 || isBusy) return;
    const files = [...pendingFiles];
    setUploadedFileNames((prev) => [...prev, ...files.map((f) => f.name)]);
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
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">
                MyOffer AI 顾问
              </div>
              <div className="text-xs text-muted-foreground">
                {isParsing
                  ? "正在解析文档..."
                  : isStreaming
                  ? "正在回复..."
                  : "正在收集你的申请信息"}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  isBusy ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {isBusy ? "处理中" : "在线"}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-muted/30"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-message-in ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-foreground border border-border rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.content || (
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
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-semibold text-primary">
                      我
                    </span>
                  </div>
                )}
              </div>
            ))}

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
          <div className="px-6 py-4 border-t border-border bg-card">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
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
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                title="上传文件（PDF、Word、图片）"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  isParsing
                    ? "文档解析中，请稍候..."
                    : "输入回复，或点击左侧按钮上传文件..."
                }
                className="flex-1"
                disabled={isBusy}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isBusy}
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
        <div className="w-[280px] border-l border-border bg-card p-5 space-y-5 overflow-y-auto hidden lg:block">
          {/* Profile completeness */}
          <div className="rounded-xl border border-border p-4 space-y-4">
            <div className="text-sm font-semibold text-foreground">
              档案完整度
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">已收集信息</span>
              <span className="text-lg font-bold text-primary">
                {completionPct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="space-y-2.5 pt-1">
              {profileFields.map((f) => {
                const done = completionPct > 0;
                return (
                  <div
                    key={f.key}
                    className="flex items-center gap-2.5 text-sm"
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uploaded materials */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground">
              已解析材料
            </div>
            {uploadedFileNames.length > 0 ? (
              <div className="space-y-2">
                {uploadedFileNames.map((name, i) => (
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
