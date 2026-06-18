import { getProvider } from '../contexts/AiProviderContext';
import type { AiMessage, AiStreamOptions } from './aiProvider';

export type ChatMode = 'fast' | 'smart' | 'grounded' | 'maps';

const MODE_STREAM_OPTIONS: Record<ChatMode, AiStreamOptions> = {
  fast: { numPredict: 128, temperature: 0.5 },
  smart: { numPredict: 256, temperature: 0.3 },
  grounded: { numPredict: 256, temperature: 0.3 },
  maps: { numPredict: 256, temperature: 0.3 },
};

export const streamAIResponse = async (
  task: string,
  payload: Record<string, any>,
): Promise<ReadableStream<Uint8Array>> => {
  const provider = getProvider();

  switch (task) {
    case 'chat':
    case 'complexGeneration': {
      const { messages, model, systemInstruction, mode } = payload;
      const options = mode ? MODE_STREAM_OPTIONS[mode as ChatMode] : undefined;
      return provider.streamChat(
        messages as AiMessage[],
        systemInstruction as string | undefined,
        model as string | undefined,
        options,
      );
    }
    case 'analyzeImage': {
      const { prompt, image, mimeType, model } = payload;
      return provider.streamImageAnalysis({ prompt, image, mimeType, model });
    }
    default:
      throw new Error(`Unsupported streaming task: ${task}`);
  }
};

export const generateAIResponse = async (
  task: string,
  payload: Record<string, any>,
): Promise<{ text: string; sources?: any[] }> => {
  const provider = getProvider();

  switch (task) {
    case 'groundedSearch':
    case 'groundedMaps':
    case 'chat': {
      const { messages, model, systemInstruction } = payload;
      return provider.generateChat(
        messages as AiMessage[],
        systemInstruction as string | undefined,
        model as string | undefined,
      );
    }
    default:
      throw new Error(`Unsupported non-streaming task: ${task}`);
  }
};

export const speakText = (text: string): void => {
  if (!('speechSynthesis' in window)) {
    throw new Error('Text-to-speech is not supported in this browser.');
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};
