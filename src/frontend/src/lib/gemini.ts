const GEMINI_API_KEY = "AIzaSyC4YYpHUkxnXFhFnCMrRpUv0yP4RZzObhA";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function doRequest(
  systemPrompt: string,
  history: { role: "user" | "model"; text: string }[],
  userMessage: string,
  timeoutMs = 8000,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const contents = [
      ...history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 250, temperature: 0.9 },
      }),
    });

    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
): Promise<string | null> {
  // First attempt: with conversation history
  const result = await doRequest(systemPrompt, history, userMessage);
  if (result) return result;

  // Second attempt: without history (lighter, faster)
  const result2 = await doRequest(systemPrompt, [], userMessage, 6000);
  if (result2) return result2;

  return null;
}
