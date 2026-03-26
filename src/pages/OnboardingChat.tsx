import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, Upload, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const steps = ["注册", "录入", "选校", "申请"];
const profileFields = [
  { key: "school", label: "学校/学历", done: false },
  { key: "major", label: "专业", done: false },
  { key: "gpa", label: "GPA", done: false },
  { key: "lang", label: "语言成绩", done: false },
  { key: "gre", label: "GRE", done: false },
  { key: "intern", label: "实习科研", done: false },
  { key: "country", label: "目标国家", done: false },
];

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content:
      "你好！我是MyOffer智能留学助手 🎓\n\n我将帮助你完成留学申请的信息录入。请先告诉我你目前的学校和学历情况吧？比如：\n\n- 就读/毕业院校\n- 学历层次（本科/硕士）\n- 毕业年份",
  },
];

export default function OnboardingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [fields, setFields] = useState(profileFields);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completionPct = Math.round(
    (fields.filter((f) => f.done).length / fields.length) * 100
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: getSimulatedResponse(input),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Simulate field completion
      setFields((prev) => {
        const next = [...prev];
        const incomplete = next.findIndex((f) => !f.done);
        if (incomplete >= 0) next[incomplete] = { ...next[incomplete], done: true };
        return next;
      });
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...names]);

    // Simulate AI parsing
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "ai",
        content: `📄 已收到文件：${names.join(", ")}\n\n正在解析文件内容...我已从文件中提取到了一些信息，请确认是否正确。`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0 px-8 py-4 border-b border-border bg-card">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  i <= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm ${
                  i <= 1 ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-3 ${
                  i < 1 ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex animate-message-in ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground border border-border rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-6 py-4 border-t border-border bg-card">
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
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
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="输入你的信息..."
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[260px] border-l border-border bg-card p-4 space-y-4 overflow-y-auto hidden lg:block">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">档案完整度</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">完成进度</span>
                <span className="font-semibold text-primary">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="h-2" />
              <div className="space-y-2 mt-3">
                {fields.map((f) => (
                  <div key={f.key} className="flex items-center gap-2 text-sm">
                    {f.done ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={f.done ? "text-foreground" : "text-muted-foreground"}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">上传材料</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  拖放文件或点击上传
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 PDF / Word / 图片
                </p>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-1">
                  {uploadedFiles.map((name, i) => (
                    <div
                      key={i}
                      className="text-xs text-foreground bg-muted rounded px-2 py-1 truncate"
                    >
                      📎 {name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getSimulatedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("gpa") || lower.includes("绩点"))
    return "好的，已记录你的GPA信息 ✅\n\n接下来请告诉我你的语言成绩情况？比如雅思/托福分数？";
  if (lower.includes("雅思") || lower.includes("托福") || lower.includes("ielts"))
    return "语言成绩已记录 ✅\n\n请问你有GRE/GMAT成绩吗？如果没有可以直接说「没有」。";
  if (lower.includes("实习") || lower.includes("科研"))
    return "实习/科研经历已记录 ✅\n\n最后，请告诉我你的目标留学国家和预算范围？";
  return "好的，信息已记录 ✅\n\n请继续补充其他信息，或上传相关材料文件，我会自动解析。";
}
