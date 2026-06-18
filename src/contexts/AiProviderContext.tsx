import * as React from 'react';
import {
  type AiProvider,
  type AiProviderConfig,
  createProvider,
} from '../services/aiProvider';

interface AiProviderState {
  config: AiProviderConfig;
  provider: AiProvider;
  updateConfig: (config: AiProviderConfig) => void;
}

let _globalProvider: AiProvider | null = null;

const defaultConfig: AiProviderConfig = {
  type: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.1:latest',
  openRouterKey: '',
  openRouterModel: 'deepseek/deepseek-v4-flash-free',
  qvacModel: 'qvac-model',
};

const AiProviderCtx = React.createContext<AiProviderState | undefined>(undefined);

const STORAGE_KEY = 'aiProviderConfig';

function loadConfig(): AiProviderConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultConfig, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return defaultConfig;
}

export const AiProviderContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = React.useState<AiProviderConfig>(loadConfig);

  const provider = React.useMemo(() => {
    const p = createProvider(config);
    _globalProvider = p;
    return p;
  }, [config]);

  const updateConfig = React.useCallback((newConfig: AiProviderConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  React.useEffect(() => {
    return () => { _globalProvider = null; };
  }, []);

  return (
    <AiProviderCtx.Provider value={{ config, provider, updateConfig }}>
      {children}
    </AiProviderCtx.Provider>
  );
};

export function getProvider(): AiProvider {
  if (_globalProvider) return _globalProvider;
  const p = createProvider(loadConfig());
  _globalProvider = p;
  return p;
}

export function useAiProvider(): AiProviderState {
  const ctx = React.useContext(AiProviderCtx);
  if (!ctx) throw new Error('useAiProvider must be used within AiProviderContext');
  return ctx;
}

export { defaultConfig };
