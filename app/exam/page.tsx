'use client';

import { useState } from 'react';
import Link from 'next/link';
import { exams, getExamsByType } from '@/lib/data';
import { cn } from '@/lib/utils';

type ExamType = 'all' | 'cet4' | 'cet6' | 'gaokao';

export default function ExamPage() {
  const [filter, setFilter] = useState<ExamType>('all');

  const filteredExams = filter === 'all' 
    ? exams 
    : getExamsByType(filter as 'cet4' | 'cet6' | 'gaokao');

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">历年真题</h1>
        <p className="text-gray-600">
          四六级、高考英语真题练习，含听力、阅读、写作等完整题型
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/exam/builder"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600"
          >
            <span>💎</span>
            <span>VIP 自定义组卷</span>
          </Link>
          <Link
            href="/exam/my-papers"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            我的试卷
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'cet4', label: '四级' },
          { key: 'cet6', label: '六级' },
          { key: 'gaokao', label: '高考' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as ExamType)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              filter === item.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="group relative rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <Link
              href={`/exam/${exam.id}`}
              className="absolute inset-0 z-10"
              aria-label={exam.title}
            />
            <div className="mb-3 flex items-center gap-2">
              {exam.type === 'cet4' ? (
                <Link
                  href="/exam/cet4"
                  className="relative z-20 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  四级
                </Link>
              ) : (
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    exam.type === 'cet6' && 'bg-purple-100 text-purple-700',
                    exam.type === 'gaokao' && 'bg-green-100 text-green-700'
                  )}
                >
                  {exam.type === 'cet6' && '六级'}
                  {exam.type === 'gaokao' && '高考'}
                </span>
              )}
              <span className="text-sm text-gray-500">{exam.year}年</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {exam.title}
            </h3>
            <p className="mb-4 text-sm text-gray-600">{exam.description}</p>
            <div className="mb-4 flex gap-4 text-sm text-gray-500">
              <span>
                {exam.isComplete
                  ? `${exam.questionCount} 题`
                  : `${exam.actualQuestionCount}/${exam.questionCount} 题`}
              </span>
              <span>{exam.duration} 分钟</span>
            </div>
            <span className="block w-full rounded-md bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700">
              查看详情
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
