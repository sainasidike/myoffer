import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://evumyskbzakiatiagmpq.supabase.co";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * Call a Supabase Edge Function with SSE streaming support.
 * Used by onboarding-chat, school-matching, and essay-generation.
 */
export async function callEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errorData = await resp.json().catch(() => ({ error: "AI 服务暂时不可用" }));
    callbacks.onError(errorData.error || `HTTP ${resp.status}`);
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        callbacks.onDone(fullText);
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          callbacks.onToken(content);
        }
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  callbacks.onDone(fullText);
}

/**
 * Extract <<<PROFILE_UPDATE:{...}>>> markers from AI response text.
 * Returns the extracted data and the cleaned text without markers.
 */
export function extractProfileUpdates(text: string): {
  cleanText: string;
  updates: Record<string, unknown>;
} {
  let updates: Record<string, unknown> = {};
  const matches = text.match(/<<<PROFILE_UPDATE:(.*?)>>>/g);

  if (matches) {
    for (const match of matches) {
      try {
        const json = match.replace("<<<PROFILE_UPDATE:", "").replace(">>>", "");
        const data = JSON.parse(json);
        updates = { ...updates, ...data };
      } catch { /* ignore parse errors */ }
    }
  }

  const cleanText = text.replace(/<<<PROFILE_UPDATE:.*?>>>/g, "").trim();
  return { cleanText, updates };
}
