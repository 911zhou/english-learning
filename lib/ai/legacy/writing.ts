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

const commonGrammarErrors: Array<{
  pattern: RegExp;
  suggestion: string;
  explanation: string;
}> = [
  { pattern: /\b(I|he|she|we|they)\s+have\b(?!\s+been|\s+had|\s+got)/gi, suggestion: '检查主谓一致', explanation: '注意主语和谓语动词的一致性' },
  { pattern: /\bmore\s+better\b/gi, suggestion: 'better', explanation: '"better"本身已是比较级，不需要加"more"' },
  { pattern: /\bmore\s+worse\b/gi, suggestion: 'worse', explanation: '"worse"本身已是比较级，不需要加"more"' },
  { pattern: /\bvery\s+unique\b/gi, suggestion: 'unique', explanation: '"unique"表示独一无二，不能用"very"修饰' },
  { pattern: /\bcan\s+able\s+to\b/gi, suggestion: 'can / be able to', explanation: '"can"和"be able to"不能同时使用' },
  { pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi, suggestion: 'because', explanation: '"due to the fact that"过于冗长，用"because"更简洁' },
  { pattern: /\bin\s+order\s+to\b/gi, suggestion: 'to', explanation: '"in order to"可以简化为"to"' },
  { pattern: /\bat\s+the\s+end\s+of\s+the\s+day\b/gi, suggestion: 'ultimately / in conclusion', explanation: '这个表达过于口语化，写作中建议使用更正式的表达' },
  { pattern: /\ba\s+lot\s+of\b/gi, suggestion: 'many / numerous / a great deal of', explanation: '"a lot of"过于口语化，写作中建议使用更正式的量词' },
  { pattern: /\bget\s+more\s+and\s+more\b/gi, suggestion: 'become increasingly', explanation: '"get more and more"过于口语化' },
  { pattern: /\bthings?\b(?!\s+to)/gi, suggestion: 'aspects / factors / elements', explanation: '"thing"过于笼统，建议使用更具体的词汇' },
  { pattern: /\bgood\b/gi, suggestion: 'excellent / beneficial / favorable', explanation: '"good"过于普通，可以使用更精确的形容词' },
  { pattern: /\bbad\b/gi, suggestion: 'detrimental / unfavorable / harmful', explanation: '"bad"过于普通，可以使用更精确的形容词' },
  { pattern: /\bvery\s+important\b/gi, suggestion: 'crucial / essential / vital', explanation: '"very important"可以用更高级的词汇替代' },
  { pattern: /\bI\s+think\b/gi, suggestion: 'I believe / In my opinion / From my perspective', explanation: '"I think"过于简单，可以使用更正式的表达' },
  { pattern: /\balso\b/gi, suggestion: 'furthermore / moreover / additionally', explanation: '在正式写作中，"furthermore"等词比"also"更恰当' },
  { pattern: /\bbut\b/gi, suggestion: 'however / nevertheless / on the contrary', explanation: '在正式写作中，"however"等词比"but"更恰当' },
  { pattern: /\bbecause\b/gi, suggestion: 'since / as / given that', explanation: '可以尝试使用更多样化的因果连接词' },
  { pattern: /\bso\b/gi, suggestion: 'therefore / consequently / as a result', explanation: '在正式写作中，"therefore"等词比"so"更恰当' },
];

