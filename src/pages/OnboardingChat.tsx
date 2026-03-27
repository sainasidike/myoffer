import { useState, useRef, useEffect, useCallback } from "react";
import { Paperclip, FileText, ArrowRight, Loader2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeminiChat } from "@/hooks/useGeminiChat";
import { RingProgress } from "@/components/cyber/RingProgress";
import { HexStatus } from "@/components/cyber/HexStatus";

const profileFields = [
  { key: "targetDegree", label: "学历 / 目标学历" },
  { key: "school", label: "就读学校" },
  { key: "major", label: "专业方向" },
  { key: "gpa", label: "GPA / 均分" },
  { key: "languageScore", label: "语言成绩" },
  { key: "greGmat", label: "GRE / GMAT" },
  { key: "internship", label: "实习经历" },
  { key: "research", label: "科研经历" },
  { key: "targetCountry", label: "目标国家" },
  { key: "budget", label: "留学预算" },
];

export default function OnboardingChat() {
  const { messages, isLoading, sendMessage, sendFiles, profileData, profileVersion } = useGeminiChat();
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const filledCount = profileFields.filter((f) => profileData[f.key]).length;
  const completionPct = Math.round((filledCount / profileFields.length) * 100);
  const canStart = completionPct >= 40;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const names = fileArray.map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);
    sendFiles(fileArray);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const names = fileArray.map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);
    sendFiles(fileArray);
  }, [sendFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div
          className="flex-1 flex flex-col relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Drag overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl">
              <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-primary font-mono text-sm">拖放文件到此处上传</p>
              </div>
            </div>
          )}

          {/* Chat Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border glass">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground font-mono">MyOffer AI 顾问</div>
              <div className="text-xs text-muted-foreground">正在收集你的申请信息</div>
            </div>
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success cyber-ping" />
            </div>
          </div>

          {/* Messages */}
          <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-message-in ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                    <Cpu className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary/20 text-foreground border border-primary/20 rounded-br-md"
                      : "glass-card ai-glow-bar pl-5 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-semibold text-primary font-mono">我</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div className="glass-card ai-glow-bar rounded-2xl rounded-bl-md px-5 py-3 laser-scan">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}

            {/* Upload hint zone */}
            {messages.some((m) => m.id === "upload-hint") && !messages.some((m) => m.role === "user" && messages.indexOf(m) > messages.findIndex((x) => x.id === "upload-hint")) && (
              <div
                className="glass-card rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer hover:border-primary/40 transition-all duration-300 laser-scan"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-mono">
                  支持拖入 PDF、图片、Word 文档，AI 自动解析
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-6 py-4 border-t border-border glass">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="输入回复，或上传文件..."
                className="flex-1 bg-secondary/50 border-border focus:border-primary/50 focus:ring-primary/20"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[280px] border-l border-border p-5 space-y-5 overflow-y-auto hidden lg:block">
          {/* Ring progress */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-foreground font-mono">档案完整度</div>
            <div className="flex justify-center py-2">
              <RingProgress percentage={completionPct} />
            </div>
            <div className="space-y-2.5 pt-1">
              {profileFields.map((f) => (
                <div key={f.key} className="flex items-center gap-2.5 text-sm">
                  <HexStatus status={profileData[f.key] ? "filled" : "empty"} />
                  <span className={profileData[f.key] ? "text-foreground" : "text-muted-foreground"}>
                    {f.label}
                  </span>
                  {profileData[f.key] && (
                    <span className="ml-auto text-xs text-primary font-mono truncate max-w-[80px]">
                      {typeof profileData[f.key] === "object" ? JSON.stringify(profileData[f.key]) : profileData[f.key]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded materials */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground font-mono">上传的材料</div>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map((name, i) => (
                  <div
                    key={i}
                    className="text-xs text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2 truncate font-mono"
                  >
                    📎 {name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">暂无上传文件</p>
                <p className="text-xs text-muted-foreground mt-1">点击附件按钮或拖拽上传</p>
              </div>
            )}
          </div>

          {/* Action Gate Button */}
          <button
            disabled={!canStart}
            className={`w-full py-3 rounded-xl text-sm font-semibold font-mono transition-all duration-500 ${
              canStart
                ? "gradient-border-flow text-primary-foreground shadow-[0_0_20px_rgba(102,252,241,0.3)] hover:shadow-[0_0_30px_rgba(102,252,241,0.5)]"
                : "bg-secondary/30 text-muted-foreground border border-border cursor-not-allowed opacity-50"
            }`}
          >
            {canStart ? "🚀 开始申请之旅" : "🔒 完善信息后开启"}
          </button>
        </div>
      </div>
    </div>
  );
}
