import { Message, Product } from '../types';
import { getSessionId } from '../utils/session';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE}/api/chat/stream`;

export async function sendMessageStream(
  userMessage: string,
  history: Message[],
  onToken: (token: string) => void,
  onDone: (content: string, productCards: Product[]) => void,
  onError: (error: string) => void
) {
  const messages = [...history, { id: Date.now().toString(), role: 'user' as const, content: userMessage, timestamp: new Date() }];
  const payload = {
    messages: messages.map(({ role, content }) => ({ role, content })),
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': getSessionId()
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let fullContent = '';
    let productCards: Product[] = [];

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event.trim()) continue;
        const lines = event.split('\n');
        let eventType = '';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          if (line.startsWith('data: ')) data = line.slice(6).trim();
        }
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          if (eventType === 'token') {
            const token = parsed.token || '';
            fullContent += token;
            onToken(token);
          } else if (eventType === 'done') {
            fullContent = parsed.content || fullContent;
            productCards = parsed.productCards || [];
            onDone(fullContent, productCards);
          } else if (eventType === 'error') {
            onError(parsed.error || 'Unknown error');
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', data);
        }
      }
    }
  } catch (error: any) {
    onError(error.message || 'Network error');
  }
}

// Legacy non-streaming (for fallback)
export async function sendMessage(userMessage: string, history: Message[]): Promise<Message> {
  return new Promise((resolve, reject) => {
    let fullContent = '';
    let productCards: Product[] = [];
    sendMessageStream(
      userMessage,
      history,
      (token) => { fullContent += token; },
      (content, cards) => {
        productCards = cards;
        resolve({
          id: Date.now().toString(),
          role: 'assistant',
          content: content,
          productCards: productCards,
          timestamp: new Date(),
        });
      },
      (err) => reject(new Error(err))
    );
  });
}