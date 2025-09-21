import { OLLAMA_HOST, OLLAMA_MODEL } from '../config.js';

export async function ollamaChat(messages, { temperature = 0.2 } = {}) {
  const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error: ${response.status} ${text}`);
  }

  const payload = await response.json();
  return payload?.message?.content || payload?.message || '';
}
