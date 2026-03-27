import { useState, useRef, useEffect } from "react";
import { Paperclip, Plus, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeminiChat } from "@/hooks/useGeminiChat";

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
  const { messages, isLoading, sendMessage, profileData } = useGeminiChat();
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filledCount = profileFields.filter((f) => profileData[f.key]).length;
  const completionPct = Math.round((filledCount / profileFields.length) * 100);

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
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);
    sendMessage(`我上传了以下文件：${names.join(", ")}，请帮我解析其中的信息。`);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">MyOffer AI 顾问</div>
              <div className="text-xs text-muted-foreground">正在收集你的申请信息</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-background">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-message-in ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <Plus className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-semibold text-primary">我</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Inline file upload hint */}
            <div
              className="border-2 border-dashed border-primary/30 rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">
                支持拖入 PDF、图片、Word 文档，AI 自动解析
              </span>
            </div>

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-6 py-4 border-t border-border bg-card">
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
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="输入回复，或上传文件..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
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
        <div className="w-[280px] border-l border-border bg-card p-5 space-y-5 overflow-y-auto hidden lg:block">
          {/* Profile completeness */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="text-sm font-semibold text-foreground">档案完整度</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">已收集信息</span>
              <span className="text-lg font-bold text-primary">{completionPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="space-y-2.5 pt-1">
              {profileFields.map((f) => (
                <div key={f.key} className="flex items-center gap-2.5 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="text-muted-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded materials */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground">上传的材料</div>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map((name, i) => (
                  <div
                    key={i}
                    className="text-xs text-foreground bg-muted rounded-lg px-3 py-2 truncate"
                  >
                    📎 {name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">暂无上传文件</p>
                <p className="text-xs text-muted-foreground mt-1">点击对话框附件按钮上传</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
