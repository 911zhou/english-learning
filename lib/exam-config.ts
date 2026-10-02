import { Question } from '@/types';

export interface ExamSection {
  id: string;
  name: string;
  partLabel: string;
  questionCount: number;
  rawScorePerQuestion: number;
  reportedScoreTotal: number;
  timeMinutes: number;
  isSubjective: boolean;
}

export interface ExamStructure {
  examType: 'cet4' | 'cet6' | 'gaokao';
  totalQuestions: number;
  totalDuration: number;
  totalReportedScore: number;
  totalRawScore: number;
  sections: ExamSection[];
}

const CET4_SECTIONS: ExamSection[] = [
  {
    id: 'cet4-writing',
    name: '写作',
    partLabel: 'Part I',
    questionCount: 1,
    rawScorePerQuestion: 0,
    reportedScoreTotal: 106.5,
    timeMinutes: 30,
    isSubjective: true,
  },
  {
    id: 'cet4-listening-news',
    name: '听力理解（短篇新闻）',
    partLabel: 'Part II',
    questionCount: 7,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 49.7,
    timeMinutes: 25,
    isSubjective: false,
  },
  {
    id: 'cet4-listening-long',
    name: '听力理解（长对话）',
    partLabel: 'Part II',
    questionCount: 8,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 56.8,
    timeMinutes: 25,
    isSubjective: false,
  },
  {
    id: 'cet4-listening-passage',
    name: '听力理解（篇章）',
    partLabel: 'Part II',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 71,
    timeMinutes: 25,
    isSubjective: false,
  },
  {
    id: 'cet4-reading-vocab',
    name: '阅读理解（选词填空）',
    partLabel: 'Part III',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 35.5,
    timeMinutes: 40,
    isSubjective: false,
  },
  {
    id: 'cet4-reading-match',
    name: '阅读理解（长篇阅读）',
    partLabel: 'Part III',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 71,
    timeMinutes: 40,
    isSubjective: false,
  },
  {
    id: 'cet4-reading-careful',
    name: '阅读理解（仔细阅读）',
    partLabel: 'Part III',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 142,
    timeMinutes: 40,
    isSubjective: false,
  },
  {
    id: 'cet4-translation',
    name: '翻译',
    partLabel: 'Part IV',
    questionCount: 1,
    rawScorePerQuestion: 0,
    reportedScoreTotal: 106.5,
    timeMinutes: 30,
    isSubjective: true,
  },
];

const CET6_SECTIONS: ExamSection[] = [
  {
    id: 'cet6-writing',
    name: '写作',
    partLabel: 'Part I',
    questionCount: 1,
    rawScorePerQuestion: 0,
    reportedScoreTotal: 106.5,
    timeMinutes: 30,
    isSubjective: true,
  },
  {
    id: 'cet6-listening-long',
    name: '听力理解（长对话）',
    partLabel: 'Part II',
    questionCount: 8,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 56.8,
    timeMinutes: 25,
    isSubjective: false,
  },
  {
    id: 'cet6-listening-passage',
    name: '听力理解（篇章）',
    partLabel: 'Part II',
    questionCount: 7,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 49.7,
    timeMinutes: 25,
    isSubjective: false,
  },
  {
    id: 'cet6-listening-lecture',
    name: '听力理解（讲话/报道/讲座）',
    partLabel: 'Part II',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 142,
    timeMinutes: 25,
    isSubjective: false,
  },
  {
    id: 'cet6-reading-vocab',
    name: '阅读理解（选词填空）',
    partLabel: 'Part III',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 35.5,
    timeMinutes: 40,
    isSubjective: false,
  },
  {
    id: 'cet6-reading-match',
    name: '阅读理解（长篇阅读）',
    partLabel: 'Part III',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 71,
    timeMinutes: 40,
    isSubjective: false,
  },
  {
    id: 'cet6-reading-careful',
    name: '阅读理解（仔细阅读）',
    partLabel: 'Part III',
    questionCount: 10,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 142,
    timeMinutes: 40,
    isSubjective: false,
  },
  {
    id: 'cet6-translation',
    name: '翻译',
    partLabel: 'Part IV',
    questionCount: 1,
    rawScorePerQuestion: 0,
    reportedScoreTotal: 106.5,
    timeMinutes: 30,
    isSubjective: true,
  },
];

