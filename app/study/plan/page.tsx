'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StudyPlanData {
  date: string;
  wordsTarget: number;
  questionsTarget: number;
  readingTarget: number;
  completedWords: number;
  completedQuestions: number;
  completedReading: number;
}

export default function StudyPlanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/study-plan')
        .then(res => res.json())
        .then(setPlan)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  const refreshPlan = () => {
    fetch('/api/user/study-plan')
      .then(res => res.json())
      .then(setPlan)
      .catch(console.error);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!plan) return null;

  const wordsProgress = Math.min(100, Math.round((plan.completedWords / plan.wordsTarget) * 100));
  const questionsProgress = Math.min(100, Math.round((plan.completedQuestions / plan.questionsTarget) * 100));
  const readingProgress = Math.min(100, Math.round((plan.completedReading / plan.readingTarget) * 100));
  const overallProgress = Math.round((wordsProgress + questionsProgress + readingProgress) / 3);

  const tasks = [
    {
      title: '学习单词',
      description: `学习 ${plan.wordsTarget} 个新单词`,
      progress: plan.completedWords,
      target: plan.wordsTarget,
      percent: wordsProgress,
      href: '/vocabulary/daily',
      actionText: '去学单词',
      color: 'green',
      icon: '📚',
    },
    {
      title: '错题重练',
      description: `完成 ${plan.questionsTarget} 道错题练习`,
      progress: plan.completedQuestions,
      target: plan.questionsTarget,
      percent: questionsProgress,
      href: '/vocabulary/wrong/practice',
      actionText: '去重练',
      color: 'red',
      icon: '📋',
    },
    {
      title: '阅读练习',
      description: `完成 ${plan.readingTarget} 篇阅读理解`,
      progress: plan.completedReading,
      target: plan.readingTarget,
      percent: readingProgress,
      href: '/exam',
      actionText: '去做题',
      color: 'blue',
      icon: '📖',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; bar: string; light: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-500', light: 'bg-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-500', light: 'bg-red-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500', light: 'bg-blue-100' },
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">每日学习计划</h1>
        <p className="text-gray-600">{plan.date} · 坚持每天学习，积少成多</p>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">今日进度</h2>
            <p className="text-sm text-gray-500">
              {overallProgress >= 100 ? '今日任务已全部完成！' : `已完成 ${overallProgress}%`}
            </p>
          </div>
          <div className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold',
            overallProgress >= 100 ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'
          )}>
            {overallProgress}%
          </div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              overallProgress >= 100 ? 'bg-green-500' : 'bg-primary-500'
            )}
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          />
        </div>
      </div>

      {/* Task Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {tasks.map(task => {
          const colors = colorMap[task.color];
          return (
            <div key={task.title} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{task.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{task.title}</h3>
                  <p className="text-xs text-gray-500">{task.description}</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {task.progress} / {task.target}
                  </span>
                  <span className={cn('font-medium', task.percent >= 100 ? 'text-green-600' : 'text-gray-500')}>
                    {task.percent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn('h-full rounded-full transition-all', task.percent >= 100 ? 'bg-green-500' : colors.bar)}
                    style={{ width: `${Math.min(100, task.percent)}%` }}
                  />
                </div>
              </div>
              {task.percent >= 100 ? (
                <div className={cn('rounded-md px-3 py-2 text-center text-sm font-medium', colors.light, colors.text)}>
                  已完成
                </div>
              ) : (
                <Link
                  href={task.href}
                  className={cn('block rounded-md px-3 py-2 text-center text-sm font-medium text-white transition-colors', colors.bar, `hover:opacity-90`)}
                >
                  {task.actionText}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="rounded-lg bg-primary-50 p-6">
        <h3 className="mb-2 text-sm font-bold text-primary-900">学习建议</h3>
        <ul className="space-y-1 text-sm text-primary-800">
          <li>• 建议先学习单词，再做阅读和错题练习</li>
          <li>• 错题重练时，重点关注错误次数多的题目</li>
          <li>• 每天坚持完成计划，保持学习连续性</li>
          <li>• 完成所有任务后记得打卡</li>
        </ul>
      </div>
    </div>
  );
}
