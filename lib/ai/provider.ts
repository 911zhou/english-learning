export interface WrongQuestionAnalysis {
  id: string;
  wrongQuestionId: string;
  correctAnswer: string;
  analysis: string;
  wrongOptionsAnalysis?: Array<{ option: string; reason: string }>;
  knowledgePoints: string[];
  exampleSentences: string[];
  createdAt: string;
}

export interface WritingFeedback {
  score: number;
  evaluation: string;
  grammarErrors: Array<{
    original: string;
    suggestion: string;
    explanation: string;
  }>;
  vocabularySuggestions: Array<{
    original: string;
    better: string;
    reason: string;
  }>;
  structureSuggestions: string[];
  revisedVersion: string;
}

export interface TranslationAnalysis {
  translation: string;
  approach: string;
  advancedExpressions: Array<{
    original: string;
    better: string;
    reason: string;
  }>;
  keyVocabulary: Array<{
    word: string;
    phonetic: string;
    meaning: string;
  }>;
  grammarNotes: string[];
}

export interface AIProvider {
  analyzeQuestion(question: any, questionId: string): Promise<WrongQuestionAnalysis>;
  correctWriting(content: string): Promise<WritingFeedback>;
  translateText(content: string): Promise<TranslationAnalysis>;
}

export class MockProvider implements AIProvider {
  async analyzeQuestion(question: any, questionId: string): Promise<WrongQuestionAnalysis> {
    const { analyzeQuestion: legacyAnalyze } = await import('./legacy/wrong-question');
    return legacyAnalyze(question, questionId);
  }

  async correctWriting(content: string): Promise<WritingFeedback> {
    const { analyzeWriting: legacyAnalyze } = await import('./legacy/writing');
    return legacyAnalyze(content);
  }

  async translateText(content: string): Promise<TranslationAnalysis> {
    const { translateText: legacyTranslate } = await import('./legacy/translation');
    return legacyTranslate(content);
  }
}

export class DeepSeekProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async analyzeQuestion(_question: any, _questionId: string): Promise<WrongQuestionAnalysis> {
    throw new Error('DeepSeekProvider: not yet implemented');
  }

  async correctWriting(_content: string): Promise<WritingFeedback> {
    throw new Error('DeepSeekProvider: not yet implemented');
  }

  async translateText(_content: string): Promise<TranslationAnalysis> {
    throw new Error('DeepSeekProvider: not yet implemented');
  }
}

export class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async analyzeQuestion(_question: any, _questionId: string): Promise<WrongQuestionAnalysis> {
    throw new Error('OpenAIProvider: not yet implemented');
  }

  async correctWriting(_content: string): Promise<WritingFeedback> {
    throw new Error('OpenAIProvider: not yet implemented');
  }

  async translateText(_content: string): Promise<TranslationAnalysis> {
    throw new Error('OpenAIProvider: not yet implemented');
  }
}

export class KimiProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async analyzeQuestion(_question: any, _questionId: string): Promise<WrongQuestionAnalysis> {
    throw new Error('KimiProvider: not yet implemented');
  }

  async correctWriting(_content: string): Promise<WritingFeedback> {
    throw new Error('KimiProvider: not yet implemented');
  }

  async translateText(_content: string): Promise<TranslationAnalysis> {
    throw new Error('KimiProvider: not yet implemented');
  }
}

export class TongyiProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async analyzeQuestion(_question: any, _questionId: string): Promise<WrongQuestionAnalysis> {
    throw new Error('TongyiProvider: not yet implemented');
  }

  async correctWriting(_content: string): Promise<WritingFeedback> {
    throw new Error('TongyiProvider: not yet implemented');
  }

  async translateText(_content: string): Promise<TranslationAnalysis> {
    throw new Error('TongyiProvider: not yet implemented');
  }
}
