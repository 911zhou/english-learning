'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getWrongQuestions, removeWrongQuestion, clearWrongQuestions,
  getWrongQuestionsFromServer, removeWrongQuestionFromServer, clearWrongQuestionsFromServer,
  WrongQuestion,
} from '@/lib/storage';
import { getQuestionById } from '@/lib/questions';
import { getExamById } from '@/lib/data';
import { cn } from '@/lib/utils';

type SortMode = 'recent' | 'count';
type FilterType = 'all' | 'cet4' | 'cet6' | 'gaokao';

export default function WrongBookPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [wrongList, setWrongList] = useState<WrongQuestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genCount, setGenCount] = useState(20);
  const [genExamType, setGenExamType] = useState('cet4');
  const [genQuestionTypes, setGenQuestionTypes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const isAuth = !!session?.user;

  useEffect(() => {
    async function load() {
      if (isAuth) {
        setWrongList(await getWrongQuestionsFromServer());
      } else {
        setWrongList(getWrongQuestions());
      }
      setLoading(false);
    }
    load();
  }, [isAuth]);

  const availableExams = useMemo(() => {
    const examIds = new Set<string>();
    wrongList.forEach(w => {
      const q = getQuestionById(w.questionId);
      if (q) examIds.add(q.examId);
    });
    return Array.from(examIds)
      .map(id => getExamById(id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
  }, [wrongList]);

  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    wrongList.forEach(w => {
      const q = getQuestionById(w.questionId);
      if (!q) return;
      if (filterType !== 'all') {
        const exam = getExamById(q.examId);
        if (exam?.type !== filterType) return;
      }
      if (filterExamId !== 'all' && q.examId !== filterExamId) return;
      sections.add(q.section);
    });
    return Array.from(sections);
  }, [wrongList, filterType, filterExamId]);

  const filteredAndSorted = useMemo(() => {
    let list = [...wrongList];

    if (filterType !== 'all') {
      list = list.filter(w => {
        const q = getQuestionById(w.questionId);
        if (!q) return false;
        const exam = getExamById(q.examId);
        return exam?.type === filterType;
      });
    }

    if (filterExamId !== 'all') {
      list = list.filter(w => {
        const q = getQuestionById(w.questionId);
        return q?.examId === filterExamId;
      });
    }

    if (filterSection !== 'all') {
      list = list.filter(w => {
        const q = getQuestionById(w.questionId);
        return q?.section === filterSection;
      });
    }

    if (sortMode === 'count') {
      list.sort((a, b) => b.count - a.count);
    } else {
      list.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
    }

    return list;
  }, [wrongList, filterType, filterExamId, filterSection, sortMode]);

  const practiceUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (filterType !== 'all') params.set('type', filterType);
    if (filterExamId !== 'all') params.set('examId', filterExamId);
    if (filterSection !== 'all') params.set('section', filterSection);
    const qs = params.toString();
    return `/vocabulary/wrong/practice${qs ? `?${qs}` : ''}`;
  }, [filterType, filterExamId, filterSection]);

  const stats = useMemo(() => {
    const total = wrongList.length;
    const totalErrors = wrongList.reduce((sum, w) => sum + w.count, 0);
    const byExam: Record<string, number> = {};
    wrongList.forEach(w => {
      const q = getQuestionById(w.questionId);
      if (q) byExam[q.examId] = (byExam[q.examId] || 0) + 1;
    });
    return { total, totalErrors, examCount: Object.keys(byExam).length };
  }, [wrongList]);

  const handleRemove = async (questionId: string) => {
    if (isAuth) {
      await removeWrongQuestionFromServer(questionId);
    } else {
      removeWrongQuestion(questionId);
    }
    setWrongList(prev => prev.filter(w => w.questionId !== questionId));
  };

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有错题记录吗？')) return;
    if (isAuth) {
      await clearWrongQuestionsFromServer();
    } else {
      clearWrongQuestions();
    }
    setWrongList([]);
  };

  const toggleQuestionType = (type: string) => {
    setGenQuestionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    setGenerateError('');
    setGenerating(true);
    try {
      const res = await fetch('/api/exam/paper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: genCount,
          examType: genExamType,
          questionTypes: genQuestionTypes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowGenerateModal(false);
        router.push(`/exam/custom/${data.paperId}`);
      } else {
        setGenerateError(data.error || '生成失败');
      }
    } catch {
      setGenerateError('网络错误，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">错题本</h1>
        <p className="text-gray-600">回顾做错的题目，巩固薄弱环节</p>
      </div>

      {stats.total > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.total}</div>
            <div className="text-sm text-gray-600">错题数</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.totalErrors}</div>
            <div className="text-sm text-gray-600">累计错误次数</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.examCount}</div>
            <div className="text-sm text-gray-600">涉及试卷</div>
          </div>
        </div>
      )}

      {stats.total > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">考试</span>
              {[
                { key: 'all' as const, label: '全部' },
                { key: 'cet4' as const, label: '四级' },
                { key: 'cet6' as const, label: '六级' },
                { key: 'gaokao' as const, label: '高考' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => { setFilterType(item.key); setFilterExamId('all'); setFilterSection('all'); }}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    filterType === item.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {availableExams.length > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">试卷</span>
                <select
                  value={filterExamId}
                  onChange={e => { setFilterExamId(e.target.value); setFilterSection('all'); }}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
                >
                  <option value="all">全部试卷</option>
                  {availableExams.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
            )}
            {availableSections.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">题型</span>
                <select
                  value={filterSection}
                  onChange={e => setFilterSection(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
                >
                  <option value="all">全部题型</option>
                  {availableSections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">排序</span>
              <button
                onClick={() => setSortMode('recent')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  sortMode === 'recent'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                最近错误
              </button>
              <button
                onClick={() => setSortMode('count')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  sortMode === 'count'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                错误次数
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:from-amber-600 hover:to-orange-600"
              >
                生成专项训练卷
              </button>
              <Link
                href={practiceUrl}
                className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
              >
                开始错题重练
              </Link>
              <button
                onClick={handleClearAll}
                className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                清空错题
              </button>
            </div>
          </div>
        </div>
      )}

      {wrongList.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">暂无错题</h2>
          <p className="mb-6 text-gray-600">继续保持，加油！</p>
          <Link
            href="/exam"
            className="inline-block rounded-md bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            去做题
          </Link>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">当前筛选条件下没有错题</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSorted.map(wrong => {
            const question = getQuestionById(wrong.questionId);
            if (!question) return null;
            const exam = getExamById(question.examId);
            const isExpanded = expandedId === wrong.questionId;

            return (
              <div
                key={wrong.questionId}
                className="rounded-lg border bg-white shadow-sm"
              >
                <div
                  className="cursor-pointer p-4"
                  onClick={() => setExpandedId(isExpanded ? null : wrong.questionId)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        错{wrong.count}次
                      </span>
                      {exam && (
                        <span className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium',
                          exam.type === 'cet4' && 'bg-blue-100 text-blue-700',
                          exam.type === 'cet6' && 'bg-purple-100 text-purple-700',
                          exam.type === 'gaokao' && 'bg-green-100 text-green-700',
                        )}>
                          {exam.type === 'cet4' ? '四级' : exam.type === 'cet6' ? '六级' : '高考'}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{question.section}</span>
                      <span className="text-sm text-gray-400">· 第{question.number}题</span>
                      <span className="text-xs text-gray-400">{formatDate(wrong.lastAt)}</span>
                    </div>
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                  <p className="text-gray-700">{question.content}</p>
                  <div className="mt-2 text-sm">
                    <span className="text-red-600">你的答案：{wrong.lastAnswer}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-green-600">正确答案：{question.answer}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    {question.passage && (
                      <div className="mb-3 rounded bg-white p-3 text-sm leading-relaxed text-gray-700">
                        {question.passage.split('\n').map((line, i) => (
                          <p key={i} className={line.startsWith('W:') || line.startsWith('M:') ? 'ml-2' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                    {question.options && (
                      <div className="mb-3 space-y-1">
                        {question.options.map(opt => (
                          <div
                            key={opt.charAt(0)}
                            className={cn(
                              'rounded p-2 text-sm',
                              opt.charAt(0) === question.answer
                                ? 'bg-green-50 text-green-700'
                                : 'text-gray-600'
                            )}
                          >
                            {opt}
                            {opt.charAt(0) === question.answer && (
                              <span className="ml-2 text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mb-3 rounded bg-white p-3 text-sm text-gray-700">
                      <span className="font-medium">解析：</span>{question.explanation}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(wrong.questionId);
                        }}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                      >
                        已掌握，移除
                      </button>
                      <Link
                        href={`/exam/practice?id=${question.examId}`}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        重做此卷
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowGenerateModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-gray-900">生成专项训练卷</h2>
            <p className="mb-6 text-sm text-gray-600">根据你的错题记录，自动生成针对性训练试卷</p>

            {generateError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {generateError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">题量</label>
                <div className="flex gap-2">
                  {[10, 20, 50].map(n => (
                    <button
                      key={n}
                      onClick={() => setGenCount(n)}
                      className={cn(
                        'flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                        genCount === n
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {n}题
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">考试类型</label>
                <div className="flex gap-2">
                  {[
                    { key: 'cet4', label: '四级' },
                    { key: 'cet6', label: '六级' },
                    { key: 'gaokao', label: '高考' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setGenExamType(item.key)}
                      className={cn(
                        'flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                        genExamType === item.key
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">题型筛选（可选）</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'listening', label: '听力' },
                    { key: 'reading', label: '阅读' },
                    { key: 'cloze', label: '完形' },
                    { key: 'writing', label: '写作' },
                    { key: 'translation', label: '翻译' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => toggleQuestionType(item.key)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                        genQuestionTypes.includes(item.key)
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">不选则包含所有题型</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className={cn(
                    'flex-1 rounded-md px-4 py-2.5 text-sm font-bold text-white transition-colors',
                    generating
                      ? 'cursor-not-allowed bg-gray-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                  )}
                >
                  {generating ? '生成中...' : '开始生成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
