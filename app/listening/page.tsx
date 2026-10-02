'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ListeningPlayer from '@/components/ListeningPlayer';

interface PaperInfo {
  id: string;
  examType: string;
  year: string;
  title: string;
  questionCount: number;
}

interface QuestionData {
  id: string;
  paperId: string;
  number: number;
  content: string;
  options: string[];
  answer: string;
  transcript: string;
  analysis: string;
}

interface PaperDetail {
  paper: {
    id: string;
    examType: string;
    year: string;
    title: string;
    audioUrl: string;
    questions: QuestionData[];
  };
  record: {
    score: number;
    correctCount: number;
    totalCount: number;
    createdAt: string;
  } | null;
}

interface SubmitResult {
  id: string;
  score: number;
  correctCount: number;
  totalCount: number;
  results: {
    questionId: string;
    number: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
  questions: {
    id: string;
    number: number;
    transcript: string;
    analysis: string;
  }[];
  createdAt: string;
}

type ViewMode = 'list' | 'practice' | 'result';

const examTypeLabels: Record<string, string> = {
  cet4: '四级',
  cet6: '六级',
  gaokao: '高考',
};

const examTypeColors: Record<string, string> = {
  cet4: 'bg-blue-100 text-blue-700',
  cet6: 'bg-purple-100 text-purple-700',
  gaokao: 'bg-green-100 text-green-700',
};

export default function ListeningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [view, setView] = useState<ViewMode>('list');
  const [papers, setPapers] = useState<PaperInfo[]>([]);
  const [records, setRecords] = useState<Record<string, { score: number; correctCount: number; totalCount: number }>>({});
  const [currentPaper, setCurrentPaper] = useState<PaperDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchPapers = useCallback(async () => {
    try {
      const res = await fetch('/api/listening');
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers);
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPapers();
    }
  }, [status, fetchPapers]);

  const openPaper = async (paperId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listening?paperId=${paperId}`);
      if (res.ok) {
        const data: PaperDetail = await res.json();
        setCurrentPaper(data);
        setAnswers({});
        setView('practice');
      }
    } catch (err) {
      console.error('Failed to load paper:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentPaper) return;
    setLoading(true);
    try {
      const res = await fetch('/api/listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: currentPaper.paper.id,
          answers,
        }),
      });
      if (res.ok) {
        const data: SubmitResult = await res.json();
        setSubmitResult(data);
        setView('result');
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setView('list');
    setCurrentPaper(null);
    setAnswers({});
    setSubmitResult(null);
    fetchPapers();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (view === 'practice' && currentPaper) {
    return <PracticeView paper={currentPaper} answers={answers} setAnswers={setAnswers} onSubmit={handleSubmit} onBack={goBack} />;
  }

  if (view === 'result' && submitResult && currentPaper) {
    return <ResultView result={submitResult} paper={currentPaper} onBack={goBack} />;
  }

  const filteredPapers = filter === 'all' ? papers : papers.filter(p => p.examType === filter);
  const grouped = filteredPapers.reduce<Record<string, PaperInfo[]>>((acc, p) => {
    if (!acc[p.examType]) acc[p.examType] = [];
    acc[p.examType].push(p);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">听力训练</h1>
          <p className="mt-1 text-sm text-gray-500">选择一套听力试卷开始练习</p>
        </div>
        <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
          返回仪表盘
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {['all', 'cet4', 'cet6', 'gaokao'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === t
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {t === 'all' ? '全部' : examTypeLabels[t]}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p className="mt-4 text-gray-500">暂无听力试卷</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, typePapers]) => (
          <div key={type} className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              {examTypeLabels[type]}听力
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {typePapers.map(paper => {
                const record = records[paper.id];
                return (
                  <button
                    key={paper.id}
                    onClick={() => openPaper(paper.id)}
                    className="rounded-lg border bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={cn('rounded px-2 py-0.5 text-xs font-medium', examTypeColors[paper.examType])}>
                        {examTypeLabels[paper.examType]}
                      </span>
                      {record && (
                        <span className={cn(
                          'text-xs font-medium',
                          record.score >= 80 ? 'text-green-600' : record.score >= 60 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          最高 {record.score}分
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900">{paper.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{paper.year} · {paper.questionCount} 题</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PracticeView({
  paper,
  answers,
  setAnswers,
  onSubmit,
  onBack,
}: {
  paper: PaperDetail;
  answers: Record<string, string>;
  setAnswers: (a: Record<string, string>) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const allTranscript = paper.paper.questions.map(q => q.transcript).join('\n\n');
  const answeredCount = Object.keys(answers).length;
  const totalCount = paper.paper.questions.length;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="mb-2 text-sm text-primary-600 hover:text-primary-700">
            ← 返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{paper.paper.title}</h1>
          <p className="mt-1 text-sm text-gray-500">共 {totalCount} 题 · 已答 {answeredCount} 题</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-800">听力音频</h2>
        <ListeningPlayer text={allTranscript} />
        <p className="text-xs text-gray-400">使用浏览器语音合成播放，建议先听音频再答题</p>
      </div>

      <div className="space-y-4">
        {paper.paper.questions.map(q => (
          <div key={q.id} className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-medium text-gray-900">
              <span className="mr-2 text-primary-600">{q.number}.</span>
              {q.content}
            </h3>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const letter = opt.charAt(0);
                const selected = answers[q.id] === letter;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.id]: letter })}
                    className={cn(
                      'flex w-full items-center rounded-lg border px-4 py-2.5 text-left text-sm transition-colors',
                      selected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={answeredCount === 0}
          className={cn(
            'rounded-lg px-8 py-3 text-sm font-medium transition-colors',
            answeredCount > 0
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          )}
        >
          提交答案 ({answeredCount}/{totalCount})
        </button>
      </div>
    </div>
  );
}

function ResultView({
  result,
  paper,
  onBack,
}: {
  result: SubmitResult;
  paper: PaperDetail;
  onBack: () => void;
}) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const scoreColor = result.score >= 80 ? 'text-green-600' : result.score >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = result.score >= 80 ? 'bg-green-50 border-green-200' : result.score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6">
        <button onClick={onBack} className="mb-2 text-sm text-primary-600 hover:text-primary-700">
          ← 返回列表
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{paper.paper.title} — 结果</h1>
      </div>

      <div className={cn('mb-6 rounded-lg border p-6 text-center', scoreBg)}>
        <div className={cn('text-4xl font-bold', scoreColor)}>{result.score}</div>
        <p className="mt-1 text-sm text-gray-600">
          答对 {result.correctCount} / {result.totalCount} 题
        </p>
        <div className="mx-auto mt-3 h-2 w-48 overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
            )}
            style={{ width: `${result.score}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {result.results.map(r => {
          const question = paper.paper.questions.find(q => q.id === r.questionId);
          const questionResult = result.questions.find(q => q.id === r.questionId);
          const isExpanded = expandedQ === r.questionId;

          return (
            <div key={r.questionId} className="rounded-lg border bg-white shadow-sm">
              <button
                onClick={() => setExpandedQ(isExpanded ? null : r.questionId)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                    r.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  )}>
                    {r.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    第 {r.number} 题
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>你的答案: {r.userAnswer || '未作答'}</span>
                  <span>·</span>
                  <span className="text-green-600">正确: {r.correctAnswer}</span>
                  <svg className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && question && questionResult && (
                <div className="border-t px-4 pb-4 pt-3">
                  <p className="mb-2 text-sm text-gray-700">{question.content}</p>

                  <div className="mb-3 space-y-1">
                    {question.options.map(opt => {
                      const letter = opt.charAt(0);
                      const isUserAnswer = letter === r.userAnswer;
                      const isCorrectAnswer = letter === r.correctAnswer;
                      return (
                        <div
                          key={opt}
                          className={cn(
                            'rounded px-3 py-1.5 text-sm',
                            isCorrectAnswer && 'bg-green-50 text-green-700 font-medium',
                            isUserAnswer && !isCorrectAnswer && 'bg-red-50 text-red-700 line-through',
                            !isUserAnswer && !isCorrectAnswer && 'text-gray-500'
                          )}
                        >
                          {opt}
                          {isCorrectAnswer && ' ✓'}
                          {isUserAnswer && !isCorrectAnswer && ' ✗'}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <h4 className="mb-1 text-xs font-semibold text-blue-800">听力原文</h4>
                    <p className="whitespace-pre-line text-sm text-blue-700">{questionResult.transcript}</p>
                  </div>

                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <h4 className="mb-1 text-xs font-semibold text-amber-800">解析</h4>
                    <p className="text-sm text-amber-700">{questionResult.analysis}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          返回听力列表
        </button>
      </div>
    </div>
  );
}
