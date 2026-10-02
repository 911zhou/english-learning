import { Question } from '@/types';
import { getExamStructure, ExamSection } from './exam-config';

export interface SectionResult {
  sectionId: string;
  sectionName: string;
  rawScore: number;
  maxRawScore: number;
  reportedScoreTotal: number;
  reportedScoreEarned: number;
  correctCount: number;
  questionCount: number;
  answeredCount: number;
  isSubjective: boolean;
  hasQuestions: boolean;
}

export interface ScoringResult {
  totalRawScore: number;
  maxRawScore: number;
  reportedScore: number;
  totalReportedScore: number;
  correctCount: number;
  totalQuestions: number;
  answeredCount: number;
  accuracy: number;
  isComplete: boolean;
  sections: SectionResult[];
}

function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function calculateExamScore(
  examId: string,
  questions: Question[],
  answers: Record<string, string>
): ScoringResult {
  const structure = getExamStructure(examId);

  if (!structure) {
    return calculateLegacyScore(questions, answers);
  }

  const sections: SectionResult[] = structure.sections.map(section => {
    const sectionQuestions = questions.filter(q => {
      const qSectionId = getQuestionSectionId(q, structure.examType);
      return qSectionId === section.id;
    });

    const maxRawScore = sectionQuestions.reduce(
      (sum, q) => sum + (q.rawScore ?? (section.rawScorePerQuestion || 0)),
      0
    );

    let rawScore = 0;
    let correctCount = 0;
    let answeredCount = 0;

    for (const q of sectionQuestions) {
      const userAnswer = answers[q.id];
      if (userAnswer !== undefined && userAnswer !== '') {
        answeredCount++;
        if (userAnswer === q.answer) {
          correctCount++;
          rawScore += q.rawScore ?? section.rawScorePerQuestion;
        }
      }
    }

    const reportedScoreEarned =
      maxRawScore > 0
        ? roundTo1((rawScore / maxRawScore) * section.reportedScoreTotal)
        : 0;

    return {
      sectionId: section.id,
      sectionName: section.name,
      rawScore,
      maxRawScore,
      reportedScoreTotal: section.reportedScoreTotal,
      reportedScoreEarned,
      correctCount,
      questionCount: section.questionCount,
      answeredCount,
      isSubjective: section.isSubjective,
      hasQuestions: sectionQuestions.length > 0,
    };
  });

  const totalRawScore = sections.reduce((sum, s) => sum + s.rawScore, 0);
  const maxRawScore = sections.reduce((sum, s) => sum + s.maxRawScore, 0);
  const totalReportedEarned = sections.reduce(
    (sum, s) => sum + s.reportedScoreEarned,
    0
  );

  const totalQuestions = structure.totalQuestions;
  const totalCorrect = sections.reduce((sum, s) => sum + s.correctCount, 0);
  const totalAnswered = sections.reduce((sum, s) => sum + s.answeredCount, 0);

  const reportedScore = roundTo1(totalReportedEarned);
  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return {
    totalRawScore,
    maxRawScore,
    reportedScore,
    totalReportedScore: structure.totalReportedScore,
    correctCount: totalCorrect,
    totalQuestions,
    answeredCount: totalAnswered,
    accuracy,
    isComplete: maxRawScore >= structure.totalRawScore,
    sections,
  };
}

