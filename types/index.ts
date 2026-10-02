export interface Exam {
  id: string;
  title: string;
  year: number;
  type: 'cet4' | 'cet6' | 'gaokao';
  description: string;
  questionCount: number;
  duration: number;
  isComplete: boolean;
  actualQuestionCount: number;
  region?: string;
  paperType?: string;
}

export type QuestionType = 'listening' | 'reading' | 'writing' | 'translation' | 'cloze';

export type QuestionSubtype =
  | 'short-dialogue'
  | 'long-dialogue'
  | 'passage'
  | 'lecture'
  | 'reading-choice'
  | 'reading-match'
  | 'reading-long'
  | 'cloze'
  | 'grammar'
  | 'translation'
  | 'writing'
  | 'application-writing'
  | 'continuation';

export interface Question {
  id: string;
  examId: string;
  section: string;
  type: QuestionType;
  subtype?: QuestionSubtype;
  number: number;
  content: string;
  passage?: string;
  options?: string[];
  answer: string;
  explanation: string;
  score: number;
  rawScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExamResult {
  examId: string;
  answers: Record<string, string>;
  score: number;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  wrongQuestions: string[];
  completedAt: string;
  sectionResults?: SectionResultData[];
  reportedScore?: number;
  isComplete?: boolean;
  examSource?: 'official' | 'custom' | 'practice';
}

export interface SectionResultData {
  sectionId: string;
  sectionName: string;
  rawScore: number;
  maxRawScore: number;
  reportedScoreEarned: number;
  reportedScoreTotal: number;
  correctCount: number;
  questionCount: number;
  answeredCount: number;
}

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  level: 'cet4' | 'cet6' | 'gaokao';
}

export interface DailyWords {
  date: string;
  words: Word[];
}