const basicVocabReplacements: Array<{
  basic: string;
  advanced: string[];
  reason: string;
}> = [
  { basic: 'good', advanced: ['excellent', 'outstanding', 'beneficial', 'favorable'], reason: '使用更精确的形容词' },
  { basic: 'bad', advanced: ['detrimental', 'unfavorable', 'harmful', 'adverse'], reason: '使用更精确的形容词' },
  { basic: 'big', advanced: ['substantial', 'considerable', 'significant', 'enormous'], reason: '使用更学术化的表达' },
  { basic: 'small', advanced: ['minimal', 'negligible', 'modest', 'slight'], reason: '使用更学术化的表达' },
  { basic: 'important', advanced: ['crucial', 'essential', 'vital', 'indispensable'], reason: '使用更强调性的词汇' },
  { basic: 'help', advanced: ['assist', 'facilitate', 'contribute to', 'aid'], reason: '使用更正式的动词' },
  { basic: 'use', advanced: ['utilize', 'employ', 'apply', 'leverage'], reason: '使用更正式的动词' },
  { basic: 'show', advanced: ['demonstrate', 'illustrate', 'reveal', 'indicate'], reason: '使用更学术化的动词' },
  { basic: 'think', advanced: ['believe', 'consider', 'maintain', 'contend'], reason: '使用更正式的表达' },
  { basic: 'want', advanced: ['desire', 'wish', 'aspire to', 'seek'], reason: '使用更正式的表达' },
  { basic: 'need', advanced: ['require', 'necessitate', 'demand'], reason: '使用更正式的表达' },
  { basic: 'make', advanced: ['create', 'produce', 'generate', 'construct'], reason: '使用更具体的动词' },
  { basic: 'give', advanced: ['provide', 'offer', 'supply', 'furnish'], reason: '使用更正式的表达' },
  { basic: 'get', advanced: ['obtain', 'acquire', 'gain', 'achieve'], reason: '使用更正式的表达' },
  { basic: 'very', advanced: ['exceedingly', 'remarkably', 'considerably', 'tremendously'], reason: '使用更高级的程度副词' },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function findGrammarErrors(text: string): Array<{ original: string; suggestion: string; explanation: string }> {
  const errors: Array<{ original: string; suggestion: string; explanation: string }> = [];
  const seen = new Set<string>();

  for (const rule of commonGrammarErrors) {
    const matches = text.match(rule.pattern);
    if (matches) {
      for (const match of matches) {
        const key = match.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          errors.push({
            original: match,
            suggestion: rule.suggestion,
            explanation: rule.explanation,
          });
        }
      }
    }
  }

  return errors.slice(0, 8);
}

function findVocabularySuggestions(text: string): Array<{ original: string; better: string; reason: string }> {
  const suggestions: Array<{ original: string; better: string; reason: string }> = [];
  const lowerText = text.toLowerCase();
  const seen = new Set<string>();

  for (const item of basicVocabReplacements) {
    if (lowerText.includes(item.basic) && !seen.has(item.basic)) {
      seen.add(item.basic);
      const advanced = item.advanced[Math.floor(Math.random() * item.advanced.length)];
      suggestions.push({
        original: item.basic,
        better: advanced,
        reason: item.reason,
      });
    }
  }

  return suggestions.slice(0, 6);
}

function generateStructureSuggestions(text: string, wordCount: number, sentenceCount: number): string[] {
  const suggestions: string[] = [];
  const avgSentenceLen = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  if (wordCount < 80) {
    suggestions.push('文章篇幅较短，建议适当扩展论述内容，增加具体的例子和论据来支撑观点。');
  }
  if (wordCount > 300) {
    suggestions.push('文章篇幅较长，注意保持段落清晰，确保每段有一个明确的主题句。');
  }
  if (avgSentenceLen > 25) {
    suggestions.push('平均句子长度偏长，建议适当拆分长句，提高文章的可读性。');
  }
  if (avgSentenceLen < 8 && sentenceCount > 3) {
    suggestions.push('句子普遍较短，可以尝试使用复合句和连接词来增加句子的多样性和连贯性。');
  }

  if (!text.match(/\bfirstly\b|\bsecondly\b|\bfinally\b|\bto\s+begin\s+with\b|\bin\s+conclusion\b|\bto\s+sum\s+up\b/i)) {
    suggestions.push('建议使用过渡词（如 firstly, secondly, in conclusion 等）来增强文章的逻辑性和连贯性。');
  }

  if (!text.match(/\bfor\s+example\b|\bfor\s+instance\b|\bsuch\s+as\b|\blike\b/i)) {
    suggestions.push('文章中缺少举例说明，适当添加例子可以使论证更有说服力。');
  }

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 3 && wordCount > 100) {
    suggestions.push('建议将文章分成更多段落，一般包括引言段、主体段和结论段。');
  }

  if (suggestions.length === 0) {
    suggestions.push('文章结构基本合理，可以进一步优化段落之间的过渡，使文章更加流畅。');
  }

  return suggestions.slice(0, 5);
}

