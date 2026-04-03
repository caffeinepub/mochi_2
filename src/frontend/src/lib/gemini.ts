// Pollinations.ai — free, no API key needed
const POLLINATIONS_URL = "https://text.pollinations.ai/";

async function doRequest(
  systemPrompt: string,
  history: { role: "user" | "model"; text: string }[],
  userMessage: string,
  imageBase64?: string | null,
  timeoutMs = 25000,
  model = "openai-large",
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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

    const useVision = !!imageBase64;

    if (useVision && imageBase64) {
      const parts: ContentPart[] = [];
      if (userMessage) parts.push({ type: "text", text: userMessage });
      parts.push({ type: "image_url", image_url: { url: imageBase64 } });
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({ role: "user", content: userMessage });
    }

    const res = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 180,
        temperature: 0.95,
        seed: Math.floor(Math.random() * 999999),
      }),
    });

    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    const trimmed = text ? text.trim() : null;
    return trimmed && trimmed.length > 10 ? trimmed : null;
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
  // Try GPT-4o first
  const result = await doRequest(
    systemPrompt,
    history,
    userMessage,
    imageBase64,
    25000,
    "openai-large",
  );
  if (result && result.length > 10) return result;

  // Retry with smaller model, no history
  const result2 = await doRequest(
    systemPrompt,
    [],
    userMessage,
    imageBase64,
    20000,
    "openai",
  );
  if (result2 && result2.length > 10) return result2;

  // Final retry after short delay
  await new Promise((r) => setTimeout(r, 2000));
  const result3 = await doRequest(
    systemPrompt,
    [],
    userMessage,
    imageBase64,
    20000,
    "openai",
  );
  if (result3 && result3.length > 10) return result3;

  return null;
}
