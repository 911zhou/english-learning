'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Ability {
  type: string;
  label: string;
  stars: number;
  errors: number;
  count: number;
  percentage: number;
}

interface TodayTask {
  title: string;
  description: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

interface YesterdaySummary {
  wordsStudied: number;
  questionsDone: number;
  examsTaken: number;
  writingsDone: number;
}

interface AssistantData {
  weakness: {
    abilities: Ability[];
    totalWrong: number;
    totalErrors: number;
  };
  todayTasks: TodayTask[];
  summary: YesterdaySummary;
  recommendations: string[];
}

function StarRating({ stars, max = 5 }: { stars: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn('text-base', i < stars ? 'text-amber-400' : 'text-gray-300')}>
          ★
        </span>
      ))}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { label: '优先', className: 'bg-red-100 text-red-700' },
    medium: { label: '建议', className: 'bg-amber-100 text-amber-700' },
    low: { label: '可选', className: 'bg-gray-100 text-gray-600' },
  };
  const c = config[priority];
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', c.className)}>
      {c.label}
    </span>
  );
}

export default function AssistantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AssistantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/assistant')
        .then(res => {
          if (!res.ok) throw new Error('加载失败');
          return res.json();
        })
        .then(setData)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">正在生成你的学习建议...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!session || !data) return null;

  const { weakness, todayTasks, summary, recommendations } = data;

  const totalSummaryItems = summary.wordsStudied + summary.questionsDone + summary.examsTaken + summary.writingsDone;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">AI 学习助手</h1>
        <p className="text-gray-600">根据你的学习数据，为你生成个性化建议</p>
      </div>

      {/* 薄弱能力分析 */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">薄弱能力分析</h2>
        {weakness.totalWrong > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {weakness.abilities.map(ability => (
              <div
                key={ability.type}
                className={cn(
                  'rounded-lg border p-4',
                  ability.stars <= 2 ? 'border-red-200 bg-red-50' :
                  ability.stars <= 3 ? 'border-amber-200 bg-amber-50' :
                  'border-green-200 bg-green-50'
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-gray-900">{ability.label}</span>
                  <StarRating stars={ability.stars} />
                </div>
                {ability.errors > 0 ? (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{ability.count}</span> 道错题 ·{' '}
                    <span className="font-medium">{ability.errors}</span> 次错误
                    {ability.percentage > 0 && (
                      <span className="ml-1">({ability.percentage}%)</span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-green-600">表现优秀，继续保持</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-3 text-sm text-gray-500">还没有错题记录，做题后会自动分析你的薄弱项</p>
            <Link
              href="/exam"
              className="inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              去做题
            </Link>
          </div>
        )}
      </div>

      {/* 今日任务推荐 + 学习总结 */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {/* 今日任务推荐 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">今日任务推荐</h2>
          <div className="space-y-3">
            {todayTasks.map((task, idx) => (
              <Link
                key={idx}
                href={task.href}
                className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <span className="mt-0.5 text-xl">{task.icon}</span>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="text-xs text-gray-500">{task.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 学习总结 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">昨日学习总结</h2>
          {totalSummaryItems > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '学习单词', value: summary.wordsStudied, unit: '个', color: 'text-green-600', bg: 'bg-green-50' },
                { label: '完成题目', value: summary.questionsDone, unit: '道', color: 'text-primary-600', bg: 'bg-primary-50' },
                { label: '完成考试', value: summary.examsTaken, unit: '次', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: '写作练习', value: summary.writingsDone, unit: '篇', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(item => (
                <div key={item.label} className={cn('rounded-lg p-4 text-center', item.bg)}>
                  <div className={cn('text-2xl font-bold', item.color)}>
                    {item.value}
                    <span className="ml-0.5 text-sm font-normal text-gray-500">{item.unit}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{item.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-3 text-sm text-gray-500">昨日没有学习记录</p>
              <Link
                href="/vocabulary/daily"
                className="inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                开始今日学习
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* AI学习建议 */}
      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">AI 学习建议</h2>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg bg-blue-50 p-4"
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {idx + 1}
              </span>
              <p className="text-sm leading-relaxed text-gray-700">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="rounded-lg bg-primary-50 p-6">
        <h2 className="mb-3 text-lg font-bold text-primary-900">继续学习</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { href: '/vocabulary/daily', label: '每日单词', icon: '📚' },
            { href: '/vocabulary/wrong', label: '错题本', icon: '📋' },
            { href: '/exam', label: '真题练习', icon: '📝' },
            { href: '/writing', label: 'AI写作', icon: '✍️' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm transition-colors hover:shadow-md"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
