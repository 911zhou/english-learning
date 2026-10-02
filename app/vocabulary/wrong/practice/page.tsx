'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getWrongQuestions, getWrongQuestionsFromServer,
  removeWrongQuestion, removeWrongQuestionFromServer,
  saveWrongQuestion, saveWrongQuestionToServer,
  WrongQuestion,
} from '@/lib/storage';
import { getQuestionById } from '@/lib/questions';
import { getExamById } from '@/lib/data';
import { Question } from '@/types';
import { cn } from '@/lib/utils';
import { WrongQuestionAnalysis } from '@/lib/ai';

interface QueueItem {
  wrong: WrongQuestion;
  question: Question;
}

type AnswerState = 'answering' | 'correct' | 'wrong';

function WrongPracticeContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAuth = !!session?.user;

  const filterType = searchParams.get('type') || 'all';
  const filterExamId = searchParams.get('examId') || 'all';
  const filterSection = searchParams.get('section') || 'all';

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('answering');
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Array<{ questionId: string; correct: boolean }>>([]);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(1);
  const wrongListRef = useRef<WrongQuestion[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<WrongQuestionAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const list = isAuth ? await getWrongQuestionsFromServer() : getWrongQuestions();
      wrongListRef.current = list;
      setQueue(buildQueue(list));
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, filterType, filterExamId, filterSection, round]);

  function buildQueue(list: WrongQuestion[]): QueueItem[] {
    return list
      .map(w => ({ wrong: w, question: getQuestionById(w.questionId) }))
      .filter((item): item is QueueItem => {
        if (!item.question) return false;
        if (removedIds.has(item.question.id)) return false;
        if (item.question.type === 'writing' || item.question.type === 'translation') return false;
        if (filterType !== 'all') {
          const exam = getExamById(item.question.examId);
          if (exam?.type !== filterType) return false;
        }
        if (filterExamId !== 'all' && item.question.examId !== filterExamId) return false;
        if (filterSection !== 'all' && item.question.section !== filterSection) return false;
        return true;
      })
      .sort((a, b) => b.wrong.count - a.wrong.count);
  }

  const current = queue[idx];
  const totalAnswered = results.length;
  const totalCorrect = results.filter(r => r.correct).length;

  const isTextInput = useMemo(
    () => !!current && (!current.question.options || current.question.options.length === 0),
    [current]
  );

  const handleSubmit = () => {
    if (!current || answerState !== 'answering') return;
    const ua = isTextInput ? textAnswer.trim() : selected;
    if (!ua) return;

    const correct = isTextInput
      ? ua.toLowerCase() === current.question.answer.trim().toLowerCase()
      : ua === current.question.answer;

    setResults(prev => [...prev, { questionId: current.question.id, correct }]);

    if (correct) {
      setAnswerState('correct');
    } else {
      setAnswerState('wrong');
      saveWrongQuestion(current.question.examId, current.question.id, ua);
      if (isAuth) {
        saveWrongQuestionToServer(current.question.examId, current.question.id, ua);
      }
      wrongListRef.current = wrongListRef.current.map(w =>
        w.questionId === current.question.id
          ? { ...w, count: w.count + 1, lastAnswer: ua, lastAt: new Date().toISOString() }
          : w
      );
    }
  };

  const handleRemove = async () => {
    if (!current) return;
    const qid = current.question.id;
    if (isAuth) {
      await removeWrongQuestionFromServer(qid);
    } else {
      removeWrongQuestion(qid);
    }
    setRemovedIds(prev => new Set(prev).add(qid));
    goNext();
  };

  const goNext = () => {
    if (idx + 1 >= queue.length) {
      setFinished(true);
    } else {
      setIdx(idx + 1);
      setSelected('');
      setTextAnswer('');
      setAnswerState('answering');
      setShowAnalysis(false);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!current || !isAuth) return;
    setAnalysisLoading(true);
    setShowAnalysis(true);
    try {
      const res = await fetch('/api/user/wrong/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: current.question.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (e) {
      console.error('AI分析失败', e);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const restart = () => {
    setIdx(0);
    setSelected('');
    setTextAnswer('');
    setAnswerState('answering');
    setResults([]);
    setFinished(false);
    setQueue(buildQueue(wrongListRef.current));
    setRound(r => r + 1);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">没有需要重练的错题</h2>
        <p className="mb-6 text-gray-600">当前筛选条件下暂无错题</p>
        <Link
          href="/vocabulary/wrong"
          className="inline-block rounded-md bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          返回错题本
        </Link>
      </div>
    );
  }

  if (finished) {
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">本轮重练完成</h2>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-primary-50 p-4">
              <div className="text-2xl font-bold text-primary-600">{totalAnswered}</div>
              <div className="text-sm text-gray-600">已练题数</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-2xl font-bold text-green-600">{totalCorrect}</div>
              <div className="text-sm text-gray-600">答对</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="text-2xl font-bold text-amber-600">{accuracy}%</div>
              <div className="text-sm text-gray-600">正确率</div>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={restart}
              className="rounded-md bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              再练一轮
            </button>
            <Link
              href="/vocabulary/wrong"
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              返回错题本
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const q = current.question;
  const exam = getExamById(q.examId);
  const userAnswerDisplay = isTextInput ? textAnswer.trim() : selected;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/vocabulary/wrong" className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回错题本
        </Link>
        <span className="text-sm text-gray-500">
          第 {idx + 1} / {queue.length} 题 · 已答对 {totalCorrect}
        </span>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${((idx + (answerState !== 'answering' ? 1 : 0)) / queue.length) * 100}%` }}
        />
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-wrap items-center gap-2">
            {exam && (
              <span className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                exam.type === 'cet4' && 'bg-blue-100 text-blue-700',
                exam.type === 'cet6' && 'bg-purple-100 text-purple-700',
                exam.type === 'gaokao' && 'bg-green-100 text-green-700',
              )}>
                {exam.type === 'cet4' ? '四级' : exam.type === 'cet6' ? '六级' : '高考'}
              </span>
            )}
            <span className="text-sm text-gray-500">{q.section}</span>
            <span className="text-sm text-gray-400">· 第{q.number}题</span>
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              错{current.wrong.count}次
            </span>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {q.passage && (
            <details className="mb-4 rounded bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">查看原文 / 材料</summary>
              <div className="mt-2 text-sm leading-relaxed text-gray-700">
                {q.passage.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('W:') || line.startsWith('M:') ? 'ml-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            </details>
          )}

          <p className="mb-4 text-gray-900">{q.content}</p>

          {isTextInput ? (
            <div className="mb-4">
              <input
                type="text"
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                disabled={answerState !== 'answering'}
                placeholder="请输入答案"
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm focus:outline-none',
                  answerState === 'correct' && 'border-green-500 bg-green-50',
                  answerState === 'wrong' && 'border-red-500 bg-red-50',
                  answerState === 'answering' && 'border-gray-300 focus:border-primary-500'
                )}
              />
            </div>
          ) : (
            <div className="mb-4 space-y-2">
              {q.options!.map(opt => {
                const letter = opt.charAt(0);
                const isChosen = selected === letter;
                const isAnswer = answerState !== 'answering' && letter === q.answer;
                const isWrongChoice = answerState === 'wrong' && isChosen;
                return (
                  <button
                    key={letter}
                    onClick={() => answerState === 'answering' && setSelected(letter)}
                    disabled={answerState !== 'answering'}
                    className={cn(
                      'w-full rounded-md border p-3 text-left text-sm transition-colors',
                      isAnswer && 'border-green-500 bg-green-50 text-green-800',
                      isWrongChoice && 'border-red-500 bg-red-50 text-red-800',
                      !isAnswer && !isWrongChoice && isChosen && 'border-primary-500 bg-primary-50',
                      !isAnswer && !isWrongChoice && !isChosen && 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {opt}
                    {isAnswer && <span className="ml-2 text-green-600">✓</span>}
                    {isWrongChoice && <span className="ml-2 text-red-600">✗</span>}
                  </button>
                );
              })}
            </div>
          )}

          {answerState === 'answering' ? (
            <button
              onClick={handleSubmit}
              disabled={isTextInput ? !textAnswer.trim() : !selected}
              className="rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              提交答案
            </button>
          ) : (
            <div>
              <div className={cn(
                'mb-3 rounded-md p-3 text-sm font-medium',
                answerState === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                {answerState === 'correct' ? '回答正确！' : `回答错误。你的答案：${userAnswerDisplay}，正确答案：${q.answer}`}
              </div>
              <div className="mb-4 rounded bg-gray-50 p-3 text-sm text-gray-700">
                <span className="font-medium">解析：</span>{q.explanation}
              </div>
              {isAuth && (
                <div className="mb-4">
                  {!showAnalysis ? (
                    <button
                      onClick={handleAnalyze}
                      className="rounded-md bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      AI解析
                    </button>
                  ) : analysisLoading ? (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                      <p className="text-sm text-indigo-600">正在生成AI解析...</p>
                    </div>
                  ) : analysis ? (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                      <h4 className="mb-2 text-sm font-bold text-indigo-800">AI 详细解析</h4>
                      <div className="mb-3 text-sm text-gray-700">
                        {analysis.analysis.split('\n').map((line, i) => (
                          <p key={i} className={line.startsWith('【') ? 'mt-2 font-medium text-indigo-700' : ''}>{line}</p>
                        ))}
                      </div>
                      {analysis.wrongOptionsAnalysis && analysis.wrongOptionsAnalysis.length > 0 && (
                        <div className="mb-3">
                          <h5 className="mb-1 text-xs font-semibold text-gray-600">其他选项分析：</h5>
                          <ul className="space-y-1">
                            {analysis.wrongOptionsAnalysis.map((item, i) => (
                              <li key={i} className="text-xs text-gray-600">
                                <span className="font-medium">{item.option}.</span> {item.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mb-2">
                        <h5 className="mb-1 text-xs font-semibold text-gray-600">相关知识点：</h5>
                        <div className="flex flex-wrap gap-1">
                          {analysis.knowledgePoints.map((kp, i) => (
                            <span key={i} className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{kp}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="mb-1 text-xs font-semibold text-gray-600">例句：</h5>
                        <ul className="space-y-1">
                          {analysis.exampleSentences.map((ex, i) => (
                            <li key={i} className="text-xs italic text-gray-600">{ex}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={goNext}
                  className="rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  {idx + 1 >= queue.length ? '查看结果' : '下一题'}
                </button>
                {answerState === 'correct' && (
                  <button
                    onClick={handleRemove}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    已掌握，移出错题本
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WrongPracticePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    }>
      <WrongPracticeContent />
    </Suspense>
  );
}
