'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getExamById } from '@/lib/data';
import { getExamStructure } from '@/lib/exam-config';
import { cn } from '@/lib/utils';

interface DashboardData {
  totalExams: number;
  avgAccuracy: number;
  bestScoreRate: number;
  totalWrong: number;
  wrongByType?: { cet4: number; cet6: number; gaokao: number };
  wrongTotalErrors?: number;
  recentResults: Array<{
    id: string;
    examId: string;
    score: number;
    totalScore: number;
    reportedScore: number;
    correctCount: number;
    wrongCount: number;
    isComplete: boolean;
    completedAt: string;
  }>;
  consecutiveDays: number;
  todayQuestions: number;
  todayWords: number;
  todayCheckedIn: boolean;
  totalWordsMastered: number;
  last7Days: Array<{
    date: string;
    questionsDone: number;
    wordsLearned: number;
  }>;
  aiUsage: {
    writing: { used: number; limit: number; remaining: number };
    translation: { used: number; limit: number; remaining: number };
    analysis: { used: number; limit: number; remaining: number };
  };
  profile: {
    experience: number;
    level: number;
    levelName: string;
    streakDays: number;
    totalStudyDays: number;
    progress: { current: number; nextThreshold: number; percent: number };
    membership: {
      plan: string;
      status: string;
      expireAt: string | null;
      isVIP: boolean;
    };
  };
}

