import { useState, useRef, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const SYSTEM_PROMPT = `你是MyOffer平台的专业留学申请顾问，正在帮助中国学生整理留学申请所需信息。

你的工作方式：
- 每次只提问1个问题，等用户回答后再继续
- 已经知道的信息不重复询问
- 语气亲切自然，像朋友一样交流，适当使用emoji
- 用户上传文件时，根据信息更新已知内容并继续追问缺失内容
- 当用户想跳过某个问题时，礼貌接受并继续下一个
- 收集完足够信息后，主动提出生成档案摘要
- 始终用中文回复

需要收集的信息字段（按优先级顺序追问）：
1. 学术背景：当前学历、目标学历、就读学校、专业方向、是否有意向跨专业申请、GPA/均分
2. 标准化成绩：语言成绩类型（托福/雅思）及分数、GRE/GMAT分数
3. 软实力经历：实习经历、科研经历（含论文发表）、竞赛获奖、创业经历、志愿服务、海外经历、其他课外经历
4. 申请偏好：目标国家/地区、留学预算、申请学年、奖学金要求、目标院校排名要求、特殊需求`;

const INITIAL_MESSAGE: ChatMessage = {
  id: "1",
  role: "ai",
  content: "你好！我是你的留学申请顾问，很高兴认识你。请问你目前就读于哪所学校？是本科在读还是已经毕业了？",
};

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);

  const getChat = useCallback(() => {
    if (chatRef.current) return chatRef.current;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("VITE_GEMINI_API_KEY is not set");
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    chatRef.current = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: INITIAL_MESSAGE.content }] },
      ],
    });

    return chatRef.current;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const chat = getChat();
      if (!chat) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "ai", content: "API Key 未配置，请设置 VITE_GEMINI_API_KEY 环境变量。" },
        ]);
        setIsLoading(false);
        return;
      }

      const result = await chat.sendMessageStream(text);

      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

      let fullText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        const captured = fullText;
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: captured } : m))
        );
      }
    } catch (err: any) {
      console.error("Gemini error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "ai",
          content: `抱歉，AI 服务暂时不可用：${err.message || "未知错误"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, getChat]);

  return { messages, isLoading, sendMessage };
}
