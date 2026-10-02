'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AbilityData {
  stars: number;
  errors: number;
  count: number;
}

interface ReportData {
  last7Days: Array<{
    date: string;
    questionsDone: number;
    wordsLearned: number;
    accuracy: number;
  }>;
  totalQuestions7d: number;
  totalWords7d: number;
  avgAccuracy7d: number;
  abilityAnalysis: {
    reading: AbilityData;
    vocabulary: AbilityData;
    grammar: AbilityData;
    listening: AbilityData;
  };
  wrongTrend: Array<{ date: string; newWrong: number }>;
  totalWrongQuestions: number;
  totalWordsMastered: number;
  totalExamsTaken: number;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={cn('text-base', i <= stars ? 'text-amber-400' : 'text-gray-300')}>
          ★
        </span>
      ))}
    </span>
  );
}

function abilityLabel(stars: number): string {
  if (stars >= 5) return '优秀';
  if (stars >= 4) return '良好';
  if (stars >= 3) return '一般';
  if (stars >= 2) return '需加强';
  return '薄弱';
}

export default function ReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/report')
        .then(res => res.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!data) return null;

  const maxQuestions = Math.max(1, ...data.last7Days.map(d => d.questionsDone));
  const maxWords = Math.max(1, ...data.last7Days.map(d => d.wordsLearned));

  const abilities = [
    { key: 'reading', label: '阅读理解', data: data.abilityAnalysis.reading, color: 'blue' },
    { key: 'vocabulary', label: '词汇运用', data: data.abilityAnalysis.vocabulary, color: 'green' },
    { key: 'grammar', label: '语法填空', data: data.abilityAnalysis.grammar, color: 'purple' },
    { key: 'listening', label: '听力理解', data: data.abilityAnalysis.listening, color: 'amber' },
  ];

  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">学习报告</h1>
          <p className="text-gray-600">近7天学习数据分析</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          返回Dashboard
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: '做题总数', value: data.totalQuestions7d, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: '学词总数', value: data.totalWords7d, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '平均正确率', value: `${data.avgAccuracy7d}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '错题总数', value: data.totalWrongQuestions, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className={cn('rounded-lg p-5 text-center', card.bg)}>
            <div className={cn('text-2xl font-bold', card.color)}>{card.value}</div>
            <div className="mt-1 text-sm text-gray-600">{card.label}</div>
          </div>
        ))}
      </div>

      {/* 7-Day Trend Chart */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">7天学习趋势</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Questions & Words Chart */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-600">做题 & 学词</h3>
            <div className="flex h-36 items-end gap-2">
              {data.last7Days.map((day, idx) => {
                const qH = (day.questionsDone / maxQuestions) * 100;
                const wH = (day.wordsLearned / maxWords) * 100;
                return (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-full w-full items-end gap-0.5">
                      <div className="flex h-full flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-primary-400 transition-all"
                          style={{ height: `${Math.max(qH, 2)}%` }}
                          title={`做题: ${day.questionsDone}`}
                        />
                      </div>
                      <div className="flex h-full flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-green-400 transition-all"
                          style={{ height: `${Math.max(wH, 2)}%` }}
                          title={`单词: ${day.wordsLearned}`}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary-400" /> 做题</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-400" /> 单词</span>
            </div>
          </div>

          {/* Accuracy Trend */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-600">正确率趋势</h3>
            <div className="flex h-36 items-end gap-2">
              {data.last7Days.map((day, idx) => {
                const h = day.accuracy;
                return (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-full w-full items-end">
                      <div className="h-full w-full flex flex-col justify-end">
                        <div
                          className={cn(
                            'w-full rounded-t transition-all',
                            day.accuracy >= 80 ? 'bg-green-400' : day.accuracy >= 60 ? 'bg-amber-400' : 'bg-red-400'
                          )}
                          style={{ height: `${Math.max(h, 2)}%` }}
                          title={`正确率: ${day.accuracy}%`}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-400" /> ≥80%</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-400" /> 60-79%</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-400" /> &lt;60%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ability Analysis */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">能力分析</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {abilities.map(ability => {
            const colors = colorMap[ability.color];
            return (
              <div key={ability.key} className={cn('rounded-lg border p-4', colors.border, colors.bg)}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-gray-900">{ability.label}</span>
                  <StarRating stars={ability.data.stars} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium', colors.text)}>
                    {abilityLabel(ability.data.stars)}
                  </span>
                  <span className="text-gray-500">
                    错题 {ability.data.count} 道 · 错误 {ability.data.errors} 次
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded bg-gray-50 p-3 text-sm text-gray-600">
          <span className="font-medium">建议：</span>
          {(() => {
            const weakest = abilities.reduce((a, b) => a.data.stars <= b.data.stars ? a : b);
            if (weakest.data.stars >= 4) return '各项能力均衡，继续保持！可以尝试更高难度的练习。';
            return `${weakest.label}是目前的薄弱环节（${abilityLabel(weakest.data.stars)}），建议重点加强该方面的练习。`;
          })()}
        </div>
      </div>

      {/* Summary & Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-gray-900">累计数据</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">完成试卷</span>
              <span className="font-medium text-gray-900">{data.totalExamsTaken} 套</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">已掌握单词</span>
              <span className="font-medium text-gray-900">{data.totalWordsMastered} 个</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">错题总数</span>
              <span className="font-medium text-gray-900">{data.totalWrongQuestions} 道</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-gray-900">快捷操作</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/vocabulary/wrong" className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              错题本
            </Link>
            <Link href="/vocabulary/wrong/practice" className="rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700">
              错题重练
            </Link>
            <Link href="/study/plan" className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              每日计划
            </Link>
            <Link href="/exam" className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              去做题
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
