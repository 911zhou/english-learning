'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TranslationAnalysis {
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

interface TranslationRecord {
  id: string;
  sourceText: string;
  targetText: string;
  analysis: TranslationAnalysis;
  createdAt: string;
}

type ViewMode = 'input' | 'result' | 'history';

export default function TranslationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TranslationAnalysis | null>(null);
  const [records, setRecords] = useState<TranslationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/translation');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      loadHistory();
    }
  }, [viewMode]);

  const handleSubmit = async () => {
    if (content.trim().length < 2) {
      setError('请输入至少2个字符');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '翻译失败');
        return;
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setViewMode('result');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setAnalysis(null);
    setViewMode('input');
    setError('');
  };

  if (status === 'loading' || !session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const charCount = content.length;

  if (viewMode === 'history') {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">翻译历史</h1>
          <button
            onClick={() => setViewMode('input')}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            新建翻译
          </button>
        </div>

        {historyLoading ? (
          <div className="py-12 text-center text-gray-500">加载中...</div>
        ) : records.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-500">暂无翻译记录</p>
            <button
              onClick={() => setViewMode('input')}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              开始翻译
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(record => (
              <div key={record.id} className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </span>
                  <button
                    onClick={() => {
                      setAnalysis(record.analysis);
                      setContent(record.sourceText);
                      setViewMode('result');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    查看详情 →
                  </button>
                </div>
                <p className="mb-2 text-sm font-medium text-gray-900">{record.sourceText}</p>
                <p className="line-clamp-2 text-sm text-gray-600">{record.targetText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'result' && analysis) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">翻译结果</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('history')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                翻译历史
              </button>
              <button
                onClick={handleReset}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                新建翻译
              </button>
            </div>
          </div>

          {/* Translation Result */}
          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">翻译结果</h2>
            <div className="rounded-lg bg-primary-50 p-4 text-base leading-relaxed text-gray-900">
              {analysis.translation}
            </div>
          </div>

          {/* Translation Approach */}
          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">翻译思路</h2>
            <p className="text-sm leading-relaxed text-gray-700">{analysis.approach}</p>
          </div>

          {/* Advanced Expressions */}
          {analysis.advancedExpressions.length > 0 && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                高级表达替换
                <span className="ml-2 text-sm font-normal text-blue-500">({analysis.advancedExpressions.length}处)</span>
              </h2>
              <div className="space-y-3">
                {analysis.advancedExpressions.map((expr, idx) => (
                  <div key={idx} className="rounded-lg border-l-4 border-blue-300 bg-blue-50 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {expr.original}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-medium text-green-700">
                        {expr.better}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{expr.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Vocabulary */}
          {analysis.keyVocabulary.length > 0 && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                重点词汇
                <span className="ml-2 text-sm font-normal text-green-500">({analysis.keyVocabulary.length}个)</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {analysis.keyVocabulary.map((vocab, idx) => (
                  <div key={idx} className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-gray-900">{vocab.word}</span>
                      {vocab.phonetic && (
                        <span className="text-xs text-gray-500">{vocab.phonetic}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{vocab.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar Notes */}
          {analysis.grammarNotes.length > 0 && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                语法分析
                <span className="ml-2 text-sm font-normal text-amber-500">({analysis.grammarNotes.length}条)</span>
              </h2>
              <ul className="space-y-2">
                {analysis.grammarNotes.map((note, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-amber-500">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Original Text */}
          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">原文</h2>
            <div className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 翻译</h1>
            <p className="mt-1 text-sm text-gray-500">输入英文或中文，获取翻译结果、思路解析、高级表达和语法分析</p>
          </div>
          <button
            onClick={() => setViewMode('history')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            翻译历史
          </button>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">输入文本</label>
            <span className="text-xs text-gray-400">
              字数：{charCount} 字符
            </span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="请输入英文或中文句子/短文...&#10;&#10;例如：&#10;Nowadays, more and more people realize the importance of English learning.&#10;&#10;或：&#10;我认为学习英语很重要，因为它可以帮助我们获得更好的工作机会。"
            className="h-48 w-full rounded-lg border border-gray-300 p-4 text-sm leading-relaxed text-gray-700 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              支持英译中、中译英 | 提供翻译思路、高级表达、词汇和语法分析
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading || content.trim().length < 2}
              className={cn(
                'rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors',
                loading || content.trim().length < 2
                  ? 'cursor-not-allowed bg-gray-300'
                  : 'bg-primary-600 hover:bg-primary-700'
              )}
            >
              {loading ? '翻译中...' : '开始翻译'}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 rounded-lg bg-primary-50 p-5">
          <h3 className="mb-2 text-sm font-bold text-primary-900">翻译小贴士</h3>
          <ul className="space-y-1 text-xs text-primary-800">
            <li>• 输入完整句子可获得更准确的翻译和语法分析</li>
            <li>• 系统会自动识别英文或中文并选择对应翻译方向</li>
            <li>• 关注"高级表达替换"部分，学习更地道的表达方式</li>
            <li>• "翻译思路"帮助你理解翻译的逻辑和结构</li>
            <li>• 翻译历史会自动保存，方便回顾和学习</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
