'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getResults, getResultsFromServer } from '@/lib/storage';
import { getExamById } from '@/lib/data';
import { getExamStructure } from '@/lib/exam-config';
import { ExamResult } from '@/types';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { data: session } = useSession();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [customPaperTitles, setCustomPaperTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      let data: ExamResult[];
      if (session?.user) {
        data = await getResultsFromServer();
      } else {
        data = getResults();
      }
      const sorted = data.sort((a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      setResults(sorted);

      const customIds = sorted
        .filter(r => r.examSource === 'custom')
        .map(r => r.examId);
      if (customIds.length > 0 && session?.user) {
        try {
          const res = await fetch('/api/exam/paper');
          if (res.ok) {
            const papers = await res.json();
            const titleMap: Record<string, string> = {};
            for (const p of papers) {
              if (customIds.includes(p.id)) {
                titleMap[p.id] = p.title;
              }
            }
            setCustomPaperTitles(titleMap);
          }
        } catch {
          // ignore
        }
      }

      setLoading(false);
    }
    load();
  }, [session]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">答题记录</h1>
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mb-2 text-lg font-medium text-gray-500">暂无答题记录</p>
          <p className="mb-6 text-sm text-gray-400">完成一套试卷后，记录将显示在这里</p>
          <Link
            href="/exam"
            className="inline-block rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            去做题
          </Link>
        </div>
      </div>
    );
  }

  const totalExams = results.length;
  const avgAccuracy = totalExams > 0
    ? Math.round(results.reduce((sum, r) => {
        const total = r.correctCount + r.wrongCount;
        return sum + (total > 0 ? (r.correctCount / total) * 100 : 0);
      }, 0) / totalExams)
    : 0;
  const bestScore = results.reduce((best, r) => {
    if (r.examSource === 'custom') {
      const pct = r.totalScore > 0 ? (r.score / r.totalScore) * 100 : 0;
      return pct > best ? pct : best;
    }
    const maxReported = getExamStructure(r.examId)?.totalReportedScore ?? 710;
    const pct = r.reportedScore && r.reportedScore > 0
      ? (r.reportedScore / maxReported) * 100
      : (r.correctCount + r.wrongCount) > 0
        ? (r.score / r.totalScore) * 100 : 0;
    return pct > best ? pct : best;
  }, 0);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">答题记录</h1>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-primary-50 p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{totalExams}</div>
          <div className="text-sm text-gray-600">完成试卷</div>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{avgAccuracy}%</div>
          <div className="text-sm text-gray-600">平均正确率</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{Math.round(bestScore)}%</div>
          <div className="text-sm text-gray-600">最高得分率</div>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result, idx) => {
          const isCustom = result.examSource === 'custom';
          const exam = isCustom ? null : getExamById(result.examId);
          const examStructure = isCustom ? null : getExamStructure(result.examId);
          const maxReported = examStructure?.totalReportedScore ?? 710;
          const totalQuestions = examStructure?.totalQuestions ?? 0;
          const title = isCustom
            ? (customPaperTitles[result.examId] || '自定义试卷')
            : (exam?.title || result.examId);
          const total = result.correctCount + result.wrongCount;
          const accuracy = total > 0 ? Math.round((result.correctCount / total) * 100) : 0;
          const hasReported = !isCustom && result.reportedScore !== undefined && result.reportedScore > 0;
          const scorePct = hasReported
            ? Math.round((result.reportedScore! / maxReported) * 100)
            : result.totalScore > 0 ? Math.round((result.score / result.totalScore) * 100) : 0;
          const answeredCount = result.sectionResults
            ? result.sectionResults.reduce((sum, s) => sum + s.answeredCount, 0)
            : total;
          const unansweredCount = totalQuestions > 0 ? Math.max(0, totalQuestions - answeredCount) : 0;
          const redoLink = isCustom ? `/exam/custom/${result.examId}` : `/exam/${result.examId}`;

          return (
            <div
              key={idx}
              className="rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {title}
                    {isCustom && (
                      <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">自定义</span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(result.completedAt)}
                    {result.isComplete === false && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">部分题目</span>
                    )}
                  </p>
                </div>
                <div className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium',
                  accuracy >= 80 ? 'bg-green-100 text-green-700' :
                  accuracy >= 60 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {accuracy}%
                </div>
              </div>

              <div className="mb-3 grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-primary-600">
                    {hasReported ? result.reportedScore : result.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">{hasReported ? '报告分' : '得分'}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-700">
                    {hasReported ? maxReported : result.totalScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">{hasReported ? '满分' : '总分'}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{result.correctCount}</div>
                  <div className="text-xs text-gray-500">正确</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{result.wrongCount}</div>
                  <div className="text-xs text-gray-500">错误</div>
                </div>
              </div>

              {totalQuestions > 0 && (
                <div className="mb-3 flex items-center gap-4 rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span>完成：<span className="font-medium text-gray-900">{answeredCount}/{totalQuestions}题</span></span>
                  {unansweredCount > 0 && (
                    <span>未完成：<span className="font-medium text-amber-600">{unansweredCount}题</span></span>
                  )}
                  <span>正确：<span className="font-medium text-green-600">{result.correctCount}</span></span>
                  <span>错误：<span className="font-medium text-red-600">{result.wrongCount}</span></span>
                </div>
              )}

              <div className="mb-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      scorePct >= 70 ? 'bg-green-500' : scorePct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${scorePct}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-gray-500">得分率 {scorePct}%</div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={redoLink}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  再做一次
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