function getQuestionSectionId(
  q: Question,
  examType: 'cet4' | 'cet6' | 'gaokao'
): string {
  if (examType === 'gaokao') {
    if (q.type === 'writing') {
      if (q.subtype === 'application-writing') return 'gaokao-application-writing';
      if (q.subtype === 'continuation') return 'gaokao-continuation';
      return 'gaokao-application-writing';
    }
    const subtypeMap: Record<string, string> = {
      'short-dialogue': 'gaokao-listening',
      'long-dialogue': 'gaokao-listening',
      passage: 'gaokao-listening',
      'reading-choice': 'gaokao-reading-choice',
      'reading-match': 'gaokao-reading-match',
      cloze: 'gaokao-cloze',
      grammar: 'gaokao-grammar',
    };
    if (q.subtype && subtypeMap[q.subtype]) return subtypeMap[q.subtype];
    const sectionMap: Record<string, string> = {
      '听力': 'gaokao-listening',
      '阅读理解': 'gaokao-reading-choice',
      '七选五': 'gaokao-reading-match',
      '完形填空': 'gaokao-cloze',
      '语法填空': 'gaokao-grammar',
      '写作': 'gaokao-application-writing',
    };
    if (sectionMap[q.section]) return sectionMap[q.section];
    return '';
  }

  if (q.type === 'writing') return examType === 'cet4' ? 'cet4-writing' : 'cet6-writing';
  if (q.type === 'translation')
    return examType === 'cet4' ? 'cet4-translation' : 'cet6-translation';

  const subtypeMap: Record<string, Record<string, string>> = {
    cet4: {
      'short-dialogue': 'cet4-listening-news',
      'long-dialogue': 'cet4-listening-long',
      passage: 'cet4-listening-passage',
      'reading-match': 'cet4-reading-vocab',
      'reading-long': 'cet4-reading-match',
      'reading-choice': 'cet4-reading-careful',
      cloze: 'cet4-reading-careful',
    },
    cet6: {
      'long-dialogue': 'cet6-listening-long',
      passage: 'cet6-listening-passage',
      lecture: 'cet6-listening-lecture',
      'reading-match': 'cet6-reading-vocab',
      'reading-long': 'cet6-reading-match',
      'reading-choice': 'cet6-reading-careful',
      cloze: 'cet6-reading-careful',
    },
  };

  if (q.subtype && subtypeMap[examType]?.[q.subtype]) {
    return subtypeMap[examType][q.subtype];
  }

  const sectionNameMap: Record<string, Record<string, string>> = {
    cet4: {
      '写作': 'cet4-writing',
      '听力理解（短篇新闻）': 'cet4-listening-news',
      '听力理解（长对话）': 'cet4-listening-long',
      '听力理解（篇章）': 'cet4-listening-passage',
      '阅读理解（选词填空）': 'cet4-reading-vocab',
      '阅读理解（长篇阅读）': 'cet4-reading-match',
      '阅读理解（仔细阅读）': 'cet4-reading-careful',
      '翻译': 'cet4-translation',
    },
    cet6: {
      '写作': 'cet6-writing',
      '听力理解（长对话）': 'cet6-listening-long',
      '听力理解（篇章）': 'cet6-listening-passage',
      '听力理解（讲话/报道/讲座）': 'cet6-listening-lecture',
      '阅读理解（选词填空）': 'cet6-reading-vocab',
      '阅读理解（长篇阅读）': 'cet6-reading-match',
      '阅读理解（仔细阅读）': 'cet6-reading-careful',
      '翻译': 'cet6-translation',
    },
  };

  if (sectionNameMap[examType]?.[q.section]) {
    return sectionNameMap[examType][q.section];
  }

  return '';
}

function calculateLegacyScore(
  questions: Question[],
  answers: Record<string, string>
): ScoringResult {
  let totalScore = 0;
  let correctCount = 0;
  let answeredCount = 0;

  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (userAnswer !== undefined && userAnswer !== '') {
      answeredCount++;
      if (userAnswer === q.answer) {
        correctCount++;
        totalScore += q.score;
      }
    }
  }

  const maxScore = questions.reduce((sum, q) => sum + q.score, 0);
  const accuracy =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return {
    totalRawScore: correctCount,
    maxRawScore: questions.filter(q => q.rawScore !== 0 || q.type !== 'writing' && q.type !== 'translation').length,
    reportedScore: roundTo1(totalScore),
    totalReportedScore: roundTo1(maxScore),
    correctCount,
    totalQuestions: questions.length,
    answeredCount,
    accuracy,
    isComplete: false,
    sections: [],
  };
}

export function getSectionForQuestion(
  q: Question,
  examId: string
): ExamSection | undefined {
  const structure = getExamStructure(examId);
  if (!structure) return undefined;

  const sectionId = getQuestionSectionId(q, structure.examType);
  return structure.sections.find(s => s.id === sectionId);
}
