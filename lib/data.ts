import { Exam, Word, DailyWords } from '@/types';
import { getQuestionsByExam } from './questions';

export const exams: Exam[] = [
  {
    id: 'cet4-2024-06',
    title: '2024年6月大学英语四级考试',
    year: 2024,
    type: 'cet4',
    description: '完整版真题，含听力、阅读、写作',
    questionCount: 57,
    duration: 125,
    isComplete: false,
    actualQuestionCount: 0,
  },
  {
    id: 'cet4-2023-12',
    title: '2023年12月大学英语四级考试',
    year: 2023,
    type: 'cet4',
    description: '完整版真题，含听力、阅读、写作',
    questionCount: 57,
    duration: 125,
    isComplete: false,
    actualQuestionCount: 0,
  },
  {
    id: 'cet6-2024-06',
    title: '2024年6月大学英语六级考试',
    year: 2024,
    type: 'cet6',
    description: '完整版真题，含听力、阅读、写作、翻译',
    questionCount: 57,
    duration: 130,
    isComplete: false,
    actualQuestionCount: 0,
  },
  {
    id: 'cet6-2023-12',
    title: '2023年12月大学英语六级考试',
    year: 2023,
    type: 'cet6',
    description: '完整版真题，含听力、阅读、写作、翻译',
    questionCount: 57,
    duration: 130,
    isComplete: false,
    actualQuestionCount: 0,
  },
  {
    id: 'gaokao-2024-xkb1',
    title: '2024年普通高等学校招生全国统一考试英语·新课标卷I',
    year: 2024,
    type: 'gaokao',
    description: '全国卷，含听力、阅读、七选五、完形、语法填空、写作',
    questionCount: 67,
    duration: 120,
    isComplete: false,
    actualQuestionCount: 0,
    region: '全国',
    paperType: 'new-curriculum-standard-I',
  },
];

function initActualCounts(): void {
  for (const exam of exams) {
    exam.actualQuestionCount = getQuestionsByExam(exam.id).length;
    exam.isComplete = exam.actualQuestionCount >= exam.questionCount;
  }
}

initActualCounts();

export function getExamsByType(type: 'cet4' | 'cet6' | 'gaokao'): Exam[] {
  return exams.filter(exam => exam.type === type);
}

export function getExamById(id: string): Exam | undefined {
  return exams.find(exam => exam.id === id);
}

export const dailyWords: DailyWords = {
  date: '2026-09-21',
  words: [
    {
      id: '1',
      word: 'elaborate',
      phonetic: '/ɪˈlæbərət/',
      meaning: 'adj. 精心制作的；v. 详细阐述',
      example: 'Could you elaborate on your proposal?',
      exampleTranslation: '你能详细阐述一下你的提议吗？',
      level: 'cet6',
    },
    {
      id: '2',
      word: 'comprehensive',
      phonetic: '/ˌkɑːmprɪˈhensɪv/',
      meaning: 'adj. 综合的；全面的',
      example: 'We need a comprehensive plan.',
      exampleTranslation: '我们需要一个全面的计划。',
      level: 'cet4',
    },
    {
      id: '3',
      word: 'fundamental',
      phonetic: '/ˌfʌndəˈmentl/',
      meaning: 'adj. 基本的；根本的',
      example: 'This is a fundamental principle.',
      exampleTranslation: '这是一个基本原则。',
      level: 'gaokao',
    },
    {
      id: '4',
      word: 'significant',
      phonetic: '/sɪɡˈnɪfɪkənt/',
      meaning: 'adj. 重要的；显著的',
      example: 'There has been a significant improvement.',
      exampleTranslation: '有了显著的改善。',
      level: 'cet4',
    },
    {
      id: '5',
      word: 'perspective',
      phonetic: '/pərˈspektɪv/',
      meaning: 'n. 观点；视角',
      example: 'Try to see things from a different perspective.',
      exampleTranslation: '试着从不同的角度看问题。',
      level: 'cet6',
    },
    {
      id: '6',
      word: 'establish',
      phonetic: '/ɪˈstæblɪʃ/',
      meaning: 'v. 建立；确立',
      example: 'The company was established in 1990.',
      exampleTranslation: '这家公司成立于1990年。',
      level: 'gaokao',
    },
    {
      id: '7',
      word: 'demonstrate',
      phonetic: '/ˈdemənstreɪt/',
      meaning: 'v. 证明；演示',
      example: 'The experiment demonstrates the theory.',
      exampleTranslation: '实验证明了这个理论。',
      level: 'cet4',
    },
    {
      id: '8',
      word: 'subsequent',
      phonetic: '/ˈsʌbsɪkwənt/',
      meaning: 'adj. 随后的；后来的',
      example: 'Subsequent events proved him right.',
      exampleTranslation: '后来的事件证明他是对的。',
      level: 'cet6',
    },
  ],
};
