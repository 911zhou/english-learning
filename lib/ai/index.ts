import { getProvider } from './factory';

export type {
  AIProvider,
  WrongQuestionAnalysis,
  WritingFeedback,
  TranslationAnalysis,
} from './provider';

export async function analyzeQuestion(question: any, questionId?: string) {
  const provider = getProvider();
  return provider.analyzeQuestion(question, questionId || question.id);
}

export async function correctWriting(content: string) {
  const provider = getProvider();
  return provider.correctWriting(content);
}

export { correctWriting as analyzeWriting };

export async function translateText(content: string) {
  const provider = getProvider();
  return provider.translateText(content);
}
