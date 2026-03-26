import { useState, useRef, useEffect } from "react";
import { Send, Copy, Save, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const docTypes = [
  { key: "PS", label: "PS动机信" },
  { key: "CV", label: "CV简历" },
  { key: "RL", label: "推荐信" },
];

export default function EssayWriting() {
  const [activeDoc, setActiveDoc] = useState("PS");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "ai",
      content:
        "你好！我是文书创作助手 ✍️\n\n请告诉我你要申请的学校和项目，我将结合你的背景信息帮你撰写文书。\n\n当前模式：PS动机信",
    },
  ]);
  const [input, setInput] = useState("");
  const [essayContent, setEssayContent] = useState(
    "# Personal Statement\n\nStart writing your personal statement here...\n\nYour essay content will appear in this editor. You can edit directly or use the AI assistant on the left to generate and refine content."
  );
  const [wordCount, setWordCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const targetWords = 800;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const words = essayContent
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    setWordCount(words);
  }, [essayContent]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiContent = generateEssayResponse(input, activeDoc);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: aiContent },
      ]);
      // Simulate updating essay
      if (input.includes("生成") || input.includes("写")) {
        setEssayContent(getSampleEssay(activeDoc));
      }
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(essayContent);
    toast.success("已复制到剪贴板");
  };

  const handleSave = () => {
    toast.success("文书已保存");
  };

  const handleSaveToChecklist = () => {
    toast.success("已保存到申请材料清单");
  };

  return (
    <div className="flex h-screen">
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="px-4 py-3 border-b border-border bg-card">
          <Tabs value={activeDoc} onValueChange={setActiveDoc}>
            <TabsList>
              {docTypes.map((dt) => (
                <TabsTrigger key={dt.key} value={dt.key}>
                  {dt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex animate-message-in ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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

        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="描述你想要的文书内容..."
              className="flex-1"
            />
            <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <h2 className="font-semibold text-sm">
            {docTypes.find((d) => d.key === activeDoc)?.label}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1" />复制
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />保存
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSaveToChecklist}>
              <CheckSquare className="w-4 h-4 mr-1" />存入清单
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <textarea
            value={essayContent}
            onChange={(e) => setEssayContent(e.target.value)}
            className="w-full h-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none"
            placeholder="在这里撰写或编辑你的文书..."
          />
        </div>

        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>字数：{wordCount} / {targetWords}</span>
            <span>{Math.min(Math.round((wordCount / targetWords) * 100), 100)}%</span>
          </div>
          <Progress value={Math.min((wordCount / targetWords) * 100, 100)} className="h-1.5" />
        </div>
      </div>
    </div>
  );
}

function generateEssayResponse(input: string, docType: string): string {
  if (input.includes("生成") || input.includes("写"))
    return `好的，我已根据你的背景信息生成了${docType === "PS" ? "动机信" : docType === "CV" ? "简历" : "推荐信"}初稿 📝\n\n请在右侧编辑器中查看和修改。如果需要调整，请告诉我具体修改方向。`;
  if (input.includes("修改") || input.includes("改"))
    return "好的，我已根据你的反馈更新了文书内容。请查看右侧编辑器中的修改。";
  return "收到！我会结合你的信息进行优化。你可以尝试说"帮我生成初稿"来开始。";
}

function getSampleEssay(docType: string): string {
  if (docType === "PS")
    return `Dear Admissions Committee,

I am writing to express my strong interest in the MSc Data Science program at your esteemed university. With a solid foundation in computer science and a passion for leveraging data to drive meaningful insights, I am confident that this program will be instrumental in achieving my academic and professional goals.

During my undergraduate studies at [University], I developed a strong proficiency in programming, statistics, and machine learning. My final year project, which focused on natural language processing for sentiment analysis of Chinese social media, received the highest distinction and was presented at a regional conference.

Beyond academics, I have gained practical experience through internships at leading technology companies, where I applied data science methodologies to solve real-world business problems. These experiences solidified my understanding of the industry's demands and reinforced my desire to pursue advanced studies in this field.

I am particularly drawn to your program's emphasis on interdisciplinary approaches and its strong industry connections. I believe the combination of rigorous coursework and research opportunities will provide me with the skills necessary to contribute to the advancement of data science.

Thank you for considering my application. I look forward to the opportunity to contribute to your academic community.

Sincerely,
[Your Name]`;
  if (docType === "CV")
    return `CURRICULUM VITAE

EDUCATION
[University Name] — Bachelor of Science in Computer Science
GPA: 3.8/4.0 | 2020 - 2024

EXPERIENCE
Data Analyst Intern — [Company Name]
- Analyzed user behavior data using Python and SQL
- Built predictive models improving retention by 15%

Research Assistant — [Lab Name]
- Conducted NLP research on sentiment analysis
- Published paper at regional conference

SKILLS
Programming: Python, R, SQL, Java
Tools: TensorFlow, PyTorch, Tableau
Languages: Chinese (native), English (IELTS 7.5)`;
  return `推荐信

致招生委员会：

我很荣幸为[学生姓名]撰写这封推荐信。作为其在[课程名称]的指导教授，我对该学生的学术能力和研究潜力有着深入的了解。

[学生姓名]在课堂上展现出了优秀的分析能力和创造性思维...`;
}
