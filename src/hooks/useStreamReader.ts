import * as React from 'react';

export function useStreamReader() {
  const abortRef = React.useRef<AbortController | null>(null);

  const readStream = React.useCallback(
    async (
      stream: ReadableStream<Uint8Array>,
      onChunk: (text: string) => void,
      onDone?: () => void,
    ): Promise<void> => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          if (abort.signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          onChunk(decoder.decode(value, { stream: true }));
        }
        onDone?.();
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        throw e;
      } finally {
        reader.releaseLock();
        if (abortRef.current === abort) abortRef.current = null;
      }
    },
    [],
  );

  const abort = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  React.useEffect(() => () => abort(), [abort]);

  return { readStream, abort };
}