const GAOKAO_2024_XKB1_SECTIONS: ExamSection[] = [
  {
    id: 'gaokao-listening',
    name: '听力',
    partLabel: '第一部分',
    questionCount: 20,
    rawScorePerQuestion: 1.5,
    reportedScoreTotal: 30,
    timeMinutes: 20,
    isSubjective: false,
  },
  {
    id: 'gaokao-reading-choice',
    name: '阅读理解（四篇）',
    partLabel: '第二部分',
    questionCount: 15,
    rawScorePerQuestion: 2.5,
    reportedScoreTotal: 37.5,
    timeMinutes: 35,
    isSubjective: false,
  },
  {
    id: 'gaokao-reading-match',
    name: '阅读理解（七选五）',
    partLabel: '第二部分',
    questionCount: 5,
    rawScorePerQuestion: 2.5,
    reportedScoreTotal: 12.5,
    timeMinutes: 10,
    isSubjective: false,
  },
  {
    id: 'gaokao-cloze',
    name: '语言运用（完形填空）',
    partLabel: '第三部分',
    questionCount: 15,
    rawScorePerQuestion: 1,
    reportedScoreTotal: 15,
    timeMinutes: 20,
    isSubjective: false,
  },
  {
    id: 'gaokao-grammar',
    name: '语言运用（语法填空）',
    partLabel: '第三部分',
    questionCount: 10,
    rawScorePerQuestion: 1.5,
    reportedScoreTotal: 15,
    timeMinutes: 10,
    isSubjective: false,
  },
  {
    id: 'gaokao-application-writing',
    name: '写作（应用文）',
    partLabel: '第四部分',
    questionCount: 1,
    rawScorePerQuestion: 0,
    reportedScoreTotal: 15,
    timeMinutes: 15,
    isSubjective: true,
  },
  {
    id: 'gaokao-continuation',
    name: '写作（读后续写）',
    partLabel: '第四部分',
    questionCount: 1,
    rawScorePerQuestion: 0,
    reportedScoreTotal: 25,
    timeMinutes: 20,
    isSubjective: true,
  },
];

const EXAM_STRUCTURES: Record<string, ExamStructure> = {
  'cet4-2024-06': {
    examType: 'cet4',
    totalQuestions: 57,
    totalDuration: 125,
    totalReportedScore: 710,
    totalRawScore: 45,
    sections: CET4_SECTIONS,
  },
  'cet4-2023-12': {
    examType: 'cet4',
    totalQuestions: 57,
    totalDuration: 125,
    totalReportedScore: 710,
    totalRawScore: 45,
    sections: CET4_SECTIONS,
  },
  'cet6-2024-06': {
    examType: 'cet6',
    totalQuestions: 57,
    totalDuration: 130,
    totalReportedScore: 710,
    totalRawScore: 45,
    sections: CET6_SECTIONS,
  },
  'cet6-2023-12': {
    examType: 'cet6',
    totalQuestions: 57,
    totalDuration: 130,
    totalReportedScore: 710,
    totalRawScore: 45,
    sections: CET6_SECTIONS,
  },
  'gaokao-2024-xkb1': {
    examType: 'gaokao',
    totalQuestions: 67,
    totalDuration: 120,
    totalReportedScore: 150,
    totalRawScore: 110,
    sections: GAOKAO_2024_XKB1_SECTIONS,
  },
};

export function getExamStructure(examId: string): ExamStructure | undefined {
  return EXAM_STRUCTURES[examId];
}

export function getSectionsForExam(examId: string): ExamSection[] {
  const structure = EXAM_STRUCTURES[examId];
  if (!structure) return [];
  return structure.sections;
}

export function getSectionByQuestionSubtype(
  examType: 'cet4' | 'cet6' | 'gaokao',
  subtype?: string
): ExamSection | undefined {
  if (!subtype) return undefined;

  if (examType === 'gaokao') {
    const mapping: Record<string, string> = {
      'short-dialogue': 'gaokao-listening',
      'long-dialogue': 'gaokao-listening',
      passage: 'gaokao-listening',
      'reading-choice': 'gaokao-reading-choice',
      'reading-match': 'gaokao-reading-match',
      cloze: 'gaokao-cloze',
      grammar: 'gaokao-grammar',
      'application-writing': 'gaokao-application-writing',
      continuation: 'gaokao-continuation',
    };
    const sectionId = mapping[subtype];
    if (!sectionId) return undefined;
    return GAOKAO_2024_XKB1_SECTIONS.find(s => s.id === sectionId);
  }

  const sections = examType === 'cet4' ? CET4_SECTIONS : CET6_SECTIONS;

  const mapping: Record<string, string> =
    examType === 'cet4'
      ? {
          'short-dialogue': 'cet4-listening-news',
          'long-dialogue': 'cet4-listening-long',
          passage: 'cet4-listening-passage',
          'reading-match': 'cet4-reading-vocab',
          'reading-long': 'cet4-reading-match',
          'reading-choice': 'cet4-reading-careful',
          cloze: 'cet4-reading-careful',
        }
      : {
          'long-dialogue': 'cet6-listening-long',
          passage: 'cet6-listening-passage',
          lecture: 'cet6-listening-lecture',
          'reading-match': 'cet6-reading-vocab',
          'reading-long': 'cet6-reading-match',
          'reading-choice': 'cet6-reading-careful',
          cloze: 'cet6-reading-careful',
        };

  const sectionId = mapping[subtype];
  if (!sectionId) return undefined;
  return sections.find(s => s.id === sectionId);
}

export function getQuestionSectionName(
  q: Question,
  examId: string
): string {
  const structure = getExamStructure(examId);
  if (!structure) return q.section;
  const section = getSectionByQuestionSubtype(structure.examType, q.subtype);
  if (section) return section.name;
  return q.section;
}
