const OPENROUTER_API_KEY =
  "sk-or-v1-9c6b8e3f2d1a4b7c0e5f8a2d9b6e3c7f1a4d8b2e5c9f3a6d0b7e4c1f8a2d5b9";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TEXT_MODEL = "meta-llama/llama-3.3-70b-instruct";
const VISION_MODEL = "google/gemini-flash-1.5";

async function doRequest(
  systemPrompt: string,
  history: { role: "user" | "model"; text: string }[],
  userMessage: string,
  imageBase64?: string | null,
  timeoutMs = 12000,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const useVision = !!imageBase64;
  const model = useVision ? VISION_MODEL : TEXT_MODEL;

  try {
    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } };
    type ChatMessage = { role: string; content: string | ContentPart[] };

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({
        role: h.role === "model" ? "assistant" : "user",
        content: h.text,
      })),
    ];

    // Build last user message — include image if provided
    if (useVision && imageBase64) {
      const parts: ContentPart[] = [];
      if (userMessage) parts.push({ type: "text", text: userMessage });
      parts.push({
        type: "image_url",
        image_url: { url: imageBase64 },
      });
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Mochi App",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 180,
        temperature: 1.0,
      }),
    });

    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return text ? text.trim() : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function callGemini(
  systemPrompt: string,
  history: { role: "user" | "model"; text: string }[],
  userMessage: string,
  imageBase64?: string | null,
): Promise<string | null> {
  // First attempt: with conversation history
  const result = await doRequest(
    systemPrompt,
    history,
    userMessage,
    imageBase64,
  );
  if (result) return result;

  // Second attempt: without history (lighter, faster)
  const result2 = await doRequest(
    systemPrompt,
    [],
    userMessage,
    imageBase64,
    8000,
  );
  if (result2) return result2;

  return null;
}
