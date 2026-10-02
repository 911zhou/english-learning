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

export async function translateText(content: string): Promise<TranslationAnalysis> {
  const trimmed = content.trim();
  const isEnglish = /^[a-zA-Z\s.,!?;:'"()-]+$/.test(trimmed);

  if (isEnglish) {
    return analyzeEnglishToChinese(trimmed);
  } else {
    return analyzeChineseToEnglish(trimmed);
  }
}

function analyzeEnglishToChinese(text: string): TranslationAnalysis {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const translations: string[] = [];
  const grammarNotes: string[] = [];
  const keyVocabulary: Array<{ word: string; phonetic: string; meaning: string }> = [];
  const advancedExpressions: Array<{ original: string; better: string; reason: string }> = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    let translation = trimmed;

    if (/^I think/i.test(trimmed)) {
      translation = trimmed.replace(/^I think\s+/i, '我认为');
      grammarNotes.push('"I think" 表达个人观点，正式写作可用 "In my opinion" 或 "From my perspective"');
    } else if (/^In my opinion/i.test(trimmed)) {
      translation = trimmed.replace(/^In my opinion,?\s*/i, '在我看来，');
    } else if (/^Nowadays/i.test(trimmed)) {
      translation = trimmed.replace(/^Nowadays,?\s*/i, '如今，');
      advancedExpressions.push({
        original: 'Nowadays',
        better: 'In contemporary society',
        reason: '更正式的表达方式'
      });
    } else if (/^Moreover/i.test(trimmed)) {
      translation = trimmed.replace(/^Moreover,?\s*/i, '此外，');
    } else if (/^However/i.test(trimmed)) {
      translation = trimmed.replace(/^However,?\s*/i, '然而，');
    } else if (/^Therefore/i.test(trimmed)) {
      translation = trimmed.replace(/^Therefore,?\s*/i, '因此，');
    } else if (/^For example/i.test(trimmed)) {
      translation = trimmed.replace(/^For example,?\s*/i, '例如，');
    } else if (/^In conclusion/i.test(trimmed)) {
      translation = trimmed.replace(/^In conclusion,?\s*/i, '总之，');
    } else if (/^Firstly/i.test(trimmed)) {
      translation = trimmed.replace(/^Firstly,?\s*/i, '首先，');
    } else if (/^Secondly/i.test(trimmed)) {
      translation = trimmed.replace(/^Secondly,?\s*/i, '其次，');
    } else if (/^Thirdly/i.test(trimmed)) {
      translation = trimmed.replace(/^Thirdly,?\s*/i, '第三，');
    }

    const words = trimmed.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (cleanWord.length > 5 && !['because', 'although', 'however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'meanwhile', 'otherwise', 'otherwise'].includes(cleanWord)) {
        keyVocabulary.push({
          word: cleanWord,
          phonetic: `/${cleanWord}/`,
          meaning: '核心词汇'
        });
      }
    }

    if (/very important/i.test(trimmed)) {
      advancedExpressions.push({
        original: 'very important',
        better: 'crucial / essential / vital',
        reason: '避免使用 very + 形容词，使用更精确的词汇'
      });
    }
    if (/a lot of/i.test(trimmed)) {
      advancedExpressions.push({
        original: 'a lot of',
        better: 'numerous / a substantial number of',
        reason: '更正式的表达'
      });
    }
    if (/good/i.test(trimmed)) {
      advancedExpressions.push({
        original: 'good',
        better: 'excellent / outstanding / beneficial',
        reason: '使用更具体的形容词'
      });
    }
    if (/bad/i.test(trimmed)) {
      advancedExpressions.push({
        original: 'bad',
        better: 'detrimental / adverse / unfavorable',
        reason: '使用更正式的词汇'
      });
    }

    translations.push(translation);
  }

  if (/I think.*because/i.test(text)) {
    grammarNotes.push('"I think...because..." 结构中，because 引导原因状语从句');
  }
  if (/not only.*but also/i.test(text)) {
    grammarNotes.push('"not only...but also..." 连接两个并列成分，注意主谓一致');
  }
  if (/it is.*that/i.test(text)) {
    grammarNotes.push('"It is...that..." 强调句型，强调主语、宾语或状语');
  }

  const approach = buildEnglishToChineseApproach(text);

  return {
    translation: translations.join('。') + '。',
    approach,
    advancedExpressions,
    keyVocabulary: keyVocabulary.slice(0, 8),
    grammarNotes
  };
}