interface WeaknessData {
  totalWrong: number;
  totalErrors: number;
  byType: Array<{
    type: string;
    label: string;
    count: number;
    errors: number;
    percentage: number;
  }>;
  byExamType: Array<{
    examType: string;
    label: string;
    errors: number;
  }>;
  topWeaknesses: Array<{
    type: string;
    label: string;
    count: number;
    errors: number;
    percentage: number;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [weakness, setWeakness] = useState<WeaknessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/user/stats').then(res => res.json()),
        fetch('/api/user/wrong/weakness').then(res => res.ok ? res.json() : null),
      ])
        .then(([statsData, weaknessData]) => {
          setData(statsData);
          setWeakness(weaknessData);
        })
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

  if (!session) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const wordsTaskProgress = Math.min(100, Math.round(((data?.todayWords || 0) / 20) * 100));
  const questionsTaskProgress = Math.min(100, Math.round(((data?.todayQuestions || 0) / 10) * 100));

  const maxTrend = Math.max(
    1,
    ...(data?.last7Days.map(d => Math.max(d.questionsDone, d.wordsLearned)) || [1])
  );

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          你好，{session.user?.name || '同学'}
        </h1>
        <p className="text-gray-600">这是你的学习概览，继续保持！</p>
      </div>

      {/* User Level Card */}
      {data?.profile && (
        <div className="mb-6 rounded-lg border bg-gradient-to-r from-primary-50 to-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
                Lv{data.profile.level}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{data.profile.levelName}</span>
                  {data.profile.membership.isVIP && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">VIP</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  经验值 {data.profile.experience} · 连续学习 {data.profile.streakDays} 天
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {data.profile.level >= 5 ? '已满级' : `距下一级还需 ${data.profile.progress.nextThreshold - data.profile.experience} 经验`}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Lv{data.profile.level}</span>
              <span>{data.profile.progress.percent}%</span>
              <span>Lv{Math.min(5, data.profile.level + 1)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${data.profile.progress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Learning Overview */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: '连续学习', value: `${data?.consecutiveDays || 0}天`, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '今日做题', value: data?.todayQuestions || 0, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: '今日单词', value: data?.todayWords || 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '已掌握单词', value: data?.totalWordsMastered || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className={cn('rounded-lg p-5 text-center', stat.bg)}>
            <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
            <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Tasks & Trend Chart */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {/* Today's Tasks */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">今日任务</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700">学习 20 个单词</span>
                <span className={cn(
                  'font-medium',
                  wordsTaskProgress >= 100 ? 'text-green-600' : 'text-gray-500'
                )}>
                  {data?.todayWords || 0} / 20
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    wordsTaskProgress >= 100 ? 'bg-green-500' : 'bg-primary-500'
                  )}
                  style={{ width: `${wordsTaskProgress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700">完成 10 道练习题</span>
                <span className={cn(
                  'font-medium',
                  questionsTaskProgress >= 100 ? 'text-green-600' : 'text-gray-500'
                )}>
                  {data?.todayQuestions || 0} / 10
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    questionsTaskProgress >= 100 ? 'bg-green-500' : 'bg-primary-500'
                  )}
                  style={{ width: `${questionsTaskProgress}%` }}
                />
              </div>
            </div>
          </div>
          {data?.todayCheckedIn && (
            <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              今日已打卡！继续保持连续学习记录
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/vocabulary/daily"
              className="rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              去学单词
            </Link>
            <Link
              href="/exam"
              className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              去做题
            </Link>
          </div>
          <Link
            href="/study/plan"
            className="mt-2 block text-center text-sm text-primary-600 hover:text-primary-700"
          >
            查看每日计划 →
          </Link>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">学习趋势（近7天）</h2>
            <Link
              href="/dashboard/report"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              详细报告 →
            </Link>
          </div>
          {data?.last7Days && data.last7Days.length > 0 ? (
            <div>
              <div className="flex h-40 items-end gap-2">
                {data.last7Days.map((day, idx) => {
                  const qHeight = (day.questionsDone / maxTrend) * 100;
                  const wHeight = (day.wordsLearned / maxTrend) * 100;
                  const dateLabel = day.date.slice(5);
                  return (
                    <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-full w-full items-end gap-0.5">
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full rounded-t bg-primary-400 transition-all"
                            style={{ height: `${Math.max(qHeight, 2)}%` }}
                            title={`做题: ${day.questionsDone}`}
                          />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className="w-full rounded-t bg-green-400 transition-all"
                            style={{ height: `${Math.max(wHeight, 2)}%` }}
                            title={`单词: ${day.wordsLearned}`}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{dateLabel}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary-400" /> 做题数</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-400" /> 单词数</span>
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: '完成试卷', value: data?.totalExams || 0, color: 'text-primary-600', bg: 'bg-primary-50', href: '/exam/history' },
          { label: '平均正确率', value: `${data?.avgAccuracy || 0}%`, color: 'text-green-600', bg: 'bg-green-50', href: undefined },
          { label: '最高得分率', value: `${data?.bestScoreRate || 0}%`, color: 'text-amber-600', bg: 'bg-amber-50', href: undefined },
          { label: '错题数', value: data?.totalWrong || 0, color: 'text-red-600', bg: 'bg-red-50', href: '/vocabulary/wrong' },
        ].map(stat => {
          const inner = (
            <>
              <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
              <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
            </>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className={cn('rounded-lg p-5 text-center transition-shadow hover:shadow-md', stat.bg)}>
              {inner}
            </Link>
          ) : (
            <div key={stat.label} className={cn('rounded-lg p-5 text-center', stat.bg)}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* AI Usage Today */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">AI 今日剩余次数</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: '作文批改', usage: data?.aiUsage?.writing, color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-500', href: '/writing' },
            { label: 'AI翻译', usage: data?.aiUsage?.translation, color: 'text-green-600', bg: 'bg-green-50', barColor: 'bg-green-500', href: '/translation' },
            { label: '错题解析', usage: data?.aiUsage?.analysis, color: 'text-amber-600', bg: 'bg-amber-50', barColor: 'bg-amber-500', href: '/vocabulary/wrong' },
          ].map(item => {
            const used = item.usage?.used ?? 0;
            const limit = item.usage?.limit ?? 0;
            const remaining = item.usage?.remaining ?? 0;
            const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
            return (
              <Link key={item.label} href={item.href} className={cn('rounded-lg p-4 transition-shadow hover:shadow-md', item.bg)}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className={cn('text-lg font-bold', remaining === 0 ? 'text-red-500' : item.color)}>
                    {remaining}/{limit}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-red-400' : item.barColor)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  已用 {used} 次，剩余 {remaining} 次
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Wrong Question Stats */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">错题统计</h2>
          <div className="flex gap-2">
            <Link
              href="/vocabulary/wrong"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              去错题本
            </Link>
            <Link
              href="/vocabulary/wrong/practice"
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
            >
              错题重练
            </Link>
          </div>
        </div>
        {data && data.totalWrong > 0 ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: '四级错题', value: data.wrongByType?.cet4 || 0, color: 'text-blue-600' },
              { label: '六级错题', value: data.wrongByType?.cet6 || 0, color: 'text-purple-600' },
              { label: '高考错题', value: data.wrongByType?.gaokao || 0, color: 'text-green-600' },
              { label: '累计错误次数', value: data.wrongTotalErrors || 0, color: 'text-red-600' },
            ].map(item => (
              <div key={item.label} className="rounded-lg border p-4 text-center">
                <div className={cn('text-xl font-bold', item.color)}>{item.value}</div>
                <div className="mt-1 text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-gray-500">
            暂无错题记录，做题后错题会自动归类到这里
          </div>
        )}
      </div>

      {/* Weakness Analysis */}
      {weakness && weakness.totalWrong > 0 && (
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">我的薄弱项</h2>
            <Link
              href="/vocabulary/wrong"
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600"
            >
              生成训练卷
            </Link>
          </div>
          <div className="space-y-3">
            {weakness.byType.map(item => (
              <div key={item.type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="text-gray-500">{item.count}题 · {item.errors}次错误 · {item.percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      item.percentage >= 40 ? 'bg-red-500' : item.percentage >= 25 ? 'bg-amber-500' : 'bg-green-500'
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {weakness.topWeaknesses.length > 0 && (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">
                最大薄弱项：<span className="font-medium">{weakness.topWeaknesses[0].label}</span>
                （占比 {weakness.topWeaknesses[0].percentage}%），建议重点突破
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">最近成绩</h2>
          {data?.recentResults && data.recentResults.length > 0 ? (
            <div className="space-y-3">
              {data.recentResults.map(r => {
                const exam = getExamById(r.examId);
                const examStructure = getExamStructure(r.examId);
                const maxReported = examStructure?.totalReportedScore ?? 710;
                const total = r.correctCount + r.wrongCount;
                const accuracy = total > 0 ? Math.round((r.correctCount / total) * 100) : 0;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {exam?.title || r.examId}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(r.completedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">
                        {r.reportedScore > 0 ? `${r.reportedScore} / ${maxReported}` : `${r.score.toFixed(1)} / ${r.totalScore.toFixed(1)}`}
                      </p>
                      <p className={cn(
                        'text-xs',
                        accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        正确率 {accuracy}%
                        {!r.isComplete && ' · 部分题目'}
                      </p>
                    </div>
                  </div>
                );
              })}
              <Link
                href="/exam/history"
                className="block text-center text-sm text-primary-600 hover:text-primary-700"
              >
                查看全部记录
              </Link>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-3 text-sm text-gray-500">还没有做题记录</p>
              <Link
                href="/exam"
                className="inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                去做题
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">快捷入口</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/exam', label: '历年真题', icon: '📝' },
              { href: '/vocabulary/daily', label: '每日单词', icon: '📚' },
              { href: '/vocabulary/wrong', label: '错题本', icon: '📋' },
              { href: '/exam/history', label: '答题记录', icon: '📊' },
              { href: '/translation', label: 'AI翻译', icon: '' },
              { href: '/writing', label: 'AI作文批改', icon: '✍️' },
              { href: '/listening', label: '听力训练', icon: '🎧' },
              { href: '/study/plan', label: '每日计划', icon: '🎯' },
              { href: '/dashboard/report', label: '学习报告', icon: '📈' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-primary-50 p-6">
        <h2 className="mb-3 text-lg font-bold text-primary-900">学习小贴士</h2>
        <ul className="space-y-2 text-sm text-primary-800">
          <li>• 每天坚持学习 20 个单词，积少成多</li>
          <li>• 完成单词学习后自动打卡，保持连续学习记录</li>
          <li>• 及时复习错题本中的题目，巩固薄弱环节</li>
          <li>• 登录状态下做题，成绩会自动保存到云端</li>
        </ul>
      </div>
    </div>
  );
}
