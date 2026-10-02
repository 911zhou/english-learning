'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface WordData {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  translation: string;
  level: string;
  status: string;
}

interface CheckinData {
  today: string;
  checkedIn: boolean;
  consecutiveDays: number;
  totalCheckins: number;
  calendarData: Record<string, { questionsDone: number; wordsLearned: number; checkin: boolean }>;
}

export default function DailyVocabularyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [words, setWords] = useState<WordData[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [checkedInNow, setCheckedInNow] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const [wordsRes, checkinRes] = await Promise.all([
        fetch('/api/vocabulary/daily'),
        fetch('/api/checkin'),
      ]);
      if (wordsRes.ok) {
        const wordsData = await wordsRes.json();
        setWords(wordsData.words);
        setDate(wordsData.date);
      }
      if (checkinRes.ok) {
        setCheckinData(await checkinRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleReveal = (wordId: string) => {
    setRevealedWords(prev => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
      return next;
    });
  };

  const markWord = async (wordId: string, wordStatus: 'mastered' | 'not_mastered') => {
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, status: wordStatus } : w));

    try {
      await fetch('/api/vocabulary/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabularyId: wordId, status: wordStatus }),
      });
    } catch (e) {
      console.error(e);
    }

    const allReviewed = words.every(w => w.id === wordId ? true : w.status !== 'new');
    if (allReviewed && checkinData && !checkinData.checkedIn) {
      try {
        const res = await fetch('/api/checkin', { method: 'POST' });
        if (res.ok) {
          setCheckedInNow(true);
          setCheckinData(prev => prev ? { ...prev, checkedIn: true, consecutiveDays: prev.consecutiveDays + 1 } : prev);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakWord = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!session) return null;

  const reviewedCount = words.filter(w => w.status !== 'new').length;
  const masteredCount = words.filter(w => w.status === 'mastered').length;
  const progress = words.length > 0 ? Math.round((reviewedCount / words.length) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">每日单词</h1>
          <p className="text-gray-600">{date} | 共 {words.length} 个单词</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/vocabulary/wrong"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            错题本
          </Link>
          <Link
            href="/vocabulary"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            单词列表
          </Link>
        </div>
      </div>

      {/* Progress & Check-in */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-gray-500">学习进度</div>
          <div className="mb-2 flex items-end gap-1">
            <span className="text-2xl font-bold text-primary-600">{reviewedCount}</span>
            <span className="text-sm text-gray-500">/ {words.length}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-gray-500">已掌握</div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-green-600">{masteredCount}</span>
            <span className="text-sm text-gray-500">个单词</span>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            未掌握: {words.filter(w => w.status === 'not_mastered').length}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm text-gray-500">连续打卡</div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-amber-600">{checkinData?.consecutiveDays || 0}</span>
            <span className="text-sm text-gray-500">天</span>
          </div>
          {checkinData?.checkedIn || checkedInNow ? (
            <div className="mt-2 text-sm text-green-600">今日已打卡</div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">复习完所有单词后自动打卡</div>
          )}
        </div>
      </div>

      {checkedInNow && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          恭喜！已完成今日单词学习，自动打卡成功！连续学习 {checkinData?.consecutiveDays || 0} 天
        </div>
      )}

      {/* Word Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {words.map((wordData, idx) => {
          const isRevealed = revealedWords.has(wordData.id);
          return (
            <div
              key={wordData.id}
              className={cn(
                'rounded-lg border bg-white p-5 shadow-sm transition-all',
                wordData.status === 'mastered' && 'border-green-200 bg-green-50',
                wordData.status === 'not_mastered' && 'border-red-200 bg-red-50',
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">#{idx + 1}</span>
                  <h3 className="text-xl font-bold text-gray-900">{wordData.word}</h3>
                  <button
                    onClick={() => speakWord(wordData.word)}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"
                    title="发音"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-gray-500">{wordData.phonetic}</span>
              </div>

              <div className="mb-2">
                <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{wordData.partOfSpeech}</span>
                <span className="text-gray-800">{wordData.meaning}</span>
              </div>

              {isRevealed ? (
                <>
                  <div className="mb-3 border-t pt-3">
                    <p className="mb-1 text-sm italic text-gray-600">{wordData.example}</p>
                    <p className="text-sm text-gray-500">{wordData.translation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markWord(wordData.id, 'mastered')}
                      className={cn(
                        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        wordData.status === 'mastered'
                          ? 'bg-green-600 text-white'
                          : 'border border-green-300 text-green-700 hover:bg-green-50'
                      )}
                    >
                      已掌握
                    </button>
                    <button
                      onClick={() => markWord(wordData.id, 'not_mastered')}
                      className={cn(
                        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        wordData.status === 'not_mastered'
                          ? 'bg-red-500 text-white'
                          : 'border border-red-300 text-red-700 hover:bg-red-50'
                      )}
                    >
                      未掌握
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => toggleReveal(wordData.id)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50"
                >
                  点击展开释义
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      {checkinData && (
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">学习日历</h2>
          <CalendarView calendarData={checkinData.calendarData} />
        </div>
      )}
    </div>
  );
}

function CalendarView({ calendarData }: { calendarData: Record<string, { questionsDone: number; wordsLearned: number; checkin: boolean }> }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthName = `${year}年${month + 1}月`;
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="mb-3 text-center font-medium text-gray-700">{monthName}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {dayNames.map(d => (
          <div key={d} className="py-1 text-xs text-gray-500">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const dateStr = getDateStr(day);
          const data = calendarData[dateStr];
          const isToday = day === today.getDate();
          const hasCheckin = data?.checkin;
          const hasActivity = data && (data.questionsDone > 0 || data.wordsLearned > 0);

          return (
            <div
              key={day}
              className={cn(
                'relative rounded-md py-2 text-sm',
                isToday && 'ring-2 ring-primary-400',
                hasCheckin && 'bg-green-100 text-green-800 font-medium',
                hasActivity && !hasCheckin && 'bg-blue-50 text-blue-700',
                !hasActivity && !isToday && 'text-gray-600',
              )}
              title={data ? `做题: ${data.questionsDone}, 单词: ${data.wordsLearned}${hasCheckin ? ' (已打卡)' : ''}` : ''}
            >
              {day}
              {hasCheckin && <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-green-500" />}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-100" /> 已打卡</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-50" /> 有学习</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded ring-2 ring-primary-400" /> 今天</span>
      </div>
    </div>
  );
}