function analyzeChineseToEnglish(text: string): TranslationAnalysis {
  const grammarNotes: string[] = [];
  const keyVocabulary: Array<{ word: string; phonetic: string; meaning: string }> = [];
  const advancedExpressions: Array<{ original: string; better: string; reason: string }> = [];

  let translation = text;

  if (/我认为/.test(text)) {
    translation = text.replace(/我认为/g, 'I think that');
    grammarNotes.push('"我认为" 译为 "I think that"，正式写作可用 "In my opinion" 或 "From my perspective"');
    advancedExpressions.push({
      original: '我认为',
      better: 'In my opinion / From my perspective',
      reason: '更正式的表达方式'
    });
  }
  if (/如今/.test(text)) {
    translation = text.replace(/如今/g, 'Nowadays');
    advancedExpressions.push({
      original: '如今',
      better: 'In contemporary society',
      reason: '更正式的表达'
    });
  }
  if (/此外/.test(text)) {
    translation = text.replace(/此外/g, 'Moreover');
  }
  if (/然而/.test(text)) {
    translation = text.replace(/然而/g, 'However');
  }
  if (/因此/.test(text)) {
    translation = text.replace(/因此/g, 'Therefore');
  }
  if (/例如/.test(text)) {
    translation = text.replace(/例如/g, 'For example');
  }
  if (/总之/.test(text)) {
    translation = text.replace(/总之/g, 'In conclusion');
  }
  if (/首先/.test(text)) {
    translation = text.replace(/首先/g, 'Firstly');
  }
  if (/其次/.test(text)) {
    translation = text.replace(/其次/g, 'Secondly');
  }

  const chineseWords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  for (const word of chineseWords.slice(0, 8)) {
    keyVocabulary.push({
      word,
      phonetic: '',
      meaning: '核心词汇'
    });
  }

  const approach = buildChineseToEnglishApproach(text);

  return {
    translation,
    approach,
    advancedExpressions,
    keyVocabulary,
    grammarNotes
  };
}

function buildEnglishToChineseApproach(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const sentenceCount = sentences.length;
  const wordCount = text.split(/\s+/).length;

  let approach = `这是一段英文文本，共 ${sentenceCount} 句，约 ${wordCount} 词。`;

  if (/^I think/i.test(text)) {
    approach += ' 文章以个人观点开头，采用议论文结构。';
  } else if (/^Nowadays/i.test(text)) {
    approach += ' 文章以现象描述开头，适合采用"现象-原因-结论"结构。';
  } else if (/^In my opinion/i.test(text)) {
    approach += ' 文章直接表达观点，适合采用"观点-论据-总结"结构。';
  }

  if (/Firstly.*Secondly.*Thirdly/i.test(text)) {
    approach += ' 使用了 Firstly/Secondly/Thirdly 连接词，逻辑清晰。';
  } else if (/First.*Second.*Third/i.test(text)) {
    approach += ' 使用了 First/Second/Third 连接词，层次分明。';
  }

  if (/For example/i.test(text)) {
    approach += ' 包含举例说明，增强了论证说服力。';
  }

  if (/In conclusion/i.test(text)) {
    approach += ' 有明确的结论段，结构完整。';
  }

  return approach;
}

function buildChineseToEnglishApproach(text: string): string {
  let approach = `这是一段中文文本，需要翻译为英文。`;

  if (/我认为/.test(text)) {
    approach += ' 包含个人观点表达，建议使用 "In my opinion" 或 "From my perspective" 等正式表达。';
  }
  if (/首先.*其次.*最后/.test(text)) {
    approach += ' 使用了首先/其次/最后的逻辑结构，英文可用 Firstly/Secondly/Finally 对应。';
  }
  if (/例如/.test(text)) {
    approach += ' 包含举例，英文可用 "For example" 或 "For instance" 引出。';
  }
  if (/总之/.test(text)) {
    approach += ' 有总结性表述，英文可用 "In conclusion" 或 "To sum up" 对应。';
  }

  return approach;
}
