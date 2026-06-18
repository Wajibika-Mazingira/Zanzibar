export type AiProviderType = 'ollama' | 'openrouter' | 'qvac';

export interface AiProviderConfig {
  type: AiProviderType;
  ollamaUrl?: string;
  ollamaModel?: string;
  openRouterKey?: string;
  openRouterModel?: string;
  qvacModel?: string;
}

export interface AiMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  text: string;
}

export interface AiImagePart {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface AiTextPart {
  type: 'text';
  text: string;
}

export type AiPart = AiTextPart | AiImagePart;

export interface AiImagePayload {
  prompt: string;
  image: string;
  mimeType: string;
  model?: string;
}

export interface AiStreamOptions {
  numPredict?: number;
  temperature?: number;
}

export interface AiProvider {
  streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>>;

  streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>>;

  generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: any[] }>;
}

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.1:latest';

export class OllamaProvider implements AiProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: AiProviderConfig) {
    this.baseUrl = (config.ollamaUrl || DEFAULT_OLLAMA_URL).replace(/\/+$/, '');
    this.model = config.ollamaModel || DEFAULT_OLLAMA_MODEL;
  }

  private async createStream(
    body: Record<string, unknown>,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true, options: { num_predict: options?.numPredict ?? 256, temperature: options?.temperature ?? 0.3 } }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Ollama error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Ollama returned no response body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Process larger chunks for better performance
            buffer += decoder.decode(value, { stream: true });
            
            // Split into lines and process
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                if (json.done) { controller.close(); return; }
                if (json.message?.content) {
                  // Stream content directly without validation for maximum speed
                  controller.enqueue(encoder.encode(json.message.content));
                }
              } catch { /* skip malformed */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const ollamaMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      ollamaMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      ollamaMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }
    return this.createStream({
      model: model || this.model,
      messages: ollamaMessages,
    }, options);
  }

      async streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: payload.model || this.model,
        prompt: payload.prompt,
        images: [payload.image],
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Ollama image analysis error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Ollama returned no response body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const cleanContent = this.cleanContent.bind(this);

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n');
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                if (json.done) { controller.close(); return; }
                if (json.response) {
                  const cleaned = cleanContent(json.response);
                  if (cleaned) {
                    controller.enqueue(encoder.encode(cleaned));
                  }
                }
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: any[] }> {
    const ollamaMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      ollamaMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      ollamaMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || this.model, messages: ollamaMessages, stream: false }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Ollama error (${res.status}): ${err}`);
    }

    const json = await res.json();
    const cleanedText = cleanContent(json.message?.content || '');
    return { text: cleanedText };
  }
}

const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash-free';

export class OpenRouterProvider implements AiProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AiProviderConfig) {
    this.apiKey = config.openRouterKey || '';
    this.model = config.openRouterModel || DEFAULT_OPENROUTER_MODEL;
  }

  private async openRouterFetch(
    body: Record<string, unknown>,
  ): Promise<Response> {
    return fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Wajibika Mazingira',
      },
      body: JSON.stringify(body),
    });
  }

  async streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    _options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const orMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      orMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      orMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.openRouterFetch({
      model: model || this.model,
      messages: orMessages,
      stream: true,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`OpenRouter error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('OpenRouter returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>> {
    const content: any[] = [{ type: 'text', text: payload.prompt }];
    content.push({
      type: 'image_url',
      image_url: { url: `data:${payload.mimeType};base64,${payload.image}` },
    });

    const res = await this.openRouterFetch({
      model: payload.model || this.model,
      messages: [{ role: 'user', content }],
      stream: true,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`OpenRouter vision error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('OpenRouter returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: any[] }> {
    const orMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      orMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      orMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.openRouterFetch({
      model: model || this.model,
      messages: orMessages,
      stream: false,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`OpenRouter error (${res.status}): ${err}`);
    }

    const json = await res.json();
    const cleanedText = cleanContent(json.choices?.[0]?.message?.content || '');
    return { text: cleanedText };
  }
}

function cleanContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  let cleaned = content.trim();
  const commonCorrections: Record<string, string> = {
    'wierd': 'weird',
    'seperate': 'separate',
    'recieve': 'receive',
    'definately': 'definitely',
    'occured': 'occurred',
  };
  for (const [incorrect, correct] of Object.entries(commonCorrections)) {
    const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
    cleaned = cleaned.replace(regex, correct);
  }
  return cleaned;
}

const DEFAULT_QVAC_MODEL = 'qvac-model';

export class QvacProvider implements AiProvider {
  private model: string;

  constructor(config: AiProviderConfig) {
    this.model = config.qvacModel || DEFAULT_QVAC_MODEL;
  }

  private async qvacFetch(
    body: Record<string, unknown>,
  ): Promise<Response> {
    return fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Wajibika Mazingira',
      },
      body: JSON.stringify(body),
    }).catch(error => {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('QVAC connection failed. Please ensure QVAC is running locally on port 11434. Visit https://docs.qvac.tether.io for setup instructions.');
      }
      throw error;
    });
  }

  async streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    _options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const qvacMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      qvacMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      qvacMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.qvacFetch({
      model: model || this.model,
      messages: qvacMessages,
      stream: true,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`QVAC error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('QVAC returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>> {
    const content: any[] = [{ type: 'text', text: payload.prompt }];
    content.push({
      type: 'image_url',
      image_url: { url: `data:${payload.mimeType};base64,${payload.image}` },
    });

    const res = await this.qvacFetch({
      model: payload.model || this.model,
      messages: [{ role: 'user', content }],
      stream: true,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`QVAC vision error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('QVAC returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: any[] }> {
    const qvacMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      qvacMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      qvacMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.qvacFetch({
      model: model || this.model,
      messages: qvacMessages,
      stream: false,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`QVAC error (${res.status}): ${err}`);
    }

    const json = await res.json();
    const cleanedText = cleanContent(json.choices?.[0]?.message?.content || '');
    return { text: cleanedText };
  }
}

export function createProvider(config: AiProviderConfig): AiProvider {
  switch (config.type) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'qvac':
      return new QvacProvider(config);
    default:
      return new OllamaProvider(config);
  }
}
