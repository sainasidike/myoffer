import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://evumyskbzakiatiagmpq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dW15c2tiemFraWF0aWFnbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDQ3MDMsImV4cCI6MjA5MTEyMDcwM30.w8P3scSa3AtA0TqryqYHW42ONRXLKcSdIUgYT4TH1G8";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

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
  const headers = await getAuthHeaders();

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers,
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
 * Call a Supabase Edge Function that returns custom SSE events (not OpenAI format).
 * Used by school-matching which emits {type, content/schools} events.
 */
export async function callEdgeFunctionSSE(
  functionName: string,
  body: Record<string, unknown>,
  onEvent: (event: Record<string, unknown>) => void,
  onError: (error: string) => void,
  onComplete: () => void,
): Promise<void> {
  const headers = await getAuthHeaders();

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errorData = await resp.json().catch(() => ({ error: "AI 服务暂时不可用" }));
    onError(errorData.error || `HTTP ${resp.status}`);
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
        onComplete();
        return;
      }

      try {
        const event = JSON.parse(jsonStr);
        onEvent(event);
      } catch {
        // skip unparseable lines
      }
    }
  }

  onComplete();
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
