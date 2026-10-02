import {
  AIProvider,
  MockProvider,
  DeepSeekProvider,
  OpenAIProvider,
  KimiProvider,
  TongyiProvider,
} from './provider';

let cachedProvider: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER || 'mock';
  const apiKey = process.env.AI_API_KEY || '';

  switch (providerName) {
    case 'deepseek':
      cachedProvider = new DeepSeekProvider(apiKey);
      break;
    case 'openai':
      cachedProvider = new OpenAIProvider(apiKey);
      break;
    case 'kimi':
      cachedProvider = new KimiProvider(apiKey);
      break;
    case 'tongyi':
      cachedProvider = new TongyiProvider(apiKey);
      break;
    case 'mock':
    default:
      cachedProvider = new MockProvider();
      break;
  }

  return cachedProvider;
}
