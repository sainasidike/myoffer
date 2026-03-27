import { useState, useRef, useEffect, useCallback } from "react";
import { Paperclip, FileText, ArrowRight, Loader as Loader2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroqChat } from "@/hooks/useGroqChat";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

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
  const { messages, isLoading, sendMessage, sendFiles, profileData, profileVersion } = useGroqChat();
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const filledCount = profileFields.filter((f) => profileData[f.key]).length;
  const completionPct = Math.round((filledCount / profileFields.length) * 100);
  const canStart = completionPct >= 40;

  const steps = [
    { label: "信息录入", status: completionPct < 100 ? "current" : "completed" },
    { label: "导入", status: completionPct >= 100 ? "current" : "upcoming" },
    { label: "选校", status: "upcoming" },
    { label: "申请", status: "upcoming" },
  ] as const;

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
    <div className="flex flex-col h-screen bg-background">
      <StepIndicator steps={steps} />
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div
          className="flex-1 flex flex-col relative bg-white"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Drag overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl">
              <div className="text-center">
                <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-primary text-sm">拖放文件到此处上传</p>
              </div>
            </div>
          )}

          {/* Chat Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-white">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">MyOffer AI 顾问</div>
              <div className="text-xs text-gray-500">正在收集你的申请信息</div>
            </div>
            {/* Mobile Progress Indicator */}
            <div className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
              <span className="text-xs font-semibold text-blue-600">{completionPct}%</span>
            </div>
            <div className="relative hidden lg:block">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
            </div>
          </div>

          {/* Messages */}
          <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-message-in ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-1">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none shadow-sm"
                      : "bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-semibold text-gray-700">我</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-1">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileUpload}
              />

              {/* Upload Materials Button */}
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                onClick={() => fileInputRef.current?.click()}
                title="上传文件 (支持 PDF、图片、Word 文档)"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="输入回复，或上传文件..."
                className="flex-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-blue-500 text-white hover:bg-blue-600 shrink-0 border-0"
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
        <div className="w-[320px] border-l border-gray-200 p-5 space-y-5 overflow-y-auto hidden lg:block bg-white">
          {/* Compact Progress Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">信息完整度</span>
              <span className="text-2xl font-bold text-blue-600">{completionPct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="mt-3 text-xs text-gray-500">
              已完成 {filledCount}/{profileFields.length} 项
            </div>
          </div>

          {/* Detailed Field List */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 shadow-sm">
            {profileFields.map((f) => (
              <div key={f.key} className="flex items-center gap-2.5 text-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${profileData[f.key] ? "bg-green-500" : "bg-gray-300"}`} />
                <span className={profileData[f.key] ? "text-gray-900" : "text-gray-400"}>
                  {f.label}
                </span>
                {profileData[f.key] && (
                  <span className="ml-auto text-xs text-blue-600 truncate max-w-[100px]">
                    {typeof profileData[f.key] === "object" ? JSON.stringify(profileData[f.key]) : profileData[f.key]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Uploaded materials */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">上传的材料</span>
              {uploadedFiles.length > 0 && (
                <span className="text-xs text-blue-600">{uploadedFiles.length} 个文件</span>
              )}
            </div>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedFiles.map((name, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center">
                <FileText className="w-7 h-7 mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">暂无上传文件</p>
                <p className="text-xs text-gray-400 mt-1">点击下方按钮或拖拽上传</p>
              </div>
            )}
          </div>

          {/* Action Gate Button */}
          <button
            disabled={!canStart}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              canStart
                ? "bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {canStart ? "开始申请之旅" : "完善信息后开启"}
          </button>
        </div>
      </div>
    </div>
  );
}
