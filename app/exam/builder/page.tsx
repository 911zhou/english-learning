'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  examId: string;
  type: string;
  section: string;
  number: number;
  content: string;
  options?: string[];
  answer: string;
  score?: number;
  difficulty?: string;
}

interface PaperQuestion {
  questionId: string;
  score: number;
  question?: Question;
}

type SourceTab = 'official' | 'wrong' | 'uploaded';

const examTypes = [
  { value: 'cet4', label: '四级' },
  { value: 'cet6', label: '六级' },
  { value: 'gaokao', label: '高考' },
];

const questionTypes = [
  { value: 'listening', label: '听力' },
  { value: 'reading', label: '阅读' },
  { value: 'writing', label: '写作' },
  { value: 'translation', label: '翻译' },
  { value: 'cloze', label: '完形填空' },
];

const sourceTabs: { key: SourceTab; label: string }[] = [
  { key: 'official', label: '官方题库' },
  { key: 'wrong', label: '错题本' },
  { key: 'uploaded', label: '我的题库' },
];

export default function ExamBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isVIP, setIsVIP] = useState(false);

  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('cet4');
  const [duration, setDuration] = useState(120);

  const [sourceTab, setSourceTab] = useState<SourceTab>('official');
  const [officialQuestions, setOfficialQuestions] = useState<Question[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; fileName: string; questionCount: number }>>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [selectedQuestions, setSelectedQuestions] = useState<PaperQuestion[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterSection, setFilterSection] = useState('');

  const [saving, setSaving] = useState(false);

  const currentQuestions = sourceTab === 'official'
    ? officialQuestions
    : sourceTab === 'wrong'
      ? wrongQuestions
      : uploadedQuestions;

  const loadWrongQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/user/wrong');
      if (!res.ok) return;
      const wrongs = await res.json();
      const { getQuestionById } = await import('@/lib/questions');
      const mapped: Question[] = wrongs
        .map((w: { questionId: string; examId: string }, idx: number) => {
          const q = getQuestionById(w.questionId);
          if (!q) return null;
          return { ...q, number: idx + 1 };
        })
        .filter(Boolean) as Question[];
      setWrongQuestions(mapped);
    } catch {
      // ignore
    }
  }, []);

  const loadUploadedFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/user/upload');
      if (!res.ok) return;
      const files = await res.json();
      const completedFiles = files.filter((f: any) => f.status === 'completed' && f.questionCount > 0);
      setUploadedFiles(completedFiles);
      if (completedFiles.length > 0 && !selectedFileId) {
        setSelectedFileId(completedFiles[0].id);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadUploadedQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ pageSize: '100' });
      if (selectedFileId) params.set('sourceFileId', selectedFileId);

      const res = await fetch(`/api/user/questions?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const mapped: Question[] = (data.questions || []).map((q: {
        id: string;
        sourceType: string;
        examType: string;
        section: string;
        questionType: string;
        content: string;
        options: string[];
        answer: string;
        difficulty: string;
      }, idx: number) => ({
        id: `user-q-${q.id}`,
        examId: q.examType || 'custom',
        type: q.questionType || 'reading',
        section: q.section || '自定义',
        number: idx + 1,
        content: q.content,
        options: q.options || [],
        answer: q.answer,
        difficulty: q.difficulty,
      }));
      setUploadedQuestions(mapped);
    } catch {
      // ignore
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      Promise.all([
        fetch('/api/user/profile').then(r => r.json()),
        fetch('/api/questions?examType=' + examType).then(r => r.json()),
      ])
        .then(([profile, qs]) => {
          setIsVIP(profile.membership.isVIP);
          setOfficialQuestions(qs.questions || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load data:', err);
          setLoading(false);
        });
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch('/api/questions?examType=' + examType)
        .then(r => r.json())
        .then(qs => setOfficialQuestions(qs.questions || []))
        .catch(err => console.error('Failed to load questions:', err));
    }
  }, [examType, status, session]);

  useEffect(() => {
    if (sourceTab === 'wrong') loadWrongQuestions();
    if (sourceTab === 'uploaded') {
      loadUploadedFiles();
      loadUploadedQuestions();
    }
  }, [sourceTab, loadWrongQuestions, loadUploadedFiles, loadUploadedQuestions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fileId = params.get('fileId');
      if (fileId) {
        setSelectedFileId(fileId);
        setSourceTab('uploaded');
      }
    }
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!session) return null;

  if (!isVIP) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="mx-auto max-w-md rounded-lg border bg-white p-8 shadow-sm">
          <div className="mb-4 text-5xl">💎</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">VIP 专属功能</h1>
          <p className="mb-6 text-gray-600">自定义组卷系统仅对 VIP 用户开放</p>
          <button
            onClick={() => router.push('/vip')}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:from-amber-600 hover:to-yellow-600"
          >
            升级 VIP
          </button>
        </div>
      </div>
    );
  }

  const filteredQuestions = currentQuestions.filter(q => {
    if (filterType && q.type !== filterType) return false;
    if (filterSection && q.section !== filterSection) return false;
    return true;
  });

  const addQuestion = (q: Question) => {
    if (selectedQuestions.find(sq => sq.questionId === q.id)) return;
    setSelectedQuestions([...selectedQuestions, { questionId: q.id, score: 2 }]);
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter(sq => sq.questionId !== questionId));
  };

  const updateScore = (questionId: string, score: number) => {
    setSelectedQuestions(
      selectedQuestions.map(sq => (sq.questionId === questionId ? { ...sq, score } : sq))
    );
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= selectedQuestions.length) return;
    const newQuestions = [...selectedQuestions];
    [newQuestions[idx], newQuestions[newIdx]] = [newQuestions[newIdx], newQuestions[idx]];
    setSelectedQuestions(newQuestions);
  };

  const calculateTotal = () => {
    return selectedQuestions.reduce((sum, sq) => sum + sq.score, 0);
  };

  const findQuestion = (qId: string): Question | undefined => {
    return officialQuestions.find(q => q.id === qId)
      || wrongQuestions.find(q => q.id === qId)
      || uploadedQuestions.find(q => q.id === qId);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('请输入试卷名称');
      return;
    }
    if (selectedQuestions.length === 0) {
      alert('请至少选择一道题目');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/exam/paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          examType,
          duration,
          totalScore: calculateTotal(),
          questions: selectedQuestions.map(sq => ({
            questionId: sq.questionId,
            score: sq.score,
          })),
        }),
      });

      if (res.ok) {
        alert('试卷保存成功！');
        router.push('/exam/my-papers');
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const sections = Array.from(new Set(currentQuestions.map(q => q.section).filter(Boolean)));

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">自定义组卷</h1>
          <p className="text-gray-600">从题库中选择题目，创建你的专属试卷</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/exam/my-bank"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            我的题库
          </Link>
          <Link
            href="/exam/upload"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            上传试卷
          </Link>
          <Link
            href="/exam/my-papers"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            我的试卷
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Paper Settings */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">试卷设置</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  试卷名称
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="输入试卷名称"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  考试类型
                </label>
                <select
                  value={examType}
                  onChange={e => setExamType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {examTypes.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  考试时间（分钟）
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  min={1}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">已选题目</span>
                  <span className="font-bold text-gray-900">{selectedQuestions.length} 道</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">总分</span>
                  <span className="font-bold text-primary-600">{calculateTotal()} 分</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'w-full rounded-lg py-3 font-bold text-white transition-all',
                  saving
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-primary-600 hover:bg-primary-700'
                )}
              >
                {saving ? '保存中...' : '保存试卷'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Selection */}
        <div className="lg:col-span-2">
          {/* Source Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg border bg-white p-1 shadow-sm">
            {sourceTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSourceTab(tab.key)}
                className={cn(
                  'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  sourceTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {tab.label}
                {tab.key === 'wrong' && wrongQuestions.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                    {wrongQuestions.length}
                  </span>
                )}
                {tab.key === 'uploaded' && uploadedQuestions.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                    {uploadedQuestions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {sourceTab === 'uploaded' && uploadedFiles.length === 0 && (
            <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="mb-2 text-sm text-gray-500">暂无个人题库</p>
              <p className="mb-4 text-xs text-gray-400">上传试卷并解析后，题目将显示在这里</p>
              <Link
                href="/exam/upload"
                className="inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                上传试卷
              </Link>
            </div>
          )}

          {sourceTab === 'uploaded' && uploadedFiles.length > 0 && (
            <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                选择试卷文件
              </label>
              <select
                value={selectedFileId}
                onChange={e => setSelectedFileId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {uploadedFiles.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.fileName} ({f.questionCount} 题)
                  </option>
                ))}
              </select>
            </div>
          )}

          {sourceTab === 'wrong' && wrongQuestions.length === 0 && (
            <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="mb-2 text-sm text-gray-500">错题本为空</p>
              <p className="text-xs text-gray-400">做题时答错的题目会自动收录到错题本</p>
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  题型筛选
                </label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">全部题型</option>
                  {questionTypes.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  部分筛选
                </label>
                <select
                  value={filterSection}
                  onChange={e => setFilterSection(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">全部部分</option>
                  {sections.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Selected Questions */}
          {selectedQuestions.length > 0 && (
            <div className="mb-4 rounded-lg border bg-primary-50 p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-gray-900">已选题目（{selectedQuestions.length}）</h3>
              <div className="space-y-2">
                {selectedQuestions.map((sq, idx) => {
                  const q = findQuestion(sq.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={sq.questionId}
                      className="flex items-center gap-3 rounded-md bg-white p-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-900">
                          {q.type} - 第 {q.number} 题
                        </div>
                        <div className="text-xs text-gray-500">
                          {q.content.substring(0, 50)}...
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={sq.score}
                          onChange={e => updateScore(sq.questionId, Number(e.target.value))}
                          min={0.5}
                          step={0.5}
                          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="text-sm text-gray-500">分</span>
                        <button
                          onClick={() => moveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveQuestion(idx, 'down')}
                          disabled={idx === selectedQuestions.length - 1}
                          className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeQuestion(sq.questionId)}
                          className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Questions */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-bold text-gray-900">
              可选题目（{filteredQuestions.length}）
            </h3>
            {filteredQuestions.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {sourceTab === 'official' ? '当前筛选条件下没有题目' :
                 sourceTab === 'wrong' ? '错题本为空' : '个人题库为空'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredQuestions.map(q => {
                  const isSelected = selectedQuestions.find(sq => sq.questionId === q.id);
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'flex items-center gap-3 rounded-md border p-3 transition-all',
                        isSelected
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50'
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {q.type}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            第 {q.number} 题
                          </span>
                          {q.section && (
                            <span className="text-xs text-gray-500">{q.section}</span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {q.content.substring(0, 80)}...
                        </div>
                      </div>
                      <button
                        onClick={() => addQuestion(q)}
                        disabled={!!isSelected}
                        className={cn(
                          'rounded-md px-4 py-2 text-sm font-medium transition-all',
                          isSelected
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        )}
                      >
                        {isSelected ? '已选择' : '添加'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
