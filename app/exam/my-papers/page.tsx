'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CustomPaper {
  id: string;
  title: string;
  examType: string;
  duration: number;
  totalScore: number;
  createdAt: string;
  questions: { id: string }[];
}

export default function MyPapersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [papers, setPapers] = useState<CustomPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/exam/paper');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 403) {
          router.push('/exam');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setPapers(data);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleDelete = async (paperId: string) => {
    setDeletingId(paperId);
    try {
      const res = await fetch(`/api/exam/paper?id=${encodeURIComponent(paperId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPapers(prev => prev.filter(p => p.id !== paperId));
      }
    } catch {
      // ignore
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const examTypeLabels: Record<string, string> = {
    cet4: 'CET-4',
    cet6: 'CET-6',
    gaokao: '高考',
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的试卷</h1>
        <Link
          href="/exam/builder"
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          组新试卷
        </Link>
      </div>

      {papers.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mb-2 text-lg font-medium text-gray-500">还没有自定义试卷</p>
          <p className="mb-6 text-sm text-gray-400">从题库中选题，创建属于你的专属试卷</p>
          <Link
            href="/exam/builder"
            className="inline-block rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            开始组卷
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map(paper => (
            <div
              key={paper.id}
              className="rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{paper.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span>{examTypeLabels[paper.examType] || paper.examType}</span>
                    <span>{paper.questions.length} 题</span>
                    <span>满分 {paper.totalScore} 分</span>
                    <span>{paper.duration} 分钟</span>
                    <span>{formatDate(paper.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/exam/custom/${paper.id}`}
                  className="rounded-md bg-primary-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  开始考试
                </Link>
                <Link
                  href="/exam/builder"
                  className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  组新卷
                </Link>
                {confirmDeleteId === paper.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">确认删除？</span>
                    <button
                      onClick={() => handleDelete(paper.id)}
                      disabled={deletingId === paper.id}
                      className={cn(
                        'rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700',
                        deletingId === paper.id && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      删除
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(paper.id)}
                    className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