function calculateScore(text: string, wordCount: number, grammarErrors: number, vocabSuggestions: number): number {
  let score = 70;

  if (wordCount >= 120) score += 10;
  else if (wordCount >= 80) score += 5;
  else score -= 5;

  score -= Math.min(grammarErrors * 3, 15);
  score -= Math.min(vocabSuggestions * 2, 10);

  const sentenceCount = countSentences(text);
  const avgLen = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  if (avgLen >= 10 && avgLen <= 20) score += 5;

  if (text.match(/\bfirstly\b|\bsecondly\b|\bfinally\b|\bin\s+conclusion\b/i)) score += 5;
  if (text.match(/\bfor\s+example\b|\bfor\s+instance\b|\bsuch\s+as\b/i)) score += 3;
  if (text.match(/\bhowever\b|\bmoreover\b|\bfurthermore\b|\btherefore\b/i)) score += 3;

  const uniqueWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const lexicalDiversity = uniqueWords.size / Math.max(wordCount, 1);
  if (lexicalDiversity > 0.6) score += 5;
  else if (lexicalDiversity > 0.4) score += 2;

  return Math.max(30, Math.min(98, score));
}

function generateEvaluation(score: number, wordCount: number): string {
  if (score >= 90) {
    return `这是一篇优秀的英语作文。文章结构清晰，用词准确丰富，语法规范，论证有力。字数约${wordCount}词，篇幅适当。继续保持！`;
  }
  if (score >= 80) {
    return `这是一篇良好的英语作文。文章整体结构合理，表达较为流畅，但仍有提升空间。字数约${wordCount}词。注意改进以下建议中的问题，可以进一步提高写作水平。`;
  }
  if (score >= 70) {
    return `这是一篇合格的英语作文。文章基本完成了写作任务，但在语法、词汇或结构方面存在一些问题需要改进。字数约${wordCount}词。请仔细查看以下修改建议。`;
  }
  if (score >= 60) {
    return `这篇作文基本达标，但存在较多需要改进的地方。语法错误较多，词汇使用较为基础，文章结构需要优化。字数约${wordCount}词。建议多阅读优秀范文，积累表达方式。`;
  }
  return `这篇作文需要较大的改进。建议从基础语法和常用表达入手，多练习写作，逐步提高。字数约${wordCount}词，可以适当扩展内容。`;
}

function generateRevisedVersion(text: string, grammarErrors: Array<{ original: string; suggestion: string }>, vocabSuggestions: Array<{ original: string; better: string }>): string {
  let revised = text;

  for (const err of grammarErrors) {
    if (err.suggestion !== err.original && !err.suggestion.includes('/') && !err.suggestion.includes('检查')) {
      revised = revised.replace(new RegExp(escapeRegex(err.original), 'gi'), err.suggestion);
    }
  }

  for (const sug of vocabSuggestions) {
    revised = revised.replace(new RegExp(`\\b${escapeRegex(sug.original)}\\b`, 'gi'), sug.better);
  }

  return revised;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function analyzeWriting(content: string): Promise<WritingFeedback> {
  const wordCount = countWords(content);
  const sentenceCount = countSentences(content);

  const grammarErrors = findGrammarErrors(content);
  const vocabularySuggestions = findVocabularySuggestions(content);
  const structureSuggestions = generateStructureSuggestions(content, wordCount, sentenceCount);

  const score = calculateScore(content, wordCount, grammarErrors.length, vocabularySuggestions.length);
  const evaluation = generateEvaluation(score, wordCount);
  const revisedVersion = generateRevisedVersion(content, grammarErrors, vocabularySuggestions);

  return {
    score,
    evaluation,
    grammarErrors,
    vocabularySuggestions,
    structureSuggestions,
    revisedVersion,
  };
}
