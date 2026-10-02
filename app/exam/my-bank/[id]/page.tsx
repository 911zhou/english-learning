'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  sourceFileId: string;
  examType: string;
  section: string;
  questionType: string;
  difficulty: string;
  knowledgePoints: string[];
  tags: string[];
  content: string;
  options: string[];
  answer: string;
  analysis: string;
  createdAt: string;
}

interface FileData {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  questionCount: number;
}

export default function MyBankQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.id as string;

  const [file, setFile] = useState<FileData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showAnswer, setShowAnswer] = useState<string | null>(null);

  useEffect(() => {
    loadFile();
    loadQuestions();
  }, [fileId, page, filterType, filterDifficulty]);

  const loadFile = async () => {
    try {
      const res = await fetch('/api/user/upload');
      if (res.ok) {
        const files = await res.json();
        const found = files.find((f: FileData) => f.id === fileId);
        if (found) {
          setFile(found);
        } else {
          router.push('/exam/my-bank');
        }
      }
    } catch {
      // ignore
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sourceFileId: fileId,
        page: page.toString(),
        pageSize: '10',
      });
      if (filterType) params.set('questionType', filterType);
      if (filterDifficulty) params.set('difficulty', filterDifficulty);

      const res = await fetch(`/api/user/questions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/user/questions?id=${encodeURIComponent(questionId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadQuestions();
      }
    } catch {
      // ignore
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const styles: Record<string, string> = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', styles[difficulty] || styles.medium)}>
        {labels[difficulty] || difficulty}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reading: '阅读',
      cloze: '完形',
      writing: '写作',
      translation: '翻译',
      listening: '听力',
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6">
        <Link href="/exam/my-bank" className="text-sm text-gray-500 hover:text-primary-600">
          ← 返回我的题库
        </Link>
      </div>

      {file && (
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{file.fileName}</h1>
              <p className="mt-1 text-sm text-gray-500">
                共 {total} 题 · {file.fileType.toUpperCase()} 格式
              </p>
            </div>
            <Link
              href={`/exam/builder?fileId=${fileId}`}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              加入组卷
            </Link>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="">全部题型</option>
          <option value="reading">阅读</option>
          <option value="cloze">完形</option>
          <option value="writing">写作</option>
          <option value="translation">翻译</option>
          <option value="listening">听力</option>
        </select>

        <select
          value={filterDifficulty}
          onChange={e => { setFilterDifficulty(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">加载中...</p>
      ) : questions.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">暂无题目</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">第 {idx + 1 + (page - 1) * 10} 题</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {getTypeLabel(q.questionType)}
                    </span>
                    {getDifficultyBadge(q.difficulty)}
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-xs text-gray-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>

                <div className="mb-4 whitespace-pre-wrap text-sm text-gray-900">
                  {q.content}
                </div>

                {q.options.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowAnswer(showAnswer === q.id ? null : q.id)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {showAnswer === q.id ? '收起答案' : '查看答案'}
                  </button>

                  {showAnswer === q.id && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500">答案：</span>
                        <span className="text-sm text-gray-900">{q.answer}</span>
                      </div>
                      {q.analysis && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">解析：</span>
                          <p className="mt-1 text-sm text-gray-700">{q.analysis}</p>
                        </div>
                      )}
                      {q.knowledgePoints.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">知识点：</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {q.knowledgePoints.map((kp, i) => (
                              <span
                                key={i}
                                className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                              >
                                {kp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm text-gray-700">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
