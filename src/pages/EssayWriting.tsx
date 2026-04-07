import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, Copy, Save, Plus, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useEssays } from "@/hooks/useEssays";
import { useToast } from "@/hooks/use-toast";

const essayTypes = [
  { key: "sop", label: "SOP 个人陈述" },
  { key: "ps", label: "PS 动机信" },
  { key: "cv", label: "CV 简历" },
  { key: "diversity", label: "多元化文书" },
  { key: "recommendation", label: "推荐信" },
];

export default function EssayWriting() {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get("app") || undefined;
  const essayType = searchParams.get("type") || "sop";

  const {
    essays,
    createEssay,
    saveEssay,
    isSaving,
    chatMessages,
    isStreaming,
    currentEssayId,
    loadConversation,
    sendMessage,
  } = useEssays();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [essayContent, setEssayContent] = useState("");
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const targetWords = 800;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const wordCount = essayContent
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // Load essay content when selected
  useEffect(() => {
    if (selectedEssayId) {
      const essay = essays.find((e) => e.id === selectedEssayId);
      if (essay?.content) {
        setEssayContent(essay.content);
      }
    }
  }, [selectedEssayId, essays]);

  const handleNewEssay = async () => {
    try {
      const typeName =
        essayTypes.find((t) => t.key === essayType)?.label || essayType;
      const essay = await createEssay({
        application_id: appId,
        essay_type: essayType,
        title: typeName,
      });
      setSelectedEssayId(essay.id);
      setEssayContent("");
    } catch (err) {
      toast({
        title: "创建失败",
        description: err instanceof Error ? err.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    if (!selectedEssayId) {
      toast({ title: "请先创建或选择一篇文书", variant: "destructive" });
      return;
    }
    const text = input;
    setInput("");
    sendMessage(text, selectedEssayId, appId, essayType, essayContent);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(essayContent);
    toast({ title: "已复制到剪贴板" });
  };

  const handleSave = () => {
    if (!selectedEssayId) return;
    saveEssay({
      id: selectedEssayId,
      content: essayContent,
      bumpVersion: true,
    });
    toast({ title: "文书已保存" });
  };

  // Extract essay content from AI response if it contains markdown code block
  const handleApplyFromChat = (content: string) => {
    // Look for markdown code blocks or long English text
    const codeBlockMatch = content.match(/```[\s\S]*?\n([\s\S]+?)```/);
    if (codeBlockMatch) {
      setEssayContent(codeBlockMatch[1].trim());
      toast({ title: "已应用到编辑器" });
      return;
    }
    // Look for "Dear" starting text (likely a full essay)
    const essayMatch = content.match(/(Dear[\s\S]{200,})/);
    if (essayMatch) {
      setEssayContent(essayMatch[1].trim());
      toast({ title: "已应用到编辑器" });
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left: Chat Panel (40%) */}
      <div className="w-[40%] flex flex-col border-r border-border">
        {/* Header with essay list */}
        <div className="px-4 py-3 border-b border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">AI 文书助手</h2>
            <Button size="sm" variant="outline" onClick={handleNewEssay}>
              <Plus className="w-3 h-3 mr-1" />
              新建文书
            </Button>
          </div>
          {essays.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {essays.slice(0, 5).map((e) => (
                <Button
                  key={e.id}
                  size="sm"
                  variant={selectedEssayId === e.id ? "default" : "ghost"}
                  className="text-xs shrink-0 h-7"
                  onClick={() => {
                    setSelectedEssayId(e.id);
                    loadConversation(e.id);
                  }}
                >
                  {e.title || e.essay_type}
                  {e.version && e.version > 1 && (
                    <span className="ml-1 opacity-60">v{e.version}</span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {chatMessages.length === 0 && !selectedEssayId && (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                点击「新建文书」开始 AI 辅助创作
              </p>
              <Button size="sm" onClick={handleNewEssay}>
                <Plus className="w-3 h-3 mr-1" />
                新建文书
              </Button>
            </div>
          )}

          {chatMessages.length === 0 && selectedEssayId && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                开始和 AI 对话，描述你想要的文书内容
              </p>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-card-foreground border border-border rounded-bl-md"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && msg.content.length > 200 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs mt-2 p-0 h-auto"
                    onClick={() => handleApplyFromChat(msg.content)}
                  >
                    应用到编辑器 →
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedEssayId
                  ? "描述你想要的文书内容..."
                  : "请先创建一篇文书"
              }
              className="flex-1"
              disabled={!selectedEssayId || isStreaming}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || !selectedEssayId || isStreaming}
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Editor Panel (60%) */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <h2 className="font-semibold text-sm">
            {selectedEssayId
              ? essays.find((e) => e.id === selectedEssayId)?.title || "文书编辑"
              : "文书编辑"}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!essayContent}
            >
              <Copy className="w-4 h-4 mr-1" />
              复制
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!selectedEssayId || !essayContent || isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              保存
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {selectedEssayId ? (
            <textarea
              value={essayContent}
              onChange={(e) => setEssayContent(e.target.value)}
              className="w-full h-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none"
              placeholder="在这里撰写或编辑你的文书...&#10;&#10;你可以：&#10;1. 直接在这里写&#10;2. 在左侧和 AI 对话，让 AI 帮你生成&#10;3. 点击 AI 回复中的「应用到编辑器」按钮"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              请先在左侧创建或选择一篇文书
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>
              字数：{wordCount} / {targetWords}
            </span>
            <span>
              {Math.min(Math.round((wordCount / targetWords) * 100), 100)}%
            </span>
          </div>
          <Progress
            value={Math.min((wordCount / targetWords) * 100, 100)}
            className="h-1.5"
          />
        </div>
      </div>
    </div>
  );
}
