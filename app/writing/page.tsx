'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface WritingFeedback {
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

interface WritingRecord {
  id: string;
  content: string;
  score: number;
  feedback: WritingFeedback;
  createdAt: string;
}

type ViewMode = 'input' | 'result' | 'history';

export default function WritingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [records, setRecords] = useState<WritingRecord[]>([]);
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
      const res = await fetch('/api/writing');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.map((r: { id: string; content: string; score: number; feedback: string; createdAt: string }) => ({
          ...r,
          feedback: JSON.parse(r.feedback),
        })));
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
    if (content.trim().length < 10) {
      setError('作文内容至少需要10个字符');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '提交失败');
        return;
      }

      const data = await res.json();
      setFeedback(data.feedback);
      setViewMode('result');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setFeedback(null);
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

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 80) return 'bg-blue-50';
    if (score >= 70) return 'bg-amber-50';
    return 'bg-red-50';
  };

  if (viewMode === 'history') {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">批改历史</h1>
          <button
            onClick={() => setViewMode('input')}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            新建作文
          </button>
        </div>

        {historyLoading ? (
          <div className="py-12 text-center text-gray-500">加载中...</div>
        ) : records.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <p className="mb-4 text-gray-500">暂无批改记录</p>
            <button
              onClick={() => setViewMode('input')}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              开始写作
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(record => (
              <div key={record.id} className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg px-3 py-1.5 text-lg font-bold', getScoreColor(record.score), getScoreBg(record.score))}>
                      {record.score}分
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setFeedback(record.feedback);
                      setContent(record.content);
                      setViewMode('result');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    查看详情 →
                  </button>
                </div>
                <p className="line-clamp-2 text-sm text-gray-600">{record.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'result' && feedback) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">批改结果</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('history')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                批改历史
              </button>
              <button
                onClick={handleReset}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                新建作文
              </button>
            </div>
          </div>

          <div className={cn('mb-6 rounded-lg border p-6 text-center shadow-sm', getScoreBg(feedback.score))}>
            <div className={cn('text-5xl font-bold', getScoreColor(feedback.score))}>
              {feedback.score}
            </div>
            <div className="mt-1 text-sm text-gray-600">综合评分（满分100）</div>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-700">{feedback.evaluation}</p>
          </div>

          {feedback.grammarErrors.length > 0 && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                语法问题
                <span className="ml-2 text-sm font-normal text-red-500">({feedback.grammarErrors.length}处)</span>
              </h2>
              <div className="space-y-3">
                {feedback.grammarErrors.map((err, idx) => (
                  <div key={idx} className="rounded-lg border-l-4 border-red-300 bg-red-50 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                        原文：{err.original}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">建议：</span>{err.suggestion}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{err.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback.vocabularySuggestions.length > 0 && (
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                词汇升级建议
                <span className="ml-2 text-sm font-normal text-blue-500">({feedback.vocabularySuggestions.length}处)</span>
              </h2>
              <div className="space-y-3">
                {feedback.vocabularySuggestions.map((sug, idx) => (
                  <div key={idx} className="rounded-lg border-l-4 border-blue-300 bg-blue-50 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {sug.original}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-medium text-green-700">
                        {sug.better}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{sug.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">结构建议</h2>
            <ul className="space-y-2">
              {feedback.structureSuggestions.map((sug, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-amber-500">•</span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">修改参考</h2>
            <div className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {feedback.revisedVersion}
            </div>
            <p className="mt-2 text-xs text-gray-400">* 修改版本仅供参考，部分替换基于模板规则</p>
          </div>

          <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">我的原文</h2>
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
            <h1 className="text-2xl font-bold text-gray-900">AI 作文批改</h1>
            <p className="mt-1 text-sm text-gray-500">输入英语作文，获取评分、语法纠错、词汇建议和修改参考</p>
          </div>
          <button
            onClick={() => setViewMode('history')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            批改历史
          </button>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">英语作文</label>
            <span className="text-xs text-gray-400">
              字数：{wordCount} 词
            </span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="请在此输入你的英语作文...&#10;&#10;例如：&#10;Nowadays, more and more people realize the importance of English learning. In my opinion, there are several reasons for this trend. Firstly, English is widely used in international communication..."
            className="h-64 w-full rounded-lg border border-gray-300 p-4 text-sm leading-relaxed text-gray-700 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              建议字数：80-200词 | 支持四六级、高考等考试作文
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading || content.trim().length < 10}
              className={cn(
                'rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors',
                loading || content.trim().length < 10
                  ? 'cursor-not-allowed bg-gray-300'
                  : 'bg-primary-600 hover:bg-primary-700'
              )}
            >
              {loading ? '批改中...' : '开始批改'}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-primary-50 p-5">
          <h3 className="mb-2 text-sm font-bold text-primary-900">写作小贴士</h3>
          <ul className="space-y-1 text-xs text-primary-800">
            <li>• 使用丰富的连接词（however, moreover, therefore）增强逻辑性</li>
            <li>• 避免口语化表达（a lot of, get, thing），使用更正式的词汇</li>
            <li>• 注意段落结构：引言段 → 主体段 → 结论段</li>
            <li>• 添加具体的例子来支撑你的观点</li>
            <li>• 检查主谓一致、时态、冠词等常见语法问题</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
