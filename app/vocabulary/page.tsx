'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dailyWords } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function VocabularyPage() {
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());

  const toggleWord = (wordId: string) => {
    setRevealedWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">每日单词</h1>
          <p className="mb-2 text-gray-600">
            今日日期：{dailyWords.date} | 共 {dailyWords.words.length} 个单词
          </p>
          <p className="text-sm text-gray-500">
            点击单词卡片查看释义和例句
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/vocabulary/daily"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            互动学习模式
          </Link>
          <Link
            href="/vocabulary/wrong"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            我的错题本
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dailyWords.words.map((word) => {
          const isRevealed = revealedWords.has(word.id);
          return (
            <div
              key={word.id}
              onClick={() => toggleWord(word.id)}
              className={cn(
                'cursor-pointer rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md',
                isRevealed ? 'border-primary-300 bg-primary-50' : ''
              )}
            >
              <div className="mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {word.word}
                </h3>
                <p className="text-sm text-gray-500">{word.phonetic}</p>
              </div>

              {isRevealed ? (
                <>
                  <p className="mb-3 text-gray-700">{word.meaning}</p>
                  <div className="border-t pt-3">
                    <p className="mb-1 text-sm italic text-gray-600">
                      {word.example}
                    </p>
                    <p className="text-sm text-gray-500">
                      {word.exampleTranslation}
                    </p>
                  </div>
                  <div className="mt-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        word.level === 'cet4' && 'bg-blue-100 text-blue-700',
                        word.level === 'cet6' && 'bg-purple-100 text-purple-700',
                        word.level === 'gaokao' && 'bg-green-100 text-green-700'
                      )}
                    >
                      {word.level === 'cet4' && '四级'}
                      {word.level === 'cet6' && '六级'}
                      {word.level === 'gaokao' && '高考'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">点击查看释义</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-gray-50 p-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">学习提示</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• 每天坚持学习新单词，积少成多</li>
          <li>• 结合例句记忆单词，理解更深刻</li>
          <li>• 定期复习，巩固记忆效果</li>
          <li>• 尝试用新学的单词造句，加深印象</li>
        </ul>
      </div>
    </div>
  );
}
