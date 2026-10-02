import { ExamResult } from '@/types';

const STORAGE_KEY = 'english-learning-results';
const WRONG_KEY = 'english-learning-wrong';

export function saveResult(result: ExamResult): void {
  const results = getResults();
  results.push(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export async function saveResultToServer(result: ExamResult): Promise<void> {
  try {
    await fetch('/api/user/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
  } catch (error) {
    console.error('Failed to save result to server:', error);
  }
}

export function getResults(): ExamResult[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getResultsFromServer(): Promise<ExamResult[]> {
  try {
    const res = await fetch('/api/user/results');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function saveWrongQuestion(examId: string, questionId: string, userAnswer: string): void {
  const wrong = getWrongQuestions();
  const existing = wrong.find(w => w.questionId === questionId);
  if (existing) {
    existing.count += 1;
    existing.lastAnswer = userAnswer;
    existing.lastAt = new Date().toISOString();
  } else {
    wrong.push({
      examId,
      questionId,
      userAnswer,
      count: 1,
      lastAt: new Date().toISOString(),
      lastAnswer: userAnswer,
    });
  }
  localStorage.setItem(WRONG_KEY, JSON.stringify(wrong));
}

export async function saveWrongQuestionToServer(
  examId: string,
  questionId: string,
  userAnswer: string
): Promise<void> {
  try {
    await fetch('/api/user/wrong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, questionId, userAnswer }),
    });
  } catch (error) {
    console.error('Failed to save wrong question to server:', error);
  }
}

export function getWrongQuestions(): WrongQuestion[] {
  const data = localStorage.getItem(WRONG_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getWrongQuestionsFromServer(): Promise<WrongQuestion[]> {
  try {
    const res = await fetch('/api/user/wrong');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function removeWrongQuestion(questionId: string): void {
  const wrong = getWrongQuestions().filter(w => w.questionId !== questionId);
  localStorage.setItem(WRONG_KEY, JSON.stringify(wrong));
}

export async function removeWrongQuestionFromServer(questionId: string): Promise<void> {
  try {
    await fetch(`/api/user/wrong?questionId=${encodeURIComponent(questionId)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to remove wrong question from server:', error);
  }
}

export function clearWrongQuestions(): void {
  localStorage.removeItem(WRONG_KEY);
}

export async function clearWrongQuestionsFromServer(): Promise<void> {
  try {
    await fetch('/api/user/wrong?all=true', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to clear wrong questions from server:', error);
  }
}

export interface WrongQuestion {
  examId: string;
  questionId: string;
  userAnswer: string;
  lastAnswer: string;
  count: number;
  lastAt: string;
}
