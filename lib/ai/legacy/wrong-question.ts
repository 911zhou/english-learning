import { Question } from '@/types';

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

const grammarKnowledgeMap: Record<string, string[]> = {
  engineering: ['词性转换', '名词作定语', '动名词形式'],
  functional: ['词性转换', '形容词用法'],
  'to give': ['不定式', '目的状语', '非谓语动词'],
  closed: ['形容词', '系动词用法', '词性转换'],
  walks: ['主谓一致', '一般现在时', '第三人称单数'],
  the: ['冠词', '固定搭配', 'for the first time'],
  favorites: ['词性转换', '名词复数', '形容词名词化'],
  as: ['介词', '固定搭配', 'stand as'],
  that: ['定语从句', '关系代词', '限定性从句'],
  richness: ['词性转换', '名词', '形容词变名词'],
};

const sectionKnowledgeMap: Record<string, string[]> = {
  '听力短对话': ['场景词汇', '日常对话', '关键信息捕捉'],
  '听力长对话': ['对话理解', '细节捕捉', '推理判断'],
  '听力篇章': ['主旨大意', '细节理解', '语音识别'],
  '听力讲座': ['学术词汇', '论点识别', '笔记技巧'],
  '阅读理解': ['阅读技巧', '词汇理解', '推理判断', '主旨归纳'],
  '长篇阅读': ['快速阅读', '信息匹配', '关键词定位'],
  '信息匹配': ['信息筛选', '同义替换', '段落大意'],
  '完形填空': ['词汇辨析', '上下文理解', '逻辑关系', '固定搭配'],
  '语法填空': ['语法规则', '词性转换', '句子结构分析'],
  '翻译': ['中英对比', '句型转换', '核心词汇'],
  '写作': ['文章结构', '论证方法', '常用句型'],
  '应用文写作': ['格式规范', '常用表达', '语域得体'],
  '读后续写': ['情节理解', '语言模仿', '衔接连贯'],
  '七选五': ['篇章结构', '逻辑关系', '上下文衔接'],
};

function getKnowledgePoints(question: Question): string[] {
  if (question.subtype === 'grammar') {
    const answer = question.answer.trim().toLowerCase();
    for (const [key, points] of Object.entries(grammarKnowledgeMap)) {
      if (answer === key.toLowerCase()) {
        return points;
      }
    }
    return ['语法规则', '词性转换', '句子结构分析'];
  }

  const section = question.section;
  for (const [key, points] of Object.entries(sectionKnowledgeMap)) {
    if (section.includes(key)) {
      return points;
    }
  }

  if (question.type === 'listening') return ['听力技巧', '关键信息捕捉', '场景词汇'];
  if (question.type === 'reading') return ['阅读技巧', '词汇理解', '推理判断'];
  if (question.type === 'cloze') return ['词汇辨析', '上下文理解', '固定搭配'];
  return ['综合英语能力'];
}

function generateExamples(question: Question): string[] {
  if (question.subtype === 'grammar') {
    const answer = question.answer.trim();
    if (answer === 'engineering') {
      return [
        'Engineering techniques have revolutionized modern construction.',
        'She is studying engineering at university.',
      ];
    }
    if (answer === 'functional') {
      return [
        'The building has a functional design that maximizes space.',
        'This tool is both practical and functional.',
      ];
    }
    if (answer === 'to give') {
      return [
        'He studied hard to pass the exam.',
        'To improve your English, you should read more.',
      ];
    }
    if (answer === 'closed') {
      return [
        'The door was closed during the meeting.',
        'Keep the windows closed in winter.',
      ];
    }
    if (answer === 'walks') {
      return [
        'The guide walks visitors through the museum.',
        'She walks to school every day.',
      ];
    }
    if (answer === 'the') {
      return [
        'This is the first time I have been here.',
        'For the first time, she felt confident.',
      ];
    }
    if (answer === 'richness') {
      return [
        'The richness of the culture attracted many visitors.',
        'The soup is known for its richness of flavor.',
      ];
    }
    return [
      `The correct answer is "${answer}". Pay attention to this usage in context.`,
      `Remember: ${answer} — practice using it in your own sentences.`,
    ];
  }

  if (question.type === 'listening') {
    return [
      'Listen for key words and phrases that indicate the answer.',
      'Practice with authentic materials to improve listening skills.',
    ];
  }
  if (question.type === 'reading') {
    return [
      'Read the passage carefully and identify the main idea.',
      'Look for synonyms and paraphrases in the text.',
    ];
  }
  if (question.type === 'cloze') {
    return [
      'Read the whole passage first to understand the context.',
      'Pay attention to collocations and fixed expressions.',
    ];
  }
  return [
    'Review the relevant vocabulary and grammar rules.',
    'Practice similar questions to reinforce your understanding.',
  ];
}

function generateWrongOptionsAnalysis(question: Question): Array<{ option: string; reason: string }> | undefined {
  if (!question.options || question.options.length === 0) return undefined;

  const correctAnswer = question.answer;
  return question.options
    .filter(opt => opt.charAt(0) !== correctAnswer)
    .map(opt => {
      const letter = opt.charAt(0);
      const content = opt.substring(2);
      let reason = '';

      if (question.subtype === 'grammar') {
        reason = `该选项"${content}"不符合此处的语法要求。结合上下文，正确答案需要满足句子的语法结构和语义逻辑。`;
      } else if (question.type === 'reading') {
        reason = `该选项"${content}"与原文信息不符，或不能准确回答题目所问。请回到原文定位关键信息。`;
      } else if (question.type === 'listening') {
        reason = `该选项"${content}"与听力材料中的信息不一致。注意区分相似但不同的表达。`;
      } else if (question.type === 'cloze') {
        reason = `该选项"${content}"不符合上下文的语义逻辑或搭配习惯。需要结合前后文综合判断。`;
      } else {
        reason = `该选项"${content}"不符合题意。请仔细分析题目要求和各选项的区别。`;
      }

      return { option: letter, reason };
    });
}

export async function analyzeQuestion(
  question: Question,
  wrongQuestionId?: string
): Promise<WrongQuestionAnalysis> {
  const knowledgePoints = getKnowledgePoints(question);
  const exampleSentences = generateExamples(question);
  const wrongOptionsAnalysis = generateWrongOptionsAnalysis(question);

  let analysis = question.explanation || '';

  if (!analysis) {
    if (question.subtype === 'grammar') {
      analysis = `本题考查语法填空。正确答案是"${question.answer}"。需要根据句子结构和语法规则，判断空白处应填入的词的形式。`;
    } else if (question.type === 'reading') {
      analysis = `本题考查阅读理解能力。正确答案是${question.answer}。需要仔细阅读相关段落，找到与题目对应的关键信息。`;
    } else if (question.type === 'listening') {
      analysis = `本题考查听力理解。正确答案是${question.answer}。需要抓住听力材料中的关键信息。`;
    } else if (question.type === 'cloze') {
      analysis = `本题考查完形填空。正确答案是${question.answer}。需要结合上下文语境和词汇搭配来选择最佳答案。`;
    } else {
      analysis = `正确答案是${question.answer}。请仔细复习相关知识点。`;
    }
  }

  analysis += `\n\n【知识点】${knowledgePoints.join('、')}`;

  return {
    id: `analysis-${Date.now()}`,
    wrongQuestionId: wrongQuestionId || question.id,
    correctAnswer: question.answer,
    analysis,
    wrongOptionsAnalysis,
    knowledgePoints,
    exampleSentences,
    createdAt: new Date().toISOString(),
  };
}
