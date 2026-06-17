import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AiProviderContext
vi.mock('../contexts/AiProviderContext', () => {
  const mockProvider = {
    streamChat: vi.fn(),
    streamImageAnalysis: vi.fn(),
    generateChat: vi.fn(),
  };
  return {
    getProvider: vi.fn(() => mockProvider),
    AiProviderContext: ({ children }: any) => children,
    useAiProvider: vi.fn(() => ({
      config: { type: 'ollama', ollamaUrl: 'http://localhost:11434', ollamaModel: 'test-model' },
      provider: mockProvider,
      updateConfig: vi.fn(),
    })),
    defaultConfig: { type: 'ollama', ollamaUrl: 'http://localhost:11434', ollamaModel: 'deepseek-r1:8b' },
  };
});

describe('aiClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('streamAIResponse', () => {
    it('throws for unsupported streaming task', async () => {
      const { streamAIResponse } = await import('../services/aiClient');
      await expect(streamAIResponse('unsupportedTask', {})).rejects.toThrow('Unsupported streaming task');
    });

    it('returns a ReadableStream for chat task', async () => {
      const mockProvider = (await import('../contexts/AiProviderContext')).getProvider();
      const mockStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('Hello World'));
          controller.close();
        },
      });
      mockProvider.streamChat.mockResolvedValue(mockStream);

      const { streamAIResponse } = await import('../services/aiClient');
      const stream = await streamAIResponse('chat', {
        messages: [{ role: 'user', text: 'hi' }],
      });

      expect(stream).toBeInstanceOf(ReadableStream);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
      expect(result).toBe('Hello World');
    });

    it('forwards complexGeneration task to provider streamChat', async () => {
      const mockProvider = (await import('../contexts/AiProviderContext')).getProvider();
      const { streamAIResponse } = await import('../services/aiClient');
      await streamAIResponse('complexGeneration', {
        messages: [{ role: 'user', text: 'test' }],
        systemInstruction: 'Be helpful',
        model: 'custom-model',
      });
      expect(mockProvider.streamChat).toHaveBeenCalledWith(
        [{ role: 'user', text: 'test' }],
        'Be helpful',
        'custom-model',
      );
    });

    it('forwards analyzeImage task to provider streamImageAnalysis', async () => {
      const mockProvider = (await import('../contexts/AiProviderContext')).getProvider();
      const { streamAIResponse } = await import('../services/aiClient');
      await streamAIResponse('analyzeImage', {
        prompt: 'What is this?',
        image: 'base64data',
        mimeType: 'image/jpeg',
        model: 'vision-model',
      });
      expect(mockProvider.streamImageAnalysis).toHaveBeenCalledWith({
        prompt: 'What is this?',
        image: 'base64data',
        mimeType: 'image/jpeg',
        model: 'vision-model',
      });
    });
  });

  describe('generateAIResponse', () => {
    it('throws for unsupported non-streaming task', async () => {
      const { generateAIResponse } = await import('../services/aiClient');
      await expect(generateAIResponse('unsupportedTask', {})).rejects.toThrow('Unsupported non-streaming task');
    });

    it('returns text from provider generateChat', async () => {
      const mockProvider = (await import('../contexts/AiProviderContext')).getProvider();
      mockProvider.generateChat.mockResolvedValue({ text: 'Response text' });

      const { generateAIResponse } = await import('../services/aiClient');
      const result = await generateAIResponse('chat', {
        messages: [{ role: 'user', text: 'hi' }],
        systemInstruction: 'Be concise',
      });
      expect(result.text).toBe('Response text');
    });
  });

  describe('speakText', () => {
    it('throws when speechSynthesis is not available', async () => {
      const original = (window as any).speechSynthesis;
      delete (window as any).speechSynthesis;
      const { speakText } = await import('../services/aiClient');
      expect(() => speakText('hello')).toThrow('Text-to-speech is not supported');
      (window as any).speechSynthesis = original;
    });
  });
});
